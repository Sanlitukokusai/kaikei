// Hand-written subset for the `accounting` schema.
// Regenerate from Supabase when schema changes.

export type Json = string | number | boolean | null | { [k: string]: Json | undefined } | Json[];

export type Company = {
  id: string;
  name: string;
  name_kana: string | null;
  legal_form: "llc" | "kk" | "sole" | "other";
  invoice_reg_no: string | null;
  corporate_number: string | null;
  fiscal_year_start_month: number;
  base_currency: string;
  postal_code: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  representative: string | null;
  tax_method: "general" | "simple" | "two_percent" | "exempt" | null;
  created_at: string;
  updated_at: string;
};

export type Account = {
  id: string;
  company_id: string;
  code: string;
  name: string;
  category: "asset" | "liability" | "equity" | "revenue" | "expense";
  subcategory: string | null;
  tax_default: string | null;
  parent_id: string | null;
  is_active: boolean;
  created_at: string;
};

export type Partner = {
  id: string;
  company_id: string;
  name: string;
  name_kana: string | null;
  kind: "corp" | "individual" | "overseas";
  invoice_reg_no: string | null;
  is_qualified_invoice: boolean;
  postal_code: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  bank_account: Json | null;
  default_payment_terms: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Invoice = {
  id: string;
  company_id: string;
  invoice_no: string;
  invoice_date: string;
  due_date: string | null;
  partner_id: string | null;
  subject: string | null;
  bank_account_id: string | null;
  notes: string | null;
  subtotal: number;
  tax_total: number;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  payment_status: "unbilled" | "billed" | "paid";
  data_sync_status: "not_sent" | "synced" | "failed";
  pdf_path: string | null;
  emailed_at: string | null;
  paid_at: string | null;
  journal_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  line_no: number;
  item_code: string | null;
  item_name: string | null;
  transaction_date: string | null;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  tax_rate: number;
  amount: number;
};

export type BankAccount = {
  id: string;
  company_id: string;
  bank_name: string;
  branch_name: string | null;
  account_type: string | null;
  account_number: string | null;
  account_holder_kana: string | null;
  is_default: boolean;
  created_at: string;
};

export type Estimate = {
  id: string;
  company_id: string;
  estimate_no: string;
  estimate_date: string;
  valid_until: string | null;
  partner_id: string | null;
  subject: string | null;
  notes: string | null;
  subtotal: number;
  tax_total: number;
  total: number;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired" | "cancelled";
  delivery_note_id: string | null;
  invoice_id: string | null;
  pdf_path: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type EstimateItem = {
  id: string;
  estimate_id: string;
  line_no: number;
  item_code: string | null;
  item_name: string | null;
  transaction_date: string | null;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  tax_rate: number;
  amount: number;
};

export type DeliveryNote = {
  id: string;
  company_id: string;
  delivery_no: string;
  delivery_date: string;
  partner_id: string | null;
  subject: string | null;
  notes: string | null;
  subtotal: number;
  tax_total: number;
  total: number;
  status: "draft" | "sent" | "invoiced" | "cancelled";
  invoice_id: string | null;
  pdf_path: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type DeliveryNoteItem = {
  id: string;
  delivery_note_id: string;
  line_no: number;
  item_code: string | null;
  item_name: string | null;
  transaction_date: string | null;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  tax_rate: number;
  amount: number;
};

export type JournalEntry = {
  id: string;
  company_id: string;
  fiscal_year_id: string | null;
  entry_date: string;
  voucher_no: string | null;
  description: string | null;
  source_type: "manual" | "ocr" | "bank_import" | "invoice" | "api";
  source_id: string | null;
  status: "draft" | "pending" | "confirmed" | "rejected";
  is_locked: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type JournalLine = {
  id: string;
  journal_id: string;
  line_no: number;
  side: "debit" | "credit";
  account_id: string | null;
  partner_id: string | null;
  amount_jpy: number;
  original_currency: string;
  original_amount: number | null;
  fx_rate: number | null;
  tax_category: string | null;
  tax_amount_jpy: number;
  memo: string | null;
};

export type BankTransaction = {
  id: string;
  company_id: string;
  bank_account_id: string | null;
  txn_date: string;
  description: string;
  amount_jpy: number;
  balance_jpy: number | null;
  external_id: string | null;
  raw: Json | null;
  suggested_account_id: string | null;
  suggested_partner_id: string | null;
  suggested_memo: string | null;
  confidence: number | null;
  match_status: "pending" | "matched" | "rejected" | "ignored";
  journal_id: string | null;
  imported_at: string;
  matched_at: string | null;
  matched_by: string | null;
};

export type Voucher = {
  id: string;
  company_id: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
  voucher_type: "receipt" | "invoice_received" | "contract" | "other";
  ocr_status: "pending" | "processing" | "done" | "failed";
  ocr_confidence: number | null;
  extracted_vendor: string | null;
  extracted_date: string | null;
  extracted_total: number | null;
  extracted_tax: number | null;
  extracted_reg_no: string | null;
  journal_id: string | null;
};
