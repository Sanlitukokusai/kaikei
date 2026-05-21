"use client";
import { useState, useTransition } from "react";
import Icon from "@/components/Icon";
import { Button, Field, Input } from "@/components/ui";
import { updatePassword } from "@/app/actions/auth";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください。");
      return;
    }
    if (password !== confirm) {
      setError("確認用パスワードが一致しません。");
      return;
    }
    startTransition(async () => {
      const result = await updatePassword(password);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--zinc-50)", padding: 24 }}>
      <form
        onSubmit={onSubmit}
        style={{
          width: "100%", maxWidth: 420, padding: 32,
          background: "#fff", borderRadius: 12,
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          display: "flex", flexDirection: "column", gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#006FEE,#004493)", display: "grid", placeItems: "center", color: "#fff", fontWeight: 700, fontSize: 18 }}>会</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Kaikei Cloud</div>
            <div style={{ fontSize: 11, color: "var(--foreground-500)" }}>新しいパスワードを設定</div>
          </div>
        </div>
        <h2 style={{ fontSize: 20, margin: "0 0 4px", fontWeight: 700 }}>パスワードを再設定</h2>
        <p style={{ color: "var(--foreground-500)", margin: 0, fontSize: 13 }}>
          新しいパスワードを入力してください。
        </p>
        {error && (
          <div className="alert" style={{ background: "#fdd0df", color: "#920b3a" }}>
            <Icon name="AlertCircle" size={16} /><span>{error}</span>
          </div>
        )}
        <Field label="新しいパスワード" required span={12} hint="8文字以上">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </Field>
        <Field label="新しいパスワード（確認）" required span={12}>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
        </Field>
        <Button variant="primary" size="lg" type="submit" disabled={isPending}>
          {isPending ? "更新中..." : "パスワードを更新"}
        </Button>
      </form>
    </div>
  );
}
