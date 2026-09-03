# HenryCo Owner CMS — Engineering Spec & Build Prompt

**Status:** DRAFT FOR APPROVAL — no implementation until the owner approves this spec and the open decisions in §9.
**Date:** 2026-06-01
**Author:** Claude (Opus 4.8), grounded in a 4-track read-only audit of the live codebase.
**One-line goal:** A standalone, owner-only admin CMS — its own deployment on its own URL — that is the single, magnificent control surface for **all editable content & configuration behind HenryCo's public websites** (the hub + 7 division sites), editing the **real, live** data.

---

## 0. How to read this

This is a design spec, written *before* building because the surface is large and several decisions are load-bearing. It is grounded in a real audit (not the original generic brief). Where the original brief assumed a greenfield 3-route site, the reality is a mature multi-app platform; this spec reconciles the two. **§9 lists the decisions I need from the owner before implementation starts.**

---

## 1. Goals & non-goals

### Goals
- One **owner-only** admin app, **separate deployment + URL**, distinct from the hub.
- Edits the **real, live** content/config that the public sites render (not demo data).
- **Magnificent, production-grade** UX — the owner's highest bar, not a CRUD form dump.
- Covers, over phases, **every editable content/config surface** across the hub and all 7 divisions.

### Non-goals (at least initially)
- **Operational data** (orders, payments, KYC, wallet, support tickets, trust, rooms) stays where it is — the existing `/owner` Command Center already surfaces it as telemetry. This CMS owns the **content / brand / marketing / legal-config** layer, not transactional operations.
- Not a replacement for the division-specific operator tools (e.g. care booking management) — though it may absorb their *marketing-copy* surfaces (Phase 3).

---

## 2. Audit findings that shape the design (the reality)

From four parallel audit tracks (owner console, data model, public-site consumption, platform/auth):

1. **A partial CMS already exists in the hub.** Editable today via `/owner/brand`: `company_pages` (about/contact/privacy/terms, **realtime** via `CompanyPageClient`), `company_settings`, `company_site_settings`, `company_divisions`, `company_people`. We **reuse these tables and the auth model**; we do not duplicate them.
2. **The owner-auth model is simple and reusable.** `requireOwner()` (`apps/hub/app/lib/owner-auth.ts`): a verified Supabase auth user **and** an `owner_profiles` row with `is_active === true` and `role ∈ {owner, admin}`. No email-allowlist env. Writes use the service-role client gated *solely* by `requireOwner()`. Every mutation is audit-logged. No per-module RBAC (single owner sees all).
3. **Cross-domain auth constraint (architecture-defining).** Owner session cookies are domain-scoped to `.henrycogroup.com` (`getSharedCookieDomain`, `packages/config/company.ts`). A CMS on a foreign apex (`*.vercel.app`) **cannot** inherit that session and must run its **own** Supabase login; a `cms.henrycogroup.com` subdomain inherits it for free. Same Supabase project + same `owner_profiles` = same owner identity & RLS either way — only the *session transport* differs.
4. **Division marketing copy is hardcoded.** No division public route touches the hub `company_*` tables. Each division's hero/section/"why"/CTA copy lives in large static typed `public-copy.ts` modules (marketplace ~7.3k lines, property ~1.5k, jobs ~1k) or inline JSX. **Only Care** has a DB-editable hero (`care_settings`). This is the single biggest net-new modeling effort.
5. **Legal/company identity is hardcoded in `@henryco/config`** — `LEGAL` (entity name, RC number, registered office, TIN, NDPC reg, DPO — several are live `[OWNER-TO-CONFIRM]` placeholders), `LEGAL.contacts/jurisdiction/policy`, and the data lists (`NDPA_LAWFUL_BASES`, `DATA_CATEGORIES`, `SUB_PROCESSORS`, `RETENTION_POLICIES`, `INTERNATIONAL_AUTHORITIES`), plus `COMPANY.divisions.*` identity. These render into the live privacy/terms/about pages but are **not editable**.
6. **The CMS tables' DDL is not in version control** (provisioned out-of-band; only later index/RLS patches reference them). Schema drift / dual-naming is pervasive (`slug`/`page_key`, multiple CTA aliases). Two homepage models (`hub_homepage_content` vs `company_homepages`) and two FAQ tables (`company_faqs` active, `company_homepage_faqs` legacy) coexist.
7. **i18n is English-canonical, DeepL downstream.** DB rows translate via `resolveLocalizedDynamicField` + a Supabase translation cache (`@henryco/i18n` server). The CMS edits **English**; translation is downstream and automatic.
8. **Reusable platform pieces:** `@henryco/ui` (design tokens `PublicDesignTokens`, forms, theming, `PublicToast`), `@henryco/brand` (`HenryCoLogo`), `@henryco/i18n`, the Supabase SSR client wrappers, and the **Cloudinary signed-upload route** pattern (`/api/owner/upload`, owner-gated) for media. Fonts are **Newsreader** (serif display) + **Geist/Manrope** (sans) — not Fraunces.

