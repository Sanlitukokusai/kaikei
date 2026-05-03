import Link from "next/link";
import Icon from "@/components/Icon";
import { Button, Card, Chip } from "@/components/ui";
import {
  getDashboardSummary,
  listJournalEntries,
  listOverdueInvoices,
} from "@/lib/queries";
import type { JournalEntry } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const statusTone: Record<JournalEntry["status"], "s" | "w" | "i" | "d"> = {
  confirmed: "s", pending: "w", draft: "i", rejected: "d",
};
const statusLabel: Record<JournalEntry["status"], string> = {
  confirmed: "確定済", pending: "確認待ち", draft: "下書き", rejected: "差戻し",
};
const fmtMD = (d: string) => d.slice(5).replaceAll("-", "/");
const fmtJpy = (n: number) => `¥${Math.round(n).toLocaleString("ja-JP")}`;
const fmtPct = (p: number | null) => (p === null ? "—" : `${p >= 0 ? "+" : ""}${p.toFixed(1)}%`);

export default async function DashboardPage() {
  const [recent, overdueInvoices, summary] = await Promise.all([
    listJournalEntries(undefined, 5).then((r) => r.slice(0, 5)),
    listOverdueInvoices(),
    getDashboardSummary(),
  ]);

  const periodLabel = `${summary.period.year}年${summary.period.month}月`;
  const maxTrend = Math.max(
    1,
    ...summary.trend.flatMap((t) => [t.revenue, t.prevYearRevenue]),
  );

  return (
    <div>
      <div className="page-h">
        <div>
          <div className="breadcrumb">
            <Icon name="Home" size={12} />
            <span>ホーム</span> / <span style={{ color: "var(--foreground-700)" }}>ダッシュボード</span>
          </div>
          <h1 className="h1">ダッシュボード</h1>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            {periodLabel} · 月次サマリー
          </div>
        </div>
        <div className="row">
          <Button variant="bordered" icon="Calendar">{periodLabel}</Button>
          <Link href={`/api/export/journal?from=${summary.period.year}-${String(summary.period.month).padStart(2, "0")}-01&to=${summary.period.year}-${String(summary.period.month).padStart(2, "0")}-31`}>
            <Button variant="bordered" icon="Download">エクスポート</Button>
          </Link>
          <Link href="/journal/new"><Button variant="primary" icon="Plus">仕訳を追加</Button></Link>
        </div>
      </div>

      {overdueInvoices.length > 0 && (
        <div className="alert" style={{ borderColor: "var(--money-negative)", background: "#fef2f2" }}>
          <Icon name="AlertTriangle" size={18} style={{ color: "var(--money-negative)" }} />
          <div style={{ flex: 1 }}>
            <strong>{overdueInvoices.length}件の請求書</strong>が期限超過です。
            {overdueInvoices.slice(0, 3).map((inv) => (
              <span key={inv.id} style={{ marginLeft: 8, fontSize: 12, color: "var(--foreground-600)" }}>
                {inv.partner?.name ?? "—"} ¥{inv.total.toLocaleString()} ({inv.due_date})
              </span>
            ))}
          </div>
          <Link href="/invoices"><Button variant="bordered" size="sm">確認する</Button></Link>
        </div>
      )}

      <div className="kpi-grid" style={{ marginBottom: 18 }}>
        <div className="kpi">
          <div className="eb">月間売上</div>
          <div className="val">{fmtJpy(summary.revenue)}</div>
          <div className={`delta ${(summary.revenueDeltaPct ?? 0) >= 0 ? "up" : "down"}`}>
            <Icon name={(summary.revenueDeltaPct ?? 0) >= 0 ? "TrendingUp" : "TrendingDown"} size={14} />
            {fmtPct(summary.revenueDeltaPct)} <span className="sub">前月比</span>
          </div>
        </div>
        <div className="kpi">
          <div className="eb">月間費用</div>
          <div className="val">{fmtJpy(summary.expense)}</div>
          <div className={`delta ${(summary.expenseDeltaPct ?? 0) <= 0 ? "up" : "down"}`}>
            <Icon name={(summary.expenseDeltaPct ?? 0) <= 0 ? "TrendingDown" : "TrendingUp"} size={14} />
            {fmtPct(summary.expenseDeltaPct)} <span className="sub">前月比</span>
          </div>
        </div>
        <div className="kpi">
          <div className="eb">純利益</div>
          <div className="val" style={{ color: summary.netIncome >= 0 ? "var(--money-positive)" : "var(--money-negative)" }}>
            {fmtJpy(summary.netIncome)}
          </div>
          <div className={`delta ${(summary.netIncomeDeltaPct ?? 0) >= 0 ? "up" : "down"}`}>
            <Icon name={(summary.netIncomeDeltaPct ?? 0) >= 0 ? "TrendingUp" : "TrendingDown"} size={14} />
            {fmtPct(summary.netIncomeDeltaPct)}
          </div>
        </div>
        <div className="kpi">
          <div className="eb">現金残高</div>
          <div className="val">{fmtJpy(summary.cashBalance)}</div>
          <div className="sub">
            {summary.cashAccountCount > 0
              ? `${summary.cashAccountCount}口座 · 累計残高`
              : "現金科目が未設定です"}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
        <Card title="売上推移（過去6ヶ月）" action={
          <div className="row" style={{ fontSize: 11, color: "var(--foreground-500)" }}>
            <span style={{ display: "inline-block", width: 8, height: 8, background: "var(--blue-500)", borderRadius: 2 }} /> 売上
            <span style={{ display: "inline-block", width: 8, height: 8, background: "var(--blue-200)", borderRadius: 2, marginLeft: 8 }} /> 前年同月
          </div>
        }>
          <div className="chart-bar">
            {summary.trend.map((t, i) => (
              <div key={i} style={{ display: "flex", flex: 1, gap: 3 }}>
                <div className="bar" style={{ height: `${(t.revenue / maxTrend) * 100}%` }} title={fmtJpy(t.revenue)} />
                <div className="bar alt" style={{ height: `${(t.prevYearRevenue / maxTrend) * 100}%` }} title={fmtJpy(t.prevYearRevenue)} />
              </div>
            ))}
          </div>
          <div className="chart-x">{summary.trend.map((t) => <span key={t.label}>{t.label}</span>)}</div>
        </Card>
        <Card title="費用の内訳">
          {summary.breakdown.length === 0 ? (
            <div style={{ padding: 16, textAlign: "center", color: "var(--foreground-500)", fontSize: 13 }}>
              今月の費用データがありません
            </div>
          ) : (
            summary.breakdown.map((r) => (
              <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 6, height: 24, borderRadius: 2, background: r.color }} />
                <div style={{ flex: 1, fontSize: 13 }}>{r.name}</div>
                <div className="num" style={{ fontFamily: "var(--font-numeric)", fontVariantNumeric: "tabular-nums", fontSize: 13, fontWeight: 500 }}>{fmtJpy(r.amt)}</div>
                <div style={{ width: 36, textAlign: "right", fontSize: 11, color: "var(--foreground-500)" }}>{r.pct}%</div>
              </div>
            ))
          )}
        </Card>
      </div>

      <div style={{ height: 14 }} />

      <Card title="最近の仕訳" action={<Link href="/journal"><Button variant="light" size="sm" iconRight="ArrowRight">すべて見る</Button></Link>}>
        <table className="tbl">
          <thead>
            <tr>
              <th>日付</th>
              <th>取引内容</th>
              <th>勘定科目</th>
              <th className="num">金額</th>
              <th>状態</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((e) => {
              const dr = e.lines.find((l) => l.side === "debit");
              const cr = e.lines.find((l) => l.side === "credit");
              const total = e.lines.filter((l) => l.side === "debit").reduce((s, l) => s + l.amount_jpy, 0);
              const isIncome = (dr?.account?.code ?? "").startsWith("13") || (cr?.account?.code ?? "").startsWith("4");
              return (
                <tr key={e.id}>
                  <td>{fmtMD(e.entry_date)}</td>
                  <td>{e.description ?? "—"} {e.voucher_no && <span className="code">{e.voucher_no}</span>}</td>
                  <td>{(isIncome ? cr : dr)?.account?.name ?? "—"}</td>
                  <td className={`num ${isIncome ? "pos" : "neg"}`}>¥{total.toLocaleString()}</td>
                  <td><Chip tone={statusTone[e.status]}>{statusLabel[e.status]}</Chip></td>
                </tr>
              );
            })}
            {recent.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 32, color: "var(--foreground-500)" }}>まだ仕訳がありません</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
