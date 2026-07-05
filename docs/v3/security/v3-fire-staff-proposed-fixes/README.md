# V3-FIRE-STAFF — proposed fixes (HELD)

Staff division risk is in the **application layer** (the KYC/support API routes and all
newsletter routes use the service-role admin client, which bypasses RLS — so the TS gate
is the only control). These fixes are therefore **code changes, not SQL migrations**.
The one DB-adjacent item is a data remediation (`data-remediation_learn_academy_seed.sql`).

**POSTURE:** READ-ONLY audit deliverables. DO NOT APPLY until architect re-verification.
Specs are written as intent + minimal diff sketches, not finished patches.

---

## STAFF-1 (HIGH) — Dedicated KYC/identity-reviewer gate
**File:** `apps/staff/app/api/kyc/review/route.ts`
Replace the over-broad cross-division `viewerHasPermission(viewer, "division.moderate")`
with a dedicated identity-reviewer entitlement. Add a `kyc_reviewer` (or `identity_reviewer`)
role/family in `apps/staff/lib/roles.ts` and gate on it:

```diff
- if (!viewer || !viewerHasPermission(viewer, "division.moderate")) {
+ if (!viewer || !viewerHasAnyFamily(viewer, ["identity_reviewer", "system_admin"])) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }
```
Do this **before** onboarding any divisional moderator. (Optional, stronger: also record
which reviewer is entitled to which submission queue.) No live moderation-family holders
exist today, so this is a pre-onboarding control, not an incident fix.

## STAFF-2 (HIGH) — Newsletter separation of duties + campaign-scoped approve
**Files:** `apps/staff/lib/newsletter/service.ts:approveDraft`, `.../[id]/{approve,send}/route.ts`
1. Enforce 4-eyes in `approveDraft`/`runCampaignSend`: reject when the actor authored the draft.
```diff
  // in approveDraft (after loading `existing`)
+ if (existing.data.author_id && existing.data.author_id === input.actorId) {
+   return { ok: false, code: "invalid_state", message: "Approver must differ from author." };
+ }
```
2. Stop letting a one-division manager approve/send a platform-wide blast: gate approve/send on
   a newsletter-specific approver role (not the per-division `division.approve` union), and/or
   require the actor to hold approve **in the campaign's own division**
   (`viewer.divisions.some(m => m.division === campaign.division)`).

## STAFF-3 (MEDIUM) — Drop `user_metadata.role` from both auth stacks
**Files:** `apps/staff/lib/staff-auth.ts` (~L184-188), `packages/auth/src/viewer.ts` (~L139-142)
```diff
  const profileRole =
    profile?.role ||
-   (typeof user.app_metadata?.role === "string" ? user.app_metadata.role : null) ||
-   (typeof user.user_metadata?.role === "string" ? user.user_metadata.role : null) ||
+   (typeof user.app_metadata?.role === "string" ? user.app_metadata.role : null) ||
    null;
```
`app_metadata` is service-role-only (safe); `user_metadata` is user-writable — remove it.
Mirrors the SQL `is_staff_in()` source of truth (which already ignores `user_metadata`).

## STAFF-4 (MEDIUM) — Pin `test-send` recipient + rate-limit
**File:** `apps/staff/app/api/newsletter/drafts/[id]/test-send/route.ts`
Ignore a client-supplied arbitrary `to`; send the test only to the actor's own verified email
(or an explicit staff allowlist), and rate-limit per actor.
```diff
- const result = await sendTestDraft({ id, to: payload.to, actorId: viewer.user.id });
+ const to = viewer.user.email; // or: assert payload.to ∈ staff allowlist
+ const result = await sendTestDraft({ id, to, actorId: viewer.user.id });
```

## STAFF-5 (MEDIUM) — Match `user_id` only (drop email-OR)
**Files:** `apps/staff/lib/staff-auth.ts` (~L114-121), `packages/auth/src/viewer.ts` (~L106-116, L188-198)
```diff
- const filter = normalizedEmailAddress
-   ? `user_id.eq.${userId},normalized_email.eq.${normalizedEmailAddress}`
-   : `user_id.eq.${userId}`;
- const { data } = await admin.from(table).select(...).eq("is_active", true).or(filter);
+ const { data } = await admin.from(table).select(...).eq("is_active", true).eq("user_id", userId);
```
Then run the data remediation (`data-remediation_learn_academy_seed.sql`) to bind/deactivate
the one active `user_id`-null seed.

## STAFF-6 (MEDIUM) — Use the canonical suppression evaluator
**File:** `apps/staff/lib/newsletter/service.ts:runCampaignSend`
Replace the inline `suppressionEntries.filter(...).find(...)` block with a call to
`evaluateSuppression()` from `@henryco/newsletter` (`packages/newsletter/src/suppression.ts`),
passing the real `campaign_class`. That fixes the inverted `transactional_only` handling and
restores the support/trust/legal-hold gates the inline check drops.

## STAFF-8 (MEDIUM) — Give cross-division modules a real role gate
**Files:** `packages/dashboard-modules-staff/src/{staff-support,staff-moderation,staff-finance-operator,staff-overview,staff-settings}/…`
Replace `getRoleGate → { kind: "allow" }` with a membership/family check (e.g.
`hasStaffAccessIn(viewer, "account"|"support")` or the relevant moderation/finance family),
so the UI gate is not a no-op. RLS remains the backstop, but the UI must not over-expose.

## STAFF-9 (LOW) — Gate `suppress` on an audience role
**File:** `apps/staff/app/api/newsletter/suppress/route.ts`
Require a marketing/audience family (not bare `division.read` + `support_staff`) to add
suppression rows, to prevent subscriber-blocklist griefing.
