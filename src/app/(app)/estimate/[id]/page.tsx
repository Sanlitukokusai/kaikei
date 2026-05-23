import { notFound } from "next/navigation";
import { getCompany, getEstimate, listPartners } from "@/lib/queries";
import EstimateForm from "../new/EstimateForm";

export const dynamic = "force-dynamic";

export default async function EstimateEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [est, partners, company] = await Promise.all([
    getEstimate(id),
    listPartners(),
    getCompany(),
  ]);
  if (!est) notFound();

  return (
    <EstimateForm
      mode="edit"
      partners={partners}
      defaultCompanyName={company?.name ?? ""}
      defaultRegNo={company?.invoice_reg_no ?? ""}
      initial={{
        id: est.id,
        estimate_no: est.estimate_no,
        estimate_date: est.estimate_date,
        valid_until: est.valid_until,
        partner_id: est.partner_id,
        subject: est.subject,
        notes: est.notes,
        items: est.items.map((it) => ({
          item_name: it.item_name,
          transaction_date: it.transaction_date,
          quantity: it.quantity,
          unit: it.unit,
          unit_price: it.unit_price,
          tax_rate: it.tax_rate,
        })),
      }}
    />
  );
}
