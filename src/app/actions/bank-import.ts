"use server";
import { revalidatePath } from "next/cache";
import { DEMO_COMPANY_ID, actionClient } from "@/lib/supabase";
import { parseBankCsv, type BankCsvRow } from "@/lib/bank-csv-parser";

export type { BankCsvRow };

export async function importBankCsv(formData: FormData): Promise<{ imported: number; skipped: number }> {
  const file = formData.get("file") as File | null;
  if (!file) throw new Error("ファイルが指定されていません");

  if (!file.name.toLowerCase().endsWith(".csv")) {
    throw new Error("CSVファイルを選択してください");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("ファイルサイズは2MB以内にしてください");
  }

  const text = await file.text();
  const rows = parseBankCsv(text);
  if (rows.length === 0) throw new Error("CSVから取引データを読み取れませんでした");

  const sb = await actionClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) throw new Error("Not authenticated");

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const { error } = await sb.from("bank_transactions").upsert(
      {
        company_id: DEMO_COMPANY_ID,
        external_id: row.external_id,
        txn_date: row.txn_date,
        description: row.description,
        amount_jpy: row.amount_jpy,
        balance_jpy: row.balance_jpy,
        match_status: "pending",
        imported_at: new Date().toISOString(),
      },
      { onConflict: "company_id,external_id", ignoreDuplicates: true },
    );
    if (error) {
      skipped++;
    } else {
      imported++;
    }
  }

  revalidatePath("/bank");
  return { imported, skipped };
}
