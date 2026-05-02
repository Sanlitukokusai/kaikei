import { getTrialBalance, buildFinancialSummary } from "@/lib/queries";
import ReportsClient from "./ReportsClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;

  // Default to current month
  const now = new Date();
  const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const defaultTo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const dateFrom = params.from ?? defaultFrom;
  const dateTo = params.to ?? defaultTo;

  const tb = await getTrialBalance(undefined, dateFrom, dateTo);
  const fs = buildFinancialSummary(tb);

  return <ReportsClient fs={fs} tb={tb} dateFrom={dateFrom} dateTo={dateTo} />;
}
