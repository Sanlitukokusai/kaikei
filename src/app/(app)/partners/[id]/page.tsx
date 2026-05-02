import { notFound } from "next/navigation";
import { listPartners } from "@/lib/queries";
import PartnerEditForm from "./PartnerEditForm";

export const dynamic = "force-dynamic";

export default async function PartnerEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const partners = await listPartners();
  const partner = partners.find((p) => p.id === id);
  if (!partner) notFound();
  return <PartnerEditForm partner={partner} />;
}
