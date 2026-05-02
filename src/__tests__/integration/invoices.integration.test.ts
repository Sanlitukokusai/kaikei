/** @jest-environment node */
// Integration tests for Invoice Server Actions.

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
import { actionClient } from "@/lib/supabase";
import {
  createInvoice,
  updateInvoiceStatus,
  deleteInvoice,
} from "@/app/actions/invoices";
import type { CreateInvoiceInput } from "@/app/actions/invoices";

const ITEMS = [
  { item_name: "コンサルティング", quantity: 2, unit_price: 50000, tax_rate: 10 },
  { item_name: "交通費", quantity: 1, unit_price: 3000, tax_rate: 10 },
];

const VALID_INPUT: CreateInvoiceInput = {
  invoice_no: "INV-2024-001",
  invoice_date: "2024-03-31",
  due_date: "2024-04-30",
  partner_id: "partner-1",
  subject: "3月分業務委託",
  notes: "お振込みをお願いします",
  items: ITEMS,
};

// ── Helpers ────────────────────────────────────────────────────────────────

function makeInvoiceChain(invId = "inv-001") {
  const itemsChain: Record<string, jest.Mock> = {};
  itemsChain.insert = jest.fn().mockResolvedValue({ data: null, error: null });

  const invoiceChain: Record<string, jest.Mock> = {};
  invoiceChain.insert = jest.fn().mockReturnValue(invoiceChain);
  invoiceChain.update = jest.fn().mockReturnValue(invoiceChain);
  invoiceChain.delete = jest.fn().mockReturnValue(invoiceChain);
  invoiceChain.select = jest.fn().mockReturnValue(invoiceChain);
  invoiceChain.eq     = jest.fn().mockResolvedValue({ data: null, error: null });
  invoiceChain.single = jest.fn().mockResolvedValue({ data: { id: invId }, error: null });

  (actionClient as jest.Mock).mockResolvedValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-abc" } } }) },
    from: jest.fn().mockImplementation((table: string) =>
      table === "invoices" ? invoiceChain : itemsChain,
    ),
  });
  return { invoiceChain, itemsChain };
}

beforeEach(() => jest.clearAllMocks());

// ── createInvoice ─────────────────────────────────────────────────────────

describe("createInvoice", () => {
  test("redirects to /invoices on success", async () => {
    makeInvoiceChain();
    await expect(createInvoice(VALID_INPUT)).rejects.toMatchObject({ url: "/invoices" });
  });

  test("inserts invoice with computed subtotal and tax", async () => {
    const { invoiceChain } = makeInvoiceChain();
    await expect(createInvoice(VALID_INPUT)).rejects.toThrow("REDIRECT");
    // subtotal = 2*50000 + 1*3000 = 103000; tax = 10000+300=10300; total = 113300
    expect(invoiceChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        subtotal: 103000,
        tax_total: 10300,
        total: 113300,
        status: "draft",
        payment_status: "unbilled",
      }),
    );
  });

  test("inserts invoice_items with line_no", async () => {
    const { itemsChain } = makeInvoiceChain();
    await expect(createInvoice(VALID_INPUT)).rejects.toThrow("REDIRECT");
    expect(itemsChain.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ line_no: 1, item_name: "コンサルティング", quantity: 2 }),
        expect.objectContaining({ line_no: 2, item_name: "交通費", quantity: 1 }),
      ]),
    );
  });

  test("does not insert items when items array is empty", async () => {
    const { itemsChain } = makeInvoiceChain();
    await expect(createInvoice({ ...VALID_INPUT, items: [] })).rejects.toThrow("REDIRECT");
    expect(itemsChain.insert).not.toHaveBeenCalled();
  });

  test("throws when not authenticated", async () => {
    (actionClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
      from: jest.fn(),
    });
    await expect(createInvoice(VALID_INPUT)).rejects.toThrow("Not authenticated");
  });

  test("revalidates /invoices", async () => {
    makeInvoiceChain();
    await expect(createInvoice(VALID_INPUT)).rejects.toThrow("REDIRECT");
    expect(revalidatePath).toHaveBeenCalledWith("/invoices");
  });

  test("zero-quantity items contribute zero to totals", async () => {
    const { invoiceChain } = makeInvoiceChain();
    const zeroItems: CreateInvoiceInput = {
      ...VALID_INPUT,
      items: [{ item_name: "無料", quantity: 0, unit_price: 1000, tax_rate: 10 }],
    };
    await expect(createInvoice(zeroItems)).rejects.toThrow("REDIRECT");
    expect(invoiceChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ subtotal: 0, tax_total: 0, total: 0 }),
    );
  });
});

