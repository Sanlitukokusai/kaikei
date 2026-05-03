"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { Field, Input, Select, Textarea } from "@/components/ui";
import type { Partner } from "@/lib/database.types";
import { createInvoice, type InvoiceLineInput } from "@/app/actions/invoices";

type LineRow = InvoiceLineInput & { _key: string };

const newRow = (): LineRow => ({ _key: Math.random().toString(36).slice(2), tax_rate: 10, quantity: 0, unit_price: 0, unit: "個" });

export default function InvoiceForm({
  partners,
  defaultCompanyName = "",
  defaultRegNo = "",
}: {
  partners: Partner[];
  defaultCompanyName?: string;
  defaultRegNo?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<"info" | "tax">("info");

  const today = new Date();
  const yyyymmdd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;

  const [partnerId, setPartnerId] = useState<string>("");
  const [invoiceNo, setInvoiceNo] = useState<string>(`${yyyymmdd}-001`);
  const [invoiceDate, setInvoiceDate] = useState<string>(today.toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>(defaultCompanyName);
  const [regNo, setRegNo] = useState<string>(defaultRegNo);
  const [rows, setRows] = useState<LineRow[]>(() => Array.from({ length: 5 }, newRow));

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

  function onSubmit() {
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
        await createInvoice({
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

  return (
    <div className="yc-create">
      <div className="yc-create-header">
        <h1 className="yc-h1" style={{ marginBottom: 0 }}>請求書の新規作成</h1>
      </div>

      <div className="yc-create-body">
        <div className="yc-left">
          <div className="yc-tabs">
            <span className={`yc-tab ${tab === "info" ? "active" : ""}`} onClick={() => setTab("info")}>請求書の情報</span>
            <span className={`yc-tab ${tab === "tax" ? "active" : ""}`} onClick={() => setTab("tax")}>課税設定</span>
          </div>

          <div className="yc-form-block">
            <div className="yc-form-row">
              <div className="yc-form-col">
                <h3 className="yc-h3">請求先情報</h3>
                <Field label={<>取引先名 <span className="yc-req">(必須)</span> <span className="yc-help">?</span></>} span={12}>
                  <Select value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
                    <option value="">取引先を選択してください</option>
                    {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Select>
                </Field>
                <h3 className="yc-h3" style={{ marginTop: 18 }}>請求書情報</h3>
                <div className="yc-2col">
                  <Field label={<>請求日 <span className="yc-req">(必須)</span></>} span={12}>
                    <div className="yc-date"><Input value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} /><Icon name="Calendar" size={14} /></div>
                  </Field>
                  <Field label="お支払期限" span={12}>
                    <div className="yc-date"><Input placeholder="yyyy-mm-dd" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /><Icon name="Calendar" size={14} /></div>
                  </Field>
                </div>
                <Field label={<>請求書番号 <span className="yc-req">(必須)</span></>} span={12}>
                  <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
                </Field>
                <Field label="件名" span={12} hint={`${subject.length}/70`}>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value.slice(0, 70))} />
                </Field>
              </div>

              <div className="yc-form-col">
                <h3 className="yc-h3">請求元情報</h3>
                <Field label={<>自社名 <span className="yc-req">(必須)</span></>} span={12}>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </Field>
                <Field label="適格請求書発行事業者の登録番号" span={12} hint="「T」+ 13桁の数字を入力します。">
                  <Input value={regNo} onChange={(e) => setRegNo(e.target.value)} />
                </Field>
              </div>
            </div>

            <div className="yc-line-block">
              <div className="yc-line-toggle">
                <Icon name="Calendar" size={14} /><span>取引日を記入</span>
                <span className="yc-switch on"><span className="thumb" /></span>
              </div>

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
                          <div className="yc-date small">
                            <Input value={r.transaction_date ?? ""} onChange={(e) => updateRow(i, { transaction_date: e.target.value })} placeholder="yyyy-mm-dd" />
                            <Icon name="Calendar" size={12} />
                          </div>
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
                  <button type="button" className="yc-light-btn" onClick={addRow}><Icon name="Plus" size={13} />行を追加</button>
                  <div className="yc-line-help">最大80行まで追加できます。</div>
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
              <Field label="備考" span={12} hint={`${notes.length}/1000`}>
                <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 1000))} />
              </Field>
            </div>
          </div>
        </div>

        <div className="yc-right">
          <div className="yc-template-row">
            <span style={{ fontSize: 13 }}>請求書のテンプレート</span>
            <Select defaultValue="standard" style={{ width: 200 }}><option value="standard">標準</option><option>ロゴ付</option></Select>
          </div>

          <div className="yc-preview">
            <div className="yc-preview-head">
              <div style={{ fontSize: 11, color: "#64748b" }}>{invoiceDate.replaceAll("-", "/")}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>請求書番号：{invoiceNo}</div>
            </div>
            <h2 className="yc-preview-title">請求書</h2>
            <div className="yc-preview-meta">
              <div>
                <div className="yc-preview-line" />
                <div style={{ marginTop: 12, fontSize: 12 }}>下記のとおりご請求申し上げます。</div>
                <div style={{ marginTop: 14, fontSize: 13 }}>
                  <div style={{ color: "#64748b", fontSize: 11 }}>ご請求金額</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, borderBottom: "1px solid #94a3b8", paddingBottom: 4, marginTop: 2 }}>
                    <span style={{ fontSize: 22, fontWeight: 700 }}>¥{totals.total.toLocaleString()}-</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right", fontSize: 11, lineHeight: 1.6 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{companyName}</div>
                {regNo && <div>登録番号：{regNo}</div>}
              </div>
            </div>

            <table className="yc-preview-table">
              <thead><tr><th>品番・品名</th><th>数量</th><th>単価</th><th>金額</th></tr></thead>
              <tbody>
                {rows.slice(0, 5).map((r, i) => {
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
              <div className="yc-tax-row"><span>10%対象</span><span>{totals.sub.toLocaleString()}</span><span>消費税</span><span>{totals.tax.toLocaleString()}</span></div>
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
        <button type="button" className="yc-light-btn" onClick={() => router.push("/invoices")} disabled={isPending}>キャンセル</button>
        <button type="button" className="yc-primary-btn lg" onClick={onSubmit} disabled={isPending}>
          {isPending ? "保存中..." : "請求書を保存"}
        </button>
      </div>
    </div>
  );
}
