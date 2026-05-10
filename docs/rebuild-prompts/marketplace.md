# MARKETPLACE — Division Rebuild Prompt (V3 PASS 21)

```
TOOL: Claude Code (Opus 4.7 · 1M context · xhigh effort)
PROJECT: HenryCo Ecosystem · henrycogroup.com
DIVISION: Henry & Co. Marketplace
LIVE DOMAIN: marketplace.henrycogroup.com
REPO: github.com/cbebot/Henry-Co
BRANCH: main (Vercel auto-deploy)
BACKEND: Supabase (single project, multi-app schema)
PASS: V3 PASS 21 — DIVISION REBUILD · MARKETPLACE
EXPECTED DURATION: Long. Marketplace is among the most complex
                   (~23.7k LOC, 7 app-local migrations, multi-vendor
                   commerce with the broadest persona surface). The
                   V5-2 hand-off explicitly named marketplace expansion
                   as the highest-priority V3 candidate (track T3.A).
```

═══════════════════════════════════════════════════════
ROLE
═══════════════════════════════════════════════════════

Principal product architect, division systems strategist, and
implementation engineer for HenryCo Marketplace. Ship code; self-verify
against V1–V13 + marketplace-specific gates.

═══════════════════════════════════════════════════════
SCOPE
═══════════════════════════════════════════════════════

Rebuild Marketplace end-to-end:

- Public surfaces (`marketplace.henrycogroup.com`)
- Buyer authenticated surface (in account.* + on marketplace.*)
- Vendor authenticated surface
- Operator surfaces (admin, moderation, finance, support, owner,
  operations)
- Supabase tables + RLS for marketplace
- APIs + crons + webhooks
- Marketplace-specific components

Out of scope: shared shell + cross-division packages; other divisions.

═══════════════════════════════════════════════════════
CONTEXT — read in this order
═══════════════════════════════════════════════════════

1. `docs/v3/V3-DISCOVERY-INVENTORY.md`
2. `docs/dashboard/DASHBOARD-REBUILD-PROMPT-V2-FINAL.md`
3. `packages/config/company.ts` — `COMPANY.divisions.marketplace`
   (accent `#B2863B`, accentText `#7E5E1F`)
4. `apps/marketplace/` — every existing route, lib, component
5. `apps/marketplace/supabase/migrations/*` — 7 migrations including
   `20260417160000_marketplace_pricing_breakdowns.sql`,
   `20260501010000_marketplace_deals_curation.sql`,
   `20260501020000_marketplace_seller_tiers.sql`,
   `20260505090000_marketplace_checkout_payment_completion.sql`
6. `packages/cart-saved-items/` (V2-CART-01 — marketplace MUST consume)
7. `packages/pricing/` (marketplace pricing engine truth)
8. `packages/branded-documents/` — `MarketplaceInvoice`, `Receipt`,
   `TransactionHistory` shipped
9. V5-2 hand-off §1 — marketplace expansion phasing A→E (read for
   discovery + ranking + density variants)
10. `apps/marketplace/.env.*.pulled` cleanup pending (V5-3 §12)

═══════════════════════════════════════════════════════
AUDIT SUMMARY — current state at SHA `e5e277a`
═══════════════════════════════════════════════════════

### Routes shipped (public)
- `/` (home), `/search`, `/category/[slug]`, `/collections/[slug]`,
  `/product/[slug]`, `/store/[slug]`, `/brand/[slug]`
- `/cart`, `/checkout`, `/pay/[orderNo]`, `/track/[orderNo]`
- `/deals`, `/sell`, `/sell/pricing`, `/trust`, `/help`,
  `/policies/[slug]`

### Routes shipped (buyer)
- `/account` (overview), `/account/orders`, `/account/orders/[orderNo]`
- `/account/saved`, `/account/wishlist`, `/account/following`
- `/account/payments`, `/account/wallet`
- `/account/addresses` (V2-ADDR-01 ✓)
- `/account/notifications`, `/account/support`
- `/account/reviews`, `/account/disputes`
- `/account/seller-application` (start, verification, review)

### Routes shipped (vendor)
- `/vendor` (overview), `/vendor/products`, `/vendor/products/new`,
  `/vendor/products/[id]`
- `/vendor/orders`, `/vendor/orders/[groupId]`
- `/vendor/payouts`, `/vendor/disputes`, `/vendor/analytics`
- `/vendor/onboarding`, `/vendor/settings`

