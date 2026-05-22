import Link from "next/link";
import Icon from "@/components/Icon";
import { Button, Card, Chip, Input, Select } from "@/components/ui";
import { listJournalEntries } from "@/lib/queries";
import type { JournalEntry } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const statusTone: Record<JournalEntry["status"], "s" | "w" | "i" | "d"> = {
  confirmed: "s", pending: "w", draft: "i", rejected: "d",
};
const statusLabel: Record<JournalEntry["status"], string> = {
  confirmed: "確定済", pending: "確認待ち", draft: "下書き", rejected: "差戻し",
};
const fmtDate = (d: string) => d.replaceAll("-", "/");

export default async function JournalListPage() {
  const entries = await listJournalEntries();
  const total = entries.length;

  // Counts per status
  const counts = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="page-h">
        <div>
          <div className="breadcrumb"><Icon name="Home" size={12} /><span>ホーム</span> / <span style={{ color: "var(--foreground-700)" }}>仕訳帳</span></div>
          <h1 className="h1">仕訳帳</h1>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>全 {total}件</div>
        </div>
        <div className="row">
          <Button variant="bordered" icon="Upload">CSVインポート</Button>
          <Button variant="bordered" icon="Download">エクスポート</Button>
          <Link href="/journal/new"><Button variant="primary" icon="Plus">仕訳を追加</Button></Link>
        </div>
      </div>

      <Card className="tight" style={{ marginBottom: 12 }}>
        <div className="toolbar" style={{ margin: 0 }}>
          <div className="tabs">
            <span className="tb-tab active">すべて<span style={{ marginLeft: 6, fontSize: 10, color: "var(--foreground-400)" }}>{total}</span></span>
            <span className="tb-tab">確定済<span style={{ marginLeft: 6, fontSize: 10, color: "var(--foreground-400)" }}>{counts["confirmed"] ?? 0}</span></span>
            <span className="tb-tab">確認待ち<span style={{ marginLeft: 6, fontSize: 10, color: "var(--foreground-400)" }}>{counts["pending"] ?? 0}</span></span>
            <span className="tb-tab">下書き<span style={{ marginLeft: 6, fontSize: 10, color: "var(--foreground-400)" }}>{counts["draft"] ?? 0}</span></span>
            <span className="tb-tab">差戻し<span style={{ marginLeft: 6, fontSize: 10, color: "var(--foreground-400)" }}>{counts["rejected"] ?? 0}</span></span>
          </div>
          <div style={{ flex: 1 }} />
          <Select style={{ width: 160 }} defaultValue="all"><option value="all">勘定科目: すべて</option></Select>
          <div style={{ position: "relative" }}>
            <Icon name="Search" size={14} style={{ position: "absolute", left: 10, top: 12, opacity: 0.6 }} />
            <Input placeholder="検索..." style={{ paddingLeft: 32, width: 220 }} />
          </div>
        </div>
      </Card>

      <Card className="tight">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 32 }}><input type="checkbox" /></th>
              <th>日付</th>
              <th>仕訳番号</th>
              <th>摘要</th>
              <th>借方科目</th>
              <th>貸方科目</th>
              <th>税区分</th>
              <th className="num">金額</th>
              <th>状態</th>
              <th style={{ width: 32 }} />
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const dr = e.lines.find((l) => l.side === "debit");
              const cr = e.lines.find((l) => l.side === "credit");
              const total = e.lines.filter((l) => l.side === "debit").reduce((s, l) => s + l.amount_jpy, 0);
              return (
                <tr key={e.id}>
                  <td><input type="checkbox" /></td>
                  <td>{fmtDate(e.entry_date)}</td>
                  <td><span className="code">{e.voucher_no ?? "—"}</span></td>
                  <td style={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.description ?? "—"}</td>
                  <td>{dr?.account?.name ?? "—"}</td>
                  <td>{cr?.account?.name ?? "—"}</td>
                  <td><Chip tone="n" dot={false}>{dr?.tax_category ?? cr?.tax_category ?? "—"}</Chip></td>
                  <td className="num">¥{total.toLocaleString()}</td>
                  <td><Chip tone={statusTone[e.status]}>{statusLabel[e.status]}</Chip></td>
                  <td>
                    <Link href={`/journal/${e.id}`}>
                      <Icon name="Pencil" size={15} style={{ color: "var(--foreground-400)", cursor: "pointer" }} />
                    </Link>
                  </td>
                </tr>
              );
            })}
            {entries.length === 0 && (
              <tr><td colSpan={10} style={{ textAlign: "center", padding: 32, color: "var(--foreground-500)" }}>まだ仕訳がありません</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
