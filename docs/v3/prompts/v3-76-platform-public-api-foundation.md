# V3-76 — Public API Foundation

**Pass ID:** V3-76
**Phase:** I (PLATFORM/API + GLOBAL/MOBILE + OBSERVABILITY + CLOSURE)
**Pillar:** P11 (Platform & API Layer)
**Dependencies:** V3-02 (auth reliability)
**Effort:** L (2–4 weeks)
**Parallel-safe:** NO (foundation for Phase I API surfaces)
**Owner gate:** None
**Risk class:** Identity

---

## Role

You are the V3 Platform engineer. Execute this one pass, then stop.

This pass ships the public API foundation — versioning scheme, rate limiting, auth scopes, key management UI, per-app/per-partner keys. Subsequent passes (V3-77 seller API, V3-78 logistics API, V3-79 booking API, V3-80 business-account API) plug into this foundation.

---

## Project, audit, anti-patterns

Audit lift from AUDIT-BASELINE.md §2.18 (Platform & API gap) + Vision P11.

---

## Mandatory scope

### S1 — `api_keys` + `api_scopes` schema

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners,
  key_hash TEXT NOT NULL UNIQUE, -- SHA256 of the API key
  name TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
  rate_limit_per_day INTEGER NOT NULL DEFAULT 10000,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE api_scopes (
  scope TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  category TEXT NOT NULL
);
```

### S2 — Scope catalog

Initial scopes (V3-77..V3-80 add more):
- `read:products`
- `write:products`
- `read:orders`
- `write:orders`
- `read:inventory`
- `read:profile`

### S3 — API gateway middleware

`packages/api-gateway/src/`:
- Verifies API key against `api_keys.key_hash`.
- Checks rate limits (Upstash Redis or similar).
- Verifies scope for requested route.
- Logs every call to `api_call_log`.
- Returns standardized error responses with version + correlation ID.

### S4 — Versioning scheme

URLs: `/api/v1/products`, `/api/v1/orders`, etc.
Deprecation: every breaking change → new version; old version supported for 6 months minimum after deprecation announcement.
Headers: `X-API-Version`, `X-Sunset` (RFC 8594).

### S5 — Key management UI

`apps/account/app/(account)/api-keys/page.tsx` — partners only:
- Create key (set name + scope set; key shown ONCE at creation).
- Revoke key.
- See last-used + usage stats.

### S6 — Telemetry

- `henry.api.call`
- `henry.api.rate_limit_exceeded`
- `henry.api.scope_violation`
- `henry.api.key_created`
- `henry.api.key_revoked`

---

## Out of scope

- Specific API endpoints (V3-77..V3-82).
- Developer docs site (V3-83).
- Analytics exports (V3-82).
- Webhook delivery service (V3-81).

## Dependencies / Inheritance / Trust / Mobile / i18n / Gates / Deployment / Report

Standard pattern.

Key trust requirement: API keys hashed (never plain in DB); scopes enforced per-route; rate limiting per-key + per-IP; audit log every call (ANTI-CLONE Principle 12); ANTI-CLONE Principle 2 (proprietary scoring NEVER returned even via API — only public data via API).

---

## Self-verification

- [ ] Schema applied with RLS.
- [ ] Scope catalog seeded.
- [ ] Gateway middleware live + tested.
- [ ] Versioning in URL + headers.
- [ ] Key management UI for partners.
- [ ] 5 new telemetry events.
- [ ] Report written. Hand-off: V3-77 (seller API), V3-78 (logistics API), V3-79 (booking API), V3-80 (business-account API) parallel.
