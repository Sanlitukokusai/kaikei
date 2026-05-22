"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DEMO_COMPANY_ID, actionClient } from "@/lib/supabase";

export type DeliveryLineInput = {
  transaction_date?: string | null;
  item_name?: string | null;
  quantity?: number | null;
  unit?: string | null;
  unit_price?: number | null;
  tax_rate?: number;
};

export type CreateDeliveryInput = {
  delivery_no: string;
  delivery_date: string;
  partner_id?: string | null;
  subject?: string | null;
  notes?: string | null;
  items: DeliveryLineInput[];
};

function totals(items: DeliveryLineInput[]) {
  let subtotal = 0, tax = 0;
  for (const it of items) {
    const line = Math.round((it.quantity ?? 0) * (it.unit_price ?? 0));
    subtotal += line;
    tax += Math.floor((line * (it.tax_rate ?? 0)) / 100);
  }
  return { subtotal, tax_total: tax, total: subtotal + tax };
}

export async function createDeliveryNote(input: CreateDeliveryInput) {
  const sb = await actionClient();
  const { data: user } = await sb.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { subtotal, tax_total, total } = totals(input.items);

  const { data: dn, error } = await sb
    .from("delivery_notes")
    .insert({
      company_id: DEMO_COMPANY_ID,
      delivery_no: input.delivery_no,
      delivery_date: input.delivery_date,
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
      delivery_note_id: dn!.id,
      line_no: i + 1,
      item_name: it.item_name || null,
      transaction_date: it.transaction_date || null,
      quantity: it.quantity ?? null,
      unit: it.unit || null,
      unit_price: it.unit_price ?? null,
      tax_rate: it.tax_rate ?? 10,
      amount: Math.round((it.quantity ?? 0) * (it.unit_price ?? 0)),
    }));
    const { error: e2 } = await sb.from("delivery_note_items").insert(items);
    if (e2) throw new Error(e2.message);
  }

  revalidatePath("/delivery");
  redirect("/delivery");
}

export async function updateDeliveryNote(id: string, input: CreateDeliveryInput) {
  const sb = await actionClient();
  const { data: user } = await sb.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { subtotal, tax_total, total } = totals(input.items);

  const { error } = await sb
    .from("delivery_notes")
    .update({
      delivery_no: input.delivery_no,
      delivery_date: input.delivery_date,
      partner_id: input.partner_id || null,
      subject: input.subject || null,
      notes: input.notes || null,
      subtotal, tax_total, total,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  const { error: delErr } = await sb.from("delivery_note_items").delete().eq("delivery_note_id", id);
  if (delErr) throw new Error(delErr.message);

  if (input.items.length) {
    const items = input.items.map((it, i) => ({
      delivery_note_id: id,
      line_no: i + 1,
      item_name: it.item_name || null,
      transaction_date: it.transaction_date || null,
      quantity: it.quantity ?? null,
      unit: it.unit || null,
      unit_price: it.unit_price ?? null,
      tax_rate: it.tax_rate ?? 10,
      amount: Math.round((it.quantity ?? 0) * (it.unit_price ?? 0)),
    }));
    const { error: insErr } = await sb.from("delivery_note_items").insert(items);
    if (insErr) throw new Error(insErr.message);
  }

  revalidatePath("/delivery");
  redirect("/delivery");
}

export async function updateDeliveryStatus(
  id: string,
  status: "draft" | "sent" | "invoiced" | "cancelled",
) {
  const sb = await actionClient();
  const { error } = await sb.from("delivery_notes").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/delivery");
}

export async function deleteDeliveryNote(id: string) {
  const sb = await actionClient();
  const { error } = await sb.from("delivery_notes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/delivery");
}
