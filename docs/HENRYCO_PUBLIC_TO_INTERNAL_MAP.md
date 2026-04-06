# HenryCo — Public → Internal Operational Map

**Purpose:** Ground staff-platform design in real ingress points and data writes.  
**Scope:** Division Next apps + account + super-app + hub public surfaces.  
**Last updated:** 2026-04-05

---

## Legend

| Symbol | Meaning |
|--------|---------|
| **Record** | Primary table(s) touched |
| **Staff signal** | Email, `notifyStaffRoles`, moderation case, notification row, etc. |
| **Gap** | No clear staff routing in reviewed code |

---

## Hub (corporate / marketing + owner routing)

| Surface | Type | Internal tie |
|---------|------|--------------|
| `hq.*` host | **Executive routing** | `proxy.ts` rewrites to `/owner/*` — owner command center on hub app |
| `workspace.*` host | **Staff host (retired UI)** | Rewrites to `/workspace/*` → `StaffSurfaceRetired` — **no live staff product** |
| Public marketing | Public | No operational queue unless forms exist on specific pages |

**Implication:** Domain layer already anticipates `hq` vs `workspace` split; staff should either revive `workspace.*` with real UI or introduce `staffhq.*` with parallel auth patterns.

---

## Account (`apps/account`)

| Workflow | Entry | Record(s) | First-line internal role | Escalation | Owner visibility |
|----------|-------|-----------|--------------------------|------------|------------------|
| Create support thread | `POST` `app/api/support/create/route.ts` | `support_threads`, `support_messages`, `customer_activity`, `customer_notifications` | Support / cross-division agent | Division manager / owner on SLA breach | Via hub messaging / future unified queue |
| Support reply | `POST` `app/api/support/reply/route.ts` | `support_messages` | Assigned agent | Escalation queue | Same |
| Wallet funding | `POST` `app/api/wallet/fund/route.ts` | `customer_wallet_funding_requests` | Finance staff | Owner for large / policy exceptions | Hub finance / approvals |
| Funding proof | `POST` `.../wallet/funding/[requestId]/proof/route.ts` | `customer_documents`, activity | Finance verification | Owner | Approvals center |
| Withdrawal request | `POST` `app/api/wallet/withdrawal/request/route.ts` | `customer_wallet_withdrawal_requests` (`pending_review`) | Finance | Owner | `/owner/operations/approvals` (conceptual) |
| Payout methods | `POST` `app/api/wallet/payout-methods/route.ts` | `customer_payout_methods` | Finance / risk | Owner | Finance KPIs |

---

## Care (`apps/care`)

| Workflow | Entry | Record(s) | Staff signal | First-line role | Notes |
|----------|-------|-----------|--------------|-----------------|-------|
| Full booking | Server action `book` (`app/(public)/book/actions.ts`) | `care_bookings`, items, payment paths, `care_security_logs` | `sendAdminNotificationEmail`, `notifyStaffRoles` | Care ops / support | Primary intake |
| Legacy book API | `POST` `app/api/care/book/route.ts` | RPC `create_care_booking` | **Gap** vs full action path | Care ops | Align alerting with main flow |
| Direct bookings insert | `POST` `app/api/care/bookings/route.ts` | `care_bookings` | **Gap** in route | Care ops | Harden + unify |
| Contact / support | `POST` `app/api/care/contact/route.ts` | support + `care_security_logs` | Admin email + `notifyStaffRoles` | Care support | |
| Payment proof | `POST` `app/api/care/payments/receipt/route.ts` | `care_payment_requests` | `notifyStaffRoles` | Finance / support | |
| Review submit | `POST` `app/api/care/reviews/route.ts` | `care_reviews` (`is_approved: false`) | Admin + `notifyStaffRoles` | Moderation / manager | |
| Admin shell | `GET` `/admin` | None (marketing shell) | N/A | **No server auth** — security gap | Must gate before production staff use |

