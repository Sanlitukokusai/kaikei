"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { Field, Input, Select } from "@/components/ui";
import { createPartner } from "@/app/actions/partners";

export default function PartnerForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [nameKana, setNameKana] = useState("");
  const [kind, setKind] = useState<"corp" | "individual" | "overseas">("corp");
  const [regNo, setRegNo] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const onSubmit = () => {
    if (!name.trim()) { alert("取引先名を入力してください"); return; }
    startTransition(async () => {
      try {
        await createPartner({ name, name_kana: nameKana, kind, invoice_reg_no: regNo, phone, email, address });
      } catch (e: unknown) {
        alert("保存に失敗しました：" + (e instanceof Error ? e.message : String(e)));
      }
    });
  };

  return (
    <div className="yc-page" style={{ maxWidth: 720 }}>
      <div className="page-h">
        <div>
          <div className="breadcrumb"><Icon name="Home" size={12} /><span>ホーム</span> / <span>取引先</span> / <span style={{ color: "var(--foreground-700)" }}>新規追加</span></div>
          <h1 className="h1">取引先を追加</h1>
        </div>
      </div>
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="取引先名" required span={12}><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="カナ" span={12}><Input value={nameKana} onChange={(e) => setNameKana(e.target.value)} /></Field>
          <Field label="区分" span={12}>
            <Select value={kind} onChange={(e) => setKind(e.target.value as "corp" | "individual" | "overseas")}>
              <option value="corp">法人</option><option value="individual">個人</option><option value="overseas">海外</option>
            </Select>
          </Field>
          <Field label="適格請求書 登録番号" span={12} hint="T + 13桁"><Input value={regNo} onChange={(e) => setRegNo(e.target.value)} /></Field>
          <Field label="電話" span={12}><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          <Field label="メール" span={12}><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="住所" span={12}><Input value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
        </div>
        <div style={{ marginTop: 22, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="yc-light-btn" onClick={() => router.push("/partners")} disabled={isPending}>キャンセル</button>
          <button className="yc-primary-btn" onClick={onSubmit} disabled={isPending}>{isPending ? "保存中..." : "保存する"}</button>
        </div>
      </div>
    </div>
  );
}
