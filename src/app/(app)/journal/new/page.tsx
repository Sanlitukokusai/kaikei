import { listAccounts, listPartners } from "@/lib/queries";
import JournalForm from "./JournalForm";

export const dynamic = "force-dynamic";

export default async function NewJournalPage() {
  const [accounts, partners] = await Promise.all([listAccounts(), listPartners()]);
  return <JournalForm accounts={accounts} partners={partners} />;
}
