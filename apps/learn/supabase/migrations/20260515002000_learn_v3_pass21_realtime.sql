-- V3 PASS 21 — Publish learn live surfaces to Supabase Realtime.
-- Adds discussions, live sessions, and assignment submissions so the UI
-- can subscribe to new replies / live-session status changes / grading events.

do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    begin
      alter publication supabase_realtime add table public.learn_discussions;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.learn_live_sessions;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.learn_assignment_submissions;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.learn_assignment_grades;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.learn_lesson_playback;
    exception when duplicate_object then null;
    end;
  end if;
end$$;
