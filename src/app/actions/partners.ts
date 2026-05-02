"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DEMO_COMPANY_ID, actionClient } from "@/lib/supabase";

export type CreatePartnerInput = {
  name: string;
  name_kana?: string | null;
  kind: "corp" | "individual" | "overseas";
  invoice_reg_no?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

export async function createPartner(input: CreatePartnerInput) {
  const sb = await actionClient();
  const { data: user } = await sb.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { error } = await sb.from("partners").insert({
    company_id: DEMO_COMPANY_ID,
    name: input.name,
    name_kana: input.name_kana || null,
    kind: input.kind,
    invoice_reg_no: input.invoice_reg_no || null,
    phone: input.phone || null,
    email: input.email || null,
    address: input.address || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/partners");
  redirect("/partners");
}

export async function updatePartner(id: string, input: CreatePartnerInput) {
  const sb = await actionClient();
  const { data: user } = await sb.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { error } = await sb.from("partners").update({
    name: input.name,
    name_kana: input.name_kana || null,
    kind: input.kind,
    invoice_reg_no: input.invoice_reg_no || null,
    phone: input.phone || null,
    email: input.email || null,
    address: input.address || null,
  }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/partners");
  redirect("/partners");
}

export async function deletePartner(id: string) {
  const sb = await actionClient();
  const { error } = await sb.from("partners").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/partners");
}
