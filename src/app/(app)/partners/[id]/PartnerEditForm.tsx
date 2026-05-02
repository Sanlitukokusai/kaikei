"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import type { Partner } from "@/lib/database.types";
import { updatePartner, deletePartner } from "@/app/actions/partners";

export default function PartnerEditForm({ partner }: { partner: Partner }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(partner.name);
  const [nameKana, setNameKana] = useState(partner.name_kana ?? "");
  const [kind, setKind] = useState(partner.kind);
  const [invoiceRegNo, setInvoiceRegNo] = useState(partner.invoice_reg_no ?? "");
  const [phone, setPhone] = useState(partner.phone ?? "");
  const [email, setEmail] = useState(partner.email ?? "");
  const [address, setAddress] = useState(partner.address ?? "");

  function handleSave() {
    setError(null);
    if (!name.trim()) { setError("取引先名は必須です"); return; }
    startTransition(async () => {
      try {
        await updatePartner(partner.id, {
          name, name_kana: nameKana || null, kind,
          invoice_reg_no: invoiceRegNo || null,
          phone: phone || null, email: email || null, address: address || null,
        });
      } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    });
  }

  function handleDelete() {
    if (!confirm("この取引先を削除しますか？関連する仕訳・請求書には影響がありません。")) return;
    startTransition(async () => {
      try { await deletePartner(partner.id); router.push("/partners"); }
      catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    });
  }

  return (
    <div>
      <div className="page-h">
        <div>
          <div className="breadcrumb">
            <Icon name="Home" size={12} /><span>ホーム</span> / <span>取引先</span> / <span style={{ color: "var(--foreground-700)" }}>編集</span>
          </div>
          <h1 className="h1">取引先を編集</h1>
        </div>
        <div className="row">
          <Button variant="danger" icon="Trash2" onClick={handleDelete} disabled={isPending}>削除</Button>
          <Button variant="bordered" onClick={() => router.push("/partners")} disabled={isPending}>キャンセル</Button>
          <Button variant="primary" icon="Save" onClick={handleSave} disabled={isPending}>
            {isPending ? "保存中..." : "保存する"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="alert" style={{ background: "#fdd0df", color: "#920b3a", marginBottom: 14 }}>
          <Icon name="AlertCircle" size={16} /><span>{error}</span>
        </div>
      )}

      <Card title="基本情報">
        <div className="form-grid">
          <Field label="取引先名" required span={6}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="株式会社○○" />
          </Field>
          <Field label="フリガナ" span={6}>
            <Input value={nameKana} onChange={(e) => setNameKana(e.target.value)} placeholder="カブシキガイシャ○○" />
          </Field>
          <Field label="種別" span={4}>
            <Select value={kind} onChange={(e) => setKind(e.target.value as Partner["kind"])}>
              <option value="corp">法人</option>
              <option value="individual">個人</option>
              <option value="overseas">海外</option>
            </Select>
          </Field>
          <Field label="適格請求書登録番号" span={8}>
            <Input value={invoiceRegNo} onChange={(e) => setInvoiceRegNo(e.target.value)} placeholder="T1234567890123" className="code" />
          </Field>
          <Field label="電話番号" span={4}>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03-0000-0000" />
          </Field>
          <Field label="メールアドレス" span={8}>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@example.com" />
          </Field>
          <Field label="住所" span={12}>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="東京都渋谷区..." />
          </Field>
        </div>
      </Card>
    </div>
  );
}
