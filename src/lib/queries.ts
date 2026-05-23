import { DEMO_COMPANY_ID, serverClient } from "./supabase";
import type { Account, BankAccount, BankTransaction, Company, DeliveryNote, DeliveryNoteItem, Estimate, EstimateItem, Invoice, InvoiceItem, JournalEntry, JournalLine, Partner } from "./database.types";

export type EstimateWithItems = Estimate & {
  partner: Partner | null;
  items: EstimateItem[];
};

export async function listEstimates(
  companyId: string = DEMO_COMPANY_ID,
): Promise<Array<Estimate & { partner: Partner | null }>> {
  const sb = await serverClient();
  const { data, error } = await sb
    .from("estimates")
    .select("*, partner:partners(*)")
    .eq("company_id", companyId)
    .order("estimate_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Array<Estimate & { partner: Partner | null }>;
}

export async function getEstimate(
  id: string,
  companyId: string = DEMO_COMPANY_ID,
): Promise<EstimateWithItems | null> {
  const sb = await serverClient();
  const { data, error } = await sb
    .from("estimates")
    .select("*, partner:partners(*), items:estimate_items(*)")
    .eq("id", id)
    .eq("company_id", companyId)
    .order("line_no", { ascending: true, referencedTable: "estimate_items" })
    .single();
  if (error) return null;
  return data as EstimateWithItems;
}

export type DeliveryNoteWithItems = DeliveryNote & {
  partner: Partner | null;
  items: DeliveryNoteItem[];
};

export async function listDeliveryNotes(
  companyId: string = DEMO_COMPANY_ID,
): Promise<Array<DeliveryNote & { partner: Partner | null }>> {
  const sb = await serverClient();
  const { data, error } = await sb
    .from("delivery_notes")
    .select("*, partner:partners(*)")
    .eq("company_id", companyId)
    .order("delivery_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Array<DeliveryNote & { partner: Partner | null }>;
}

export async function getDeliveryNote(
  id: string,
  companyId: string = DEMO_COMPANY_ID,
): Promise<DeliveryNoteWithItems | null> {
  const sb = await serverClient();
  const { data, error } = await sb
    .from("delivery_notes")
    .select("*, partner:partners(*), items:delivery_note_items(*)")
    .eq("id", id)
    .eq("company_id", companyId)
    .order("line_no", { ascending: true, referencedTable: "delivery_note_items" })
    .single();
  if (error) return null;
  return data as DeliveryNoteWithItems;
}

export async function listBankAccounts(
  companyId: string = DEMO_COMPANY_ID,
): Promise<BankAccount[]> {
  const sb = await serverClient();
  const { data, error } = await sb
    .from("bank_accounts")
    .select("*")
    .eq("company_id", companyId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as BankAccount[];
}

export async function getCompany(
  companyId: string = DEMO_COMPANY_ID,
): Promise<Company | null> {
  const sb = await serverClient();
  const { data } = await sb.from("companies").select("*").eq("id", companyId).single();
  return (data as Company) ?? null;
}

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

export type InvoiceWithItems = Invoice & {
  partner: Partner | null;
  items: InvoiceItem[];
};

export async function getInvoice(
  id: string,
  companyId: string = DEMO_COMPANY_ID,
): Promise<InvoiceWithItems | null> {
  const sb = await serverClient();
  const { data, error } = await sb
    .from("invoices")
    .select("*, partner:partners(*), items:invoice_items(*)")
    .eq("id", id)
    .eq("company_id", companyId)
    .order("line_no", { ascending: true, referencedTable: "invoice_items" })
    .single();
  if (error) return null;
  return data as InvoiceWithItems;
}

export async function listOverdueInvoices(
  companyId: string = DEMO_COMPANY_ID,
): Promise<Array<Invoice & { partner: Partner | null }>> {
  const today = new Date().toISOString().slice(0, 10);
  const sb = await serverClient();
  const { data, error } = await sb
    .from("invoices")
    .select("*, partner:partners(*)")
    .eq("company_id", companyId)
    .neq("payment_status", "paid")
    .lt("due_date", today)
    .not("due_date", "is", null)
    .order("due_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Array<Invoice & { partner: Partner | null }>;
}

export async function listJournalEntriesForExport(
  companyId: string = DEMO_COMPANY_ID,
  dateFrom: string,
  dateTo: string,
) {
  const sb = await serverClient();
  const { data, error } = await sb
    .from("journal_entries")
    .select(
      `id, entry_date, voucher_no, description, status,
       lines:journal_lines(
         line_no, side, amount_jpy, memo,
         account:accounts(code, name),
         partner:partners(name)
       )`
    )
    .eq("company_id", companyId)
    .gte("entry_date", dateFrom)
    .lte("entry_date", dateTo)
    .order("entry_date", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Array<{
    id: string; entry_date: string; voucher_no: string | null;
    description: string | null; status: string;
    lines: Array<{
      line_no: number; side: string; amount_jpy: number; memo: string | null;
      account: { code: string; name: string } | null;
      partner: { name: string } | null;
    }>;
  }>;
}

// ── Dashboard summary ─────────────────────────────────────────────────────

export type DashboardSummary = {
  period: { year: number; month: number };
  revenue: number;
  expense: number;
  netIncome: number;
  revenueDeltaPct: number | null;
  expenseDeltaPct: number | null;
  netIncomeDeltaPct: number | null;
  cashBalance: number;
  cashAccountCount: number;
  trend: Array<{ label: string; revenue: number; prevYearRevenue: number }>;
  breakdown: Array<{ name: string; amt: number; pct: number; color: string }>;
};

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const monthStartStr = (y: number, m0: number) => ymd(new Date(Date.UTC(y, m0, 1)));
const monthEndStr = (y: number, m0: number) => ymd(new Date(Date.UTC(y, m0 + 1, 0)));

export async function getDashboardSummary(
  companyId: string = DEMO_COMPANY_ID,
  refDate: Date = new Date(),
): Promise<DashboardSummary> {
  const year = refDate.getUTCFullYear();
  const month0 = refDate.getUTCMonth();

  const currStart = monthStartStr(year, month0);
  const currEnd = monthEndStr(year, month0);
  const prevYr = month0 === 0 ? year - 1 : year;
  const prevMo = month0 === 0 ? 11 : month0 - 1;

  const sumRevenue = (tb: TrialBalanceLine[]) =>
    tb.filter((r) => r.category === "revenue").reduce((s, r) => s + r.balance, 0);
  const sumExpense = (tb: TrialBalanceLine[]) =>
    tb.filter((r) => r.category === "expense").reduce((s, r) => s + r.balance, 0);

  const trendTbs = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const idx = 5 - i;
      const t = new Date(Date.UTC(year, month0 - idx, 1));
      const ty = t.getUTCFullYear();
      const tm = t.getUTCMonth();
      return Promise.all([
        getTrialBalance(companyId, monthStartStr(ty, tm), monthEndStr(ty, tm)),
        getTrialBalance(companyId, monthStartStr(ty - 1, tm), monthEndStr(ty - 1, tm)),
      ]).then(([tb, prevYrTb]) => ({
        label: `${tm + 1}月`,
        ty,
        tm,
        tb,
        prevYrRevenue: sumRevenue(prevYrTb),
      }));
    }),
  );

  const currTb = trendTbs[5].tb;
  const prevTb = await getTrialBalance(
    companyId,
    monthStartStr(prevYr, prevMo),
    monthEndStr(prevYr, prevMo),
  );

  const allTimeTb = await getTrialBalance(companyId, "1900-01-01", currEnd);
  const cashAccounts = allTimeTb.filter(
    (r) => r.category === "asset" && (r.code.startsWith("111") || r.code.startsWith("112")),
  );
  const cashBalance = cashAccounts.reduce((s, r) => s + r.balance, 0);

  const revenue = sumRevenue(currTb);
  const expense = sumExpense(currTb);
  const prevRevenue = sumRevenue(prevTb);
  const prevExpense = sumExpense(prevTb);
  const netIncome = revenue - expense;
  const prevNet = prevRevenue - prevExpense;

  const pct = (curr: number, prev: number) =>
    prev === 0 ? null : ((curr - prev) / Math.abs(prev)) * 100;

  const colors = ["#006FEE", "#338ef7", "#7EE7FC", "#7828c8", "#f5a524"];
  const expenseRows = currTb
    .filter((r) => r.category === "expense" && r.balance > 0)
    .sort((a, b) => b.balance - a.balance);
  const top4 = expenseRows.slice(0, 4);
  const others = expenseRows.slice(4);
  const othersTotal = others.reduce((s, r) => s + r.balance, 0);
  const totalForPct = expense || 1;
  const breakdown: DashboardSummary["breakdown"] = [
    ...top4.map((r, i) => ({
      name: r.name,
      amt: r.balance,
      pct: Math.round((r.balance / totalForPct) * 100),
      color: colors[i],
    })),
  ];
  if (others.length > 0) {
    breakdown.push({
      name: "その他",
      amt: othersTotal,
      pct: Math.round((othersTotal / totalForPct) * 100),
      color: "var(--zinc-300)",
    });
  }

  return {
    period: { year, month: month0 + 1 },
    revenue,
    expense,
    netIncome,
    revenueDeltaPct: pct(revenue, prevRevenue),
    expenseDeltaPct: pct(expense, prevExpense),
    netIncomeDeltaPct: pct(netIncome, prevNet),
    cashBalance,
    cashAccountCount: cashAccounts.length,
    trend: trendTbs.map((t) => ({
      label: t.label,
      revenue: sumRevenue(t.tb),
      prevYearRevenue: t.prevYrRevenue,
    })),
    breakdown,
  };
}

export async function getTaxSummary(
  companyId: string = DEMO_COMPANY_ID,
  dateFrom: string,
  dateTo: string,
) {
  const sb = await serverClient();
  const { data, error } = await sb
    .from("journal_entries")
    .select(
      `lines:journal_lines(side, amount_jpy, tax_category, tax_amount_jpy)`
    )
    .eq("company_id", companyId)
    .eq("status", "confirmed")
    .gte("entry_date", dateFrom)
    .lte("entry_date", dateTo);
  if (error) throw error;

  const summary: Record<string, { base: number; tax: number }> = {};
  for (const entry of data ?? []) {
    for (const line of (entry.lines as Array<{
      side: string; amount_jpy: number;
      tax_category: string | null; tax_amount_jpy: number | null;
    }>)) {
      const cat = line.tax_category ?? "不明";
      if (!summary[cat]) summary[cat] = { base: 0, tax: 0 };
      summary[cat].base += line.amount_jpy;
      summary[cat].tax += line.tax_amount_jpy ?? 0;
    }
  }
  return summary;
}
