---
name: أملاك MS (AmlakMS)
description: Ledger-grade calm for Saudi property management, in Arabic RTL. Warm stone ground, deep petrol ink, one brass note.
colors:
  background: "#f6f5f2"
  surface: "#ffffff"
  surface-sunken: "#f1efea"
  foreground: "#16222a"
  muted: "#5b6870"
  border: "#e4e1d9"
  border-strong: "#cfcbc0"
  brand-50: "#eef6f8"
  brand-100: "#d9ebf0"
  brand-200: "#b4d7e0"
  brand-300: "#86bccb"
  brand-400: "#4f9bb0"
  brand-500: "#2c7e96"
  brand-600: "#1f6a80"
  brand-700: "#1a566a"
  brand-800: "#144556"
  brand-900: "#0f2f3c"
  brand-950: "#0a2029"
  accent-400: "#d6a84e"
  accent-500: "#b98a2e"
  accent-600: "#94691a"
  success-50: "#e9f6ee"
  success-500: "#1e9558"
  success-700: "#14683c"
  warning-50: "#fdf5e3"
  warning-500: "#d4900e"
  warning-600: "#a8700a"
  warning-700: "#8f5d06"
  danger-50: "#fcecec"
  danger-500: "#d03a3a"
  danger-600: "#b52e2e"
  danger-700: "#a02424"
  info-50: "#e8f1fb"
  info-500: "#2b7bd6"
  info-700: "#1d559a"
typography:
  headline:
    fontFamily: "IBM Plex Sans Arabic, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1.5
  title:
    fontFamily: "IBM Plex Sans Arabic, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.375
  figure:
    fontFamily: "IBM Plex Sans Arabic, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.25
    fontFeature: "tabular-nums"
  stat:
    fontFamily: "IBM Plex Sans Arabic, sans-serif"
    fontSize: "1.45rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.025em"
    fontFeature: "tabular-nums"
  body:
    fontFamily: "IBM Plex Sans Arabic, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "IBM Plex Sans Arabic, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.375
rounded:
  control-sm: "10px"
  control: "12px"
  card: "16px"
  pill: "9999px"
spacing:
  card-padding: "20px"
  card-padding-lg: "24px"
  stack-gap: "24px"
  grid-gap: "12px"
  grid-gap-lg: "16px"
components:
  button-primary:
    backgroundColor: "{colors.brand-700}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.brand-800}"
  button-secondary:
    backgroundColor: "{colors.brand-50}"
    textColor: "{colors.brand-800}"
    rounded: "{rounded.control}"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.control}"
  button-danger:
    backgroundColor: "{colors.danger-600}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "20px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "40px"
  badge-success:
    backgroundColor: "{colors.success-50}"
    textColor: "{colors.success-700}"
    rounded: "{rounded.pill}"
  badge-warning:
    backgroundColor: "{colors.warning-50}"
    textColor: "{colors.warning-700}"
    rounded: "{rounded.pill}"
  badge-danger:
    backgroundColor: "{colors.danger-50}"
    textColor: "{colors.danger-700}"
    rounded: "{rounded.pill}"
  nav-rail:
    backgroundColor: "{colors.brand-950}"
    textColor: "{colors.brand-200}"
    width: "256px"
  nav-item-active:
    backgroundColor: "rgb(255 255 255 / 0.11)"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
  net-income-block:
    backgroundColor: "{colors.brand-800}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
---

# Design System: أملاك MS (AmlakMS)

## Overview

**Creative North Star: "The Quiet Ledger"**

