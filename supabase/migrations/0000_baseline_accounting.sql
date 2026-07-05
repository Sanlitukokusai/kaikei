-- ============================================================
-- kaikei — accounting schema baseline
-- 从线上库 wfstwbeehomzdudvikbt（ProjecctMain）的 accounting schema 反向生成
-- 通过 Supabase MCP 用 pg_get_constraintdef/pg_get_indexdef/pg_get_functiondef 逐字导出
-- 生成日期：2026-06-15。包含：18 表 + 约束 + 索引 + 函数 + 触发器 + RLS 策略
-- 注意：另有一个挂在 auth.users 上的触发器调用 accounting.handle_new_user()，
--       属 auth schema，需在 Supabase 控制台单独维护（此处仅含函数本体）。
-- ============================================================

CREATE SCHEMA IF NOT EXISTS accounting;

-- ---------- 序列 ----------
CREATE SEQUENCE IF NOT EXISTS accounting.audit_logs_id_seq;

-- ---------- 表 ----------
CREATE TABLE accounting.accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  subcategory text,
  tax_default text,
  parent_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE accounting.audit_logs (
  id bigint NOT NULL DEFAULT nextval('accounting.audit_logs_id_seq'::regclass),
  company_id uuid,
  user_id uuid,
  table_name text NOT NULL,
  record_id text,
  action text NOT NULL,
  before_data jsonb,
  after_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE accounting.bank_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  bank_name text NOT NULL,
  branch_name text,
  account_type text NOT NULL DEFAULT 'futsuu'::text,
  account_number text NOT NULL,
  account_holder_kana text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE accounting.bank_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  bank_account_id uuid,
  txn_date date NOT NULL,
  description text NOT NULL,
  amount_jpy bigint NOT NULL,
  balance_jpy bigint,
  external_id text,
  raw jsonb,
  suggested_account_id uuid,
  suggested_partner_id uuid,
  suggested_memo text,
  confidence numeric(4,3),
  match_status text NOT NULL DEFAULT 'pending'::text,
  journal_id uuid,
  imported_at timestamp with time zone NOT NULL DEFAULT now(),
  matched_at timestamp with time zone,
  matched_by uuid
);

CREATE TABLE accounting.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_kana text,
  legal_form text NOT NULL DEFAULT 'llc'::text,
  invoice_reg_no text,
  corporate_number text,
  fiscal_year_start_month smallint NOT NULL DEFAULT 4,
  base_currency text NOT NULL DEFAULT 'JPY'::text,
  postal_code text,
  address text,
  phone text,
  email text,
  representative text,
  tax_method text DEFAULT 'general'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE accounting.company_members (
  company_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL,
  invited_at timestamp with time zone DEFAULT now(),
  accepted_at timestamp with time zone
);

CREATE TABLE accounting.delivery_note_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  delivery_note_id uuid NOT NULL,
  line_no smallint NOT NULL,
  item_code text,
  item_name text,
  transaction_date date,
  quantity numeric,
  unit text,
  unit_price bigint,
  tax_rate smallint NOT NULL DEFAULT 10,
  amount bigint NOT NULL DEFAULT 0
);

CREATE TABLE accounting.delivery_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  delivery_no text NOT NULL,
  delivery_date date NOT NULL,
  partner_id uuid,
  subject text,
  notes text,
  subtotal bigint NOT NULL DEFAULT 0,
  tax_total bigint NOT NULL DEFAULT 0,
  total bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft'::text,
  invoice_id uuid,
  pdf_path text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE accounting.estimate_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  estimate_id uuid NOT NULL,
  line_no smallint NOT NULL,
  item_code text,
  item_name text,
  transaction_date date,
  quantity numeric,
  unit text,
  unit_price bigint,
  tax_rate smallint NOT NULL DEFAULT 10,
  amount bigint NOT NULL DEFAULT 0
);

CREATE TABLE accounting.estimates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  estimate_no text NOT NULL,
  estimate_date date NOT NULL,
  valid_until date,
  partner_id uuid,
  subject text,
  notes text,
  subtotal bigint NOT NULL DEFAULT 0,
  tax_total bigint NOT NULL DEFAULT 0,
  total bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft'::text,
  delivery_note_id uuid,
  invoice_id uuid,
  pdf_path text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE accounting.exchange_rates (
  rate_date date NOT NULL,
  base_currency text NOT NULL DEFAULT 'JPY'::text,
  quote_currency text NOT NULL,
  rate numeric(18,8) NOT NULL,
  source text NOT NULL DEFAULT 'exchangerate.host'::text,
  is_manual boolean NOT NULL DEFAULT false
);