---

## 3. Architecture

- **App:** a new standalone **Next.js 16 (App Router)** app. Recommended home: `apps/cms` in this monorepo (so it imports `@henryco/ui`, `@henryco/config`, `@henryco/i18n`, `@henryco/brand` directly) — but deployed as **its own Vercel project** for an isolated URL. (Alt: separate repo — heavier, loses package reuse. See §9 decision 4.)
- **Backend:** the **same Supabase project** as the hub (same `auth.users`, same `owner_profiles`, same content tables) → it edits the real, live sites. Public sites already read these tables, so edits propagate (realtime where wired).
- **Auth:** the `requireOwner()` model, reused. Session transport depends on §9 decision 1 (subdomain → shared session; foreign apex → standalone Supabase login, owner-gated by `owner_profiles`).
- **Deploy target:** a fresh Vercel project under **HenryCo Studio** (`team_0PUdVTapDfmw8tpwht4TvRUG`) — the only Vercel team this session can deploy to (`henry-co` 403s). Custom domain `cms.henrycogroup.com` strongly recommended (see §9.1).
- **Schema ownership:** this project **brings the content tables' DDL + RLS into version-controlled migrations** (they are currently un-versioned) and canonicalizes the drifted columns.
- **Security:** owner-only; service-role writes gated by the route/`requireOwner()`; audit every mutation (reuse `owner-audit-log`); RLS as defense-in-depth; no secrets in the client bundle.

---

## 4. Scope & phasing

"All admin tasks on all the websites" is multi-phase. Each phase ships independently through CI → PR → merge → deploy.

- **Phase 0 — Foundation (ship a live owner-only shell).** Standalone app scaffold; auth (per §9.1); `@henryco/ui` design system + theming; app chrome (nav, command palette, toasts); audit logging; Cloudinary signed-upload media primitive; deploy to the fresh URL. *Exit:* owner logs in at the new URL and sees an empty, beautiful, secured shell.
- **Phase 1 — Hub content parity-plus.** Page builder for `company_pages` (about/contact/privacy/terms) with hero/stats/sections blocks, **draft vs published**, **live preview**, realtime publish, unsaved-change tracking, per-field i18n indicator, media upload; editors for `company_settings`, `company_site_settings`, `company_divisions`, `company_people`, `hub_homepage_content`, `company_faqs`. Plus: **formalize these tables' DDL + RLS in migrations** and canonicalize column drift. *Exit:* the CMS does everything `/owner/brand` does today, standalone and far better.
- **Phase 2 — Legal & company config → DB.** Migrate `@henryco/config` `LEGAL`/`COMPANY`/contacts/jurisdiction/policy + the data lists into editable DB-backed config; resolve the `[OWNER-TO-CONFIRM]` placeholders through the CMS; keep code fallbacks as last-resort. *Exit:* the owner can edit the live legal entity details, sub-processors, retention table, etc., without a deploy.
- **Phase 3 — Division marketing copy.** A unified `division_pages` editable model (hero + sections + "why" + CTAs + FAQs, i18n-aware) replacing the hardcoded static `public-copy.ts` modules across all 7 divisions. The largest net-new modeling effort; sequenced division-by-division. *Exit:* division marketing copy is owner-editable end-to-end.
- **Phase 4 — Consolidation & polish.** Unify the inconsistent stores (Care settings row, Studio settings-JSON, Property Storage-JSON), retire the legacy FAQ/homepage tables, ship a real media library, finalize canonical schema.

---

## 5. Entity model (what the CMS manages)

