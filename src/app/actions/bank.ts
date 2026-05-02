"use server";
import { revalidatePath } from "next/cache";
import { DEMO_COMPANY_ID, actionClient } from "@/lib/supabase";

// Approve a suggested match: create a balanced journal entry and link it back.
// Assumes the demo bank account corresponds to "1130 普通預金" — for incoming
// the cash account is debit, for outgoing it's credit.
export async function approveBankMatch(txnId: string) {
  const sb = await actionClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) throw new Error("Not authenticated");

  const { data: txn, error: tErr } = await sb
    .from("bank_transactions")
    .select("*")
    .eq("id", txnId)
    .single();
  if (tErr || !txn) throw new Error(tErr?.message ?? "Transaction not found");
  if (txn.match_status !== "pending") throw new Error("既に処理済みの取引です");
  if (!txn.suggested_account_id) throw new Error("提案された勘定科目がありません");

  const { data: cashAcc, error: cErr } = await sb
    .from("accounts")
    .select("id")
    .eq("company_id", DEMO_COMPANY_ID)
    .eq("code", "1130")
    .single();
  if (cErr || !cashAcc) throw new Error("普通預金 (1130) の勘定科目が見つかりません");

  const amount = Math.abs(txn.amount_jpy);
  const incoming = txn.amount_jpy > 0;

  const { data: entry, error: jErr } = await sb
    .from("journal_entries")
    .insert({
      company_id: DEMO_COMPANY_ID,
      entry_date: txn.txn_date,
      voucher_no: `BNK-${txn.external_id ?? txn.id.slice(0, 8)}`,
      description: txn.suggested_memo ?? txn.description,
      source_type: "bank_import",
      source_id: txn.id,
      status: "confirmed",
      created_by: u.user.id,
    })
    .select("id")
    .single();
  if (jErr) throw new Error(jErr.message);

  // Incoming: 普通預金 / suggested_account
  // Outgoing: suggested_account / 普通預金
  const debit = incoming ? cashAcc.id : txn.suggested_account_id;
  const credit = incoming ? txn.suggested_account_id : cashAcc.id;

  const { error: lErr } = await sb.from("journal_lines").insert([
    { journal_id: entry!.id, line_no: 1, side: "debit",  account_id: debit,  partner_id: txn.suggested_partner_id, amount_jpy: amount, memo: txn.suggested_memo },
    { journal_id: entry!.id, line_no: 2, side: "credit", account_id: credit, partner_id: txn.suggested_partner_id, amount_jpy: amount, memo: txn.suggested_memo },
  ]);
  if (lErr) throw new Error(lErr.message);

  const { error: uErr } = await sb
    .from("bank_transactions")
    .update({ match_status: "matched", journal_id: entry!.id, matched_at: new Date().toISOString(), matched_by: u.user.id })
    .eq("id", txn.id);
  if (uErr) throw new Error(uErr.message);

  revalidatePath("/bank");
  revalidatePath("/journal");
  revalidatePath("/");
}

export async function updateBankSuggestion(
  txnId: string,
  accountId: string,
  memo: string | null,
) {
  const sb = await actionClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) throw new Error("Not authenticated");
  const { error } = await sb
    .from("bank_transactions")
    .update({ suggested_account_id: accountId, suggested_memo: memo ?? null })
    .eq("id", txnId);
  if (error) throw new Error(error.message);
  revalidatePath("/bank");
}

export async function rejectBankMatch(txnId: string) {
  const sb = await actionClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) throw new Error("Not authenticated");
  const { error } = await sb
    .from("bank_transactions")
    .update({ match_status: "rejected", matched_at: new Date().toISOString(), matched_by: u.user.id })
    .eq("id", txnId);
  if (error) throw new Error(error.message);
  revalidatePath("/bank");
}