// ── updateInvoiceStatus ───────────────────────────────────────────────────

describe("updateInvoiceStatus", () => {
  function setupSimple() {
    const chain: Record<string, jest.Mock> = {};
    chain.update = jest.fn().mockReturnValue(chain);
    chain.eq     = jest.fn().mockResolvedValue({ data: null, error: null });
    (actionClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn() },
      from: jest.fn().mockReturnValue(chain),
    });
    return chain;
  }

  test("updates status field on invoices table", async () => {
    const chain = setupSimple();
    await updateInvoiceStatus("inv-1", "paid");
    expect(chain.update).toHaveBeenCalledWith({ status: "paid" });
    expect(chain.eq).toHaveBeenCalledWith("id", "inv-1");
  });

  test("revalidates /invoices without redirecting", async () => {
    setupSimple();
    await updateInvoiceStatus("inv-1", "sent");
    expect(revalidatePath).toHaveBeenCalledWith("/invoices");
  });

  test("accepts all valid status values", async () => {
    const statuses = ["draft", "sent", "paid", "overdue", "cancelled"] as const;
    for (const status of statuses) {
      const chain = setupSimple();
      await updateInvoiceStatus("inv-1", status);
      expect(chain.update).toHaveBeenCalledWith({ status });
    }
  });

  test("throws on DB error", async () => {
    const chain: Record<string, jest.Mock> = {};
    chain.update = jest.fn().mockReturnValue(chain);
    chain.eq     = jest.fn().mockResolvedValue({ data: null, error: { message: "not found" } });
    (actionClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn() },
      from: jest.fn().mockReturnValue(chain),
    });
    await expect(updateInvoiceStatus("inv-x", "paid")).rejects.toThrow("not found");
  });
});

// ── deleteInvoice ─────────────────────────────────────────────────────────

describe("deleteInvoice", () => {
  function setupDelete() {
    const chain: Record<string, jest.Mock> = {};
    chain.delete = jest.fn().mockReturnValue(chain);
    chain.eq     = jest.fn().mockResolvedValue({ data: null, error: null });
    (actionClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn() },
      from: jest.fn().mockReturnValue(chain),
    });
    return chain;
  }

  test("calls delete and eq with invoice id", async () => {
    const chain = setupDelete();
    await deleteInvoice("inv-del");
    expect(chain.delete).toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith("id", "inv-del");
  });

  test("revalidates /invoices", async () => {
    setupDelete();
    await deleteInvoice("inv-del");
    expect(revalidatePath).toHaveBeenCalledWith("/invoices");
  });
});

// ── Invoice totals calculation ────────────────────────────────────────────
// Test the pure totals logic indirectly through createInvoice

describe("Invoice totals calculation", () => {
  test("tax is floored (not rounded)", async () => {
    const { invoiceChain } = makeInvoiceChain();
    // 1 * 999 * 10% = 99.9 → floor → 99
    await expect(
      createInvoice({ ...VALID_INPUT, items: [{ quantity: 1, unit_price: 999, tax_rate: 10 }] }),
    ).rejects.toThrow("REDIRECT");
    expect(invoiceChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ subtotal: 999, tax_total: 99, total: 1098 }),
    );
  });

  test("multiple items with different tax rates sum correctly", async () => {
    const { invoiceChain } = makeInvoiceChain();
    const items = [
      { quantity: 1, unit_price: 10000, tax_rate: 10 },  // tax 1000
      { quantity: 1, unit_price: 10000, tax_rate: 8 },   // tax 800
    ];
    await expect(
      createInvoice({ ...VALID_INPUT, items }),
    ).rejects.toThrow("REDIRECT");
    expect(invoiceChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ subtotal: 20000, tax_total: 1800, total: 21800 }),
    );
  });
});
