-- F-13 — The UPDATE policy on marketplace_user_comm_preferences omits WITH CHECK.
-- Postgres reuses USING as WITH CHECK when absent, so it is NOT exploitable, but make
-- the row-reassignment guard explicit for clarity / defense-in-depth.

drop policy if exists marketplace_member_comm_preferences_update on public.marketplace_user_comm_preferences;
create policy marketplace_member_comm_preferences_update on public.marketplace_user_comm_preferences
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