**Care staff routes** under `(staff)` are wrapped in `StaffSurfaceRetired` — real ops UI must land in Staff HQ or revived routes.

---

## Marketplace (`apps/marketplace`)

| Intent (API) | Entry | Record(s) | Queue / signal | Role |
|--------------|-------|-----------|----------------|------|
| `checkout_submit` | `POST` `app/api/marketplace/route.ts` | orders, groups, items, payments | Events; risk → `marketplace_moderation_cases` | Ops / finance / moderation |
| `vendor_apply` / seller form | API + `app/api/seller-applications/route.ts` | `marketplace_vendor_applications` | Owner alert email | Marketplace admin |
| `support_thread_create` | API | `marketplace_support_threads`, messages | `owner_alert` email | Support |
| `dispute_create` | API | `marketplace_disputes` | `marketplace_moderation_cases` | Moderation |
| `vendor_product_upsert` | API | catalog | Blocked → moderation case | Moderation / ops |
| `review_submit` | API | `marketplace_reviews` | Pending / trust pipeline | Moderation |

**Live:** `/admin`, `/admin/[resource]` (role-gated). **Retired:** `/owner`, `/operations`, `/moderation` layouts → `StaffSurfaceRetired`.

---

## Jobs (`apps/jobs`)

| Workflow | Entry | Record(s) | Signal | Role |
|----------|-------|-----------|--------|------|
| Application | `submitApplicationAction` → `lib/jobs/write.ts` | `customer_activity`, `support_messages`, notifications | Employer + internal notify if `job.internal` | Employer / internal hiring |
| Job post | `createJobPostAction` | activity / job state | `pending_review` | Moderator / recruiter |
| Employer profile | `createEmployerProfileAction` | employer records | Verification flows | Recruiter / admin |

**Retired:** `/recruiter` layout, `/owner`, `/moderation` → `StaffSurfaceRetired`. `/admin` re-exports recruiter page (still under retired layout).

---

## Learn (`apps/learn`)

| Workflow | Entry | Record(s) | Signal | Role |
|----------|-------|-----------|--------|------|
| Enroll | `enrollInCourseAction` → workflows | `learn_enrollments`, payments, invoices | `awaiting_payment` → finance | Finance / academy admin |
| Teacher application | `submitTeacherApplicationAction` | `learn_teacher_applications` | `sendOwnerAlert` | Academy admin |
| Learner support | `createSupportRequestAction` | `support_threads` (shared-account) | `sendOwnerAlert` | Learner support |
| Quiz | `submitQuizAttemptAction` | `learn_quiz_attempts` | Automated | Instructor (edge cases) |

**Live:** `/admin`, `/analytics`. **Retired:** `/owner/*`.

---

## Studio (`apps/studio`)

| Workflow | Entry | Record(s) | Signal | Role |
|----------|-------|-----------|--------|------|
| Public brief | `submitStudioBriefAction` → workflows | leads, briefs, proposals, projects, payments | Email notifications | Sales → PM → finance |
| Payment proof | `uploadPaymentProofAction` | milestone payment proof | Verification flow | Studio finance |
| Support | `POST` `app/api/support/create/route.ts` | `support_threads` via shared-account | Thread-based | Support |

**Live:** `/sales`, `/pm`, `/delivery`, `/finance`, `/support`, `/project/[projectId]`. **Retired:** `/owner`.

---

## Property (`apps/property`)

| Workflow | Entry | Record(s) | Signal | Role |
|----------|-------|-----------|--------|------|
| Inquiry | `POST` `app/api/property/route.ts` (`inquiry_submit`) | inquiry store, activity, support thread | `sendPropertyEvent` new_lead_alert | Agent / operator |
| Viewing request | same | viewing + thread | new_lead_alert | Viewing coordinator |
| Listing submission | same | listing + docs + thread | new_lead_alert | Listings manager / moderation |

**Live:** `/admin`. **Retired:** `/operations`, `/moderation`, `/owner`.

---

