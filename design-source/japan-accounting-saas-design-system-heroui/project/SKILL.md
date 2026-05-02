---
name: kaikei-cloud-design
description: Use this skill to generate well-branded interfaces and assets for Kaikei Cloud (会計クラウド), a Japanese accounting SaaS built on HeroUI v3. Use it for production code, throwaway prototypes, mocks, slides, or any visual artifact that should match the product's visual + content language.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files (`colors_and_type.css`, `preview/`, `ui_kits/kaikei-cloud/`).

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy the relevant assets out of this folder and create static HTML files for the user to view. Always include `colors_and_type.css` so the system's tokens, fonts, and dark-mode toggle work out of the box. Match the existing tone (丁寧 / professional / data-first), use Lucide icons, and treat numbers as the visual hero — `tabular-nums`, three-digit comma grouping, parens-and-red for negatives, ¥ prefix.

If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand. The HeroUI component theme is the source of truth for variants — `solid / bordered / light / flat / faded / shadow / ghost` for buttons; `radius small/medium/large/full`; `shadow small/medium/large`. Don't invent new variants.

If the user invokes this skill without any other guidance, ask them what they want to build or design (which screen? which feature? Japanese only or bilingual? light/dark/both?), ask 3-5 questions to clarify, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need. Default to bilingual JP+ZH with Japanese primary, light mode, 中密度 (standard SaaS density), and HeroUI Blue as primary.
