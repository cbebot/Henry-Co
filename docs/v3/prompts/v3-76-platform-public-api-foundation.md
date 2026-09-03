# V3-76 — Platform/API: Public API Foundation

**Pass ID:** V3-76  ·  **Phase:** I (Platform/API + Global/Mobile + Observability + Closure)  ·  **Pillar:** P11 (Platform & API Layer)
**Dependencies:** V3-02 (auth reliability)  ·  **Effort:** L  ·  **Parallel-safe:** N
**Owner gate:** none  ·  **Risk class:** Identity

---

## Role

You are the V3 Platform engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass ships the **public API foundation** that every later Phase-I surface plugs into: a versioned URL scheme, an API-key model with scoped permissions, per-key + per-IP rate limiting, an authenticating/authorizing gateway middleware, a partner-facing key-management UI, and an immutable per-call audit log. You build the *spine* — not the endpoints. The line you must not cross: this pass exposes **only public, partner-authorized data through scoped keys**, never a user session, never proprietary scoring or ranking internals, and never a money-moving write. Endpoint surfaces are V3-77/78/79/80; you make them possible and safe.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/76-platform-public-api-foundation` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

Henry Onyx today has **no public API surface**. Every route under `apps/*/app/api/**` is a first-party, cookie-session route consumed by our own web apps (e.g. `apps/account/app/api/notifications/*`, `apps/marketplace/app/api/*`). There is no key-based authentication, no scope model, no rate limiter shared across apps, and no per-call audit trail for third-party callers. The closest existing primitives are first-party only:

- **Auth** — `@henryco/auth` (`packages/auth/src/`) provides cookie-session viewers (`server/`, `viewer.ts`), the V3-02 sensitive-action guard (`server/sensitive-action-guard.ts`, `requireSensitiveAction`) and its rate limiter (`server/sensitive-action-rate-limit.ts`). None of these authenticate a *machine* caller.
- **Idempotency** — `account_idempotency_keys` (`apps/hub/supabase/migrations/20260407193000_idempotency_and_nonce_scope.sql`): `(user_id, route_key, idempotency_key)` unique with a cached `response_payload jsonb`. This is the proven replay-safe write pattern to generalize for partner callers.
- **Signed-webhook receipts** — `account_webhook_receipts` (`apps/hub/supabase/migrations/20260407190000_account_webhook_receipts.sql`): `event_id unique`, `signature_valid`, `payload_hash`. This is the verification-and-dedupe shape V3-77/78/79 callbacks inherit.
- **Telemetry** — `@henryco/observability` (`packages/observability/src/`): `persistEvent`/`emitEvent` dual-write structured events into the `henry_events` sink; `audit-log.ts` records sensitive mutations. Event naming is `henry.<domain>.<noun>.<verb>` (`packages/observability/src/events.ts`, `HenryEventName`).
- **Health** — uniform `/api/health` in all 10 apps via `@henryco/observability/health` (`buildHealthResponse`, `healthStatusCode`).
- **Domains** — `@henryco/config` (`packages/config/domain.ts`, `company.ts`) exposes `henryDomain()`, `henryWebRoot()`, `henrySubdomain()`, `getAccountUrl()`, `getHubUrl()`, `getHqUrl()`, `getStaffHqUrl()`. No `developers.*` / `api.*` host exists yet.

The gap this pass closes: stand up a **gateway package** + **key/scope schema** + **rate-limit + audit infrastructure** + **partner key-management UI** so that V3-77 (seller), V3-78 (logistics), V3-79 (booking), V3-80 (business-account), and V3-81 (webhook delivery) become thin, scope-gated endpoint passes rather than each re-solving auth, limiting, versioning, and logging.

## Mandatory scope

### S1 — Schema: keys, scopes, call log, rate-limit counters

New migration `apps/hub/supabase/migrations/<ts>_platform_public_api_foundation.sql`. (Migrations live per-app; the platform/API schema is owned by the hub app, which already hosts cross-division infra such as KYC, trust scoring, and idempotency.)

```sql
-- A "partner" is the holder of one or more API keys. A partner is bound to an
-- owning org/user; partner provisioning detail (KYC, contracts) is V3-67 scope.
create table if not exists public.api_partners (
  id              uuid primary key default gen_random_uuid(),
  display_name    text not null,
  owner_user_id   uuid not null references auth.users(id) on delete cascade,
  status          text not null default 'active' check (status in ('active','suspended')),
  created_at      timestamptz not null default timezone('utc', now()),
  updated_at      timestamptz not null default timezone('utc', now())
);

create table if not exists public.api_scopes (
  scope        text primary key,           -- e.g. 'read:products'
  description  text not null,
  category     text not null,              -- 'seller' | 'logistics' | 'booking' | 'business' | 'core'
  created_at   timestamptz not null default timezone('utc', now())
);

create table if not exists public.api_keys (
  id                    uuid primary key default gen_random_uuid(),
  partner_id            uuid not null references public.api_partners(id) on delete cascade,
  key_prefix            text not null,      -- first 8 chars, shown in UI for identification
  key_hash              text not null unique, -- SHA-256 of the full secret; raw secret NEVER stored
  name                  text not null,
  scopes                text[] not null default '{}',
  environment           text not null default 'live' check (environment in ('live','sandbox')),
  rate_limit_per_minute integer not null default 60,
  rate_limit_per_day    integer not null default 10000,
  expires_at            timestamptz,
  last_used_at          timestamptz,
  created_by            uuid not null references auth.users(id),
  revoked_at            timestamptz,
  status                text not null default 'active' check (status in ('active','revoked')),
  created_at            timestamptz not null default timezone('utc', now())
);
create index if not exists api_keys_partner_idx on public.api_keys(partner_id);
create index if not exists api_keys_hash_idx on public.api_keys(key_hash);

-- Immutable per-call audit trail (ANTI-CLONE Principle 12). Append-only.
create table if not exists public.api_call_log (
  id             uuid primary key default gen_random_uuid(),
  api_key_id     uuid references public.api_keys(id) on delete set null,
  partner_id     uuid references public.api_partners(id) on delete set null,
  method         text not null,
  path           text not null,
  api_version    text not null,
  scope_required text,
  status_code    integer not null,
  correlation_id text not null,
  ip_hash        text,                      -- SHA-256(ip + salt); raw IP never stored
  latency_ms     integer,
  created_at     timestamptz not null default timezone('utc', now())
);
create index if not exists api_call_log_key_time_idx on public.api_call_log(api_key_id, created_at desc);
create index if not exists api_call_log_partner_time_idx on public.api_call_log(partner_id, created_at desc);

-- Per-key replay safety for partner writes. Generalizes account_idempotency_keys.
create table if not exists public.api_idempotency_keys (
  id               uuid primary key default gen_random_uuid(),
  api_key_id       uuid not null references public.api_keys(id) on delete cascade,
  route_key        text not null,
  idempotency_key  text not null,
  response_payload jsonb not null default '{}'::jsonb,
  status_code      integer not null,
  created_at       timestamptz not null default timezone('utc', now()),
  unique (api_key_id, route_key, idempotency_key)
);
```

**RLS (enable on every table; deny-by-default):**

```sql
alter table public.api_partners enable row level security;
alter table public.api_scopes enable row level security;
alter table public.api_keys enable row level security;
alter table public.api_call_log enable row level security;
alter table public.api_idempotency_keys enable row level security;

-- api_scopes: world-readable catalog (auth required), no client writes.
create policy api_scopes_read on public.api_scopes for select to authenticated using (true);

-- api_partners / api_keys: a user may see/manage only partners they own.
create policy api_partners_own on public.api_partners for select to authenticated
  using (owner_user_id = auth.uid());
create policy api_keys_own_read on public.api_keys for select to authenticated
  using (exists (select 1 from public.api_partners p
    where p.id = api_keys.partner_id and p.owner_user_id = auth.uid()));
-- INSERT/UPDATE of keys, all call-log writes, and idempotency writes happen ONLY
-- through the service-role gateway/server routes — no anon/authenticated write policy.
-- api_call_log + api_idempotency_keys carry NO select policy for end users; owner
-- read-back is via a service-role-backed server route in S5.
```

### S2 — Core scope catalog (seeded)

Seed the foundational scopes in the migration. Sibling passes add their own scopes through additive migrations (V3-77 seller, V3-78 logistics, V3-79 booking, V3-80 business).

```sql
insert into public.api_scopes (scope, description, category) values
  ('read:profile',   'Read the partner''s own profile metadata.', 'core'),
  ('read:products',  'Read public catalog data for the partner''s own listings.', 'seller'),
  ('write:products', 'Create and update the partner''s own listings.', 'seller'),
  ('read:orders',    'Read orders belonging to the partner.', 'seller'),
  ('read:inventory', 'Read inventory levels for the partner''s own listings.', 'seller')
on conflict (scope) do nothing;
```

Scopes are deny-by-default: a key with no scope grants nothing. Granting `write:*` does not imply `read:*` — each is explicit.

### S3 — `@henryco/api-gateway` package

New package `packages/api-gateway/` (`package.json` name `@henryco/api-gateway`, follows the `@henryco/observability` package shape). It exports a single composable handler wrapper used by every public endpoint:

```ts
// packages/api-gateway/src/index.ts
export interface ApiContext {
  partnerId: string;
  apiKeyId: string;
  scopes: string[];
  environment: 'live' | 'sandbox';
  correlationId: string;
  apiVersion: string;          // 'v1'
}

export interface GatewayOptions {
  version: 'v1';
  scope: string;               // required scope for this route
  /** mutating routes must declare true → idempotency-key enforced */
  mutating?: boolean;
}