### Routes shipped (operator)
- `/admin` + `/admin/[resource]`
- `/finance` + `/finance/[resource]`
- `/moderation` + `/moderation/[resource]`
- `/operations` + `/operations/[resource]`
- `/owner` + `/owner/[resource]`
- `/support` + `/support/[resource]`

### API routes
- `/api/auth/logout`, `/api/locale`
- `/api/marketplace` (umbrella)
- `/api/orders`, `/api/cart`, `/api/products`,
  `/api/products/suggest`
- `/api/saved-items` (V2-CART-01)
- `/api/wishlist`, `/api/follows`
- `/api/seller-applications`, `/api/seller-applications/documents`
- `/api/cron/marketplace-automation`
- `/api/health`, `/api/readiness`, `/api/version`, `/api/shell`

### Database
- 7 app-local migrations (init, policies, events + application state,
  pricing breakdowns, deals curation, seller tiers, checkout payment
  completion)
- Tables: `marketplace_products`, `marketplace_orders`,
  `marketplace_order_items`, `marketplace_carts`, `marketplace_stores`,
  `marketplace_vendors`, `marketplace_seller_applications`,
  `marketplace_deals`, `marketplace_seller_tiers`, `marketplace_reviews`,
  `marketplace_disputes`, etc. (verify via migration read)

### Existing strengths
- Most complete commerce stack of any division
- 3-step bespoke checkout (V2-CART-01)
- Save-for-later + welcome-back surface in account (V2-CART-01)
- Pricing breakdowns persisted (V2 shared pricing governance)
- Branded invoices + receipts + transaction-history PDFs (V2-DOCS-01 ✓)
- Cross-tab cart sync via BroadcastChannel
- Seller application flow with KYC

### Known gaps and bugs
- **Discovery / ranking** — V5-2 hand-off named this as the highest-leverage
  V3 area. Search is functional but: no faceted filter polish, no map
  for local sellers, no "for you" rail, no editorial curation surface,
  no density variant (compact list view + grid view), no recently-viewed
  rail on home (V2-CART-01 has the data; surface missing).
- **`.env.*.pulled` files** — V5-3 §12 cleanup pending (V3 ops).
- **Search palette** not mounted (V3 H1).
- **HenryCoHeroCard** consumed (V2-HERO-01 ✓ via marketplace home rework).
- **Notifications-ui** wired in account; verify on marketplace shells.
- **Vendor onboarding** flow — needs polish; KYC + bank account + tax
  + storefront branding.
- **Vendor analytics** — needs revenue + conversion + traffic + top
  products + customer demographics.
- **Vendor product editor** — needs premium polish: rich description,
  multi-photo upload (Cloudinary, reorder, alt text), variant matrix
  (color × size × etc.), inventory + low-stock alerts, SEO fields,
  per-region pricing.
- **Order management for vendor** — needs bulk actions, fulfilment status
  flow, return + refund flow.
- **Disputes** — both buyer and vendor surfaces exist; mediation by
  staff is the gap.
- **Reviews** — collection exists; needs photo-review + verified-purchase
  badge + helpful vote.
- **Wishlist** vs **Saved-for-later** — currently both exist; consolidate
  semantics (saved-for-later = cart-paused; wishlist = aspirational with
  notify-on-price-drop).
- **`<DivisionImage>`** — audit §B.marketplace-7 named raw `<img>` as a
  problem; verify migration to `<DivisionImage>` is complete.
- **Buttons without states** — audit §B.marketplace-7 explicit finding;
  verify `<ActionButton>` consumption.
- **Mobile checkout** — needs polish (single-thumb operability).
- **Offline cart** — saved-items expiry sweep exists (V2-CART-01); no
  offline cart yet (PWA cache).
- **Recommendation engine** — no "customers also bought", "similar
  items", "trending in your area" rails.

### Cross-division
- Hub directory → marketplace ✓
- Account `?module=marketplace` ✓
- Marketplace checkout → logistics pickup integration (V3 gap)
- Vendor verified → could feed jobs employer trust (V3 gap)

═══════════════════════════════════════════════════════
DEEP AUDIT FINDINGS
═══════════════════════════════════════════════════════