CREATE TABLE accounting.fiscal_years (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_closed boolean NOT NULL DEFAULT false,
  closed_at timestamp with time zone,
  closed_by uuid
);

CREATE TABLE accounting.invoice_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL,
  line_no smallint NOT NULL,
  item_code text,
  item_name text,
  transaction_date date,
  quantity numeric(18,4),
  unit text,
  unit_price bigint,
  tax_rate smallint NOT NULL DEFAULT 10,
  amount bigint NOT NULL DEFAULT 0
);

CREATE TABLE accounting.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  invoice_no text NOT NULL,
  invoice_date date NOT NULL,
  due_date date,
  partner_id uuid,
  subject text,
  bank_account_id uuid,
  notes text,
  subtotal bigint NOT NULL DEFAULT 0,
  tax_total bigint NOT NULL DEFAULT 0,
  total bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft'::text,
  payment_status text NOT NULL DEFAULT 'unbilled'::text,
  data_sync_status text NOT NULL DEFAULT 'not_sent'::text,
  pdf_path text,
  emailed_at timestamp with time zone,
  paid_at timestamp with time zone,
  journal_id uuid,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE accounting.journal_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  fiscal_year_id uuid,
  entry_date date NOT NULL,
  voucher_no text,
  description text,
  source_type text NOT NULL DEFAULT 'manual'::text,
  source_id uuid,
  status text NOT NULL DEFAULT 'confirmed'::text,
  is_locked boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE accounting.journal_lines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  journal_id uuid NOT NULL,
  line_no smallint NOT NULL,
  side text NOT NULL,
  account_id uuid,
  partner_id uuid,
  amount_jpy bigint NOT NULL,
  original_currency text NOT NULL DEFAULT 'JPY'::text,
  original_amount numeric(18,4),
  fx_rate numeric(18,8),
  tax_category text,
  tax_amount_jpy bigint NOT NULL DEFAULT 0,
  memo text
);

CREATE TABLE accounting.partners (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  name_kana text,
  kind text NOT NULL DEFAULT 'corp'::text,
  invoice_reg_no text,
  is_qualified_invoice boolean DEFAULT (invoice_reg_no IS NOT NULL),
  postal_code text,
  address text,
  phone text,
  email text,
  bank_account jsonb,
  default_payment_terms text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE accounting.vouchers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  file_size integer,
  uploaded_by uuid,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  voucher_type text DEFAULT 'receipt'::text,
  ocr_status text NOT NULL DEFAULT 'pending'::text,
  ocr_confidence numeric(4,3),
  extracted_vendor text,
  extracted_date date,
  extracted_total bigint,
  extracted_tax bigint,
  extracted_reg_no text,
  journal_id uuid
);

