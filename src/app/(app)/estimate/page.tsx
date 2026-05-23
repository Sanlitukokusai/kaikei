import Link from "next/link";
import Icon from "@/components/Icon";
import { Button, Card, Chip } from "@/components/ui";
import { listEstimates } from "@/lib/queries";
import type { Estimate } from "@/lib/database.types";
import EstimateActions from "./EstimateActions";

export const dynamic = "force-dynamic";

const statusTone: Record<Estimate["status"], "s" | "w" | "i" | "d" | "n"> = {
  accepted: "s", sent: "w", draft: "i", rejected: "d", expired: "d", cancelled: "n",
};
const statusLabel: Record<Estimate["status"], string> = {
  accepted: "受注", sent: "提出済", draft: "下書き", rejected: "失注", expired: "期限切れ", cancelled: "取消",
};
const fmtDate = (d: string | null) => d ? d.slice(5).replaceAll("-", "/") : "—";

export default async function EstimateListPage() {
  const rows = await listEstimates();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="page-h">
        <div>
          <div className="breadcrumb">
            <Icon name="Home" size={12} />
            <span>ホーム</span> / <span style={{ color: "var(--foreground-700)" }}>見積書</span>
          </div>
          <h1 className="h1">見積書</h1>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{rows.length}件</div>
        </div>
        <Link href="/estimate/new"><Button variant="primary" icon="Plus">見積書を新規作成</Button></Link>
      </div>

      <Card className="tight">
        <table className="tbl">
          <thead>
            <tr>
              <th>見積番号</th>
              <th>見積日</th>
              <th>取引先</th>
              <th>件名</th>
              <th className="num">金額（税込）</th>
              <th>有効期限</th>
              <th>ステータス</th>
              <th style={{ width: 110 }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const expired = r.valid_until && r.valid_until < today
                && r.status !== "accepted" && r.status !== "rejected" && r.status !== "cancelled";
              return (
                <tr key={r.id}>
                  <td><span className="code">{r.estimate_no}</span></td>
                  <td style={{ fontSize: 12 }}>{fmtDate(r.estimate_date)}</td>
                  <td>{r.partner?.name ?? "—"}</td>
                  <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.subject || "—"}
                  </td>
                  <td className="num" style={{ fontWeight: 600 }}>¥{r.total.toLocaleString()}</td>
                  <td style={{ fontSize: 12, color: expired ? "var(--money-negative)" : "var(--foreground-600)" }}>
                    {fmtDate(r.valid_until)}
                  </td>
                  <td><Chip tone={statusTone[r.status]}>{statusLabel[r.status]}</Chip></td>
                  <td><EstimateActions id={r.id} /></td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--foreground-500)" }}>見積書がまだありません</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
