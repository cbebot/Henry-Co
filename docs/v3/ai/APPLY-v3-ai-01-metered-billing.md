# Apply runbook — `v3_ai_01_metered_billing` → prod (`rzkbgwuznmdxnnhmjazy`)

> **✅ APPLIED 2026-07-03 (owner-authorized, via Supabase MCP)** — dry-run (begin/rollback) clean
> with zero residue, then `apply_migration`. All probes passed: 3 `payments_private` RPCs
> anon ❌ / authenticated ❌ / service_role ✅ only; RLS ON both new tables; rate card live at
> version `2026-07-03` (deep `{0.8,4}` + 35% margin); ledger digest unchanged
> (71 lines, DR = CR = 4,515,000 kobo); guard smokes returned typed refusals; authed-stranger
> read of `ai_usage_events` = 0; advisors show only the by-design zero-policy lockbox INFO on
> `customer_wallet_ai_holds`. This document remains as the repeatable pattern for future
> money-adjacent applies.

**Precondition:** PR #371 is merged (the migration file carries the owner-reconciled rate card,
version `2026-07-03`). Source of truth:
`apps/hub/supabase/migrations/20260627120000_v3_ai_01_metered_billing.sql` @ `main`.

What it creates (all additive; money-spine untouched):
- `public.ai_usage_events` — per-call audit (RLS on; select-own; no client writes).
- `public.customer_wallet_ai_holds` — reservation lockbox (RLS on; deny-all; even service_role
  direct writes revoked — the SECURITY DEFINER RPCs are the only writers).
- `payments_private.reserve_wallet_for_ai_usage / post_ai_usage_charge / release_wallet_ai_hold`
  — SECURITY DEFINER, `search_path` pinned, **service_role-execute-only**.
- `pricing_rule_books` seed `ai-usage-rate-card-v1` @ `2026-07-03` (true-COGS rates; deep margin 0.35).

## Step 0 — baseline digest (run FIRST, save the numbers)

```sql
select count(*) as lines, sum(debit_minor) as dr, sum(credit_minor) as cr
from public.journal_lines;
```

## Step 1 — DRY RUN (rolls back; proves the migration runs clean on prod)

In the SQL editor, run as ONE statement block:

```sql
begin;
-- >>> paste the FULL contents of
-- apps/hub/supabase/migrations/20260627120000_v3_ai_01_metered_billing.sql (from main) here <<<
rollback;
```

Expect: success, no errors. (Everything is `if not exists` / `create or replace` — idempotent.)

## Step 2 — REAL APPLY

Same block, ending `commit;` instead of `rollback;`.

## Step 3 — verification probes (all must hold)

```sql
-- 1) RPC grants: service_role ONLY
select p.proname,
       has_function_privilege('anon',          p.oid, 'execute') as anon_exec,
       has_function_privilege('authenticated', p.oid, 'execute') as auth_exec,
       has_function_privilege('service_role',  p.oid, 'execute') as service_exec
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'payments_private'
  and p.proname in ('reserve_wallet_for_ai_usage','post_ai_usage_charge','release_wallet_ai_hold');
-- expect 3 rows: anon_exec = f, auth_exec = f, service_exec = t

-- 2) RLS is ON for both new tables
select relname, relrowsecurity from pg_class
where relname in ('ai_usage_events','customer_wallet_ai_holds');
-- expect relrowsecurity = t, t

-- 3) The reconciled rate card landed
select version,
       rules->'tiers'->'deep'->'rate'        as deep_rate,
       rules->'tiers'->'deep'->>'marginRate' as deep_margin
from public.pricing_rule_books
where rule_book_key = 'ai-usage-rate-card-v1';
-- expect version = 2026-07-03, deep_rate = {"in":0.8,"out":4,...}, deep_margin = 0.35

-- 4) Money digest UNCHANGED vs Step 0
select count(*) as lines, sum(debit_minor) as dr, sum(credit_minor) as cr
from public.journal_lines;
```

## Step 4 — record the applied version (reconciliation bookkeeping)

```sql
insert into supabase_migrations.schema_migrations (version, name)
values ('20260627120000', 'v3_ai_01_metered_billing')
on conflict do nothing;
```

## Step 5 — then the app side (I run these with your go)

1. Marketplace Vercel env: `ANTHROPIC_API_KEY` (yours to add — rotate first) +
   `NEXT_PUBLIC_HENRY_FLAG_AI_GATEWAY=true` → redeploy. (The master switch lights all three
   marketplace panels; per-surface `MARKETPLACE_AI_*` envs stay for isolating one surface later.)
2. Verify the refusal path: signed-in vendor, zero wallet → draft panel shows the calm
   "Top up your wallet to continue." — the provider is never called.
3. You fund a test wallet → one real metered draft → receipt shows ₦ + VAT with tier
   "Onyx Core" → re-run the digest: DR == CR, new `ai_usage_events` row, hold settled.
