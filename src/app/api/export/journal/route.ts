import { NextRequest, NextResponse } from "next/server";
import { listJournalEntriesForExport } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from") ?? new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const to = searchParams.get("to") ?? new Date().toISOString().slice(0, 10);

  const entries = await listJournalEntriesForExport(undefined, from, to);

  const header = "伝票番号,日付,摘要,行番号,借貸,勘定科目コード,勘定科目名,取引先,金額,メモ,ステータス\n";

  const rows: string[] = [];
  for (const e of entries) {
    for (const l of e.lines) {
      rows.push(
        csvRow([
          e.voucher_no ?? "",
          e.entry_date,
          e.description ?? "",
          String(l.line_no),
          l.side === "debit" ? "借方" : "貸方",
          l.account?.code ?? "",
          l.account?.name ?? "",
          l.partner?.name ?? "",
          String(l.amount_jpy),
          l.memo ?? "",
          e.status,
        ]),
      );
    }
  }

  const bom = "﻿";
  const csv = bom + header + rows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="journal_${from}_${to}.csv"`,
    },
  });
}

function csvRow(values: string[]): string {
  return values.map((v) => `"${v.replace(/"/g, '""')}"`).join(",");
}
