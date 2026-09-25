# V3-STAFF-SELFGRANT-FIX-01 — close the self-granted staff-role hole (and its class)

**Class:** I-risk (identity) · privilege self-grant · **blast radius:** care, logistics, jobs, hub, staff, account (+ property/learn/studio/marketplace app gates, customer KYC, internal comms)
**Status:** repo-only. Migration **HELD for the owner's go**. Prod was paused and never touched. Money objects untouched (proven by digest).

## 1 · What was wrong

Every row below was **reproduced on the prod-actual shadow** (except #4, which was traced in code). CI proves each is live pre-fix, so the tests are load-bearing.

| # | Hole | Where | Reachable by |
|---|------|-------|--------------|
| 1 | `profiles_insert_own` checked only `id = auth.uid()`, and the role guard fires on UPDATE only. A user **with no profiles row** could `POST /rest/v1/profiles {id, role:'staff'\|'owner'}`, and `is_staff_in()` / `is_staff_in_any()` / `current_role()` / `current_app_role()` / `is_property_staff()` plus 3 inline owner policies trusted the bare column. Staff in 6 divisions; `owner` also gave `is_platform_staff()`, which reaches the **refund route** for other customers' real payments. | DB | any signed-in user without a row |
| 2 | Care `syncStaffIdentity()` **defaulted any account to `"staff"`** and read the self-writable `user_metadata.role`, then wrote `profiles.role` + `app_metadata.role` with the **service role**. | care | a customer at the staff sign-in or the staff password-recovery form; **every** listed user whenever the owner opened care's staff/security page |
| 3 | `user_metadata.role` ranked above `profiles.role` in care `getAuthenticatedProfile` / `resolveLiveStaffRole`, and was a fallback in 8 more resolvers. | care, staff, hub, logistics, property, learn, studio, `@henryco/auth` | any signed-in user |
| 4 | **Jobs** read the raw `profiles.role`, and an **inactive** `owner_profiles` row still granted jobs owner/admin. | jobs | a self-granted row; a deactivated owner |
| 5 | Customer-facing memberships counted as staff in SQL `is_staff_in`, `@henryco/auth`, **search** and the staff-intelligence gate. A self-served `vendor_applicant` became marketplace staff, which in search meant **cross-user** workflow, notification and support-thread results. | DB + app | anyone who submits a vendor application |
| 6 | `owner_profiles_update_own` let a viewer/editor rewrite its own `role` to `owner`. (#65's column-level revoke is a **no-op** under the table-level grant.) | DB | owner-console viewers/editors |
| 7 | **Care impersonation:** `endImpersonationAction` had no auth and trusted a plain-JSON cookie naming `ownerUserId`, then minted a sign-in link for that user, so a **forged cookie meant an owner sign-in**. The callback also had an open redirect. | care | anyone who can post the server action |
| 8 | **Customer KYC:** `"Users can update own profile"` + table-level UPDATE let a user self-set `verification_status='verified'` (even forging the reviewer). That passes the **wallet-withdrawal KYC gate**. | DB | any signed-in user |
| 9 | **Internal comms:** a member of *any* thread could move its membership into an **owners-only** thread as a writer (filterless PATCH), or turn observer into member. #65's HUB-3 revoke is a no-op. | DB | any thread member |
| 10 | **Address KYC:** an owner could insert or mark an address `kyc_verified`. Display-only today. | DB | any signed-in user |
| — | Pre-existing: `is_owner()` recursed through RLS ("stack depth limit exceeded") for every request-role read that touched it. | DB | — |

**GOTCHA behind #6 and #9:** a **column-level REVOKE does nothing while the role holds the table-level privilege**, and prod grants table-level DML to `anon`/`authenticated`. Every privilege layer here revokes at table level and re-grants only safe columns, and §0 of the invariant checks the *effective* column privileges.

## 2 · The fix — defense in depth (each layer alone proven)

**Trust anchor.** A write is trusted only if the executing SQL role could bypass RLS anyway (`rolsuper OR rolbypassrls`): service_role, postgres, and SECURITY DEFINER bodies. It is read from `current_user` in SECURITY INVOKER triggers, which a client cannot forge. A precondition guard refuses to apply the migration if this doesn't hold on the platform.

**Staff grant record.** `public.staff_role_grants` is user_id-bound, has RLS on, no policies, and no request-role privileges.
- It is minted **only** when a trusted writer *sets* `profiles.role`; unchanged-role writes never mint it, so nothing can be laundered through it.
- Existing rows are backfilled **after** the write path is locked; a `SHARE ROW EXCLUSIVE` lock covers single-transaction applies.
- A final assertion checks that every non-customer row is backed by a grant.

**Staff role — layer W** (each alone proven):
- W1: privileges.
- W2: no INSERT policy.
- W3: BEFORE trigger; request roles can only create their own customer row and edit only cosmetic columns.
- W4: IMMEDIATE constraint trigger, "non-customer role ⇒ active matching grant".

**Staff role — layer R** (alone proven):
- SQL: every `profiles.role` consumer requires the grant via `verified_profile_role()`; `is_staff_in` / `_any` ignore customer-facing membership roles.
- App: `@henryco/config` `readVerifiedProfileRole` / `readVerifiedProfileRoles` / `isOperatorMembershipRole` (tested) in every resolver: auth viewer, 8 divisions, jobs, care, search, and staff/support/impersonation lists.
  - Lookups fail closed, except "relation does not exist" (pre-migration), so app and DB deploy in either order.
- `user_metadata` is never a source for role, freeze, re-auth, deleted or slot state. Care resolves staff only through `resolveProvisionedStaffRole` (patch → `app_metadata` → verified profile, **no default**) and refuses rather than writes.

**Same-class guards**, each with privileges + trigger and each layer alone proven:

| Surface | Privilege layer | Trigger |
|---|---|---|
| `owner_profiles` | table-level UPDATE revoked; only `full_name`/`updated_at` | `role` / `is_active` / `user_id` / `email` are owner-controlled |
| internal-comms membership | column-level INSERT/UPDATE on harmless columns | thread, member and role server-controlled; self-join member/observer only |
| customer KYC | only cosmetic/preference columns | **allowlist**; new privileged columns default-deny |
| address KYC | *(session edits legitimately reset KYC, so trigger + RLS only)* | downgrade-only; a new address is never pre-verified; moving an address invalidates it |

**Care impersonation:**
- The cookie is HMAC-sealed with an expiry. No public secret fallback; it fails closed.
- Ending requires the current session to be the impersonated target and the owner to still be an owner.
- The callback accepts only same-origin redirects.

## 3 · Proof (local only)

**Prod-actual shadow:**
- Every hole above is reproduced pre-fix.
- Post-fix, invariant §0–§10 pass: every exploit variant blocked, **each mechanism alone** stops it, **layer R alone** confers nothing (including laundering), and genuine paths G1–G11, K3–K4, A4–A6, H4–H6 and O2 work.
- The migration is idempotent (applied twice).

**CI:**
- The **full CI SQL chain (76 steps) replays green locally.**
- CI runs `staff_selfgrant_min.sql` (proves every hole live), then the migration ×2, then `staff_selfgrant_invariant.sql`.

**Money:** digests are identical pre/post: 30 money / `payments_private` functions + ACLs, 116 money relations + ACLs, and all money-table triggers.

**Unit tests:** `@henryco/config` 73/73 (11 new), care 14/14 (all new), search-core 44/44 (5 new).

**Typecheck + ESLint:** clean on every touched app and package, except a pre-existing `packages/lifecycle` JSX config error in search-core.

## 4 · Day-of (runbook §6.1 step 3a)

1. Run §6.2 / §6.3 **first** and record them.
   - ⚠ This migration makes `is_owner()` SECURITY DEFINER, which is exactly §6.2's probe for row #65. Take #65's verdict from this pre-apply run.
   - If #65 is unapplied, still apply it; its HUB-2/HUB-3 column revokes are no-ops, and this migration does them properly.
2. **Apply** `apps/hub/supabase/migrations/20260924120000_v3_staff_selfgrant_fix_01.sql` as one `apply_migration`, named `v3_staff_selfgrant_fix_01`.
3. Run **`review-staff-grants.sql` R1–R9** (read-only) **after** the apply, one block at a time, and save each result.
   - R1: `unbacked_non_customer_rows_expect_0` must be 0.
   - R2: every pre-fix staff row (`grant_source = backfill:…`).
   - R3: app-metadata-only staff.
   - R5: user_metadata-only staff.
   - **R6: KYC verified without an approved submission, with their withdrawals.**
   - R7: address KYC evidence.
   - R8: non-owners in owners-only threads.
   - **R9: forged `succeeded` payment intents (money escalation).**
4. The owner judges each list, then fills `remediate-self-granted-staff.sql` step 1 with `reset_kyc`, `deactivate_memberships` and `revoke_sessions` per row → dry run (ROLLBACK) → check step 8 → COMMIT.
5. Before deploying the app: re-provision any genuine staff listed in R5. Then deploy.

## 5 · Money escalation — held for the owner (NOT changed here)

**`payment_intents`:** a signed-in user can INSERT their own intent with **`status='succeeded'`** and any amount (reproduced on the shadow).
- The policy checks only `user_id`, and the transition/freeze triggers fire on **UPDATE** only.
- The refund route is **not** exploitable with such a row: it needs platform staff plus a provider-confirmed attempt.
- Other consumers read `status` (owner revenue dashboards, finance ledger, marketplace sale reconcile, studio agency state machine, care card-rail, wallet top-up sync). Their exposure is being traced read-only.
- It is a money-spine table, so under the pass's "don't touch money" rule the fix is the owner's decision in a money window. Candidates: a BEFORE INSERT trigger forcing `status='pending'` for request roles, or no request-role INSERT (initiate intents only through the server).
- Detection: review R9.

## 6 · Out of scope, recorded for a follow-up (platform "self-writable privilege" sweep)

**Self-writable trust columns found by the sweep** (evidence in the report):
- `property_listings` owner-set `status` / `trust_badges` (fake "Verified" listings);
- `businesses` owner-set `verified_at`;
- `care_reviews` insert `is_approved`;
- `jobs_experience_verifications` / `jobs_reference_checks` self-verified credentials;
- `studio_project_messages` `sender_role` spoofing;
- legacy `orders` / `order_items` client totals/status.

**Owner-flow and gate defects:**
- Jobs employer membership email match is unverified (PR #349 class, 4 call sites).
- `learn_is_staff` / `studio_is_staff` count any active membership.
- Care slot-retire leaves DB staff for deleted accounts, and **care role changes never reach `profiles.role`** (the protect trigger blocks service-role updates), so offboarding needs the remediation script.
- `packages/auth` `requireUnifiedViewer` trusts an `x-supabase-user` header (only unimported gates use it).
- The care owner-action signing secret falls back to the anon key.

Files: `review-staff-grants.sql`, `remediate-self-granted-staff.sql` (both also in `Downloads\V3-STAFF-SELFGRANT-FIX-01-*`).
