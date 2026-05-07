-- Repair live Studio environments where project updates were created with
-- the older dashboard shape (`description`) instead of the portal feed shape
-- (`kind` + `summary`). This is additive and preserves every existing row.

alter table public.studio_project_updates
  add column if not exists kind text,
  add column if not exists summary text;

update public.studio_project_updates
set
  kind = coalesce(nullif(kind, ''), 'note'),
  summary = coalesce(nullif(summary, ''), nullif(description, ''), nullif(title, ''), 'Project update')
where kind is null
   or kind = ''
   or summary is null
   or summary = '';

alter table public.studio_project_updates
  alter column kind set default 'note';
