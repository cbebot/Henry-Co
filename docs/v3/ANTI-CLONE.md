# V3 Anti-Clone Hardening Notes

**Pass:** V3 Strategic Architect (Phase F output)
**Compiled:** 2026-05-17
**Status:** Defense-in-depth architecture patterns. Cross-cuts every V3 pass. Owner-decided posture per D12.

The owner's instruction is that HenryCo should be hard to reverse-engineer or clone, without sacrificing user experience and without violating any law. This document lists sensible patterns to apply. None of these are obfuscation theater — every item is real defense.

The honest truth: any client-side code can ultimately be read by a determined attacker. The goal is **raising the cost of cloning** so that it is faster + cheaper for a competitor to build their own platform than to steal HenryCo's. We do that by (a) keeping the value behind server-side decisions, (b) protecting the brand legally, (c) making the network behaviors hard to imitate, and (d) building moats that don't live in code at all (data, trust, partner relationships).

---

## Principle 1 — Server-side business logic by default

**What:** Pricing, ranking, scoring, recommendations, fraud detection, moderation decisions — all computed server-side. The client receives the result; never the formula.

**Why:** A formula in the client is a formula in the clone. Move the formula to a server endpoint and the clone needs to either (a) reverse-engineer it from observed outputs (slow, lossy) or (b) host its own model + dataset (cost-prohibitive).

**Where in V3:**
- V3-52 (marketplace discovery + ranking): the merit-shuffle + personalisation re-rank formula lives in `@henryco/intelligence` server-only path
- V3-13–V3-22 (payments): all routing decisions + risk + fees computed server-side
- V3-26–V3-33 (AI): provider router lives server-side; the client only sees "HenryCo Intelligence" responses
- V3-40 (fraud + risk prediction): model + scoring inputs server-only
- V3-50 (verified provider model): provider scoring formula server-only

**Anti-pattern to avoid:** Don't ship server-state in `window.__INITIAL_PROPS__` or NextData if that state encodes proprietary logic. Hydrate from server queries, not from formula-bearing payloads.

---

## Principle 2 — Proprietary scoring + ranking + pricing behind authenticated APIs

**What:** Any endpoint that returns a score, rank, or computed price requires authentication. Even read endpoints. Public endpoints return only what every visitor must see.

**Why:** Unauthenticated mass-crawl of scored listings reveals the scoring formula via statistical observation. Authentication raises the cost to crawl (rate-limit per user, not per IP).

**Where in V3:**
- V3-52 (marketplace ranking): public listings show in default order; signed-in shows re-ranked order; the re-rank delta is behind auth
- V3-50 (verified provider scoring): provider tier badges public, score is auth-only
- V3-40 (fraud signals): never exposed to public; staff-only via `/api/staff/risk` with explicit RLS
- V3-77, V3-78, V3-79 (public APIs): scoped tokens with per-partner rate limits

**Anti-pattern to avoid:** "It's cached at the CDN edge, so it's safe to put the formula in the response." Wrong — CDN caches can be enumerated.

---

## Principle 3 — Minified + source-map-private bundles

**What:** Production JavaScript is minified by Next 16 default. Source maps are NOT shipped to production CDN; they go to Sentry only (private) for error mapping.

**Why:** Source maps expose function names, file paths, comments. A minified bundle is harder to read; without source maps, function inference is slow.

**Where in V3:**
- All Phase B+ work: Next 16 default minification preserved
- V3-89 (observability + traces): Sentry source-map upload via CI, not shipped to production

**Implementation:** In each app's `next.config.js`:
```js
const nextConfig = {
  productionBrowserSourceMaps: false,  // critical — do NOT enable
  // ...
};
```

Verify with `curl https://<app>.henrycogroup.com/_next/static/chunks/<file>.js.map` returns 404.

---

## Principle 4 — Rate limiting + bot detection on public endpoints

**What:** Every public endpoint has a per-IP rate limit. Suspected bots see a challenge (CAPTCHA, JS challenge). High-value endpoints (search, listings) have aggressive per-IP and per-account limits.

**Why:** Scraping a million listings reveals catalog state + ranking patterns. Rate limits make scraping economically unattractive.

**Where in V3:**
- V3-02 (auth reliability): signup + login rate limits hardened (already exist; verify coverage)
- V3-52 (marketplace ranking): per-IP rate limit on `/marketplace/search` and listing-detail pages
- V3-76 (public API): per-key rate limit + global per-IP rate limit
- V3-81 (webhook delivery): subscriber-side rate limit on outgoing webhooks
- V3-04 (deep links): consider per-IP rate limit on share-link expansion endpoints

**Implementation:** Vercel Edge Middleware + Upstash Redis or `next-rate-limit` per route. Bot detection: Vercel Bot ID, Cloudflare Bot Management, or custom heuristics (JS challenge, mouse movement, time-on-page).