| Dimension | Finding |
|---|---|
| **IA** | Strong public + buyer + vendor + operator surfaces. Discovery is the largest IA gap (no editorial layer above categories). |
| **Flow logic** | Browse → Cart → Checkout → ✓ (V2-CART-01); Pay → Track → ✓; Review → ⚠ (no photo); Dispute → ⚠ (mediation thin); Vendor onboard → ⚠ (polish); Vendor fulfilment → ⚠ (polish). |
| **Cross-division** | Marketplace → logistics pickup is the highest-leverage cross-div integration. |
| **Empty / loading / error** | Inconsistent across vendor + operator surfaces. |
| **Competitor parity** | Amazon / Etsy / Shopify / Faire / Mercado Libre / Jumia — best in class on: faceted search, recommendation rails, trust badges, reviews with photos, vendor analytics, payout rails, dispute mediation, return flows. Multiple gaps. |
| **Trust / payment / dispute** | Pricing transparent + breakdowns persisted ✓. Payment via `@henryco/payment-surface`. Dispute exists; mediation thin. |
| **Mobile** | Checkout adequate; vendor product editor poor on mobile. |
| **Accessibility** | Per-route axe pending. Audit §B.marketplace-7 has explicit findings (raw img, button states). |
| **Performance** | Image-heavy product detail; verify `<DivisionImage>` everywhere. |
| **SEO** | `Product` JSON-LD MUST be present on product detail. `Offer` + `AggregateRating`. |
| **Localization** | Foundation strings ✓; product titles + descriptions user-content; multi-currency via V2 currency foundation. |
| **Data adequacy** | Likely missing: `marketplace_product_variants` (variant matrix), `marketplace_inventory_movements`, `marketplace_returns`, `marketplace_refunds`, `marketplace_reviews_photos`, `marketplace_recommendation_signals`. |

═══════════════════════════════════════════════════════
MANDATORY REBUILD SCOPE
═══════════════════════════════════════════════════════

### A. Public surfaces

1. **`/` (home)** — `<HenryCoHeroCard>` marketplace accent. Above-the-fold:
   curated editorial rail (`marketplace_curated_collections` —
   already exists per `marketplace_deals_curation.sql`), top categories
   tiles, capability evidence (vendor count, items shipped this week,
   buyer protection chip). Below: trending, recently-viewed
   (`recently_viewed_items` from V2-CART-01), for-you rail (if signed
   in), top vendors.
2. **`/search`** — premium search results with: faceted filters
   (category, price range, brand, vendor, rating, ships from, in-stock),
   sort, infinite scroll OR paginated (decide), grid + list toggle, save
   search.
3. **`/category/[slug]`, `/collections/[slug]`** — premium category +
   collection pages with editorial header.
4. **`/product/[slug]`** — premium product detail with `Product` +
   `Offer` + `AggregateRating` JSON-LD. Sections: photo gallery (full
   screen + zoom), variant selector (color × size matrix), price (with
   per-variant), buy box (Add to cart, Save, Wishlist), description,
   specs, reviews (with photos + verified-purchase + helpful vote),
   "Customers also bought", "Similar items", vendor card.
5. **`/store/[slug]`** — vendor storefront with branding, products grid,
   reviews, follow button.
6. **`/brand/[slug]`** — brand landing.
7. **`/cart`** — premium cart with: line items, save-for-later panel
   (V2-CART-01), recently-viewed rail, suggested add-ons, gift options,
   total breakdown.
8. **`/checkout`** — bespoke 3-step (V2-CART-01) — keep at premium
   quality. Steps: Address (`<AddressSelector>`) → Shipping +
   Payment (`@henryco/payment-surface`) → Review.
9. **`/pay/[orderNo]`, `/track/[orderNo]`** — keep with shared
   primitives.
10. **`/deals`** — curated deals page (consumes
    `marketplace_deals_curation` data).
11. **`/sell`, `/sell/pricing`** — vendor onboarding landing with
    capability evidence + tier matrix.
12. **`/trust`, `/help`, `/policies/[slug]`** — editorial premium pages.

### B. Buyer authenticated surface

`account.henrycogroup.com/?module=marketplace` (separate package
`@henryco/dashboard-modules-marketplace`):

- **Overview** — active orders, recent purchases, saved-for-later,
  recently-viewed (V2-CART-01)
- **Orders** — list + detail with reorder + return + refund + dispute
  CTAs; download invoice PDF (V2-DOCS-01)
- **Saved + wishlist** — consolidated; "Notify on price drop" toggle on
  wishlist
