# V3-83 — Platform: Developer Docs Site

**Pass ID:** V3-83 | **Phase:** I | **Pillar:** P11
**Deps:** V3-77, V3-78, V3-79, V3-80 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Developer Docs engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision P11. Once V3-77 through V3-80 ship, partners need a developer-friendly docs site.

## Mandatory scope

1. **`developers.henrycogroup.com`** as a separate Next 16 app or hosted on hub:
   - API reference (auto-generated from OpenAPI schemas; one per API: seller, logistics, booking, business-account).
   - Guides (getting started, auth, webhooks, errors, rate limits).
   - Changelog (releases + versioning).
   - Sandbox playground (live API calls against sandbox env).
   - Code examples in TS + Python + Ruby (already produced per V3-77-80).

2. **API key management UI**: extends V3-76 partner UI; developer-friendly flow for issuing + rotating keys.

3. **Live API status indicator**: green / yellow / red per service; updates from V3-89 SLO data.

4. **Telemetry** — `henry.developer_docs.viewed`, `henry.developer_docs.sandbox.tried`, `henry.developer_docs.guide.opened`.

## Integration keys (per INTEGRATION-KEYS.md)

Consumed env vars in this pass:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — for docs-site auth (partners log in to see their keys)
- `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` — docs-site error tracking
- `CLOUDINARY_CLOUD_NAME` — guide screenshots

NEW env vars introduced: none. ZERO hardcoded keys / URLs / sender identities in the diff.

## Out of scope
- Specific API endpoints (V3-77..V3-80).
- API gateway (V3-76).

## Dependencies
V3-77, V3-78, V3-79, V3-80.

## Inheritance
@henryco/seo for SEO; @henryco/ui primitives.

## Trust / safety / compliance
- Sandbox env strictly isolated from production keys.
- No production keys ever shown in UI; only "create new key" → owner sees it ONCE.

## Mobile + desktop parity
Docs site responsive; sandbox playground desktop-primary.

## i18n
English-only for v1 (developers worldwide); add localized when D10 commits multi-market.

## Validation gates
1. Standard CI.
2. **OpenAPI auto-render** for 4 APIs.
3. **Sandbox playground** smoke per endpoint.
4. **Status indicator** wired to V3-89.
5. **Key management** flow.

## Deployment gate
- 14-day soak; gather partner feedback.

## Final report contract
Standard.

## Self-verification
- [ ] Docs site live at developers subdomain.
- [ ] API reference auto-gen from OpenAPI.
- [ ] Sandbox playground.
- [ ] Code examples in 3 languages.
- [ ] Status indicator.
- [ ] Key management UI.
- [ ] 3 new telemetry events.
- [ ] ZERO hardcoded keys / URLs.
- [ ] Report written.
