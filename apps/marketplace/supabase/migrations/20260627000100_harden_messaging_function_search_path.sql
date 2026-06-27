-- The Onyx Line (apply-time hardening) — pin a fixed search_path on the
-- participants pin trigger function (Supabase advisor: function_search_path_mutable).
-- The function only assigns NEW.* := OLD.* (no schema-qualified references), so
-- an empty search_path is safe and closes the search-path-injection vector.
-- Idempotent (create or replace).
create or replace function public.marketplace_conversation_participants_pin()
  returns trigger
  language plpgsql
  set search_path = ''
  as $$
  begin
    new.conversation_id := old.conversation_id;
    new.user_id := old.user_id;
    new.party_kind := old.party_kind;
    new.vendor_id := old.vendor_id;
    return new;
  end;
  $$;

-- end of migration --
