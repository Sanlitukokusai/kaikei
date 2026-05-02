"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import type { Partner } from "@/lib/database.types";
import type { InvoiceWithItems } from "@/lib/queries";
import { updateInvoice, deleteInvoice, type InvoiceLineInput } from "@/app/actions/invoices";

type LineRow = InvoiceLineInput & { _key: string };

const newRow = (): LineRow => ({
  _key: Math.random().toString(36).slice(2),
  tax_rate: 10, quantity: 0, unit_price: 0, unit: "個",
});

export default function InvoiceEditForm({
  invoice,
  partners,
}: {
  invoice: InvoiceWithItems;
  partners: Partner[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [partnerId, setPartnerId] = useState(invoice.partner_id ?? "");
  const [invoiceNo, setInvoiceNo] = useState(invoice.invoice_no);
  const [invoiceDate, setInvoiceDate] = useState(invoice.invoice_date);
  const [dueDate, setDueDate] = useState(invoice.due_date ?? "");
  const [subject, setSubject] = useState(invoice.subject ?? "");
  const [notes, setNotes] = useState(invoice.notes ?? "");
  const [rows, setRows] = useState<LineRow[]>(
    invoice.items.length > 0
      ? invoice.items.map((it) => ({
          _key: it.id,
          item_name: it.item_name ?? "",
          transaction_date: it.transaction_date ?? "",
          quantity: it.quantity ?? 0,
          unit: it.unit ?? "個",
          unit_price: it.unit_price ?? 0,
          tax_rate: it.tax_rate,
        }))
      : Array.from({ length: 3 }, newRow),
  );

  const updateRow = (i: number, patch: Partial<LineRow>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeRow = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));
  const addRow = () => setRows((rs) => [...rs, newRow()]);

  const totals = useMemo(() => {
    let sub = 0, tax = 0;
    for (const r of rows) {
      const line = Math.round((r.quantity ?? 0) * (r.unit_price ?? 0));
      sub += line;
      tax += Math.floor((line * (r.tax_rate ?? 0)) / 100);
    }
    return { sub, tax, total: sub + tax };
  }, [rows]);

  function onSave() {
    startTransition(async () => {
      const items = rows
        .filter((r) => (r.item_name && r.item_name.trim()) || (r.quantity ?? 0) > 0 || (r.unit_price ?? 0) > 0)
        .map((r) => ({
          item_name: r.item_name ?? null,
          transaction_date: r.transaction_date ?? null,
          quantity: r.quantity ?? null,
          unit: r.unit ?? null,
          unit_price: r.unit_price ?? null,
          tax_rate: r.tax_rate ?? 10,
        }));
      try {
        await updateInvoice(invoice.id, {
          invoice_no: invoiceNo,
          invoice_date: invoiceDate,
          due_date: dueDate || null,
          partner_id: partnerId || null,
          subject: subject || null,
          notes: notes || null,
          items,
        });
      } catch (e: unknown) {
        alert("保存に失敗しました：" + (e instanceof Error ? e.message : String(e)));
      }
    });
  }

  function onDelete() {
    if (!confirm("この請求書を削除しますか？")) return;
    startTransition(async () => {
      try {
        await deleteInvoice(invoice.id);
        router.push("/invoices");
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <div className="yc-create">
      <div className="yc-create-header">
        <div>
          <div className="breadcrumb">
            <Icon name="Home" size={12} />
            <Link href="/invoices" style={{ color: "inherit" }}>請求書</Link>
            {" / "}
            <span style={{ color: "var(--foreground-700)" }}>{invoice.invoice_no}</span>
          </div>
          <h1 className="yc-h1" style={{ marginBottom: 0 }}>請求書の編集</h1>
        </div>
        <div className="row">
          <Link href={`/invoices/${invoice.id}/print`} target="_blank">
            <Button variant="bordered" icon="Printer">PDF印刷</Button>
          </Link>
          <Button variant="danger" icon="Trash2" onClick={onDelete} disabled={isPending}>削除</Button>
        </div>
      </div>

      <div className="yc-create-body">
        <div className="yc-left">
          <div className="yc-form-block">
            <div className="yc-form-row">
              <div className="yc-form-col">
                <h3 className="yc-h3">請求先情報</h3>
                <Field label="取引先名" span={12}>
                  <Select value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
                    <option value="">取引先を選択してください</option>
                    {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Select>
                </Field>
                <h3 className="yc-h3" style={{ marginTop: 18 }}>請求書情報</h3>
                <div className="yc-2col">
                  <Field label="請求日" span={12}>
                    <Input value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                  </Field>
                  <Field label="支払期限" span={12}>
                    <Input placeholder="yyyy-mm-dd" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </Field>
                </div>
                <Field label="請求書番号" span={12}>
                  <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
                </Field>
                <Field label="件名" span={12}>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value.slice(0, 70))} />
                </Field>
              </div>
            </div>

            <div className="yc-line-block">
              <table className="yc-line-table">
                <thead>
                  <tr>
                    <th></th><th>取引日</th><th>品番・品名</th><th className="num">数量</th>
                    <th>単位</th><th className="num">単価</th><th>消費税率</th>
                    <th className="num">金額</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const amt = Math.round((r.quantity ?? 0) * (r.unit_price ?? 0));
                    return (
                      <tr key={r._key}>
                        <td className="yc-grip">⋮⋮</td>
                        <td>
                          <Input
                            value={r.transaction_date ?? ""}
                            onChange={(e) => updateRow(i, { transaction_date: e.target.value })}
                            placeholder="yyyy-mm-dd"
                          />
                        </td>
                        <td><Input value={r.item_name ?? ""} onChange={(e) => updateRow(i, { item_name: e.target.value })} /></td>
                        <td><Input className="right" value={r.quantity ?? 0} onChange={(e) => updateRow(i, { quantity: Number(e.target.value) || 0 })} /></td>
                        <td><Input value={r.unit ?? ""} onChange={(e) => updateRow(i, { unit: e.target.value })} /></td>
                        <td><Input className="right" value={r.unit_price ?? 0} onChange={(e) => updateRow(i, { unit_price: Number(e.target.value) || 0 })} /></td>
                        <td>
                          <Select value={String(r.tax_rate ?? 10)} onChange={(e) => updateRow(i, { tax_rate: Number(e.target.value) })}>
                            <option value="10">10%</option>
                            <option value="8">8%</option>
                            <option value="0">非課税</option>
                          </Select>
                        </td>
                        <td className="num">{amt ? amt.toLocaleString() : "　"}</td>
                        <td><Icon name="X" size={14} className="yc-x" onClick={() => removeRow(i)} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="yc-line-foot">
                <div>
                  <button type="button" className="yc-light-btn" onClick={addRow}>
                    <Icon name="Plus" size={13} />行を追加
                  </button>
                </div>
                <table className="yc-totals-mini">
                  <tbody>
                    <tr><td>小計</td><td className="num">{totals.sub.toLocaleString()}</td></tr>
                    <tr><td>消費税</td><td className="num">{totals.tax.toLocaleString()}</td></tr>
                    <tr><td>合計</td><td className="num">{totals.total.toLocaleString()}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="yc-section">
              <Field label="備考" span={12}>
                <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 1000))} />
              </Field>
            </div>
          </div>
        </div>

        <div className="yc-right">
          <div className="yc-preview">
            <h2 className="yc-preview-title">請求書</h2>
            <div className="yc-preview-head">
              <div style={{ fontSize: 11, color: "#64748b" }}>{invoiceDate.replaceAll("-", "/")}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>請求書番号：{invoiceNo}</div>
            </div>
            <table className="yc-preview-table">
              <thead><tr><th>品番・品名</th><th>数量</th><th>単価</th><th>金額</th></tr></thead>
              <tbody>
                {rows.slice(0, 6).map((r, i) => {
                  const amt = Math.round((r.quantity ?? 0) * (r.unit_price ?? 0));
                  return (
                    <tr key={i}>
                      <td>{r.item_name || "　"}</td>
                      <td>{r.quantity || "　"}</td>
                      <td>{r.unit_price ? r.unit_price.toLocaleString() : "　"}</td>
                      <td>{amt ? amt.toLocaleString() : "　"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="yc-preview-totals">
              <table className="yc-preview-summary">
                <tbody>
                  <tr><td>小計</td><td className="num">{totals.sub.toLocaleString()}</td></tr>
                  <tr><td>消費税</td><td className="num">{totals.tax.toLocaleString()}</td></tr>
                  <tr className="total"><td>合計</td><td className="num">{totals.total.toLocaleString()}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="yc-footer">
        <div className="yc-footer-totals">
          <span>小計 <strong>{totals.sub.toLocaleString()}円</strong></span>
          <span>消費税 <strong>{totals.tax.toLocaleString()}円</strong></span>
          <span className="big">合計 <strong>{totals.total.toLocaleString()}円</strong></span>
        </div>
        <button type="button" className="yc-light-btn" onClick={() => router.push("/invoices")} disabled={isPending}>
          キャンセル
        </button>
        <button type="button" className="yc-primary-btn lg" onClick={onSave} disabled={isPending}>
          {isPending ? "保存中..." : "変更を保存"}
        </button>
      </div>
    </div>
  );
}
