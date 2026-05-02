/** @jest-environment node */
// Integration tests for Partners Server Actions.

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => { throw Object.assign(new Error("REDIRECT"), { url }); }),
}));
jest.mock("server-only", () => ({}));
jest.mock("@/lib/supabase", () => ({
  DEMO_COMPANY_ID: "comp-1",
  actionClient: jest.fn(),
  serverClient: jest.fn(),
}));

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { actionClient } from "@/lib/supabase";
import { createPartner, updatePartner, deletePartner } from "@/app/actions/partners";
import type { CreatePartnerInput } from "@/app/actions/partners";

const VALID_INPUT: CreatePartnerInput = {
  name: "株式会社テスト",
  name_kana: "カブシキガイシャテスト",
  kind: "corp",
  invoice_reg_no: "T1234567890123",
  phone: "03-1234-5678",
  email: "test@example.com",
  address: "東京都千代田区1-1",
};

function makeChain(resolveValue = { data: null, error: null }) {
  const chain: Record<string, jest.Mock> = {};
  chain.select  = jest.fn().mockReturnValue(chain);
  chain.insert  = jest.fn().mockResolvedValue(resolveValue);
  chain.update  = jest.fn().mockReturnValue(chain);
  chain.delete  = jest.fn().mockReturnValue(chain);
  chain.eq      = jest.fn().mockResolvedValue(resolveValue);
  chain.single  = jest.fn().mockResolvedValue(resolveValue);
  return chain;
}

function setupAuth(chain: Record<string, jest.Mock>) {
  (actionClient as jest.Mock).mockResolvedValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-abc" } } }) },
    from: jest.fn().mockReturnValue(chain),
  });
}

function setupNoAuth() {
  (actionClient as jest.Mock).mockResolvedValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    from: jest.fn(),
  });
}

beforeEach(() => jest.clearAllMocks());

// ── createPartner ────────────────────────────────────────────────────────

describe("createPartner", () => {
  test("redirects to /partners on success", async () => {
    setupAuth(makeChain());
    await expect(createPartner(VALID_INPUT)).rejects.toMatchObject({ url: "/partners" });
    expect(redirect).toHaveBeenCalledWith("/partners");
  });

  test("inserts partner with company_id and all fields", async () => {
    const chain = makeChain();
    setupAuth(chain);
    await expect(createPartner(VALID_INPUT)).rejects.toThrow("REDIRECT");
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        company_id: "comp-1",
        name: "株式会社テスト",
        kind: "corp",
        invoice_reg_no: "T1234567890123",
      }),
    );
  });

  test("converts empty strings to null", async () => {
    const chain = makeChain();
    setupAuth(chain);
    const input: CreatePartnerInput = { ...VALID_INPUT, phone: "", email: "" };
    await expect(createPartner(input)).rejects.toThrow("REDIRECT");
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ phone: null, email: null }),
    );
  });

  test("revalidates /partners path", async () => {
    setupAuth(makeChain());
    await expect(createPartner(VALID_INPUT)).rejects.toThrow("REDIRECT");
    expect(revalidatePath).toHaveBeenCalledWith("/partners");
  });

  test("throws when not authenticated", async () => {
    setupNoAuth();
    await expect(createPartner(VALID_INPUT)).rejects.toThrow("Not authenticated");
  });

  test("throws on DB error", async () => {
    const chain = makeChain({ data: null, error: { message: "duplicate name" } } as never);
    chain.insert = jest.fn().mockResolvedValue({ data: null, error: { message: "duplicate name" } });
    setupAuth(chain);
    await expect(createPartner(VALID_INPUT)).rejects.toThrow("duplicate name");
  });
});

// ── updatePartner ────────────────────────────────────────────────────────

describe("updatePartner", () => {
  test("redirects to /partners on success", async () => {
    const chain = makeChain();
    setupAuth(chain);
    await expect(updatePartner("partner-1", VALID_INPUT)).rejects.toMatchObject({ url: "/partners" });
  });

  test("calls update with correct fields", async () => {
    const chain = makeChain();
    setupAuth(chain);
    await expect(updatePartner("partner-1", VALID_INPUT)).rejects.toThrow("REDIRECT");
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ name: "株式会社テスト", kind: "corp" }),
    );
  });

  test("applies .eq filter with partner id", async () => {
    const chain = makeChain();
    setupAuth(chain);
    await expect(updatePartner("partner-xyz", VALID_INPUT)).rejects.toThrow("REDIRECT");
    expect(chain.eq).toHaveBeenCalledWith("id", "partner-xyz");
  });

  test("throws when not authenticated", async () => {
    setupNoAuth();
    await expect(updatePartner("p1", VALID_INPUT)).rejects.toThrow("Not authenticated");
  });
});

// ── deletePartner ────────────────────────────────────────────────────────

describe("deletePartner", () => {
  test("calls delete with correct id", async () => {
    const chain = makeChain();
    setupAuth(chain);
    await deletePartner("partner-del");
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith("id", "partner-del");
  });

  test("revalidates /partners without redirecting", async () => {
    setupAuth(makeChain());
    await deletePartner("partner-del");
    expect(revalidatePath).toHaveBeenCalledWith("/partners");
    expect(redirect).not.toHaveBeenCalled();
  });

  test("throws on DB error", async () => {
    const chain = makeChain();
    chain.eq = jest.fn().mockResolvedValue({ data: null, error: { message: "FK violation" } });
    setupAuth(chain);
    await expect(deletePartner("p1")).rejects.toThrow("FK violation");
  });
});
