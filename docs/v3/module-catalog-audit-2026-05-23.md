# Module catalog audit — 2026-05-23 (MODULES-01)

**Pass:** MODULES-01
**Working branch:** `fix/mobile-module-landings`
**Owner question, verbatim:** "the modules landing pages shows as not exists on mobile check if it is an error or a problem from my own account. For the modules mobile marketplace, wallet, and I think there should be more?"

---

## TL;DR

- "Not exists" on `/modules/marketplace` and `/modules/wallet` is a **class-level bug, not an account misconfiguration**. The owner sees it because they have `owner_profiles.is_active = true`, which makes `buildUnifiedViewer` resolve `viewer.kind === "owner"`. Every Track A (customer-surface) module's `getRoleGate` returns `null` unless `viewer.kind === "customer"`, so for owners the eligible-module list is empty and the catch-all router calls `notFound()` on every `/modules/<slug>` URL.
- The fix is a single class-level adjustment in the three Track A modules' `getRoleGate` (customer-overview, marketplace, wallet): gate on "can use the customer surface" rather than "primary lane is customer". Any authenticated viewer in `apps/account` (which is the customer surface) qualifies — including owners and staff who have human-side customer needs (wallets, purchases). Data-layer gates remain `kind === "customer"` because they correctly load customer-context rows only.
- The Track A catalog is 5 modules registered today (3 visible: customer-overview, marketplace, wallet; 2 flag-gated: building, hotel). Track B (owner) has 9 modules under `apps/hub/app/owner/...`; Track C (staff) has 13 modules. None of these need to be added without owner OK — the recommendations section flags candidates.

---

## How the registry actually works (architecture refresher)

Three parallel module registries live in `packages/dashboard-shell/src/`:

| Track | Registry file | Surface app | Registry walk | Viewer kind |
|---|---|---|---|---|
| A — Customer | `register.ts` | `apps/account` | `getEligibleModules(viewer)` | `customer` |
| B — Owner | `owner-register.ts` | `apps/hub/app/owner` | `getEligibleOwnerModules(viewer)` | `owner` |
| C — Staff | `staff-register.ts` | `apps/hub/app/staff` (and similar) | `getEligibleStaffModules(viewer)` | `staff` |

`buildUnifiedViewer` in `packages/auth/src/viewer.ts:258-272` picks the viewer's primary lane from `AccessSnapshot`:
1. `hasOwnerAccess` → `kind: "owner"`, `role: "super_admin"`
2. `hasStaffAccess` → `kind: "staff"`, `role: "staff"` or `"division_operator"`
3. otherwise → `kind: "customer"`, `role: "customer"`

`apps/account` is the Track A surface. Every page in `apps/account/app/(account)/...` is reachable by any authenticated user, including owners and staff. But the **Track A module registry** is gated on `viewer.kind === "customer"`, so owners and staff who land on `apps/account` get an empty Track A module list.

This means in the customer surface today:
- Owner / staff see: a workspace rail with no modules, mobile drawer with empty state, and a `/modules/<any-slug>` URL that 404s.
- Owner / staff CAN still hit the per-division top-level routes directly: `/marketplace`, `/wallet`, `/jobs`, etc. — those don't go through the registry.

The bug surfaces most loudly on mobile because the BottomActionBar's "Modules" anchor is the primary nav at < 768px (the desktop rail just disappears silently when empty).

---

## Reproducing the owner's complaint