**Anti-pattern to avoid:** Rate limiting only on POST endpoints. Crawlers GET.

---

## Principle 5 — Watermark exported documents

**What:** Every branded document exported by `@henryco/branded-documents` carries a visible watermark + invisible metadata identifying the requester + timestamp + document hash.

**Why:** If a leaked document appears publicly (proposal, invoice, KYC summary), the watermark identifies the leak source. Discourages internal leakage + provides forensic trail.

**Where in V3:**
- V3-18 (receipts + invoices): watermark + metadata embedded
- V3-22 (finance dashboard): export-to-PDF watermarked
- V3-46 (owner reports): owner-only export carries owner identity + timestamp
- V3-73 (studio project suite): proposal + asset-pack exports watermarked

**Implementation:** Visible watermark = low-opacity background string of `${requesterId}.${timestamp}`. Invisible metadata = PDF Producer/Keywords fields with HMAC-signed identity tag. Track every export in `branded_document_exports` table.

---

## Principle 6 — Database-level secrets and key separation

**What:** Service role keys never reach client bundles (already enforced per architecture-summary.md). Anon keys are minimum-privilege. Per-row RLS hardened on every user-scoped table.

**Why:** A leaked service role key compromises the entire database. RLS limits blast radius even if anon key is stolen.

**Where in V3:**
- Phase B foundation: V3-02 audits credential surfaces
- V3-17 (ledger): wallet + wallet_transactions RLS rebuilt with `D8` security fix
- V3-76 (public API): no service role key on partner-API path; scoped keys per partner with RLS-enforced row visibility
- V3-92 (backup): backups encrypted at rest with separate key

**Implementation:** Audit every `process.env.SUPABASE_SERVICE_ROLE_KEY` usage; confirm server-only. Run RLS coverage tooling (V3-BACKLOG A5).

**Anti-pattern to avoid:** Using service role key "just for this one endpoint" because RLS is annoying to write. Service role key in a request handler = no RLS protection = full DB access if endpoint is exploited.

---

## Principle 7 — Trademark + brand asset protection

**What:** Register the HenryCo wordmark, monogram, and "HenryCo Intelligence" trademarks. Issue cease-and-desist on infringers.

**Why:** Trademark is the only legal lever against name + brand cloning. Code is not protected by copyright if reimplemented; trademark is per-mark.

**Where in V3:**
- Cross-cuts: L10 from LEGAL-AND-BUSINESS.md
- Apply to brand assets in `@henryco/brand` and `apps/hub/public/`

**Implementation:** Lawyer files in Nigeria (NIPC) + Madrid Protocol international if D10 commits.

---

## Principle 8 — Per-account API request signing on high-value endpoints

**What:** For high-value mutating endpoints (wallet transfers, KYC submission, payment authorization), the client signs the request body with a per-session secret (Web Cryptography API). Server verifies signature.

**Why:** Replay attacks become hard. CSRF protection upgraded from cookie-token to cryptographic.

**Where in V3:**
- V3-14 (payment authorization): request signing
- V3-17 (ledger transfers): request signing
- V3-24 (KYC submission): request signing + idempotency-key

**Implementation:** Server issues a per-session HMAC key on auth; client stores in `sessionStorage` (NOT localStorage) with `Secure` flag; signs requests with `crypto.subtle`.

**Trade-off:** Adds client complexity. Apply only where stakes warrant it.

---

## Principle 9 — Network behavior + observable patterns

**What:** Critical decisions (e.g., which provider routes a payment) happen via opaque server endpoints. The client cannot infer which provider was selected from response shape alone.

**Why:** A clone trying to replicate "which provider for which transaction" must run live A/B tests against HenryCo, which is detectable + slow.

**Where in V3:**
- V3-13 (payment provider router): response uniform regardless of routed provider; redirect URLs domain-masked through `pay.henrycogroup.com/<token>` not directly to provider
- V3-26 (AI provider router): response uniform; provider name never in headers or body

**Implementation:** Reverse-proxy provider endpoints under HenryCo domain; strip provider-identifying response headers.

---

## Principle 10 — Data + trust moats (the strongest defense)

**What:** The most durable anti-clone is the data and relationships HenryCo accumulates, not the code. Verified providers, trust scores, dispute history, transaction graph, partner contracts — none of these can be cloned by reading source code.

**Why:** A competitor can copy the UI in weeks but cannot copy 10,000 verified providers or 50,000 trust-scored accounts. The moat compounds.

**Where in V3:**
- V3-24 (KYC) builds the verified-identity graph
- V3-50 (verified provider) builds the provider quality graph
- V3-40 (fraud prediction) builds the labeled-risk dataset
- V3-67 (partner onboarding) builds the contract relationships
- V3-90 (data lake) accumulates the event stream over years

