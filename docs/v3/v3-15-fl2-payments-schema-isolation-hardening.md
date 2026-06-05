# V3-15 FL2 hardening — move payment money-RPCs into a non-exposed schema

**Status:** REGISTERED, MUST land before FL2 live activation. · **Severity context:** defense-in-depth on a CONFIRMED-and-now-closed money bypass. · **Origin:** V3-15-FIX-01 (2026-06-05).

## Background
FL1 proved (on a real Postgres 17.6) that the `SECURITY DEFINER` money writers
`public.apply_payment_webhook` and `public.advance_payment_intent` were
EXECUTE-able by `anon`/`authenticated` via PostgREST (`/rest/v1/rpc/…`). A
signed-in user could self-confirm an intent to `succeeded` with zero money moved.
Root cause: Supabase bootstrap `alter default privileges … grant execute on
functions to anon, authenticated` adds DIRECT grants that `revoke … from public`
does not remove.

**Closed in FIX-01** (migration `20260529120000_payment_intents.sql`) by also
`revoke execute … from anon, authenticated` on the two money RPCs and the two
trigger functions. Verified before/after on a real DB: anon/authenticated
EXECUTE=false, attacker calls → permission denied, service_role path intact.

## Why this hardening (defense BY CONSTRUCTION, not by remembering)
The revoke is correct but is *defense by remembering*: every future function added
to `public` re-inherits the anon/authenticated default grant and must be revoked
again, or the hole reopens. The durable fix is to put the money writers in a
schema PostgREST cannot see, so they are unreachable via the REST API **by
construction** — no grant to get wrong.

## Why it was NOT done in FIX-01 (the involved part)
The account app calls these RPCs exclusively via supabase-js `admin.rpc(...)` →
PostgREST, which can only invoke functions in **exposed** schemas. The app has **no
direct-Postgres connection infrastructure** (no `pg`/`postgres`/pooler client, no
`DATABASE_URL`, no `.schema()` usage). So moving the functions to a non-exposed
`payments_private` schema requires either:
- (A) adding a direct Postgres connection to the app (new dep + pooled DB-URL
  secret + serverless pooling/cold-start handling) and calling
  `payments_private.<fn>(…)` over it — the real "by construction" path; or
- (B) exposing `payments_private` to PostgREST and granting EXECUTE to
  `service_role` only — which is back to grant-based protection (no construction
  win) plus a new exposed-schemas config dependency.
Introducing (A)'s new DB-connection surface into the money path in the same pass
that closes the bypass adds risk; hence deferred and registered here.

## Plan (do before FL2)
1. New migration: `create schema payments_private;` `revoke all on schema
   payments_private from public, anon, authenticated;` move the 4 functions into it
   (recreate there, `drop` the `public` copies), `grant usage on schema … to
   service_role` + `grant execute on function … to service_role` only. Keep the
   `enforce_payment_intent_transition` BEFORE-UPDATE trigger wired (trigger funcs
   may live in the private schema; the trigger still fires).
2. Add a pooled direct-Postgres client to the account app (transaction pooler URL
   as a server-only secret) and route the two money calls + the two
   `advance_payment_intent` calls + the webhook call through it
   (`select payments_private.apply_payment_webhook($1,$2,$3,$4)` etc.). Update the
   5 call sites in `apps/account/app/api/payments/**`.
3. Verify on a real DB: PostgREST cannot reach the functions at all (404/permission
   regardless of role); the server path still works end-to-end; the FL1 exploit
   stays dead.

## Acceptance
- `payments_private` not in PostgREST exposed schemas; `/rest/v1/rpc/apply_payment_webhook` unreachable for every role.
- All payment routes green via the direct-DB path; FL1 gauntlet + the exploit-blocked proof still pass.
- No regression to the A2 trigger / dedup / idempotency guarantees.
