"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DEMO_COMPANY_ID, actionClient } from "@/lib/supabase";

export type InvoiceLineInput = {
  transaction_date?: string | null;
  item_name?: string | null;
  quantity?: number | null;
  unit?: string | null;
  unit_price?: number | null;
  tax_rate?: number;
};

export type CreateInvoiceInput = {
  invoice_no: string;
  invoice_date: string;
  due_date?: string | null;
  partner_id?: string | null;
  subject?: string | null;
  notes?: string | null;
  items: InvoiceLineInput[];
};

function totals(items: InvoiceLineInput[]) {
  let subtotal = 0, tax = 0;
  for (const it of items) {
    const line = Math.round((it.quantity ?? 0) * (it.unit_price ?? 0));
    subtotal += line;
    tax += Math.floor((line * (it.tax_rate ?? 0)) / 100);
  }
  return { subtotal, tax_total: tax, total: subtotal + tax };
}

export async function createInvoice(input: CreateInvoiceInput) {
  const sb = await actionClient();
  const { data: user } = await sb.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { subtotal, tax_total, total } = totals(input.items);

  const { data: inv, error } = await sb
    .from("invoices")
    .insert({
      company_id: DEMO_COMPANY_ID,
      invoice_no: input.invoice_no,
      invoice_date: input.invoice_date,
      due_date: input.due_date || null,
      partner_id: input.partner_id || null,
      subject: input.subject || null,
      notes: input.notes || null,
      subtotal, tax_total, total,
      status: "draft",
      payment_status: "unbilled",
      data_sync_status: "not_sent",
      created_by: user.user.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (input.items.length) {
    const items = input.items.map((it, i) => ({
      invoice_id: inv!.id,
      line_no: i + 1,
      item_name: it.item_name || null,
      transaction_date: it.transaction_date || null,
      quantity: it.quantity ?? null,
      unit: it.unit || null,
      unit_price: it.unit_price ?? null,
      tax_rate: it.tax_rate ?? 10,
      amount: Math.round((it.quantity ?? 0) * (it.unit_price ?? 0)),
    }));
    const { error: e2 } = await sb.from("invoice_items").insert(items);
    if (e2) throw new Error(e2.message);
  }

  revalidatePath("/invoices");
  redirect("/invoices");
}

export async function updateInvoiceStatus(
  id: string,
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled",
) {
  const sb = await actionClient();
  const { error } = await sb.from("invoices").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/invoices");
}

export async function deleteInvoice(id: string) {
  const sb = await actionClient();
  // Items deleted by ON DELETE CASCADE
  const { error } = await sb.from("invoices").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/invoices");
}