**Implementation:** Treat data as the asset. Backup + protect + version + privacy-respect it.

**Owner framing:** "When a competitor reads our code, they see a recipe. They still need the ingredients, the supplier relationships, the customer trust, and the years of operation. Building that takes longer than they can fund."

---

## Principle 11 — Brand voice + design consistency (legitimate not-code defense)

**What:** Maintain consistent premium voice across every surface. Editorial standards. Photography standards. Tone-of-voice guide.

**Why:** A clone can copy a screenshot but not the rhythm of an entire ecosystem. Cross-division consistency feels unfakeably-corporate.

**Where in V3:**
- Phase B foundation passes preserve the V3 PASS 25 typography refinements
- V3-96 (showcase): showcase the cross-division consistency

---

## Principle 12 — Audit logs + intrusion detection

**What:** Every privileged action is logged with actor + IP + user-agent + result. Anomalous patterns (mass-export, rapid sensitive-action, off-hours admin access) trigger alerts.

**Why:** If a clone-attempt happens, you want forensic evidence + early warning.

**Where in V3:**
- V3-10 (logs/states/fallbacks) baseline
- V3-89 (traces + SLOs) extends to anomaly detection
- V3-90 (data lake) provides longitudinal pattern analysis

**Implementation:** `@henryco/observability/audit-log` (already exists per DASH-9). Per-action retention 1 year minimum. Sentry/Datadog/Splunk alerting on patterns.

---

## What NOT to do

These are anti-patterns that look like defense but waste effort or harm UX:

1. **Don't disable right-click + copy-paste.** Trivial to bypass; angers legitimate users.
2. **Don't disable F12 / DevTools.** Trivial to bypass; angers legitimate users.
3. **Don't ship obfuscated JavaScript beyond standard minification.** Real attackers use de-obfuscation tools; the obfuscation step hurts your debugging + performance.
4. **Don't fingerprint users with browser-fingerprinting libraries** (FingerprintJS aggressive mode, canvas fingerprinting). Privacy law exposure + ineffective vs determined cloners.
5. **Don't bury features behind unmaintainable security through obscurity** (random-string URLs for public pages). SEO + observability harm; no real defense.
6. **Don't refuse to publish robots.txt or sitemap.** SEO is foundational; "hide from search" is not anti-clone, it's anti-discovery.
7. **Don't sign every request with a long-lived secret in the bundle.** The "secret" is in the bundle, therefore not secret. Use short-lived per-session keys per Principle 8.
8. **Don't rely on TLS pinning in mobile apps without a rotation plan.** Pinning misconfiguration bricks your app.
9. **Don't run a DRM library on the SPA.** Web DRM is theater; license-management UX harm exceeds any defense.

---

## Posture per D12 (owner decision)

- **Option A — Light:** apply Principles 1, 2, 3, 6, 7, 10 only. Skip 4 (rate limiting beyond standard auth), 5 (watermarks), 8 (request signing), 9 (network masking), 12 (audit logs at depth).
- **Option B — Moderate (recommended):** apply Principles 1–7 + 10–12. Skip 8 (request signing) and 9 (network masking) — diminishing returns vs UX cost.
- **Option C — Aggressive:** apply all 12 principles.

**Recommended for V3:** Option B. Apply Principles 1–7, 10, 11, 12 across the relevant passes. Defer 8 + 9 to V4 if scale + threat model demands them.

---

## Cross-pass application checklist

When authoring any V3 prompt, the prompt's "Trust / safety / compliance requirements" section MUST address:

- [ ] Does this pass introduce client-visible formula or score? If yes, apply Principle 1 (server-side compute).
- [ ] Does this pass introduce a public endpoint? If yes, apply Principle 4 (rate limit + bot detection).
- [ ] Does this pass introduce credentials or service-role usage? If yes, apply Principle 6 (key separation).
- [ ] Does this pass mutate high-value state (money, identity)? If yes, consider Principle 8 (request signing) and confirm Principle 12 (audit log).
- [ ] Does this pass produce exported documents? If yes, apply Principle 5 (watermarks).
- [ ] Does this pass involve provider selection / routing? If yes, apply Principle 9 (network masking).

The pass closes only if every applicable principle is implemented and verified.

---

## Self-verification

- [x] 12 principles named with what + why + where + implementation + anti-pattern
- [x] "What NOT to do" list of 9 ineffective patterns
- [x] Posture options A/B/C tied to D12 owner decision
- [x] Cross-pass application checklist for prompt authors
- [x] No security-through-obscurity recommendations
- [x] Honest framing about "raising cost of cloning" not "making cloning impossible"
- [x] Data + trust + brand moats framed as the strongest defense
