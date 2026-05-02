"use client";
import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/Icon";
import { Button, Field, Input } from "@/components/ui";
import { browserClient } from "@/lib/supabase-browser";
import { signInWithPassword, signUpWithPassword } from "@/app/actions/auth";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = tab === "login"
        ? await signInWithPassword(email, password)
        : await signUpWithPassword(email, password, companyName);
      // result undefined on redirect; only returned when there's an error.
      if (result?.error) setError(result.error);
    });
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
    </div>
  );
}
