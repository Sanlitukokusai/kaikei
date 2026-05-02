import { buildFinancialSummary } from "@/lib/queries";
import type { TrialBalanceLine } from "@/lib/queries";

function line(
  code: string,
  category: TrialBalanceLine["category"],
  subcategory: string | null,
  balance: number,
): TrialBalanceLine {
  return {
    account_id: code,
    code,
    name: code,
    category,
    subcategory,
    debit: category === "asset" || category === "expense" ? balance : 0,
    credit: category === "asset" || category === "expense" ? 0 : balance,
    balance,
  };
}

describe("buildFinancialSummary", () => {
  const tb: TrialBalanceLine[] = [
    line("4000", "revenue", null, 1_000_000),
    line("7100", "revenue", "non_operating", 10_000),
    line("5000", "expense", "cogs", 400_000),
    line("6000", "expense", null, 300_000),
    line("8100", "expense", "non_operating", 5_000),
    line("1000", "asset", null, 500_000),
    line("2000", "liability", null, 200_000),
    line("3000", "equity", null, 300_000),
  ];

  const fs = buildFinancialSummary(tb);

  test("totalRevenue excludes non-operating income", () => {
    expect(fs.totalRevenue).toBe(1_000_000);
  });

  test("totalCogs", () => {
    expect(fs.totalCogs).toBe(400_000);
  });

  test("grossProfit = revenue - cogs", () => {
    expect(fs.grossProfit).toBe(600_000);
  });

  test("totalSga excludes cogs and non-op expense", () => {
    expect(fs.totalSga).toBe(300_000);
  });

  test("operatingProfit = grossProfit - sga", () => {
    expect(fs.operatingProfit).toBe(300_000);
  });

  test("totalNonOpIncome", () => {
    expect(fs.totalNonOpIncome).toBe(10_000);
  });

  test("totalNonOpExpense", () => {
    expect(fs.totalNonOpExpense).toBe(5_000);
  });

  test("ordinaryProfit = operatingProfit + nonOpIncome - nonOpExpense", () => {
    expect(fs.ordinaryProfit).toBe(305_000);
  });

  test("netIncome equals ordinaryProfit (no tax in demo)", () => {
    expect(fs.netIncome).toBe(fs.ordinaryProfit);
  });

  test("totalAssets", () => {
    expect(fs.totalAssets).toBe(500_000);
  });

  test("totalLiabilities", () => {
    expect(fs.totalLiabilities).toBe(200_000);
  });

  test("totalEquity includes netIncome", () => {
    expect(fs.totalEquity).toBe(300_000 + 305_000);
  });

  test("empty trial balance yields all zeros", () => {
    const empty = buildFinancialSummary([]);
    expect(empty.totalRevenue).toBe(0);
    expect(empty.netIncome).toBe(0);
    expect(empty.totalAssets).toBe(0);
  });
});
