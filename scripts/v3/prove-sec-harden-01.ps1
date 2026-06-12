# SEC-HARDEN-01 proof runner (native PG17 @ 127.0.0.1:55432).
# Builds a throwaway DB, proves the hole open BEFORE and dead AFTER the migration,
# and runs `supabase db advisors --db-url` before/after to capture the advisor
# findings clearing. Self-contained — no prod contact, no prod DDL.
$ErrorActionPreference = 'Stop'
$PSQL = 'C:\pg17\bin\psql.exe'
$ROOT = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)   # repo root
$ADMIN = 'postgresql://postgres:postgres@127.0.0.1:55432/postgres'
$DBNAME = 'sec_harden_01'
$DBURL = "postgresql://postgres:postgres@127.0.0.1:55432/$DBNAME"
$ADVURL = "$DBURL`?sslmode=disable"   # advisors CLI insists on explicit sslmode for local PG
$MIG = Join-Path $ROOT 'apps\hub\supabase\migrations\20260612120000_sec_harden_01_audit_grants_and_bucket.sql'
$BEFORE = Join-Path $PSScriptRoot 'prove-sec-harden-01.sql'
$AFTER  = Join-Path $PSScriptRoot 'prove-sec-harden-01-after.sql'
$LINT   = Join-Path $PSScriptRoot 'lint-replica.sql'
$OUT = Join-Path $ROOT '.codex-temp\sec-harden-01'
New-Item -ItemType Directory -Force -Path $OUT | Out-Null

Write-Host "== reset throwaway DB $DBNAME ==" -ForegroundColor Cyan
& $PSQL -X -v ON_ERROR_STOP=1 -d $ADMIN -c "drop database if exists $DBNAME with (force);" | Out-Null
& $PSQL -X -v ON_ERROR_STOP=1 -d $ADMIN -c "create database $DBNAME;" | Out-Null
# The advisor function-executable lints inherit the exposed schema from PostgREST.
& $PSQL -X -v ON_ERROR_STOP=1 -d $ADMIN -c "alter database $DBNAME set pgrst.db_schemas = 'public';" | Out-Null

Write-Host "== build surface + BEFORE assertions ==" -ForegroundColor Cyan
& $PSQL -X -v ON_ERROR_STOP=1 -d $DBURL -f $BEFORE 2>&1 | Tee-Object (Join-Path $OUT 'proof-before.txt')

Write-Host "== advisor lint replica BEFORE ==" -ForegroundColor Cyan
& $PSQL -X -v ON_ERROR_STOP=1 -d $DBURL -f $LINT 2>&1 | Tee-Object (Join-Path $OUT 'advisors-before.txt')

Write-Host "== apply migration ==" -ForegroundColor Cyan
& $PSQL -X -v ON_ERROR_STOP=1 -d $DBURL -f $MIG 2>&1 | Tee-Object (Join-Path $OUT 'migration-apply.txt')

Write-Host "== AFTER assertions ==" -ForegroundColor Cyan
& $PSQL -X -v ON_ERROR_STOP=1 -d $DBURL -f $AFTER 2>&1 | Tee-Object (Join-Path $OUT 'proof-after.txt')

# Idempotency: re-apply the migration; AFTER must still hold.
Write-Host "== re-apply migration (idempotency) ==" -ForegroundColor Cyan
& $PSQL -X -v ON_ERROR_STOP=1 -d $DBURL -f $MIG 2>&1 | Out-Null
& $PSQL -X -v ON_ERROR_STOP=1 -d $DBURL -f $AFTER 2>&1 | Tee-Object (Join-Path $OUT 'proof-after-reapply.txt') | Out-Null

Write-Host "== advisor lint replica AFTER ==" -ForegroundColor Cyan
& $PSQL -X -v ON_ERROR_STOP=1 -d $DBURL -f $LINT 2>&1 | Tee-Object (Join-Path $OUT 'advisors-after.txt')

Write-Host "== DONE — artifacts in $OUT ==" -ForegroundColor Green

