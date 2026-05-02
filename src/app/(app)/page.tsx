import Link from "next/link";
import Icon from "@/components/Icon";
import { Button, Card, Chip } from "@/components/ui";
import { listJournalEntries } from "@/lib/queries";
import type { JournalEntry } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const statusTone: Record<JournalEntry["status"], "s" | "w" | "i" | "d"> = {
  confirmed: "s", pending: "w", draft: "i", rejected: "d",
};
const statusLabel: Record<JournalEntry["status"], string> = {
  confirmed: "確定済", pending: "確認待ち", draft: "下書き", rejected: "差戻し",
};
const fmtMD = (d: string) => d.slice(5).replaceAll("-", "/");

export default async function DashboardPage() {
  const recent = (await listJournalEntries(undefined, 5)).slice(0, 5);

  const months = ["11月", "12月", "1月", "2月", "3月", "4月"];
  const sales = [3.2, 3.8, 3.5, 4.1, 4.6, 4.82];
  const max = 5;

  const expenses = [
    { name: "仕入", amt: 482000, color: "#006FEE", pct: 38 },
    { name: "給料手当", amt: 380000, color: "#338ef7", pct: 30 },
    { name: "地代家賃", amt: 180000, color: "#7EE7FC", pct: 14 },
    { name: "通信費", amt: 92000, color: "#7828c8", pct: 7 },
    { name: "その他", amt: 150360, color: "var(--zinc-300)", pct: 11 },
  ];

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
            2026年4月 · 月次サマリー · 最終更新 14:22
          </div>
        </div>
        <div className="row">
          <Button variant="bordered" icon="Calendar">2026年4月</Button>
          <Button variant="bordered" icon="Download">エクスポート</Button>
          <Link href="/journal/new"><Button variant="primary" icon="Plus">仕訳を追加</Button></Link>
        </div>
      </div>

      <div className="alert">
        <Icon name="AlertCircle" size={18} />
        <div style={{ flex: 1 }}>
          <strong>3件の取引</strong>が銀行連携から取込まれました。勘定科目の確認をお願いします。
        </div>
        <Link href="/bank"><Button variant="bordered" size="sm">確認する</Button></Link>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 18 }}>
        <div className="kpi"><div className="eb">月間売上</div><div className="val">¥4,820,500</div><div className="delta up"><Icon name="TrendingUp" size={14} />+12.4% <span className="sub">前月比</span></div></div>
        <div className="kpi"><div className="eb">月間費用</div><div className="val">¥1,284,360</div><div className="delta down"><Icon name="TrendingDown" size={14} />−3.2% <span className="sub">前月比</span></div></div>
        <div className="kpi"><div className="eb">純利益</div><div className="val" style={{ color: "var(--money-positive)" }}>¥3,536,140</div><div className="delta up"><Icon name="TrendingUp" size={14} />+18.6%</div></div>
        <div className="kpi"><div className="eb">現金残高</div><div className="val">¥12,840,920</div><div className="sub">3口座 · 全銀協連携中</div></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
        <Card title="売上推移（過去6ヶ月）" action={
          <div className="row" style={{ fontSize: 11, color: "var(--foreground-500)" }}>
            <span style={{ display: "inline-block", width: 8, height: 8, background: "var(--blue-500)", borderRadius: 2 }} /> 売上
            <span style={{ display: "inline-block", width: 8, height: 8, background: "var(--blue-200)", borderRadius: 2, marginLeft: 8 }} /> 前年同月
          </div>
        }>
          <div className="chart-bar">
            {sales.map((v, i) => (
              <div key={i} style={{ display: "flex", flex: 1, gap: 3 }}>
                <div className="bar" style={{ height: `${(v / max) * 100}%` }} />
                <div className="bar alt" style={{ height: `${((v - 0.3 - i * 0.05) / max) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="chart-x">{months.map((m) => <span key={m}>{m}</span>)}</div>
        </Card>
        <Card title="費用の内訳">
          {expenses.map((r) => (
            <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 6, height: 24, borderRadius: 2, background: r.color }} />
              <div style={{ flex: 1, fontSize: 13 }}>{r.name}</div>
              <div className="num" style={{ fontFamily: "var(--font-numeric)", fontVariantNumeric: "tabular-nums", fontSize: 13, fontWeight: 500 }}>¥{r.amt.toLocaleString()}</div>
              <div style={{ width: 36, textAlign: "right", fontSize: 11, color: "var(--foreground-500)" }}>{r.pct}%</div>
            </div>
          ))}
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