-- ---------- 主键 / 唯一 / CHECK 约束 ----------
ALTER TABLE accounting.accounts ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);
ALTER TABLE accounting.accounts ADD CONSTRAINT accounts_company_id_code_key UNIQUE (company_id, code);
ALTER TABLE accounting.accounts ADD CONSTRAINT accounts_category_check CHECK ((category = ANY (ARRAY['asset'::text, 'liability'::text, 'equity'::text, 'revenue'::text, 'expense'::text])));
ALTER TABLE accounting.audit_logs ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);
ALTER TABLE accounting.bank_accounts ADD CONSTRAINT bank_accounts_pkey PRIMARY KEY (id);
ALTER TABLE accounting.bank_accounts ADD CONSTRAINT bank_accounts_account_type_check CHECK ((account_type = ANY (ARRAY['futsuu'::text, 'touza'::text])));
ALTER TABLE accounting.bank_transactions ADD CONSTRAINT bank_transactions_pkey PRIMARY KEY (id);
ALTER TABLE accounting.bank_transactions ADD CONSTRAINT bank_transactions_company_id_external_id_key UNIQUE (company_id, external_id);
ALTER TABLE accounting.bank_transactions ADD CONSTRAINT bank_transactions_match_status_check CHECK ((match_status = ANY (ARRAY['pending'::text, 'matched'::text, 'rejected'::text, 'ignored'::text])));
ALTER TABLE accounting.companies ADD CONSTRAINT companies_pkey PRIMARY KEY (id);
ALTER TABLE accounting.companies ADD CONSTRAINT companies_tax_method_check CHECK ((tax_method = ANY (ARRAY['general'::text, 'simple'::text, 'two_percent'::text, 'exempt'::text])));
ALTER TABLE accounting.companies ADD CONSTRAINT companies_legal_form_check CHECK ((legal_form = ANY (ARRAY['llc'::text, 'kk'::text, 'sole'::text, 'other'::text])));
ALTER TABLE accounting.company_members ADD CONSTRAINT company_members_pkey PRIMARY KEY (company_id, user_id);
ALTER TABLE accounting.company_members ADD CONSTRAINT company_members_role_check CHECK ((role = ANY (ARRAY['owner'::text, 'accountant'::text, 'viewer'::text, 'tax_advisor'::text, 'sales'::text])));
ALTER TABLE accounting.delivery_note_items ADD CONSTRAINT delivery_note_items_pkey PRIMARY KEY (id);
ALTER TABLE accounting.delivery_notes ADD CONSTRAINT delivery_notes_pkey PRIMARY KEY (id);
ALTER TABLE accounting.delivery_notes ADD CONSTRAINT delivery_notes_company_id_delivery_no_key UNIQUE (company_id, delivery_no);
ALTER TABLE accounting.estimate_items ADD CONSTRAINT estimate_items_pkey PRIMARY KEY (id);
ALTER TABLE accounting.estimates ADD CONSTRAINT estimates_pkey PRIMARY KEY (id);
ALTER TABLE accounting.estimates ADD CONSTRAINT estimates_company_id_estimate_no_key UNIQUE (company_id, estimate_no);
ALTER TABLE accounting.exchange_rates ADD CONSTRAINT exchange_rates_pkey PRIMARY KEY (rate_date, base_currency, quote_currency);
ALTER TABLE accounting.fiscal_years ADD CONSTRAINT fiscal_years_pkey PRIMARY KEY (id);
ALTER TABLE accounting.fiscal_years ADD CONSTRAINT fiscal_years_company_id_start_date_key UNIQUE (company_id, start_date);
ALTER TABLE accounting.invoice_items ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);
ALTER TABLE accounting.invoices ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);
ALTER TABLE accounting.invoices ADD CONSTRAINT invoices_company_id_invoice_no_key UNIQUE (company_id, invoice_no);
ALTER TABLE accounting.invoices ADD CONSTRAINT invoices_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'sent'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text])));
ALTER TABLE accounting.invoices ADD CONSTRAINT invoices_data_sync_status_check CHECK ((data_sync_status = ANY (ARRAY['not_sent'::text, 'synced'::text, 'failed'::text])));
ALTER TABLE accounting.invoices ADD CONSTRAINT invoices_payment_status_check CHECK ((payment_status = ANY (ARRAY['unbilled'::text, 'billed'::text, 'paid'::text])));
ALTER TABLE accounting.journal_entries ADD CONSTRAINT journal_entries_pkey PRIMARY KEY (id);
ALTER TABLE accounting.journal_entries ADD CONSTRAINT journal_entries_source_type_check CHECK ((source_type = ANY (ARRAY['manual'::text, 'ocr'::text, 'bank_import'::text, 'invoice'::text, 'api'::text])));
ALTER TABLE accounting.journal_entries ADD CONSTRAINT journal_entries_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'pending'::text, 'confirmed'::text, 'rejected'::text])));
ALTER TABLE accounting.journal_lines ADD CONSTRAINT journal_lines_pkey PRIMARY KEY (id);
ALTER TABLE accounting.journal_lines ADD CONSTRAINT journal_lines_side_check CHECK ((side = ANY (ARRAY['debit'::text, 'credit'::text])));
ALTER TABLE accounting.partners ADD CONSTRAINT partners_pkey PRIMARY KEY (id);
ALTER TABLE accounting.partners ADD CONSTRAINT partners_kind_check CHECK ((kind = ANY (ARRAY['corp'::text, 'individual'::text, 'overseas'::text])));
ALTER TABLE accounting.vouchers ADD CONSTRAINT vouchers_pkey PRIMARY KEY (id);
ALTER TABLE accounting.vouchers ADD CONSTRAINT vouchers_ocr_status_check CHECK ((ocr_status = ANY (ARRAY['pending'::text, 'processing'::text, 'done'::text, 'failed'::text])));
ALTER TABLE accounting.vouchers ADD CONSTRAINT vouchers_voucher_type_check CHECK ((voucher_type = ANY (ARRAY['receipt'::text, 'invoice_received'::text, 'contract'::text, 'other'::text])));