- **Following** — followed vendors + brands
- **Reviews** — written + drafts; photo upload
- **Disputes** — list + thread with vendor + staff mediator
- **Wallet** — balance, top-up, transactions
- **Payments** — saved methods, payment history
- **Addresses** — `<AddressSelector>` list (V2-ADDR-01)
- **Notifications** — wired via `@henryco/notifications-ui`
- **Settings** — privacy, notification preferences
- **Seller-application entry** — link to start application

The standalone `marketplace.*/account/*` routes either redirect to
account.* or remain as thin shells.

### C. Vendor authenticated surface

`account.henrycogroup.com/?module=vendor` (separate package
`@henryco/dashboard-modules-vendor` — NEW since vendor is a distinct
persona in marketplace):

- **Overview** — today's orders, revenue, conversion, top products,
  pending fulfilment count, low-stock alerts, payout status
- **Products** — list with filters; "New product" creator with: title,
  description (rich editor), category, photos (multi-upload + reorder
  + alt text), variants (matrix builder), pricing (with per-region),
  inventory, SEO fields, shipping options, return policy
- **Orders** — list with status, fulfilment CTAs (mark-as-shipped,
  upload tracking, mark-as-delivered), bulk actions
- **Order group detail** — multi-item order with line-by-line fulfilment
- **Returns + refunds** — incoming return requests, approve/reject,
  issue refund via `@henryco/payment-surface`
- **Disputes** — vendor side with mediator chat
- **Payouts** — earnings + payout history; tax docs (1099-equivalent)
  download via `@henryco/branded-documents`
- **Analytics** — revenue trend, conversion funnel, traffic sources,
  top products, customer demographics, search keywords
- **Storefront branding** — logo, banner, theme, "About us"
- **Settings** — bank account, tax profile, return policy template,
  notification preferences

### D. Operator surfaces

- **Admin** — taxonomy (categories, brands, attributes), feature flags,
  cron health
- **Moderation** — flagged products, flagged reviews, vendor verification
  queue
- **Finance** — platform revenue, vendor payout queue, refund queue,
  reconciliation
- **Operations** — exception orders (delayed, lost, stuck), stale
  inventory alerts
- **Support** — `@henryco/messaging-thread` for buyer + vendor support
- **Owner** — strategic dashboard

All consume `@henryco/workspace-shell`.

### E. Database

Add app-local migrations:

1. `<TS>_marketplace_product_variants.sql` — `marketplace_product_variants`
   (product_id, variant_attributes jsonb, sku, price_minor, inventory_qty,
   image_id fk).
2. `<TS>_marketplace_inventory_movements.sql` — inventory ledger.
3. `<TS>_marketplace_returns.sql` — return request flow.
4. `<TS>_marketplace_refunds.sql` — refund ledger.
5. `<TS>_marketplace_review_photos.sql` — review photos with moderation
   status.
6. `<TS>_marketplace_recommendation_signals.sql` — co-purchase, co-view
   signals for "customers also bought".
7. `<TS>_marketplace_curated_collections.sql` — verify exists from V1
   curation migration; if not, add for editorial home rails.
8. `<TS>_marketplace_realtime_publication.sql` — orders + disputes +
   inventory alerts to Realtime.

All migrations on Supabase preview branch first; RLS verified
(buyer-can-read-own, vendor-can-read-own-store, staff all).

### F. APIs and crons

- Audit + extend `/api/marketplace`, `/api/products`, `/api/cart`,
  `/api/orders` for completeness.
- New: `POST /api/marketplace/returns`
- New: `POST /api/marketplace/refunds` (staff + vendor approval flow)
- New: `POST /api/marketplace/reviews/photos` (Cloudinary upload)
- New: `POST /api/marketplace/payouts/request` (vendor → finance queue)
- New: `GET /api/marketplace/recommendations/[product]`
- Cron: extend `/api/cron/marketplace-automation`:
  - Recompute recommendation signals nightly
  - Send abandoned-cart reminders (per V2-CART-01)
  - Send price-drop alerts on wishlist
  - Send low-stock alerts to vendors
  - Send payout-ready alerts
  - Send review prompts (3 days after delivery)
- Clean up `apps/marketplace/.env.*.pulled` (V5-3 §12 — `git rm`
  + commit).

### G. Components

