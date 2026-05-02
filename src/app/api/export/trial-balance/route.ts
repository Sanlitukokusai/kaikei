import { NextRequest, NextResponse } from "next/server";
import { getTrialBalance } from "@/lib/queries";

export const dynamic = "force-dynamic";

const categoryLabel: Record<string, string> = {
  asset: "資産",
  liability: "負債",
  equity: "純資産",
  revenue: "収益",
  expense: "費用",
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from") ?? new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const to = searchParams.get("to") ?? new Date().toISOString().slice(0, 10);

  const tb = await getTrialBalance(undefined, from, to);

  const header = "勘定科目コード,勘定科目名,分類,借方合計,貸方合計,残高\n";
  const rows = tb.map((r) =>
    csvRow([
      r.code,
      r.name,
      categoryLabel[r.category] ?? r.category,
      String(r.debit),
      String(r.credit),
      String(r.balance),
    ]),
  );

  const bom = "﻿";
  const csv = bom + header + rows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="trial_balance_${from}_${to}.csv"`,
    },
  });
}

function csvRow(values: string[]): string {
  return values.map((v) => `"${v.replace(/"/g, '""')}"`).join(",");
}
