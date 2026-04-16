# Public SEO Foundations

## Canonical event-free rule set

- One canonical URL model now lives in `packages/config/seo.ts`.
- Public route metadata now uses division-aware URL helpers instead of ad hoc base-domain strings.
- Home and key conversion/detail routes now declare explicit canonical paths instead of inheriting vague app-level defaults.

## What changed

- Added shared metadata helpers for:
  - metadata base resolution
  - canonical URL generation
  - Open Graph and Twitter metadata
  - robots generation
  - sitemap entry generation
- Added `robots.ts` and `sitemap.ts` coverage for:
  - `hub`
  - `care`
  - `jobs`
  - `learn`
  - `logistics`
  - `marketplace`
  - `property`
  - `studio`
- Added route-level metadata for:
  - marketplace home, search, and product detail
  - property home, search, managed, area, and listing detail
  - jobs home, listing, and job detail
  - learn home, catalog, and course detail
  - logistics home, pricing, services, support, and booking
  - studio home plus service/team/work detail
  - hub home plus core public company pages

## Structured data added where standards are strong

- `Product` JSON-LD on marketplace product detail
- `JobPosting` JSON-LD on jobs detail
- `Course` JSON-LD on learn course detail

## Live gaps found during audit

- Live `robots.txt` returned `404` on inspected `hub`, `marketplace`, `jobs`, and `property` surfaces before this repo pass.
- Live public HTML shells exposed title/description/OG/Twitter basics on several apps, but canonical links were not consistently present.
- Repo truth had almost no sitemap coverage before this pass.