Reuse cross-division primitives. Build (marketplace-specific):
- `<ProductCard>`, `<ProductGrid>`, `<ProductDetail>`
- `<VariantMatrix>` (color × size selector with dynamic price/inventory)
- `<PhotoGallery>` with full-screen zoom
- `<BuyBox>` (Add to cart, Save, Wishlist with state)
- `<CartDrawer>`, `<CheckoutFlow>` (3-step bespoke)
- `<ReviewWithPhotos>`, `<ReviewSubmitForm>`
- `<RecommendationRail>` ("Customers also bought", "Similar")
- `<EditorialRail>` (curated collections)
- `<RecentlyViewedRail>` (V2-CART-01 data)
- `<FollowVendorButton>`
- `<VendorProductEditor>` (multi-step product creator/editor)
- `<VendorAnalyticsDashboard>`
- `<DisputeThread>` (uses `@henryco/messaging-thread`)
- `<ReturnRequestFlow>`, `<RefundRequestFlow>`

### H. External integrations

- **Cloudinary** — product photos, vendor brand assets, review photos
- **Resend** — order confirmations, shipped, delivered, review prompts
- **WhatsApp** (optional) — order updates
- Pricing engine via `@henryco/pricing` (truth)
- Search via Typesense (V2-SEARCH-01) — index `marketplace_products`,
  `marketplace_stores`, `marketplace_brands` (V3 H1)

### I. Crons + observability

- `/api/cron/marketplace-automation` instrumented + Sentry. Idempotent.

═══════════════════════════════════════════════════════
UNIFORMITY RULES
═══════════════════════════════════════════════════════

(Same matrix; see `docs/rebuild-prompts/logistics.md` § "UNIFORMITY
RULES". Marketplace-specific: `MarketplaceInvoice`, `Receipt`,
`TransactionHistory` already in `@henryco/branded-documents`. Add
`VendorPayoutStatement` + `VendorTaxDocument` templates.)

ALL master `DASHBOARD-REBUILD-PROMPT-V2-FINAL.md` §4.1 + §4.2
anti-patterns apply. Marketplace audit findings are explicit:

- Raw `<img>` (audit §B.marketplace-7) — `<DivisionImage>` mandatory
- Buttons without states (audit §B.marketplace-7) — `<ActionButton>`
  mandatory
- No "Welcome back!" — content-first lead
- Use marketplace accent `#B2863B`; never default blue

═══════════════════════════════════════════════════════
DISTINCTIVE RULES — WHAT MARKETPLACE MUST BUILD
═══════════════════════════════════════════════════════

1. **Variant matrix** — color × size × material; only marketplace has
   this shape.
2. **Cart with save-for-later + wishlist + recently-viewed** — only
   marketplace needs this density (V2-CART-01).
3. **Multi-vendor checkout** — single cart can split across vendors;
   per-vendor shipping + payout splits.
4. **Vendor analytics suite** — only marketplace.
5. **Returns + refunds** — first-class; only marketplace + property
   need refund.
6. **Reviews with photos + verified-purchase + helpful vote** — only
   marketplace.
7. **Recommendation engine** — co-purchase + co-view signals; only
   marketplace needs at this density.
8. **Editorial curation** — `marketplace_curated_collections` for
   home + deals.
9. **Vendor payout + tax docs** — only marketplace + studio (studio
   uses different shape — see studio prompt).

═══════════════════════════════════════════════════════
COMPETITOR BENCHMARK
═══════════════════════════════════════════════════════

- **Amazon** — best-in-class for catalogue density + recommendations
- **Etsy** — best-in-class for vendor branding + storefronts
- **Shopify** — best-in-class for vendor analytics + product editor
- **Faire** — best-in-class for B2B wholesale (analogue if marketplace
  expands wholesale)
