-- V3-40 CI FIDELITY SEED — make the risk migration's table-grant REVOKES load-bearing.
--
-- _bootstrap_supabase_env.sql reproduces Supabase's standing default privileges only
-- for FUNCTIONS. On prod, Supabase ALSO auto-grants broad table privileges to the
-- request roles at table creation; on vanilla CI Postgres a fresh table carries no
-- request-role ACL, so the migration's revokes would be no-ops and the grant
-- invariant would FALSE-GREEN (the personalization_min.sql lesson).
--
-- Run this BEFORE 20260725120000_v3_40_risk_scores_and_models.sql. Instead of
-- duplicating the schema (the personalization_min approach), it reproduces the prod
-- condition at its root: default TABLE privileges for tables created from here on.
-- Every table the risk migration then creates receives the broad request-role ACL
-- exactly as on prod, and the migration's revokes genuinely strip it. (Any chain
-- step appended after this one inherits the same prod-faithful condition — which is
-- the point: on prod there is no opt-out.)

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;

select 'v3-40 risk fidelity seed ready' as status;
