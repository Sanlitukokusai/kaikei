import { notFound } from "next/navigation";
import { getInvoice } from "@/lib/queries";
import { listPartners } from "@/lib/queries";
import InvoiceEditForm from "./InvoiceEditForm";

export const dynamic = "force-dynamic";

export default async function InvoiceEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [invoice, partners] = await Promise.all([getInvoice(id), listPartners()]);
  if (!invoice) notFound();

  return <InvoiceEditForm invoice={invoice} partners={partners} />;
}
