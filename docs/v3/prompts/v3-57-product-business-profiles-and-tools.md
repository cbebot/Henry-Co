# V3-57 — Product: Business Profiles + Tools

**Pass ID:** V3-57 | **Phase:** G | **Pillar:** P1, P8
**Deps:** V3-12 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Business Profiles engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision: "Business profiles + business tools + seller academy." Today: no formal business-account model.

## Mandatory scope

1. **`businesses` schema**:
   ```sql
   CREATE TABLE businesses (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     legal_name TEXT NOT NULL,
     trading_name TEXT,
     business_registration TEXT,
     country TEXT NOT NULL,
     primary_partner_type TEXT NOT NULL,
     verified_at TIMESTAMPTZ,
     status TEXT NOT NULL DEFAULT 'pending',
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   CREATE TABLE business_members (
     business_id UUID REFERENCES businesses NOT NULL,
     user_id UUID REFERENCES auth.users NOT NULL,
     role TEXT NOT NULL CHECK (role IN ('owner','admin','member')),
     joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     PRIMARY KEY (business_id, user_id)
   );
   ```

2. **Business profile surface**:
   - Public storefront at `business.henrycogroup.com/<slug>` or per-division (`marketplace.henrycogroup.com/store/<slug>`).
   - Logo, bio, team, reviews, services/products/jobs.

3. **Business tools**:
   - Team management (invite/remove members; role assignment).
   - Aggregated analytics across activities.
   - Switch context: user can act as themselves or as their business.

4. **Telemetry** — `henry.business.created`, `henry.business.member_added`, `henry.business.context_switched`, `henry.business.profile_viewed`.

## Out of scope
- Vertical-specific suites (V3-70..V3-75).
- Bulk invoicing (V3-75).

## Dependencies
V3-12. Blocks V3-58, V3-70..V3-75, V3-80.

## Inheritance
@henryco/auth (extend with business-context); existing storefront patterns.

## Trust / safety / compliance
- Business verification gated on KYC + business-registration.
- Context-switch audited.
- ANTI-CLONE Principle 12.

## Mobile + desktop parity
Profile + tools responsive.

## i18n
Per locale.

## Validation gates
1. Standard CI.
2. **Business creation + member invite**.
3. **Context-switch** preserves session.
4. **Profile renders publicly**.

## Deployment gate
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Schema + RLS.
- [ ] Public profile.
- [ ] Team mgmt.
- [ ] Context switch.
- [ ] 4 new telemetry events.
- [ ] Report written.