export type GatewayHandler = (req: Request, ctx: ApiContext) => Promise<Response>;

/** Wraps a route handler with: key auth → scope check → rate limit → idempotency
 *  (mutating) → call log → standardized error envelope. */
export function withApiGateway(opts: GatewayOptions, handler: GatewayHandler):
  (req: Request) => Promise<Response>;
```

The wrapper, in order, must:
1. **Authenticate** — read `Authorization: Bearer <key>`, compute `SHA-256`, look up `api_keys.key_hash` where `status = 'active'` and (`expires_at is null or expires_at > now()`). Update `last_used_at` (best-effort, non-blocking). Failure → `401`.
2. **Authorize** — require `opts.scope ∈ key.scopes`. Failure → `403` + telemetry `henry.api.scope.violated`.
3. **Rate-limit** — per-key sliding windows (`rate_limit_per_minute`, `rate_limit_per_day`) AND a per-IP-hash window. Use the existing in-process limiter shape from `packages/notifications/rate-limit.ts` as the v1 implementation, with a documented seam (`RateLimitStore` interface) for a Redis/Upstash-backed store as a deferred hardening item — serverless per-instance buckets are acceptable for the foundation, mirroring the NOT-01 posture. Exceed → `429` + `Retry-After` + telemetry `henry.api.rate_limit.exceeded`.
4. **Idempotency** (when `mutating`) — require `Idempotency-Key` header; on hit in `api_idempotency_keys`, replay the stored `response_payload` + `status_code`; on miss, execute and persist. Missing header on a mutating route → `400`.
5. **Invoke** the handler with `ApiContext`.
6. **Log** — append one `api_call_log` row (with `ip_hash`, `correlation_id`, `latency_ms`) and emit `henry.api.call` via `@henryco/observability`.

**Error envelope** (every non-2xx, RFC-7807-shaped):
```json
{ "error": { "type": "scope_violation", "message": "Missing required scope: write:products",
  "correlation_id": "<uuid>", "api_version": "v1" } }
