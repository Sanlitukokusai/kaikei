/**
 * Integration tests for lib/queries pure computation functions.
 * buildFinancialSummary + getTrialBalance aggregation logic tested
 * with simulated Supabase response shapes.
 */

jest.mock("server-only", () => ({}));

import { buildFinancialSummary } from "@/lib/queries";
import type { TrialBalanceLine } from "@/lib/queries";

// Simulate what PostgREST returns for a journal_entries + nested lines query
function makeEntry(lines: Array<{ side: "debit" | "credit"; amount_jpy: number; account: { id: string; code: string; name: string; category: "asset" | "liability" | "equity" | "revenue" | "expense"; subcategory: string | null } }>) {
  return { id: `e-${Math.random()}`, lines };
}

function buildTB(entries: ReturnType<typeof makeEntry>[]): TrialBalanceLine[] {
  // Reproduce the aggregation logic from getTrialBalance (tested in isolation here)
  const map = new Map<string, TrialBalanceLine>();
  for (const entry of entries) {
    for (const line of entry.lines) {
      if (!line.account) continue;
      const a = line.account;
      const cur = map.get(a.id) ?? {
        account_id: a.id, code: a.code, name: a.name,
        category: a.category, subcategory: a.subcategory,
        debit: 0, credit: 0, balance: 0,
      };
      if (line.side === "debit") cur.debit += line.amount_jpy;
      else cur.credit += line.amount_jpy;
      map.set(a.id, cur);
    }
  }
  for (const row of map.values()) {
    const normalDebit = row.category === "asset" || row.category === "expense";
    row.balance = normalDebit ? row.debit - row.credit : row.credit - row.debit;
  }
  return [...map.values()];
}

describe("Trial balance aggregation", () => {
  test("aggregates multiple entries for same account", () => {
    const acct = { id: "a1", code: "4000", name: "売上", category: "revenue" as const, subcategory: null };
    const entries = [
      makeEntry([{ side: "credit", amount_jpy: 100_000, account: acct }]),
      makeEntry([{ side: "credit", amount_jpy: 200_000, account: acct }]),
    ];
    const tb = buildTB(entries);
    expect(tb).toHaveLength(1);
    expect(tb[0].credit).toBe(300_000);
    expect(tb[0].balance).toBe(300_000);
  });

  test("normal-side balance: asset = debit − credit", () => {
    const acct = { id: "a2", code: "1000", name: "現金", category: "asset" as const, subcategory: null };
    const entries = [
      makeEntry([{ side: "debit",  amount_jpy: 500_000, account: acct }]),
      makeEntry([{ side: "credit", amount_jpy: 100_000, account: acct }]),
    ];
    const tb = buildTB(entries);
    expect(tb[0].balance).toBe(400_000);
  });

  test("normal-side balance: liability = credit − debit", () => {
    const acct = { id: "a3", code: "2000", name: "買掛金", category: "liability" as const, subcategory: null };
    const entries = [
      makeEntry([{ side: "credit", amount_jpy: 300_000, account: acct }]),
      makeEntry([{ side: "debit",  amount_jpy: 50_000,  account: acct }]),
    ];
    const tb = buildTB(entries);
    expect(tb[0].balance).toBe(250_000);
  });

  test("skips lines with null account", () => {
    const entries = [{ id: "e1", lines: [{ side: "debit" as const, amount_jpy: 100, account: null as never }] }];
    const tb = buildTB(entries);
    expect(tb).toHaveLength(0);
  });
});

describe("buildFinancialSummary: COGS heuristic by account code prefix", () => {
  test("code starting with 5 goes to COGS even without subcategory", () => {
    const tb: TrialBalanceLine[] = [
      { account_id: "1", code: "5000", name: "仕入", category: "expense", subcategory: null, debit: 200_000, credit: 0, balance: 200_000 },
      { account_id: "2", code: "4000", name: "売上", category: "revenue", subcategory: null, debit: 0, credit: 500_000, balance: 500_000 },
    ];
    const fs = buildFinancialSummary(tb);
    expect(fs.cogs).toHaveLength(1);
    expect(fs.totalCogs).toBe(200_000);
    expect(fs.sga).toHaveLength(0);
  });

  test("code starting with 8 goes to non-operating expense", () => {
    const tb: TrialBalanceLine[] = [
      { account_id: "1", code: "8100", name: "支払利息", category: "expense", subcategory: null, debit: 5_000, credit: 0, balance: 5_000 },
      { account_id: "2", code: "4000", name: "売上", category: "revenue", subcategory: null, debit: 0, credit: 100_000, balance: 100_000 },
    ];
    const fs = buildFinancialSummary(tb);
    expect(fs.nonOpExpense).toHaveLength(1);
    expect(fs.totalNonOpExpense).toBe(5_000);
  });

  test("subcategory=non_operating on revenue goes to nonOpIncome", () => {
    const tb: TrialBalanceLine[] = [
      { account_id: "1", code: "4000", name: "売上", category: "revenue", subcategory: null, debit: 0, credit: 1_000_000, balance: 1_000_000 },
      { account_id: "2", code: "7100", name: "受取利息", category: "revenue", subcategory: "non_operating", debit: 0, credit: 10_000, balance: 10_000 },
    ];
    const fs = buildFinancialSummary(tb);
    expect(fs.totalRevenue).toBe(1_000_000);
    expect(fs.totalNonOpIncome).toBe(10_000);
  });
});

describe("buildFinancialSummary: P/L chain integrity", () => {
  const base: TrialBalanceLine[] = [
    { account_id: "r1", code: "4000", name: "売上", category: "revenue", subcategory: null, debit: 0, credit: 0, balance: 1_200_000 },
    { account_id: "c1", code: "5000", name: "仕入", category: "expense", subcategory: "cogs", debit: 0, credit: 0, balance: 500_000 },
    { account_id: "s1", code: "6000", name: "給料", category: "expense", subcategory: null, debit: 0, credit: 0, balance: 400_000 },
    { account_id: "n1", code: "8100", name: "支払利息", category: "expense", subcategory: "non_operating", debit: 0, credit: 0, balance: 20_000 },
    { account_id: "i1", code: "7100", name: "受取利息", category: "revenue", subcategory: "non_operating", debit: 0, credit: 0, balance: 5_000 },
  ];

  const fs = buildFinancialSummary(base);

  test("grossProfit = revenue - cogs", () => {
    expect(fs.grossProfit).toBe(1_200_000 - 500_000);
  });

  test("operatingProfit = grossProfit - sga", () => {
    expect(fs.operatingProfit).toBe(700_000 - 400_000);
  });

  test("ordinaryProfit = operatingProfit + nonOpIncome - nonOpExpense", () => {
    expect(fs.ordinaryProfit).toBe(300_000 + 5_000 - 20_000);
  });

  test("totalEquity includes current period netIncome", () => {
    const equity: TrialBalanceLine[] = [
      ...base,
      { account_id: "e1", code: "3000", name: "資本金", category: "equity", subcategory: null, debit: 0, credit: 0, balance: 1_000_000 },
    ];
    const fs2 = buildFinancialSummary(equity);
    expect(fs2.totalEquity).toBe(1_000_000 + fs2.netIncome);
  });
});
