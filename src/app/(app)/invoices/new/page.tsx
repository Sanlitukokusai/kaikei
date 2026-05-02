import { listPartners } from "@/lib/queries";
import InvoiceForm from "./InvoiceForm";

export const dynamic = "force-dynamic";

export default async function InvoiceCreatePage() {
  const partners = await listPartners();
  return <InvoiceForm partners={partners} />;
}
