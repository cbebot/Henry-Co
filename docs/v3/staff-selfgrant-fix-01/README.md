# V3-STAFF-SELFGRANT-FIX-01 — close the self-granted staff-role hole

**Class:** I-risk (identity) · privilege escalation · **blast radius:** care, logistics, jobs, hub, staff, account (+ property/learn/studio app gates)
**Status:** repo-only; migration **HELD for the owner's go**. Prod was paused and never touched. Money untouched.

## What was wrong

| # | Hole | Where | Reachable by |
|---|------|-------|--------------|
| 1 | `profiles_insert_own` checked only `id = auth.uid()`. The role guard `trg_profiles_protect_sensitive_fields` fires on UPDATE only. So a user **with no profiles row** could `POST /rest/v1/profiles {id, role:'staff'\|'owner'}`, and `is_staff_in()` (plus `is_staff_in_any`, `current_role`, `current_app_role`, `is_property_staff`, and 3 inline owner policies) trusted the bare column. | DB | any signed-in user without a row |
| 2 | Care `syncStaffIdentity()` **defaulted any account to `"staff"`** and read the self-writable `user_metadata.role`. It then wrote `profiles.role` + `app_metadata.role` with the **service role**. | `apps/care/lib/auth/staff-identity.ts` | any customer who signs in at care's staff login, or submits the staff password-recovery form. Also *every* listed user whenever the owner opened care's staff/security page (`reconcileStaffDirectory`) |
| 3 | Care `getAuthenticatedProfile()` and owner-actions `resolveLiveStaffRole()` ranked `user_metadata.role` **above** `profiles.role`. | care | any signed-in care user (`auth.updateUser({data:{role:'owner'}})`) |
| 4 | 8 more resolvers: `profile?.role \|\| app_metadata.role \|\| user_metadata.role`. | staff, hub, logistics, property, learn, studio, `@henryco/auth` | users without a profiles row |
| 5 | `owner_profiles_update_own` let a viewer/editor rewrite its own `role` to `owner`. That makes `is_owner()` true, which unlocks `admin_set_profile_role()`. | DB | owner-console viewers/editors |
| — | (pre-existing, fixed on the way) `is_owner()` recursed through `owner_profiles` RLS ("stack depth limit exceeded") for every request-role path that touched it, including a user reading their own `profiles` row. | DB | — |

## The fix — defense in depth, either layer alone holds

**Trust anchor:** a write is trusted iff the executing SQL role could bypass RLS anyway (`rolsuper OR rolbypassrls`): service_role, postgres, and SECURITY DEFINER RPC bodies. It is read from `current_user` inside SECURITY INVOKER triggers, which a client cannot forge.

**Grant record:** `public.staff_role_grants` (user_id-bound, RLS on, no policies, no request-role privileges). It is minted **only** when a trusted role itself *sets* `profiles.role`; a trusted write that leaves `role` untouched never mints one. Existing non-customer rows are backfilled so genuine staff keep access.

- **Layer W (write path), 4 independent mechanisms:** W1 privileges (no request-role INSERT; UPDATE only `full_name/phone/avatar_url`), W2 no INSERT policy, W3 BEFORE trigger, W4 DEFERRED "non-customer role ⇒ active matching grant" constraint trigger. Plus the owner_profiles guard (trigger + column revoke).
- **Layer R (read path):** every consumer of `profiles.role` requires the grant (`verified_profile_role()`).
- **App layer:** `user_metadata` is never a role/freeze/re-auth source. Care resolves staff only via the pure, tested `resolveProvisionedStaffRole()`: patch → `app_metadata` → profile, **no default**. With no provisioned role it refuses and writes nothing.

## Proof (local only)

- Prod-actual shadow (PG17 private cluster): hole reproduced pre-fix. Post-fix: every exploit variant is rejected; **each of W1–W4 alone** blocks; **layer R alone** (all write guards stripped) confers nothing, including a laundering attempt; all genuine paths G1–G11 work, plus owner-console O1–O2. Migration is idempotent (applied twice).
- The full CI SQL chain (76 steps) replays green locally. CI now runs `staff_selfgrant_min.sql` → migration ×2 → `staff_selfgrant_invariant.sql`.
- Money: md5 over the 30 money / `payments_private` function definitions + ACLs, and the money-table ACLs, is identical before and after.

## Day-of (see runbook §6 step "STAFF-SELFGRANT")

1. Run §6.2 and §6.3 **first** and record the verdicts. ⚠ This migration also makes `is_owner()` SECURITY DEFINER, which is exactly §6.2's probe for row #65 `hub_security_hardening`. Take #65's verdict from this pre-apply run; if it said UNAPPLIED, apply #65 anyway later.
2. Run **`review-staff-grants.sql`** (read-only; R1–R4 one at a time) and save every result.
3. Apply `apps/hub/supabase/migrations/20260924120000_v3_staff_selfgrant_fix_01.sql` (one `apply_migration`, name `v3_staff_selfgrant_fix_01`).
4. Post-apply check: `select count(*) from public.staff_role_grants where revoked_at is null` equals R1 `non_customer_profiles`, and `select public.is_owner()` works as a signed-in user.
5. The owner reviews R2 (population A) and R3 (population B, app-metadata-only staff), then fills `remediate-self-granted-staff.sql` step 1 → dry run (ROLLBACK) → check step 7 → change to COMMIT → run.
6. Deploy the app changes: they are safe before or after the migration and close holes 2–4 independently.

Files: `review-staff-grants.sql`, `remediate-self-granted-staff.sql` (both also in `Downloads\`).
