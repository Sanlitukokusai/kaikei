import { getCompany, listPartners } from "@/lib/queries";
import DeliveryForm from "./DeliveryForm";

export const dynamic = "force-dynamic";

export default async function DeliveryCreatePage() {
  const [partners, company] = await Promise.all([listPartners(), getCompany()]);
  return (
    <DeliveryForm
      partners={partners}
      defaultCompanyName={company?.name ?? ""}
      defaultRegNo={company?.invoice_reg_no ?? ""}
    />
  );
}
