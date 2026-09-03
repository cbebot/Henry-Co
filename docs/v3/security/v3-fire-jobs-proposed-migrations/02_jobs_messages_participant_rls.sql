-- JOB-8 (forward-looking) — jobs_messages and jobs_conversations are on the supabase_realtime
-- publication (with replica identity full) but currently have ZERO policies. That is SAFE today
-- (RLS-on + 0-policy = deny-all; the live probe confirmed anon=0 and authenticated-stranger=0), BUT
-- it also means the realtime channel delivers nothing to legitimate participants. The WRONG fix is a
-- permissive policy to "make realtime work" — that opens cross-tenant DM streaming. The RIGHT fix is
-- a PARTICIPANT-SCOPED SELECT policy, so realtime is both functional and leak-proof.
--
-- NOTE: jobs_conversations stores the owner FKs as candidate_id / employer_id (auth user ids).
-- jobs_applications uses candidate_id (NOT candidate_user_id — confirm exact column names on prod
-- before applying; the in-repo V3-PASS-21 feature policies reference a candidate_user_id that does
-- not exist on prod). Adjust the column names below to match prod.

create policy jobs_conversations_participant_read on public.jobs_conversations
for select to authenticated
using (
  candidate_id = (select auth.uid())
  or employer_id = (select auth.uid())
);

create policy jobs_messages_participant_read on public.jobs_messages
for select to authenticated
using (
  exists (
    select 1 from public.jobs_conversations c
    where c.id = jobs_messages.conversation_id
      and (c.candidate_id = (select auth.uid()) or c.employer_id = (select auth.uid()))
  )
);

-- Writes remain service_role-only (the app posts via the admin client after the app-layer
-- ownership check); do NOT add INSERT/UPDATE policies for anon/authenticated here.
