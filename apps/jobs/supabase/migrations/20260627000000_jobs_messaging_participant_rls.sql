-- The Onyx Line WS-5 (apply-time fix) — participant-scoped SELECT RLS for the
-- jobs hiring thread, so the realtime stream (added in 20260626130000) is
-- scoped per participant instead of default-deny-inert.
--
-- DISCOVERED AT APPLY: jobs_conversations / jobs_messages had RLS ENABLED but
-- ZERO policies (default-deny) on prod — the base messaging tables were created
-- by an out-of-repo migration that never added client SELECT policies. App reads
-- go through the service-role client (which bypasses RLS), so this was invisible
-- until realtime — which re-applies SELECT RLS per browser subscriber — needed
-- real policies to deliver anything (and without them the stream is inert, not
-- leaky: default-deny returns nothing).
--
-- SAFE + conservative: allows ONLY the two direct parties (the candidate, and
-- the conversation's employer user) to read their own thread; everyone else
-- stays denied. Mirrors the unified inbox filter
-- (.or(candidate_id.eq.userId, employer_id.eq.userId)). SELECT-only — writes
-- still go via the service-role send path. Idempotent (drop-if-exists/create).
--
-- IDEMPOTENT: yes.

drop policy if exists jobs_conversations_participant_read on public.jobs_conversations;
create policy jobs_conversations_participant_read
  on public.jobs_conversations
  for select
  using (
    candidate_id = (select auth.uid())
    or employer_id = (select auth.uid())
  );

drop policy if exists jobs_messages_participant_read on public.jobs_messages;
create policy jobs_messages_participant_read
  on public.jobs_messages
  for select
  using (
    exists (
      select 1 from public.jobs_conversations c
      where c.id = conversation_id
        and (
          c.candidate_id = (select auth.uid())
          or c.employer_id = (select auth.uid())
        )
    )
  );

-- end of migration --
