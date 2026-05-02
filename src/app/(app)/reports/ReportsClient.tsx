"use client";
import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import { Button, Card } from "@/components/ui";
import type { FinancialSummary, TrialBalanceLine } from "@/lib/queries";

type Tab = "pl" | "bs" | "tb" | "tax";

const fmt = (n: number) => `¥${Math.abs(n).toLocaleString()}`;

function PLRow({ label, amount, indent = 0, bold = false, bg = false }: {
  label: string; amount: number | null; indent?: number; bold?: boolean; bg?: boolean;
}) {
  const positive = amount == null || amount >= 0;
  return (
    <tr style={bg ? { background: "#f0fdf4" } : {}}>
      <td style={{ paddingLeft: 12 + indent * 20, fontWeight: bold ? 700 : 400, fontSize: bold ? 14 : 13 }}>
        {label}
      </td>
      {amount != null ? (
        <td className="num" style={{ fontWeight: bold ? 700 : 400, color: bold && !positive ? "var(--money-negative)" : undefined }}>
          {positive ? "" : "▲"}{fmt(amount)}
        </td>
      ) : (
        <td />
      )}
    </tr>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <tr style={{ background: "var(--zinc-50)" }}>
      <td colSpan={2} style={{ fontSize: 11, fontWeight: 600, color: "var(--foreground-500)", textTransform: "uppercase", letterSpacing: ".06em", padding: "8px 12px" }}>
        {label}
      </td>
    </tr>
  );
}

function PLTab({ fs }: { fs: FinancialSummary }) {
  const hasData = fs.totalRevenue > 0 || fs.totalSga > 0;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
      <Card>
        {!hasData && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--foreground-500)" }}>
            <Icon name="FileText" size={28} />
            <div style={{ marginTop: 8 }}>この期間に確定済みの仕訳がありません</div>
          </div>
        )}
        {hasData && (
          <table className="tbl">
            <thead>
              <tr>
                <th>勘定科目</th>
                <th className="num">当期金額</th>
              </tr>
            </thead>
            <tbody>
              <SectionHeader label="売上高" />
              {fs.revenue.map((r) => <PLRow key={r.account_id} label={`　${r.name}`} amount={r.balance} />)}
              <PLRow label="売上高合計" amount={fs.totalRevenue} bold bg />

              <SectionHeader label="売上原価" />
              {fs.cogs.map((r) => <PLRow key={r.account_id} label={`　${r.name}`} amount={r.balance} />)}
              {fs.cogs.length === 0 && <PLRow label="　（なし）" amount={null} />}
              <PLRow label="売上原価合計" amount={fs.totalCogs} bold />
              <PLRow label="売上総利益" amount={fs.grossProfit} bold bg />

              <SectionHeader label="販売費及び一般管理費" />
              {fs.sga.map((r) => <PLRow key={r.account_id} label={`　${r.name}`} amount={r.balance} />)}
              {fs.sga.length === 0 && <PLRow label="　（なし）" amount={null} />}
              <PLRow label="販管費合計" amount={fs.totalSga} bold />
              <PLRow label="営業利益" amount={fs.operatingProfit} bold bg />

              {(fs.nonOpIncome.length > 0 || fs.nonOpExpense.length > 0) && (
                <>
                  <SectionHeader label="営業外損益" />
                  {fs.nonOpIncome.map((r) => <PLRow key={r.account_id} label={`　${r.name}（収益）`} amount={r.balance} indent={1} />)}
                  {fs.nonOpExpense.map((r) => <PLRow key={r.account_id} label={`　${r.name}（費用）`} amount={r.balance} indent={1} />)}
                  <PLRow label="経常利益" amount={fs.ordinaryProfit} bold bg />
                </>
              )}

              <tr style={{ background: "#eff6ff" }}>
                <td style={{ fontWeight: 700, fontSize: 15 }}>当期純利益</td>
                <td className="num" style={{ fontWeight: 700, fontSize: 15, color: fs.netIncome >= 0 ? "var(--money-positive)" : "var(--money-negative)" }}>
                  {fs.netIncome < 0 ? "▲" : ""}{fmt(fs.netIncome)}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <KpiCard label="売上高" value={fmt(fs.totalRevenue)} color="#2563EB" />
        <KpiCard label="営業利益" value={fmt(fs.operatingProfit)} color={fs.operatingProfit >= 0 ? "#16a34a" : "#dc2626"} />
        <KpiCard label="当期純利益" value={fmt(fs.netIncome)} color={fs.netIncome >= 0 ? "#16a34a" : "#dc2626"} sub={fs.totalRevenue > 0 ? `利益率 ${((fs.netIncome / fs.totalRevenue) * 100).toFixed(1)}%` : undefined} />
      </div>
    </div>
  );
}

