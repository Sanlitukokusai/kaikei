"use client";
import { useState, useTransition } from "react";
import Icon from "@/components/Icon";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import type { Company } from "@/lib/database.types";
import { updateCompany } from "@/app/actions/settings";

const LEGAL_FORMS = [
  { value: "llc", label: "合同会社 (LLC)" },
  { value: "kk", label: "株式会社 (KK)" },
  { value: "sole", label: "個人事業主" },
  { value: "other", label: "その他" },
] as const;

const TAX_METHODS = [
  { value: "general", label: "原則課税" },
  { value: "simple", label: "簡易課税" },
  { value: "two_percent", label: "2割特例" },
  { value: "exempt", label: "免税事業者" },
] as const;

export default function SettingsClient({ company }: { company: Company }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(company.name);
  const [nameKana, setNameKana] = useState(company.name_kana ?? "");
  const [legalForm, setLegalForm] = useState(company.legal_form);
  const [invoiceRegNo, setInvoiceRegNo] = useState(company.invoice_reg_no ?? "");
  const [corporateNo, setCorporateNo] = useState(company.corporate_number ?? "");
  const [postalCode, setPostalCode] = useState(company.postal_code ?? "");
  const [address, setAddress] = useState(company.address ?? "");
  const [phone, setPhone] = useState(company.phone ?? "");
  const [email, setEmail] = useState(company.email ?? "");
  const [representative, setRepresentative] = useState(company.representative ?? "");
  const [taxMethod, setTaxMethod] = useState<NonNullable<Company["tax_method"]>>(company.tax_method ?? "general");
  const [fiscalMonth, setFiscalMonth] = useState(company.fiscal_year_start_month);

  function handleSave() {
    setError(null);
    setSuccess(false);
    if (!name.trim()) { setError("会社名は必須です"); return; }
    startTransition(async () => {
      try {
        await updateCompany({
          name, name_kana: nameKana || null, legal_form: legalForm,
          invoice_reg_no: invoiceRegNo || null, corporate_number: corporateNo || null,
          postal_code: postalCode || null, address: address || null,
          phone: phone || null, email: email || null,
          representative: representative || null,
          tax_method: taxMethod as Company["tax_method"],
          fiscal_year_start_month: fiscalMonth,
        });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
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
            <Icon name="Home" size={12} /><span>ホーム</span> / <span style={{ color: "var(--foreground-700)" }}>設定</span>
          </div>
          <h1 className="h1">会社設定</h1>
        </div>
        <Button variant="primary" icon="Save" onClick={handleSave} disabled={isPending}>
          {isPending ? "保存中..." : "変更を保存"}
        </Button>
      </div>

      {success && (
        <div className="alert" style={{ background: "#d1f4e0", color: "#0e793c", marginBottom: 14 }}>
          <Icon name="CheckCircle" size={16} /><span>保存しました</span>
        </div>
      )}
      {error && (
        <div className="alert" style={{ background: "#fdd0df", color: "#920b3a", marginBottom: 14 }}>
          <Icon name="AlertCircle" size={16} /><span>{error}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card title="基本情報">
          <div className="form-grid">
            <Field label="会社名" required span={12}>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="株式会社○○" />
            </Field>
            <Field label="フリガナ" span={12}>
              <Input value={nameKana} onChange={(e) => setNameKana(e.target.value)} placeholder="カブシキガイシャ○○" />
            </Field>
            <Field label="法人形態" span={6}>
              <Select value={legalForm} onChange={(e) => setLegalForm(e.target.value as Company["legal_form"])}>
                {LEGAL_FORMS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </Select>
            </Field>
            <Field label="代表者名" span={6}>
              <Input value={representative} onChange={(e) => setRepresentative(e.target.value)} placeholder="山田 太郎" />
            </Field>
            <Field label="法人番号（13桁）" span={12}>
              <Input value={corporateNo} onChange={(e) => setCorporateNo(e.target.value)} placeholder="1234567890123" className="code" />
            </Field>
          </div>
        </Card>

        <Card title="連絡先">
          <div className="form-grid">
            <Field label="郵便番号" span={4}>
              <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="000-0000" />
            </Field>
            <Field label="住所" span={8}>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="東京都渋谷区..." />
            </Field>
            <Field label="電話番号" span={6}>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03-0000-0000" />
            </Field>
            <Field label="メールアドレス" span={6}>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@example.com" />
            </Field>
          </div>
        </Card>

        <Card title="税務・会計設定">
          <div className="form-grid">
            <Field label="適格請求書登録番号" span={12}>
              <Input value={invoiceRegNo} onChange={(e) => setInvoiceRegNo(e.target.value)} placeholder="T1234567890123" className="code" />
            </Field>
            <Field label="消費税課税方式" span={6}>
              <Select value={taxMethod} onChange={(e) => setTaxMethod(e.target.value as NonNullable<Company["tax_method"]>)}>
                {TAX_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </Select>
            </Field>
            <Field label="事業年度開始月" span={6}>
              <Select value={fiscalMonth} onChange={(e) => setFiscalMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{m}月</option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>

        <Card title="プラン">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "#eff6ff", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontWeight: 600, color: "#1d4ed8" }}>スタータープラン</div>
              <div style={{ fontSize: 12, color: "var(--foreground-500)", marginTop: 4 }}>
                仕訳 · 請求書 · 銀行連携 · OCR · 財務レポート
              </div>
            </div>
            <div style={{ fontSize: 12, color: "var(--foreground-500)" }}>
              <Icon name="Users" size={13} /> ユーザー: 1名 / 上限3名
            </div>
          </div>
        </Card>

        <Card title="ユーザー管理・権限">
          <div style={{ padding: "8px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--zinc-100)" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="User" size={16} style={{ color: "#2563EB" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>管理者</div>
                <div style={{ fontSize: 12, color: "var(--foreground-500)" }}>{company.email ?? "—"}</div>
              </div>
              <span style={{ fontSize: 11, background: "#eff6ff", color: "#1d4ed8", borderRadius: 6, padding: "2px 8px" }}>管理者</span>
            </div>
            <div style={{ marginTop: 14, padding: "12px", background: "var(--zinc-50)", borderRadius: 8, fontSize: 13, color: "var(--foreground-500)" }}>
              <Icon name="Lock" size={13} style={{ marginRight: 6 }} />
              マルチユーザー機能（招待・権限管理）はビジネスプランで利用可能です。
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
