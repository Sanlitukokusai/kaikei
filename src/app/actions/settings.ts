"use server";
import { revalidatePath } from "next/cache";
import { DEMO_COMPANY_ID, actionClient } from "@/lib/supabase";

export type UpdateCompanyInput = {
  name: string;
  name_kana?: string | null;
  legal_form: "llc" | "kk" | "sole" | "other";
  invoice_reg_no?: string | null;
  corporate_number?: string | null;
  postal_code?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  representative?: string | null;
  tax_method?: "general" | "simple" | "two_percent" | "exempt" | null;
  fiscal_year_start_month?: number;
};

export async function updateCompany(input: UpdateCompanyInput) {
  const sb = await actionClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) throw new Error("Not authenticated");

  const { error } = await sb
    .from("companies")
    .update({
      name: input.name,
      name_kana: input.name_kana || null,
      legal_form: input.legal_form,
      invoice_reg_no: input.invoice_reg_no || null,
      corporate_number: input.corporate_number || null,
      postal_code: input.postal_code || null,
      address: input.address || null,
      phone: input.phone || null,
      email: input.email || null,
      representative: input.representative || null,
      tax_method: input.tax_method ?? null,
      fiscal_year_start_month: input.fiscal_year_start_month ?? 4,
    })
    .eq("id", DEMO_COMPANY_ID);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}
