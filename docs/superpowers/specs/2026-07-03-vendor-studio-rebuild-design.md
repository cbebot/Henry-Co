# Vendor Studio rebuild — design (approved 2026-07-03)

Owner directive: rebuild the marketplace vendor workspace from scratch to a global standard —
direct uploads instead of image-URL fields, fix the light-theme navigation, and leave nothing
half-done. New pages AND new server actions; the audited security/moderation invariants are
carried into the new actions, never reinvented.

## Audit evidence (4-scout sweep, 2026-07-03)

- **Light-theme nav bug (root cause):** the mobile workspace menu (`workspace-mobile-nav.tsx`)
  renders a `BottomSheet` that portals to `document.body` — OUTSIDE the `.market-workspace-light`
  scope that `vendor/layout.tsx` applies. Inside the portal, `--market-*` tokens resolve to the
  dark `:root` base (near-white ink) on the sheet's white `--home-sheet` surface → invisible
  (~1.04:1). The public header fixed this exact class by re-wrapping portal children in scope
  (`public-header-client.tsx:491`). Desktop sidebar is unaffected.
- **Image-URL fields:** exactly two — `products/new/page.tsx:120` and `products/[id]/page.tsx:114`
  (`image_url` text input) → `vendor_product_upsert` writes `marketplace_product_media.url`.
  `marketplace_vendors.hero_image_url` and `marketplace_brands.logo_url` exist but are un-editable.
- **Upload infra to reuse:** `@henryco/media` (`createSupabaseMediaStore`, `media://` refs that
  drop into existing string url columns — no schema change), marketplace's private documents
  bucket + upload route + wizard pattern, property's PUBLIC image bucket template
  (`uploadPropertyMedia`, bucket `{public:true}`), care's `ImageFileField` dropzone UI.
- **Workspace health:** 13 routes; 3 orphaned (onboarding, intelligence, orders/[groupId]);
  systemic half-i18n (titles/descriptions/placeholders hardcoded); no `navGroups` (mobile drawer
  = one flat group labeled by a hardcoded "Workspace"); no empty states on any list; payouts uses
  a raw `<form method=POST>` with zero feedback; no error boundaries; overview shows different
  balance math than payouts; analytics renders `.length` counts. The messages sub-tree is the
  healthy reference pattern.
- **Pipeline to preserve (compose, don't reinvent):** `resolveVendorProductUpsert` (slug-takeover
  guard), vendor role gate + scope no-fallback, `evaluateListingSubmission` (quality/risk),
  `moderateListing` gate, upsert on slug + media write.

## Design

### Foundation
1. `vendorWorkspaceNav()` (navigation.ts): returns `{nav, navGroups}` — groups Storefront
   (Overview, Products, Store) / Sales (Orders, Messages, Disputes) / Money (Payouts, Analytics)
   / Trust (Settings, Intelligence flag-gated). All labels through `translateSurfaceLabel`.
2. Theme fix at the root: `workspace-mobile-nav.tsx` re-wraps the BottomSheet children in the
   workspace's own scope class (new optional `scopeClassName` prop; vendor+account pass
   `market-workspace-light`) — the proven public-header pattern. Also: translate the group
   fallback label, normalize the trigger pill to light-surface tokens, delete the stale
   globals.css comment claiming /vendor is noir.
3. Media pipeline: `MARKETPLACE_IMAGE_BUCKET = "marketplace-images"` (public) +
   `MARKETPLACE_IMAGE_RULE` (jpeg/png/webp, 8MB) + `uploadMarketplaceImage(pathPrefix, file)` +
   `resolveMarketplaceImageUrl(value)` (media:// or legacy absolute passthrough) in
   `lib/marketplace/media.ts`; authed vendor-scoped POST route `/api/marketplace/images`;
   client `ImageUploadField` (dropzone, preview, replace/remove, hidden input carries the
   `media://` ref into the form post — actions stay form-based).
4. `/vendor/error.tsx` + `/vendor/not-found.tsx`.
5. `formatVendorMoney(kobo, locale)` — the single money-display seam every vendor page uses
   (future local-currency billing plugs in here).

### Pages (13 → 11)
- **Overview**: hero slot (balance + next action), balances split identically to payouts
  (releasable / held / awaiting auto-release), first-run checklist absorbed from the orphan
  onboarding route (route deleted → redirect to /vendor), trust + coaching as separate sections.
- **Products list/new/edit**: sectioned forms (Essentials / Media / Pricing & stock /
  Fulfillment), `ImageUploadField` replaces both `image_url` inputs, quality/risk as human
  guidance copy, empty states, AI draft + Henry Onyx Verified panels kept.
- **Orders**: rows link to the fulfillment detail (orders/[groupId] becomes the real detail:
  timeline + update form); humanized, translated statuses; empty state.
- **Payouts**: proper pending/success/error action form; balances consistent with overview.
- **Store**: + hero/logo uploads (columns exist). **Settings**: clean sections.
- **Disputes / Analytics**: i18n + empty states; analytics derived from real order data
  (revenue, top products, dispute rate) instead of `.length`.
- **Messages**: already healthy; chrome aligned only.
- Every string through `translateSurfaceLabel`; enum labels humanized + translated.

### New server actions
`lib/marketplace/vendor/actions.ts` ("use server"): `vendorProductUpsertAction`,
`vendorStoreUpdateAction`, `vendorPayoutRequestAction` — new code composing the preserved
guards above, same table writes, `media://` refs stored in the existing url columns. Client
`VendorActionForm` (useActionState) gives every mutation pending/success/error feedback.
The legacy `/api/marketplace` intents stay untouched for non-vendor surfaces.

### Delivery stages (branch shippable after each)
A. Foundation (nav groups + theme fix + media pipeline + upload field + boundaries + money seam)
B. Products trio on new actions + uploads
C. Money pages (overview hero, payouts, orders + detail)
D. Store/settings/disputes/analytics + orphan cleanup + full gate sweep
   (typecheck/lint/build, i18n:strict with refreshed baseline, tone, both-themes Playwright
   proof desktop + mobile).
