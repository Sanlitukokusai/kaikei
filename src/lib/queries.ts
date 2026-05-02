import { DEMO_COMPANY_ID, serverClient } from "./supabase";
import type { Account, BankTransaction, Invoice, JournalEntry, JournalLine, Partner } from "./database.types";

export async function listPartners(companyId: string = DEMO_COMPANY_ID): Promise<Partner[]> {
  const sb = await serverClient();
  const { data, error } = await sb
    .from("partners")
    .select("*")
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Partner[];
}

export async function listInvoices(
  companyId: string = DEMO_COMPANY_ID,
): Promise<Array<Invoice & { partner: Partner | null }>> {
  const sb = await serverClient();
  const { data, error } = await sb
    .from("invoices")
    .select("*, partner:partners(*)")
    .eq("company_id", companyId)
    .order("invoice_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Array<Invoice & { partner: Partner | null }>;
}

export async function listAccounts(companyId: string = DEMO_COMPANY_ID): Promise<Account[]> {
  const sb = await serverClient();
  const { data, error } = await sb
    .from("accounts")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("code");
  if (error) throw error;
  return (data ?? []) as Account[];
}

type PartnerSalesRow = { partner_id: string; total: number; due: number; last: string };

export async function partnerSalesSummary(
  companyId: string = DEMO_COMPANY_ID,
): Promise<Map<string, PartnerSalesRow>> {
  const sb = await serverClient();
  const { data, error } = await sb
    .from("invoices")
    .select("partner_id, total, payment_status, invoice_date")
    .eq("company_id", companyId);
  if (error) throw error;
  const map = new Map<string, PartnerSalesRow>();
  for (const row of data ?? []) {
    if (!row.partner_id) continue;
    const cur = map.get(row.partner_id) ?? { partner_id: row.partner_id, total: 0, due: 0, last: "" };
    cur.total += row.total ?? 0;
    if (row.payment_status !== "paid") cur.due += row.total ?? 0;
    if (!cur.last || row.invoice_date > cur.last) cur.last = row.invoice_date;
    map.set(row.partner_id, cur);
  }
  return map;
}

type JournalLineWithRefs = JournalLine & {
  account: Pick<Account, "id" | "code" | "name"> | null;
  partner: Pick<Partner, "id" | "name"> | null;
};

export type JournalEntryWithLines = JournalEntry & { lines: JournalLineWithRefs[] };

export async function listJournalEntries(
  companyId: string = DEMO_COMPANY_ID,
  limit = 50,
): Promise<JournalEntryWithLines[]> {
  const sb = await serverClient();
  const { data, error } = await sb
    .from("journal_entries")
    .select(
      `*, lines:journal_lines(
         id, journal_id, line_no, side, account_id, partner_id,
         amount_jpy, original_currency, original_amount, fx_rate,
         tax_category, tax_amount_jpy, memo,
         account:accounts(id, code, name),
         partner:partners(id, name)
       )`
    )
    .eq("company_id", companyId)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  // Sort lines by line_no within each entry
  for (const e of (data ?? []) as JournalEntryWithLines[]) {
    e.lines.sort((a, b) => a.line_no - b.line_no);
  }
  return (data ?? []) as JournalEntryWithLines[];
}

export type BankTransactionWithRefs = BankTransaction & {
  account: Pick<Account, "id" | "code" | "name"> | null;
  partner: Pick<Partner, "id" | "name"> | null;
};

export async function listBankTransactions(
  companyId: string = DEMO_COMPANY_ID,
): Promise<BankTransactionWithRefs[]> {
  const sb = await serverClient();
  const { data, error } = await sb
    .from("bank_transactions")
    .select(
      `*,
       account:accounts!suggested_account_id(id, code, name),
       partner:partners!suggested_partner_id(id, name)`
    )
    .eq("company_id", companyId)
    .order("txn_date", { ascending: false })
    .order("imported_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BankTransactionWithRefs[];
}

export async function getCurrentUser() {
  const sb = await serverClient();
  const { data } = await sb.auth.getUser();
  return data.user;
}

// ── Financial reports ──────────────────────────────────────────────────────

export type TrialBalanceLine = {
  account_id: string;
  code: string;
  name: string;
  category: Account["category"];
  subcategory: string | null;
  debit: number;
  credit: number;
  /** Normal-side balance: positive = amount on normal side */
  balance: number;
};

export async function getTrialBalance(
  companyId: string = DEMO_COMPANY_ID,
  dateFrom: string,
  dateTo: string,
): Promise<TrialBalanceLine[]> {
  const sb = await serverClient();
  // Fetch confirmed entries with lines + account details in range
  const { data, error } = await sb
    .from("journal_entries")
    .select(
      `id, lines:journal_lines(
         side, amount_jpy, account_id,
         account:accounts(id, code, name, category, subcategory)
       )`
    )
    .eq("company_id", companyId)
    .eq("status", "confirmed")
    .gte("entry_date", dateFrom)
    .lte("entry_date", dateTo);
  if (error) throw error;

  // Aggregate debit/credit per account
  const map = new Map<string, TrialBalanceLine>();
  for (const entry of data ?? []) {
    for (const line of (entry.lines as unknown) as Array<{
      side: "debit" | "credit"; amount_jpy: number;
      account: { id: string; code: string; name: string; category: Account["category"]; subcategory: string | null } | null;
    }>) {
      if (!line.account) continue;
      const a = line.account;
      const cur = map.get(a.id) ?? {
        account_id: a.id, code: a.code, name: a.name,
        category: a.category, subcategory: a.subcategory,
        debit: 0, credit: 0, balance: 0,
      };
      if (line.side === "debit") cur.debit += line.amount_jpy;
      else cur.credit += line.amount_jpy;
      map.set(a.id, cur);
    }
  }

  // Compute normal-side balance
  for (const row of map.values()) {
    const normalDebit = row.category === "asset" || row.category === "expense";
    row.balance = normalDebit ? row.debit - row.credit : row.credit - row.debit;
  }

  return [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
}

export type FinancialSummary = {
  revenue: TrialBalanceLine[];
  cogs: TrialBalanceLine[];
  sga: TrialBalanceLine[];
  nonOpIncome: TrialBalanceLine[];
  nonOpExpense: TrialBalanceLine[];
  assets: TrialBalanceLine[];
  liabilities: TrialBalanceLine[];
  equity: TrialBalanceLine[];
  // computed totals
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  totalSga: number;
  operatingProfit: number;
  totalNonOpIncome: number;
  totalNonOpExpense: number;
  ordinaryProfit: number;
  netIncome: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
};

export function buildFinancialSummary(tb: TrialBalanceLine[]): FinancialSummary {
  const revenue = tb.filter((r) => r.category === "revenue");
  const allExpense = tb.filter((r) => r.category === "expense");
  // Split expenses by subcategory; fall back to code-range heuristic
  const cogs = allExpense.filter((r) =>
    r.subcategory === "cogs" || r.subcategory === "cost_of_sales" || r.code.startsWith("5")
  );
  const nonOpExpense = allExpense.filter((r) =>
    r.subcategory === "non_operating" || r.subcategory === "non_op_expense" || r.code.startsWith("8")
  );
  const sga = allExpense.filter((r) => !cogs.includes(r) && !nonOpExpense.includes(r));
  const nonOpIncome = revenue.filter((r) =>
    r.subcategory === "non_operating" || r.subcategory === "non_op_income" || r.code.startsWith("7")
  );
  const mainRevenue = revenue.filter((r) => !nonOpIncome.includes(r));

  const sum = (rows: TrialBalanceLine[]) => rows.reduce((s, r) => s + r.balance, 0);

  const totalRevenue = sum(mainRevenue);
  const totalCogs = sum(cogs);
  const grossProfit = totalRevenue - totalCogs;
  const totalSga = sum(sga);
  const operatingProfit = grossProfit - totalSga;
  const totalNonOpIncome = sum(nonOpIncome);
  const totalNonOpExpense = sum(nonOpExpense);
  const ordinaryProfit = operatingProfit + totalNonOpIncome - totalNonOpExpense;
  const netIncome = ordinaryProfit; // simplified: no taxes in demo

  const assets = tb.filter((r) => r.category === "asset");
  const liabilities = tb.filter((r) => r.category === "liability");
  const equity = tb.filter((r) => r.category === "equity");

  return {
    revenue: mainRevenue, cogs, sga, nonOpIncome, nonOpExpense,
    assets, liabilities, equity,
    totalRevenue, totalCogs, grossProfit,
    totalSga, operatingProfit,
    totalNonOpIncome, totalNonOpExpense, ordinaryProfit, netIncome,
    totalAssets: sum(assets),
    totalLiabilities: sum(liabilities),
    totalEquity: sum(equity) + netIncome,
  };
}

export async function listVouchers(companyId: string = DEMO_COMPANY_ID) {
  const sb = await serverClient();
  const { data, error } = await sb
    .from("vouchers")
    .select("*")
    .eq("company_id", companyId)
    .order("uploaded_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
