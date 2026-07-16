-- Security hardening (advisor 0011 function_search_path_mutable): pin the
-- search_path on the account_set_updated_at trigger function so a malicious
-- search_path can never hijack its unqualified now()/timezone() calls. The
-- function only references pg_catalog builtins + NEW, so an empty search_path is
-- safe (pg_catalog is always resolved implicitly).
--
-- Applied to prod rzkbgwuznmdxnnhmjazy on 2026-07-14; this file mirrors it so
-- repo and prod stay aligned.
alter function public.account_set_updated_at() set search_path = '';
