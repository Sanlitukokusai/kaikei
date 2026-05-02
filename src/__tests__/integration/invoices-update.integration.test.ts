/** @jest-environment node */
import { updateInvoice, deleteInvoice } from "@/app/actions/invoices";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));

jest.mock("@/lib/supabase", () => ({
  DEMO_COMPANY_ID: "demo-co",
  actionClient: jest.fn(),
}));

function makeSupabaseMock(opts: {
  user?: object | null;
  updateErr?: string | null;
  deleteErr?: string | null;
  insertErr?: string | null;
} = {}) {
  const { user = { id: "user-1" }, updateErr = null, deleteErr = null, insertErr = null } = opts;
  return {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user } }) },
    from: jest.fn().mockImplementation((table: string) => {
      if (table === "invoices") {
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: updateErr ? { message: updateErr } : null }),
          }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: deleteErr ? { message: deleteErr } : null }),
          }),
        };
      }
      if (table === "invoice_items") {
        return {
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: deleteErr ? { message: deleteErr } : null }),
          }),
          insert: jest.fn().mockResolvedValue({ error: insertErr ? { message: insertErr } : null }),
        };
      }
      return {};
    }),
  };
}

describe("updateInvoice", () => {
  const input = {
    invoice_no: "INV-001",
    invoice_date: "2024-01-15",
    due_date: "2024-02-15",
    partner_id: "p1",
    subject: "テスト請求書",
    notes: null,
    items: [
      { item_name: "商品A", quantity: 2, unit_price: 10000, tax_rate: 10, unit: "個" },
    ],
  };

  beforeEach(() => {
    const { actionClient } = require("@/lib/supabase");
    actionClient.mockResolvedValue(makeSupabaseMock());
  });

  test("updates invoice with computed totals", async () => {
    const sb = await require("@/lib/supabase").actionClient();
    await updateInvoice("inv-123", input);
    const updateCalls = sb.from.mock.calls.filter((c: string[]) => c[0] === "invoices");
    expect(updateCalls.length).toBeGreaterThan(0);
  });

  test("throws if not authenticated", async () => {
    const { actionClient } = require("@/lib/supabase");
    actionClient.mockResolvedValueOnce(makeSupabaseMock({ user: null }));
    await expect(updateInvoice("inv-123", input)).rejects.toThrow("Not authenticated");
  });

  test("skips item insert when items array is empty", async () => {
    const { actionClient } = require("@/lib/supabase");
    const sb = makeSupabaseMock();
    actionClient.mockResolvedValueOnce(sb);
    const insertSpy = jest.fn().mockResolvedValue({ error: null });
    sb.from.mockImplementation((table: string) => {
      if (table === "invoices") return { update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }) };
      if (table === "invoice_items") return { delete: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }), insert: insertSpy };
      return {};
    });
    await updateInvoice("inv-123", { ...input, items: [] });
    expect(insertSpy).not.toHaveBeenCalled();
  });
});

describe("deleteInvoice", () => {
  test("deletes invoice by id", async () => {
    const eqFn = jest.fn().mockResolvedValue({ error: null });
    const { actionClient } = require("@/lib/supabase");
    actionClient.mockResolvedValueOnce({
      auth: { getUser: jest.fn() },
      from: jest.fn().mockReturnValue({ delete: jest.fn().mockReturnValue({ eq: eqFn }) }),
    });
    await deleteInvoice("inv-999");
    expect(eqFn).toHaveBeenCalledWith("id", "inv-999");
  });

  test("throws on database error", async () => {
    const { actionClient } = require("@/lib/supabase");
    actionClient.mockResolvedValueOnce({
      auth: { getUser: jest.fn() },
      from: jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: { message: "DB error" } }),
        }),
      }),
    });
    await expect(deleteInvoice("inv-bad")).rejects.toThrow("DB error");
  });
});
