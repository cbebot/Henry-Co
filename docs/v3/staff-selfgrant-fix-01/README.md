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
| 11 | **Care owner-action token:** the signed hidden fields that authorize owner actions were a **session-unbound bearer token**. It was rendered into the owner page, stayed valid until the owner's next sign-in (surviving sign-out), and its secret fell back to the **public** anon key and then a hard-coded string. The impersonation callback's prefix-only redirect check could also be bypassed with a tab or newline (`/<TAB>/evil.example`). | care | anyone holding a copied token; anyone who can craft the callback link |
| 12 | **Owner console, after promotion:** `authenticated` kept table-level INSERT/DELETE on `owner_profiles`, gated only by RLS `is_owner()`. So an account that had self-promoted (#6) could add owners or delete the real owner's row. Internal-comms self-joins also let a thread **reader** join as a **writer**. | DB | a self-promoted console owner; a workspace-staff reader |
| 13 | **Comms access outlived the right behind it** (round 5):<br>• The hub adds active console owners to the leadership thread and DMs with the membership role `owner`, and never removes them. `hq_ic_can_read_thread` / `_write_thread` honoured those rows after the console row was deactivated, so an account that promoted itself (#6) and was then remediated kept reading and posting in the owners' threads, DMs and attachments. An offboarded owner would too.<br>• Any self-join likewise outlived a revoked reader. | DB | a remediated self-promoted owner; any former owner; a former reader |
| — | Pre-existing: `is_owner()` recursed through RLS ("stack depth limit exceeded") for every request-role read that touched it. | DB | — |

**GOTCHA behind #6 and #9:** a **column-level REVOKE does nothing while the role holds the table-level privilege**, and prod grants table-level DML to `anon`/`authenticated`. Every privilege layer here revokes at table level and re-grants only safe columns, and §0 of the invariant checks the *effective* column privileges.

## 2 · The fix — defense in depth (each layer alone proven)

**Trust anchor.** A write is trusted only if the executing SQL role could bypass RLS anyway (`rolsuper OR rolbypassrls`): service_role, postgres, and SECURITY DEFINER bodies. It is read from `current_user` in SECURITY INVOKER triggers, which a client cannot forge.
- A precondition guard refuses to apply the migration unless `postgres` and `service_role` can bypass RLS.
- It also requires every SQL-side writer of a locked table to be SECURITY DEFINER with such an owner. These are signup (`handle_new_user`, `handle_new_customer`) and the owner RPCs (`admin_set_profile_role` / `_frozen`, `admin_force_reauth`).
- Otherwise the guards would reject every signup or owner action, so the migration refuses to apply instead (proven both ways on the shadow).
- The owners of the locked tables must be trusted too. Foreign-key actions, such as deleting an auth user, run as the referencing table's owner.
- The grant mirror runs as the writer, so the migration lets `postgres` and the owners of the two role writers write `staff_role_grants`. That makes signup work even where those functions have a BYPASSRLS owner that is not a superuser. Proven on the shadow, including that signup fails without the grant.

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
  - Lookups fail closed, except "relation does not exist" (pre-migration), so the app runs on the pre-migration schema. Deploy it **first** (§4).
- `user_metadata` is never a source for role, freeze, re-auth, deleted or slot state. Care resolves staff only through `resolveProvisionedStaffRole` (patch → `app_metadata` → verified profile, **no default**) and refuses rather than writes.
- Care's last-owner guard counts owners by that same precedence (`countProvisionedOwners`, tested).
  - A second owner whose role lives only in the grant-backed `profiles.role` still counts, so the remaining owner can archive or demote it.
  - It pages through up to 10,000 accounts, not only the newest 200. Past that it can only undercount, which blocks.
  - It skips archived owners (`needsLastOwnerCheck`), which are not active owners.
  - "Add staff" refuses an owner demoting or deactivating itself, as update-role and freeze already did.
- An archived (offboarded) account acts on nothing: both owner-console auth paths refuse it, as every page already did.

**Same-class guards**, each with privileges + trigger and each layer alone proven:

| Surface | Privilege layer | Trigger |
|---|---|---|
| `owner_profiles` | no request-role INSERT/DELETE; UPDATE only `full_name`/`updated_at` | **platform-managed**: every untrusted insert/delete, and any `role`/`is_active`/`user_id`/`email` change, is refused, owners included (the console is managed through the service role) |
| internal-comms membership | **no request-role INSERT**, and no INSERT policy; UPDATE only on the member's own read/pin/mute state | **platform-managed**: every untrusted insert is refused; thread, member and role are immutable. `hq_ic_can_read_thread` / `_write_thread` honour an `owner`/`admin` membership **only while its holder is an active console owner** (§10b) |
| customer KYC | only cosmetic/preference columns | **allowlist**; new privileged columns default-deny |
| address KYC | *(session edits legitimately reset KYC, so trigger + RLS only)* | downgrade-only; a new address is never pre-verified; moving an address invalidates it |

**Care impersonation and owner actions:**
- The impersonation cookie is HMAC-sealed with an expiry. Ending requires the current session to be the impersonated target and the owner to still be an owner.
- The callback redirect is parsed against a sentinel origin and only the canonical path is returned. Control characters, backslashes and leading whitespace are rejected, and the canonical form is re-checked (fuzzed with 15 edge cases).
- Signed owner-action fields must match the **current cookie session**, so a copied token is useless.
- One server-only secret (`apps/care/lib/auth/signing-secret.ts`) serves both, with no public or hard-coded fallback; unset means fail closed.

## 3 · Proof (local only)

**Prod-actual shadow:**
- Every hole above is reproduced pre-fix.
- Post-fix, invariant §0–§10 pass.
  - Every exploit variant is blocked, and **each mechanism alone** stops it. This includes owner-session insert/delete on the console (O4–O6), and a self-join refused by the privilege layer, the missing INSERT policy and the trigger, each alone (H8).
  - A stale owner-level membership grants nothing: no read, no write, no message (H9). It works again only while its holder is an active owner, and stops the moment the console row is deactivated.
  - The fixture proves both round-5 holes live pre-fix.
  - **Layer R alone** confers nothing, including laundering.
  - Genuine paths G1–G11, K3–K4, A4–A6, H4, H6, H9 (platform-added members, observers, active owners) and O2 work.
- The migration is idempotent (applied twice).

**CI:**
- The **full CI SQL chain (76 steps) replays green locally.**
- CI runs `staff_selfgrant_min.sql` (proves every hole live), then the migration ×2, then `staff_selfgrant_invariant.sql`.

**Money:** digests are identical pre/post: 30 money / `payments_private` functions + ACLs, 116 money relations + ACLs, and all money-table triggers.

**Unit tests:** `@henryco/config` 73/73 (11 new), care 29/29 (26 new), search-core 44/44 (5 new). All three suites run in CI.

**Typecheck + ESLint:** clean on every touched app and package, except a pre-existing `packages/lifecycle` JSX config error in search-core.

## 4 · Day-of (runbook §6.1 step 3a)

**Order: the PR #540 app first, then the migration, then the review.**

0. **Make the #540 build the live deployment before Supabase serves traffic.** It runs on the pre-migration schema: a missing grants table falls back to today's profile-role reading.
   - ⚠ **Why the order matters.** A pre-#540 care build with a reachable database keeps assigning staff roles through the service role, and those writes are trusted:
     - every render of `/owner/staff` or `/owner/security` re-runs the old reconcile over the first 200 accounts;
     - staff sign-in and recovery run it for whoever signs in there;
     - it copies a self-set `user_metadata.role` into `app_metadata.role`, and defaults everyone else to `staff`.
   - If a pre-#540 build was ever live against the resumed database, re-run R1–R3 once #540 is live, and remediate anything new.
1. Run §6.2 / §6.3 **first** and record them.
   - ⚠ This migration makes `is_owner()` SECURITY DEFINER, which is exactly §6.2's probe for row #65. Take #65's verdict from this pre-apply run.
   - If #65 is unapplied, still apply it; its HUB-2/HUB-3 column revokes are no-ops, and this migration does them properly.
2. **Apply** `apps/hub/supabase/migrations/20260924120000_v3_staff_selfgrant_fix_01.sql` as one `apply_migration`, named `v3_staff_selfgrant_fix_01`.
   - It must run as one transaction, so a §0 refusal leaves nothing behind. `apply_migration` does this; with `psql`, use `--single-transaction -v ON_ERROR_STOP=1`.
3. Run **`review-staff-grants.sql` R1–R9** (read-only) **after** the apply, one block at a time, and save each result.
   - R1: `unbacked_non_customer_rows_expect_0` must be 0.
   - R2: every pre-fix staff row (`grant_source = backfill:…`).
   - R3: app-metadata-only staff.
     - `review_hint` `NO-RECORD` / `NO-RECORD-DEFAULT` marks an account with no owner-console provisioning record. That is the old reconcile's shape: a copied self-set role, or the `staff` default.
     - The evidence is `care_security_logs` + `staff_audit_logs`, which request roles cannot write.
     - R1 `app_metadata_staff_without_record` counts these accounts. R2 adds the same `NO-RECORD` qualifier.
   - R5: user_metadata-only staff.
   - **R6: KYC verified without an approved submission, with their withdrawals.**
   - R7: address KYC evidence.
   - R8: every internal-comms membership held by an account that is not an active console owner. `OWNER-LEVEL-ROW` sorts first; the fix already ignores such a row.
   - **R9: forged `succeeded` payment intents (money escalation).**
   - **R1 `console_owners_without_platform_owner_signal` / R4 `review_hint`:** an active console owner with no platform-owner signal, i.e. a viewer or editor that promoted itself before the fix.
     - A platform-owner signal is an admin-set `app_metadata.role = 'owner'`, or an owner grant minted after the fix.
     - `profiles.role = 'owner'` alone does not count: it was self-settable, and the backfill only mirrors it. Such a row reads `CONSOLE-OWNER-PROFILE-ROLE-ONLY`, which may be your own account; check `grant_source` and `profile_after_auth_seconds`.
4. The owner judges each list, then fills `remediate-self-granted-staff.sql` step 1, one row per account: `(user_id, reason, allow_active_owner, reset_kyc, deactivate_memberships, deactivate_console, revoke_sessions)`. Then dry run (ROLLBACK) → check step 8 → COMMIT.
   - It refuses to run before the migration is applied (before it, an account could undo several actions itself).
   - It refuses an empty list, an unflagged active owner, an active console owner listed without `deactivate_console`, and any run that would leave **no** active console owner.
   - `deactivate_console` also removes the account's internal-comms memberships (step 7 asserts none remain). Every listed account is made to sign in again.
   - The dry run performs every write, including those to `auth.users` (prod may carry triggers the shadow lacks), then rolls back. Read any error it reports before switching to COMMIT.
   - It authorizes the role change under an active owner that is **not** on the list, needs no DDL, and reverts the borrowed identity at the end.
5. R5: re-provision each genuine account **on the #540 build**, never through a pre-#540 care build.
   - Use care owner console → add staff with that email and role (it re-provisions an existing account), or the hub invite flow.
   - Until then the account has no staff access; nothing else changes for it.

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

**Owner decision (HIGH, pre-existing): approved learn instructors are staff.**
- `learn_is_staff()` is true for any active `learn_role_memberships` row, so an **approved external instructor** gets ALL on the 29 policies that use it: `learn_payments`, `learn_certificates`, `learn_enrollments`, and more.
- The app-layer review reproduced an instructor issuing a certificate to another user through the direct API. Instructors also count as staff for `is_staff_in_any()`, search (cross-user results) and the staff workspace.
- It is **not a self-grant**: it needs owner approval of a teacher application.
- It is also **by design in part**: `apps/staff/lib/roles.ts:334` maps instructors to a learn workspace role, and the staff workspace's learn queue reads `learn_courses` through the user session (`apps/staff/app/(track-c)/modules/[slug]/page.tsx:89`). Narrowing `learn_is_staff()` in this pass would therefore break a designed instructor path, so it was **not** changed here.
- Recommended pass (LEARN-INSTRUCTOR-SCOPE):
  - (a) `learn_payments` / `learn_certificates` / `learn_enrollments` / `learn_settings` writable only by internal academy roles;
  - (b) instructor-scoped policies (own courses only);
  - (c) decide whether instructors are "staff" for `is_staff_in_any()` and search, and exclude `instructor` there if not;
  - (d) the same review for `studio_is_staff()` (counts any active membership; no self-serve path creates studio rows today).

**Owner-flow and gate defects:**
- Jobs employer membership email match is unverified (PR #349 class, 4 call sites).
- **Audit trail for customer actions (low, a consequence of #5).**
  - `add_audit_log_v2` requires `is_staff_in_any()`, so best-effort session audits by users whose only memberships are customer-facing (vendor, buyer, studio client) are now skipped. Every call site swallows the error, so no action fails.
  - Before the fix, those rows were written only for users who happened to hold such a membership.
  - If the trail is wanted, record customer-action audits through a service-role writer that sets the actor explicitly. Do not widen `is_staff_in_any`.
  - Call sites: studio proposal sign, revisions, milestones, asset unlock/download/packs, agency client review; marketplace report; account customize.
- Care slot-retire leaves DB staff for deleted accounts, and **care role changes never reach `profiles.role`** (the protect trigger blocks service-role updates), so offboarding needs the remediation script.
- `packages/auth` `requireUnifiedViewer` trusts an `x-supabase-user` header. Only unimported gates use it; strip the header at the edge before anything imports them.
- *(Fixed in this pass: the care owner-action secret's public-key fallback, see #11.)*

**Pre-existing defects found on the way (identical before and after this pass):**
- **Address default-setting fails.** `POST /api/addresses/set-default`, and creating an address as default when one exists, both fail with "cannot unset is_default on the only default address". That error comes from the nested demote inside `user_addresses_enforce_default`. Its insert branch also calls an unqualified `uuid_nil()`, which lives only in `extensions`.
- **No UI to end an impersonation.** `ImpersonationBanner`, the only caller of `endImpersonationAction`, is never rendered.
- **Care owner console, concurrent removals.** Two owners demoting each other at the same moment can both see a count of 2. Closing this needs server-side serialization (e.g. an advisory lock around the check and the write).
- **Care session path, non-string role.** `getAuthenticatedProfile` still coerces a non-string `app_metadata.role` with `String()`. Only the service role can set that value, so this affects malformed admin data only.

**Internal comms (recorded by round 6; pre-existing, not a self-grant):**
- **Safety-critical functions.** `hq_internal_comm_messages`, `_attachments` and `_presence` keep prod's table-level DML for `authenticated`. Their RLS rests entirely on `hq_ic_can_read_thread` / `hq_ic_can_write_thread` (and the storage bucket policies call the same functions). Treat any edit to those two functions as security-critical, and re-run invariant §9.
- **Presence self-insert (low).** `hq_ic_presence_upsert` checks only `user_id = auth.uid()`, so a signed-in user can write its **own** presence row against any thread id.
  - It confers no read or write: presence SELECT is gated by `hq_ic_can_read_thread`, and another user's id is refused.
  - To close it, add `thread_id is null or hq_ic_can_read_thread(thread_id)` to the presence INSERT/UPDATE checks in a separate pass.

Files: `review-staff-grants.sql`, `remediate-self-granted-staff.sql` (both also in `Downloads\V3-STAFF-SELFGRANT-FIX-01-*`).
