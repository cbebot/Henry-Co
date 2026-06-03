# V3-80 — Platform/API: Business-Account API

**Pass ID:** V3-80  ·  **Phase:** I (Platform/API + Global/Mobile + Observability + Closure)  ·  **Pillar:** P11 (Platform & API Layer), P8 (Partner & Enterprise)
**Dependencies:** V3-76, V3-75  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** Identity

---

## Role
You are the V3 Platform/API engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass exposes the company-administration surface — multi-user business accounts, team roles, and business analytics — as a versioned, scope-gated public API on top of the V3-76 gateway. It is the programmatic mirror of the V3-75 in-app company-admin console: same RLS, same permission matrix, same audit trail, no new privileges. The line it must not cross: this API NEVER grants an API key more authority than the human member it acts for, NEVER returns proprietary scoring/ranking internals (only the partner's own business data), and NEVER mutates money — invoicing and payouts stay in their owning passes.

## Project
| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/80-platform-business-account-api` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
The in-app company-administration layer lands in V3-57 (business profiles, `businesses` + `business_members`) and is hardened in V3-75 (per-resource permission matrix, single-owner + multi-admin model, role-change audit, bulk invoicing). The public-API substrate lands in V3-76: the `api_keys` / `api_scopes` tables, the `packages/api-gateway` middleware (SHA-256 key verification, per-key rate limiting, scope-per-route enforcement, `api_call_log` write, versioned/correlation-ID error envelopes), and the partner key-management UI at `apps/account/app/(account)/api-keys/page.tsx`. Both are QUEUED, not yet on `main` — this pass assumes their contracts as specified in `docs/v3/prompts/v3-76-*.md` and `docs/v3/prompts/v3-75-*.md` and must not re-implement them.

The gap V3-80 closes: today a business owner can only manage members, roles, and read company analytics through the web console. There is no machine surface, so partners cannot provision team members from their own HR system, sync role changes from their IDP, or pull company analytics into their BI stack. This pass adds the `/api/v1/business*` endpoint family — read/update the business, list/add/remove members, read company analytics, read company invoices — each gated by a dedicated scope, each acting strictly within the calling key's effective permission set, each audited identically to the console path.

## Mandatory scope

### S1 — Endpoint family `/api/v1/business*`
Implement these handlers under `apps/account/app/api/v1/business/` (App Router route handlers), every one wrapped by the V3-76 gateway middleware (`withApiGateway`) so key verification, rate limiting, scope checks, and `api_call_log` writes happen before the handler body runs:

- `GET  /api/v1/business` → the calling key's business profile (id, legal name, display name, country, status, member count). Scope: `business:read`.
- `PATCH /api/v1/business` → update mutable profile fields (display name, support contact, locale default, billing email). Scope: `business:write`. Idempotency-Key header honored.
- `GET  /api/v1/business/members` → paginated member list (`user_id`, role, status, invited_at, joined_at — never email/phone unless `business:members:read_pii` scope is present, which defaults OFF). Scope: `business:members:read`.
- `POST /api/v1/business/members` → invite/add a member by email + role. Scope: `business:members:manage`. Owner-equivalent role required (see S3). Idempotency-Key header mandatory; replays return the original 201 body, never a duplicate invite.
- `DELETE /api/v1/business/members/{memberId}` → revoke a member. Scope: `business:members:manage`. Cannot remove the sole owner (return `409 last_owner`).
- `GET  /api/v1/business/analytics` → company analytics rollup (orders/bookings/revenue counts and totals, by-division, by-period; revenue in integer minor units). Scope: `business:analytics:read`. Read-only projection of the V3-57/V3-75 analytics views — NEVER includes proprietary scoring, fraud signals, or other businesses' data.
- `GET  /api/v1/business/invoices` → the business's own invoices (id, number, period, status, total in minor units, currency, signed download URL with short TTL). Scope: `business:invoices:read`. Reads the V3-18/V3-75 invoice records read-only — this endpoint creates/mutates nothing.

Every response uses the V3-76 standard envelope (`{ data, meta: { version, correlationId, requestId } }` on success; `{ error: { code, message, correlationId } }` on failure) with `X-API-Version` + `X-Request-Id` headers. List endpoints use cursor pagination (`?cursor=&limit=` capped at 100, `meta.nextCursor`).

### S2 — Scope catalog extension
Seed these rows into `api_scopes` (V3-76 table) via a migration, each with `category = 'business'`:

```sql
INSERT INTO api_scopes (scope, description, category) VALUES
  ('business:read',              'Read the business profile',                          'business'),
  ('business:write',             'Update mutable business profile fields',             'business'),
  ('business:members:read',      'List business members (no PII)',                     'business'),
  ('business:members:read_pii',  'Include member email/phone in member listings',      'business'),
  ('business:members:manage',    'Invite and revoke business members',                 'business'),
  ('business:analytics:read',    'Read company analytics rollups',                     'business'),
  ('business:invoices:read',     'Read company invoices and download URLs',            'business')
ON CONFLICT (scope) DO NOTHING;
```

The gateway already enforces "key must hold the route's required scope" — this pass only declares the scopes and binds each to its route via the gateway's route→scope manifest (`packages/api-gateway/src/scope-map.ts` per V3-76). `business:members:read_pii` is an explicit, separately-grantable, audit-logged scope; it is OFF by default and the key-management UI must require an extra confirmation to attach it.

### S3 — Effective-permission resolution (the identity invariant)
An API key is created by a human member (V3-76 `api_keys.created_by`). This pass adds a resolver that intersects the key's scopes with the **current** role of `created_by` in the target business, computed per request — never cached across requests:

```ts
// packages/api-gateway/src/business-permissions.ts
export interface BusinessApiContext {
  businessId: string;
  actorUserId: string;                       // api_keys.created_by
  actorRole: 'owner' | 'admin' | 'member';   // resolved live from business_members
  grantedScopes: ReadonlySet<string>;        // from api_keys.scopes
}

/**
 * Returns the effective scopes = key.scopes ∩ (scopes the actor's CURRENT role is allowed to use).
 * If the actor was demoted or removed since the key was minted, the key loses that authority
 * on the very next request. member-management scopes resolve to ∅ for non-owner/admin actors.
 */
export function resolveEffectiveBusinessScopes(ctx: BusinessApiContext): ReadonlySet<string>;
```

`business:members:manage` and `business:write` require `actorRole ∈ {owner, admin}`; adding/removing an **owner-equivalent** member requires `actorRole === 'owner'`. If the actor no longer belongs to the business, every business scope resolves to empty and the handler returns `403 actor_no_longer_member`. This is the load-bearing rule: the key is a delegate of a person, never an independent principal.

### S4 — RLS + data access
All reads/writes go through the **calling member's** authority, not a service-role bypass. The gateway resolves the Supabase client bound to `created_by`; `business_members` / `businesses` / invoice / analytics RLS (authored in V3-57/V3-75/V3-18) does the gating. This pass adds NO new tables except the scope seed in S2 and (if V3-76 did not already) an `api_business_bindings` view that maps `api_keys.id → business_id` so a key is unambiguously scoped to exactly one business. Add an RLS-verification test proving a key minted for business A cannot read business B's members, analytics, or invoices.

### S5 — Telemetry + audit
Add the canonical events to the `HenryEventName` union in `packages/observability/src/events.ts` and the taxonomy doc `docs/event-taxonomy.md`:
- `henry.api.business.profile_read`
- `henry.api.business.profile_updated`
- `henry.api.business.member_added`
- `henry.api.business.member_removed`
- `henry.api.business.analytics_read`
- `henry.api.business.invoices_read`

Every mutating call (`PATCH /business`, `POST /members`, `DELETE /members/{id}`) writes an audit row via `writeAuditLog` from `@henryco/observability/audit-log` with `entityType = 'business'`, the `actorUserId` resolving through the caller's authenticated client, and `division` attribution. Attaching `business:members:read_pii` to a key is itself an audited event at key-mint time (owned by V3-76's UI, but this pass specifies the requirement).

### S6 — OpenAPI contribution
Emit an OpenAPI 3.1 fragment for this endpoint family at `docs/api/openapi/business-account.yaml` (consumed by V3-83 docs site). Document every endpoint, scope, error code (`last_owner`, `actor_no_longer_member`, `actor_not_admin`, `rate_limited`, `scope_missing`), and the cursor-pagination shape. Provide example clients in `docs/api/examples/business-account-api/` in TypeScript, Python, and Ruby (parity with the V3-77 seller-API convention).

## Out of scope
- API gateway, `api_keys`/`api_scopes` tables, rate limiting, key-management UI — V3-76.
- The in-app company-admin console, the permission matrix authoring, bulk-invoice generation — V3-75; this API only reads/acts on what V3-75 built.
- Seller endpoints (V3-77), logistics endpoints (V3-78), booking endpoints (V3-79).
- Webhook delivery for business events — V3-81 (this pass declares no webhook events; if business webhooks are wanted, they ride V3-81's subscription model).
- The developer-docs site itself — V3-83 (this pass ships the OpenAPI fragment + examples it consumes).
- Any payment/invoice mutation — invoicing stays in V3-18/V3-75; payouts in V3-69.

## Dependencies
**Depends on:** V3-76 (gateway, scopes table, key UI, error envelope, scope-map manifest), V3-75 (`businesses`, `business_members`, permission matrix, invoice records, analytics views). **Blocks:** V3-83 developer-docs site consumes this pass's OpenAPI fragment + example clients; V3-83's `Deps` includes V3-80 for exactly this reason. Enterprise partners' programmatic team provisioning depends on this pass.

## Inheritance
- `packages/api-gateway` (`withApiGateway`, scope-map, error envelope, `api_call_log`) — V3-76.
- `@henryco/observability` — `writeAuditLog` (audit-log.ts), `emitEvent` + `HenryEventName` (events.ts), `createRedactor`/`defaultRedactor` (redaction.ts) so member PII never reaches logs.
- `@henryco/config` — `henrySubdomain`, `henryDomain`, `getAccountUrl` for any URL; `COMPANY` for legal-entity strings on invoice metadata.
- V3-75 `businesses` / `business_members` / permission matrix / invoice records / analytics views.

## Implementation requirements
### Files
- `apps/account/app/api/v1/business/route.ts` (GET, PATCH)
- `apps/account/app/api/v1/business/members/route.ts` (GET, POST)
- `apps/account/app/api/v1/business/members/[memberId]/route.ts` (DELETE)
- `apps/account/app/api/v1/business/analytics/route.ts` (GET)
- `apps/account/app/api/v1/business/invoices/route.ts` (GET)
- `packages/api-gateway/src/business-permissions.ts` (S3 resolver) + extend `scope-map.ts`
- `supabase/migrations/<ts>_v3_80_business_api_scopes.sql` (S2 seed + `api_business_bindings` view + RLS test fixtures)
- `packages/observability/src/events.ts` (6 new event names) + `docs/event-taxonomy.md`
- `docs/api/openapi/business-account.yaml` + `docs/api/examples/business-account-api/{typescript,python,ruby}/`

### Trust / safety / compliance
- **Identity invariant (S3):** a key never exceeds its minting member's live role; demotion/removal revokes authority on the next request.
- Scopes enforced per-route by the gateway; `business:members:read_pii` separately grantable, OFF by default, audited at attach time.
- All access via the calling member's RLS context — no service-role bypass in handlers.
- Idempotency-Key mandatory on `POST /members` (and honored on `PATCH /business`); replays are safe.
- Member PII redacted from all logs/telemetry via `createRedactor`; analytics/invoices return the partner's own data only — never proprietary scoring or another business's data.
- Audit row on every mutating call via `writeAuditLog`.
- Sensitive-action posture: programmatic member-management is gated by scope + live owner/admin role; the human-console equivalents already carry `requireSensitiveAction` (V3-02). No re-auth prompt is possible on a headless API call, so member-management scopes are deliberately high-privilege and must be issued sparingly — document this in the OpenAPI security notes.

### Mobile + desktop parity
N/A for the API surface itself (headless). The example clients are runtime-agnostic. No app UI ships in this pass — the key-management UI is V3-76's; this pass only declares the new scopes that UI will render.

### i18n
API response **bodies** are machine-facing and English-only by contract (documented in the OpenAPI `info.description`); they are NOT user-facing surfaces and are correctly exempt — record the exemption in `packages/i18n/exempt.json` with a comment pointing at this pass. Any string that DOES reach an end user (e.g. the invitation email triggered by `POST /members`) flows through `@henryco/i18n` namespace `surface:business` in the locale of the invited member, never hardcoded. Error `code` values are stable machine tokens (not translated); human-readable `message` strings are English in the API body but any UI rendering of them resolves through `surface:business`.

### Brand & design system
No user-facing UI renders in this pass. Where the API returns brand/legal strings (e.g. invoice metadata, the business's legal entity), they come from `@henryco/config` (`COMPANY.group.legalName` → "Henry Onyx Limited", division labels → "Henry Onyx <Division>") — never hardcoded, never the retired "Henry & Co." The invitation email (i18n-sourced) renders the Henry Onyx brand via the shared email layer. Zero hardcoded domains: any URL (download links, invite links) is built with `henrySubdomain`/`henryDomain`/`getAccountUrl`.

## Validation gates
1. **CI:** `pnpm -w typecheck`, `pnpm -w lint`, `pnpm -w test`, `pnpm -w build` green.
2. **Scope enforcement tests** (~8): each endpoint rejects a key lacking its scope (`403 scope_missing`); `business:members:read_pii` absent → PII fields omitted, present → included.
3. **Identity-invariant tests** (~5, the load-bearing suite): key created by an admin can add members; after the admin is demoted to `member`, the same key's next `POST /members` returns `403 actor_not_admin`; after the actor is removed, every call returns `403 actor_no_longer_member`; sole-owner removal returns `409 last_owner`.
4. **RLS isolation test:** a key bound to business A cannot read B's members/analytics/invoices (S4).
5. **Idempotency test:** replayed `POST /members` with the same Idempotency-Key returns the original 201, creates exactly one invite, writes exactly one audit row.
6. **Envelope/versioning test:** every response carries `X-API-Version`, `X-Request-Id`, `meta.correlationId`; errors use the V3-76 error shape.
7. **OpenAPI validity:** `business-account.yaml` passes a 3.1 linter; the 3 example clients run green against the sandbox for every endpoint.
8. **Audit-coverage test:** every mutating call leaves exactly one `audit_log` row with the correct `actorUserId`, `entityType`, and `division`.

## Deployment gate
All gates green; V3-76 and V3-75 merged to `main` first (hard deps). Public sandbox exercised by all three example clients; at least one enterprise partner runs the identity-invariant flow end-to-end in sandbox. 14-day soak on the sandbox before the production scope rows are enabled. No owner sign-off required (no D-gate), but Identity risk class means the V3-94 closure pass re-runs the identity-invariant suite.

## Final report contract
`.codex-temp/v3-80-platform-business-account-api/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion).

## Self-verification
- [ ] All 7 `/api/v1/business*` endpoints implemented, gateway-wrapped, cursor-paginated where applicable (S1).
- [ ] 7 business scopes seeded; `business:members:read_pii` OFF-by-default and separately granted (S2).
- [ ] Effective-permission resolver intersects key scopes with the actor's LIVE role every request; demotion/removal revokes authority next call (S3).
- [ ] All access via the calling member's RLS context; cross-business isolation test passes; no service-role bypass (S4).
- [ ] 6 new `henry.api.business.*` telemetry events added to the typed union + taxonomy doc; audit row on every mutating call (S5).
- [ ] OpenAPI 3.1 fragment + TS/Python/Ruby example clients shipped and green (S6).
- [ ] Zero hardcoded domains/strings; brand/legal strings from `@henryco/config` ("Henry Onyx" / "Henry Onyx Limited"); invite email i18n via `surface:business`.
- [ ] Idempotency honored on member-add + profile-update; replays safe.
- [ ] Report written at the path above.
