-- Keep thread ordering fresh when messages arrive (redundant with app updates, safe if both run)

begin;

create or replace function public.hq_internal_comm_touch_thread_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.hq_internal_comm_threads
  set updated_at = timezone('utc', now())
  where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists hq_internal_comm_messages_touch_thread on public.hq_internal_comm_messages;
create trigger hq_internal_comm_messages_touch_thread
after insert on public.hq_internal_comm_messages
for each row execute function public.hq_internal_comm_touch_thread_updated_at();

commit;
