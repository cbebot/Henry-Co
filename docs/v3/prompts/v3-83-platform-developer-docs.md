# V3-83 — Platform/API: Developer Docs Site

**Pass ID:** V3-83  ·  **Phase:** I (Platform/API + Global/Mobile + Observability + Closure)  ·  **Pillar:** P11 (Platform & API Layer)
**Dependencies:** V3-77, V3-78, V3-79, V3-80  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role
You are the V3 Platform/API engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass ships the one public developer-documentation site for the Henry Onyx platform APIs: auto-generated API reference from the OpenAPI fragments each API pass already produced, hand-written guides (getting-started/auth/webhooks/errors/rate-limits), a changelog, an isolated sandbox playground, and a live per-service status indicator. The line it must not cross: it **documents and demonstrates** the APIs — it defines no endpoints and changes no API behavior (those belong to V3-76..V3-82); the sandbox is strictly isolated from production; and it **never** renders a production secret, never shows a key value except the once-only reveal at creation, and never hardcodes a domain or a user-facing string.

## Project
| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/83-platform-developer-docs` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
There is no developer-facing documentation surface for the platform APIs today. The inputs this pass consumes are real and produced by sibling passes:

- **V3-76 (public API foundation)** ships the gateway (`packages/api-gateway`, `withApiGateway`), `api_keys`/`api_scopes`, the URL-versioning scheme (`/api/v1/...`, `X-API-Version`, RFC-8594 `X-Sunset`), the standardized error envelope (code + correlation id), and the partner key-management UI at `apps/account/app/(account)/api-keys/page.tsx`. This pass surfaces that key-management flow in developer-friendly form and documents the error/versioning contract — it does not re-implement key issuance.
- **V3-77/78/79/80** each ship their API endpoints **and** an OpenAPI fragment plus example clients in TypeScript/Python/Ruby under the established convention `docs/api/openapi/<api>.yaml` + `docs/api/examples/<api>/{typescript,python,ruby}/` (the convention V3-81 already follows for `webhooks.yaml`). The four APIs are: **seller** (V3-77, products/orders/inventory + webhooks), **logistics** (V3-78, quote/book/track/cancel + signed callbacks), **booking** (V3-79, services/slots/bookings/cancel + webhooks), **business-account** (V3-80, multi-user accounts/team-roles/analytics). This pass renders those fragments as reference — it is the single read surface over all of them.
- **V3-81 (webhook delivery)** ships the signed-webhook transport + `docs/api/openapi/webhooks.yaml`; its webhook guide inputs are documented here.
- **V3-89 (traces/SLOs/budgets)** lands SLO definitions + error-budget tracking; this pass's live status indicator reads from that SLO/health signal — green/yellow/red per service.
- **`@henryco/config`** owns every URL (`henryDomain()`/`henryWebRoot()`/`henrySubdomain()` in `packages/config/domain.ts`) and every brand string (`COMPANY` in `packages/config/company.ts`). **`@henryco/seo`** (`packages/seo`) owns metadata/structured-data. **`@henryco/ui`** owns shared chrome (`PublicSiteShell`, `PublicSiteFooter`) + tokens. **`@henryco/i18n`** owns all copy. **`@henryco/observability`** owns `emitEvent`/`HenryEventName`.

The gap V3-83 closes: a partner who has been issued a key has no documentation, no reference, no changelog, no way to try a call without writing code against production, and no visibility into whether a service is healthy. This pass is the front door for every external developer on the Henry Onyx platform.

> **Note — domain correctness:** the legacy stub named the literal `developers.henrycogroup.com`. That literal is **forbidden** (hardcoded domain). The docs site resolves its own host via `henrySubdomain('developers')` / `henryWebRoot()` from `@henryco/config`, driven by `NEXT_PUBLIC_BASE_DOMAIN`. No `henrycogroup.com` string appears anywhere in the diff.

## Mandatory scope

### S1 — The docs site (new app, config-resolved host)
A new Next.js app `apps/developers/` (App Router, Node 24, the repo's standard Next major), deployed to Vercel, host resolved via `henrySubdomain('developers')` (the `developers.` subdomain of `NEXT_PUBLIC_BASE_DOMAIN`) — **never** a hardcoded domain. It renders inside the shared public chrome (`PublicSiteShell` + `PublicSiteFooter` from `@henryco/ui`), uses the locked public token set (`--site-*`/`--accent`), Fraunces for editorial headings, system-sans for body and code blocks (monospace for code). Metadata + structured data via `@henryco/seo`. Sections:
- **API reference** — auto-rendered from each OpenAPI fragment (S2).
- **Guides** — getting-started, authentication, webhooks, errors, rate-limits (S3).
- **Changelog** — versioned releases + sunset notices (S4).
- **Sandbox playground** — live calls against the isolated sandbox env (S5).
- **Status** — live per-service health indicator (S6).

### S2 — Auto-generated API reference
A build-time step ingests the OpenAPI fragments at `docs/api/openapi/{seller,logistics,booking,business-account,webhooks}.yaml` and renders one reference section per API (operations, parameters, request/response schemas, scope requirements, error codes, the `X-API-Version`/`X-Sunset` contract). The reference is **generated**, not hand-maintained — regenerating from the source YAML is part of the build, so a stale reference cannot ship. Each operation embeds the matching code example for **TypeScript, Python, and Ruby** lifted from `docs/api/examples/<api>/{typescript,python,ruby}/` (produced by V3-77..V3-80/V3-81). A CI check fails the build if a fragment references an example file that does not exist (or vice versa).

### S3 — Guides
Hand-written long-form guides (MDX), copy via i18n where user-facing:
- **Getting started** — obtain a key, make a first authenticated call, read the response.
- **Authentication** — key scheme, scope model, scope-violation behavior, key rotation.
- **Webhooks** — subscribe, verify the HMAC-SHA256 signed-timestamp signature (links the V3-81 verify snippets), retry/dead-letter semantics, the verifier-ping flow.
- **Errors** — the standardized error envelope (code + correlation id), the full error-code catalog, how to use the correlation id with support.
- **Rate limits** — per-key/per-IP limits, the `429` contract, backoff guidance.

### S4 — Changelog
A versioned changelog (`/changelog`) listing API releases, additive vs breaking changes, and deprecation/sunset notices honouring the V3-76 policy (old version supported ≥ 6 months after a deprecation announcement; `X-Sunset` dates surfaced). Sourced from a structured file (`docs/api/changelog.yaml`) so entries are reviewable in PR, not free-typed into a page.

### S5 — Sandbox playground (production-isolated)
An interactive "try it" panel per reference operation that executes against the **sandbox** environment only. Hard isolation: the sandbox base URL, sandbox Supabase project/keys, and sandbox-only API keys are entirely separate from production — there is no code path by which a playground call can reach production data or a production key. A partner authenticates to the docs site (Supabase auth, sandbox project) to obtain a sandbox key; the playground signs requests with that sandbox key, never with anything production-scoped. Desktop-primary; usable but reduced on mobile.

### S6 — Live status indicator + developer key UX
- **Status:** a green/yellow/red badge per service (seller/logistics/booking/business-account/webhooks) driven by the V3-89 SLO/health signal (read-only); a dedicated `/status` page with per-service detail. It never invents a status — absence of a signal renders "unknown," not "green."
- **Developer key UX:** a developer-friendly issue/rotate flow that **reuses** the V3-76 key-management endpoints (no new key issuance logic here). A newly created key value is shown **exactly once** at creation and never again; the list shows name/scopes/last-used/created — never a key value, never a hash. Rotation issues a new key and revokes the old per the V3-76 contract.

### S7 — Telemetry
Add to the `HenryEventName` union in `packages/observability/src/events.ts` + `docs/event-taxonomy.md`:
- `henry.developer.docs.viewed`
- `henry.developer.sandbox.tried`
- `henry.developer.guide.opened`

(`henry.<domain>.<entity>.<verb>` — domain `developer`, entities `docs`/`sandbox`/`guide`.) Payloads carry the page/guide/operation identifier only; redact any auth context via `createRedactor` — never a key, never a key hash, never a request/response body in a telemetry payload.

## Integration keys (per docs/v3/INTEGRATION-KEYS.md)
Consumed env vars in this pass:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — **sandbox project** auth (partners log in to the docs site to get a sandbox key + see their key list).
- `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` — docs-site error tracking via `@henryco/observability`.
- `CLOUDINARY_CLOUD_NAME` — guide screenshots (served via Cloudinary, not committed binaries).
- `NEXT_PUBLIC_BASE_DOMAIN` — resolves the `developers.` host through `henrySubdomain('developers')`.

NEW env vars introduced: **none** beyond the INTEGRATION-KEYS.md inventory (the sandbox Supabase project keys are distinct *values* of the existing variable names, scoped to the docs-site Vercel project). **ZERO hardcoded keys / URLs / sender identities / domains** in the diff.

## Out of scope
- The API endpoints themselves and their OpenAPI fragments — **V3-77/78/79/80** (and **V3-81** webhooks, **V3-82** analytics-exports). This pass renders fragments it does not author.
- The API gateway, key issuance logic, scopes table, rate limiter — **V3-76** (this pass reuses its key-management endpoints).
- The SLO/health computation — **V3-89** (this pass only reads the signal for the status badge).
- Localized docs copy beyond the v1 language posture below — gated on **D10**.

## Dependencies
**Depends on:** V3-77, V3-78, V3-79, V3-80 (their OpenAPI fragments + example clients are the reference content). **Hard-uses:** V3-76 (key-management endpoints, error/versioning contract). **Soft-reads:** V3-81 (webhooks fragment + verify snippets), V3-82 (analytics-exports fragment), V3-89 (status signal). **Blocks:** nothing downstream directly; it is the partner-onboarding front door referenced by partner/enterprise passes.

## Inheritance
- `@henryco/seo` — page metadata + structured data.
- `@henryco/ui` — `PublicSiteShell`, `PublicSiteFooter`, design-system primitives + locked tokens.
- `@henryco/config` — `henrySubdomain('developers')` / `henryWebRoot()` / `henryDomain()` for every URL; `COMPANY` for brand strings + sender identity.
- `@henryco/i18n` — all user-facing copy.
- `@henryco/observability` — `emitEvent` + `HenryEventName`, Sentry config, `createRedactor`.
- V3-76 key-management API + V3-77..V3-82 OpenAPI fragments + example clients.

## Implementation requirements
### Files
- `apps/developers/` — full Next app: `app/layout.tsx`, `app/page.tsx`, `app/reference/[api]/page.tsx` (S2), `app/guides/[slug]/page.tsx` (S3, MDX), `app/changelog/page.tsx` (S4), `app/sandbox/page.tsx` (S5), `app/status/page.tsx` (S6), `app/keys/page.tsx` (S6 developer key UX), `next.config.*`, `vercel.json`.
- `apps/developers/lib/` — `openapi-render.ts` (S2 fragment → reference), `status-source.ts` (S6 V3-89 signal reader), `sandbox-client.ts` (S5 sandbox-scoped request signer).
- `apps/developers/content/guides/*.mdx` (S3) + `docs/api/changelog.yaml` (S4).
- `packages/observability/src/events.ts` (3 events) + `docs/event-taxonomy.md`.
- A CI check (`scripts/` or a workspace test) asserting every OpenAPI fragment has matching TS/Python/Ruby example files and vice versa (S2).

### Trust / safety / compliance
- **Sandbox strictly isolated from production:** separate base URL + Supabase project + key scope; no code path from the playground to production data or keys.
- **No production secret ever rendered:** a key value is shown once at creation (via the V3-76 contract) and never again; the list shows metadata only, never a value or a hash.
- **Auth-gated key surfaces:** the keys/sandbox pages require docs-site (sandbox-project) authentication; reference/guides/changelog/status are public read.
- Telemetry/logs redacted via `createRedactor` — never a key, hash, or request/response body.
- Docs-site errors flow to Sentry via `@henryco/observability`; the docs site adds no new mutating production route.

### Mobile + desktop parity
Reference, guides, changelog, and status are fully responsive (mobile + desktop) on design-system tokens, Fraunces headings, system-sans/monospace body; light + dark; CLS≈0; `pnpm a11y:contrast` not regressed. The sandbox playground is desktop-primary (a multi-pane request/response console); it remains usable on mobile with a reduced single-column layout and is never broken on small screens. Expo super-app: N/A — developer docs are a web property, not a super-app surface.

### i18n
All user-facing chrome, navigation, guide prose, button/label/status strings, and error copy use `@henryco/i18n` namespace `surface:developer-docs` — zero hardcoded strings. **v1 language posture:** the docs ship English-first (developers worldwide), but the *mechanism* is i18n, not hardcoded literals — so localized copy can be added without a refactor when **D10** commits multi-market. Machine-facing tokens (OpenAPI field names, error codes, HTTP verbs, code samples) are English-by-contract and exempted in `docs/v3/i18n-gaps/exempt.json` with a pointer to this pass. State explicitly: "English-first, i18n-wired" — not "English-only, hardcoded."

### Brand & design system
The site renders the Henry Onyx brand strictly via `@henryco/config` (group + division labels, sender identity), Fraunces + locked `--site-*`/`--accent` tokens, the shared `PublicSiteShell`/`PublicSiteFooter` chrome — never a hardcoded brand string and never the retired "Henry & Co.". Code-facing identifiers in examples and headers keep the **code shorthand** "HenryCo"/`@henryco` (machine-facing, correct per the brand rule). **Zero hardcoded domains:** the `developers.` host, every cross-link to a division/account/API, and every example base URL resolve through `henrySubdomain`/`henryDomain`/`henryWebRoot` (sandbox vs production base URLs are config-resolved, never literals). No ad-hoc hex.

## Validation gates
1. **CI:** `pnpm -w typecheck`, `pnpm -w lint`, `pnpm -w test`, `pnpm -w build` green for the new `apps/developers` workspace.
2. **OpenAPI auto-render (~5):** the reference renders correctly for all five fragments (seller, logistics, booking, business-account, webhooks) with operations, schemas, scopes, and error contract; the example-file consistency check passes.
3. **Sandbox playground smoke (~per endpoint):** a representative operation per API executes against the sandbox and returns a real sandbox response; a deliberate attempt to point the playground at production is blocked by construction (isolation test).
4. **Status indicator test:** the badge reflects the V3-89 signal (green/yellow/red), and renders "unknown" when no signal is present — never a fabricated green.
5. **Key management flow:** create (value shown once), list (metadata only — assert no value/hash leaks), rotate, revoke — all via the V3-76 endpoints.
6. **No-secret-leak test:** no production key value or hash appears in any rendered page, response, log, or telemetry payload.
7. **UI gates:** real-browser light + dark, mobile + desktop, CLS≈0, contrast not regressed; all chrome copy from `surface:developer-docs`; renders inside `PublicSiteShell`/`PublicSiteFooter`.
8. **Domain-literal gate:** `grep`-equivalent CI assertion that the diff contains no `henrycogroup.com` literal and no hardcoded base URL — all via `@henryco/config` helpers.

## Deployment gate
All gates green; V3-77/78/79/80 merged to `main` (their fragments + examples are the reference content), V3-76 merged (key-management contract). Sandbox isolation proven (a playground call cannot reach production). The `developers.` subdomain provisioned via the config-resolved host. **14-day soak** on the docs site to gather partner feedback before it is announced as GA. No owner sign-off required (no D-gate).

## Final report contract
`.codex-temp/v3-83-platform-developer-docs/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion).

## Self-verification
- [ ] `apps/developers` site live on the config-resolved `developers.` host (`henrySubdomain('developers')`), inside `PublicSiteShell`/`PublicSiteFooter`, Fraunces + locked tokens (S1).
- [ ] API reference auto-generated from all OpenAPI fragments, with TS/Python/Ruby examples per operation; example-consistency CI check passes (S2).
- [ ] Guides shipped: getting-started, auth, webhooks, errors, rate-limits (S3).
- [ ] Versioned changelog honouring the V3-76 sunset policy, sourced from a reviewable file (S4).
- [ ] Sandbox playground executes against an isolated sandbox env; no path to production data/keys (S5).
- [ ] Live per-service status indicator reads the V3-89 signal; developer key UX reuses V3-76 (value shown once, metadata-only list) (S6).
- [ ] 3 new `henry.developer.*` telemetry events in the typed union + taxonomy; payloads redacted (S7).
- [ ] No production key value/hash rendered anywhere; sandbox strictly isolated.
- [ ] Brand via `@henryco/config` (never "Henry & Co."); `surface:developer-docs` i18n, English-first but i18n-wired; zero hardcoded domains/keys/strings (domain-literal CI gate passes).
- [ ] Report written at the path above.
