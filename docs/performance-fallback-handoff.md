# Performance and Fallback Handoff

## Public performance changes made

- Low-risk public routes in `property` and `logistics` were moved off forced dynamic rendering and onto short-window revalidation.
- `learn` public layout no longer declares forced dynamic rendering.
- Shared metadata and crawler files now ship from repo truth instead of leaving live surfaces to 404 on crawler endpoints.

## Fallback truth improved

- Public detail pages now expose route-specific metadata instead of generic app shells.
- Search crawlers and simple clients now have repo-backed `robots` and `sitemap` files for all major public apps.
- Key public commerce, hiring, and learning detail pages now declare canonical URLs and machine-readable entity data where reliable.

## Limits still in place by design

- `marketplace`, `jobs`, and parts of `hub` still render through request-aware public shells because they currently mix public chrome with session-aware state.
- Property detail remains request-aware because save/inquiry/viewing continuity is part of the first-render truth for signed-in users.
- Booking, tracking, and similar transactional pages were not falsely forced static.

## Post-deploy verification targets

- Verify live `robots.txt` and `sitemap.xml` on every public subdomain.
- Verify canonical tags on:
  - home pages
  - marketplace product detail
  - property listing detail
  - jobs detail
  - learn course detail
  - studio public detail pages
- Verify search suggestion keyboard behavior and mobile filter dialog behavior in marketplace.
- Verify revalidated property/logistics routes still show meaningful first-render HTML and correct cached refresh behavior.
