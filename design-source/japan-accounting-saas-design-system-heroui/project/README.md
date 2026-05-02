# Kaikei Cloud — Japan Accounting SaaS Design System

> 高保真原型设计系统 — 基于 **HeroUI v3** 构建的日本会計クラウド SaaS 设计系统

A **production-ready design system** for a modern Japanese accounting SaaS, built on top of [HeroUI v3](https://github.com/heroui-inc/heroui) (canary `main`, commit `46e1f1f7`). This system supplies the visual foundations, content style, iconography, and a click-thru UI kit covering the seven core accounting screens.

> **Working name:** *Kaikei Cloud* (会計クラウド) — provisional. Replace with the user's brand name once decided.

---

## Product context

**Kaikei Cloud** is a cloud-native Japanese accounting (会計) SaaS targeting:

- **中小企業の経理担当者** — SMB accounting staff
- **税理士・会計事務所** — tax accountants & accounting firms
- **個人事業主・フリーランス** — sole proprietors / freelancers

### Core features

| Domain | Modules |
|---|---|
| 入力 (Entry) | 仕訳入力（複式簿記）, 経費精算・領収書 OCR, 請求書発行・管理 |
| 自動化 | 銀行連携・自動仕訳・取引マッチング |
| レポート | ダッシュボード（売上/利益サマリー）, 決算書（B/S, P/L）, レポート・分析 |
| コンプラ | 消費税・インボイス対応, 電子帳簿保存法対応, 給与計算・年末調整 |

### Languages

UI text is bilingual **日本語 + 中文（简体）**. Japanese is primary; Chinese sits beside or under as a secondary line where needed (e.g. tooltips, settings labels, onboarding). Copy is written **Japanese-first**, then translated.

### Sources

- **HeroUI v3** — [github.com/heroui-inc/heroui](https://github.com/heroui-inc/heroui) — design tokens lifted from `packages/core/theme/src/{colors,components,default-layout}` and inlined into `colors_and_type.css`. Component variants (`button`, `card`) referenced from `packages/core/theme/src/components/*`.
- No customer codebase or Figma was attached — this is a green-field system grounded in HeroUI's defaults plus accounting-domain extensions.

---

## Index — what's in this folder

| File / Folder | Purpose |
|---|---|
| `README.md` | This file — system overview, content, visuals, iconography |
| `SKILL.md` | Agent skill file — usable in Claude Code |
| `colors_and_type.css` | All CSS variables (color scales, semantic tokens, type, radius, shadow, spacing) |
| `preview/` | Design-system tab cards (palettes, type, components, etc.) |
| `ui_kits/kaikei-cloud/` | Click-thru UI kit — login, dashboard, journal, invoice, bank-match |
| `assets/` | Logos and visual assets |
| `fonts/` | Font references (currently CDN-only; see *Visual foundations*) |

---

## Content fundamentals

### Tone & voice

The product is **professional, calm, and data-first** — like reading a clean tax-form. Voice should feel:

- **丁寧 (polite) but not stiff.** Use です/ます form throughout. Avoid casual だ/である except in headlines.
- **Action-oriented for verbs**, **noun-led for labels.** Buttons: 「保存する」「仕訳を追加」. Labels: 「取引日」「勘定科目」.
- **Neutral subject** — avoid 「あなた」. Refer to the user only via possessive or implicit subject (e.g. 「未登録の取引が3件あります」, not 「あなたには3件あります」).
- **Numbers lead.** When KPIs and copy compete, the number wins. Copy supports.
- **No emoji** in core product UI. Emoji are reserved for non-essential surfaces (empty-state illustrations only, if at all). Iconography uses Lucide (see *Iconography*).

### Casing & typography habits

- **Japanese:** 全角句読点（、。）— keep half-width for parentheses around English/numerics: 「請求書 (INV-001)」.
- **Chinese (zh-CN secondary):** 全角标点（，。）.
- **Numbers:** always tabular figures, ¥ before number with no space (¥1,234,567), parens around negatives — **(¥12,345)** — colored red. Half-width digits, three-digit comma grouping.
- **Dates:** `2026/05/03` (slash, year-first) is default; `2026年5月3日` for prose. Avoid US-style 5/3/2026.
- **Tax/inbound terms** keep their canonical Japanese form: 適格請求書, 仕入税額控除, インボイス, 電子帳簿保存法.

### Microcopy examples

| Surface | Japanese (primary) | 中文 (secondary) |
|---|---|---|
| Primary CTA, save | 保存する | 保存 |
| Empty journal | まだ仕訳がありません。最初の取引を登録してみましょう。 | 还没有任何记账。开始添加第一笔交易吧。 |
| Bank-sync success | 12件の取引を取り込みました | 已导入 12 笔交易 |
| Validation error | 借方と貸方の合計が一致していません | 借方与贷方合计不一致 |
| Tooltip — 適格 mark | 適格請求書発行事業者として登録済 | 已注册为合格发票开票方 |

### Vibe

> Excel-grade rigor with 2026-grade polish. Less freee's friendly cartoon, more マネーフォワード × Linear — quiet, precise, data-confident.

---

## Visual foundations

### Color

- **Primary** — HeroUI Blue `#006FEE` (cobalt). Used for primary CTA, focused fields, active tabs, links.
- **Neutral** — HeroUI Zinc scale (50–900). Backgrounds, borders, body text, table dividers.
- **Semantic**
  - `success` `#17c964` (green) — 入金, 確定済, 一致, completed reconciliation
  - `warning` `#f5a524` (amber) — 確認待ち, draft, partial match
  - `danger` `#f31260` (rose-red) — 出金, エラー, バリデーション失敗
  - `secondary` `#7828c8` (purple) — secondary CTAs only, used sparingly
- **Money colors** — incoming/positive uses `--money-positive` (green-600 light / green-400 dark); outgoing/negative uses `--money-negative` (red-600 / red-400). Never colored unless the column is explicitly a money/amount column.

### Type

- **Body / UI:** `Noto Sans JP` (400/500/600/700) with `Noto Sans SC` fallback for Chinese glyphs, then OS JP fallbacks (Hiragino, Yu Gothic, Meiryo).
- **Numerics / KPIs:** `Inter` with `tabular-nums` + `lnum` features. All money figures **must** use `.num` or `.money` class.
- **Mono:** `JetBrains Mono` for journal IDs, transaction hashes, codes.

### Backgrounds

- **App canvas:** flat — `--background` (`#FFFFFF` light, `#000000` dark). No gradients, no patterns. The data is the texture.
- **Surface stack:** content1 → content2 → content3 → content4 (HeroUI). Sidebars and inset panels typically use `content2`.
- **Marketing/auth pages** may use a **single subtle blue radial wash** at 4% opacity — never multi-color gradients.
- **No hand-drawn illustrations, no full-bleed photography** in the product. Empty states use small monochrome line icons or simple geometric shapes.

### Borders, radius, shadow

- **Radius scale (HeroUI v3):** `small 8px`, `medium 12px`, `large 14px`, `full`. Cards default `large`, buttons default `medium`, inputs `medium`.
- **Borders:** `1px` (small) for dividers, `2px` (medium) for selected/focused states. Color: `--divider` or `--zinc-200`.
- **Shadow:** three-tier HeroUI shadow system — `--shadow-small/medium/large`. Cards default `medium`. **No** drop shadows on tables or inputs.
- **No glassmorphism** in the product itself; only the `isBlurred` card variant for occasional modal/drawer overlays.

### Animation

- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` (standard) for most; `cubic-bezier(0.16, 1, 0.3, 1)` (out-expo) for entering panels.
- **Duration:** 150ms (fast — hover/focus), 250ms (medium — panel/drawer), 400ms (slow — page transitions). Prefer 150ms for table interactions.
- **No bounce, no overshoot.** Money apps don't bounce.
- **Press scale** — buttons shrink to `scale(0.97)` on `data-pressed=true` (HeroUI default).
- **No autoplay animations** on dashboards; KPI counters may animate **once** on initial mount.

### Hover & press

- **Hover** — `opacity 0.8` on solid/flat/bordered/shadow buttons (HeroUI `--opacity-hover`).
- **Light variant hover** — fills with 20% of role color (`bg-primary/20`, etc).
- **Press** — `scale(0.97)` GPU transform.
- **Table row hover** — flat color change to `--table-row-hover` (zinc-50 light / white@4% dark). No shadow lift.
- **Card hover (when interactive)** — surface promotes from `content1` to `content2`.

### Transparency & blur

Used **rarely**:
- Modal/drawer scrim: `rgba(0,0,0,0.5)`.
- `isBlurred` card variant: `bg-background/80 backdrop-blur-md` — only on overlay surfaces.
- Disabled state: `opacity 0.5`.
- Never blur background imagery in the product.

### Layout rules

- **App shell** — fixed left sidebar (240px expanded, 64px collapsed) + fixed top bar (56px) + scrollable main.
- **Page max-width** — 1440px content gutter for marketing; full-width for app screens (tables breathe).
- **Density** — `中密度` (standard SaaS). Table rows are 44px (compact mode 36px). Form rows 40px. The Tweaks panel exposes `compact ↔ comfortable` toggle.
- **Grid** — 8px base. Use `--space-*` tokens; avoid arbitrary px.
- **Sticky elements** — sidebars, top bar, table headers, balance summary footers. Drop-shadow only when content scrolls under (use `IntersectionObserver` to toggle).

### Color vibe of imagery

- **No stock photography in product UI.** Marketing imagery (if used later): cool, desaturated, bluish neutrals; never warm earth tones. B&W illustrative diagrams allowed.
- **Charts & graphs:** primary blue + neutral zinc grid; semantic green/red/amber for status. Multi-series uses blue → cyan → purple → green ordering. Avoid rainbow palettes.

### Cards

- Default: `bg-content1`, `radius: large (14px)`, `shadow: medium`, `1px outline-transparent`.
- Hoverable variant darkens to `content2`.
- Pressable variant adds `scale(0.97)` press.
- Header/footer share radius corners (`rounded-t-large`, `rounded-b-large`).
- Section cards (filter bars, summaries) often use `radius: medium` and `shadow: small` for a quieter look.

---

## Iconography

**System:** [Lucide](https://lucide.dev) (CDN) — `1.5px` stroke, `20px` default, `16px` for inline labels, `24px` for nav. Lucide is HeroUI's documented default companion icon set, picked here for:

- Consistent stroke geometry across hundreds of glyphs.
- Same visual weight as Noto Sans JP at 400.
- CDN-deliverable as inline SVG components — no font file, no opacity blending issues with dark mode.

**Substitution flag:** No HeroUI-specific or Kaikei-specific icon set was provided. **Lucide is a substitution** — flag this to the user; if they prefer Phosphor, Tabler, or a bespoke set, swap globally via the `<Icon>` component used in the UI kit.

**Loaded via:** `<script src="https://unpkg.com/lucide@latest"></script>` and rendered as `<i data-lucide="dollar-sign"></i>` then `lucide.createIcons()`. The UI kit also ships a thin React wrapper (`Icon.jsx`) for inline use.

**Usage rules**

- Always pair an icon with text **or** an `aria-label`. No icon-only buttons in dense data screens (tooltips required).
- Stroke width is **1.5** — matches the type weight. Never increase.
- Color: inherits `currentColor`. Use `--foreground-500` for inactive, `--primary` or semantic role for active.
- **No emoji** in product UI. ✓/✗ glyphs are replaced with Lucide `check` / `x`.
- **No unicode dingbats** for status; use Lucide `circle-check`, `circle-alert`, `circle-x`.

**Domain icons** (recurring in this product):

| Concept | Lucide name |
|---|---|
| 仕訳 (journal) | `book-open` |
| 取引 (transaction) | `arrow-right-left` |
| 入金 (incoming) | `arrow-down-left` |
| 出金 (outgoing) | `arrow-up-right` |
| 請求書 | `file-text` |
| 領収書 OCR | `scan-line` |
| 銀行連携 | `landmark` |
| 消費税・インボイス | `receipt` |
| ダッシュボード | `layout-dashboard` |
| レポート | `bar-chart-3` |
| 設定 | `settings` |

---

## Font substitution flag

The user did not provide brand fonts. The system uses **Google Fonts CDN** (`Noto Sans JP`, `Noto Sans SC`, `Inter`, `JetBrains Mono`). If the brand has a licensed JP face (e.g. **TBUDゴシック**, **A1ゴシック**, or a custom Morisawa license), drop the `.otf`/`.woff2` into `fonts/` and override `--font-sans` in `colors_and_type.css`.

## Caveats & open questions

1. **Brand name** — *Kaikei Cloud* is provisional. Confirm the actual product name + logomark with the user.
2. **Logo** — none provided. The UI kit uses a placeholder wordmark + abstract glyph; replace `assets/logo.svg` with the real asset.
3. **Iconography** — Lucide chosen as a sensible default substitution; confirm the user is happy or specify an alternative.
4. **Imagery** — no marketing photography or illustrations are included. The visual system is screen-only for now.
5. **Tone calibration** — the chosen tone leans マネーフォワード × Linear; if the user prefers freee's friendlier register, copy needs softening.

---

*Generated on 2026-05-03. Built for the Japan SaaS market on HeroUI v3.*
