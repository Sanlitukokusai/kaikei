import { getTrialBalance, buildFinancialSummary, getTaxSummary } from "@/lib/queries";
import ReportsClient from "./ReportsClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;

  // Default to current fiscal year (April–March)
  const now = new Date();
  const fiscalYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const defaultFrom = `${fiscalYear}-04-01`;
  const defaultTo = `${fiscalYear + 1}-03-31`;

  const dateFrom = params.from ?? defaultFrom;
  const dateTo = params.to ?? defaultTo;

  const [tb, taxSummary] = await Promise.all([
    getTrialBalance(undefined, dateFrom, dateTo),
    getTaxSummary(undefined, dateFrom, dateTo),
  ]);
  const fs = buildFinancialSummary(tb);

  return <ReportsClient fs={fs} tb={tb} dateFrom={dateFrom} dateTo={dateTo} taxSummary={taxSummary} />;
}
