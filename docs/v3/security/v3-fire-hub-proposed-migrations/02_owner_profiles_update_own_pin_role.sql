-- V3-FIRE-HUB · HELD MIGRATION 02 (HUB-2)
-- Finding: policy `owner_profiles_update_own` (UPDATE) has
--     USING       (auth.uid() = user_id)
--     WITH CHECK  (auth.uid() = user_id)
--   i.e. the WITH CHECK does NOT pin the privileged columns `role` / `is_active`.
--   An owner_profiles row holder can therefore UPDATE their OWN row to escalate
--   role (e.g. 'admin' -> 'owner') or flip is_active via the Data API.
--
-- LIVE EXPOSURE: latent. Prod currently has exactly ONE owner_profiles row
--   (user_id-bound, role='owner', is_active=true), so there is no privilege to gain
--   today. The hole becomes real the moment a second, lower-tier ('admin') row exists.
--
-- Fix: keep self-service of non-privileged columns, but column-revoke UPDATE on the
--   role/is_active columns from authenticated so a self-update can never change them.
--   Privileged changes continue to flow through the service-role / is_owner() write
--   policy (owner_profiles_owner_write). Column-grants are the least-breaking control
--   here (the row policy stays intact for benign self-edits).
--
-- POSTURE: READ-ONLY audit deliverable. DO NOT APPLY until architect re-verification.

revoke update (role, is_active) on public.owner_profiles from authenticated;

-- (Defense in depth) ensure the privileged write path remains owner/service-role only.
-- owner_profiles_owner_write already gates ALL on is_owner(); no change needed there.
