/* global React, Icon, Button, Chip, Field, Input, Select, Card */
const { useState: useState2 } = React;

// ============================ Journal List ============================
function JournalList({ onCreate }) {
  const rows = [
    { d: '2026/05/03', cd: 'JNL-2026-0482', desc: '株式会社東京商事 — 4月分売上', dr: '売掛金', cr: '売上高', amt: 284500, tax: '課税10%', status: 's' },
    { d: '2026/05/03', cd: 'JNL-2026-0481', desc: '三菱UFJ銀行 — 振込手数料', dr: '支払手数料', cr: '普通預金', amt: 440, tax: '課税10%', status: 'w' },
    { d: '2026/05/02', cd: 'JNL-2026-0480', desc: 'Amazon Business — 事務用品購入', dr: '消耗品費', cr: '未払金', amt: 12800, tax: '課税10%', status: 's' },
    { d: '2026/05/02', cd: 'JNL-2026-0479', desc: '合同会社グローバル — 4月分コンサルフィー', dr: '売掛金', cr: '売上高', amt: 1200000, tax: '課税10%', status: 'i' },
    { d: '2026/05/01', cd: 'JNL-2026-0478', desc: '株式会社オフィスサプライ — コピー用紙', dr: '消耗品費', cr: '現金', amt: 4800, tax: '課税10%', status: 's' },
    { d: '2026/04/30', cd: 'JNL-2026-0477', desc: '従業員給与 — 4月分', dr: '給料手当', cr: '普通預金', amt: 380000, tax: '不課税', status: 's' },
    { d: '2026/04/30', cd: 'JNL-2026-0476', desc: '東京電力 — 4月分電気代', dr: '水道光熱費', cr: '未払金', amt: 28400, tax: '課税10%', status: 's' },
    { d: '2026/04/29', cd: 'JNL-2026-0475', desc: '株式会社ビジネスホテル — 出張宿泊費', dr: '旅費交通費', cr: '現金', amt: 18600, tax: '課税10%', status: 'd' },
  ];
  const [sel, setSel] = useState2(null);
  return (
    <div>
      <div className="page-h">
        <div>
          <div className="breadcrumb"><Icon name="home" size={12} /><span>ホーム</span> / <span style={{ color: 'var(--foreground-700)' }}>仕訳帳</span></div>
          <h1 className="h1">仕訳帳</h1>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>2026年4月 · 全 482件</div>
        </div>
        <div className="row">
          <Button variant="bordered" icon="upload">CSVインポート</Button>
          <Button variant="bordered" icon="download">エクスポート</Button>
          <Button variant="primary" className="primary" icon="plus" onClick={onCreate}>仕訳を追加</Button>
        </div>
      </div>

      <Card className="tight" style={{ marginBottom: 12 }}>
        <div className="toolbar" style={{ margin: 0 }}>
          <div className="tabs">
            <span className="tb-tab active">すべて<span style={{ marginLeft: 6, fontSize: 10, color: 'var(--foreground-400)' }}>482</span></span>
            <span className="tb-tab">確定済<span style={{ marginLeft: 6, fontSize: 10, color: 'var(--foreground-400)' }}>458</span></span>
            <span className="tb-tab">確認待ち<span style={{ marginLeft: 6, fontSize: 10, color: 'var(--foreground-400)' }}>3</span></span>
            <span className="tb-tab">下書き<span style={{ marginLeft: 6, fontSize: 10, color: 'var(--foreground-400)' }}>18</span></span>
            <span className="tb-tab">差戻し<span style={{ marginLeft: 6, fontSize: 10, color: 'var(--foreground-400)' }}>3</span></span>
          </div>
          <div style={{ flex: 1 }} />
          <Select style={{ width: 160 }} defaultValue="all"><option value="all">勘定科目: すべて</option><option>売上高</option><option>仕入</option></Select>
          <div style={{ position: 'relative' }}>
            <Icon name="search" size={14} style={{ position: 'absolute', left: 10, top: 12, opacity: .6 }} />
            <Input placeholder="検索..." style={{ paddingLeft: 32, width: 220 }} />
          </div>
        </div>
      </Card>

      <Card className="tight">
        <table className="tbl">
          <thead><tr><th style={{ width: 32 }}><input type="checkbox" /></th><th>日付</th><th>仕訳番号</th><th>摘要</th><th>借方科目</th><th>貸方科目</th><th>税区分</th><th className="num">金額</th><th>状態</th><th style={{ width: 32 }} /></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={sel === i ? 'sel' : ''} onClick={() => setSel(i)}>
                <td onClick={e => e.stopPropagation()}><input type="checkbox" /></td>
                <td>{r.d}</td>
                <td><span className="code">{r.cd}</span></td>
                <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.desc}</td>
                <td>{r.dr}</td>
                <td>{r.cr}</td>
                <td><Chip tone="n" dot={false}>{r.tax}</Chip></td>
                <td className="num">¥{r.amt.toLocaleString()}</td>
                <td><Chip tone={r.status}>{ {s:'確定済',w:'確認待ち',i:'下書き',d:'差戻し'}[r.status] }</Chip></td>
                <td><Icon name="more-horizontal" size={16} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div className="spread" style={{ marginTop: 12, fontSize: 12, color: 'var(--foreground-500)' }}>
        <div>1 - 8 / 482件</div>
        <div className="row"><Button variant="bordered" size="sm" icon="chevron-left" /><Button variant="bordered" size="sm">1</Button><Button variant="light" size="sm">2</Button><Button variant="light" size="sm">3</Button><span>...</span><Button variant="light" size="sm">61</Button><Button variant="bordered" size="sm" iconRight="chevron-right" /></div>
      </div>
    </div>
  );
}

