# Mirror the ci.yml "payments-grant-invariant" job locally on native PG17 — the
# full fresh-DB chain, ending with the new SEC-HARDEN-01 audit steps. Proves the
# money grant invariants stay GREEN and the audit grant invariant passes in the
# exact CI sequence.
$ErrorActionPreference = 'Stop'
$PSQL = 'C:\pg17\bin\psql.exe'
$ROOT = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ADMIN = 'postgresql://postgres:postgres@127.0.0.1:55432/postgres'
$DB = 'ci_grant_chain'
$URL = "postgresql://postgres:postgres@127.0.0.1:55432/$DB"

& $PSQL -X -v ON_ERROR_STOP=1 -d $ADMIN -c "drop database if exists $DB with (force);" | Out-Null
& $PSQL -X -v ON_ERROR_STOP=1 -d $ADMIN -c "create database $DB;" | Out-Null

$steps = @(
  'apps/hub/supabase/tests/_bootstrap_supabase_env.sql',
  'apps/hub/supabase/migrations/20260529120000_payment_intents.sql',
  'apps/hub/supabase/tests/payments_grant_invariant.sql',
  'apps/hub/supabase/migrations/20260605123000_payments_private_isolation.sql',
  'apps/hub/supabase/migrations/20260607120000_double_entry_ledger.sql',
  'apps/hub/supabase/tests/ledger_invariants.sql',
  'apps/hub/supabase/tests/ledger_grant_invariant.sql',
  'apps/hub/supabase/migrations/20260607130000_v3_18_payment_documents.sql',
  'apps/hub/supabase/tests/payment_documents_invariants.sql',
  'apps/hub/supabase/migrations/20260607140000_v3_vat_01_settlement_vat.sql',
  'apps/hub/supabase/tests/vat_invariants.sql',
  'apps/hub/supabase/tests/vat_grant_invariant.sql',
  'apps/hub/supabase/migrations/20260611130000_v3_19_refunds.sql',
  'apps/hub/supabase/tests/refunds_invariants.sql',
  'apps/hub/supabase/tests/refunds_grant_invariant.sql',
  # SEC-HARDEN-01 steps (mirror ci.yml)
  'apps/hub/supabase/tests/audit_fns_min.sql',
  'apps/hub/supabase/migrations/20260612120000_sec_harden_01_audit_grants_and_bucket.sql',
  'apps/hub/supabase/tests/audit_grant_invariant.sql'
)

$fail = $false
foreach ($s in $steps) {
  $p = Join-Path $ROOT $s
  $res = & $PSQL -X -v ON_ERROR_STOP=1 -d $URL -f $p 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: $s" -ForegroundColor Red
    $res | Select-Object -Last 12 | ForEach-Object { Write-Host "   $_" }
    $fail = $true; break
  } else {
    $note = ($res | Select-String -Pattern 'invariant: OK|invariant:|OK \(' | Select-Object -Last 1)
    Write-Host ("OK  {0}  {1}" -f $s.PadRight(64), $note) -ForegroundColor Green
  }
}
if ($fail) { exit 1 } else { Write-Host "`nALL CI GRANT-CHAIN STEPS GREEN (money invariants + audit invariant)" -ForegroundColor Green }
