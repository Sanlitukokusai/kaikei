import { notFound } from "next/navigation";
import { getCompany, getDeliveryNote, listPartners } from "@/lib/queries";
import DeliveryForm from "../new/DeliveryForm";

export const dynamic = "force-dynamic";

export default async function DeliveryEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [dn, partners, company] = await Promise.all([
    getDeliveryNote(id),
    listPartners(),
    getCompany(),
  ]);
  if (!dn) notFound();

  return (
    <DeliveryForm
      mode="edit"
      partners={partners}
      defaultCompanyName={company?.name ?? ""}
      defaultRegNo={company?.invoice_reg_no ?? ""}
      initial={{
        id: dn.id,
        delivery_no: dn.delivery_no,
        delivery_date: dn.delivery_date,
        partner_id: dn.partner_id,
        subject: dn.subject,
        notes: dn.notes,
        items: dn.items.map((it) => ({
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
