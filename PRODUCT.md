# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Existing codebase: Next.js 16 (App Router), React 19, Tailwind CSS v4, Firebase. Android app is a Capacitor WebView that live-loads this same web app (mobile web, not a native design language).

## Users
Property owners are the main target audience (confirmed by the user). Other roles share the same app: admin, accountant, leasing agent ("الوسيط"), tenant, technician, maintenance staff, custom roles. Arabic, right-to-left (`lang="ar" dir="rtl"`).

## Product Purpose
Property/real-estate management system for Saudi Arabia: properties and units, contracts (including Ejar import), payments and vouchers, invoices and quotes, maintenance, expenses, owner statements, listings and occupancy, reports, audit log. Success: owners trust it as the clear, current record of their portfolio and money.

## Positioning
[Open decision. Not captured.]

## Operating Context
Used on desktop by staff and on phones (including the Android WebView) by owners, tenants, technicians. Documents are printed and exported (PDF invoices, quotes, vouchers, owner statements, CSV/Excel).

## Capabilities and Constraints
- Keep Arabic RTL and the Cairo face unless explicitly changed.
- Safe-area insets must keep working in the Android WebView (viewportFit cover).
- Print and PDF surfaces (`.no-print`, `.print-sheet`) must stay intact.
- Role-scoped data (accountant and leasing agent scoped by owner) must not be changed by visual work.

## Brand Commitments
Name: أملاك MS. Current identity is a blue brand with an amber accent; the user asked for a refined, professional redesign, not a continuation of the old look.

## Evidence on Hand
No customer proof, testimonials or metrics recorded. Do not fabricate.

## Product Principles
1. Owners must grasp their portfolio and money position at a glance.
2. Trust comes from clarity and precision, not decoration.
3. Dense staff screens and owner screens share one system.
4. Phone-first legibility for owners; efficient density for staff on desktop.

## Accessibility & Inclusion
Arabic RTL first-class; touch targets at least 44px on mobile; respect prefers-reduced-motion.
