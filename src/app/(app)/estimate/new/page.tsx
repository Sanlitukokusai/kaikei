import { getCompany, listPartners } from "@/lib/queries";
import EstimateForm from "./EstimateForm";

export const dynamic = "force-dynamic";

export default async function EstimateCreatePage() {
  const [partners, company] = await Promise.all([listPartners(), getCompany()]);
  return (
    <EstimateForm
      partners={partners}
      defaultCompanyName={company?.name ?? ""}
      defaultRegNo={company?.invoice_reg_no ?? ""}
    />
  );
}