function BSTab({ fs }: { fs: FinancialSummary }) {
  const grouped = (rows: TrialBalanceLine[], label: string) => (
    <>
      <SectionHeader label={label} />
      {rows.map((r) => (
        <tr key={r.account_id}>
          <td style={{ paddingLeft: 32, fontSize: 13 }}>{r.name}</td>
          <td className="num">{fmt(r.balance)}</td>
        </tr>
      ))}
      {rows.length === 0 && <tr><td colSpan={2} style={{ paddingLeft: 32, color: "var(--foreground-500)", fontSize: 12 }}>（なし）</td></tr>}
    </>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <Card title="資産の部">
        <table className="tbl">
          <thead><tr><th>勘定科目</th><th className="num">金額</th></tr></thead>
          <tbody>
            {grouped(fs.assets.filter((r) => r.subcategory === "current_asset" || r.code < "1500"), "流動資産")}
            {grouped(fs.assets.filter((r) => r.subcategory === "fixed_asset" || r.code >= "1500"), "固定資産")}
            <tr style={{ background: "#eff6ff", fontWeight: 700 }}>
              <td>資産合計</td><td className="num">{fmt(fs.totalAssets)}</td>
            </tr>
          </tbody>
        </table>
      </Card>
      <Card title="負債・純資産の部">
        <table className="tbl">
          <thead><tr><th>勘定科目</th><th className="num">金額</th></tr></thead>
          <tbody>
            {grouped(fs.liabilities, "負債")}
            {grouped(fs.equity, "純資産")}
            <tr>
              <td style={{ paddingLeft: 32, fontSize: 13, color: "var(--foreground-600)" }}>当期純利益（P/L）</td>
              <td className="num" style={{ color: fs.netIncome >= 0 ? "var(--money-positive)" : "var(--money-negative)" }}>{fmt(fs.netIncome)}</td>
            </tr>
            <tr style={{ background: "#eff6ff", fontWeight: 700 }}>
              <td>負債・純資産合計</td>
              <td className="num">{fmt(fs.totalLiabilities + fs.totalEquity)}</td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function TBTab({ tb }: { tb: TrialBalanceLine[] }) {
  if (tb.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: 40, color: "var(--foreground-500)" }}>この期間に確定済みの仕訳がありません</div>
      </Card>
    );
  }
  return (
    <Card>
      <table className="tbl">
        <thead>
          <tr>
            <th style={{ width: 80 }}>コード</th>
            <th>勘定科目</th>
            <th style={{ width: 80 }}>種別</th>
            <th className="num">借方合計</th>
            <th className="num">貸方合計</th>
            <th className="num">残高</th>
          </tr>
        </thead>
        <tbody>
          {tb.map((r) => (
            <tr key={r.account_id}>
              <td className="code">{r.code}</td>
              <td>{r.name}</td>
              <td><span className="chip n" style={{ fontSize: 10 }}>{CATEGORY_LABEL[r.category]}</span></td>
              <td className="num">{r.debit > 0 ? fmt(r.debit) : "—"}</td>
              <td className="num">{r.credit > 0 ? fmt(r.credit) : "—"}</td>
              <td className="num" style={{ fontWeight: 600, color: r.balance < 0 ? "var(--money-negative)" : undefined }}>
                {r.balance < 0 ? "▲" : ""}{fmt(r.balance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

const CATEGORY_LABEL: Record<string, string> = {
  asset: "資産", liability: "負債", equity: "純資産", revenue: "収益", expense: "費用",
};

function TaxTab({ taxSummary }: { taxSummary: Record<string, { base: number; tax: number }> }) {
  const cats = Object.keys(taxSummary);
  const totalBase = cats.reduce((s, c) => s + taxSummary[c].base, 0);
  const totalTax = cats.reduce((s, c) => s + taxSummary[c].tax, 0);

  const TAX_RATES: Record<string, number> = { "課税10%": 10, "課税8%": 8 };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
      <Card title="消費税集計（税区分別）">
        {cats.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--foreground-500)" }}>
            <Icon name="FileText" size={28} />
            <div style={{ marginTop: 8 }}>この期間に消費税データがありません</div>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>税区分</th>
                <th className="num">課税標準額（基礎）</th>
                <th className="num">消費税額</th>
                <th className="num">税率</th>
              </tr>
            </thead>
            <tbody>
              {cats.map((cat) => (
                <tr key={cat}>
                  <td>{cat}</td>
                  <td className="num">¥{taxSummary[cat].base.toLocaleString()}</td>
                  <td className="num">¥{taxSummary[cat].tax.toLocaleString()}</td>
                  <td className="num">{TAX_RATES[cat] != null ? `${TAX_RATES[cat]}%` : "—"}</td>
                </tr>
              ))}
              <tr style={{ background: "#eff6ff", fontWeight: 700 }}>
                <td>合計</td>
                <td className="num">¥{totalBase.toLocaleString()}</td>
                <td className="num">¥{totalTax.toLocaleString()}</td>
                <td />
              </tr>
            </tbody>
          </table>
        )}
      </Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <KpiCard label="課税10%消費税" value={`¥${(taxSummary["課税10%"]?.tax ?? 0).toLocaleString()}`} color="#2563EB" />
        <KpiCard label="課税8%消費税" value={`¥${(taxSummary["課税8%"]?.tax ?? 0).toLocaleString()}`} color="#7c3aed" />
        <KpiCard label="消費税合計" value={`¥${totalTax.toLocaleString()}`} color="#16a34a" sub={`課税標準 ¥${totalBase.toLocaleString()}`} />
      </div>
    </div>
  );
}

function KpiCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="kpi">
      <div className="eb">{label}</div>
      <div className="val" style={{ color }}>{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

export default function ReportsClient({
  fs, tb, dateFrom, dateTo, taxSummary,
}: {
  fs: FinancialSummary;
  tb: TrialBalanceLine[];
  dateFrom: string;
  dateTo: string;
  taxSummary: Record<string, { base: number; tax: number }>;
}) {
  const [tab, setTab] = useState<Tab>("pl");

  return (
    <div>
      <div className="page-h">
        <div>
          <div className="breadcrumb">
            <Icon name="Home" size={12} /><span>ホーム</span> / <span style={{ color: "var(--foreground-700)" }}>レポート</span>
          </div>
          <h1 className="h1">財務レポート</h1>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            {dateFrom} 〜 {dateTo}
          </div>
        </div>
        <div className="row">
          <Link href={`/reports?from=${prevYear(dateFrom)}&to=${prevYearEnd(dateTo)}`}>
            <Button variant="bordered" size="sm">前期</Button>
          </Link>
          <Link href={`/reports?from=${prevMonth(dateFrom)}&to=${prevMonthEnd(dateTo)}`}>
            <Button variant="bordered" icon="ChevronLeft" size="sm" />
          </Link>
          <Link href={`/reports?from=${nextMonth(dateFrom)}&to=${nextMonthEnd(dateTo)}`}>
            <Button variant="bordered" icon="ChevronRight" size="sm" />
          </Link>
          <Link href={`/reports?from=${nextYear(dateFrom)}&to=${nextYearEnd(dateTo)}`}>
            <Button variant="bordered" size="sm">翌期</Button>
          </Link>
          <a href={`/api/export/trial-balance?from=${dateFrom}&to=${dateTo}`} download>
            <Button variant="bordered" icon="Download">試算表CSV</Button>
          </a>
          <a href={`/api/export/journal?from=${dateFrom}&to=${dateTo}`} download>
            <Button variant="bordered" icon="Download">仕訳帳CSV</Button>
          </a>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--zinc-200)", marginBottom: 18 }}>
        {([["pl", "損益計算書 (P/L)"], ["bs", "貸借対照表 (B/S)"], ["tb", "試算表"], ["tax", "消費税申告"]] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "10px 16px", fontSize: 13, fontWeight: 500, border: 0, background: "none", cursor: "pointer",
              borderBottom: tab === key ? "2px solid #2563EB" : "2px solid transparent",
              color: tab === key ? "#2563EB" : "var(--foreground-600)",
              fontFamily: "inherit",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "pl" && <PLTab fs={fs} />}
      {tab === "bs" && <BSTab fs={fs} />}
      {tab === "tb" && <TBTab tb={tb} />}
      {tab === "tax" && <TaxTab taxSummary={taxSummary} />}
    </div>
  );
}

// Date helpers
export function prevMonth(from: string) {
  const d = new Date(from); d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7) + "-01";
}
export function prevMonthEnd(to: string) {
  const d = new Date(to); d.setDate(0);
  return d.toISOString().slice(0, 10);
}
export function nextMonth(from: string) {
  const d = new Date(from); d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 7) + "-01";
}
export function nextMonthEnd(to: string) {
  const d = new Date(to); d.setMonth(d.getMonth() + 2, 0);
  return d.toISOString().slice(0, 10);
}
export function prevYear(from: string) {
  const d = new Date(from); d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
}
export function prevYearEnd(to: string) {
  const d = new Date(to); d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
}
export function nextYear(from: string) {
  const d = new Date(from); d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}
export function nextYearEnd(to: string) {
  const d = new Date(to); d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}
