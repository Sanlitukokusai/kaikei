// Pure validators for journal entries — extracted from the server action
// so they can be unit-tested and reused without the "use server" constraint
// (which forbids non-async exports).

export type JournalLineInput = {
  side: "debit" | "credit";
  account_id: string;
  partner_id?: string | null;
  amount_jpy: number;
  tax_category?: string | null;
  memo?: string | null;
};

/** Throws if debit total ≠ credit total, or if total is 0. */
export function ensureBalanced(lines: JournalLineInput[]) {
  const dr = lines.filter((l) => l.side === "debit").reduce((s, l) => s + (l.amount_jpy ?? 0), 0);
  const cr = lines.filter((l) => l.side === "credit").reduce((s, l) => s + (l.amount_jpy ?? 0), 0);
  if (dr !== cr) {
    throw new Error(`借方 ¥${dr.toLocaleString()} / 貸方 ¥${cr.toLocaleString()} が一致しません`);
  }
  if (dr === 0) throw new Error("金額が 0 円の仕訳は登録できません");
}
