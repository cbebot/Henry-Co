-- STUDIO-CP-01 — Seed data for the client portal.
--
-- Creates a single demo project owned by the first existing client lead
-- (or no-ops if no leads exist yet). The seed is idempotent: it uses
-- fixed UUIDs so re-running the migration does not duplicate rows.
--
-- We intentionally seed only the structural records (project, milestones,
-- one deliverable, one invoice, one welcome message) — no fake activity
-- pretending to be from real staff. The activity feed will populate
-- naturally as real engagement happens.

do $$
declare
  demo_project_id constant uuid := 'cccccc01-0000-4000-a000-000000000001';
  demo_milestone_kickoff_id constant uuid := 'cccccc01-0000-4000-b000-000000000001';
  demo_milestone_design_id constant uuid := 'cccccc01-0000-4000-b000-000000000002';
  demo_milestone_build_id constant uuid := 'cccccc01-0000-4000-b000-000000000003';
  demo_invoice_id constant uuid := 'cccccc01-0000-4000-c000-000000000001';
  demo_deliverable_id constant uuid := 'cccccc01-0000-4000-d000-000000000001';
  demo_message_id constant uuid := 'cccccc01-0000-4000-e000-000000000001';
  demo_update_id constant uuid := 'cccccc01-0000-4000-f000-000000000001';
  resolved_lead_id uuid;
  resolved_proposal_id uuid;
  resolved_service_id text;
  candidate_email text;
  candidate_user_id uuid;
begin
  select id into resolved_service_id from public.studio_services limit 1;
  if resolved_service_id is null then
    return;
  end if;

  select id, user_id, normalized_email
    into resolved_lead_id, candidate_user_id, candidate_email
  from public.studio_leads
  order by created_at asc
  limit 1;

  if resolved_lead_id is null then
    return;
  end if;

  select id into resolved_proposal_id
  from public.studio_proposals
  where lead_id = resolved_lead_id
  order by created_at asc
  limit 1;

  if resolved_proposal_id is null then
    insert into public.studio_proposals (
      id,
      lead_id,
      access_token_hash,
      status,
      title,
      summary,
      investment,
      deposit_amount,
      currency,
      valid_until,
      service_id,
      package_id,
      scope_bullets,
      comparison_notes
    )
    values (
      gen_random_uuid(),
      resolved_lead_id,
      encode(digest('studio-cp-01-demo', 'sha256'), 'hex'),
      'accepted',
      'Demo engagement — Studio onboarding template',
      'A seeded engagement so the client portal renders end-to-end immediately after deployment.',
      450000,
      180000,
      'NGN',
      timezone('utc', now()) + interval '30 days',
      resolved_service_id,
      null,
      array['Discovery and brief alignment', 'Brand and UX direction', 'Build and launch'],
      array['Replace with the live proposal once the real engagement begins.']
    )
    returning id into resolved_proposal_id;
  end if;

  insert into public.studio_projects (
    id,
    proposal_id,
    lead_id,
    access_token_hash,
    client_user_id,
    normalized_email,
    status,
    title,
    summary,
    next_action,
    service_id,
    confidence,
    brief,
    project_type,
    start_date,
    estimated_completion
  )
  values (
    demo_project_id,
    resolved_proposal_id,
    resolved_lead_id,
    encode(digest('studio-cp-01-demo-project', 'sha256'), 'hex'),
    candidate_user_id,
    candidate_email,
    'active',
    'Studio onboarding — demo project',
    'A seeded project so your client portal opens with a real shape: milestones, an invoice, a deliverable, and a welcome message from the studio team.',
    'Confirm the design direction in the next milestone review.',
    resolved_service_id,
    72,
    'This is a placeholder brief. Once your real engagement starts, the actual project brief and scope notes will appear here.',
    'website',
    current_date,
    current_date + interval '45 days'
  )
  on conflict (id) do nothing;

  insert into public.studio_project_milestones (
    id, project_id, name, description, due_label, amount, status, sort_order, due_date
  )
  values
    (demo_milestone_kickoff_id, demo_project_id, 'Kickoff and brief alignment',
     'Discovery call, brief sign-off, scope confirmation.',
     'Week 1', 90000, 'approved', 0, current_date + interval '7 days'),
    (demo_milestone_design_id, demo_project_id, 'Design direction',
     'Visual language, key screens, motion intent.',
     'Week 3', 180000, 'in_progress', 1, current_date + interval '21 days'),
    (demo_milestone_build_id, demo_project_id, 'Build, launch, handover',
     'Production build, QA, launch, knowledge transfer.',
     'Week 6', 180000, 'planned', 2, current_date + interval '42 days')
  on conflict (id) do nothing;

  insert into public.studio_invoices (
    id, project_id, milestone_id, client_user_id, normalized_email,
    invoice_number, amount_kobo, currency, description, due_date, status, invoice_token
  )
  values (
    demo_invoice_id,
    demo_project_id,
    demo_milestone_design_id,
    candidate_user_id,
    candidate_email,
    'STUDIO-DEMO-0001',
    18000000,
    'NGN',
    'Milestone 2 deposit — Design direction',
    timezone('utc', now()) + interval '7 days',
    'sent',
    encode(digest('studio-cp-01-demo-invoice', 'sha256'), 'hex')
  )
  on conflict (id) do nothing;

  insert into public.studio_deliverables (
    id, project_id, milestone_id, label, summary, status,
    file_type, version, shared_at
  )
  values (
    demo_deliverable_id,
    demo_project_id,
    demo_milestone_kickoff_id,
    'Discovery summary',
    'A short PDF summarising the kickoff conversation, agreed scope, and what to expect across the engagement.',
    'shared',
    'pdf',
    1,
    timezone('utc', now()) - interval '2 days'
  )
  on conflict (id) do nothing;

  insert into public.studio_project_messages (
    id, project_id, sender, sender_role, body, is_internal, created_at
  )
  values (
    demo_message_id,
    demo_project_id,
    'HenryCo Studio',
    'team',
    'Welcome to your client portal. Everything about your project lives here — milestones, files, payments, and a direct line to the team. Reply any time.',
    false,
    timezone('utc', now()) - interval '1 day'
  )
  on conflict (id) do nothing;

  insert into public.studio_project_updates (
    id, project_id, kind, update_type, title, summary, body, metadata
  )
  values (
    demo_update_id,
    demo_project_id,
    'note',
    'note',
    'Portal opened',
    'Your client portal is live. Use the dashboard to track progress, files, and payments.',
    'You can use this space to message the team, approve deliverables, and pay milestone invoices. We will keep this feed updated as the project moves forward.',
    jsonb_build_object('seed', true)
  )
  on conflict (id) do nothing;
end $$;
