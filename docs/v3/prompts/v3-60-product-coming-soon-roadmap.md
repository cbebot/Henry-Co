# V3-60 — Product Expansion: Coming-Soon / Public Roadmap Surface

**Pass ID:** V3-60  ·  **Phase:** G (Product Expansion)  ·  **Pillar:** P1 (Products & Services)
**Dependencies:** V3-12  ·  **Effort:** S  ·  **Parallel-safe:** Y
**Owner gate:** D16 (granularity — recommended Option A "quarterly themes only"; confirm, don't re-litigate)  ·  **Risk class:** — (Compliance-adjacent: signup is consent/GDPR-governed)

---

## Role
You are the V3 Roadmap engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass ships the public, transparent **roadmap surface** on the Hub: quarterly themes (never a slip-prone feature timeline), a per-theme "notify me when it ships" interest signup wired to the real newsletter rails, and the batch notification that fires when a theme launches. The line you must not cross: this is **not a marketing promise wall**. Per the owner's D16 ruling, the surface publishes quarterly *themes* and statuses only — no dated per-feature commitments — and every signup is consent-governed through the existing suppression/consent ledger, never an unmanaged list.

## Project
| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/60-product-coming-soon-roadmap` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
The Hub (`apps/hub`) is the company's public front door — its homepage, about/privacy/terms/contact pages, and `/search` have all been rebuilt to the locked public design system (`PublicSiteShell` + `PublicSiteFooter` from `@henryco/ui`, `--site-*`/`--accent` tokens, system-sans display for hub, content sourced from the `company_pages` CMS primitive + `@henryco/config` fallback). The newsletter rails are real: `@henryco/newsletter` ships `subscriber`, `topics`, `segmentation`, `suppression`, and `brevo` modules; `@henryco/email` handles delivery. There is **no roadmap surface today** — no public statement of what is coming, no pre-launch interest capture, no launch notification.

**Before starting, read `docs/v3/DECISIONS-REQUIRED.md` D16.** The owner's recorded posture is Option A — *quarterly themes only; specific features hidden until shipped* — to reduce over-promise risk for a premium ecosystem that doesn't slip publicly. Confirm that recorded answer; do not re-litigate it, and do not implement Option B (dated feature timeline) or Option C (vote-on-roadmap) unless the answer has been revised.

## Mandatory scope

### S1 — `roadmap_themes` schema (admin-managed)
New migration `supabase/migrations/<ts>_v3_60_roadmap.sql`:

```sql
create table public.roadmap_themes (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,48}$'),
  title        text not null,
  description  text not null,
  quarter      text not null check (quarter ~ '^[0-9]{4}-Q[1-4]$'),  -- e.g. 2026-Q3; theme-level, never a feature date
  status       text not null default 'planned'
                 check (status in ('planned','in_progress','shipped')),
  sort_order   int  not null default 0,
  shipped_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.roadmap_interest (
  id          uuid primary key default gen_random_uuid(),
  theme_id    uuid not null references public.roadmap_themes(id) on delete cascade,
  email       text not null,
  user_id     uuid references auth.users(id),          -- null for anonymous signups
  consent_at  timestamptz not null default now(),
  notified_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (theme_id, email)
);

alter table public.roadmap_themes   enable row level security;
alter table public.roadmap_interest enable row level security;

-- Public read of the published roadmap (any non-draft theme).
create policy roadmap_public_read on public.roadmap_themes for select using (true);
-- Themes are admin-managed: writes only via the owner/admin CMS path (no public write policy).

-- A user can read only their own interest rows; anonymous signups are write-only from the public route.
create policy interest_self_read on public.roadmap_interest for select
  using (user_id is not null and user_id = auth.uid());
-- Inserts go through the SECURITY DEFINER signup RPC (validates consent + suppression), not a direct client policy.
```
Theme content is authored through the owner CMS (`apps/cms`) or an admin route — never user-editable. Acceptance: `roadmap_themes` reads publicly; no public write path; an anonymous user cannot read the interest list.

### S2 — `/roadmap` route on the Hub
Add `apps/hub/app/roadmap/page.tsx` (resolved via `henryWebRoot('/roadmap')` — never a hardcoded host). Renders themes grouped by quarter, each with title, description, expected window (the quarter, not a date), status chip (planned / in progress / shipped), and a per-theme "Notify me when it's ready" control. Built with `PublicSiteShell` + `PublicSiteFooter`, hub `--site-*`/`--accent` tokens, the hub display face (system-sans per the hub reality, **not** Fraunces — match the shipped hub typography). Light + dark, mobile + desktop, CLS ≈ 0. The page reads brand strings from `@henryco/config` (`COMPANY.group.name = "Henry Onyx"`). Acceptance: the roadmap renders publicly with real theme data; the page is hub-design-system consistent.

### S3 — Pre-launch interest signup (consent-governed)
A `SECURITY DEFINER` RPC + route `apps/hub/app/api/roadmap/notify/route.ts`:
- Accepts `{ themeId, email }`; for authenticated users captures `user_id`.
- Checks `@henryco/newsletter` suppression before inserting; records `consent_at`; idempotent on `(theme_id, email)`.
- Double opt-in / consent-ledger consistent with the existing newsletter consent flow — this is a marketing-class signup, kept separate from transactional email.
Acceptance: signing up adds a `roadmap_interest` row with consent; a suppressed email is rejected; double-signup is idempotent; an unsubscribe path honours the suppression list.

### S4 — Launch notification batch
When a theme flips to `status = 'shipped'`, a workflow/cron job batch-notifies everyone who registered interest (via `@henryco/email`), marks `notified_at`, respects suppression + quiet hours, and never double-sends (idempotent on `notified_at`). Acceptance: flipping a theme to `shipped` sends one notification per interested, non-suppressed email; re-running the job sends nothing.

### S5 — Telemetry
Emit through `@henryco/intelligence` (envelope validated by `henryEventNameSchema`, `henry.<domain>.<noun>.<verb>`):
- `henry.roadmap.theme.viewed`
- `henry.roadmap.signup.created`
- `henry.roadmap.notify.sent`

Add the three names to `HenryEventNames` in `packages/intelligence/src/index.ts`.

## Out of scope
- Dated per-feature timeline (D16 Option B — explicitly not built).
- Vote-on-roadmap UI (D16 Option C — explicitly not built).
- The general newsletter campaign engine (V3-61) — this pass uses `@henryco/newsletter` primitives but does not build campaign authoring.
- Theme authoring UI beyond the existing owner-CMS/admin path (the CMS owns content authoring).

## Dependencies
**Depends on:** V3-12 (Foundation Lock). **Consumes:** `@henryco/newsletter`, `@henryco/email`, the Hub public design system, the owner CMS (`apps/cms`) for theme authoring. **Blocks:** nothing.

## Inheritance
- Hub public design system — `PublicSiteShell`, `PublicSiteFooter` from `@henryco/ui`; hub `--site-*`/`--accent` tokens; hub system-sans display; `company_pages` CMS pattern.
- `@henryco/newsletter` — `subscriber`, `suppression`, consent; signup reuses these, never a raw list.
- `@henryco/email` — launch-notification delivery.
- `@henryco/config` — `henryWebRoot()`, Henry Onyx brand from `company.ts`.
- `@henryco/observability/audit-log` — admin theme-status changes audited.
- `@henryco/intelligence` — telemetry.
- `@henryco/i18n` — all copy.

## Implementation requirements

### Files
- `supabase/migrations/<ts>_v3_60_roadmap.sql` (S1 tables + RLS + signup RPC).
- `apps/hub/app/roadmap/page.tsx` (S2) + supporting components.
- `apps/hub/app/api/roadmap/notify/route.ts` (S3 signup RPC route).
- Workflow/cron hook for the S4 launch-notification batch.
- Owner-CMS/admin theme management (extend `apps/cms` if the authoring surface is missing).
- `packages/i18n/src/roadmap-copy.ts` (+ index export); `packages/intelligence/src/index.ts` (3 event names).

### Trust / safety / compliance
- Themes are admin/owner-managed only — no public write path to `roadmap_themes`.
- Signup is **GDPR/NDPR-consistent**: consent captured (`consent_at`), suppression honoured, unsubscribe path present, marketing-class kept separate from transactional email.
- Interest list is private — only the owning user reads their own row; anonymous list never publicly readable.
- `writeAuditLog` on theme status changes (especially the `shipped` flip that triggers the notification batch).
- **No over-promise** — quarterly themes only (D16 Option A); no dated feature commitments anywhere in copy or schema.

### Mobile + desktop parity
The roadmap page + signup control are responsive on web mobile (per V3-09). Super-app: the roadmap renders through the public web export; native roadmap is not in scope.

### i18n
All copy through `@henryco/i18n` namespace **`surface:roadmap`** (Pattern A typed keys for theme labels/statuses/CTAs; Pattern B runtime fallback for non-en locales). Theme titles/descriptions are CMS content (translated at the content layer); status chips, the signup CTA, confirmation, and the launch-notification email are translated keys. Zero hardcoded user-facing strings.

### Brand & design system
Henry Onyx brand via `@henryco/config` — never "Henry & Co.", never hardcoded. Hub public design system: hub `--site-*`/`--accent` tokens, hub **system-sans** display (NOT Fraunces — match the shipped hub reality), `PublicSiteShell`/`PublicSiteFooter`. Light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` clean. Zero hardcoded domains — route via `henryWebRoot('/roadmap')`.

## Validation gates
1. **CI** green: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
2. **RLS suite** (`pnpm test:rls`): public read of themes; no public write; anonymous cannot read the interest list; user reads only own interest row.
3. **Signup tests**: consent captured; suppressed email rejected; idempotent double-signup; unsubscribe honoured.
4. **Notification test**: theme → `shipped` sends one email per interested non-suppressed address; re-run is a no-op (`notified_at` idempotency).
5. **i18n gate** passes; `surface:roadmap` in 12 locales.
6. **Real-browser UI**: roadmap page in light + dark, mobile + desktop, CLS ≈ 0, contrast clean; hub-design-system consistent.

## Deployment gate
All gates green. **Owner reviews the first roadmap content and confirms D16 Option A before publish** — the surface is owner-voice. Branch off `origin/main` → PR → CI green → squash-merge; no force-push. No extended soak required (low-risk surface), but verify the launch-notification idempotency in staging before the first real `shipped` flip.

## Final report contract
`.codex-temp/v3-60-product-coming-soon-roadmap/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification (roadmap renders; signup + suppression honoured) · telemetry baseline (the 3 `henry.roadmap.*` events) · deferred items · pass-closure assertion (incl. D16 Option A confirmed, no dated feature commitments shipped).

## Self-verification
- [ ] D16 read + confirmed (Option A, quarterly themes only); no dated feature timeline, no vote UI shipped.
- [ ] S1: `roadmap_themes` + `roadmap_interest` schema + RLS (public theme read, no public write, private interest list).
- [ ] S2: `/roadmap` renders on the Hub via `henryWebRoot()`, hub design system (system-sans, not Fraunces), light/dark, CLS ≈ 0.
- [ ] S3: consent-governed signup through `@henryco/newsletter` suppression; idempotent; unsubscribe honoured.
- [ ] S4: launch-notification batch fires once per interested non-suppressed email on `shipped`; idempotent.
- [ ] S5: 3 `henry.roadmap.*` telemetry events added to `HenryEventNames` and firing.
- [ ] Brand = Henry Onyx via `@henryco/config`; zero hardcoded domains/strings; `surface:roadmap` in 12 locales.
- [ ] CI + RLS + signup + notification + i18n + real-browser gates green.
- [ ] `.codex-temp/v3-60-product-coming-soon-roadmap/report.md` written with all 9 sections.