**Already DB-backed (Phase 1):** `company_pages`, `company_settings`, `company_site_settings`, `company_divisions`, `company_people`, `hub_homepage_content`, `company_faqs` (retire legacy `company_homepage_faqs`). Editorial config: `email_audience_segments`, `email_brand_voice_rules`.
**Config → DB (Phase 2):** `LEGAL.*`, `COMPANY.divisions.*`, `BRAND_EMAILS`, `NDPA_LAWFUL_BASES`, `DATA_CATEGORIES`, `SUB_PROCESSORS`, `RETENTION_POLICIES`, `INTERNATIONAL_AUTHORITIES`, `LEGAL.policy/jurisdiction`.
**New model (Phase 3):** `division_pages` (per-division marketing copy), replacing the static `public-copy.ts` modules.
Canonical record shapes today live in `apps/hub/app/lib/{company-pages,company-settings,divisions,homepage,about-people}.ts` and the upsert payloads in `apps/hub/lib/owner-actions.ts` — these are the authoritative starting schema.

---

## 6. Admin UX — the "magnificent" bar

- **Design system:** `@henryco/ui` tokens (`PublicDesignTokens`, `PublicSurfaceStyles`, form primitives), `@henryco/brand` `HenryCoLogo`, Newsreader display + Geist/Manrope sans, light/dark via `ThemeProvider`.
- **Editing experience (not a form dump):** structured **page builder** (hero / stats / section blocks, drag-reorder), **live preview** of the public render, **draft → publish** with realtime propagation, unsaved-change indicators, ⌘/Ctrl-S save, optimistic-but-truthful save state machine, per-field **i18n status** (English canonical; translation downstream), inline **media upload** (drag-drop → Cloudinary signed), and an **audit trail** view.
- **Owner-only, single admin, hardened.** No multi-tenant UI; built for one principal.

---

## 7. Security & access

- `requireOwner()` model: verified Supabase user + active `owner_profiles` (owner/admin). Service-role writes gated by the route. Audit every mutation. RLS as backstop. No service-role/Cloudinary secrets in the browser bundle.
- If standalone login (foreign apex): email magic-link / OTP, then the same `owner_profiles` gate. Pin `secure: true`, `sameSite: lax`.
- Writes are additive/safe against the live sites: migrations are additive, public read policies (`is_published = true`) preserved, no destructive column renames without a compatibility window.

---

## 8. Deployment

- New Vercel project under **HenryCo Studio**; fresh URL (e.g. `henryco-cms` → `cms.henrycogroup.com` if a subdomain is assigned).
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (same project as hub), `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET`, and `NEXT_PUBLIC_BASE_DOMAIN` set per the auth decision (unset/foreign → host-scoped cookies for standalone login).
- Pipeline: if in the monorepo, the same CI gate (`Lint, typecheck, test, build`) → PR → squash-merge to `main` → Vercel auto-deploys; the CMS Vercel project builds from `apps/cms`.

---

## 9. Open decisions (need owner input before build)

1. **Domain / auth (most important).**
   - **(A, recommended)** `cms.henrycogroup.com` subdomain → inherits the existing owner session, zero new login, `requireOwner()` verbatim. Requires assigning the DNS subdomain to the new Vercel project.
   - **(B)** Raw `*.vercel.app` URL (what was literally requested) → the CMS runs its **own** owner login (Supabase magic-link/OTP, same `owner_profiles` gate). Fully workable; just one extra login.
2. **Confirm: edit the REAL live Supabase content** (same project) — i.e. changes go live on the actual sites. (Recommended / implied by "real live.") Yes/no.
3. **Phase 1 scope to start with:** ship **Phase 0 + Phase 1** first (standalone secured shell + full hub-content parity-plus on a fresh URL), then proceed to Phase 2 (legal config) and Phase 3 (division copy)? Or reprioritize.
4. **Code home:** `apps/cms` in this monorepo (recommended — reuses the shared packages) vs a separate standalone repo.

---

## 10. Risks & honesty

- **Scale:** Phases 2–3 (legal-config migration; 7 divisions of hardcoded copy) are the bulk of the work and are genuinely large. Phase 0+1 is the tractable, high-value, shippable start.
- **Live data:** because the CMS edits the same tables the public sites read, migrations must be additive and RLS-careful; we never break the live sites.
- **Un-versioned schema:** formalizing the CMS tables' DDL/RLS is prerequisite work folded into Phase 1.
- **Auth on a foreign apex** adds a login surface to secure; the subdomain option avoids it.