-- ---------- 外键 ----------
ALTER TABLE accounting.accounts ADD CONSTRAINT accounts_company_id_fkey FOREIGN KEY (company_id) REFERENCES accounting.companies(id) ON DELETE CASCADE;
ALTER TABLE accounting.accounts ADD CONSTRAINT accounts_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES accounting.accounts(id) ON DELETE SET NULL;
ALTER TABLE accounting.audit_logs ADD CONSTRAINT audit_logs_company_id_fkey FOREIGN KEY (company_id) REFERENCES accounting.companies(id) ON DELETE SET NULL;
ALTER TABLE accounting.audit_logs ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE accounting.bank_accounts ADD CONSTRAINT bank_accounts_company_id_fkey FOREIGN KEY (company_id) REFERENCES accounting.companies(id) ON DELETE CASCADE;
ALTER TABLE accounting.bank_transactions ADD CONSTRAINT bank_transactions_suggested_partner_id_fkey FOREIGN KEY (suggested_partner_id) REFERENCES accounting.partners(id) ON DELETE SET NULL;
ALTER TABLE accounting.bank_transactions ADD CONSTRAINT bank_transactions_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES accounting.bank_accounts(id) ON DELETE SET NULL;
ALTER TABLE accounting.bank_transactions ADD CONSTRAINT bank_transactions_journal_id_fkey FOREIGN KEY (journal_id) REFERENCES accounting.journal_entries(id) ON DELETE SET NULL;
ALTER TABLE accounting.bank_transactions ADD CONSTRAINT bank_transactions_company_id_fkey FOREIGN KEY (company_id) REFERENCES accounting.companies(id) ON DELETE CASCADE;
ALTER TABLE accounting.bank_transactions ADD CONSTRAINT bank_transactions_suggested_account_id_fkey FOREIGN KEY (suggested_account_id) REFERENCES accounting.accounts(id) ON DELETE SET NULL;
ALTER TABLE accounting.bank_transactions ADD CONSTRAINT bank_transactions_matched_by_fkey FOREIGN KEY (matched_by) REFERENCES auth.users(id);
ALTER TABLE accounting.company_members ADD CONSTRAINT company_members_company_id_fkey FOREIGN KEY (company_id) REFERENCES accounting.companies(id) ON DELETE CASCADE;
ALTER TABLE accounting.company_members ADD CONSTRAINT company_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE accounting.delivery_note_items ADD CONSTRAINT delivery_note_items_delivery_note_id_fkey FOREIGN KEY (delivery_note_id) REFERENCES accounting.delivery_notes(id) ON DELETE CASCADE;
ALTER TABLE accounting.delivery_notes ADD CONSTRAINT delivery_notes_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES accounting.partners(id) ON DELETE SET NULL;
ALTER TABLE accounting.delivery_notes ADD CONSTRAINT delivery_notes_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES accounting.invoices(id) ON DELETE SET NULL;
ALTER TABLE accounting.delivery_notes ADD CONSTRAINT delivery_notes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE accounting.delivery_notes ADD CONSTRAINT delivery_notes_company_id_fkey FOREIGN KEY (company_id) REFERENCES accounting.companies(id) ON DELETE CASCADE;
ALTER TABLE accounting.estimate_items ADD CONSTRAINT estimate_items_estimate_id_fkey FOREIGN KEY (estimate_id) REFERENCES accounting.estimates(id) ON DELETE CASCADE;
ALTER TABLE accounting.estimates ADD CONSTRAINT estimates_delivery_note_id_fkey FOREIGN KEY (delivery_note_id) REFERENCES accounting.delivery_notes(id) ON DELETE SET NULL;
ALTER TABLE accounting.estimates ADD CONSTRAINT estimates_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES accounting.partners(id) ON DELETE SET NULL;
ALTER TABLE accounting.estimates ADD CONSTRAINT estimates_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES accounting.invoices(id) ON DELETE SET NULL;
ALTER TABLE accounting.estimates ADD CONSTRAINT estimates_company_id_fkey FOREIGN KEY (company_id) REFERENCES accounting.companies(id) ON DELETE CASCADE;
ALTER TABLE accounting.estimates ADD CONSTRAINT estimates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE accounting.fiscal_years ADD CONSTRAINT fiscal_years_company_id_fkey FOREIGN KEY (company_id) REFERENCES accounting.companies(id) ON DELETE CASCADE;
ALTER TABLE accounting.fiscal_years ADD CONSTRAINT fiscal_years_closed_by_fkey FOREIGN KEY (closed_by) REFERENCES auth.users(id);
ALTER TABLE accounting.invoice_items ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES accounting.invoices(id) ON DELETE CASCADE;
ALTER TABLE accounting.invoices ADD CONSTRAINT invoices_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES accounting.partners(id) ON DELETE SET NULL;
ALTER TABLE accounting.invoices ADD CONSTRAINT invoices_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES accounting.bank_accounts(id) ON DELETE SET NULL;
ALTER TABLE accounting.invoices ADD CONSTRAINT invoices_company_id_fkey FOREIGN KEY (company_id) REFERENCES accounting.companies(id) ON DELETE CASCADE;
ALTER TABLE accounting.invoices ADD CONSTRAINT invoices_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE accounting.invoices ADD CONSTRAINT invoices_journal_id_fkey FOREIGN KEY (journal_id) REFERENCES accounting.journal_entries(id) ON DELETE SET NULL;
ALTER TABLE accounting.journal_entries ADD CONSTRAINT journal_entries_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE accounting.journal_entries ADD CONSTRAINT journal_entries_company_id_fkey FOREIGN KEY (company_id) REFERENCES accounting.companies(id) ON DELETE CASCADE;
ALTER TABLE accounting.journal_entries ADD CONSTRAINT journal_entries_fiscal_year_id_fkey FOREIGN KEY (fiscal_year_id) REFERENCES accounting.fiscal_years(id) ON DELETE SET NULL;
ALTER TABLE accounting.journal_lines ADD CONSTRAINT journal_lines_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES accounting.partners(id) ON DELETE SET NULL;
ALTER TABLE accounting.journal_lines ADD CONSTRAINT journal_lines_journal_id_fkey FOREIGN KEY (journal_id) REFERENCES accounting.journal_entries(id) ON DELETE CASCADE;
ALTER TABLE accounting.journal_lines ADD CONSTRAINT journal_lines_account_id_fkey FOREIGN KEY (account_id) REFERENCES accounting.accounts(id) ON DELETE RESTRICT;
ALTER TABLE accounting.partners ADD CONSTRAINT partners_company_id_fkey FOREIGN KEY (company_id) REFERENCES accounting.companies(id) ON DELETE CASCADE;
ALTER TABLE accounting.vouchers ADD CONSTRAINT vouchers_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id);
ALTER TABLE accounting.vouchers ADD CONSTRAINT vouchers_journal_id_fkey FOREIGN KEY (journal_id) REFERENCES accounting.journal_entries(id) ON DELETE SET NULL;
ALTER TABLE accounting.vouchers ADD CONSTRAINT vouchers_company_id_fkey FOREIGN KEY (company_id) REFERENCES accounting.companies(id) ON DELETE CASCADE;

