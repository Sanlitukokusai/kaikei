/** @jest-environment node */
// Integration tests for Bank Server Actions.

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
import { updateBankSuggestion, rejectBankMatch, approveBankMatch } from "@/app/actions/bank";

beforeEach(() => jest.clearAllMocks());

// ── updateBankSuggestion ──────────────────────────────────────────────────

describe("updateBankSuggestion", () => {
  function setup() {
    const chain: Record<string, jest.Mock> = {};
    chain.update = jest.fn().mockReturnValue(chain);
    chain.eq     = jest.fn().mockResolvedValue({ data: null, error: null });
    (actionClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-abc" } } }) },
      from: jest.fn().mockReturnValue(chain),
    });
    return chain;
  }

  test("updates suggested_account_id and suggested_memo", async () => {
    const chain = setup();
    await updateBankSuggestion("txn-1", "acc-cash", "家賃支払い");
    expect(chain.update).toHaveBeenCalledWith({
      suggested_account_id: "acc-cash",
      suggested_memo: "家賃支払い",
    });
    expect(chain.eq).toHaveBeenCalledWith("id", "txn-1");
  });

  test("converts null memo to null (not empty string)", async () => {
    const chain = setup();
    await updateBankSuggestion("txn-1", "acc-1", null);
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ suggested_memo: null }),
    );
  });

  test("revalidates /bank", async () => {
    setup();
    await updateBankSuggestion("txn-1", "acc-1", "test");
    expect(revalidatePath).toHaveBeenCalledWith("/bank");
  });

  test("throws when not authenticated", async () => {
    (actionClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
      from: jest.fn(),
    });
    await expect(updateBankSuggestion("txn-1", "acc-1", null)).rejects.toThrow("Not authenticated");
  });

  test("throws on DB error", async () => {
    const chain: Record<string, jest.Mock> = {};
    chain.update = jest.fn().mockReturnValue(chain);
    chain.eq     = jest.fn().mockResolvedValue({ data: null, error: { message: "txn not found" } });
    (actionClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
      from: jest.fn().mockReturnValue(chain),
    });
    await expect(updateBankSuggestion("bad-id", "acc-1", null)).rejects.toThrow("txn not found");
  });
});

// ── rejectBankMatch ────────────────────────────────────────────────────────

describe("rejectBankMatch", () => {
  function setup() {
    const chain: Record<string, jest.Mock> = {};
    chain.update = jest.fn().mockReturnValue(chain);
    chain.eq     = jest.fn().mockResolvedValue({ data: null, error: null });
    (actionClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-abc" } } }) },
      from: jest.fn().mockReturnValue(chain),
    });
    return chain;
  }

  test("sets match_status to rejected", async () => {
    const chain = setup();
    await rejectBankMatch("txn-2");
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ match_status: "rejected" }),
    );
  });

  test("includes matched_at and matched_by in update", async () => {
    const chain = setup();
    await rejectBankMatch("txn-2");
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ matched_by: "user-abc" }),
    );
  });

  test("revalidates /bank", async () => {
    setup();
    await rejectBankMatch("txn-2");
    expect(revalidatePath).toHaveBeenCalledWith("/bank");
  });

  test("throws when not authenticated", async () => {
    (actionClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
      from: jest.fn(),
    });
    await expect(rejectBankMatch("txn-1")).rejects.toThrow("Not authenticated");
  });
});

// ── approveBankMatch ───────────────────────────────────────────────────────

