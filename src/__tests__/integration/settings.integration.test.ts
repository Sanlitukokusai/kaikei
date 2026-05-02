/** @jest-environment node */
// Integration tests for Settings (Company) Server Action.

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));
jest.mock("server-only", () => ({}));
jest.mock("@/lib/supabase", () => ({
  DEMO_COMPANY_ID: "comp-1",
  actionClient: jest.fn(),
  serverClient: jest.fn(),
}));

import { revalidatePath } from "next/cache";
import { actionClient } from "@/lib/supabase";
import { updateCompany } from "@/app/actions/settings";
import type { UpdateCompanyInput } from "@/app/actions/settings";

const VALID_INPUT: UpdateCompanyInput = {
  name: "株式会社テスト",
  name_kana: "カブシキガイシャテスト",
  legal_form: "kk",
  invoice_reg_no: "T1234567890123",
  corporate_number: "1234567890123",
  postal_code: "100-0001",
  address: "東京都千代田区1-1",
  phone: "03-1234-5678",
  email: "info@test.co.jp",
  representative: "山田太郎",
  tax_method: "general",
  fiscal_year_start_month: 4,
};

function setupChain(resolveValue = { data: null, error: null }) {
  const chain: Record<string, jest.Mock> = {};
  chain.update = jest.fn().mockReturnValue(chain);
  chain.eq     = jest.fn().mockResolvedValue(resolveValue);
  (actionClient as jest.Mock).mockResolvedValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-abc" } } }) },
    from: jest.fn().mockReturnValue(chain),
  });
  return chain;
}

beforeEach(() => jest.clearAllMocks());

describe("updateCompany", () => {
  test("updates company with correct id (DEMO_COMPANY_ID)", async () => {
    const chain = setupChain();
    await updateCompany(VALID_INPUT);
    expect(chain.eq).toHaveBeenCalledWith("id", "comp-1");
  });

  test("passes all fields to update", async () => {
    const chain = setupChain();
    await updateCompany(VALID_INPUT);
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "株式会社テスト",
        legal_form: "kk",
        tax_method: "general",
        fiscal_year_start_month: 4,
        representative: "山田太郎",
      }),
    );
  });

  test("converts empty string fields to null", async () => {
    const chain = setupChain();
    await updateCompany({ ...VALID_INPUT, phone: "", email: "", address: "" });
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ phone: null, email: null, address: null }),
    );
  });

  test("defaults fiscal_year_start_month to 4 when undefined", async () => {
    const chain = setupChain();
    const { fiscal_year_start_month: _, ...rest } = VALID_INPUT;
    await updateCompany(rest);
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ fiscal_year_start_month: 4 }),
    );
  });

  test("revalidates /settings", async () => {
    setupChain();
    await updateCompany(VALID_INPUT);
    expect(revalidatePath).toHaveBeenCalledWith("/settings");
  });

  test("does not redirect after update", async () => {
    setupChain();
    await updateCompany(VALID_INPUT);
    const { redirect } = await import("next/navigation");
    expect(redirect).not.toHaveBeenCalled();
  });

  test("throws when not authenticated", async () => {
    (actionClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
      from: jest.fn(),
    });
    await expect(updateCompany(VALID_INPUT)).rejects.toThrow("Not authenticated");
  });

  test("throws on DB error", async () => {
    const chain: Record<string, jest.Mock> = {};
    chain.update = jest.fn().mockReturnValue(chain);
    chain.eq     = jest.fn().mockResolvedValue({ data: null, error: { message: "RLS policy violation" } });
    (actionClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
      from: jest.fn().mockReturnValue(chain),
    });
    await expect(updateCompany(VALID_INPUT)).rejects.toThrow("RLS policy violation");
  });

  test("accepts all valid legal_form values", async () => {
    const forms = ["llc", "kk", "sole", "other"] as const;
    for (const legal_form of forms) {
      const chain = setupChain();
      await updateCompany({ ...VALID_INPUT, legal_form });
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ legal_form }),
      );
      jest.clearAllMocks();
    }
  });

  test("tax_method null is passed through", async () => {
    const chain = setupChain();
    await updateCompany({ ...VALID_INPUT, tax_method: null });
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ tax_method: null }),
    );
  });
});
