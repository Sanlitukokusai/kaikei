import { parseBankCsv } from "@/lib/bank-csv-parser";

const MUFG_CSV = `日付,摘要,お引出し,お預入れ,残高
2024/01/15,テスト商店 カード決済,,50000,1200000
2024/01/16,振込 サンプル株式会社 ご入金,0,100000,1300000
2024/01/17,ATM 出金,20000,,1280000
`;

describe("parseBankCsv", () => {
  test("parses MUFG-style CSV", () => {
    const rows = parseBankCsv(MUFG_CSV);
    expect(rows).toHaveLength(3);
  });

  test("maps incoming deposits as positive amounts", () => {
    const rows = parseBankCsv(MUFG_CSV);
    expect(rows[0].amount_jpy).toBe(50000); // credit
    expect(rows[1].amount_jpy).toBe(100000); // credit
  });

  test("maps withdrawals as negative amounts", () => {
    const rows = parseBankCsv(MUFG_CSV);
    expect(rows[2].amount_jpy).toBe(-20000); // debit
  });

  test("parses dates to ISO format", () => {
    const rows = parseBankCsv(MUFG_CSV);
    expect(rows[0].txn_date).toBe("2024-01-15");
  });

  test("sets description from summary column", () => {
    const rows = parseBankCsv(MUFG_CSV);
    expect(rows[0].description).toBe("テスト商店 カード決済");
  });

  test("parses balance when available", () => {
    const rows = parseBankCsv(MUFG_CSV);
    expect(rows[0].balance_jpy).toBe(1200000);
  });

  test("returns empty array for CSV with only header", () => {
    const csv = "日付,摘要,お引出し,お預入れ,残高\n";
    expect(parseBankCsv(csv)).toHaveLength(0);
  });

  test("returns empty array for empty string", () => {
    expect(parseBankCsv("")).toHaveLength(0);
  });

  test("skips rows with unparseable dates", () => {
    const csv = `日付,摘要,お引出し,お預入れ,残高
invalid,テスト,0,1000,1000
2024/01/15,正常な行,0,5000,6000
`;
    const rows = parseBankCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].txn_date).toBe("2024-01-15");
  });

  test("handles compact date format YYYYMMDD", () => {
    const csv = `日付,摘要,お引出し,お預入れ,残高
20240115,テスト入金,0,50000,100000
`;
    const rows = parseBankCsv(csv);
    expect(rows[0].txn_date).toBe("2024-01-15");
  });

  test("handles dash-separated dates", () => {
    const csv = `日付,摘要,お引出し,お預入れ,残高
2024-01-15,テスト入金,0,50000,100000
`;
    const rows = parseBankCsv(csv);
    expect(rows[0].txn_date).toBe("2024-01-15");
  });

  test("handles quoted values with commas", () => {
    const csv = `日付,摘要,お引出し,お預入れ,残高
2024/01/15,"テスト, カンマ入り",0,50000,100000
`;
    const rows = parseBankCsv(csv);
    expect(rows[0].description).toBe("テスト, カンマ入り");
  });

  test("handles alternative column names (取引日/入金/出金)", () => {
    const csv = `取引日,内容,出金,入金,残高
2024/02/01,サービス料金,15000,0,50000
`;
    const rows = parseBankCsv(csv);
    expect(rows[0].amount_jpy).toBe(-15000);
    expect(rows[0].txn_date).toBe("2024-02-01");
  });

  test("generates unique external_ids", () => {
    const rows = parseBankCsv(MUFG_CSV);
    const ids = rows.map((r) => r.external_id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  test("sets balance to null when no balance column", () => {
    const csv = `日付,摘要,お引出し,お預入れ
2024/01/15,テスト,0,50000
`;
    const rows = parseBankCsv(csv);
    expect(rows[0].balance_jpy).toBeNull();
  });

  test("amounts with commas are parsed correctly", () => {
    const csv = `日付,摘要,お引出し,お預入れ,残高
2024/01/15,大口入金,0,"1,500,000","5,000,000"
`;
    const rows = parseBankCsv(csv);
    expect(rows[0].amount_jpy).toBe(1500000);
    expect(rows[0].balance_jpy).toBe(5000000);
  });
});
