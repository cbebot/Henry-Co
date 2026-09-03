-- F-11 — marketplace_review_votes has SELECT USING(true), which would expose
-- voter_user_id (mapping users to the reviews they up/down-voted). 0 rows today, so
-- latent, but fix before the feature carries data. Restrict read to the voter + staff;
-- vote tallies should be served as server-side aggregates (via service_role), not by
-- exposing raw vote rows to the Data API.

drop policy if exists marketplace_review_votes_public_read on public.marketplace_review_votes;

create policy marketplace_review_votes_owner_read on public.marketplace_review_votes
for select using (voter_user_id = (select auth.uid()));

create policy marketplace_review_votes_staff_read on public.marketplace_review_votes
for select using (
  exists (select 1 from public.marketplace_role_memberships m
          where m.user_id = (select auth.uid()) and m.is_active
            and m.role = any (array['marketplace_owner','marketplace_admin','moderation']))
);
-- (The existing owner ALL policy marketplace_review_votes_owner_write is retained.)
