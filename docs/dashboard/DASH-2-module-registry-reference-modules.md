# DASH-2 — Module Registry + 2 Reference Modules (Forged Prompt)

```
TOOL: Claude Code (Opus 4.7)
EFFORT: xhigh
PROJECT: HenryCo Ecosystem · henrycogroup.com · V2 active
PASS: V2-DASH-02 — Module registry + 2 reference modules
EXPECTED DURATION: Multi-day. Sequential gates. The contract validated here
                   constrains every later module port.

═══════════════════════════════════════════════════════
ROLE
═══════════════════════════════════════════════════════

Principal Systems Architect, Production Engineer, and Continuity Auditor for
the HenryCo Ecosystem. Opus 4.7. Self-verify against V1–V13 gate.

═══════════════════════════════════════════════════════
CONTEXT — read in this order BEFORE writing code
═══════════════════════════════════════════════════════

1. docs/dashboard/DASHBOARD-AUDIT-REPORT.md (full)
2. docs/dashboard/DASHBOARD-REBUILD-PROMPT-V2-FINAL.md (master)
3. docs/dashboard/DASH-1-shell-foundations-skeleton.md
4. .codex-temp/v2-dash-01/report.md (DASH-1 outputs — packages/auth,
   packages/dashboard-shell primitives, packages/data, get_signal_feed
   SQL function, shell skeleton on apps/account)
5. apps/account/lib/account-data.ts (the 1500-line cross-division
   aggregator — base for the customer-overview module port)
6. apps/account/lib/{jobs,learn,logistics,property,studio}-module.ts
   (existing per-division aggregators — the cross-division module pattern
   audit §A.15.1 calls out)
7. apps/marketplace/components/marketplace/* — every file flagged in
   audit §B.marketplace-7 for raw <img> + missing button states
8. apps/marketplace/lib/marketplace/data.ts (server data layer — module
   home widgets call into this)
9. .codex-temp/v2-cart-01/report.md (V2-CART-01 — marketplace module
   consumes @henryco/cart-saved-items)
10. .codex-temp/v2-docs-01/report.md (V2-DOCS-01 — invoices + receipts
    download CTA pattern, marketplace module surfaces relevant ones)
11. .codex-temp/v2-not-02-a/report.md (V2-NOT-02-A — notification
    primitives that customer-overview's NotificationBell consumes)

═══════════════════════════════════════════════════════
TRUTH HIERARCHY — enforce on every claim
═══════════════════════════════════════════════════════

CODE TRUTH, DEPLOYMENT TRUTH, LIVE TRUTH (see master §3 / DASH-1).
Every assertion cites file:line. No "should work."

═══════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════

Validate the module-registry contract on TWO modules end-to-end before
porting the remaining 8 in DASH-3. Deliverables:

1) Module registry mounted in shell

   packages/dashboard-shell/register.ts already shipped in DASH-1. Now:
   - apps/account/app/(account)/_shell.tsx (or layout.tsx) imports the
     registry via getEligibleModules(viewer).
   - WorkspaceRail renders entries from the registry, NOT a hardcoded list.
     The 4-division row in apps/account/app/(account)/page.tsx (audit
     §C.10 #4) is replaced by the rail.
   - WorkspaceSlot renders the active module's home or detail view.
   - Module deep routes mount via Next.js App Router parallel routes /
     [...module]/page.tsx (audit §A3 — avoids per-module file-system
     duplication).

2) Module #1 — customer-overview (packages/dashboard-modules-account/)

   Why first: the audit (§B.account) classifies the customer-overview as
   the strongest of the four existing dashboards, so it's the lowest-risk
   to port. Replicating it via the registry validates that the contract
   carries 8 metric cards + lifecycle + attention panel + quick actions
   + recent activity / notifications without regression.

   Audit anchor: §A.15.1, §B.account-1 through §B.account-12.

   Module manifest (every module ships these exports):
     getEligibleViewer(viewer): "allowed" | "hidden"
     getRoleGate(viewer): RoleDecision
     getHomeWidgets(viewer): Widget[]
     getRoutes(): RouteEntry[]
     getCommandPaletteEntries(viewer): PaletteEntry[]   (DASH-5 consumes)
     getNotificationCategories(): Category[]            (DASH-6 consumes)
     getEmptyTeaching(viewer): TeachingContent
     getDeepLinkTemplate(eventType): string

   Home widgets (port from existing surface):
     - WalletBalanceCard (live data via getDashboardSummary in
       packages/data)
     - UnreadNotificationsCard
     - ActiveSubscriptionsCard
     - TrustTierCard
     - InvoicesPendingCard         (consumes @henryco/branded-documents
                                    DownloadDocumentButton via the
                                    invoices/[invoiceId] CTA — V2-DOCS-01)
     - SupportOpenCard             (consumes @henryco/chat-composer for
                                    the support reply flow — V2-COMPOSER-01)
     - ReferralsCard
     - LifecycleContinuePanel      (already shipped via @henryco/lifecycle;
                                    promote to widget)
     - WelcomeBackSurface          (V2-CART-01 — surface saved-items +
                                    cart-recovery + recently-viewed)

   Each widget renders MetricCard / Panel / EmptyState / SignalCard from
   @henryco/dashboard-shell. NO custom card markup outside those primitives.

   Command palette entries (DASH-5 wires the surface, DASH-2 ships the
   manifest):
     - "Add money" → /modules/wallet/add
     - "Get help" → /modules/support/new
     - "View invoices" → /modules/invoices
     - "Update profile" → /modules/settings
     - "Open recently deleted" → /modules/notifications/recently-deleted

   Notification categories owned: account, wallet, security, identity,
                                 referral

   Empty state (audit anti-pattern #16 — typographic minimalism, no
   cartoons): "Your overview" kicker; headline names the next-best action
   based on lifecycle stage; single primary action.

   Replaces dead CTAs: NONE (the existing customer-overview is solid).
   The home page composition flips from the hardcoded division row to
   getEligibleModules(viewer).render().

3) Module #2 — marketplace (packages/dashboard-modules-marketplace/)

   Why second: audit §B.marketplace-7 flags the most concrete UX debt —
   raw <img>, missing button states, mobile workspace nav. Porting
   marketplace into the registry while applying DivisionImage and
   ActionButton proves the primitives clean up the audit findings.

   Audit anchor: §B.marketplace.

   Home widgets:
     - OrdersInFlightCard (status != delivered)
     - WishlistShortcut             (consumes @henryco/cart-saved-items)
     - SellerStatusCard             (vendor only — getRoleGate honors)
     - DealsOfTheMomentCard         (reads marketplace_deals_curation,
                                     ranked, real-data-only)

   Command palette entries:
     - "Search products" → /modules/marketplace/search
     - "View orders" → /modules/marketplace/orders
     - "Manage store" (vendor only — getRoleGate enforces) →
       /modules/marketplace/vendor
     - "Submit dispute" → /modules/marketplace/disputes/new
     - "Save for later" → invokes @henryco/cart-saved-items move-to-saved
     - "Open recently viewed" → /modules/marketplace/recently-viewed
     - "Download invoice" → opens DocumentDownloadDialog from
       @henryco/branded-documents

   Notification categories owned: marketplace.order, marketplace.dispute,
                                 marketplace.payout, marketplace.application,
                                 marketplace.moderation

   Empty state: "Discover premium sellers" kicker; "Curated deals worth
   your attention" headline; single action.

   Replaces (the audit-debt fixes that DASH-2 SHIPS — not deferred):
     - Every raw <img> in apps/marketplace/components/marketplace/{shell,
       cart-experience, product-media-gallery, cart-drawer,
       public-header-client, product-card-client}.tsx → DivisionImage.
       Verify by grep: 0 hits remain in apps/marketplace.
     - Every primary action button → ActionButton with idle/pending/
       disabled/spinner/success-lock states.
     - Vendor settings + onboarding pages get the migration too.
     - apps/marketplace/proxy.ts raw <img> reference (CSP entry)
       inspected — keep if it's a CSP allow-list, fix if a real <img> tag.

   Cart-experience and cart-drawer additionally consume
   @henryco/cart-saved-items SaveForLaterButton (V2-CART-01 §10 hand-off).

═══════════════════════════════════════════════════════
GATE STRUCTURE
═══════════════════════════════════════════════════════

G0 — Recon at .codex-temp/v2-dash-02/recon.md.
G1 — Module registry mounted in shell. WorkspaceRail reads from registry.
G2 — packages/dashboard-modules-account/ scaffolded with the 8 manifest
     exports. customer-overview content rendering through the registry.
G3 — packages/dashboard-modules-marketplace/ scaffolded. Marketplace home
     widgets render via the manifest.
G4 — DivisionImage migration on every raw <img> in apps/marketplace.
G5 — ActionButton migration on every primary action in apps/marketplace.
G6 — V2 primitive integration verified per master §5: chat-composer in
     customer-overview SupportOpenCard CTA flow, branded-documents in
     InvoicesPendingCard, cart-saved-items in WishlistShortcut +
     marketplace cart drawer.
G7 — Empty / loading / error / success states on every widget. Tested
     via Playwright fixture matrix (V10).
G8 — V1–V13 verification gate. V9 (CTA reality) is the headline check —
     every link/button on customer-overview + marketplace home traced.
G9 — Persisted report at .codex-temp/v2-dash-02/report.md.
G10 — PR opened. Title: feat(dashboard): DASH-2 module registry +
      customer-overview + marketplace reference modules.

═══════════════════════════════════════════════════════
ANTI-PATTERNS — applied to DASH-2
═══════════════════════════════════════════════════════

Master §4 is canonical. Subset for DASH-2:

From §4.1:
  #2 Raw <img> — DivisionImage everywhere.
  #3 Buttons without states — ActionButton everywhere.
  #4 Decorative tiles — every CTA verified LIVE (V9).
  #6 Hard-coded division services row — replaced by registry.
  #11 Migrating state-changing endpoints — UI rebuild only. The
      apps/marketplace API at /api/marketplace/* and /api/saved-items
      stays as-is.

From §4.2:
  #13 Emoji-as-icon — use the icon set.
  #14 Default tailwind/shadcn cards — Panel + MetricCard primitives.
  #15 Primary = blue — HenryCo black/gold/cream + division accents.
  #16 Friendly cartoon empty states — typographic minimalism.
  #17 "Welcome to your dashboard!" — content-first lead.
  #18 Metrics without context — comparison|trend prop required.
  #19 Role-agnostic UI — vendor sees more density than buyer (still
      consumer Track A; full owner separation is DASH-8).
  #20 Copy not in HenryCo voice — TODO V2-COPY-01 placeholders.

DO NOT:
- Port more than the two reference modules (account, marketplace).
- Touch packages/dashboard-modules-care (DASH-3 owns it).
- Migrate notifications UI from apps/account (DASH-6).
- Land Smart Home signal feed UI (DASH-4).
- Land Cmd+K palette UI (DASH-5) — palette ENTRIES land here in the
  manifest; the surface lands in DASH-5.
- Touch hub /owner — that's Track B / DASH-8.

═══════════════════════════════════════════════════════
VERIFICATION REQUIREMENT — DASH-2 gate
═══════════════════════════════════════════════════════

Per master §3:

V1 build/typecheck/lint  — PASS required.
V2 auth-continuity        — PASS required: shell still resolves the same
                           viewer per V2-AUTH-RT-01 contract.
V3 RLS verification        — PASS required: marketplace_orders,
                           marketplace_carts, marketplace_wishlists,
                           customer_invoices, support_threads — all
                           cross-tenant probed.
V4 Realtime smoke           — PARTIAL — DASH-6 wires the fan-out, but
                           DASH-2 verifies SupabaseRealtimeProvider
                           initializes without errors.
V5 Mobile parity           — PASS required at all 6 breakpoints
                           (320/375/390/430/768/1024) on customer-overview
                           and marketplace home.
V6 Lighthouse + CWV         — PASS required on / (account home with
                           registry) and /modules/marketplace.
V7 WCAG AA                  — PASS required on shell + account-overview
                           + marketplace.
V8 Sender identity          — PASS required.
V9 CTA reality              — PASS required — every clickable on the two
                           reference module homes traced. Specifically
                           verifies the audit's "Marketplace primary
                           actions need a tri-state pattern" finding is
                           closed by ActionButton migration.
V10 Empty / loading / error / success — PASS required on every widget.
V11 No console errors       — PASS required.
V12 No 4xx/5xx              — PASS required.
V13 Role × division coverage — PASS required: customer-only, customer-
                           active, customer-problem (audit §D.2) +
                           vendor variant of marketplace.

═══════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════

Persist at .codex-temp/v2-dash-02/report.md before merging:
  Files modified
  Packages added (2 new module packages)
  What was done
  How to verify
  Uncertainties
  Anti-pattern audit (every #2, #3, #4, #6, #11, #13–#20 listed
                     PASS/FAIL/N/A)
  Verification gate (V1–V13)
  CTA reality trace (Appendix A — every link/button on the 2 module
                    homes with file:line, destination, destination
                    existence cite)
  Classification: DASH-2-COMPLETE | DASH-2-PARTIAL | DASH-2-BLOCKED
  Hand-off: DASH-3 starts on which branch.

═══════════════════════════════════════════════════════
V2 SCOPE BOUNDARY
═══════════════════════════════════════════════════════

NOT permitted in DASH-2:
  - Modules beyond customer-overview + marketplace.
  - Smart Home signal-feed UI (DASH-4).
  - Cmd+K palette UI (DASH-5; manifest entries land here).
  - Realtime fan-out UI (DASH-6).
  - Mobile bottom action bar (DASH-7).
  - Owner Track B (DASH-8).
  - New API surfaces — module home widgets read existing API/DB.

═══════════════════════════════════════════════════════
PERSISTED-REPORT REQUIREMENT
═══════════════════════════════════════════════════════

  .codex-temp/v2-dash-02/recon.md
  .codex-temp/v2-dash-02/cta-trace.md      (every CTA, file:line)
  .codex-temp/v2-dash-02/report.md         (final)

═══════════════════════════════════════════════════════
END OF DASH-2 FORGED PROMPT
═══════════════════════════════════════════════════════
```

---

## Authoring notes

- **Why marketplace as the second module, not care.** Marketplace has the broadest user base and the most concrete UX debt (audit §B.marketplace-7). Fixing it via the new primitives is the most visible signal that the rebuild is real. Care has its own staff/(public) split (audit §A.17-1) that DASH-3 untangles; mixing it into DASH-2 risks dragging the contract validation into staff routing weeds.
- **Why DivisionImage + ActionButton migrations land here, not in DASH-1.** They land in DASH-1 as primitives, but the migration of the existing `apps/marketplace` surfaces happens here because that's where they get exercised under module-registry conditions. Doing it later means marketplace ships unfixed for an extra phase.
- **Why the registry replaces the hardcoded 4-division row in DASH-2.** The audit (§C.10 #4) calls this row out as a structural error. Once two modules are in the registry, the rail can replace it; deferring makes the registry's first PR look incomplete.
