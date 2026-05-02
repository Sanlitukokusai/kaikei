/* global React, ReactDOM, Sidebar, Topbar, LoginScreen, Dashboard, JournalList, JournalForm, InvoiceList, InvoiceCreate, BankMatch */
const { useState: useStateApp, useEffect: useEffectApp } = React;

function App() {
  const [authed, setAuthed] = useStateApp(true);
  const [route, setRoute] = useStateApp('invoices');

  useEffectApp(() => { window.lucide && window.lucide.createIcons(); });

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  let view;
  switch (route) {
    case 'dashboard':       view = <Dashboard />; break;
    case 'journal':         view = <JournalList onCreate={() => setRoute('journal-form')} />; break;
    case 'journal-form':    view = <JournalForm onSave={() => setRoute('journal')} onCancel={() => setRoute('journal')} />; break;
    case 'invoices':        view = <InvoiceList onCreate={() => setRoute('invoice-create')} />; break;
    case 'invoice-create':  view = <InvoiceCreate onSave={() => setRoute('invoices')} onCancel={() => setRoute('invoices')} />; break;
    case 'bank':            view = <BankMatch />; break;
    case 'partners':        view = <PartnersList />; break;
    case 'reports':         view = <ReportsScreen />; break;
    case 'voucher':         view = <VoucherScreen />; break;
    case 'settings':        view = <SettingsScreen />; break;
    default: view = <EmptyScreen route={route} />;
  }

  return (
    <div className="app">
      <Sidebar active={route} onNavigate={setRoute} />
      <Topbar />
      <main className="main" data-screen-label={route}>{view}</main>
    </div>
  );
}

function EmptyScreen({ route }) {
  const labels = {
    dashboard: 'ホーム',
    estimate: '見積書',
    delivery: '納品書',
    journal: '仕訳帳',
    bank: '銀行連携',
    expenses: '経費精算',
    reports: 'レポート',
    tax: '消費税・インボイス',
    partners: '取引先・送付先',
    items: '品目',
    settings: '設定',
    trash: 'ごみ箱',
  };
  return (
    <div>
      <h1 className="yc-h1">{labels[route] || route}</h1>
      <div style={{ marginTop: 60, textAlign: 'center', color: '#64748b' }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: '#f1f5f9', margin: '0 auto 14px', display: 'grid', placeItems: 'center' }}>
          <Icon name="layout-grid" size={24} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#1E293B' }}>このセクションはサンプル UI キットでは未実装です</div>
        <div style={{ fontSize: 12, marginTop: 6 }}>請求書一覧／作成、ホーム、仕訳帳、銀行連携の参考実装をご覧ください。</div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
