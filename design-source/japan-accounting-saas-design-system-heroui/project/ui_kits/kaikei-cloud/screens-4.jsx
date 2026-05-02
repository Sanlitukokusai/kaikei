/* global React, Icon, Button, Chip, Field, Input, Select, Card */
const { useState: useState4 } = React;

// ============================ Partners (取引先・送付先) ============================
function PartnersList() {
  const rows = [
    { name: 'MOMO株式会社', kana: 'モモカブシキガイシャ', tag: '法人', tel: '03-1234-5678', email: 'a@momo.co.jp', sales: 23650, due: 0, last: '2026/04/26' },
    { name: '東京悦納', kana: 'トウキョウエツノウ', tag: '個人', tel: '090-1234-5678', email: 'tk@example.jp', sales: 8800, due: 0, last: '2026/04/15' },
    { name: 'ZHENGDEI Ltd', kana: 'ZHENGDEI', tag: '海外', tel: '+86-21-5555-1234', email: 'ar@zhengdei.com', sales: 231000, due: 0, last: '2026/04/15' },
    { name: '日本弘道株式会社', kana: 'ニホンコウドウ', tag: '法人', tel: '03-3456-7890', email: 'kd@nichikodo.co.jp', sales: 255000, due: 0, last: '2026/03/10' },
    { name: '株式会社ノリジン科学', kana: 'ノリジンカガク', tag: '法人', tel: '03-9876-5432', email: 'inv@norigin.jp', sales: 242000, due: 242000, last: '2026/02/11' },
    { name: 'Evolution株式会社', kana: 'エボリューション', tag: '法人', tel: '03-1111-2222', email: 'biz@evol.co.jp', sales: 3300, due: 0, last: '2026/02/22' },
    { name: '姜 偉', kana: 'ジャン ウェイ', tag: '個人', tel: '080-3333-4444', email: 'jiang@example.com', sales: 110500, due: 0, last: '2026/02/07' },
    { name: '陳 立新', kana: 'チン リッシン', tag: '個人', tel: '080-5555-6666', email: 'chen@example.com', sales: 225500, due: 0, last: '2026/02/07' },
  ];
  return (
    <div className="yc-page">
      <div className="yc-page-h" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <h1 className="yc-h1" style={{ marginBottom: 0 }}>取引先・送付先</h1>
        <button className="yc-primary-btn"><Icon name="plus" size={14} stroke={2} />取引先を追加</button>
      </div>
      <div className="yc-toolbar">
        <div className="yc-search"><Icon name="search" size={14} /><input placeholder="名称・カナ・メール・電話で検索" /></div>
        <div className="yc-filter-group"><label>区分</label><Select defaultValue="all" style={{ width: 110 }}><option value="all">すべて</option><option>法人</option><option>個人</option><option>海外</option></Select></div>
        <div className="yc-filter-group"><label>状態</label><Select defaultValue="all" style={{ width: 110 }}><option value="all">すべて</option><option>取引中</option><option>停止</option></Select></div>
      </div>
      <div className="yc-result-count">{rows.length}件中 1〜{rows.length}件</div>
      <div className="yc-table-wrap">
        <table className="yc-table">
          <thead><tr><th>取引先名</th><th>カナ</th><th>区分</th><th>連絡先</th><th className="num">売上累計</th><th className="num">売掛残高</th><th>最終取引</th><th>操作</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.name}>
                <td><span className="yc-link">{r.name}</span></td>
                <td style={{ color: '#64748b' }}>{r.kana}</td>
                <td><span className={`yc-chip ${r.tag === '法人' ? 'yc-chip-billed' : r.tag === '海外' ? 'yc-chip-paid' : 'yc-chip-unbilled'}`}>{r.tag}</span></td>
                <td style={{ fontSize: 11, color: '#475569' }}>{r.tel}<br />{r.email}</td>
                <td className="num">{r.sales.toLocaleString()}円</td>
                <td className="num" style={{ color: r.due > 0 ? '#DC2626' : '#94a3b8' }}>{r.due ? r.due.toLocaleString() + '円' : '—'}</td>
                <td>{r.last}</td>
                <td><Icon name="pencil" size={14} className="yc-action" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================ Reports (試算表 / 損益計算書) ============================
function ReportsScreen() {
  const [tab, setTab] = useState4('pl');
  return (
    <div className="yc-page">
      <div className="yc-page-h" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <h1 className="yc-h1" style={{ marginBottom: 0 }}>レポート</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="yc-light-btn"><Icon name="calendar" size={13} />2026年4月</button>
          <button className="yc-light-btn"><Icon name="download" size={13} />PDF出力</button>
          <button className="yc-light-btn"><Icon name="file-spreadsheet" size={13} />CSV出力</button>
        </div>
      </div>

      <div className="yc-tabs" style={{ marginBottom: 18 }}>
        <span className={`yc-tab ${tab === 'pl' ? 'active' : ''}`} onClick={() => setTab('pl')}>損益計算書 (P/L)</span>
        <span className={`yc-tab ${tab === 'bs' ? 'active' : ''}`} onClick={() => setTab('bs')}>貸借対照表 (B/S)</span>
        <span className={`yc-tab ${tab === 'tb' ? 'active' : ''}`} onClick={() => setTab('tb')}>試算表</span>
        <span className={`yc-tab ${tab === 'cf' ? 'active' : ''}`} onClick={() => setTab('cf')}>キャッシュフロー</span>
      </div>

      {tab === 'pl' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
          <div className="yc-table-wrap">
            <table className="yc-table">
              <thead><tr><th>勘定科目</th><th className="num">当月</th><th className="num">前月</th><th className="num">前年同月</th><th className="num">構成比</th></tr></thead>
              <tbody>
                <tr style={{ background: '#f8fafc' }}><td colSpan={5} style={{ fontWeight: 600, fontSize: 11, color: '#64748b' }}>売上高</td></tr>
                <tr><td>　売上高</td><td className="num">4,820,500円</td><td className="num">4,290,000円</td><td className="num">3,950,000円</td><td className="num">100.0%</td></tr>
                <tr style={{ background: '#f8fafc' }}><td colSpan={5} style={{ fontWeight: 600, fontSize: 11, color: '#64748b' }}>売上原価</td></tr>
                <tr><td>　仕入高</td><td className="num">482,000円</td><td className="num">410,000円</td><td className="num">395,000円</td><td className="num">10.0%</td></tr>
                <tr style={{ fontWeight: 600 }}><td>売上総利益</td><td className="num">4,338,500円</td><td className="num">3,880,000円</td><td className="num">3,555,000円</td><td className="num">90.0%</td></tr>
                <tr style={{ background: '#f8fafc' }}><td colSpan={5} style={{ fontWeight: 600, fontSize: 11, color: '#64748b' }}>販売費及び一般管理費</td></tr>
                <tr><td>　給料手当</td><td className="num">380,000円</td><td className="num">380,000円</td><td className="num">350,000円</td><td className="num">7.9%</td></tr>
                <tr><td>　地代家賃</td><td className="num">180,000円</td><td className="num">180,000円</td><td className="num">180,000円</td><td className="num">3.7%</td></tr>
                <tr><td>　通信費</td><td className="num">92,000円</td><td className="num">88,400円</td><td className="num">82,000円</td><td className="num">1.9%</td></tr>
                <tr><td>　水道光熱費</td><td className="num">28,400円</td><td className="num">31,200円</td><td className="num">26,800円</td><td className="num">0.6%</td></tr>
                <tr><td>　消耗品費</td><td className="num">17,600円</td><td className="num">12,400円</td><td className="num">15,200円</td><td className="num">0.4%</td></tr>
                <tr><td>　旅費交通費</td><td className="num">18,600円</td><td className="num">22,800円</td><td className="num">14,500円</td><td className="num">0.4%</td></tr>
                <tr style={{ fontWeight: 600 }}><td>営業利益</td><td className="num">3,621,900円</td><td className="num">3,165,200円</td><td className="num">2,886,500円</td><td className="num">75.1%</td></tr>
                <tr><td>支払利息</td><td className="num">8,200円</td><td className="num">8,200円</td><td className="num">9,400円</td><td className="num">0.2%</td></tr>
                <tr style={{ fontWeight: 700, fontSize: 14, background: '#eff6ff' }}><td>当期純利益</td><td className="num">3,536,140円</td><td className="num">3,094,580円</td><td className="num">2,820,860円</td><td className="num">73.4%</td></tr>
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>当期純利益率</div>
              <div style={{ fontSize: 30, fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginTop: 6, color: '#16A34A' }}>73.4%</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>業界平均: 18% · 健全</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>売上高 前年同月比</div>
              <div style={{ fontSize: 30, fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginTop: 6, color: '#2563EB' }}>+22.0%</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>¥870,500 増加</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600, marginBottom: 8 }}>注意項目</div>
              <div style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
                <Icon name="alert-triangle" size={13} style={{ color: '#F59E0B', marginTop: 2 }} />
                <span>未消込仕訳が3件あります</span>
              </div>
              <div style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <Icon name="info" size={13} style={{ color: '#2563EB', marginTop: 2 }} />
                <span>4月の月次ロックは未実施</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {tab !== 'pl' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 60, textAlign: 'center', color: '#64748b' }}>
          <Icon name="bar-chart-3" size={32} />
          <div style={{ marginTop: 12, fontSize: 14, fontWeight: 500, color: '#1E293B' }}>このレポートは UI キット参考実装の対象外です</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>P/L タブをご覧ください。同じテーブル構造で B/S・試算表・キャッシュフローも展開されます。</div>
        </div>
      )}
    </div>
  );
}