```
Response headers on every call: `X-API-Version: v1`, `X-Correlation-Id: <uuid>`. Error `message` strings are operator-facing developer text, English-only, exempt from the i18n surface gate (these are API protocol responses, not rendered UI) — record them in `packages/i18n/exempt.json` with the rationale.

### S4 — Versioning scheme

- All public routes live under `/api/v1/...`. The version segment is mandatory and parsed by the gateway into `ctx.apiVersion`.
- **Deprecation policy** (document in `docs/api/VERSIONING.md`): a breaking change requires a new major version; the prior version is supported a **minimum of 6 months** after a deprecation announcement. Sunset is signalled with RFC-8594 headers: `Deprecation: true` and `Sunset: <http-date>` on responses from a deprecated version.
- The public API host is config-derived, never hardcoded: add a `getApiUrl(path)` helper to `@henryco/config` resolving `api.${NEXT_PUBLIC_BASE_DOMAIN}` (consistent with `henrySubdomain`). The literal `henrycogroup.com` must not appear. The host is *introduced* here as a helper; DNS/Vercel routing of the public host and the developer docs portal (`developers.*`) are V3-83 scope.

### S5 — Partner key-management UI

`apps/account/app/(account)/developer/api-keys/page.tsx` plus a `+page` server route, gated to users who own at least one `api_partners` row:
- **List** keys for the partner: `name`, `key_prefix`, scopes, environment, `last_used_at`, `status`, `created_at`. Never render the raw secret after creation.
- **Create** a key: name + scope multi-select (from `api_scopes`) + environment. The server route generates a cryptographically random secret, stores only `key_hash` + `key_prefix`, and returns the **full secret exactly once** in the create response. The UI shows a copy-once panel with an explicit "you will not see this again" warning.
- **Revoke** a key: sets `status = 'revoked'`, `revoked_at = now()`; immediately effective at the gateway.
- **Usage panel**: last-7-day call count + 429 count + last error, read from `api_call_log` via a service-role-backed server route (RLS denies direct end-user select on the log).
- All write actions (create/revoke) go through server routes guarded by `requireSensitiveAction` from `@henryco/auth` — issuing or revoking a credential is a sensitive identity action.

### S6 — Telemetry

Declare and emit via `@henryco/observability` (`henry.<domain>.<noun>.<verb>`):
- `henry.api.call` — every gateway invocation (path, version, status, partner).
- `henry.api.rate_limit.exceeded`
- `henry.api.scope.violated`
- `henry.api.key.created`
- `henry.api.key.revoked`

Add these names to the `HenryEventName` union in `packages/observability/src/events.ts`.

## Out of scope

- Concrete domain endpoints — seller (V3-77), logistics (V3-78), booking (V3-79), business-account (V3-80).
- The standalone webhook **delivery** service — versioned/retryable/observable outbound delivery is V3-81. This pass defines the *inbound* signed-callback verification shape (reuse `account_webhook_receipts`) only as inheritance for siblings; it does not build the delivery worker.
- Developer docs portal + sandbox UI + `developers.*` host (V3-83).
- Analytics/data exports over the API (V3-82).
- Partner provisioning, KYC, and contracts (V3-67); this pass assumes an `api_partners` row already exists or is created by an owner/staff path that V3-67 formalizes.
- Per-market payment routing or any money-moving write (Phase C; never exposed via public API).

## Dependencies

**Upstream:** V3-02 (auth reliability + `requireSensitiveAction`). **This pass BLOCKS:** V3-77, V3-78, V3-79, V3-80 (all consume `withApiGateway`, the scope model, and the versioning scheme), V3-81 (webhook delivery, reuses key/partner identity), V3-82 (analytics exports, scope-gated), and V3-83 (developer docs, documents this surface).

## Inheritance

- `@henryco/auth` — `requireSensitiveAction` (key create/revoke), session viewers for the UI gate.
- `@henryco/observability` — `persistEvent`/`emitEvent`/`HenryEventName`, `audit-log.ts`, `health`.
- `@henryco/config` — `henryDomain`/`henrySubdomain`/`getAccountUrl`; add `getApiUrl`.
- Schema precedents — `account_idempotency_keys` (generalized into `api_idempotency_keys`), `account_webhook_receipts` (signed-callback shape for siblings).
- Rate-limit shape — `packages/notifications/rate-limit.ts` sliding-window pattern.
- `@henryco/i18n` — `exempt.json` for protocol error strings.

## Implementation requirements

### Files
- `apps/hub/supabase/migrations/<ts>_platform_public_api_foundation.sql` (S1, S2).
- `packages/api-gateway/{package.json,tsconfig.json,src/index.ts,src/auth.ts,src/rate-limit.ts,src/idempotency.ts,src/errors.ts,src/log.ts}` (S3).
- `packages/config/` — add `getApiUrl` to `urls.ts`/`company.ts` and export it from `index.ts` (S4).
- `packages/observability/src/events.ts` — extend `HenryEventName` (S6).
- `apps/account/app/(account)/developer/api-keys/page.tsx` + server route(s) under `apps/account/app/api/developer/api-keys/` (S5).
- `docs/api/VERSIONING.md` (S4).
- `packages/i18n/exempt.json` — register protocol error strings.

### Trust / safety / compliance
- **Secrets:** raw API key returned exactly once at creation; only `key_hash` (SHA-256) + `key_prefix` persisted. Never log the raw key. Never store raw client IP — only `ip_hash`.
- **RLS:** every new table has RLS enabled and deny-by-default; key/log/idempotency writes are service-role only.
- **Scopes** are deny-by-default and enforced at the gateway per route, not per app.
- **ANTI-CLONE Principle 2:** the API returns only public, partner-owned data. Proprietary scoring, ranking weights, recommendation signals, internal risk/trust scores, and other users' data are NEVER exposed — not even derived or aggregated.
- **Audit:** every call is appended to `api_call_log`; key create/revoke also recorded via `@henryco/observability/audit-log`. The log table is append-only (no update/delete policy).
- **Idempotency** mandatory on every mutating route via `Idempotency-Key`.

### Mobile + desktop parity
The API is headless — no mobile/web rendering. The **key-management UI in `apps/account`** must meet standard parity: light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed (`pnpm a11y:contrast`).

### i18n
The key-management UI renders user-facing copy through `@henryco/i18n` under a new namespace **`surface:developer`** (labels, scope descriptions shown to users, status, errors — all translated across the 12 locales). API protocol error envelopes are operator/developer text and are exempted in `packages/i18n/exempt.json` with rationale (not rendered UI).

### Brand & design system
The developer UI uses the locked account chrome and design-system tokens (`--site-*`/`--accent`, Fraunces for any editorial heading) — no ad-hoc hex. All brand strings come from `@henryco/config` (`COMPANY.group.name = "Henry Onyx"`). Any developer-facing copy referring to the company uses **Henry Onyx**; legal/footer entity is **Henry Onyx Limited**. Zero hardcoded domains — the API host comes from `getApiUrl`.

## Validation gates
1. **CI:** `pnpm -w typecheck`, `pnpm -w lint`, `pnpm -w test`, `pnpm -w build` all green.
2. **Gateway unit tests** (`packages/api-gateway/src/__tests__/`, ~20 cases): 401 unknown/expired/revoked key; 403 missing scope; 429 per-minute and per-day and per-IP exhaustion with `Retry-After`; idempotency replay returns identical body+status; correlation-id + version headers always present; error envelope shape.
3. **RLS verification:** authenticated user A cannot read user B's keys, partners, or call log; direct end-user select on `api_call_log`/`api_idempotency_keys` denied; scope catalog readable by any authenticated user.
4. **Schema:** migration applies cleanly on a Supabase branch; `pnpm db:lint`/advisor shows no new RLS-disabled or unindexed-FK warnings.
5. **UI e2e:** create-key shows secret once → reload hides it → revoke makes a sample gateway call return 401; usage panel renders counts.
6. **UI real-browser:** light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` passes.
7. **Brand/i18n gates:** hardcoded-string scan green (UI strings in `surface:developer`, protocol strings in `exempt.json`); no `henrycogroup.com` literal introduced.