describe("approveBankMatch", () => {
  const MOCK_TXN = {
    id: "txn-3",
    txn_date: "2024-03-01",
    amount_jpy: 50000,
    description: "売上入金",
    match_status: "pending",
    suggested_account_id: "acc-revenue",
    suggested_partner_id: "partner-1",
    suggested_memo: "3月売上",
    external_id: "EXT001",
  };

  function setupApprove(txnOverride = {}) {
    const mockTxn = { ...MOCK_TXN, ...txnOverride };

    // Track from() calls to return different chains per table
    const txnSelectChain: Record<string, jest.Mock> = {};
    txnSelectChain.select = jest.fn().mockReturnValue(txnSelectChain);
    txnSelectChain.eq     = jest.fn().mockReturnValue(txnSelectChain);
    txnSelectChain.single = jest.fn().mockResolvedValue({ data: mockTxn, error: null });

    const cashAccChain: Record<string, jest.Mock> = {};
    cashAccChain.select = jest.fn().mockReturnValue(cashAccChain);
    cashAccChain.eq     = jest.fn().mockReturnValue(cashAccChain);
    cashAccChain.single = jest.fn().mockResolvedValue({ data: { id: "acc-bank" }, error: null });

    const journalChain: Record<string, jest.Mock> = {};
    journalChain.insert = jest.fn().mockReturnValue(journalChain);
    journalChain.select = jest.fn().mockReturnValue(journalChain);
    journalChain.single = jest.fn().mockResolvedValue({ data: { id: "entry-new" }, error: null });

    const linesChain: Record<string, jest.Mock> = {};
    linesChain.insert = jest.fn().mockResolvedValue({ data: null, error: null });

    const txnUpdateChain: Record<string, jest.Mock> = {};
    txnUpdateChain.update = jest.fn().mockReturnValue(txnUpdateChain);
    txnUpdateChain.eq     = jest.fn().mockResolvedValue({ data: null, error: null });

    const callTracker: Record<string, number> = {};

    (actionClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-abc" } } }) },
      from: jest.fn().mockImplementation((table: string) => {
        callTracker[table] = (callTracker[table] ?? 0) + 1;
        if (table === "bank_transactions" && callTracker[table] === 1) return txnSelectChain;
        if (table === "accounts") return cashAccChain;
        if (table === "journal_entries") return journalChain;
        if (table === "journal_lines") return linesChain;
        // second bank_transactions call = update
        return txnUpdateChain;
      }),
    });

    return { journalChain, linesChain, txnUpdateChain };
  }

  test("throws when transaction is not pending", async () => {
    setupApprove({ match_status: "matched" });
    await expect(approveBankMatch("txn-3")).rejects.toThrow(/既に処理済み/);
  });

  test("throws when no suggested_account_id", async () => {
    setupApprove({ suggested_account_id: null });
    await expect(approveBankMatch("txn-3")).rejects.toThrow(/勘定科目/);
  });

  test("creates journal entry with source_type=bank_import", async () => {
    const { journalChain } = setupApprove();
    await approveBankMatch("txn-3");
    expect(journalChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        source_type: "bank_import",
        status: "confirmed",
        entry_date: "2024-03-01",
      }),
    );
  });

  test("incoming amount: bank account is debit, suggested is credit", async () => {
    const { linesChain } = setupApprove({ amount_jpy: 50000 }); // positive = incoming
    await approveBankMatch("txn-3");
    const lines = linesChain.insert.mock.calls[0][0];
    const debitLine  = lines.find((l: { side: string }) => l.side === "debit");
    const creditLine = lines.find((l: { side: string }) => l.side === "credit");
    expect(debitLine.account_id).toBe("acc-bank");      // 普通預金
    expect(creditLine.account_id).toBe("acc-revenue");  // suggested
  });

  test("outgoing amount: suggested is debit, bank account is credit", async () => {
    const { linesChain } = setupApprove({ amount_jpy: -30000 }); // negative = outgoing
    await approveBankMatch("txn-3");
    const lines = linesChain.insert.mock.calls[0][0];
    const debitLine  = lines.find((l: { side: string }) => l.side === "debit");
    const creditLine = lines.find((l: { side: string }) => l.side === "credit");
    expect(debitLine.account_id).toBe("acc-revenue");  // suggested
    expect(creditLine.account_id).toBe("acc-bank");    // 普通預金
  });

  test("marks transaction as matched with journal_id", async () => {
    const { txnUpdateChain } = setupApprove();
    await approveBankMatch("txn-3");
    expect(txnUpdateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ match_status: "matched", journal_id: "entry-new" }),
    );
  });

  test("revalidates /bank, /journal, and /", async () => {
    setupApprove();
    await approveBankMatch("txn-3");
    expect(revalidatePath).toHaveBeenCalledWith("/bank");
    expect(revalidatePath).toHaveBeenCalledWith("/journal");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  test("throws when not authenticated", async () => {
    (actionClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
      from: jest.fn(),
    });
    await expect(approveBankMatch("txn-3")).rejects.toThrow("Not authenticated");
  });
});
