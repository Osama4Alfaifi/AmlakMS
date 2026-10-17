---
version: 1
slug: "app-owner-page-tsx"
primary_target: "app/owner/page.tsx"
related_targets: ["app/page.tsx","app/login/LoginForm.tsx"]
---

## Scope
Operate surface (app shell + owner dashboard) plus Persuade landing and login. Redesign of the whole app look; product truth in PRODUCT.md.

## Direction contract
THESIS: Ledger-grade calm. The product's central promise is an owner's net income after expenses and fee; the UI reads like a clean statement, not a card dashboard. Refuses the generic blue SaaS card grid.
OWN-WORLD: Warm stone ground (#f6f5f2), white surfaces lifted by layered ring+drop shadows, deep petrol brand (brand-700 primary, brand-950 rail), one brass accent (active nav glyph only), Cairo RTL, tabular numerals, status chips with dot + tinted ground.
STORY: An owner opens the app and sees income minus expenses minus fee equals net income first, then portfolio, notices, contracts. Staff get the same system, denser.
FIRST VIEWPORT: Owner dashboard: dark petrol rail (right, RTL), sticky blurred top bar, statement card leading (three figures in a row, net income in a petrol block), then compact stat cards. Landing: petrol hero, headline left of an illustrative statement card, stats strip overlapping hero edge.
FORM: Code-led; staged page entrance (GSAP) and number count-up as the single signature motion. seed: none (unavailable)
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
