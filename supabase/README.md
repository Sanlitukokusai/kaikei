# Supabase 现状（权威说明）

> 2026-06 建立。本项目此前没有任何 supabase 版本控制文件，schema 仅存在于线上。

## 当前真实状态
- **数据库**：共享主库 `wfstwbeehomzdudvikbt`（Supabase 项目名 ProjecctMain）。
- **Schema**：独立 schema **`accounting`**（在客户端 `src/lib/supabase.ts` 里硬编码 `db: { schema: 'accounting' }`）。
- ✅ **与共享库其它项目完全隔离**——`baoke`、`renwu`、`attendance` 等各占独立 schema，`accounting` 不会与它们撞表名。之前担心的"污染 baoke"实为误判。
- 线上 `accounting` schema 现有 18 张表：`accounts, audit_logs, bank_accounts, bank_transactions, companies, company_members, delivery_note_items, delivery_notes, estimate_items, estimates, exchange_rates, fiscal_years, invoice_items, invoices, journal_entries, journal_lines, partners, vouchers`。
- 无自定义 RPC；Storage 桶 `receipts`（DashScope OCR 用）。

## ✅ Baseline 已捕获
`migrations/0000_baseline_accounting.sql` —— 2026-06-15 从线上 `accounting` schema 反向生成，
含 18 表 + 全部约束/索引/函数(`user_companies`/`touch_updated_at`/`handle_new_user`)/触发器/RLS 策略(35 条)。
此后该 schema 的变更走 migration 管理，不要再只在控制台改。

> 注：`handle_new_user()` 对应的 auth.users 触发器属 auth schema，需在控制台单独维护（baseline 仅含函数本体）。

## 重新捕获（schema 有变更时）
线上是事实源。pg_dump 直连因 Supabase 直连域名/密码已更新而不可用；
推荐用 Supabase MCP 的 SQL 通道重跑 introspection（走 access token，不依赖 DB 密码），或在控制台用 `supabase db pull`。
