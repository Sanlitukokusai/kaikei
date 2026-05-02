"use client";
import { useState, useTransition } from "react";
import Icon from "@/components/Icon";
import { Button, Chip } from "@/components/ui";
import type { BankTransactionWithRefs } from "@/lib/queries";
import type { Account } from "@/lib/database.types";
import { approveBankMatch, rejectBankMatch, updateBankSuggestion } from "@/app/actions/bank";

const fmtDate = (d: string) => d.slice(5).replaceAll("-", "/");

export default function BankRow({
  txn,
  accounts,
}: {
  txn: BankTransactionWithRefs;
  accounts: Account[];
}) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [editAccount, setEditAccount] = useState(txn.suggested_account_id ?? "");
  const [editMemo, setEditMemo] = useState(txn.suggested_memo ?? "");

  const dir = txn.amount_jpy >= 0 ? "in" : "out";
  const conf = txn.confidence ?? 0;
  const sug = [
    txn.partner?.name,
    txn.account ? txn.account.name : null,
    txn.suggested_memo,
  ].filter(Boolean).join(" · ");

  const act = (fn: () => Promise<void>) => () =>
    startTransition(async () => {
      try { await fn(); }
      catch (e: unknown) { alert(e instanceof Error ? e.message : String(e)); }
    });

  const handleSaveEdit = act(async () => {
    await updateBankSuggestion(txn.id, editAccount, editMemo || null);
    setEditing(false);
  });

  if (editing) {
    return (
      <tr style={{ background: "#eff6ff" }}>
        <td>{fmtDate(txn.txn_date)}</td>
        <td>
          <div style={{ fontSize: 12, color: "var(--foreground-600)" }}>{txn.description}</div>
        </td>
        <td className={`num ${dir === "in" ? "pos" : "neg"}`}>
          {dir === "in" ? "+" : ""}¥{txn.amount_jpy.toLocaleString()}
        </td>
        <td colSpan={2}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={editAccount}
              onChange={(e) => setEditAccount(e.target.value)}
              className="input"
              style={{ flex: 1, minWidth: 180, height: 32, fontSize: 12 }}
            >
              <option value="">勘定科目を選択</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.code} {a.name}</option>
              ))}
            </select>
            <input
              value={editMemo}
              onChange={(e) => setEditMemo(e.target.value)}
              placeholder="メモ（任意）"
              className="input"
              style={{ width: 160, height: 32, fontSize: 12 }}
            />
            <Button variant="primary" size="sm" icon="Check" onClick={handleSaveEdit} disabled={isPending || !editAccount}>保存</Button>
            <Button variant="light" size="sm" onClick={() => setEditing(false)} disabled={isPending}>×</Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>{fmtDate(txn.txn_date)}</td>
      <td>
        <div className="row">
          <Icon
            name={dir === "in" ? "ArrowDownLeft" : "ArrowUpRight"}
            size={14}
            style={{ color: dir === "in" ? "var(--money-positive)" : "var(--money-negative)" }}
          />
          <span>{txn.description}</span>
        </div>
      </td>
      <td className={`num ${dir === "in" ? "pos" : "neg"}`}>
        {dir === "in" ? "+" : ""}¥{txn.amount_jpy.toLocaleString()}
      </td>
      <td>
        {sug ? (
          <div style={{ background: "var(--zinc-50)", borderRadius: 8, padding: "8px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="Sparkles" size={12} style={{ color: "var(--primary)" }} />
            <span style={{ flex: 1 }}>{sug}</span>
            <span style={{ fontSize: 10, color: "var(--foreground-500)" }}>{Math.round(conf * 100)}%</span>
          </div>
        ) : (
          <span style={{ color: "var(--foreground-500)", fontSize: 12 }}>提案なし</span>
        )}
      </td>
      <td>
        {txn.match_status === "matched" ? (
          <Chip tone="s">承認済</Chip>
        ) : txn.match_status === "rejected" ? (
          <Chip tone="d">却下</Chip>
        ) : (
          <div className="row">
            <Button variant="primary" size="sm" icon="Check" onClick={act(() => approveBankMatch(txn.id))} disabled={isPending || !txn.suggested_account_id}>承認</Button>
            <Button variant="light" size="sm" icon="X" onClick={act(() => rejectBankMatch(txn.id))} disabled={isPending} />
            <Button variant="light" size="sm" icon="Pencil" onClick={() => setEditing(true)} disabled={isPending} />
          </div>
        )}
      </td>
    </tr>
  );
}
