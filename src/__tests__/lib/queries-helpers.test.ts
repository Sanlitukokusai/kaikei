import { buildFinancialSummary, type TrialBalanceLine } from "@/lib/queries";

function makeLine(
  opts: Partial<TrialBalanceLine> & { account_id: string; code: string; name: string; category: TrialBalanceLine["category"] }
): TrialBalanceLine {
  return {
    subcategory: null,
    debit: 0,
    credit: 0,
    balance: 0,
    ...opts,
  };
}

describe("buildFinancialSummary", () => {
  const tb: TrialBalanceLine[] = [
    makeLine({ account_id: "r1", code: "4000", name: "売上高", category: "revenue", debit: 0, credit: 1000000, balance: 1000000 }),
    makeLine({ account_id: "e1", code: "6000", name: "給料手当", category: "expense", debit: 300000, credit: 0, balance: 300000 }),
    makeLine({ account_id: "e2", code: "6100", name: "地代家賃", category: "expense", debit: 100000, credit: 0, balance: 100000 }),
    makeLine({ account_id: "a1", code: "1000", name: "現金", category: "asset", debit: 600000, credit: 0, balance: 600000 }),
    makeLine({ account_id: "l1", code: "2000", name: "買掛金", category: "liability", debit: 0, credit: 200000, balance: 200000 }),
    makeLine({ account_id: "q1", code: "3000", name: "資本金", category: "equity", debit: 0, credit: 400000, balance: 400000 }),
  ];

  const fs = buildFinancialSummary(tb);

  test("totalRevenue sums revenue accounts", () => {
    expect(fs.totalRevenue).toBe(1000000);
  });

  test("totalSga sums SG&A expenses", () => {
    expect(fs.totalSga).toBe(400000);
  });

  test("grossProfit = revenue - cogs", () => {
    expect(fs.grossProfit).toBe(1000000); // no COGS in this dataset
  });

  test("operatingProfit = grossProfit - SGA", () => {
    expect(fs.operatingProfit).toBe(600000);
  });

  test("netIncome equals ordinaryProfit (no non-op items)", () => {
    expect(fs.netIncome).toBe(fs.ordinaryProfit);
  });

  test("totalAssets sums asset accounts", () => {
    expect(fs.totalAssets).toBe(600000);
  });

  test("totalLiabilities sums liability accounts", () => {
    expect(fs.totalLiabilities).toBe(200000);
  });

  test("equity includes netIncome", () => {
    expect(fs.totalEquity).toBe(400000 + 600000); // equity + netIncome
  });

  test("returns correct account lists", () => {
    expect(fs.revenue).toHaveLength(1);
    expect(fs.sga).toHaveLength(2);
    expect(fs.cogs).toHaveLength(0);
    expect(fs.assets).toHaveLength(1);
    expect(fs.liabilities).toHaveLength(1);
    expect(fs.equity).toHaveLength(1);
  });

  test("handles empty trial balance", () => {
    const empty = buildFinancialSummary([]);
    expect(empty.totalRevenue).toBe(0);
    expect(empty.netIncome).toBe(0);
    expect(empty.totalAssets).toBe(0);
  });

  test("COGS identified by code starting with 5", () => {
    const withCogs: TrialBalanceLine[] = [
      ...tb,
      makeLine({ account_id: "c1", code: "5000", name: "仕入", category: "expense", debit: 200000, credit: 0, balance: 200000 }),
    ];
    const fs2 = buildFinancialSummary(withCogs);
    expect(fs2.totalCogs).toBe(200000);
    expect(fs2.grossProfit).toBe(800000);
  });

  test("non-operating expense identified by code starting with 8", () => {
    const withNonOp: TrialBalanceLine[] = [
      ...tb,
      makeLine({ account_id: "n1", code: "8000", name: "支払利息", category: "expense", debit: 10000, credit: 0, balance: 10000 }),
    ];
    const fs3 = buildFinancialSummary(withNonOp);
    expect(fs3.totalNonOpExpense).toBe(10000);
    expect(fs3.ordinaryProfit).toBe(fs3.operatingProfit - 10000);
  });
});