// ============================ Voucher Upload (証憑・OCR) ============================
function VoucherScreen() {
  const items = [
    { name: '領収書_スターバックス_05-02.jpg', date: '2026/05/02', amt: 1240, cat: '会議費', conf: 92, status: 'ready' },
    { name: '請求書_GMOクラウド_05-03.pdf', date: '2026/05/03', amt: 8800, cat: '通信費', conf: 96, status: 'ready' },
    { name: 'IMG_4827.jpg',                date: '2026/05/01', amt: null, cat: '—',     conf: 0,  status: 'processing' },
    { name: '領収書_オフィスサプライ.pdf',     date: '2026/05/01', amt: 4800, cat: '消耗品費', conf: 88, status: 'ready' },
    { name: '電気代_東京電力_4月.pdf',         date: '2026/04/30', amt: 28400, cat: '水道光熱費', conf: 99, status: 'linked' },
  ];
  return (
    <div className="yc-page">
      <div className="yc-page-h" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <h1 className="yc-h1" style={{ marginBottom: 0 }}>証憑・経費</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="yc-light-btn"><Icon name="smartphone" size={13} />スマホからアップロード</button>
          <button className="yc-primary-btn"><Icon name="upload" size={14} stroke={2} />ファイルをアップロード</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, marginBottom: 14 }}>
        <div style={{ background: '#fff', border: '2px dashed #cbd5e1', borderRadius: 10, padding: 32, textAlign: 'center' }}>
          <Icon name="upload-cloud" size={36} style={{ color: '#94a3b8' }} />
          <div style={{ marginTop: 10, fontSize: 14, fontWeight: 500, color: '#1E293B' }}>領収書・請求書をドラッグ&ドロップ</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>PDF / JPG / PNG / HEIC · 最大 10MB · OCR で自動仕訳化</div>
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 12, fontSize: 11, color: '#475569' }}>
            <span><Icon name="shield-check" size={12} style={{ color: '#16A34A' }} /> 電子帳簿保存法対応</span>
            <span><Icon name="lock" size={12} style={{ color: '#16A34A' }} /> タイムスタンプ自動付与</span>
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600, marginBottom: 8 }}>今月のアップロード</div>
          <div style={{ fontSize: 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>34<span style={{ fontSize: 13, color: '#64748b', fontWeight: 400 }}>件</span></div>
          <div style={{ marginTop: 14, display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><div style={{ fontSize: 10, color: '#64748b' }}>OCR完了</div><div style={{ fontSize: 16, fontWeight: 600, color: '#16A34A' }}>32</div></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 10, color: '#64748b' }}>処理中</div><div style={{ fontSize: 16, fontWeight: 600, color: '#F59E0B' }}>1</div></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 10, color: '#64748b' }}>仕訳済</div><div style={{ fontSize: 16, fontWeight: 600, color: '#2563EB' }}>28</div></div>
          </div>
        </div>
      </div>

      <div className="yc-table-wrap">
        <table className="yc-table">
          <thead><tr><th>ファイル</th><th>取引日</th><th className="num">金額(OCR)</th><th>勘定科目(AI)</th><th>信頼度</th><th>状態</th><th>操作</th></tr></thead>
          <tbody>
            {items.map(it => (
              <tr key={it.name}>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name={it.name.endsWith('.pdf') ? 'file-text' : 'image'} size={14} style={{ color: '#64748b' }} /><span className="yc-link">{it.name}</span></div></td>
                <td>{it.date}</td>
                <td className="num">{it.amt ? it.amt.toLocaleString() + '円' : '—'}</td>
                <td>{it.cat}</td>
                <td>{it.conf > 0 ? <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><div style={{ width: 60, height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}><div style={{ width: it.conf + '%', height: '100%', background: it.conf > 90 ? '#16A34A' : '#F59E0B' }} /></div><span style={{ fontVariantNumeric: 'tabular-nums', color: '#64748b' }}>{it.conf}%</span></div> : '—'}</td>
                <td>{it.status === 'ready' ? <span className="yc-chip yc-chip-billed">仕訳作成可</span> : it.status === 'processing' ? <span className="yc-chip yc-chip-unbilled">処理中</span> : <span className="yc-chip yc-chip-paid">仕訳済</span>}</td>
                <td>{it.status === 'ready' ? <button className="yc-light-btn">仕訳を作成</button> : <Icon name="more-horizontal" size={14} className="yc-action" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================ Settings ============================
function SettingsScreen() {
  return (
    <div className="yc-page" style={{ maxWidth: 980 }}>
      <h1 className="yc-h1">設定</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 18 }}>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            ['会社情報', true],
            ['勘定科目マスタ', false],
            ['税区分マスタ', false],
            ['振込先口座', false],
            ['ユーザ管理', false],
            ['税理士招待', false],
            ['課金・プラン', false],
            ['電子帳簿保存設定', false],
          ].map(([label, active]) => (
            <div key={label} className={`yc-sb-item ${active ? 'active' : ''}`} style={{ padding: '8px 14px', borderRadius: 6, fontSize: 13, marginRight: 0, borderRight: 0, background: active ? '#eff6ff' : 'transparent', color: active ? '#2563EB' : '#475569', cursor: 'pointer' }}>{label}</div>
          ))}
        </nav>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 24 }}>
          <h3 className="yc-h3">会社情報</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="会社名" required span={12}><Input defaultValue="三立国際合同会社" /></Field>
            <Field label="代表者名" span={12}><Input defaultValue="李 太郎" /></Field>
            <Field label="法人番号" span={12}><Input defaultValue="1234567890123" /></Field>
            <Field label="適格請求書 登録番号" span={12}><Input defaultValue="T1234567890123" /></Field>
            <Field label="郵便番号" span={12}><Input defaultValue="111-0032" /></Field>
            <Field label="電話番号" span={12}><Input defaultValue="070-8536-5359" /></Field>
            <Field label="住所" span={12}><Input defaultValue="東京都台東区浅草5-64-8 フュージョナル浅草フォレスト" /></Field>
            <Field label="決算月" span={12}><Select defaultValue="3"><option value="3">3月</option><option>12月</option></Select></Field>
            <Field label="課税区分" span={12}><Select><option>一般課税</option><option>簡易課税</option><option>2割特例</option></Select></Field>
          </div>
          <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="yc-light-btn">キャンセル</button>
            <button className="yc-primary-btn">保存する</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PartnersList, ReportsScreen, VoucherScreen, SettingsScreen });
