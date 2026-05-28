# V3-35 — Personalization: Deals & Campaigns

**Pass ID:** V3-35 | **Phase:** E | **Pillar:** P3, P1
**Deps:** V3-34 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Deals engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision: "Personalized deals + campaigns + newsletter engine." Today: marketplace seller tiers exist, no campaign engine.

## Mandatory scope

1. **`deals` schema**:
   ```sql
   CREATE TABLE deals (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     creator_partner_id UUID REFERENCES partners,
     title TEXT NOT NULL,
     description TEXT,
     deal_type TEXT NOT NULL CHECK (deal_type IN ('percent_off','fixed_off','bogo','bundle')),
     discount_value NUMERIC,
     scope_division TEXT,
     scope_categories TEXT[],
     starts_at TIMESTAMPTZ NOT NULL,
     ends_at TIMESTAMPTZ NOT NULL,
     status TEXT NOT NULL DEFAULT 'draft',
     visibility TEXT NOT NULL DEFAULT 'public',
     audience_signals JSONB,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   ```

2. **Deal authoring**:
   - Per-partner deal creator in their business suite.
   - Owner / staff can create platform-wide campaigns.
   - Approval workflow (auto-approve standard discounts; staff-review high-discount deals).

3. **Personalized deal surface**:
   - User home shows deals matching signals (recent activity, saved items, lifecycle stage).
   - Uses V3-34 personalization context.
   - "All deals" page shows full list.

4. **Fairness audit**:
   - Tracks deal-impression distribution; alerts if dominated by single creator.
   - Diversity guard like V3-52 ranking.

5. **Telemetry** — `henry.deal.created`, `henry.deal.impressed`, `henry.deal.claimed`, `henry.deal.fairness_alert`.

## Out of scope
- Newsletter (V3-61).
- Cross-division dispatch logic (V3-48).

## Dependencies
V3-34. Blocks V3-48, V3-62.

## Inheritance
@henryco/intelligence (event types); V3-34 personalization context; V3-50 partners (once shipped).

## Trust / safety / compliance
- Deal terms audited.
- Staff-review for high-value.
- ANTI-CLONE Principle 1 (ranking server-side).

## Mobile + desktop parity
Deal surface responsive.

## i18n
Deal title/description by partner; user sees in their locale via translateSurfaceLabel if available.

## Validation gates
1. Standard CI.
2. **Deal authoring e2e**.
3. **Personalized surface smoke** — different users see different ordering.
4. **Approval workflow**.
5. **Fairness alert** — synthetic skew triggers alert.

## Deployment gate
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Schema + RLS.
- [ ] Authoring UI.
- [ ] Personalized surface.
- [ ] Fairness audit.
- [ ] 4 new telemetry events.
- [ ] Report written.