1. Sign in as a user with `owner_profiles.is_active = true` (the owner's account).
2. Visit `apps/account` on mobile (`< 768px` viewport).
3. Tap the "Modules" anchor in the bottom action bar.
4. **Observed:** Empty-state card — "No modules yet — Modules surface here as they become available for your account."
5. Open any `/modules/<slug>` URL directly (e.g., a bookmark, deep link, notification deep-link template) — e.g., `/modules/marketplace`, `/modules/wallet`.
6. **Observed:** Next 404 (`notFound()`) — what the owner reads as "not exists".

For comparison, the same owner visits `/marketplace` or `/wallet` directly — both render fine, because those routes don't gate on the registry.

---

## Root cause

`apps/account/app/(account)/modules/[...slug]/page.tsx:50-56`:

```ts
const registered = getRegisteredModules();
const targetModule = registered.find((m) => m.slug === moduleSlug);
if (!targetModule) notFound();

const decision = targetModule.getRoleGate(viewer);
if (!decision || decision.kind !== "allow") {
  notFound();
}
```

`getRoleGate` for marketplace / wallet / customer-overview returns `null` when `viewer.kind !== "customer"` — so for an owner viewer (`kind: "owner"`), `decision === null` → `notFound()`.

The same gate filters `getEligibleModules(viewer)` to `[]` for owners, which is why the rail / mobile drawer also show empty.

The gate semantically should be "is this viewer using the customer surface?" — which for `apps/account` is "any authenticated viewer" (the auth gate is upstream in `requireAccountUser()`). The current `kind === "customer"` check conflates "primary lane" with "surface eligibility".

---

## Track A catalog (customer surface, `apps/account`)

| Slug | Title | Package | Rail slot | Module-side gate today | Direct route | Customer | Staff | Owner | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `customer-overview` | Overview | `@henryco/dashboard-modules-account` | primary | `kind === "customer"` | `/` | yes | **denied** | **denied** | The home page composes off this module. |
| `marketplace` | Marketplace | `@henryco/dashboard-modules-marketplace` | primary | `kind === "customer"` | `/marketplace` | yes | **denied** | **denied** | Vendor widget surfaces only when the snapshot reports a vendor application. |
| `wallet` | Wallet | `@henryco/dashboard-modules-wallet` | primary | `kind === "customer"` | `/wallet` | yes | **denied** | **denied** | Owns wallet.{funding,withdrawal,transaction} notification categories. |
| `building` | Building | `@henryco/dashboard-modules-building` | secondary | `MODULE_ENABLED = false` | n/a (V3-launch gated) | hidden | hidden | hidden | Flag-gated. Re-enable via `MODULE_ENABLED` constant. |
| `hotel` | Hotels | `@henryco/dashboard-modules-hotel` | secondary | `MODULE_ENABLED = false` | n/a (V3-launch gated) | hidden | hidden | hidden | Flag-gated. Re-enable via `MODULE_ENABLED` constant. |

After the fix, the three visible modules return `allow` for any authenticated viewer in `apps/account`. Owners and staff get their Track A modules back without changing their Track B / Track C composition.

---

## Track B catalog (owner surface, `apps/hub/app/owner`)

Source: `packages/dashboard-modules-owner/src/modules.ts`. These are SEPARATE from Track A — gated via `getEligibleOwnerModules` against `OWNER_REGISTRY`, never leak into Track A.

| Slug | Module file |
|---|---|
| `owner-overview` | `owner-overview/` |
| `owner-divisions` | `owner-divisions/` |
| `owner-finance` | `owner-finance/` |
| `owner-staff` | `owner-staff/` |
| `owner-brand` | `owner-brand/` |
| `owner-messaging` | `owner-messaging/` |
| `owner-operations` | `owner-operations/` |
| `owner-ai` | `owner-ai/` |
| `owner-settings` | `owner-settings/` |

Owner surface composition lives in `apps/hub/app/owner/(command)/layout.tsx` and `apps/hub/lib/owner-rail-from-registry.ts`. Untouched by this pass.

---

## Track C catalog (staff surface)

Source: `packages/dashboard-modules-staff/src/modules.ts`. Each Track C module has a `scope` (cross-division or division-bound). Untouched by this pass.

| Slug | Scope |
|---|---|
| `staff-overview` | cross_division |
| `staff-care` | division: care |
| `staff-marketplace` | division: marketplace |
| `staff-property` | division: property |
| `staff-studio` | division: studio |
| `staff-jobs` | division: jobs |
| `staff-learn` | division: learn |
| `staff-logistics` | division: logistics |
| `staff-support` | cross_division |
| `staff-moderation` | cross_division |
| `staff-finance-operator` | cross_division |
| `staff-settings` | cross_division |
| `staff-marketing` | reserved (newsletter editor sub-module) |

---

## Division top-level pages in `apps/account` (parallel surfaces)

These are reachable directly without going through the catch-all router. They use the host app's data helpers, not the dashboard-modules registry. They form the "always works for any authenticated user" path.

| Path | Purpose |
|---|---|
| `/` | Smart Home (composes Track A registry) |
| `/marketplace` | Marketplace division summary |
| `/wallet` | Wallet division summary |
| `/wallet/funding` | Wallet funding |
| `/wallet/add` | Wallet add money |
| `/wallet/withdrawals` | Wallet withdrawals |
| `/care` | Care division |
| `/jobs` | Jobs division |
| `/learn` | Learn division |
| `/logistics` | Logistics division |
| `/property` | Property division |
| `/studio` | Studio division |
| `/messages`, `/notifications`, `/invoices`, `/support`, `/security`, `/settings`, `/saved-items`, `/search`, `/referrals`, `/subscriptions`, `/tasks`, `/calendar`, `/activity`, `/payments`, `/addresses`, `/documents`, `/verification` | Cross-division surfaces |

**Gap:** of these division pages, only marketplace and wallet have a registered Track A module. Care, jobs, learn, logistics, property, studio do NOT — they exist as standalone routes but have no module registration, no rail entry, and no `/modules/<slug>` deep link. See recommendations below.

---

## Recommendations for owner review

### A. Class-level fix (this pass)

Adjust the three Track A modules' `getRoleGate` so any authenticated viewer in `apps/account` is allowed. Customers, owners (when they use the customer surface), and staff (when they use the customer surface) all see the same Track A modules. Data-layer gates stay `kind === "customer"` — non-customer viewers will see an empty-state when widgets resolve to `[]`, which is the existing graceful path.

This unblocks `/modules/marketplace` and `/modules/wallet` for the owner immediately. No new modules are registered without explicit OK.

### B. Candidates worth registering (NOT done in this pass — flagged for owner OK)

These are divisions / surfaces that exist as standalone pages in `apps/account` but have no Track A module registration. Promoting them to modules would surface them in the rail + mobile drawer + Cmd+K palette + signal feed.

| Candidate | Why it belongs in the catalog | Why it might NOT |
|---|---|---|
| `care` | Top-level division product (`/care`). Customers have bookings, reschedules, riders. Owner has booked care services. | Care UX has its own surface layers; if the team wants to keep `/care` standalone, leave it. |
| `jobs` | Top-level division (`/jobs`). Customers have applications, offers, saved jobs. | Same — already a standalone page. |
| `learn` | Top-level division (`/learn`). Customers have courses, certificates, progress. | Same. |
| `logistics` | Top-level division (`/logistics`). Customers have parcels, delivery history. | Same. |
| `property` | Top-level division (`/property`). Customers have leases, rents, inquiries. | Same. |
| `studio` | Top-level division (`/studio`). Customers have orders, drafts, projects. | Same. |
| `support` | Cross-division surface (`/support`). Tickets, drafts, status. | Lives in the IdentityBar bell + the BottomActionBar More sheet; redundant if also a module. |
| `notifications` | Cross-division surface (`/notifications`). | Already in the BottomActionBar Inbox anchor. |
| `settings` | Cross-division surface (`/settings`). | Already in the BottomActionBar More sheet. |
| `documents` | Cross-division surface (`/documents`). Invoices, statements, contracts. | Could fold under wallet (statements) + marketplace (invoices) instead. |
| `subscriptions` | Cross-division surface (`/subscriptions`). Active recurring purchases. | Niche. |

### C. Cleanup candidates (also flagged, no action this pass)

- `building`, `hotel` — flag-gated `MODULE_ENABLED = false`. Leave as-is until V3 launch.
- The catch-all router's "deep-link landing pending" notice (`apps/account/app/(account)/modules/[...slug]/page.tsx:160-175`) is a DASH-2 placeholder that DASH-3 was meant to replace. Probably worth a follow-up pass that wires per-detail rendering.

### D. Owner decisions required

1. **OK to ship the class-level fix?** It makes `/modules/marketplace`, `/modules/wallet`, and `/modules/customer-overview` reachable for owner and staff viewers in `apps/account`. The Track B owner surface (`apps/hub/app/owner`) is unaffected.
2. **Any of the candidates in section B you want registered?** If yes, name them and I'll author each module's registration in a follow-up pass.
3. **Wallet status:** wallet IS registered today (`packages/dashboard-modules-wallet`). The owner's complaint about "wallet shows as not exists" was the gate bug, not a missing registration.