-- ---------- 索引（非约束自带） ----------
CREATE INDEX accounts_company_idx ON accounting.accounts USING btree (company_id);
CREATE INDEX audit_company_idx ON accounting.audit_logs USING btree (company_id, created_at DESC);
CREATE INDEX bank_accounts_company_idx ON accounting.bank_accounts USING btree (company_id);
CREATE INDEX bt_company_date_idx ON accounting.bank_transactions USING btree (company_id, txn_date DESC);
CREATE INDEX bt_status_idx ON accounting.bank_transactions USING btree (company_id, match_status);
CREATE INDEX cm_user_idx ON accounting.company_members USING btree (user_id);
CREATE INDEX delivery_note_items_parent_idx ON accounting.delivery_note_items USING btree (delivery_note_id, line_no);
CREATE INDEX delivery_notes_company_date_idx ON accounting.delivery_notes USING btree (company_id, delivery_date DESC);
CREATE INDEX estimate_items_parent_idx ON accounting.estimate_items USING btree (estimate_id, line_no);
CREATE INDEX estimates_company_date_idx ON accounting.estimates USING btree (company_id, estimate_date DESC);
CREATE INDEX invoice_items_invoice_idx ON accounting.invoice_items USING btree (invoice_id);
CREATE INDEX invoices_company_date_idx ON accounting.invoices USING btree (company_id, invoice_date DESC);
CREATE INDEX invoices_partner_idx ON accounting.invoices USING btree (partner_id);
CREATE INDEX je_company_date_idx ON accounting.journal_entries USING btree (company_id, entry_date DESC);
CREATE INDEX je_voucher_idx ON accounting.journal_entries USING btree (company_id, voucher_no);
CREATE INDEX jl_account_idx ON accounting.journal_lines USING btree (account_id);
CREATE INDEX jl_journal_idx ON accounting.journal_lines USING btree (journal_id);
CREATE INDEX partners_name_idx ON accounting.partners USING gin (to_tsvector('simple'::regconfig, ((COALESCE(name, ''::text) || ' '::text) || COALESCE(name_kana, ''::text))));
CREATE INDEX partners_company_idx ON accounting.partners USING btree (company_id);
CREATE INDEX vouchers_company_idx ON accounting.vouchers USING btree (company_id);