## Logistics (`apps/logistics`)

| Workflow | Entry | Record(s) | Signal | Role |
|----------|-------|-----------|--------|------|
| Quote / booking | `submitLogisticsBookingAction` → `lib/logistics/write.ts` | `logistics_shipments`, `logistics_addresses`, `logistics_events`, notifications | **Customer** email/WhatsApp; `logistics_notifications` | **Gap:** explicit ops alert |

**No `/admin`.** Catch-all `[...slug]` can show `StaffSurfaceRetired`.

---

## Super-app (Expo)

| Workflow | Entry | Record(s) | Signal | Role |
|----------|-------|-----------|--------|------|
| Contact | `ContactScreen` → adapter | `contact_submissions` | **Gap** in-app | Support (needs queue or alert) |

---

## Hub owner APIs (internal tools, not public)

| Area | Path pattern | Purpose |
|------|--------------|---------|
| Owner APIs | `app/api/owner/**` | Staff invites, internal comms, uploads — **executive / admin** tooling |

These write to `hq_internal_comm_*`, company settings, `staff_audit_logs` (usage in code — verify DDL on linked project), etc.

---

## Suggested canonical queue keys (for `workspace_tasks` / `workspace_queue_items`)

Align with existing hub migration columns: `division`, `queue_key` / `lane_key`, `source_table`, `source_id`.

| Queue key | Division | Typical source tables |
|-----------|----------|------------------------|
| `care.booking.new` | care | `care_bookings` |
| `care.review.pending` | care | `care_reviews` |
| `care.payment.proof` | care | `care_payment_requests` |
| `marketplace.order` | marketplace | `marketplace_orders` |
| `marketplace.dispute` | marketplace | `marketplace_disputes`, `marketplace_moderation_cases` |
| `marketplace.vendor.kyc` | marketplace | `marketplace_vendor_applications` |
| `jobs.post.review` | jobs | job/activity tables |
| `jobs.application` | jobs | `customer_activity`, applications |
| `learn.enrollment.payment` | learn | `learn_enrollments` |
| `learn.teacher.application` | learn | `learn_teacher_applications` |
| `studio.lead` | studio | `studio_brief_*`, leads |
| `studio.payment.proof` | studio | payment / milestone tables |
| `property.lead` | property | inquiry / listing submissions |
| `logistics.shipment.new` | logistics | `logistics_shipments` |
| `account.support` | account | `support_threads` (cross-division) |
| `account.wallet.funding` | account | `customer_wallet_funding_requests` |
| `account.wallet.withdrawal` | account | `customer_wallet_withdrawal_requests` |
| `superapp.contact` | hub / support | `contact_submissions` |

---

## Deep links (product requirement)

Every staff workspace record view should link to:

1. **Source public URL** (division site) where applicable  
2. **Account** thread or wallet context if involved  
3. **Owner HQ** aggregate views (`/owner/operations/queues`, finance, messaging) for executives  

---

## Files inspected for this map

- `apps/account/app/api/support/create/route.ts`, `.../reply/route.ts`, `.../wallet/**`
- `apps/care/app/(public)/book/actions.ts`, `app/api/care/**`, `app/admin/page.tsx`
- `apps/marketplace/app/api/marketplace/route.ts`, `app/api/seller-applications/route.ts`
- `apps/jobs/app/actions.ts`, `app/admin/page.tsx`, `app/recruiter/layout.tsx`
- `apps/learn/lib/learn/actions.ts` (referenced via prior audit)
- `apps/studio/lib/studio/actions.ts`, `app/api/support/create/route.ts`
- `apps/property/app/api/property/route.ts`
- `apps/logistics/app/actions/logistics-booking.ts`, `lib/logistics/write.ts`, `lib/logistics/notify-customer.ts`
- `apps/super-app/src/platform/adapters/supabase/database.supabase.ts`
- `apps/hub/proxy.ts`
- `packages/ui/src/staff-surface-retired.tsx`
