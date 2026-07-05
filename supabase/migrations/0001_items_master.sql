-- 品目マスタ（請求書・見積書で再利用する品目）。镜像 partners 的 FK / 索引 / 触发器 / RLS。
-- 已通过 Supabase MCP apply_migration 应用到 wfstwbeehomzdudvikbt（accounting schema）。
CREATE TABLE IF NOT EXISTS accounting.items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  code text,
  name text NOT NULL,
  name_kana text,
  unit text,
  unit_price bigint,
  tax_rate smallint NOT NULL DEFAULT 10,
  category text,
  note text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE accounting.items ADD CONSTRAINT items_pkey PRIMARY KEY (id);
ALTER TABLE accounting.items ADD CONSTRAINT items_company_id_fkey FOREIGN KEY (company_id) REFERENCES accounting.companies(id) ON DELETE CASCADE;
ALTER TABLE accounting.items ADD CONSTRAINT items_tax_rate_check CHECK (tax_rate = ANY (ARRAY[0, 8, 10]));
CREATE INDEX items_company_idx ON accounting.items USING btree (company_id);
CREATE INDEX items_name_idx ON accounting.items USING gin (to_tsvector('simple'::regconfig, ((COALESCE(name, ''::text) || ' '::text) || COALESCE(name_kana, ''::text)) || ' '::text || COALESCE(code, ''::text)));
CREATE TRIGGER trg_items_touch BEFORE UPDATE ON accounting.items FOR EACH ROW EXECUTE FUNCTION accounting.touch_updated_at();

ALTER TABLE accounting.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY items_select ON accounting.items AS PERMISSIVE FOR SELECT TO authenticated
  USING ((company_id IN ( SELECT uc.company_id FROM accounting.user_companies((SELECT auth.uid())) uc(company_id, role))));
CREATE POLICY items_modify ON accounting.items AS PERMISSIVE FOR ALL TO authenticated
  USING ((company_id IN ( SELECT uc.company_id FROM accounting.user_companies((SELECT auth.uid())) uc(company_id, role) WHERE (uc.role = ANY (ARRAY['owner'::text, 'accountant'::text, 'sales'::text])))))
  WITH CHECK ((company_id IN ( SELECT uc.company_id FROM accounting.user_companies((SELECT auth.uid())) uc(company_id, role) WHERE (uc.role = ANY (ARRAY['owner'::text, 'accountant'::text, 'sales'::text])))));
