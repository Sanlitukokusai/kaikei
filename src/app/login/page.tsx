"use client";
import { Suspense, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Icon from "@/components/Icon";
import { Button, Field, Input } from "@/components/ui";
import { browserClient } from "@/lib/supabase-browser";
import { signInWithPassword, signUpWithPassword, verifySignupOtp, resendSignupOtp } from "@/app/actions/auth";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [stage, setStage] = useState<"form" | "otp">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    startTransition(async () => {
      if (tab === "login") {
        const result = await signInWithPassword(email, password);
        if (result?.error) setError(result.error);
        return;
      }
      const result = await signUpWithPassword(email, password, companyName);
      if (!result) return; // redirected (auto sign-in)
      if ("error" in result) {
        setError(result.error);
        return;
      }
      if (result.needsVerification) {
        setOtpEmail(result.email);
        setStage("otp");
        setInfo(`${result.email} に6桁の確認コードを送信しました。メールをご確認ください。`);
      }
    });
  }

  function onVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const result = await verifySignupOtp(otpEmail, otpCode.trim());
      if (result?.error) setError(result.error);
    });
  }

  function onResendOtp() {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const result = await resendSignupOtp(otpEmail);
      if (result?.error) setError(result.error);
      else setInfo("確認コードを再送信しました。");
    });
  }

  function onBackToForm() {
    setStage("form");
    setOtpCode("");
    setError(null);
    setInfo(null);
  }

  async function onGoogle() {
    const sb = browserClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) setError(error.message);
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 480px", background: "#fff" }}>
      <div
        style={{
          background: "radial-gradient(circle at 30% 20%, rgba(0,111,238,.08), transparent 60%), #fff",
          padding: "48px 64px",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          borderRight: "1px solid var(--zinc-100)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#006FEE,#004493)", display: "grid", placeItems: "center", color: "#fff", fontWeight: 700, fontSize: 18 }}>会</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Kaikei Cloud</div>
            <div style={{ fontSize: 11, color: "var(--foreground-500)" }}>会計クラウド · 会计云</div>
          </div>
        </div>
        <div style={{ maxWidth: 480 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>日本の中小企業のための会計SaaS</div>
          <h1 style={{ fontSize: 36, lineHeight: 1.2, margin: "0 0 16px", letterSpacing: "-0.01em", fontWeight: 700 }}>
            複式簿記から決算書まで、<br />一つのクラウドで。
          </h1>
          <p style={{ color: "var(--foreground-600)", fontSize: 15, lineHeight: 1.7, margin: 0 }}>
            電子帳簿保存法・インボイス制度に完全対応。銀行連携で取引を自動取込、AIが勘定科目を提案します。
          </p>
          <div style={{ display: "flex", gap: 24, marginTop: 32, fontSize: 12, color: "var(--foreground-500)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="ShieldCheck" size={14} />SOC 2 Type II 認証</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="Lock" size={14} />通信は TLS 1.3 で暗号化</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "var(--foreground-500)" }}>© 2026 Kaikei Cloud, Inc. · プライバシー · 利用規約</div>
      </div>
      {stage === "form" ? (
        <form onSubmit={onSubmit} style={{ padding: "64px 56px", display: "flex", flexDirection: "column", justifyContent: "center", background: "var(--zinc-50)" }}>
          <div className="tabs" style={{ marginBottom: 24, alignSelf: "flex-start" }}>
            <span className={`tb-tab ${tab === "login" ? "active" : ""}`} onClick={() => setTab("login")} style={{ cursor: "pointer" }}>ログイン</span>
            <span className={`tb-tab ${tab === "signup" ? "active" : ""}`} onClick={() => setTab("signup")} style={{ cursor: "pointer" }}>新規登録</span>
          </div>
          <h2 style={{ fontSize: 22, margin: "0 0 6px", fontWeight: 700 }}>
            {tab === "login" ? "おかえりなさい" : "14日間 無料でお試し"}
          </h2>
          <p style={{ color: "var(--foreground-500)", margin: "0 0 24px", fontSize: 13 }}>
            {tab === "login" ? "メールアドレスとパスワードを入力してください" : "クレジットカード不要。いつでも解約できます。"}
          </p>
          {error && (
            <div className="alert" style={{ background: "#fdd0df", color: "#920b3a", marginBottom: 14 }}>
              <Icon name="AlertCircle" size={16} /><span>{error}</span>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {tab === "signup" && (
              <Field label="会社名" span={12}>
                <Input placeholder="株式会社サンプル" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </Field>
            )}
            <Field label="メールアドレス" required span={12}>
              <Input type="email" placeholder="you@example.co.jp" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field label="パスワード" required span={12} hint={tab === "signup" ? "8文字以上、英数字を含めてください" : undefined}>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={tab === "signup" ? 8 : 1} />
            </Field>
            {tab === "login" && (
              <div className="spread" style={{ fontSize: 12 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input type="checkbox" defaultChecked /> ログイン状態を保持
                </label>
                <a href="#" style={{ color: "var(--primary)" }}>パスワードを忘れた</a>
              </div>
            )}
            <Button variant="primary" size="lg" type="submit" disabled={isPending}>
              {isPending ? "処理中..." : tab === "login" ? "ログイン" : "アカウントを作成"}
            </Button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--foreground-500)", fontSize: 11, margin: "4px 0" }}>
              <div style={{ flex: 1, height: 1, background: "var(--zinc-200)" }} /> または
              <div style={{ flex: 1, height: 1, background: "var(--zinc-200)" }} />
            </div>
            <Button variant="bordered" icon="Globe" type="button" onClick={onGoogle}>Google でログイン</Button>
          </div>
        </form>
      ) : (
        <form onSubmit={onVerifyOtp} style={{ padding: "64px 56px", display: "flex", flexDirection: "column", justifyContent: "center", background: "var(--zinc-50)" }}>
          <h2 style={{ fontSize: 22, margin: "0 0 6px", fontWeight: 700 }}>確認コードを入力</h2>
          <p style={{ color: "var(--foreground-500)", margin: "0 0 24px", fontSize: 13 }}>
            <strong>{otpEmail}</strong> 宛に送信した確認コードを入力してください。
          </p>
          {info && (
            <div className="alert" style={{ background: "#d1f1e0", color: "#0a6a3a", marginBottom: 14 }}>
              <Icon name="CheckCircle" size={16} /><span>{info}</span>
            </div>
          )}
          {error && (
            <div className="alert" style={{ background: "#fdd0df", color: "#920b3a", marginBottom: 14 }}>
              <Icon name="AlertCircle" size={16} /><span>{error}</span>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="確認コード" required span={12}>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                minLength={6}
                placeholder="12345678"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                required
                style={{ letterSpacing: "0.4em", fontSize: 18, textAlign: "center" }}
              />
            </Field>
            <Button variant="primary" size="lg" type="submit" disabled={isPending || otpCode.length < 6}>
              {isPending ? "確認中..." : "確認して登録完了"}
            </Button>
            <Button variant="bordered" type="button" onClick={onResendOtp} disabled={isPending}>
              コードを再送信
            </Button>
            <button
              type="button"
              onClick={onBackToForm}
              style={{ background: "none", border: "none", color: "var(--foreground-500)", fontSize: 12, cursor: "pointer", marginTop: 4 }}
            >
              ← メールアドレスを変更する
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