// ============================ Journal Form ============================
function JournalForm({ onSave, onCancel }) {
  const [lines, setLines] = useState2([
    { acc: '売掛金',   tax: '課税10%', dr: 284500, cr: 0, memo: '株式会社東京商事 — 4月分売上' },
    { acc: '売上高',   tax: '課税10%', dr: 0, cr: 258636, memo: '' },
    { acc: '仮受消費税', tax: '不課税',   dr: 0, cr: 25864, memo: '' },
  ]);
  const drSum = lines.reduce((s, l) => s + l.dr, 0);
  const crSum = lines.reduce((s, l) => s + l.cr, 0);
  const balanced = drSum === crSum;
  return (
    <div>
      <div className="page-h">
        <div>
          <div className="breadcrumb"><Icon name="home" size={12} /><span>ホーム</span> / <span>仕訳帳</span> / <span style={{ color: 'var(--foreground-700)' }}>新規仕訳</span></div>
          <h1 className="h1">仕訳を追加</h1>
        </div>
        <div className="row">
          <Button variant="bordered" onClick={onCancel}>キャンセル</Button>
          <Button variant="bordered" icon="save">下書き保存</Button>
          <Button variant="primary" className="primary" icon="check" disabled={!balanced} onClick={onSave}>確定する</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>
        <Card title="基本情報">
          <div className="form-grid">
            <Field label="取引日" required span={3}><Input defaultValue="2026/05/03" /></Field>
            <Field label="仕訳番号" span={3}><Input defaultValue="JNL-2026-0483" className="code" /></Field>
            <Field label="取引先" span={6}><Select defaultValue="1"><option value="1">株式会社東京商事</option><option>合同会社グローバル</option><option>+ 新しい取引先を追加</option></Select></Field>
            <Field label="摘要" span={12}><Input defaultValue="株式会社東京商事 — 4月分売上 (INV-0482)" /></Field>
          </div>
        </Card>
        <Card title="補助">
          <Field label="部門" span={12}><Select><option>本社</option><option>大阪支社</option></Select></Field>
          <div style={{ height: 12 }} />
          <Field label="プロジェクト" span={12}><Select><option>(なし)</option><option>2026 リニューアル</option></Select></Field>
          <div style={{ height: 12 }} />
          <Field label="添付ファイル" span={12}>
            <div style={{ border: '1px dashed var(--zinc-300)', borderRadius: 10, padding: '14px', textAlign: 'center', color: 'var(--foreground-500)', fontSize: 12, cursor: 'pointer' }}>
              <Icon name="upload-cloud" size={20} /><div style={{ marginTop: 4 }}>領収書・請求書をドロップ</div>
            </div>
          </Field>
        </Card>
      </div>

      <div style={{ height: 14 }} />

      <Card title="仕訳明細" action={<Button variant="bordered" size="sm" icon="plus">行を追加</Button>}>
        <table className="tbl" style={{ borderRadius: 8 }}>
          <thead><tr><th>勘定科目</th><th>税区分</th><th className="num">借方</th><th className="num">貸方</th><th>摘要</th><th style={{ width: 32 }} /></tr></thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i}>
                <td style={{ width: 200 }}><Select defaultValue={l.acc}><option>{l.acc}</option></Select></td>
                <td style={{ width: 130 }}><Select defaultValue={l.tax}><option>{l.tax}</option><option>課税8%</option><option>非課税</option><option>不課税</option></Select></td>
                <td style={{ width: 140 }}><Input className="right" defaultValue={l.dr ? l.dr.toLocaleString() : ''} placeholder="0" /></td>
                <td style={{ width: 140 }}><Input className="right" defaultValue={l.cr ? l.cr.toLocaleString() : ''} placeholder="0" /></td>
                <td><Input defaultValue={l.memo} placeholder="補足..." /></td>
                <td><Icon name="trash-2" size={16} style={{ color: 'var(--foreground-400)', cursor: 'pointer' }} /></td>
              </tr>
            ))}
            <tr style={{ background: balanced ? '#e8faf0' : '#fee7ef', fontWeight: 600 }}>
              <td colSpan={2} style={{ textAlign: 'right', color: 'var(--foreground-700)' }}>合計</td>
              <td className="num">¥{drSum.toLocaleString()}</td>
              <td className="num">¥{crSum.toLocaleString()}</td>
              <td colSpan={2} style={{ color: balanced ? 'var(--money-positive)' : 'var(--money-negative)', fontSize: 12 }}>
                {balanced ? <><Icon name="check-circle" size={14} /> 借方と貸方が一致しています</> : '借方と貸方の差額: ¥' + Math.abs(drSum - crSum).toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}

Object.assign(window, { JournalList, JournalForm });
