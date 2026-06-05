# V3-15-FIX-01 — payment RPC money-bypass: FIX APPLIED + FL2 schema-isolation hardening

**Owner-facing / team record.** Origin: V3-15-FL1 test-mode proof (2026-06-05).
Severity: **critical (money-truth bypass)** — confirmed exploitable, now **closed**.

---

## TL;DR (what was done)
- FL1 applied the committed `payment_intents` migration to a **real Postgres 17.6** and found the `SECURITY DEFINER` money writers were callable by `anon`/`authenticated` via PostgREST. A signed-in user could self-confirm a payment to `succeeded` with **zero money moved**.
- **Fixed** in `apps/hub/supabase/migrations/20260529120000_payment_intents.sql` by also revoking `EXECUTE` from `anon, authenticated` (not just `public`). **PR #220.**
- **Verified before/after on a real DB:** anon/authenticated EXECUTE → `false`, exploit → permission denied, `service_role` server path intact. `@henryco/payment-router` **96/96**.
- The migration is **committed-not-applied**, so the fix bakes in before FL2; **no production schema was changed, no live keys used.**
- The stronger *by-construction* isolation (non-exposed `payments_private` schema) is **REGISTERED below as MUST-land-before-FL2** — it needs a direct-DB connection the app doesn't have yet, so it was deferred rather than rushed into the money path.

---

## 1. The vulnerability (what was broken)
`public.apply_payment_webhook(...)` and `public.advance_payment_intent(...)` are
`SECURITY DEFINER` functions in the `public` schema, which PostgREST exposes at
`/rest/v1/rpc/<name>`. After applying the migration, their ACL was:

```
proacl = {postgres=X/postgres, anon=X/postgres, authenticated=X/postgres, service_role=X/postgres}
has_function_privilege('authenticated', 'apply_payment_webhook', 'EXECUTE') = TRUE
```

### Proven exploit (acting as the `authenticated` role)
```
1. INSERT own pending intent              (RLS insert_own — legitimate)
2. advance_payment_intent(pending→processing)              → {advanced:true}
3. apply_payment_webhook('paystack','forged', intent, 'succeeded') → {applied:true}
   ⇒ intent status = 'succeeded'  with ZERO money moved.
```
This bypasses the **entire** server route layer (sensitive-action reauth, the
provider charge, everything). The DB trigger does **not** stop it: `processing →
succeeded` is a *legal* transition; `enforce_payment_intent_transition` guards the
*shape* of a transition, never *who* may invoke the writer.

### Root cause
Supabase project bootstrap runs
`alter default privileges in schema public grant execute on functions to anon, authenticated`
— a **direct** grant. The migration's `revoke all … from public` removes only the
`PUBLIC` pseudo-role grant; the direct `anon`/`authenticated` grants survive, so the
revoke was effectively a no-op against the real REST exposure.

---

## 2. The fix applied (what changed)
File: `apps/hub/supabase/migrations/20260529120000_payment_intents.sql`. Each
existing `revoke … from public` now also revokes the direct role grants:

```sql
revoke all on function public.payments_set_updated_at()                      from public, anon, authenticated;
revoke all on function public.enforce_payment_intent_transition()            from public, anon, authenticated;
revoke all on function public.advance_payment_intent(uuid, text, text)       from public, anon, authenticated;
revoke all on function public.apply_payment_webhook(text, text, uuid, text)  from public, anon, authenticated;
```
`service_role` (the server route client, `createAdminSupabase()`) keeps its
`grant execute … to service_role`, so the legitimate path is unaffected.

