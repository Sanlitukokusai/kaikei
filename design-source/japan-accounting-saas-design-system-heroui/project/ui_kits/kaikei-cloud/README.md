# Kaikei Cloud — UI Kit

A click-thru high-fidelity recreation of the seven core screens of Kaikei Cloud (会計クラウド).

## Screens

1. **Login / Sign-up** — `screens/Login.jsx`
2. **Dashboard** (KPI summary, charts, alerts) — `screens/Dashboard.jsx`
3. **Journal list** (仕訳帳) — `screens/JournalList.jsx`
4. **Journal entry form** (仕訳入力) — `screens/JournalForm.jsx`
5. **Invoice list / detail** — `screens/InvoiceList.jsx`
6. **Invoice create** — `screens/InvoiceCreate.jsx`
7. **Bank reconciliation / matching** — `screens/BankMatch.jsx`

## Components

- `components/AppShell.jsx` — sidebar + topbar + main area
- `components/Sidebar.jsx`
- `components/Topbar.jsx`
- `components/Button.jsx`, `Input.jsx`, `Chip.jsx`, `Card.jsx`, `Table.jsx`, `Icon.jsx`

Open `index.html` to see the full app. The sidebar lets you navigate between screens; state is mocked in-memory.
