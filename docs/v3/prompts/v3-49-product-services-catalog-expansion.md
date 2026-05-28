# V3-49 — Product: Services Catalog Expansion

**Pass ID:** V3-49 | **Phase:** G | **Pillar:** P1
**Deps:** V3-12 | **Effort:** XL | **Parallel:** NO | **Owner gate:** none | **Risk:** —

## Role
V3 Services Catalog engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision P1: Care broadens to broader Services platform — laundry, garment care, home cleaning, office cleaning, repairs, errands, moving, event support, business support, deep cleaning, provider-assisted.

## Mandatory scope

1. **Service taxonomy schema**:
   ```sql
   CREATE TABLE service_categories (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     slug TEXT NOT NULL UNIQUE,
     parent_id UUID REFERENCES service_categories,
     name TEXT NOT NULL,
     description TEXT,
     icon TEXT,
     display_order INT NOT NULL DEFAULT 0
   );
   CREATE TABLE services (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     category_id UUID REFERENCES service_categories NOT NULL,
     provider_id UUID REFERENCES partners, -- nullable for HenryCo-direct services
     name TEXT NOT NULL,
     description TEXT,
     pricing_model JSONB NOT NULL,
     duration_minutes INT,
     status TEXT NOT NULL DEFAULT 'active'
   );
   ```

2. **Seed catalog**: 11 service categories from V3 vision + sub-services per category.

3. **Service detail pages** per service with: description, pricing, providers, availability, booking CTA.

4. **Cross-listing**: each service surfaces on `care.henrycogroup.com/services` and a top-level `henrycogroup.com/services` directory.

5. **Search integration**: services indexed in Typesense per existing search-core pattern.

6. **Telemetry** — `henry.services.catalog.viewed`, `henry.services.service.viewed`, `henry.services.booking.started`.

## Out of scope
- Verified provider model (V3-50).
- Smart booking (V3-51).
- Provider onboarding (V3-67).

## Dependencies
V3-12. Blocks V3-50, V3-51, V3-63.

## Inheritance
Care app structure (existing); @henryco/search-core; @henryco/pricing.

## Trust / safety / compliance
- Service descriptions moderated via V3-25.

## Mobile + desktop parity
Responsive catalog.

## i18n
Per locale.

## Validation gates
1. Standard CI.
2. **Catalog seeded with 11 categories**.
3. **Service detail pages render**.
4. **Search returns services**.

## Deployment gate
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Schema + seed.
- [ ] Detail pages.
- [ ] Cross-listing surfaces.
- [ ] Search wired.
- [ ] 3 new telemetry events.
- [ ] Report written.
