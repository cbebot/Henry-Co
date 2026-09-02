-- V3-41 CI FIDELITY SEED — make the predictive migration's table-grant REVOKES load-bearing.
--
-- _bootstrap_supabase_env.sql reproduces Supabase's standing default privileges only
-- for FUNCTIONS. On prod, Supabase ALSO auto-grants broad table privileges to the
-- request roles at table creation; on vanilla CI Postgres a fresh table carries no
-- request-role ACL, so the migration's revokes would be no-ops and the grant
-- invariant would FALSE-GREEN (the personalization_min.sql lesson, restated).
--
-- Run this BEFORE 20260902120000_v3_41_predictive_quality_workload.sql. Rather than
-- duplicating the schema, it reproduces the prod condition at its root: default TABLE
-- privileges for tables created from here on. Every table the predictive migration
-- then creates receives the broad request-role ACL exactly as on prod, and the
-- migration's revokes genuinely strip it.

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;

select 'v3-41 predictive fidelity seed ready' as status;
