"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DEMO_COMPANY_ID, actionClient } from "@/lib/supabase";

export type JournalLineInput = {
  side: "debit" | "credit";
  account_id: string;
  partner_id?: string | null;
  amount_jpy: number;
  tax_category?: string | null;
  memo?: string | null;
};

export type CreateJournalEntryInput = {
  entry_date: string;
  voucher_no?: string | null;
  description?: string | null;
  status: "draft" | "pending" | "confirmed";
  source_type?: "manual" | "ocr" | "bank_import" | "invoice" | "api";
  source_id?: string | null;
  lines: JournalLineInput[];
};

export function ensureBalanced(lines: JournalLineInput[]) {
  const dr = lines.filter((l) => l.side === "debit").reduce((s, l) => s + (l.amount_jpy ?? 0), 0);
  const cr = lines.filter((l) => l.side === "credit").reduce((s, l) => s + (l.amount_jpy ?? 0), 0);
  if (dr !== cr) {
    throw new Error(`借方 ¥${dr.toLocaleString()} / 貸方 ¥${cr.toLocaleString()} が一致しません`);
  }
  if (dr === 0) throw new Error("金額が 0 円の仕訳は登録できません");
}

export async function createJournalEntry(input: CreateJournalEntryInput) {
  const sb = await actionClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) throw new Error("Not authenticated");

  const lines = input.lines.filter((l) => l.account_id && (l.amount_jpy ?? 0) > 0);
  if (lines.length < 2) throw new Error("少なくとも借方・貸方それぞれ1行以上が必要です");
  ensureBalanced(lines);

  const { data: entry, error } = await sb
    .from("journal_entries")
    .insert({
      company_id: DEMO_COMPANY_ID,
      entry_date: input.entry_date,
      voucher_no: input.voucher_no || null,
      description: input.description || null,
      source_type: input.source_type ?? "manual",
      source_id: input.source_id ?? null,
      status: input.status,
      created_by: u.user.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const rows = lines.map((l, i) => ({
    journal_id: entry!.id,
    line_no: i + 1,
    side: l.side,
    account_id: l.account_id,
    partner_id: l.partner_id || null,
    amount_jpy: l.amount_jpy,
    tax_category: l.tax_category || null,
    memo: l.memo || null,
  }));
  const { error: e2 } = await sb.from("journal_lines").insert(rows);
  if (e2) throw new Error(e2.message);

  revalidatePath("/journal");
  revalidatePath("/");
  redirect("/journal");
}

export async function updateJournalEntry(
  entryId: string,
  input: CreateJournalEntryInput,
) {
  const sb = await actionClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) throw new Error("Not authenticated");

  // Prevent editing locked entries
  const { data: existing } = await sb
    .from("journal_entries")
    .select("is_locked")
    .eq("id", entryId)
    .single();
  if (existing?.is_locked) throw new Error("ロック済みの仕訳は編集できません");

  const lines = input.lines.filter((l) => l.account_id && (l.amount_jpy ?? 0) > 0);
  if (lines.length < 2) throw new Error("少なくとも借方・貸方それぞれ1行以上が必要です");
  ensureBalanced(lines);

  const { error } = await sb
    .from("journal_entries")
    .update({
      entry_date: input.entry_date,
      voucher_no: input.voucher_no || null,
      description: input.description || null,
      status: input.status,
    })
    .eq("id", entryId);
  if (error) throw new Error(error.message);

  // Replace lines: delete then re-insert
  const { error: delErr } = await sb
    .from("journal_lines")
    .delete()
    .eq("journal_id", entryId);
  if (delErr) throw new Error(delErr.message);

  const rows = lines.map((l, i) => ({
    journal_id: entryId,
    line_no: i + 1,
    side: l.side,
    account_id: l.account_id,
    partner_id: l.partner_id || null,
    amount_jpy: l.amount_jpy,
    tax_category: l.tax_category || null,
    memo: l.memo || null,
  }));
  const { error: insErr } = await sb.from("journal_lines").insert(rows);
  if (insErr) throw new Error(insErr.message);

  revalidatePath("/journal");
  revalidatePath("/");
  redirect("/journal");
}

export async function deleteJournalEntry(entryId: string) {
  const sb = await actionClient();
  const { data: existing } = await sb
    .from("journal_entries")
    .select("is_locked")
    .eq("id", entryId)
    .single();
  if (existing?.is_locked) throw new Error("ロック済みの仕訳は削除できません");

  // Lines are deleted by ON DELETE CASCADE
  const { error } = await sb.from("journal_entries").delete().eq("id", entryId);
  if (error) throw new Error(error.message);

  revalidatePath("/journal");
  revalidatePath("/");
}
