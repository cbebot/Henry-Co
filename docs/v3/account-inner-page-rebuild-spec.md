# Customer Account Dashboard — Per-Page Rebuild Spec

**Pass:** ACCOUNT-PREMIUM-01 · Session 2/3 hand-off · Phase 4 deliverable
**Audience:** Engineers picking up ACCOUNT-PREMIUM-01 session 2 / session 3.
**Companion docs:**
- Audit (`docs/v3/account-inner-page-audit-2026-05-23.md`) — per-page scores + gaps + rank
- Design language (`docs/v3/account-design-language.md`) — interaction grammar + primitive contracts
- Primitives (`packages/dashboard-shell/src/surfaces/`) — six primitives shipped session 1

This document gives ONE mini-spec per remaining page. Each spec is short by design — the rebuild engineer reads it, looks at the primitive contracts, and ships. The pattern is the same across pages; the details differ.

## Mini-spec template

Every spec covers:
- **Purpose** — one sentence.
- **Hero algorithm** — where the headline data comes from + state picker.
- **Next-step picker** — what action to surface (when applicable).
- **Primitive composition** — which `<HeroCard variant>` + companions.
- **Data fetcher contract** — what server function returns what shape (already exists in most cases).
- **Empty state** — what `<EmptyStateCard>` says + does.
- **Error state** — default → V3-10 `error.tsx` fallback.

---

## /marketplace — Marketplace landing

- **Purpose:** the customer's view of their HenryCo Marketplace life — orders, disputes, application status, payouts, recent activity.
- **Hero algorithm:** state picker in `apps/account/components/marketplace/helpers.ts:heroState`. States: `empty | calm | active | activeOrders | activePayouts | attention`. Headline templates already localised in `accountCopy.divisionMarketplace.hero.state.*`.
- **Next-step picker:** when `stats.openDisputes > 0`, surface "Resolve dispute · {description}" via `<NextStepRow tone="attention">`. When `stats.payoutsPending > 0`, surface "Approve payout · {amount}".
- **Primitive composition:**
  - `<HeroCard variant="paired" tone={...}>` — eyebrow `copy.hero.eyebrow`, tiles for orders / in-flight / disputes / payouts, side with breakdown.
  - `<NextStepRow>` — only when matters present.
  - `<DivisionLanding sections>` — Matters / Orders / Activity.