- **Mercado Libre / Jumia** — best-in-class for regional emerging-market
  marketplace (closest analog for HenryCo's geographic footprint)

The bar: a buyer at `account.henrycogroup.com/?module=marketplace` and
a vendor at `account.henrycogroup.com/?module=vendor` should both feel
they are using premium-quality products in their persona. Specifically
the vendor experience should match Shopify's polish.

═══════════════════════════════════════════════════════
TRUST, PAYMENT, COMPLIANCE
═══════════════════════════════════════════════════════

- Payment via `@henryco/payment-surface`; pricing breakdown row
  pre-payment (V2 governance).
- Multi-currency: per V2 currency foundation; settlement currency
  defined per vendor.
- Vendor onboarding KYC + bank verification + tax profile mandatory
  before payout.
- Buyer protection: dispute window (60 days post-delivery); refund
  before payout if dispute resolved in buyer favor.
- Audit log on every vendor product publish + every refund.
- Cart abandonment + saved-items expiry sweep (V2-CART-01) running.
- Recently-viewed retention per `data-retention-and-delete-readiness.md`.

═══════════════════════════════════════════════════════
MOBILE AND DESKTOP
═══════════════════════════════════════════════════════

- 320/375/390/430/768/1024 px.
- Product detail mobile: full-bleed photo carousel with swipe; sticky
  bottom buy box.
- Checkout mobile: single-step-per-screen, sticky bottom CTA.
- Vendor product editor mobile: usable on tablet (768+); on phone, gate
  to "Open on tablet/desktop for best experience" but allow basic edits.
- Cart mobile: full-screen; save-for-later in collapsible panel.

═══════════════════════════════════════════════════════
LOCALIZATION
═══════════════════════════════════════════════════════

- `@henryco/i18n` foundation only.
- Product titles + descriptions: user content; render in original
  locale.
- Currency: per V2 multi-currency foundation; user-preferred currency
  with FX rate snapshot at price display time.
- RTL verified.

═══════════════════════════════════════════════════════
VALIDATION GATE — V1 through V13 + marketplace-specific
═══════════════════════════════════════════════════════

V1–V13 from master §3. Marketplace-specific:

- **M1** — `<DivisionImage>` everywhere; `grep -r "<img " apps/marketplace/`
  returns 0 hits (or only documented allowlisted raw-img sites).
- **M2** — `<ActionButton>` with idle/pending/disabled/spinner/success-lock
  on every clickable.
- **M3** — Variant matrix: changing variant updates price + inventory
  + photo without page reload.
- **M4** — Multi-vendor cart: split-shipping calculation correct;
  per-vendor payout split correct.
- **M5** — Save-for-later + wishlist + recently-viewed semantics
  preserved (V2-CART-01 hand-off compliance).
- **M6** — Cart-recovery: abandoned cart resumes on next sign-in
  (V2-CART-01).
- **M7** — Refund: vendor approval triggers `@henryco/payment-surface`
  refund; audit_log written; buyer notified.
- **M8** — Review with photos: max 5 photos per review, ≤ 10 MB each;
  photo moderation queue populated.
- **M9** — `Product` + `Offer` + `AggregateRating` JSON-LD valid on
  every product detail.
- **M10** — `apps/marketplace/.env.*.pulled` files removed (V5-3 §12).

═══════════════════════════════════════════════════════
DEPLOYMENT
═══════════════════════════════════════════════════════

1. Branch `feat/v3-pass-21-marketplace`.
2. Migrations on Supabase preview branch first.
3. PR with V1–V13 + M1–M10 PASS table.
4. Vercel preview live-checked.
5. Merge → `marketplace.henrycogroup.com`.
6. Persist report at `.codex-temp/v3-pass-21-marketplace/report.md`.

═══════════════════════════════════════════════════════
FINAL REPORT
═══════════════════════════════════════════════════════

Sections same shape as logistics: H0 recon, files modified, migrations,
V1–V13 + M1–M10 gate table, anti-pattern audit, mobile parity,
Lighthouse + CWV, a11y audit, hand-off, final classification.

═══════════════════════════════════════════════════════
SELF-VERIFICATION CHECKLIST
═══════════════════════════════════════════════════════

- [ ] Public surfaces in §A rebuilt with `Product`/`Offer`/`AggregateRating`
      JSON-LD
- [ ] Buyer surface in §B unified through account.* `?module=marketplace`
- [ ] Vendor surface in §C built as `?module=vendor` (new package)
- [ ] Operator surfaces in §D
- [ ] Migrations in §E applied with RLS verified (variant matrix,
      returns, refunds, review photos, recommendations)
- [ ] APIs in §F shipped with idempotency + observability
- [ ] Components in §G built reusing primitives
- [ ] `<DivisionImage>` everywhere; `<ActionButton>` everywhere
- [ ] V2-CART-01 semantics preserved (save-for-later, recently-viewed,
      cart-recovery, abandonment)
- [ ] V2-DOCS-01 templates: existing 3 + new VendorPayoutStatement +
      VendorTaxDocument
- [ ] Multi-currency: per-vendor settlement currency with FX snapshots
- [ ] `.env.*.pulled` files removed
- [ ] Mobile parity at 6 breakpoints
- [ ] i18n: every string under a key; RTL renders
- [ ] V1–V13 + M1–M10 PASS or N/A with justification
- [ ] Final report persisted
- [ ] PR opened with PASS table in body
