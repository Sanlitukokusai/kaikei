import { notFound } from "next/navigation";
import { listAccounts, listJournalEntries, listPartners } from "@/lib/queries";
import JournalEditForm from "./JournalEditForm";

export const dynamic = "force-dynamic";

export default async function JournalEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [entries, accounts, partners] = await Promise.all([
    listJournalEntries(undefined, 200),
    listAccounts(),
    listPartners(),
  ]);
  const entry = entries.find((e) => e.id === id);
  if (!entry) notFound();

  return <JournalEditForm entry={entry} accounts={accounts} partners={partners} />;
}
