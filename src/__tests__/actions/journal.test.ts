import { ensureBalanced, type JournalLineInput } from "@/lib/journal-validation";

function dr(account_id: string, amount_jpy: number): JournalLineInput {
  return { side: "debit", account_id, amount_jpy };
}
function cr(account_id: string, amount_jpy: number): JournalLineInput {
  return { side: "credit", account_id, amount_jpy };
}

describe("ensureBalanced", () => {
  test("balanced lines do not throw", () => {
    expect(() => ensureBalanced([dr("1000", 10000), cr("2000", 10000)])).not.toThrow();
  });

  test("throws when debit != credit", () => {
    expect(() => ensureBalanced([dr("1000", 10000), cr("2000", 9000)])).toThrow(
      /借方.*貸方.*一致しません/,
    );
  });

  test("throws when total is zero", () => {
    expect(() => ensureBalanced([dr("1000", 0), cr("2000", 0)])).toThrow(
      /0 円/,
    );
  });

  test("multiple debit lines balanced against multiple credit lines", () => {
    const lines = [
      dr("1000", 5000),
      dr("1001", 5000),
      cr("2000", 8000),
      cr("2001", 2000),
    ];
    expect(() => ensureBalanced(lines)).not.toThrow();
  });

  test("unbalanced multi-line throws", () => {
    const lines = [dr("1000", 5000), dr("1001", 5000), cr("2000", 9000)];
    expect(() => ensureBalanced(lines)).toThrow(/一致しません/);
  });

  test("includes formatted amounts in error message", () => {
    expect(() => ensureBalanced([dr("1000", 100000), cr("2000", 50000)])).toThrow(
      /100,000/,
    );
  });
});