The product's promise is an owner's net income after expenses and fee, so the interface reads like a clean statement rather than a card dashboard. Warm stone ground (#f6f5f2) carries white surfaces lifted by layered ring-plus-drop shadows; deep petrol (brand-700 for action, brand-950 for the navigation rail) supplies the ink; a single brass accent appears only on the active navigation glyph. Neutrals lean warm and the brand leans cool so the two never merge into one grey-blue; status hues sit far from brand.

Owners and staff share one system. Staff screens run denser (same tokens, tighter rows); owner screens lead with the statement: gross, minus expenses, minus fee, equals net income in a petrol block closed by a double rule, as in a ledger. Arabic RTL with IBM Plex Sans Arabic is a fixed commitment, as are 44px touch targets on phones and reduced-motion respect.

Motion is a single signature: a staged page entrance and a number count-up, both GSAP and both skipped under `prefers-reduced-motion`.

**Key Characteristics:**
- Warm stone ground, white surfaces, petrol ink; brass only on the active nav glyph.
- Depth by layered transparent shadows; borders reserved for structure (dividers, table rules).
- Arabic-Indic numerals, tabular figures, money isolated left-to-right.
- Status always pairs a dot with tinted ground and darkened same-hue text.
- Concentric radii: 16px cards, 12px controls inside them.

## Colors

A restrained, committed palette: one cool brand scale against warm neutrals, one rare warm metal accent, and four status hues.

### Primary
- **Deep Petrol** (brand-700, #1a566a): primary buttons, avatar disc, selected role tiles, chart bars, brand-tinted figures.
- **Petrol Ink** (brand-800, #144556): primary hover, the net-income block ground, secondary-button text.
- **Rail Night** (brand-950, #0a2029): the sidebar rail, landing and login hero ground, selection text.
- **Mist Petrol** (brand-50 to brand-200): tinted wells (secondary buttons, stat glyph wells, selection ground), rail link text at brand-200.
- Focus and caret use brand-500/brand-600.

### Secondary
- **Ledger Brass** (accent-400 #d6a84e; accent-500 and accent-600 for darker uses): the active navigation glyph in the rail; also the soft "accent" well in StatCard (accent-400 at 15% with accent-600 glyph).

### Neutral
- **Stone Ground** (#f6f5f2): page background; the top bar uses it at 85% with blur.
- **Paper** (#ffffff): cards, inputs, outline buttons.
- **Sunken Stone** (#f1efea): hover grounds, disabled fields, neutral chips.
- **Ink** (#16222a): body text and figures.
- **Muted Slate** (#5b6870): labels, subtitles, placeholders (at 70%).
- **Hairline** (#e4e1d9) and **Strong Hairline** (#cfcbc0): dividers, table head rule, hover field ring, scrollbar thumb.

### Status
Success (#1e9558 dot, #14683c text, #e9f6ee ground), Warning (#d4900e, #8f5d06, #fdf5e3), Danger (#d03a3a, #a02424, #fcecec; #b52e2e for solid danger buttons), Info (#2b7bd6, #1d559a, #e8f1fb).

### Named Rules
**The One Brass Rule.** Brass appears on the active nav glyph, and nowhere that carries data. Its rarity is how the rail says "you are here".
**The Same-Hue Text Rule.** Tinted status grounds take a darkened text of the same hue (700 step), never grey, never the 500 step.
**The Warm-vs-Cool Rule.** Neutrals stay warm, brand stays cool; do not introduce blue-grey neutrals.

## Typography

**Display / Body / Label Font:** IBM Plex Sans Arabic (Arabic and Latin subsets; weights 400, 500, 600, 700; "extrabold" resolves to 700), loaded via next/font as `--font-ui`, falling back to sans-serif.

**Character:** One humanist Arabic family does everything; hierarchy comes from weight (700 to 800 for anything that is a figure or heading) and size, not from a second face. Headings use balanced wrapping and running text uses `text-wrap: pretty`.

### Hierarchy
- **Headline** (800, 1rem mobile / 1.125rem desktop, ~1.5): top bar page title.
- **Title** (700, 1rem, 1.375): card titles.
- **Figure** (800, 1.25rem mobile / 1.5rem desktop for statement figures; 1.75rem for net income): the statement row. Tabular numerals.
- **Stat** (800, 1.45rem, tight tracking): StatCard values.
- **Body** (400 to 500, 0.875rem, relaxed on prose): table cells, notifications, nav items (500).
- **Label** (600, 0.75rem): `dt` labels, form labels, table heads (muted), card subtitles at 400. Micro text is 11px (role caption, hints).

### Named Rules
**The Tabular Figure Rule.** Every figure, table, and live number carries tabular numerals (`.num`, tables) so counts never jitter.
**The One Numeral System Rule.** Digits are Arabic-Indic app-wide, produced by `currency()` and StatCard; do not mix Latin digits into running Arabic UI.
**The LTR Money Rule.** Amounts are rendered through `components/ui/Money.tsx` (a `bdi dir="ltr"`, true minus U+2212) wherever a sign matters, so the sign sits on the digits' leading edge inside RTL text.

## Layout

RTL from the root (`lang="ar" dir="rtl"`). The dashboard shell is a 256px (w-64) sticky petrol rail on the right at lg and up, a drawer (18.5rem, max 85vw) below it, a sticky blurred top bar (min-height 64px), and a centered main column capped at 96rem with 16px/32px side padding. Page blocks stack in a vertical flex with a 24px gap on desktop (16px on mobile), and stat rows are 2 columns on mobile, 4 on desktop with 12px/16px gaps. The statement card divides its figures with hairline vertical rules on desktop (no per-figure boxes) and collapses to two columns with the net-income block spanning full width. Safe-area insets (`env(safe-area-inset-*)`) are honored on the top bar, rail, and main bottom padding; viewport-fit is cover. Touch targets reach 44px on phones (`min-h-11`, `hit-44` extends small hit areas by 8px) and 40px on desktop. Print surfaces use `.no-print` / `.print-sheet`, which strip shadow, border, and padding.

The login page is a two-column split (petrol statement panel and a form column of 30 to 34rem) that collapses to the form alone on phones; role selection is a 4-column radio tile grid.

## Elevation & Depth

Hybrid, shadow-led. Surfaces are lifted by layered transparent shadows (a 1px ring, a tight drop, and a wide soft drop), all tinted from the ink color; borders are kept for structure inside surfaces only.

### Shadow Vocabulary
- **Card** (`0 0 0 1px rgb(22 34 42 / 0.05), 0 1px 2px rgb(22 34 42 / 0.04), 0 8px 20px -10px rgb(22 34 42 / 0.1)`): cards, stat cards.
- **Raised** (`0 0 0 1px rgb(22 34 42 / 0.06), 0 2px 4px rgb(22 34 42 / 0.06), 0 14px 32px -12px rgb(22 34 42 / 0.18)`): drawer, landing statement card, hover on landing tiles.
- **Control** (`0 0 0 1px rgb(22 34 42 / 0.1), 0 1px 1px rgb(22 34 42 / 0.05)`): buttons, inputs, avatar, unselected role tiles.
- **Press** (`inset 0 1px 2px rgb(22 34 42 / 0.12)`): defined for pressed states.

### Named Rules
**The Ring-Not-Border Rule.** A surface's outline is its shadow's 1px ring. Use `border` only for dividers, table rules, and the top bar's lower edge.
**The Soft-Blur Rule.** Backdrop blur is reserved for the sticky top bar (md) and the drawer scrim (2px).

## Shapes

Concentric, softly rounded. Cards are 16px (rounded-2xl); controls inside or beside them are 12px (rounded-xl), small buttons 10px, icon wells 10px; badges and avatars are full pills. Dividers are hairlines; the one decorative rule is the 5px double top border on the net-income block, a deliberate ledger "total" mark. Icons are Lucide line glyphs at stroke 1.75 (2 when active), 14 to 18px.

## Components

### Buttons
- **Shape:** 12px radius (10px for sm); semibold; min height 44px phone / 40px desktop (sm 36/40px, lg 48px).
- **Primary:** Deep Petrol (brand-700) with white text and Control shadow; hover brand-800.
- **Secondary:** brand-50 ground, brand-800 text; hover brand-100. **Outline:** Paper with Control shadow; hover Sunken Stone. **Ghost:** no ground; hover Sunken Stone. **Danger:** danger-600 with white text; hover danger-700.
- **Press / Disabled:** every pressable control scales to 0.96 on active over 140ms (`.pressable`, ease-out); disabled is 50% opacity.

### Cards / Containers
- 16px radius, Paper ground, Card shadow, padding 20px (24px at lg). Header is a flex row (stacked on mobile) with a Title and a 12px muted Subtitle (max-w-prose); content follows with the same padding. Inside a card, groups are divided by hairlines, not nested boxes.

### Inputs / Fields
- Paper ground, 12px radius, Control shadow, 16px text on phones and 14px on desktop (prevents iOS zoom). Hover thickens the ring to border-strong. Focus is a 1.5px brand-600 ring plus a 4px 14% petrol halo; outline is suppressed in favor of this. Disabled uses Sunken Stone with muted text. Labels are 12px semibold at 70% ink.

### Badges (status chips)
- Full pill, 12px semibold, a 6px dot plus tinted ground and darkened same-hue text. Arabic status strings map automatically to tones (e.g. نشط success, معلقة warning, متأخرة danger, جديد info, مسودة neutral); pass `tone` explicitly otherwise.

### Navigation
- Rail: brand-950, brand logo mark and wordmark at the top, items 12px radius, 14px medium text, brand-200 at rest, white 6% ground on hover, white 11% ground and white text when active, with the active glyph in brass accent-400. Longest-matching href wins the active state. Mobile: right-edge drawer with a 55% petrol scrim, closes on Escape or scrim tap. Top bar: sticky, stone at 85% with blur, hairline lower edge, title, user name and role, a petrol initial disc, and a logout icon that tints danger on hover.

### Tables
- Collapsed borders, 14px text, muted 12px head with a strong hairline beneath, hairline row dividers, 14px vertical cell padding, rows tint to Sunken Stone at 70% on hover, header cells right-aligned (start edge in RTL), horizontal scroll inside the card gutter.

### Statement block (signature)
- Gross, expenses, and management fee as `dt`/`dd` pairs separated by hairlines, followed by the net-income block (brand-800, white text, 12px radius, 5px double top rule in brand-300 at 70%). Expenses read in danger-700 and fee in warning-700 as negative `Money`; net income is the only count-up figure in the block.

### Motion
- **PageEnter:** the page's top-level blocks (up to 10) fade and rise 14px over 0.55s, power3.out, 0.06s stagger, once per mount; props cleared afterward.
- **CountUp:** the first number in a formatted string counts from zero over 1.1s (0.15s delay), keeping prefix, suffix, digit style, and grouping; the final text is always the original string.
- Both run only under `prefers-reduced-motion: no-preference`; content is fully visible before and without GSAP. Global CSS also collapses durations under reduced motion. Tokens: ease-out `cubic-bezier(0.22, 1, 0.36, 1)`, durations 140 / 220 / 420ms.

## Do's and Don'ts

### Do:
- **Do** lift surfaces with the Card / Raised / Control shadows and keep `border` for dividers and table rules.
- **Do** keep radii concentric: 16px cards, 12px controls, 10px small controls.
- **Do** render amounts through `Money` and number text through `currency()` so numerals are Arabic-Indic and signs stay on the digits.
- **Do** pair every status with a dot, a tinted ground, and a 700-step same-hue text.
- **Do** keep touch targets at 44px on phones and add `hit-44` to small icon buttons.
- **Do** let leading content on owner pages be the statement (income, expenses, fee, net) before decorative stats.
- **Do** wrap new motion in `prefers-reduced-motion: no-preference`, and reuse PageEnter and CountUp rather than adding new entrances.

### Don't:
- **Don't** use brass for anything other than the active nav glyph (and the existing soft accent well).
- **Don't** introduce a second typeface or a Latin-digit run inside Arabic UI.
- **Don't** return to the generic blue SaaS card grid: no gradient-tinted stat tiles, no colored figures in StatCard (the tone colors the glyph well only).
- **Don't** convey status by color alone, and don't use the 500-step hue as text on a tinted ground.
- **Don't** stack a border and a ring shadow on the same surface.
- **Don't** change print and PDF surfaces (`.no-print`, `.print-sheet`) or role-scoped data behavior as a side effect of visual work.
