"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DEMO_COMPANY_ID, actionClient } from "@/lib/supabase";

export type EstimateLineInput = {
  transaction_date?: string | null;
  item_name?: string | null;
  quantity?: number | null;
  unit?: string | null;
  unit_price?: number | null;
  tax_rate?: number;
};

export type CreateEstimateInput = {
  estimate_no: string;
  estimate_date: string;
  valid_until?: string | null;
  partner_id?: string | null;
  subject?: string | null;
  notes?: string | null;
  items: EstimateLineInput[];
};

function totals(items: EstimateLineInput[]) {
  let subtotal = 0, tax = 0;
  for (const it of items) {
    const line = Math.round((it.quantity ?? 0) * (it.unit_price ?? 0));
    subtotal += line;
    tax += Math.floor((line * (it.tax_rate ?? 0)) / 100);
  }
  return { subtotal, tax_total: tax, total: subtotal + tax };
}

export async function createEstimate(input: CreateEstimateInput) {
  const sb = await actionClient();
  const { data: user } = await sb.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { subtotal, tax_total, total } = totals(input.items);

  const { data: est, error } = await sb
    .from("estimates")
    .insert({
      company_id: DEMO_COMPANY_ID,
      estimate_no: input.estimate_no,
      estimate_date: input.estimate_date,
      valid_until: input.valid_until || null,
      partner_id: input.partner_id || null,
      subject: input.subject || null,
      notes: input.notes || null,
      subtotal, tax_total, total,
      status: "draft",
      created_by: user.user.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (input.items.length) {
    const items = input.items.map((it, i) => ({
      estimate_id: est!.id,
      line_no: i + 1,
      item_name: it.item_name || null,
      transaction_date: it.transaction_date || null,
      quantity: it.quantity ?? null,
      unit: it.unit || null,
      unit_price: it.unit_price ?? null,
      tax_rate: it.tax_rate ?? 10,
      amount: Math.round((it.quantity ?? 0) * (it.unit_price ?? 0)),
    }));
    const { error: e2 } = await sb.from("estimate_items").insert(items);
    if (e2) throw new Error(e2.message);
  }

  revalidatePath("/estimate");
  redirect("/estimate");
}

export async function updateEstimate(id: string, input: CreateEstimateInput) {
  const sb = await actionClient();
  const { data: user } = await sb.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { subtotal, tax_total, total } = totals(input.items);

  const { error } = await sb
    .from("estimates")
    .update({
      estimate_no: input.estimate_no,
      estimate_date: input.estimate_date,
      valid_until: input.valid_until || null,
      partner_id: input.partner_id || null,
      subject: input.subject || null,
      notes: input.notes || null,
      subtotal, tax_total, total,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  const { error: delErr } = await sb.from("estimate_items").delete().eq("estimate_id", id);
  if (delErr) throw new Error(delErr.message);

  if (input.items.length) {
    const items = input.items.map((it, i) => ({
      estimate_id: id,
      line_no: i + 1,
      item_name: it.item_name || null,
      transaction_date: it.transaction_date || null,
      quantity: it.quantity ?? null,
      unit: it.unit || null,
      unit_price: it.unit_price ?? null,
      tax_rate: it.tax_rate ?? 10,
      amount: Math.round((it.quantity ?? 0) * (it.unit_price ?? 0)),
    }));
    const { error: insErr } = await sb.from("estimate_items").insert(items);
    if (insErr) throw new Error(insErr.message);
  }

  revalidatePath("/estimate");
  redirect("/estimate");
}

export async function updateEstimateStatus(
  id: string,
  status: "draft" | "sent" | "accepted" | "rejected" | "expired" | "cancelled",
) {
  const sb = await actionClient();
  const { error } = await sb.from("estimates").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/estimate");
}

export async function deleteEstimate(id: string) {
  const sb = await actionClient();
  const { error } = await sb.from("estimates").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/estimate");
}