**PR #220** — branch `fix/v3-15-payment-rpc-grant-hardening`:
- commit 1: the four revoke edits (+ inline comments on the money RPCs explaining *why*, so it isn't "simplified" back).
- commit 2: this hardening-registration doc.

---

## 3. Verification (evidence — real Postgres 17.6, before/after on one DB)

| | `anon` | `authenticated` | `service_role` | exploit as authenticated | server (`service_role`) |
|---|---|---|---|---|---|
| **BEFORE** (revoke-from-public only) | `true` | `true` | `true` | `advanced:true` → `applied:true` → **`succeeded` (no money)** | — |
| **AFTER** (the fix) | **`false`** | **`false`** | `true` | **BLOCKED / BLOCKED** (permission denied) | `applied:true` → `succeeded` ✅ |

- The **edited migration applies cleanly** from a clean slate (no syntax error).
- `@henryco/payment-router` suite on the fix branch: **96/96 pass, 0 fail** (SQL-only change; no TypeScript touched).
- Done on disposable free Supabase projects, all paused/teardown after; **production project untouched (read-only calls only); zero live keys.**

Full FL1 + FIX-01 evidence (gitignored): `.codex-temp/v3-15-paystack/{fl1-report,test-mode-runbook}.md`.

---

## 4. Remaining hardening — REGISTERED, MUST land before FL2

### Why (defense BY CONSTRUCTION, not by remembering)
The revoke is correct but is *defense by remembering*: every future function added
to `public` re-inherits the anon/authenticated default grant and must be revoked
again, or the hole reopens. The durable fix is to put the money writers in a schema
PostgREST cannot see, so they are unreachable via REST **by construction** — no
grant to get wrong.

### Why it was NOT done in this pass (the involved part)
The account app calls these RPCs exclusively via supabase-js `admin.rpc(...)` →
PostgREST, which can only invoke functions in **exposed** schemas. The app has **no
direct-Postgres connection infrastructure** (no `pg`/`postgres`/pooler client, no
`DATABASE_URL`/`POSTGRES_URL`, no `.schema()` usage anywhere). So moving the
functions to a non-exposed `payments_private` schema requires either:
- **(A)** adding a pooled direct-Postgres client to the app (new dependency + a
  pooled DB-URL server secret + serverless pooling / cold-start handling) and
  calling `payments_private.<fn>(…)` over it — the real "by construction" path; or
- **(B)** exposing `payments_private` to PostgREST and granting EXECUTE to
  `service_role` only — which is back to grant-based protection (no construction
  win) plus a new exposed-schemas config dependency.

Introducing (A)'s new DB-connection surface into the money path **in the same pass
that closes the bypass** trades one risk for another, so it is deferred and
registered here.

### Plan (before FL2)
1. New migration: `create schema payments_private;`
   `revoke all on schema payments_private from public, anon, authenticated;` move
   the 4 functions into it (recreate there, `drop` the `public` copies),
   `grant usage on schema … to service_role` + `grant execute on function … to
   service_role` only. Keep the `enforce_payment_intent_transition` BEFORE-UPDATE
   trigger wired (trigger functions may live in the private schema; the trigger
   still fires).
2. Add a pooled direct-Postgres client to the account app (transaction-pooler URL
   as a server-only secret) and route the 5 money call sites in
   `apps/account/app/api/payments/**` through it
   (`select payments_private.apply_payment_webhook($1,$2,$3,$4)` etc.).
3. Verify on a real DB: PostgREST cannot reach the functions at all (regardless of
   role); the server path still works end-to-end; the FL1 exploit stays dead.

### Acceptance
- `payments_private` not in PostgREST exposed schemas; `/rest/v1/rpc/apply_payment_webhook` unreachable for every role.
- All payment routes green via the direct-DB path; FL1 gauntlet + the exploit-blocked proof still pass.
- No regression to the A2 trigger / dedup / idempotency guarantees.

---

## 5. Status & owner actions
- **PR #220** ready; required check `Lint, typecheck, test, build` is the only gate (squash-merge per the V3 hub pipeline). Vercel preview "fails" are the known auto-canceled noise.
- Migration stays **committed-not-applied**; applies at FL2 activation with the fix baked in.
- Three disposable test projects were paused (free, $0/mo); delete from the Supabase dashboard when convenient: `fl1-paystack-testproof`, `fl1-fix-verify`, `fl1-fix01-beforeafter`.
- **Before FL2:** (a) land this schema-isolation hardening, (b) run the live Paystack legs (gates 1/2/3 + real-key HMAC) once `sk_test_`/`pk_test_` are available, (c) build the deferred `/payments/callback` page + checkout entry UI.
