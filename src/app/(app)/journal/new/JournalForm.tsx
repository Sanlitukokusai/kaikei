"use client";
import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import type { Account, Partner } from "@/lib/database.types";
import { createJournalEntry, type JournalLineInput } from "@/app/actions/journal";
import { ocrReceipt, type OcrResult } from "@/app/actions/ocr";

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

type OcrState = "idle" | "scanning" | "done" | "error";

export default function JournalForm({ accounts, partners }: { accounts: Account[]; partners: Partner[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);
  const fileRef = useRef<HTMLInputElement>(null);

  const [entryDate, setEntryDate] = useState(today);
  const [voucherNo, setVoucherNo] = useState("");
  const [partnerId, setPartnerId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [rows, setRows] = useState<Row[]>([newRow("debit"), newRow("credit")]);
  const [error, setError] = useState<string | null>(null);

  const [ocrState, setOcrState] = useState<OcrState>("idle");
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const updateRow = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = (side: "debit" | "credit") => setRows((rs) => [...rs, newRow(side)]);
  const removeRow = (i: number) => setRows((rs) => (rs.length > 2 ? rs.filter((_, idx) => idx !== i) : rs));

  const totals = useMemo(() => {
    const dr = rows.filter((r) => r.side === "debit").reduce((s, r) => s + (r.amount_jpy || 0), 0);
    const cr = rows.filter((r) => r.side === "credit").reduce((s, r) => s + (r.amount_jpy || 0), 0);
    return { dr, cr, balanced: dr === cr && dr > 0 };
  }, [rows]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }

    setOcrState("scanning");
    setOcrError(null);
    setOcrResult(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await ocrReceipt(fd);
      setOcrResult(result);
      setOcrState("done");

      if (result.entry_date) setEntryDate(result.entry_date);
      if (result.description) setDescription(result.description);
      if (result.tax_rate) {
        setRows((rs) => rs.map((r) => ({ ...r, tax_category: result.tax_rate ?? r.tax_category })));
      }
      if (result.total_amount && result.total_amount > 0) {
        setRows((rs) => rs.map((r, i) => i === 0 ? { ...r, amount_jpy: result.total_amount! } : r));
        setRows((rs) => rs.map((r, i) => i === 1 ? { ...r, amount_jpy: result.total_amount! } : r));
      }
    } catch (err: unknown) {
      setOcrState("error");
      setOcrError(err instanceof Error ? err.message : "OCRに失敗しました");
    }
  }, []);

  const applyOcr = () => {
    if (!ocrResult) return;
    if (ocrResult.entry_date) setEntryDate(ocrResult.entry_date);
    if (ocrResult.description) setDescription(ocrResult.description);
    if (ocrResult.total_amount && ocrResult.total_amount > 0) {
      setRows((rs) => rs.map((r, i) => ({
        ...r,
        amount_jpy: i === 0 || i === 1 ? ocrResult.total_amount! : r.amount_jpy,
        tax_category: ocrResult.tax_rate ?? r.tax_category,
      })));
    }
  };

  function submit(status: "draft" | "confirmed") {
    setError(null);
    startTransition(async () => {
      try {
        const lines: JournalLineInput[] = rows
          .filter((r) => r.account_id && r.amount_jpy > 0)
          .map((r) => ({
            side: r.side,
            account_id: r.account_id,
            partner_id: r.partner_id || partnerId || null,
            amount_jpy: r.amount_jpy,
            tax_category: r.tax_category || null,
            memo: r.memo || null,
          }));
        await createJournalEntry({
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

  return (
    <div>
      <div className="page-h">
        <div>
          <div className="breadcrumb">
            <Icon name="Home" size={12} /><span>ホーム</span> / <span>仕訳帳</span> / <span style={{ color: "var(--foreground-700)" }}>新規仕訳</span>
          </div>
          <h1 className="h1">仕訳を追加</h1>
        </div>
        <div className="row">
          <Button variant="bordered" onClick={() => router.push("/journal")} disabled={isPending}>キャンセル</Button>
          <Button variant="bordered" icon="Save" onClick={() => submit("draft")} disabled={isPending}>下書き保存</Button>
          <Button variant="primary" icon="Check" disabled={!totals.balanced || isPending} onClick={() => submit("confirmed")}>
            {isPending ? "処理中..." : "確定する"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="alert" style={{ background: "#fdd0df", color: "#920b3a" }}>
          <Icon name="AlertCircle" size={16} /><span>{error}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 14 }}>
        <Card title="基本情報">
          <div className="form-grid">
            <Field label="取引日" required span={3}>
              <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
            </Field>
            <Field label="仕訳番号" span={3}>
              <Input value={voucherNo} onChange={(e) => setVoucherNo(e.target.value)} placeholder="自動採番" className="code" />
            </Field>
            <Field label="取引先" span={6}>
              <Select value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
                <option value="">(なし)</option>
                {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </Field>
            <Field label="摘要" span={12}>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="例：株式会社○○ — ○月分売上" />
            </Field>
          </div>
        </Card>
        <Card title="領収書・請求書">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          {previewUrl && ocrState !== "idle" ? (
            <div style={{ marginBottom: 10 }}>
              <img src={previewUrl} alt="receipt preview" style={{ width: "100%", borderRadius: 8, maxHeight: 160, objectFit: "contain", background: "var(--zinc-50)", border: "1px solid var(--zinc-200)" }} />
            </div>
          ) : (
            <div
              style={{ border: "1.5px dashed var(--zinc-300)", borderRadius: 10, padding: "18px 14px", textAlign: "center", color: "var(--foreground-500)", fontSize: 12, cursor: "pointer", transition: "border-color .15s" }}
              onClick={() => fileRef.current?.click()}
            >
              <Icon name="UploadCloud" size={22} />
              <div style={{ marginTop: 6, fontWeight: 500 }}>領収書・請求書をアップロード</div>
              <div style={{ marginTop: 2 }}>JPEG · PNG · WebP · PDF（5MB以内）</div>
            </div>
          )}

          {ocrState === "scanning" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--zinc-50)", borderRadius: 8, fontSize: 12, color: "var(--foreground-600)" }}>
              <Icon name="Sparkles" size={14} style={{ color: "var(--primary)", animation: "spin 1.2s linear infinite" }} />
              <span>AIがスキャン中...</span>
            </div>
          )}

          {ocrState === "done" && ocrResult && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 12px", fontSize: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontWeight: 600, color: "#166534" }}>
                <Icon name="CheckCircle" size={13} />
                OCR完了（信頼度 {Math.round((ocrResult.confidence ?? 0) * 100)}%）
              </div>
              {ocrResult.vendor_name && <OcrRow label="取引先" value={ocrResult.vendor_name} />}
              {ocrResult.entry_date && <OcrRow label="日付" value={ocrResult.entry_date} />}
              {ocrResult.total_amount != null && <OcrRow label="合計" value={`¥${ocrResult.total_amount.toLocaleString()}`} />}
              {ocrResult.tax_amount != null && <OcrRow label="消費税" value={`¥${ocrResult.tax_amount.toLocaleString()}`} />}
              {ocrResult.tax_rate && <OcrRow label="税区分" value={ocrResult.tax_rate} />}
              {ocrResult.registration_no && <OcrRow label="登録番号" value={ocrResult.registration_no} />}
              <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                <Button variant="primary" size="sm" icon="ArrowRight" onClick={applyOcr}>仕訳に反映</Button>
                <Button variant="light" size="sm" onClick={() => fileRef.current?.click()}>撮り直す</Button>
              </div>
            </div>
          )}

          {ocrState === "error" && (
            <div style={{ background: "#fdd0df", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#920b3a" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, fontWeight: 600 }}>
                <Icon name="AlertCircle" size={13} />OCRエラー
              </div>
              <div>{ocrError}</div>
              <div style={{ marginTop: 8 }}>
                <Button variant="light" size="sm" onClick={() => { setOcrState("idle"); setPreviewUrl(null); fileRef.current?.click(); }}>再試行</Button>
              </div>
            </div>
          )}

          {ocrState === "idle" && (
            <>
              <div style={{ height: 12 }} />
              <Field label="部門" span={12}><Select><option>本社</option></Select></Field>
              <div style={{ height: 12 }} />
              <Field label="プロジェクト" span={12}><Select><option>(なし)</option></Select></Field>
            </>
          )}
        </Card>
      </div>

      <div style={{ height: 14 }} />

      <Card title="仕訳明細" action={
        <div className="row">
          <Button variant="bordered" size="sm" icon="Plus" onClick={() => addRow("debit")}>借方を追加</Button>
          <Button variant="bordered" size="sm" icon="Plus" onClick={() => addRow("credit")}>貸方を追加</Button>
        </div>
      }>
        <table className="tbl" style={{ borderRadius: 8 }}>
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
                  <Select value={r.side} onChange={(e) => updateRow(i, { side: e.target.value as "debit" | "credit" })}>
                    <option value="debit">借方</option><option value="credit">貸方</option>
                  </Select>
                </td>
                <td style={{ minWidth: 220 }}>
                  <Select value={r.account_id} onChange={(e) => updateRow(i, { account_id: e.target.value })}>
                    <option value="">勘定科目を選択</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} {a.name}</option>)}
                  </Select>
                </td>
                <td style={{ width: 130 }}>
                  <Select value={r.tax_category} onChange={(e) => updateRow(i, { tax_category: e.target.value })}>
                    {TAX_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </td>
                <td style={{ width: 160 }}>
                  <Input className="right" value={r.amount_jpy || ""} onChange={(e) => updateRow(i, { amount_jpy: Number(e.target.value.replaceAll(",", "")) || 0 })} placeholder="0" />
                </td>
                <td><Input value={r.memo} onChange={(e) => updateRow(i, { memo: e.target.value })} placeholder="補足..." /></td>
                <td><Icon name="Trash2" size={16} style={{ color: "var(--foreground-400)", cursor: "pointer" }} onClick={() => removeRow(i)} /></td>
              </tr>
            ))}
            <tr style={{ background: totals.balanced ? "#e8faf0" : "#fee7ef", fontWeight: 600 }}>
              <td colSpan={3} style={{ textAlign: "right", color: "var(--foreground-700)" }}>合計</td>
              <td className="num">借 ¥{totals.dr.toLocaleString()} / 貸 ¥{totals.cr.toLocaleString()}</td>
              <td colSpan={2} style={{ color: totals.balanced ? "var(--money-positive)" : "var(--money-negative)", fontSize: 12 }}>
                {totals.balanced
                  ? <><Icon name="CheckCircle" size={14} /> 借方と貸方が一致しています</>
                  : `差額: ¥${Math.abs(totals.dr - totals.cr).toLocaleString()}`}
              </td>
            </tr>
          </tbody>
        </table>
      </Card>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function OcrRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 3 }}>
      <span style={{ color: "var(--foreground-500)", minWidth: 52 }}>{label}</span>
      <span style={{ fontWeight: 500, color: "#14532d" }}>{value}</span>
    </div>
  );
}
