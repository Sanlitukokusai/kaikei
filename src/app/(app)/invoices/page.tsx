import Link from "next/link";
import Icon from "@/components/Icon";
import { Button, Card, Chip } from "@/components/ui";
import { listInvoices } from "@/lib/queries";
import type { Invoice } from "@/lib/database.types";
import InvoiceActions from "./InvoiceActions";

export const dynamic = "force-dynamic";

const payTone: Record<Invoice["payment_status"], "s" | "w" | "i"> = {
  paid: "s", billed: "w", unbilled: "i",
};
const payLabel: Record<Invoice["payment_status"], string> = {
  paid: "入金済", billed: "請求済", unbilled: "未請求",
};
const fmtDate = (d: string | null) => d ? d.slice(5).replaceAll("-", "/") : "—";

export default async function InvoiceListPage() {
  const rows = await listInvoices();

  return (
    <div>
      <div className="page-h">
        <div>
          <div className="breadcrumb"><Icon name="Home" size={12} /><span>ホーム</span> / <span style={{ color: "var(--foreground-700)" }}>請求書</span></div>
          <h1 className="h1">請求書</h1>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{rows.length}件</div>
        </div>
        <Link href="/invoices/new"><Button variant="primary" icon="Plus">請求書を新規作成</Button></Link>
      </div>

      <Card className="tight">
        <table className="tbl">
          <thead>
            <tr>
              <th>請求書番号</th>
              <th>請求日</th>
              <th>取引先</th>
              <th>件名</th>
              <th className="num">金額（税込）</th>
              <th>支払期限</th>
              <th>ステータス</th>
              <th style={{ width: 80 }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td><span className="code">{r.invoice_no}</span></td>
                <td style={{ fontSize: 12 }}>{fmtDate(r.invoice_date)}</td>
                <td>{r.partner?.name ?? "—"}</td>
                <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.subject || "—"}
                </td>
                <td className="num" style={{ fontWeight: 600 }}>¥{r.total.toLocaleString()}</td>
                <td style={{ fontSize: 12, color: r.due_date && r.due_date < new Date().toISOString().slice(0, 10) && r.payment_status !== "paid" ? "var(--money-negative)" : "var(--foreground-600)" }}>
                  {fmtDate(r.due_date)}
                </td>
                <td><Chip tone={payTone[r.payment_status]}>{payLabel[r.payment_status]}</Chip></td>
                <td><InvoiceActions id={r.id} /></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--foreground-500)" }}>請求書がまだありません</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
