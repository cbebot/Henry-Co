# Render Strategy Map

## Confirmed repo truth

| Surface | Before | After | Notes |
| --- | --- | --- | --- |
| `hub` public root | Dynamic by host/runtime design | Still dynamic | Host-based workspace detection remains intentional. |
| `hub` public content pages | Dynamic metadata with weak page-level canonical coverage | Stronger route metadata | Public layout still depends on locale/session chrome. |
| `marketplace` public shell | Dynamic root layout | Still dynamic | Cart/session shell stays request-aware; route metadata is now stronger. |
| `property` home/search/managed/area | Forced dynamic | ISR-style `revalidate = 300` | These routes do not require per-request auth truth. |
| `property` detail | Forced dynamic | Still dynamic | Logged-in save/inquiry/viewing state remains request-aware. |
| `jobs` public shell | Dynamic root layout | Still dynamic | Locale + shared shell behavior kept intact; route metadata improved. |
| `learn` public layout | Forced dynamic | Revalidated public layout | Public shell no longer declares forced dynamic rendering. |
| `logistics` home/pricing/services/support | Forced dynamic | ISR-style `revalidate = 300` | Public content is now cache-friendly without touching book/track auth flows. |
| `logistics` booking | Forced dynamic | Still dynamic | Saved addresses and viewer state require request-time rendering. |
| `studio` public pages | Default mixed/static | Kept cache-friendly | Public detail metadata added without forcing runtime personalization. |

## Strategy rules used in this pass

- Keep request-time rendering when the route exposes viewer-specific truth, saved state, or authenticated continuation.
- Move public informational routes to revalidated rendering where the data is safe to cache for short windows.
- Prefer stronger first-render metadata, canonical URLs, robots, and sitemaps over fake "SSR complete" claims.
- Do not widen the blast radius into support backend or support-thread lifecycle work.

## Follow-up candidates

- Split marketplace and jobs public chrome away from session/cart-aware layout concerns if later performance work justifies the complexity.
- Revisit hub public layout personalization if a static outer shell becomes more valuable than the live account chip.
- Add route-specific metadata for secondary public detail surfaces not covered in this pass if those pages become search priorities.