## Deployment gate
All validation gates green. Owner review required (Identity-risk: this opens a credentialed external surface). Ship behind a feature flag with the gateway live but no public endpoints mounted (siblings mount theirs). A **48-hour soak** in sandbox environment before any `live`-environment key is provisioned. No force-push; branch `v3/76-platform-public-api-foundation` → PR → CI green → squash-merge.

## Final report contract
`.codex-temp/v3-76-platform-public-api-foundation/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items (named: Redis-backed `RateLimitStore`, public-host DNS/Vercel routing → V3-83) · pass-closure assertion.

## Self-verification
- [ ] S1 schema applied with RLS enabled + deny-by-default on all five tables; FKs indexed.
- [ ] S2 core scope catalog seeded; scopes deny-by-default; no implicit grants.
- [ ] S3 `@henryco/api-gateway` enforces auth → scope → rate-limit → idempotency → call-log → error-envelope, in that order, with version + correlation headers.
- [ ] S4 `/api/v1/` versioning live; `getApiUrl` added (no hardcoded host); RFC-8594 sunset documented in `docs/api/VERSIONING.md`.
- [ ] S5 partner key-management UI: create-once secret, revoke, usage panel; writes guarded by `requireSensitiveAction`.
- [ ] S6 five telemetry events emit via `@henryco/observability` and are added to `HenryEventName`.
- [ ] Raw secret + raw IP never persisted; only hashes.
- [ ] ANTI-CLONE Principle 2 honored: no proprietary scoring/ranking/other-user data exposed.
- [ ] UI copy in `surface:developer` (12 locales); protocol strings exempted with rationale.
- [ ] Brand strings from `@henryco/config` (Henry Onyx / Henry Onyx Limited); zero hardcoded domains; design-system tokens only; light+dark, mobile+desktop, CLS≈0, contrast not regressed.
- [ ] Report written; hand-off to V3-77/78/79/80/81/83 stated.
