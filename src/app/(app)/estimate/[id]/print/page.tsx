import { notFound } from "next/navigation";
import { getCompany, getEstimate } from "@/lib/queries";
import PrintButton from "@/app/(app)/invoices/[id]/print/PrintButton";

export const dynamic = "force-dynamic";

const fmt = (n: number) => n.toLocaleString("ja-JP");
const fmtDate = (d: string | null) => d ? d.replaceAll("-", "/") : "—";

export default async function EstimatePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [est, company] = await Promise.all([getEstimate(id), getCompany()]);
  if (!est) notFound();

  const tax10Items = est.items.filter((it) => it.tax_rate === 10);
  const tax8Items = est.items.filter((it) => it.tax_rate === 8);
  const tax0Items = est.items.filter((it) => it.tax_rate === 0);
  const sum10 = tax10Items.reduce((s, it) => s + it.amount, 0);
  const sum8 = tax8Items.reduce((s, it) => s + it.amount, 0);
  const tax10 = Math.floor(sum10 * 0.1);
  const tax8 = Math.floor(sum8 * 0.08);

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
        body { font-family: "Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif; color: #1a1a1a; }
        .invoice-wrap { max-width: 780px; margin: 0 auto; padding: 40px 48px; }
        .print-bar { background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 10px 20px; display: flex; gap: 12px; align-items: center; }
        h1 { font-size: 28px; text-align: center; letter-spacing: 0.2em; margin: 0 0 32px; font-weight: 700; }
        .meta-row { display: flex; justify-content: space-between; margin-bottom: 28px; }
        .to-block { font-size: 15px; }
        .to-block .company { font-size: 22px; font-weight: 700; border-bottom: 2px solid #1a1a1a; padding-bottom: 6px; margin-bottom: 6px; }
        .from-block { text-align: right; font-size: 13px; line-height: 1.7; }
        .from-block .co { font-size: 17px; font-weight: 700; }
        .amount-box { border: 2px solid #1a1a1a; display: inline-block; padding: 8px 24px; margin-bottom: 28px; }
        .amount-box .label { font-size: 11px; color: #666; }
        .amount-box .val { font-size: 28px; font-weight: 700; }
        .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
        .invoice-table th { background: #f1f5f9; padding: 8px 10px; text-align: left; border-bottom: 1px solid #cbd5e1; }
        .invoice-table td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
        .invoice-table .num { text-align: right; font-variant-numeric: tabular-nums; }
        .totals-table { float: right; font-size: 13px; border-collapse: collapse; min-width: 260px; }
        .totals-table td { padding: 5px 10px; }
        .totals-table .num { text-align: right; font-variant-numeric: tabular-nums; }
        .totals-table .total-row td { font-weight: 700; font-size: 15px; border-top: 2px solid #1a1a1a; padding-top: 8px; }
        .tax-note { font-size: 11px; color: #666; margin-top: 4px; }
        .notes-section { margin-top: 32px; font-size: 13px; }
        .clearfix::after { content: ""; display: block; clear: both; }
      `}</style>

      <div className="no-print print-bar">
        <PrintButton />
        <span style={{ fontSize: 13, color: "#64748b" }}>ブラウザの印刷ダイアログからPDFとして保存できます</span>
      </div>

      <div className="invoice-wrap">
        <h1>御　見　積　書</h1>

        <div className="meta-row">
          <div className="to-block">
            <div className="company">{est.partner?.name ?? "（取引先未設定）"} 御中</div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
              件名：{est.subject ?? "—"}
            </div>
            {est.valid_until && (
              <div style={{ fontSize: 12, color: "#666" }}>
                有効期限：{fmtDate(est.valid_until)}
              </div>
            )}
          </div>
          <div className="from-block">
            <div className="co">{company?.name ?? "—"}</div>
            {company?.invoice_reg_no && <div>登録番号：{company.invoice_reg_no}</div>}
            {company?.address && <div>{company.address}</div>}
            <div>見積日：{fmtDate(est.estimate_date)}</div>
            <div>見積番号：{est.estimate_no}</div>
          </div>
        </div>

        <div className="amount-box">
          <div className="label">御見積金額（税込）</div>
          <div className="val">¥{fmt(est.total)} —</div>
        </div>

        <p style={{ fontSize: 13, marginBottom: 20 }}>下記のとおり御見積申し上げます。</p>

        <table className="invoice-table">
          <thead>
            <tr>
              <th>取引日</th>
              <th>品番・品名</th>
              <th className="num">数量</th>
              <th>単位</th>
              <th className="num">単価</th>
              <th>税率</th>
              <th className="num">金額</th>
            </tr>
          </thead>
          <tbody>
            {est.items.map((it) => (
              <tr key={it.id}>
                <td style={{ fontSize: 11 }}>{fmtDate(it.transaction_date)}</td>
                <td>{it.item_name ?? "—"}</td>
                <td className="num">{it.quantity?.toLocaleString() ?? "—"}</td>
                <td>{it.unit ?? "—"}</td>
                <td className="num">{it.unit_price ? fmt(it.unit_price) : "—"}</td>
                <td>{it.tax_rate === 0 ? "非課税" : `${it.tax_rate}%`}</td>
                <td className="num">{fmt(it.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="clearfix">
          <table className="totals-table">
            <tbody>
              <tr><td>小計</td><td className="num">¥{fmt(est.subtotal)}</td></tr>
              {sum10 > 0 && <tr><td>消費税（10%）</td><td className="num">¥{fmt(tax10)}</td></tr>}
              {sum8 > 0 && <tr><td>消費税（8%）</td><td className="num">¥{fmt(tax8)}</td></tr>}
              {tax0Items.length > 0 && <tr><td>非課税</td><td className="num">¥{fmt(tax0Items.reduce((s, i) => s + i.amount, 0))}</td></tr>}
              <tr className="total-row">
                <td>合計（税込）</td>
                <td className="num">¥{fmt(est.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {sum10 > 0 && <div className="tax-note">※ 10%対象：¥{fmt(sum10)}（消費税 ¥{fmt(tax10)}）</div>}
        {sum8 > 0 && <div className="tax-note">※ 8%対象（軽減税率）：¥{fmt(sum8)}（消費税 ¥{fmt(tax8)}）</div>}

        {est.notes && (
          <div className="notes-section">
            <strong>備考</strong>
            <p style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{est.notes}</p>
          </div>
        )}
      </div>
    </>
  );
}