- **Data fetcher:** `getMarketplaceDivisionSummary(user.id)` returns `{ orders, disputes, application, memberships, payouts }` — typed. Activity via `getDivisionActivity(user.id, "marketplace", 20, locale)`.
- **Empty state:** `EmptyStateCard` per section. Orders empty → "No orders yet · Browse marketplace.henrycogroup.com". Disputes empty handled within Matters block (don't render empty).
- **Error state:** V3-10 `error.tsx` already exists; preserve.
- **Effort:** M (mechanical swap of `<MarketplaceHero>` → `<HeroCard>`; existing copy keys all reused).

---

## /jobs — Jobs candidate surface

- **Purpose:** applications, saved roles, profile readiness, recruiter signal.
- **Hero algorithm:** state derives from `applications.length + saved.length + data.profile.trustScore`. The hero shows applications + saved + profile score + recruiter updates as 4 tiles. **Use the HeroCard `progress` prop** to render the profile-readiness percent below the tiles — this is what the `progress` slot was designed for.
- **Next-step picker:**
  - When `applications.length === 0 && saved.length === 0` → "Browse roles" CTA in hero.
  - When `applications.length > 0` with stage `awaiting_response` → "Update application · {role}" via NextStepRow.
  - When profile score < 50 → "Complete your profile · {N} items left" via NextStepRow.
- **Primitive composition:**
  - `<HeroCard variant="paired" progress={{ percent: trustScore, label: copy.profileLabel }} />`
  - `<NextStepRow>` for the highest-ranked of the above three.
  - Sections: Active applications, Readiness & shortlist (preserve current 2-column).
- **Data fetcher:** `getJobsModuleData(user.id)` — typed. Preserve.
- **Empty state:** ApplicationsList empty → "No live applications yet — apply to a saved role or browse fresh ones." (already in jobs slice).
- **Error state:** V3-10.
- **Effort:** M.

---

## /studio — Studio briefs + projects

- **Purpose:** active projects, payments, proposals, activity.
- **Hero algorithm:** state from `studioStats({ projects, payments, proposals })` in `apps/account/components/studio/helpers.ts`. States: `empty | calm | active | attention` (already implemented).
- **Next-step picker:** highest-priority project's `nextAction` (already computed server-side as `p.nextAction`). Wire as `<NextStepRow>`.
- **Primitive composition:**
  - `<HeroCard variant="paired">`.
  - `<NextStepRow>` for top project's next action.
  - Sections: Projects, Payments, Activity.
- **Data fetcher:** `getStudioDashboardData(user.id, user.email)`. Preserve.
- **Empty state:** EmptyStateCard with `studioCopy.empty.projectsTitle / body`.
- **Error state:** V3-10.
- **Effort:** M.

---

## /learn — Learn enrolment + progress

- **Purpose:** active courses, completed courses, certificates, assignments, saved, teacher application, activity.
- **Hero algorithm:** state from `learnStats(...)`. Use HeroCard `progress` slot for the overall completion %. Tile row: active / completed / certificates / saved.
- **Next-step picker:** if any active course has `quizState === "due"` → "Take quiz: {course}" NextStepRow. Else if `assignments.length > 0` → "Start assigned learning: {course}". Else if `savedCourses.length > 0 && active === 0` → "Resume saved: {course}".
- **Primitive composition:**
  - `<HeroCard variant="paired" progress={overallPercent} />`.
  - `<NextStepRow>` from picker above.
  - Sections: Courses, Extras (certificates / assignments / saved / teaching), Activity.
- **Data fetcher:** `getLearnAccountSummary(user.id, user.email)`. Preserve.
- **Empty state:** Use existing copy.
- **Effort:** M.

---

## /property — Property saved + inquiries

- **Purpose:** saved properties, viewing requests, inquiries, listing activity.
- **Hero algorithm:** state from `propertyStats(...)`. Tiles: saved / inquiries / viewings / managed-by-HenryCo.
- **Next-step picker:** if `inquiryCount > 0 && saved.length > 0` → "Follow up on inquiry: {address}".
- **Primitive composition:**
  - `<HeroCard variant="paired">`.
  - Sections: Saved gallery, Activity.
- **Data fetcher:** `getSavedPropertiesForUser(user.id)` + `getDivisionActivity(...)`. Preserve.
- **Empty state:** Saved gallery has its own empty (preserve `SavedPropertiesGallery`'s built-in empty for first-class image rendering); Activity → EmptyStateCard.
- **Effort:** M.

---

## /wallet — Wallet balance + activity

- **Purpose:** balance, pending operations, activity, trust ladder.
- **Hero algorithm:** the hero is "Available balance · {amount}" with tiles for verified / pending funding / pending withdrawal. PRESERVE the `<HeroBalance>` calculation (it's not just a hero — it's the wallet's primary anchor) but swap chrome to `<HeroCard variant="paired">`.
- **Next-step picker:** if `pendingFundingKobo > 0` and proof not uploaded → "Upload proof of funding". If trust tier blocks withdrawal → "Verify identity to unlock".
- **Primitive composition:**
  - `<HeroCard variant="paired">` with available-balance as the headline value.
  - `<NextStepRow tone="attention">` from picker.
  - `<MetricStrip>` for PendingOpsTiles (3 cells: pending funding, pending withdrawal, available — preserve current shape).
  - Sections: Wallet actions, Pending ops, Flow (spend strip + trust ladder), Funding requests, Activity.
- **Data fetcher:** preserve current `Promise.all` fan-out. Typed.
- **Empty state:** "First wallet transaction will appear here" — already in copy slice.
- **Effort:** M (the highest-value visual upgrade; this is the premium-feel anchor).

---

## /logistics — Shipments + tracking

- **Purpose:** active shipments, recent completed, lifetime spend, quick actions.
- **Hero algorithm:** state from `snapshot.metrics`. Tiles: in transit / completed / total / on-hold.
- **Next-step picker:** if any shipment has `status === "delayed" || "exception"` → "Track shipment {id}".
- **Primitive composition:**
  - `<HeroCard variant="paired">` (currently inline in the page — lift to shared).
  - LiveShipmentMap preserved.
  - Sections: Active, Actions, Recent, Spend.
- **Data fetcher:** `getLogisticsSnapshotForAccountUser(user.id, email)`. Preserve.
- **Empty state:** preserve current — already strong.
- **Effort:** S.

---

## /invoices — Billing receipts

- **Purpose:** invoice list across divisions.
- **Hero algorithm:** state from `invoiceStats(invoices)`. Tiles: total paid / this month / outstanding / by-division mini-strip.
- **Next-step picker:** if any invoice is `overdue` → "Settle overdue: {invoice_no}".
- **Primitive composition:**
  - `<HeroCard variant="paired">` (current `<InvoicesHero>` is good — lift).
  - `<TimelineCard>` for the invoice list (currently `<InvoicesList>` — adopt the row shape).
- **Data fetcher:** `getInvoices(user.id, 50)`. Preserve.
- **Empty state:** EmptyStateCard.
- **Effort:** S.

---

## /notifications — Notification inbox

- **Purpose:** unread + read notification stream, division mix, recently deleted.
- **Hero algorithm:** state from `notificationStats(notifications)`. Tiles: unread today / this week / by division.
- **Next-step picker:** when `totalUnread > 1` → "Mark all as read" via NextStepRow (this is the most common asked-for action).
- **Primitive composition:**
  - `<HeroCard variant="paired">` (current `<NotificationsHero>` — lift).
  - `<NextStepRow>` for mark-all-as-read.
  - `<TimelineCard>` for the notifications list (currently `<NotificationsFeed>` — adopt the row shape).
- **Data fetcher:** `getNotificationFeed(user.id, 50, locale)`. Preserve.
- **Empty state:** existing copy slice.
- **Effort:** S.

---

## /calendar — Cross-portal calendar

- **Purpose:** unified appointments, bookings, milestones across divisions.
- **Hero algorithm:** state from `aggregate.events.length`. Tiles: today / this week / next 30 days / overdue.
- **Next-step picker:** if there is an event in the next 24 hours → "Prepare for {event} · {time}".
- **Primitive composition:**
  - `<HeroCard variant="paired" belowTiles={<AgendaMicroStrip>}>` — the belowTiles slot was designed for this micro-strip use case (3-4 next events as compact pills).
  - `<DivisionLanding sections>` for the agenda day-grouped list.
- **Data fetcher:** `getCalendarAggregate(viewer, range)`. Preserve.
- **Empty state:** existing copy slice.
- **Effort:** M.

---

## /security — Account security signals

- **Purpose:** trust tier, signals, recent security activity, account actions.
- **Hero algorithm:** state from `trust.tier + trust.signals`. Tiles: tier / score / suspicious events / signals reviewed.
- **Primitive composition:**
  - `<HeroCard variant="paired" progress={trustScore}>` (current `<SecurityHero>` — lift; trust score is a perfect `progress` use case).
  - `<MetricStrip>` for the SignalsStrip (currently inline — adopt the primitive).
  - Sections: Signals, Trust guide, Account actions, Activity.
- **Data fetcher:** `getAccountTrustProfile(user.id) + getSecurityLog(user.id, 12)`. Preserve.
- **Empty state:** trust journey is never empty (tier 1 baseline). Activity empty → EmptyStateCard.
- **Effort:** M.

---

## /verification — Identity verification

- **Purpose:** identity status, what's unlocked, what advances tier, document uploads.
- **Hero algorithm:** state from `verification.status` (`not_submitted | pending | rejected | verified`).
- **Next-step picker:** if `not_submitted` → "Submit documents to start". If `rejected` → "Resubmit: {reason}". If `pending` → no NextStepRow (waiting).
- **Primitive composition:**
  - `<HeroCard variant="paired">` (current `<IdentityHero>` — lift).
  - `<NextStepRow tone="attention">` from picker.
  - Sections: Trust journey, Documents (preserve `DocumentSubmissionsClient` for upload UI).
- **Data fetcher:** `getAccountTrustProfile + getVerificationState`. Preserve.
- **Empty state:** N/A (the trust journey always renders).
- **Effort:** S.

---

## /settings — Preferences

- **Purpose:** profile, notification preferences, privacy controls.
- **Hero algorithm:** state from `profile completeness + notification channels active + region fingerprint`. Tiles: profile % / channels / region.
- **Primitive composition:**
  - `<HeroCard variant="paired">` (current `<SettingsHero>` — lift).
  - Sections: Profile, Notifications, Privacy — preserve forms verbatim per spec.
- **Data fetcher:** `getProfile + getPreferences`. Preserve.
- **Empty state:** N/A.
- **Effort:** S.

---

## /tasks — Action queue

- **Purpose:** open tasks (blocking + non-blocking) ranked by priority.
- **Hero algorithm:** state from `taskStats(tasks)`. Tiles: blocking / urgent / total / completed-today.
- **Next-step picker:** the top blocking task → `<NextStepRow tone="attention">`.
- **Primitive composition:**
  - `<HeroCard variant="paired">` (current `<TasksHero>` — lift).
  - `<NextStepRow>` from picker.
  - `<TimelineCard>` for the tasks list (currently `<TasksList>` — adopt).
- **Data fetcher:** `buildAccountTasks(...)` + `getDashboardSummary`. Preserve.
- **Empty state:** "You're clear" — already in slice.
- **Effort:** S.

---

## /support — Support threads

- **Purpose:** open support threads + quick help.
- **Hero algorithm:** new — derive from `openCount + urgentCount`. Tiles: open / urgent / resolved this week.
- **Next-step picker:** if any thread has `awaiting_reply` → "Reply: {subject}".
- **Primitive composition:**
  - `<HeroCard variant="solo">` (no current hero — add new).
  - `<NextStepRow>` from picker.
  - QuickHelp tile row (preserve current 3-up card grid).
  - `<TimelineCard>` for threads.
- **Data fetcher:** `getSupportThreads(user.id)`. Preserve.
- **Hardcoded chip-color map (statusInfo at line 23-34):** drop. Use `<TimelineCard.Row chips>` with proper tone.
- **Empty state:** EmptyStateCard with "Anything new will appear here as it arrives."
- **Effort:** M.

---

## /activity — Cross-division activity stream

- **Purpose:** the unified activity stream — orders, bookings, payments across all divisions.
- **Hero algorithm:** new — tiles: events today / this week / by-division top 3.
- **Primitive composition:**
  - `<HeroCard variant="solo">`.
  - `<TimelineCard>` for the list (currently inline — adopt).
- **Data fetcher:** `getRecentActivity(user.id, 50, locale)`. Preserve.
- **Empty state:** EmptyStateCard.
- **Effort:** M.

---

## /addresses — Saved addresses

- **Purpose:** manage user's home / office / shop / shipping addresses.
- **Hero algorithm:** new — `<HeroCard variant="compact">` (this is a form-only page; no metric tiles needed).
- **Primitive composition:** HeroCard (eyebrow + headline + blurb only) + preserve `<AddressManagerClient>` below.
- **Data fetcher:** `getCanonicalUserAddresses(user.id)`. Preserve.
- **Hardcoded copy (line 15-25):** move from inline `if (locale === "fr")` ternary into the account-copy slice as `accountCopy.addresses.hero`. The slice is already typed — add a new key.
- **Empty state:** preserve current AddressManagerClient empty.
- **Effort:** S.

---

## /documents — Files + invoices

- **Purpose:** user-uploaded + system-generated documents (receipts, certificates, IDs, contracts).
- **Hero algorithm:** new — tiles: total / receipts / certificates / contracts.
- **Primitive composition:**
  - `<HeroCard variant="solo">`.
  - `<TimelineCard>` for the document list (currently inline — adopt; the hardcoded `typeChip` map becomes `<TimelineRow chips={[{ label, tone }]}>` per row).
- **Data fetcher:** `getDocuments(user.id)`. Preserve.
- **Empty state:** EmptyStateCard.
- **Effort:** M (chip-map work).

---

## /payments — Saved payment methods

- **Purpose:** card / bank methods stored on the account.
- **Hero algorithm:** new — `<HeroCard variant="compact">` (this is a thin page).
- **Primitive composition:**
  - HeroCard (compact).
  - List of methods (preserve current `<div>` card grid).
- **Data fetcher:** `getPaymentMethods(user.id)`. Preserve.
- **Critical bug to fix:** the "Add method" CTA on line 33-38 is a `<button>` with no handler. Wire to either a modal or to the `/wallet/add` route.
- **Empty state:** EmptyStateCard.
- **Effort:** M (mostly the no-op CTA fix; cosmetic rebuild is small).

---

## /subscriptions — Recurring plans

- **Purpose:** subscription list across divisions.
- **Hero algorithm:** new — tiles: active / paused / total spend per month / next renewal.
- **Primitive composition:**
  - `<HeroCard variant="solo">`.
  - `<TimelineCard>` for the subscription list (currently inline — adopt; the hardcoded `statusChip` map becomes per-row `chips` with primitive tones).
- **Data fetcher:** `getSubscriptions(user.id)`. Preserve.
- **Empty state:** EmptyStateCard.
- **Effort:** M.

---

## /referrals — Referral program

- **Purpose:** referral code, history, rewards.
- **Hero algorithm:** new — tiles: total referred / signed up / qualified / flagged.
- **Primitive composition:**
  - `<HeroCard variant="paired">` with the referral code in the side panel + "Copy code" CTA.
  - `<MetricStrip>` for the 6-stat row (currently 2 grids of 4 + 2 cards — compress).
  - Sections: How It Works (3-step), Policy, Referrals list (TimelineCard), Rewards list (TimelineCard).
- **Data fetcher:** `getUserReferralCode + getUserReferrals + getReferralRewards + getReferralStats`. Preserve.
- **Empty state:** EmptyStateCard for each list.
- **Effort:** L (largest page — most consolidation).

---

## /saved-items — Saved for later

- **Purpose:** items pulled from any HenryCo cart.
- **Hero algorithm:** state from active vs expired count. Tiles: active / expired / by-division.
- **Primitive composition:**
  - `<HeroCard variant="paired">` (no current hero — add new).
  - Preserve `<SavedItemsClient>` for the interactive grid below.
- **Data fetcher:** `listSavedItems(admin, user.id, …)`. Preserve.
- **TODO from current page (line 30-35):** the snapshot-title translation needs a server-side wrapper. Document the contract here: SavedItemsClient should accept `localizedSnapshots: Record<itemId, {title, subtitle}>` and the page resolves them before passing. (Out of scope this session.)
- **Empty state:** existing copy slice.
- **Effort:** M.

---

## /modules/[...slug] — Module catch-all

- **Purpose:** catch-all for registered modules' home views.
- **Hero algorithm:** new — `<HeroCard variant="compact">` using `module.title / module.description`. Module registry should optionally expose `getHero(viewer)` for state-driven copy; until then use the static title/description.
- **Primitive composition:**
  - `<HeroCard variant="compact">`.
  - Preserve widget grid below.
- **Data fetcher:** `getRegisteredModules + module.getHomeWidgets(viewer)`. Preserve.
- **Empty state:** EmptyStateCard.
- **Effort:** M (registry contract extension).

---

## Detail pages (preserved)

Per the audit, detail pages (`/care/bookings/[id]`, `/invoices/[id]`, `/jobs/interviews/[id]`, `/messages/.../[id]`, `/notifications/recently-deleted`, `/property/saved`, `/studio/{projects,payments}/[id]`, `/subscriptions/[id]`, `/support/{new,[id]}`, `/wallet/{add,funding,...}`) inherit the pattern of their parent. Update the parent first; the detail pages absorb the visual debt.

The only detail-specific addition: each detail page should render a `<HeroCard variant="compact">` at its top with the parent breadcrumb + the detail's headline (e.g. "Booking · {id}" + "{service} · {when}") + a "back" link.

---

**End of rebuild spec.** Sessions 2 and 3 execute against this doc + the primitive contracts. Each rebuild MUST satisfy the design-language acceptance checklist (`docs/v3/account-design-language.md` §10) and answer the 10 self-audit questions in its PR body.
