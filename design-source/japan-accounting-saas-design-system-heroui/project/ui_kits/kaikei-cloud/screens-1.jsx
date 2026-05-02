/* global React, Icon, Button, Chip, Field, Input, Select, Card */
const { useState } = React;

// ============================ Login ============================
function LoginScreen({ onLogin }) {
  const [tab, setTab] = useState('login');
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 480px', background: '#fff' }}>
      <div style={{
        background: 'radial-gradient(circle at 30% 20%, rgba(0,111,238,.08), transparent 60%), #fff',
        padding: '48px 64px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRight: '1px solid var(--zinc-100)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#006FEE,#004493)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 18 }}>会</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Kaikei Cloud</div>
            <div style={{ fontSize: 11, color: 'var(--foreground-500)' }}>会計クラウド · 会计云</div>
          </div>
        </div>
        <div style={{ maxWidth: 480 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>日本の中小企業のための会計SaaS</div>
          <h1 style={{ fontSize: 36, lineHeight: 1.2, margin: '0 0 16px', letterSpacing: '-0.01em', fontWeight: 700 }}>
            複式簿記から決算書まで、<br />一つのクラウドで。
          </h1>
          <p style={{ color: 'var(--foreground-600)', fontSize: 15, lineHeight: 1.7, margin: 0 }}>
            電子帳簿保存法・インボイス制度に完全対応。銀行連携で取引を自動取込、AIが勘定科目を提案します。
          </p>
          <div style={{ display: 'flex', gap: 24, marginTop: 32, fontSize: 12, color: 'var(--foreground-500)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="shield-check" size={14} />SOC 2 Type II 認証</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="lock" size={14} />通信は TLS 1.3 で暗号化</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--foreground-500)' }}>© 2026 Kaikei Cloud, Inc. · プライバシー · 利用規約</div>
      </div>
      <div style={{ padding: '64px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'var(--zinc-50)' }}>
        <div className="tabs" style={{ marginBottom: 24, alignSelf: 'flex-start' }}>
          <span className={`tb-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>ログイン</span>
          <span className={`tb-tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => setTab('signup')}>新規登録</span>
        </div>
        <h2 style={{ fontSize: 22, margin: '0 0 6px', fontWeight: 700 }}>
          {tab === 'login' ? 'おかえりなさい' : '14日間 無料でお試し'}
        </h2>
        <p style={{ color: 'var(--foreground-500)', margin: '0 0 24px', fontSize: 13 }}>
          {tab === 'login' ? 'メールアドレスとパスワードを入力してください' : 'クレジットカード不要。いつでも解約できます。'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tab === 'signup' && (
            <Field label="会社名" required span={12}><Input placeholder="株式会社サンプル" /></Field>
          )}
          <Field label="メールアドレス" required span={12}><Input type="email" placeholder="you@example.co.jp" defaultValue="taro.yamada@sample.co.jp" /></Field>
          <Field label="パスワード" required span={12} hint={tab === 'signup' ? '8文字以上、英数字を含めてください' : undefined}>
            <Input type="password" defaultValue="••••••••••" />
          </Field>
          {tab === 'login' && (
            <div className="spread" style={{ fontSize: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" defaultChecked /> ログイン状態を保持</label>
              <a href="#" style={{ color: 'var(--primary)' }}>パスワードを忘れた</a>
            </div>
          )}
          <Button variant="primary" size="lg" className="primary lg" onClick={onLogin}>
            {tab === 'login' ? 'ログイン' : 'アカウントを作成'}
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--foreground-500)', fontSize: 11, margin: '4px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--zinc-200)' }} /> または <div style={{ flex: 1, height: 1, background: 'var(--zinc-200)' }} />
          </div>
          <Button variant="bordered" icon="globe">Google でログイン</Button>
        </div>
      </div>
    </div>
  );
}

// ============================ Dashboard ============================
function Dashboard() {
  const months = ['11月','12月','1月','2月','3月','4月'];
  const sales = [3.2, 3.8, 3.5, 4.1, 4.6, 4.82];
  const max = 5;
  return (
    <div>
      <div className="page-h">
        <div>
          <div className="breadcrumb"><Icon name="home" size={12} /><span>ホーム</span> / <span style={{ color: 'var(--foreground-700)' }}>ダッシュボード</span></div>
          <h1 className="h1">ダッシュボード</h1>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>2026年4月 · 月次サマリー · 最終更新 14:22</div>
        </div>
        <div className="row">
          <Button variant="bordered" icon="calendar">2026年4月</Button>
          <Button variant="bordered" icon="download">エクスポート</Button>
          <Button variant="primary" className="primary" icon="plus">仕訳を追加</Button>
        </div>
      </div>

      <div className="alert">
        <Icon name="alert-circle" size={18} />
        <div style={{ flex: 1 }}><strong>3件の取引</strong>が銀行連携から取込まれました。勘定科目の確認をお願いします。</div>
        <Button variant="bordered" size="sm" className="bordered sm">確認する</Button>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 18 }}>
        <div className="kpi"><div className="eb">月間売上</div><div className="val">¥4,820,500</div><div className="delta up"><Icon name="trending-up" size={14} />+12.4% <span className="sub">前月比</span></div></div>
        <div className="kpi"><div className="eb">月間費用</div><div className="val">¥1,284,360</div><div className="delta down"><Icon name="trending-down" size={14} />−3.2% <span className="sub">前月比</span></div></div>
        <div className="kpi"><div className="eb">純利益</div><div className="val" style={{ color: 'var(--money-positive)' }}>¥3,536,140</div><div className="delta up"><Icon name="trending-up" size={14} />+18.6%</div></div>
        <div className="kpi"><div className="eb">現金残高</div><div className="val">¥12,840,920</div><div className="sub">3口座 · 全銀協連携中</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        <Card title="売上推移（過去6ヶ月）" action={<div className="row" style={{ fontSize: 11, color: 'var(--foreground-500)' }}><span style={{ display: 'inline-block', width: 8, height: 8, background: 'var(--blue-500)', borderRadius: 2 }} /> 売上 <span style={{ display: 'inline-block', width: 8, height: 8, background: 'var(--blue-200)', borderRadius: 2, marginLeft: 8 }} /> 前年同月</div>}>
          <div className="chart-bar">
            {sales.map((v, i) => (
              <div key={i} style={{ display: 'flex', flex: 1, gap: 3 }}>
                <div className="bar" style={{ height: `${(v / max) * 100}%` }} />
                <div className="bar alt" style={{ height: `${((v - 0.3 - i*0.05) / max) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="chart-x">{months.map(m => <span key={m}>{m}</span>)}</div>
        </Card>
        <Card title="費用の内訳">
          {[
            { name: '仕入', amt: 482000, color: '#006FEE', pct: 38 },
            { name: '給料手当', amt: 380000, color: '#338ef7', pct: 30 },
            { name: '地代家賃', amt: 180000, color: '#7EE7FC', pct: 14 },
            { name: '通信費', amt: 92000, color: '#7828c8', pct: 7 },
            { name: 'その他', amt: 150360, color: 'var(--zinc-300)', pct: 11 },
          ].map(r => (
            <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 6, height: 24, borderRadius: 2, background: r.color }} />
              <div style={{ flex: 1, fontSize: 13 }}>{r.name}</div>
              <div className="num" style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 13, fontWeight: 500 }}>¥{r.amt.toLocaleString()}</div>
              <div style={{ width: 36, textAlign: 'right', fontSize: 11, color: 'var(--foreground-500)' }}>{r.pct}%</div>
            </div>
          ))}
        </Card>
      </div>

      <Card title="最近の仕訳" className="" action={<Button variant="light" size="sm" iconRight="arrow-right">すべて見る</Button>} >
        <table className="tbl">
          <thead><tr><th>日付</th><th>取引内容</th><th>勘定科目</th><th className="num">金額</th><th>状態</th></tr></thead>
          <tbody>
            <tr><td>05/03</td><td>株式会社東京商事 — 売上 <span className="code">INV-0482</span></td><td>売掛金</td><td className="num pos">¥284,500</td><td><Chip tone="s">確定済</Chip></td></tr>
            <tr><td>05/02</td><td>三菱UFJ銀行 — 振込手数料</td><td>支払手数料</td><td className="num neg">¥440</td><td><Chip tone="w">確認待ち</Chip></td></tr>
            <tr><td>05/02</td><td>Amazon Business — 事務用品</td><td>消耗品費</td><td className="num neg">¥12,800</td><td><Chip tone="s">確定済</Chip></td></tr>
            <tr><td>05/01</td><td>合同会社グローバル — 売上 <span className="code">INV-0481</span></td><td>売掛金</td><td className="num pos">¥1,200,000</td><td><Chip tone="i">下書き</Chip></td></tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}

Object.assign(window, { LoginScreen, Dashboard });
