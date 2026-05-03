import Icon from "@/components/Icon";
import { Card } from "@/components/ui";
import { listBankTransactions, listAccounts, listBankAccounts } from "@/lib/queries";
import BankRow from "./BankRow";
import BankImportClient from "./BankImportClient";

export const dynamic = "force-dynamic";

const accountTypeLabel: Record<string, string> = {
  checking: "普通",
  savings: "貯蓄",
  current: "当座",
};

export default async function BankMatchPage() {
  const [txns, accounts, bankAccounts] = await Promise.all([
    listBankTransactions(),
    listAccounts(),
    listBankAccounts(),
  ]);
  const pending = txns.filter((t) => t.match_status === "pending");
  const primary = bankAccounts.find((b) => b.is_default) ?? bankAccounts[0] ?? null;
  const headerLine = primary
    ? [
        primary.bank_name,
        primary.branch_name,
        primary.account_type
          ? `${accountTypeLabel[primary.account_type] ?? primary.account_type}${primary.account_number ? ` ${primary.account_number}` : ""}`
          : null,
      ].filter(Boolean).join(" / ")
    : "銀行口座が未登録";

  return (
    <div>
      <div className="page-h">
        <div>
          <div className="breadcrumb">
            <Icon name="Home" size={12} /><span>ホーム</span> / <span style={{ color: "var(--foreground-700)" }}>銀行連携</span>
          </div>
          <h1 className="h1">銀行連携・取引マッチング</h1>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            {headerLine} · 取込済 {txns.length}件 · 未処理 {pending.length}件
          </div>
        </div>
        <div className="row">
          <BankImportClient />
        </div>
      </div>

      {pending.length > 0 && (
        <div className="alert info">
          <Icon name="Sparkles" size={18} />
          <div style={{ flex: 1 }}>
            AIが <strong>{pending.length}件中{pending.filter((t) => (t.confidence ?? 0) >= 0.9).length}件</strong> を高信頼度で提案しました。確認して承認すると仕訳が自動作成されます。
          </div>
        </div>
      )}

      <Card className="tight">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 80 }}>日付</th>
              <th>取引内容（銀行明細）</th>
              <th className="num">金額</th>
              <th style={{ width: 360 }}>提案された仕訳</th>
              <th style={{ width: 220 }}>マッチング</th>
            </tr>
          </thead>
          <tbody>
            {txns.map((t) => <BankRow key={t.id} txn={t} accounts={accounts} />)}
            {txns.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 32, color: "var(--foreground-500)" }}>取込み済みの取引はまだありません</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
