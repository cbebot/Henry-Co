# V3-67 — Partner Onboarding

**Pass ID:** V3-67
**Phase:** H (PARTNER & ENTERPRISE)
**Pillar:** P8 (Partner & Enterprise Ecosystem), P7 (Trust)
**Dependencies:** V3-50 (verified provider model), V3-24 (KYC vendor)
**Effort:** L (2–4 weeks)
**Parallel-safe:** NO (chain V3-67 → V3-68 → V3-69)
**Owner gate:** None at start
**Risk class:** Identity, Compliance

---

## Role

You are the V3 Partner engineer. Execute this one pass, then stop.

This pass ships the partner onboarding flow — from signup through KYC verification, service-area selection, profile creation, contract acceptance, and ready-to-trade state. Partners include marketplace sellers, service providers, employers, property landlords, studio clients.

---

## Project, audit, anti-patterns

Audit lift from AUDIT-BASELINE.md §2.17 (logistics operator) + Vision P8.

---

## Mandatory scope

### S1 — `partners` schema + onboarding state machine

```sql
CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  partner_type TEXT NOT NULL CHECK (partner_type IN ('marketplace_seller','service_provider','employer','property_landlord','studio_client')),
  legal_name TEXT NOT NULL,
  business_registration TEXT,
  kyc_status TEXT NOT NULL DEFAULT 'pending',
  kyc_verified_at TIMESTAMPTZ,
  contract_accepted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','kyc_in_review','contract_pending','live','suspended','offboarded')),
  service_areas TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
```

State machine: `pending → kyc_in_review → contract_pending → live`. Backward transitions only via staff intervention.

### S2 — Onboarding wizard

`apps/account/app/(account)/become-a-partner/` route:
- Step 1: Partner type selection.
- Step 2: Business info + KYB (legal entity verification via V3-24 KYC vendor; uses business-tier verification level).
- Step 3: Service area + capability declaration.
- Step 4: Contract presentation + acceptance (with download).
- Step 5: Initial profile creation (handed to V3-57 business profiles).

Each step persists state; user can return.

### S3 — Staff review queue

`apps/staff/app/(staff)/partner-reviews/` — review pending partners; approve / reject / request more docs.

### S4 — Partner notifications

Per-step notifications via `@henryco/notifications`:
- "KYC under review"
- "KYC approved — please review your contract"
- "You're live — start trading"

### S5 — Telemetry

- `henry.partner.onboarding.started`
- `henry.partner.kyc.submitted`
- `henry.partner.kyc.approved`
- `henry.partner.kyc.rejected`
- `henry.partner.contract.accepted`
- `henry.partner.live`

---

## Out of scope

- Partner performance + contracts (V3-68).
- Partner payouts (V3-69).
- Per-vertical business suites (V3-70..V3-75).

## Dependencies / Inheritance / Trust / Mobile / i18n / Gates / Deployment / Report

Standard pattern.

Key trust requirement: contract acceptance audited with signed snapshot of contract version + accept timestamp + IP + UA (ANTI-CLONE Principle 12). KYC documents stored encrypted at rest; access restricted to trust-staff via RLS.

---

## Self-verification

- [ ] Schema + RLS applied.
- [ ] Onboarding wizard 5 steps.
- [ ] Staff review queue.
- [ ] Partner notifications.
- [ ] 6 new telemetry events.
- [ ] Report written. Hand-off: V3-68 (performance + contracts).