-- ---------- 函数 ----------
CREATE OR REPLACE FUNCTION accounting.user_companies(uid uuid)
 RETURNS TABLE(company_id uuid, role text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'accounting', 'public'
AS $function$
  SELECT cm.company_id, cm.role
  FROM accounting.company_members cm
  WHERE cm.user_id = uid;
$function$;

CREATE OR REPLACE FUNCTION accounting.touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$function$;

CREATE OR REPLACE FUNCTION accounting.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'accounting', 'public', 'auth'
AS $function$
BEGIN
  INSERT INTO accounting.company_members (company_id, user_id, role, accepted_at)
  VALUES ('00000000-0000-0000-0000-000000000001', NEW.id, 'owner', now())
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;

-- 注：accounting.handle_new_user() 由一个挂在 auth.users 上的触发器调用（属 auth schema，需在控制台单独建）。

-- ---------- 触发器 ----------
CREATE TRIGGER trg_companies_touch BEFORE UPDATE ON accounting.companies FOR EACH ROW EXECUTE FUNCTION accounting.touch_updated_at();
CREATE TRIGGER trg_partners_touch BEFORE UPDATE ON accounting.partners FOR EACH ROW EXECUTE FUNCTION accounting.touch_updated_at();
CREATE TRIGGER trg_journal_entries_touch BEFORE UPDATE ON accounting.journal_entries FOR EACH ROW EXECUTE FUNCTION accounting.touch_updated_at();
CREATE TRIGGER trg_invoices_touch BEFORE UPDATE ON accounting.invoices FOR EACH ROW EXECUTE FUNCTION accounting.touch_updated_at();

-- ---------- RLS 开关 ----------
ALTER TABLE accounting.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.delivery_note_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.delivery_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.fiscal_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting.vouchers ENABLE ROW LEVEL SECURITY;

-- ---------- RLS 策略 ----------
CREATE POLICY accounts_modify ON accounting.accounts AS PERMISSIVE FOR ALL TO authenticated USING ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role) WHERE (user_companies.role = ANY (ARRAY['owner'::text, 'accountant'::text, 'sales'::text]))))) WITH CHECK ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role) WHERE (user_companies.role = ANY (ARRAY['owner'::text, 'accountant'::text, 'sales'::text])))));
CREATE POLICY accounts_select ON accounting.accounts AS PERMISSIVE FOR SELECT TO authenticated USING ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role))));
CREATE POLICY audit_logs_select ON accounting.audit_logs AS PERMISSIVE FOR SELECT TO authenticated USING ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role))));
CREATE POLICY audit_logs_modify ON accounting.audit_logs AS PERMISSIVE FOR ALL TO authenticated USING ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role) WHERE (user_companies.role = ANY (ARRAY['owner'::text, 'accountant'::text, 'sales'::text]))))) WITH CHECK ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role) WHERE (user_companies.role = ANY (ARRAY['owner'::text, 'accountant'::text, 'sales'::text])))));
CREATE POLICY bank_accounts_select ON accounting.bank_accounts AS PERMISSIVE FOR SELECT TO authenticated USING ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role))));
CREATE POLICY bank_accounts_modify ON accounting.bank_accounts AS PERMISSIVE FOR ALL TO authenticated USING ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role) WHERE (user_companies.role = ANY (ARRAY['owner'::text, 'accountant'::text, 'sales'::text]))))) WITH CHECK ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role) WHERE (user_companies.role = ANY (ARRAY['owner'::text, 'accountant'::text, 'sales'::text])))));
CREATE POLICY bt_modify ON accounting.bank_transactions AS PERMISSIVE FOR ALL TO authenticated USING ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role) WHERE (user_companies.role = ANY (ARRAY['owner'::text, 'accountant'::text, 'sales'::text]))))) WITH CHECK ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role) WHERE (user_companies.role = ANY (ARRAY['owner'::text, 'accountant'::text, 'sales'::text])))));
CREATE POLICY bt_select ON accounting.bank_transactions AS PERMISSIVE FOR SELECT TO authenticated USING ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role))));
CREATE POLICY companies_select ON accounting.companies AS PERMISSIVE FOR SELECT TO authenticated USING ((id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role))));
CREATE POLICY companies_modify ON accounting.companies AS PERMISSIVE FOR ALL TO authenticated USING ((id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role) WHERE (user_companies.role = 'owner'::text)))) WITH CHECK ((id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role) WHERE (user_companies.role = 'owner'::text))));
CREATE POLICY members_select ON accounting.company_members AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) OR (company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role)))));
CREATE POLICY members_modify ON accounting.company_members AS PERMISSIVE FOR ALL TO authenticated USING ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role) WHERE (user_companies.role = 'owner'::text)))) WITH CHECK ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role) WHERE (user_companies.role = 'owner'::text))));
CREATE POLICY delivery_note_items_modify ON accounting.delivery_note_items AS PERMISSIVE FOR ALL TO public USING ((delivery_note_id IN ( SELECT delivery_notes.id FROM accounting.delivery_notes)));
CREATE POLICY delivery_note_items_select ON accounting.delivery_note_items AS PERMISSIVE FOR SELECT TO public USING ((delivery_note_id IN ( SELECT delivery_notes.id FROM accounting.delivery_notes)));
CREATE POLICY delivery_notes_modify ON accounting.delivery_notes AS PERMISSIVE FOR ALL TO public USING ((company_id IN ( SELECT uc.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) uc(company_id, role) WHERE (uc.role = ANY (ARRAY['owner'::text, 'accountant'::text, 'sales'::text])))));
CREATE POLICY delivery_notes_select ON accounting.delivery_notes AS PERMISSIVE FOR SELECT TO public USING ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role))));
CREATE POLICY estimate_items_select ON accounting.estimate_items AS PERMISSIVE FOR SELECT TO public USING ((estimate_id IN ( SELECT estimates.id FROM accounting.estimates)));
CREATE POLICY estimate_items_modify ON accounting.estimate_items AS PERMISSIVE FOR ALL TO public USING ((estimate_id IN ( SELECT estimates.id FROM accounting.estimates)));
CREATE POLICY estimates_modify ON accounting.estimates AS PERMISSIVE FOR ALL TO public USING ((company_id IN ( SELECT uc.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) uc(company_id, role) WHERE (uc.role = ANY (ARRAY['owner'::text, 'accountant'::text, 'sales'::text])))));
CREATE POLICY estimates_select ON accounting.estimates AS PERMISSIVE FOR SELECT TO public USING ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role))));
CREATE POLICY xr_select ON accounting.exchange_rates AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY fiscal_years_select ON accounting.fiscal_years AS PERMISSIVE FOR SELECT TO authenticated USING ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role))));
CREATE POLICY fiscal_years_modify ON accounting.fiscal_years AS PERMISSIVE FOR ALL TO authenticated USING ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role) WHERE (user_companies.role = ANY (ARRAY['owner'::text, 'accountant'::text, 'sales'::text]))))) WITH CHECK ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role) WHERE (user_companies.role = ANY (ARRAY['owner'::text, 'accountant'::text, 'sales'::text])))));
CREATE POLICY invoice_items_select ON accounting.invoice_items AS PERMISSIVE FOR SELECT TO authenticated USING ((invoice_id IN ( SELECT invoices.id FROM accounting.invoices WHERE (invoices.company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role))))));
CREATE POLICY invoice_items_modify ON accounting.invoice_items AS PERMISSIVE FOR ALL TO authenticated USING ((invoice_id IN ( SELECT invoices.id FROM accounting.invoices WHERE (invoices.company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role) WHERE (user_companies.role = ANY (ARRAY['owner'::text, 'accountant'::text, 'sales'::text]))))))) WITH CHECK ((invoice_id IN ( SELECT invoices.id FROM accounting.invoices WHERE (invoices.company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role) WHERE (user_companies.role = ANY (ARRAY['owner'::text, 'accountant'::text, 'sales'::text])))))));
CREATE POLICY invoices_select ON accounting.invoices AS PERMISSIVE FOR SELECT TO authenticated USING ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role))));
CREATE POLICY invoices_modify ON accounting.invoices AS PERMISSIVE FOR ALL TO authenticated USING ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role) WHERE (user_companies.role = ANY (ARRAY['owner'::text, 'accountant'::text, 'sales'::text]))))) WITH CHECK ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role) WHERE (user_companies.role = ANY (ARRAY['owner'::text, 'accountant'::text, 'sales'::text])))));
CREATE POLICY journal_entries_select ON accounting.journal_entries AS PERMISSIVE FOR SELECT TO authenticated USING ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role))));
CREATE POLICY journal_entries_modify ON accounting.journal_entries AS PERMISSIVE FOR ALL TO authenticated USING ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role) WHERE (user_companies.role = ANY (ARRAY['owner'::text, 'accountant'::text, 'sales'::text]))))) WITH CHECK ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role) WHERE (user_companies.role = ANY (ARRAY['owner'::text, 'accountant'::text, 'sales'::text])))));
CREATE POLICY journal_lines_modify ON accounting.journal_lines AS PERMISSIVE FOR ALL TO authenticated USING ((journal_id IN ( SELECT journal_entries.id FROM accounting.journal_entries WHERE (journal_entries.company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role) WHERE (user_companies.role = ANY (ARRAY['owner'::text, 'accountant'::text]))))))) WITH CHECK ((journal_id IN ( SELECT journal_entries.id FROM accounting.journal_entries WHERE (journal_entries.company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role) WHERE (user_companies.role = ANY (ARRAY['owner'::text, 'accountant'::text])))))));
CREATE POLICY journal_lines_select ON accounting.journal_lines AS PERMISSIVE FOR SELECT TO authenticated USING ((journal_id IN ( SELECT journal_entries.id FROM accounting.journal_entries WHERE (journal_entries.company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role))))));
CREATE POLICY partners_select ON accounting.partners AS PERMISSIVE FOR SELECT TO authenticated USING ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role))));
CREATE POLICY partners_modify ON accounting.partners AS PERMISSIVE FOR ALL TO authenticated USING ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role) WHERE (user_companies.role = ANY (ARRAY['owner'::text, 'accountant'::text, 'sales'::text]))))) WITH CHECK ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role) WHERE (user_companies.role = ANY (ARRAY['owner'::text, 'accountant'::text, 'sales'::text])))));
CREATE POLICY vouchers_modify ON accounting.vouchers AS PERMISSIVE FOR ALL TO authenticated USING ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role) WHERE (user_companies.role = ANY (ARRAY['owner'::text, 'accountant'::text, 'sales'::text]))))) WITH CHECK ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role) WHERE (user_companies.role = ANY (ARRAY['owner'::text, 'accountant'::text, 'sales'::text])))));
CREATE POLICY vouchers_select ON accounting.vouchers AS PERMISSIVE FOR SELECT TO authenticated USING ((company_id IN ( SELECT user_companies.company_id FROM accounting.user_companies(( SELECT auth.uid() AS uid)) user_companies(company_id, role))));
