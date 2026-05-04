-- STUDIO-CP-02 — Brief Co-pilot anti-abuse columns.
-- Adds the columns the server action uses to enforce the
-- "company AI, not your free GPT" cost guard rails:
--
--   * ip_hash      — SHA-256 of the request IP, used for the per-IP
--                    daily backstop. We never store the raw IP.
--   * input_hash   — SHA-256 of the trimmed lower-cased raw_input,
--                    used for 24h dedup so a client mashing the
--                    button with the same paragraph hits cache, not
--                    the model.
--   * intent       — discriminator for future copilot features that
--                    will share this table (today only "studio_brief").
--
-- All additions are nullable / defaulted so the migration is safe to
-- replay against an existing populated table.

alter table public.studio_brief_drafts
  add column if not exists ip_hash text,
  add column if not exists input_hash text,
  add column if not exists intent text not null default 'studio_brief';

create index if not exists studio_brief_drafts_ip_idx
  on public.studio_brief_drafts(ip_hash, created_at desc);

create index if not exists studio_brief_drafts_input_hash_idx
  on public.studio_brief_drafts(input_hash, created_at desc);

create index if not exists studio_brief_drafts_intent_idx
  on public.studio_brief_drafts(intent, status, created_at desc);
