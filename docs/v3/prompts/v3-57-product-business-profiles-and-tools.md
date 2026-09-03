# V3-57 — Product Expansion: Business Profiles + Tools

**Pass ID:** V3-57  ·  **Phase:** G (Product Expansion)  ·  **Pillar:** P1 (Products & Services), P8 (Business & Enterprise)
**Dependencies:** V3-12  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** Identity (business-context impersonation)

---

## Role
You are the V3 Business Profiles engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass introduces the **business account** as a first-class identity that sits beside the personal account: a verified company entity, a public storefront, a team with roles, aggregated cross-division analytics, and an audited "act as my business" context switch. The line you must not cross: a business context never inherits more authority than its acting member already holds, and the personal-vs-business actor is never ambiguous in any audit record, telemetry event, or money mutation. You are building the identity primitive that V3-58 (Seller Academy) and all of Phase H (V3-70..V3-75) stand on — get the schema and the RLS right.

## Project
| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/57-product-business-profiles-and-tools` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
Today Henry Onyx has **no formal business-account model**. The platform recognises only personal `auth.users` accounts; a "seller" is an individual flagged through `apps/marketplace/app/account/seller-application/{start,verification,review}/page.tsx`, and the only thing resembling a company surface is the public storefront at `apps/marketplace/app/(public)/store/[slug]/page.tsx`, which renders a single seller's listings — not a multi-member, multi-division business. There is no concept of a team, no role model beyond personal account roles, no way for a user to act on behalf of a company, and no aggregated business analytics. `@henryco/auth` issues a single personal session; `@henryco/trust` carries individual verification state.

This pass closes that gap by introducing the `businesses` / `business_members` / `business_invitations` entities, an **acting-context** layer on top of `@henryco/auth`, a Henry-Onyx-branded public business profile that reuses the storefront chrome, a team-management surface with `owner`/`admin`/`member` roles, and an aggregated analytics surface fed by the existing `@henryco/intelligence` event stream. Verification is gated on the same identity rails KYC (V3-24) will later supply, with a manual-review fallback until then.

## Mandatory scope

### S1 — Business identity schema + RLS
New migration `supabase/migrations/<ts>_v3_57_business_profiles.sql`. Money-adjacent identity data — get the RLS exactly right; default-deny.

```sql
create table public.businesses (
  id                     uuid primary key default gen_random_uuid(),
  slug                   text not null unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$'),
  legal_name             text not null,
  trading_name           text,
  business_registration  text,                 -- CAC/registration number; verified out-of-band
  country                text not null,         -- ISO-3166-1 alpha-2; validate against @henryco/config/countries
  primary_partner_type   text not null check (primary_partner_type in
                           ('marketplace_seller','service_provider','employer','studio_client','logistics_shipper')),
  status                 text not null default 'pending'
                           check (status in ('pending','active','suspended','closed')),
  verified_at            timestamptz,
  created_by             uuid not null references auth.users(id),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create table public.business_members (
  business_id  uuid not null references public.businesses(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null check (role in ('owner','admin','member')),
  joined_at    timestamptz not null default now(),
  primary key (business_id, user_id)
);

create table public.business_invitations (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  email        text not null,
  role         text not null check (role in ('admin','member')),
  token_hash   text not null,                   -- store sha256(token); never the raw token
  invited_by   uuid not null references auth.users(id),
  expires_at   timestamptz not null,
  accepted_at  timestamptz,
  created_at   timestamptz not null default now(),
  unique (business_id, email)
);

alter table public.businesses           enable row level security;
alter table public.business_members     enable row level security;
alter table public.business_invitations enable row level security;

-- A member can read their own businesses.
create policy businesses_member_read on public.businesses for select
  using (exists (select 1 from public.business_members m
                 where m.business_id = businesses.id and m.user_id = auth.uid()));

-- Only owner/admin can update business metadata.
create policy businesses_admin_write on public.businesses for update
  using (exists (select 1 from public.business_members m
                 where m.business_id = businesses.id and m.user_id = auth.uid()
                   and m.role in ('owner','admin')));

-- Members read the member list of businesses they belong to.
create policy members_read on public.business_members for select
  using (exists (select 1 from public.business_members me
                 where me.business_id = business_members.business_id and me.user_id = auth.uid()));

-- Only owner mutates the member roster (invite acceptance + role changes go through SECURITY DEFINER RPCs).
create policy members_owner_write on public.business_members for all
  using (exists (select 1 from public.business_members me
                 where me.business_id = business_members.business_id and me.user_id = auth.uid()
                   and me.role = 'owner'));
```
Active-status businesses expose only public-profile columns to anonymous readers through a dedicated `public.business_public_profile` view (slug, trading_name, country, verified_at, status) with its own `for select using (status = 'active')` policy — never expose `business_registration`, `created_by`, or the member roster to anonymous traffic. Acceptance: `pnpm test:rls` proves an unrelated user cannot read a business roster, cannot update metadata, and cannot read `business_registration`.

### S2 — Acting-context layer on `@henryco/auth`
Extend `@henryco/auth` with an acting-context primitive (do **not** fork the session model). New file `packages/auth/src/server/acting-context.ts`:

```ts
export type ActingContext =
  | { kind: "personal"; userId: string }
  | { kind: "business"; userId: string; businessId: string; role: "owner" | "admin" | "member" };

/** Resolve the caller's active context from the signed `henryco_acting_ctx` cookie, falling back to personal.
 *  MUST re-verify membership against business_members on every call — never trust the cookie alone. */
export async function resolveActingContext(req: Request): Promise<ActingContext>;

/** Switch context. Verifies membership, writes a signed cookie, returns the new context.
 *  Throws if the user is not a member of the target business. */
export async function setActingContext(userId: string, target: { businessId: string } | "personal"): Promise<ActingContext>;
```
The acting context is **advisory for surface display and audit attribution only** — it never widens RLS. Every business-scoped mutation independently re-checks `business_members` server-side. The signed cookie uses the existing `@henryco/config/supabase-cookies` signing helpers; the switch is a `requireSensitiveAction`-guarded route (`apps/account/app/api/business/context/route.ts`) so a stolen session cannot silently assume a business identity. Acceptance: switching to a business the user does not belong to returns 403; the audit log records both `userId` and `businessId`.

### S3 — Public business profile surface (Henry Onyx branded)
Reuse the storefront chrome, do not invent new chrome. Add `apps/account/app/(account)/business/[slug]/page.tsx` for the owner/member edit view and elevate the existing `apps/marketplace/app/(public)/store/[slug]/page.tsx` to render a business (logo, bio, team avatars, aggregate review score, and the business's listings/services/jobs cross-division). The public URL resolves through `henryDomain('marketplace', '/store/<slug>')` — **never** a hardcoded host. All chrome is `PublicSiteShell` + `PublicSiteFooter` from `@henryco/ui`; the division accent comes from `company.ts`; the display face is Fraunces. The business name shown is the `trading_name` (or `legal_name` fallback) from the row — the platform brand around it is read from `@henryco/config` (`COMPANY.group.name = "Henry Onyx"`), never hardcoded. Acceptance: an active business renders publicly in light + dark, mobile + desktop, CLS ≈ 0; a `pending`/`suspended` business 404s for anonymous traffic.

### S4 — Business tools: team management + analytics + context switcher
- **Team management** at `apps/account/app/(account)/business/[slug]/team/page.tsx`: list members, invite by email (writes `business_invitations` with `sha256(token)`, sends through `@henryco/email`), accept-invite RPC (`accept_business_invitation(token)` `SECURITY DEFINER`, validates `token_hash` + `expires_at`, inserts `business_members`, marks `accepted_at`), remove member, change role. Owner-only for role changes and removals; admins may invite `member`s only. Every mutation calls `writeAuditLog` from `@henryco/observability/audit-log` with `{ businessId, actorUserId, targetUserId, action }`.
- **Aggregated analytics** at `apps/account/app/(account)/business/[slug]/insights/page.tsx`: aggregate the business's activity across divisions from the `@henryco/intelligence` event stream (orders, bookings, job posts, storefront views) into tiles. Every tile obeys the V3-08 truth rule — distinguish "no data yet" from "loading" from "you have nothing." No decorative placeholders.
- **Context switcher** in the account chrome: a control that flips between "acting as <me>" and "acting as <business>", calling S2's guarded route. The active context is visible at all times so a member always knows which identity is acting.

### S5 — Telemetry
Emit through `@henryco/intelligence` (envelope validated by `henryEventNameSchema`, `henry.<domain>.<noun>.<verb>`):
- `henry.business.profile.created`
- `henry.business.member.added`
- `henry.business.context.switched`
- `henry.business.profile.viewed`

Each event carries `division` and an actor block distinguishing `user` vs business attribution. Add the four names to the `HenryEventNames` map in `packages/intelligence/src/index.ts`.

## Out of scope
- Vertical business suites (employer hiring suite V3-70, seller business suite V3-71, provider CRM V3-72, studio project suite V3-73, logistics business dashboard V3-74).
- Bulk invoicing + company admin accounts (V3-75).
- Seller tiers / academy badges (V3-58 — consumes this pass's profile).
- KYC vendor integration (V3-24) — this pass gates verification on a manual-review fallback and the existing `@henryco/trust` state; the vendor adapter is V3-24's job.
- Public business API / team-role API (V3-80).

## Dependencies
**Depends on:** V3-12 (Foundation Lock acceptance). **Blocks:** V3-58 (Seller Academy — badges render on the business profile), V3-70..V3-75 (every enterprise suite scopes to a `business`), V3-80 (business-account API). Get the `businesses`/`business_members` shape right; six downstream passes inherit it.

## Inheritance
- `@henryco/auth` — session model extended with the acting-context layer (`resolveActingContext`/`setActingContext`); `requireSensitiveAction` for the context-switch route.
- `@henryco/ui` — `PublicSiteShell`, `PublicSiteFooter`, storefront chrome for the profile.
- `@henryco/config` — `henryDomain()`, `company.ts` brand + division accents, `countries.ts` for country validation.
- `@henryco/trust` — existing verification state used as the verification fallback.
- `@henryco/observability/audit-log` — `writeAuditLog` on every roster/context mutation.
- `@henryco/intelligence` — analytics event stream + telemetry envelope.
- `@henryco/email` — invitation delivery.
- `@henryco/i18n` — all labels/status/errors.

## Implementation requirements

### Files
- `supabase/migrations/<ts>_v3_57_business_profiles.sql` (S1 schema + RLS + `business_public_profile` view + `accept_business_invitation` RPC).
- `packages/auth/src/server/acting-context.ts` (+ barrel export).
- `apps/account/app/api/business/context/route.ts` (guarded context switch).
- `apps/account/app/(account)/business/[slug]/page.tsx`, `.../team/page.tsx`, `.../insights/page.tsx`.
- Elevation of `apps/marketplace/app/(public)/store/[slug]/page.tsx` to render a business profile.
- `packages/i18n/src/business-copy.ts` (+ index export); `packages/intelligence/src/index.ts` (4 event names).

### Trust / safety / compliance
- Default-deny RLS on all three tables; anonymous readers reach only the `business_public_profile` view.
- Invitation tokens stored as `sha256(token)`; raw token only in the emailed link; `expires_at` enforced in the accept RPC.
- Context switch is `requireSensitiveAction`-guarded and re-verifies `business_members` server-side; the cookie never widens authority.
- `writeAuditLog` on create, member add/remove, role change, and context switch — recording both personal `userId` and `businessId`.
- ANTI-CLONE Principle 12: business scoring/aggregation logic stays server-side behind authenticated routes (see `docs/v3/ANTI-CLONE.md`; D12 posture).

### Mobile + desktop parity
Public profile, team management, insights, and the context switcher are responsive and verified on web mobile (safe-area, sticky nav, modal escape per V3-09). Super-app: business profiles render through the existing public web export; native team-management is deferred to mobile-parity passes (V3-87) — note this explicitly, do not silently skip.

### i18n
All copy through `@henryco/i18n` namespace **`surface:business`** (Pattern A typed keys for the team/insights/profile chrome; Pattern B `translateSurfaceLabel` runtime fallback for the 11 non-en locales). Labels, member-role names, statuses, invitation emails, and every error string are translated. Zero hardcoded user-facing strings; zero hardcoded domains.

### Brand & design system
Henry Onyx brand correctness via `@henryco/config` (`COMPANY.group.name`, division names `Henry Onyx <Division>`) — never the retired "Henry & Co.", never hardcoded. Fraunces display + locked `--site-*`/`--accent` tokens; per-division accent from `company.ts`. Light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed (`pnpm a11y:contrast`).

## Validation gates
1. **CI** green: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` across affected workspaces.
2. **RLS suite** (`pnpm test:rls`, ~8 cases): unrelated user blocked from roster read, metadata write, `business_registration` read; anonymous reader reaches only `business_public_profile`; pending/suspended business invisible to anonymous.
3. **Unit/integration** (~12 cases): invitation create → accept → membership; expired/invalid token rejected; role-change authority matrix (owner vs admin vs member); context switch to non-member 403s; analytics aggregation distinguishes the three empty/loading/no-data states.
4. **e2e** (Playwright): create business → invite member → accept → switch context → mutate as business → audit log records both actors → public profile renders.
5. **i18n gate**: hardcoded-text scanner passes; `surface:business` namespace present in all 12 locales.
6. **Real-browser UI**: public profile + team + insights in light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` clean.

## Deployment gate
All validation gates green; RLS suite green is mandatory (identity surface). Owner review of the public business-profile design from screenshots before merge. Branch `v3/57-product-business-profiles-and-tools` off `origin/main` → PR → CI green → squash-merge; no force-push. 14-day soak on the context-switch + audit-attribution path before V3-58 consumes the profile.

## Final report contract
`.codex-temp/v3-57-product-business-profiles-and-tools/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline (the 4 `henry.business.*` events firing) · deferred items (native team-management → V3-87; KYC verification → V3-24) · pass-closure assertion.

## Self-verification
- [ ] S1: `businesses`/`business_members`/`business_invitations` schema + default-deny RLS + `business_public_profile` view + `accept_business_invitation` RPC landed; `pnpm test:rls` proves isolation.
- [ ] S2: acting-context layer extends `@henryco/auth`; switch route is `requireSensitiveAction`-guarded and re-verifies membership server-side.
- [ ] S3: public business profile renders through `henryDomain('marketplace', ...)` with `PublicSiteShell` + Fraunces; pending/suspended 404s for anonymous.
- [ ] S4: team management (invite/accept/remove/role) + aggregated insights (empty/loading/no-data truthful) + context switcher; `writeAuditLog` on every roster/context mutation.
- [ ] S5: 4 `henry.business.*` telemetry events added to `HenryEventNames` and firing.
- [ ] Brand = Henry Onyx via `@henryco/config`; zero hardcoded domains; zero hardcoded strings; `surface:business` namespace in 12 locales.
- [ ] CI + RLS + e2e + i18n + real-browser light/dark/mobile/desktop/CLS≈0/contrast all green.
- [ ] `.codex-temp/v3-57-product-business-profiles-and-tools/report.md` written with all 9 sections.
