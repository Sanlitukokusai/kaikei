"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import type { Account, Partner } from "@/lib/database.types";
import type { JournalEntryWithLines } from "@/lib/queries";
import { updateJournalEntry, deleteJournalEntry, type JournalLineInput } from "@/app/actions/journal";

type Row = {
  _key: string;
  side: "debit" | "credit";
  account_id: string;
  partner_id: string;
  amount_jpy: number;
  tax_category: string;
  memo: string;
};

const newRow = (side: "debit" | "credit"): Row => ({
  _key: Math.random().toString(36).slice(2),
  side, account_id: "", partner_id: "", amount_jpy: 0, tax_category: "課税10%", memo: "",
});

const TAX_OPTIONS = ["課税10%", "課税8%", "非課税", "不課税", "輸出免税"];

export default function JournalEditForm({
  entry, accounts, partners,
}: {
  entry: JournalEntryWithLines;
  accounts: Account[];
  partners: Partner[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [entryDate, setEntryDate] = useState(entry.entry_date);
  const [voucherNo, setVoucherNo] = useState(entry.voucher_no ?? "");
  const [description, setDescription] = useState(entry.description ?? "");
  const [rows, setRows] = useState<Row[]>(
    entry.lines.map((l) => ({
      _key: l.id,
      side: l.side,
      account_id: l.account_id ?? "",
      partner_id: l.partner_id ?? "",
      amount_jpy: l.amount_jpy,
      tax_category: l.tax_category ?? "課税10%",
      memo: l.memo ?? "",
    }))
  );
  const [error, setError] = useState<string | null>(null);

  const updateRow = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = (side: "debit" | "credit") => setRows((rs) => [...rs, newRow(side)]);
  const removeRow = (i: number) => setRows((rs) => rs.length > 2 ? rs.filter((_, idx) => idx !== i) : rs);

  const totals = useMemo(() => {
    const dr = rows.filter((r) => r.side === "debit").reduce((s, r) => s + (r.amount_jpy || 0), 0);
    const cr = rows.filter((r) => r.side === "credit").reduce((s, r) => s + (r.amount_jpy || 0), 0);
    return { dr, cr, balanced: dr === cr && dr > 0 };
  }, [rows]);

  function submit(status: "draft" | "confirmed") {
    setError(null);
    startTransition(async () => {
      try {
        const lines: JournalLineInput[] = rows
          .filter((r) => r.account_id && r.amount_jpy > 0)
          .map((r) => ({
            side: r.side,
            account_id: r.account_id,
            partner_id: r.partner_id || null,
            amount_jpy: r.amount_jpy,
            tax_category: r.tax_category || null,
            memo: r.memo || null,
          }));
        await updateJournalEntry(entry.id, {
          entry_date: entryDate,
          voucher_no: voucherNo || null,
          description: description || null,
          status,
          lines,
        });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  function handleDelete() {
    if (!confirm("この仕訳を削除しますか？この操作は取り消せません。")) return;
    startTransition(async () => {
      try {
        await deleteJournalEntry(entry.id);
        router.push("/journal");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <div>
      <div className="page-h">
        <div>
          <div className="breadcrumb">
            <Icon name="Home" size={12} /><span>ホーム</span> / <span>仕訳帳</span> / <span style={{ color: "var(--foreground-700)" }}>編集</span>
          </div>
          <h1 className="h1">仕訳を編集</h1>
          {entry.voucher_no && <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{entry.voucher_no}</div>}
        </div>
        <div className="row">
          <Button variant="danger" icon="Trash2" onClick={handleDelete} disabled={isPending || entry.is_locked}>
            削除
          </Button>
          <Button variant="bordered" onClick={() => router.push("/journal")} disabled={isPending}>キャンセル</Button>
          <Button variant="bordered" icon="Save" onClick={() => submit("draft")} disabled={isPending}>下書き保存</Button>
          <Button variant="primary" icon="Check" disabled={!totals.balanced || isPending} onClick={() => submit("confirmed")}>
            {isPending ? "処理中..." : "確定する"}
          </Button>
        </div>
      </div>

      {entry.is_locked && (
        <div className="alert" style={{ background: "#fef9c3", color: "#713f12", marginBottom: 14 }}>
          <Icon name="Lock" size={16} /><span>この仕訳はロックされています。編集・削除できません。</span>
        </div>
      )}

      {error && (
        <div className="alert" style={{ background: "#fdd0df", color: "#920b3a" }}>
          <Icon name="AlertCircle" size={16} /><span>{error}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 14 }}>
        <Card title="基本情報">
          <div className="form-grid">
            <Field label="取引日" required span={3}>
              <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} disabled={entry.is_locked} />
            </Field>
            <Field label="仕訳番号" span={3}>
              <Input value={voucherNo} onChange={(e) => setVoucherNo(e.target.value)} placeholder="自動採番" className="code" disabled={entry.is_locked} />
            </Field>
            <Field label="摘要" span={12}>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} disabled={entry.is_locked} />
            </Field>
          </div>
        </Card>
        <Card title="補助">
          <div style={{ fontSize: 12, color: "var(--foreground-500)" }}>
            <div className="row" style={{ marginBottom: 8 }}>
              <Icon name="Clock" size={13} />作成：{entry.created_at.slice(0, 16).replace("T", " ")}
            </div>
            <div className="row" style={{ marginBottom: 8 }}>
              <Icon name="RefreshCw" size={13} />更新：{entry.updated_at.slice(0, 16).replace("T", " ")}
            </div>
            <div className="row">
              <Icon name="Tag" size={13} />
              ソース：{entry.source_type}
            </div>
          </div>
        </Card>
      </div>

      <div style={{ height: 14 }} />

      <Card title="仕訳明細" action={
        !entry.is_locked && (
          <div className="row">
            <Button variant="bordered" size="sm" icon="Plus" onClick={() => addRow("debit")}>借方を追加</Button>
            <Button variant="bordered" size="sm" icon="Plus" onClick={() => addRow("credit")}>貸方を追加</Button>
          </div>
        )
      }>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 90 }}>区分</th>
              <th>勘定科目</th>
              <th>税区分</th>
              <th className="num">金額</th>
              <th>摘要</th>
              <th style={{ width: 32 }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r._key}>
                <td>
                  <Select value={r.side} onChange={(e) => updateRow(i, { side: e.target.value as "debit" | "credit" })} disabled={entry.is_locked}>
                    <option value="debit">借方</option><option value="credit">貸方</option>
                  </Select>
                </td>
                <td style={{ minWidth: 220 }}>
                  <Select value={r.account_id} onChange={(e) => updateRow(i, { account_id: e.target.value })} disabled={entry.is_locked}>
                    <option value="">勘定科目を選択</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} {a.name}</option>)}
                  </Select>
                </td>
                <td style={{ width: 130 }}>
                  <Select value={r.tax_category} onChange={(e) => updateRow(i, { tax_category: e.target.value })} disabled={entry.is_locked}>
                    {TAX_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </td>
                <td style={{ width: 160 }}>
                  <Input className="right" value={r.amount_jpy || ""} onChange={(e) => updateRow(i, { amount_jpy: Number(e.target.value.replaceAll(",", "")) || 0 })} placeholder="0" disabled={entry.is_locked} />
                </td>
                <td><Input value={r.memo} onChange={(e) => updateRow(i, { memo: e.target.value })} placeholder="補足..." disabled={entry.is_locked} /></td>
                <td>
                  {!entry.is_locked && (
                    <Icon name="Trash2" size={16} style={{ color: "var(--foreground-400)", cursor: "pointer" }} onClick={() => removeRow(i)} />
                  )}
                </td>
              </tr>
            ))}
            <tr style={{ background: totals.balanced ? "#e8faf0" : "#fee7ef", fontWeight: 600 }}>
              <td colSpan={3} style={{ textAlign: "right", color: "var(--foreground-700)" }}>合計</td>
              <td className="num">借 ¥{totals.dr.toLocaleString()} / 貸 ¥{totals.cr.toLocaleString()}</td>
              <td colSpan={2} style={{ color: totals.balanced ? "var(--money-positive)" : "var(--money-negative)", fontSize: 12 }}>
                {totals.balanced
                  ? <><Icon name="CheckCircle" size={14} /> 一致しています</>
                  : `差額: ¥${Math.abs(totals.dr - totals.cr).toLocaleString()}`}
              </td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}
