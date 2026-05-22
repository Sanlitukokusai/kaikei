import Link from "next/link";
import Icon from "@/components/Icon";
import { Button, Card, Chip } from "@/components/ui";
import { listDeliveryNotes } from "@/lib/queries";
import type { DeliveryNote } from "@/lib/database.types";
import DeliveryActions from "./DeliveryActions";

export const dynamic = "force-dynamic";

const statusTone: Record<DeliveryNote["status"], "s" | "w" | "i" | "d"> = {
  invoiced: "s", sent: "w", draft: "i", cancelled: "d",
};
const statusLabel: Record<DeliveryNote["status"], string> = {
  invoiced: "請求済", sent: "発送済", draft: "下書き", cancelled: "取消",
};
const fmtDate = (d: string | null) => d ? d.slice(5).replaceAll("-", "/") : "—";

export default async function DeliveryListPage() {
  const rows = await listDeliveryNotes();

  return (
    <div>
      <div className="page-h">
        <div>
          <div className="breadcrumb">
            <Icon name="Home" size={12} />
            <span>ホーム</span> / <span style={{ color: "var(--foreground-700)" }}>納品書</span>
          </div>
          <h1 className="h1">納品書</h1>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{rows.length}件</div>
        </div>
        <Link href="/delivery/new"><Button variant="primary" icon="Plus">納品書を新規作成</Button></Link>
      </div>

      <Card className="tight">
        <table className="tbl">
          <thead>
            <tr>
              <th>納品書番号</th>
              <th>納品日</th>
              <th>取引先</th>
              <th>件名</th>
              <th className="num">金額（税込）</th>
              <th>ステータス</th>
              <th style={{ width: 110 }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td><span className="code">{r.delivery_no}</span></td>
                <td style={{ fontSize: 12 }}>{fmtDate(r.delivery_date)}</td>
                <td>{r.partner?.name ?? "—"}</td>
                <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.subject || "—"}
                </td>
                <td className="num" style={{ fontWeight: 600 }}>¥{r.total.toLocaleString()}</td>
                <td><Chip tone={statusTone[r.status]}>{statusLabel[r.status]}</Chip></td>
                <td><DeliveryActions id={r.id} /></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--foreground-500)" }}>納品書がまだありません</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
