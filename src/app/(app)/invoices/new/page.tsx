import { getCompany, listPartners } from "@/lib/queries";
import InvoiceForm from "./InvoiceForm";

export const dynamic = "force-dynamic";

export default async function InvoiceCreatePage() {
  const [partners, company] = await Promise.all([listPartners(), getCompany()]);
  return (
    <InvoiceForm
      partners={partners}
      defaultCompanyName={company?.name ?? ""}
      defaultRegNo={company?.invoice_reg_no ?? ""}
    />
  );
}
