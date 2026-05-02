/* global React, Icon, Button, Chip, Field, Input, Select, Card */
const { useState: useState3 } = React;

// ============================ Invoice List (Yayoi screenshot 3 reproduction) ============================
function InvoiceList({ onCreate, onSelect }) {
  const rows = [
    { id: '20260426-001', date: '2026/04/26', client: 'MOMO株式会社',     subj: '—',                       amt: 23650,   due: '2026/05/31', sync: '済', pay: 'billed' },
    { id: '20260415-002', date: '2026/04/15', client: '東京悦納',           subj: '—',                       amt: 5500,    due: '—',          sync: '済', pay: 'paid'   },
    { id: '20260415-001', date: '2026/04/15', client: 'ZHENGDEI Ltd',     subj: '—',                       amt: 231000,  due: '2026/04/30', sync: '済', pay: 'paid'   },
    { id: '20260310-002', date: '2026/03/10', client: '日本弘道株式会社',     subj: 'ホームページ制作',           amt: 90000,   due: '—',          sync: '済', pay: 'paid'   },
    { id: '20260310-001', date: '2026/03/10', client: '日本弘道株式会社',     subj: 'ホームページ制作',           amt: 85000,   due: '2026/03/31', sync: '済', pay: 'paid'   },
    { id: '20260222-001', date: '2026/02/22', client: 'Evolution株式会社',  subj: '—',                       amt: 3300,    due: '2026/02/28', sync: '済', pay: 'paid'   },
    { id: '20260214-001', date: '2026/02/14', client: '日本弘道株式会社',     subj: 'ホームページ制作',           amt: 80000,   due: '2026/02/28', sync: '済', pay: 'paid'   },
    { id: '20260213-001', date: '2026/02/13', client: '東京悦納',           subj: '—',                       amt: 3300,    due: '2026/02/28', sync: '済', pay: 'unbilled' },
    { id: '20260211-001', date: '2026/02/11', client: '株式会社ノリジン科学', subj: 'コーポレートサイト制作費',     amt: 242000,  due: '—',          sync: '済', pay: 'unbilled' },
    { id: '20260207-002', date: '2026/02/07', client: '姜 偉',              subj: '自動注文システムの保守費用',    amt: 10500,   due: '2026/02/28', sync: '済', pay: 'paid'   },
    { id: '20260207-001', date: '2026/02/07', client: '陳 立新',            subj: '—',                       amt: 225500,  due: '—',          sync: '済', pay: 'paid'   },
    { id: '20260121-001', date: '2026/01/21', client: '姜 偉',              subj: '自動受注システム開発費',       amt: 50000,   due: '2026/01/31', sync: '済', pay: 'paid'   },
    { id: '20260117-001', date: '2026/01/17', client: '姜 偉',              subj: '自動受注システム開発費',       amt: 50000,   due: '2026/01/31', sync: '済', pay: 'paid'   },
  ];

  const payChip = (pay) => {
    if (pay === 'paid') return <span className="yc-chip yc-chip-paid">入金済み <Icon name="chevron-down" size={11} /></span>;
    if (pay === 'billed') return <span className="yc-chip yc-chip-billed">請求済み <Icon name="chevron-down" size={11} /></span>;
    return <span className="yc-chip yc-chip-unbilled">未請求 <Icon name="chevron-down" size={11} /></span>;
  };

  return (
    <div className="yc-page">
      <div className="yc-page-h">
        <h1 className="yc-h1">請求書</h1>
      </div>

      <div className="yc-toolbar">
        <div className="yc-search">
          <Icon name="search" size={14} />
          <input placeholder="取引先名・送付先名・件名・品番・品名で検索" />
        </div>
        <div className="yc-filter-group">
          <label>データ送信</label>
          <Select defaultValue="all" style={{ width: 120 }}><option value="all">すべて</option><option>済</option><option>未送信</option></Select>
        </div>
        <div className="yc-filter-group">
          <label>ステータス</label>
          <Select defaultValue="all" style={{ width: 120 }}><option value="all">すべて</option><option>入金済み</option><option>請求済み</option><option>未請求</option></Select>
        </div>
        <div style={{ flex: 1 }} />
        <button className="yc-primary-btn" onClick={onCreate}>
          <Icon name="plus" size={14} stroke={2} />請求書を新規作成
        </button>
      </div>

      <div className="yc-result-count">13件中 1〜13件</div>

      <div className="yc-table-wrap">
        <table className="yc-table">
          <thead>
            <tr>
              <th>請求書番号</th>
              <th>請求日</th>
              <th>取引先 / 送付先</th>
              <th>件名</th>
              <th className="num">金額</th>
              <th>お支払期限</th>
              <th>データ送信</th>
              <th>ステータス</th>
              <th>編集</th>
              <th>その他</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} onClick={() => onSelect && onSelect(r)}>
                <td><span className="yc-link">{r.id}</span></td>
                <td>{r.date}</td>
                <td>{r.client}</td>
                <td className="yc-subj">{r.subj}</td>
                <td className="num">{r.amt.toLocaleString()}円</td>
                <td>{r.due}</td>
                <td>{r.sync}</td>
                <td>{payChip(r.pay)}</td>
                <td><Icon name="pencil" size={14} className="yc-action" /></td>
                <td><span className="yc-more">···</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================ Invoice Create (Yayoi screenshots 1 + 2 reproduction) ============================
function InvoiceCreate({ onCancel, onSave }) {
  const [tab, setTab] = useState3('info');
  const blankRows = Array.from({ length: 5 });

  return (
    <div className="yc-create">
      <div className="yc-create-header">
        <h1 className="yc-h1" style={{ marginBottom: 0 }}>請求書の新規作成</h1>
      </div>

      <div className="yc-create-body">
        {/* LEFT — form */}
        <div className="yc-left">
          <div className="yc-tabs">
            <span className={`yc-tab ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>請求書の情報</span>
            <span className={`yc-tab ${tab === 'tax' ? 'active' : ''}`} onClick={() => setTab('tax')}>課税設定</span>
          </div>

          <div className="yc-form-block">
            <div className="yc-form-row">
              <div className="yc-form-col">
                <h3 className="yc-h3">請求先情報</h3>
                <Field label={<>取引先名 <span className="yc-req">(必須)</span> <span className="yc-help">?</span></>} span={12}>
                  <Select defaultValue=""><option value="">取引先を選択してください</option><option>三立国際合同会社</option></Select>
                </Field>
                <h3 className="yc-h3" style={{ marginTop: 18 }}>請求書情報</h3>
                <div className="yc-2col">
                  <Field label={<>請求日 <span className="yc-req">(必須)</span> <span className="yc-help">?</span></>} span={12}>
                    <div className="yc-date"><Input defaultValue="2026/05/03" /><Icon name="calendar" size={14} /></div>
                  </Field>
                  <Field label={<>お支払期限 <span className="yc-help">?</span></>} span={12}>
                    <div className="yc-date"><Input placeholder="yyyy/mm/dd" /><Icon name="calendar" size={14} /></div>
                  </Field>
                </div>
                <Field label={<>請求書番号 <span className="yc-req">(必須)</span> <span className="yc-help">?</span></>} span={12}>
                  <Input defaultValue="20260503-001" />
                </Field>
                <Field label={<>件名</>} span={12} hint="0/70">
                  <Input />
                </Field>
              </div>

              <div className="yc-form-col">
                <h3 className="yc-h3">請求元情報</h3>
                <Field label={<>自社名 <span className="yc-req">(必須)</span> <span className="yc-help">?</span></>} span={12}>
                  <Input defaultValue="三立国際合同会社" />
                </Field>
                <Field label={<>適格請求書発行事業者の登録番号 <span className="yc-help">?</span></>} span={12} hint='「T」+ 13桁の数字を入力します。'>
                  <Input />
                </Field>
              </div>
            </div>

            {/* Line items */}
            <div className="yc-line-block">
              <div className="yc-line-toggle">
                <Icon name="calendar" size={14} />
                <span>取引日を記入</span>
                <span className="yc-switch on"><span className="thumb" /></span>
              </div>

              <table className="yc-line-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>取引日</th>
                    <th>品番・品名</th>
                    <th className="num">数量</th>
                    <th>単位</th>
                    <th className="num">単価</th>
                    <th>消費税率</th>
                    <th className="num">金額</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {blankRows.map((_, i) => (
                    <tr key={i}>
                      <td className="yc-grip">⋮⋮</td>
                      <td><div className="yc-date small"><Input defaultValue="2024/01/" /><Icon name="calendar" size={12} /></div></td>
                      <td><Input /></td>
                      <td><Input className="right" defaultValue="0" /></td>
                      <td><Input defaultValue="個" /></td>
                      <td><Input className="right" defaultValue="0" /></td>
                      <td><Select defaultValue="10"><option value="10">10%</option><option>8%</option><option>非課税</option></Select></td>
                      <td className="num">　</td>
                      <td><Icon name="x" size={14} className="yc-x" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="yc-line-foot">
                <div>
                  <button className="yc-light-btn"><Icon name="plus" size={13} />行を追加</button>
                  <div className="yc-line-help">最大80行まで追加できます。</div>
                </div>
                <table className="yc-totals-mini">
                  <tbody>
                    <tr><td>小計</td><td className="num">0</td></tr>
                    <tr><td>消費税</td><td className="num">0</td></tr>
                    <tr><td>合計</td><td className="num">0</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes */}
            <div className="yc-section">
              <Field label={<>備考 <span className="yc-help">?</span></>} span={12} hint="0/1000">
                <textarea className="input" rows={3} />
              </Field>
            </div>

            {/* Bank */}
            <div className="yc-section">
              <h3 className="yc-h3">振込先</h3>
              {[0, 1, 2].map(i => (
                <div key={i} className="yc-bank-row">
                  <Field label="金融機関名" span={12}><Input /></Field>
                  <Field label="支店名" span={12}><Input /></Field>
                  <Field label="口座種別" span={12}><Select defaultValue="普通"><option>普通預金</option><option>当座</option></Select></Field>
                  <Field label="口座番号" span={12}><Input /></Field>
                  <Field label="口座名義" span={12}><Input /></Field>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — preview */}
        <div className="yc-right">
          <div className="yc-template-row">
            <span style={{ fontSize: 13 }}>請求書のテンプレート</span>
            <Select defaultValue="standard" style={{ width: 200 }}><option value="standard">標準</option><option>ロゴ付</option></Select>
          </div>

          <div className="yc-preview">
            <div className="yc-preview-head">
              <div style={{ fontSize: 11, color: '#64748b' }}>2026年05月03日</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>請求書番号：20260503-001</div>
            </div>
            <h2 className="yc-preview-title">請求書</h2>
            <div className="yc-preview-meta">
              <div>
                <div className="yc-preview-line" />
                <div style={{ marginTop: 12, fontSize: 12 }}>下記のとおりご請求申し上げます。</div>
                <div style={{ marginTop: 14, fontSize: 13 }}>
                  <div style={{ color: '#64748b', fontSize: 11 }}>ご請求金額</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, borderBottom: '1px solid #94a3b8', paddingBottom: 4, marginTop: 2 }}>
                    <span style={{ fontSize: 22, fontWeight: 700 }}>¥0-</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 11, lineHeight: 1.6 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>三立国際合同会社</div>
                <div>〒1110032</div>
                <div>東京都台東区浅草5-64-8 フュージョナル浅草フォレスト</div>
                <div>TEL : 070-8536-5359</div>
              </div>
            </div>

            <table className="yc-preview-table">
              <thead><tr><th>品番・品名</th><th>数量</th><th>単価</th><th>金額</th></tr></thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td>　</td><td>　</td><td>　</td><td>　</td></tr>
                ))}
              </tbody>
            </table>

            <div className="yc-preview-totals">
              <div className="yc-tax-row"><span>10%対象</span><span>0</span><span>消費税</span><span>0</span></div>
              <table className="yc-preview-summary">
                <tbody>
                  <tr><td>小計</td><td className="num">0</td></tr>
                  <tr><td>消費税</td><td className="num">0</td></tr>
                  <tr className="total"><td>合計</td><td className="num">0</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Footer save bar */}
      <div className="yc-footer">
        <div className="yc-footer-totals">
          <span>小計 <strong>0円</strong></span>
          <span>消費税 <strong>0円</strong></span>
          <span className="big">合計 <strong>0円</strong></span>
        </div>
        <button className="yc-primary-btn lg" onClick={onSave}>請求書を保存</button>
      </div>
    </div>
  );
}

// ============================ Bank Match (kept from earlier) ============================
function BankMatch() {
  const [matches, setMatches] = useState3({ 0: 'matched', 2: 'matched' });
  const txns = [
    { d: '05/03', desc: 'カ）トウキョウショウジ', amt: 284500, dir: 'in', sug: '株式会社東京商事 INV-0482 (¥284,500)' },
    { d: '05/03', desc: 'GMOクラウド ホスティング', amt: -8800, dir: 'out', sug: '通信費 (定期: 毎月)' },
    { d: '05/02', desc: 'スターバックス シブヤ', amt: -1240, dir: 'out', sug: '会議費 (打合せ)' },
    { d: '05/02', desc: 'デンキダイ トウキョウデンリョク', amt: -28400, dir: 'out', sug: '水道光熱費' },
    { d: '05/01', desc: 'カ）グローバル', amt: 1200000, dir: 'in', sug: '合同会社グローバル INV-0481 (¥1,200,000)' },
  ];
  const matchedCount = Object.values(matches).filter(v => v === 'matched').length;
  return (
    <div>
      <div className="page-h">
        <div>
          <div className="breadcrumb"><Icon name="home" size={12} /><span>ホーム</span> / <span style={{ color: 'var(--foreground-700)' }}>銀行連携</span></div>
          <h1 className="h1">銀行連携・取引マッチング</h1>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>三菱UFJ銀行 渋谷支店 / 普通 1234567 · 最終同期 14:22</div>
        </div>
        <div className="row">
          <Button variant="bordered" icon="refresh-cw">今すぐ同期</Button>
          <Button variant="primary" className="primary" icon="check" disabled={matchedCount === 0}>{matchedCount}件をまとめて承認</Button>
        </div>
      </div>

      <div className="alert info">
        <Icon name="sparkles" size={18} />
        <div style={{ flex: 1 }}>AIが <strong>{txns.length}件中{txns.length}件</strong> の勘定科目を提案しました。確認して承認すると仕訳が自動作成されます。</div>
      </div>

      <Card className="tight">
        <table className="tbl">
          <thead><tr><th style={{ width: 60 }}>日付</th><th>取引内容（銀行明細）</th><th className="num">金額</th><th style={{ width: 360 }}>提案された仕訳</th><th style={{ width: 200 }}>マッチング</th></tr></thead>
          <tbody>
            {txns.map((t, i) => {
              const state = matches[i] || 'pending';
              return (
                <tr key={i}>
                  <td>{t.d}</td>
                  <td>
                    <div className="row">
                      <Icon name={t.dir === 'in' ? 'arrow-down-left' : 'arrow-up-right'} size={14} style={{ color: t.dir === 'in' ? 'var(--money-positive)' : 'var(--money-negative)' }} />
                      <span>{t.desc}</span>
                    </div>
                  </td>
                  <td className={`num ${t.dir === 'in' ? 'pos' : 'neg'}`}>{t.dir === 'in' ? '+' : ''}¥{t.amt.toLocaleString()}</td>
                  <td>
                    <div style={{ background: 'var(--zinc-50)', borderRadius: 8, padding: '8px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon name="sparkles" size={12} style={{ color: 'var(--primary)' }} />
                      <span style={{ flex: 1 }}>{t.sug}</span>
                      <span style={{ fontSize: 10, color: 'var(--foreground-500)' }}>96%</span>
                    </div>
                  </td>
                  <td>
                    {state === 'matched' ? (
                      <Chip tone="s">承認済</Chip>
                    ) : state === 'rejected' ? (
                      <Chip tone="d">却下</Chip>
                    ) : (
                      <div className="row">
                        <Button variant="primary" size="sm" className="primary sm" icon="check" onClick={() => setMatches(m => ({ ...m, [i]: 'matched' }))}>承認</Button>
                        <Button variant="light" size="sm" icon="x" onClick={() => setMatches(m => ({ ...m, [i]: 'rejected' }))} />
                        <Button variant="light" size="sm" icon="edit-3" />
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

Object.assign(window, { InvoiceList, InvoiceCreate, BankMatch });
