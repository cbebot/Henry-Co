# STUDIO — Division Rebuild Prompt (V3 PASS 21)

```
TOOL: Claude Code (Opus 4.7 · 1M context · xhigh effort)
PROJECT: HenryCo Ecosystem · henrycogroup.com
DIVISION: HenryCo Studio
LIVE DOMAIN: studio.henrycogroup.com
REPO: github.com/cbebot/Henry-Co
branch: main (Vercel auto-deploy)
BACKEND: Supabase (single project, multi-app schema)
PASS: V3 PASS 21 — DIVISION REBUILD · STUDIO
EXPECTED DURATION: Long. Studio is the most "agency-shaped" division
                   (~21k LOC, 12 app-local migrations, premium services
                   with multi-stakeholder client/PM/sales/delivery
                   workflows). It is the only division with both a
                   public service catalogue and a complete client portal.
```

═══════════════════════════════════════════════════════
ROLE
═══════════════════════════════════════════════════════

Principal product architect, division systems strategist, and
implementation engineer for HenryCo Studio. Ship code; self-verify
against V1–V13 + studio-specific gates.

═══════════════════════════════════════════════════════
SCOPE
═══════════════════════════════════════════════════════

Rebuild Studio end-to-end:

- Public surfaces (`studio.henrycogroup.com`)
- Client (project-stakeholder) authenticated surface
- Sales authenticated surface
- PM (project manager) authenticated surface
- Delivery authenticated surface
- Finance authenticated surface
- Operator surfaces (admin, owner)
- Supabase tables + RLS for studio
- APIs + crons + webhooks
- Studio-specific components

Out of scope: shared shell + cross-division packages; other divisions.

═══════════════════════════════════════════════════════
CONTEXT — read in this order
═══════════════════════════════════════════════════════

1. `docs/v3/V3-DISCOVERY-INVENTORY.md`
2. `docs/dashboard/DASHBOARD-REBUILD-PROMPT-V2-FINAL.md`
3. `packages/config/company.ts` — `COMPANY.divisions.studio` (accent
   `#4AC1C5`, accentText `#1F7375`)
4. `apps/studio/` — every existing route, lib, component
5. `apps/studio/supabase/migrations/*` — 12 migrations including
   `20260503120000_studio_client_portal.sql`,
   `20260503130000_studio_brief_drafts.sql`,
   `20260503140000_studio_messaging.sql`,
   `20260505110000_studio_live_schema_guards.sql`
6. `apps/studio/lib/studio/settings-shared.ts` (uncommitted edits — V3
   E2 family)
7. `packages/messaging-thread/` (studio /client uses messaging-thread)
8. `packages/chat-composer/` (studio support reply uses composer +
   AI draft refine bot per Phase 3b)
9. `apps/studio/app/api/portal/download/route.ts` (server-proxy for
   client portal downloads — V5-2 dashboard fix)
10. `apps/studio/app/api/webhooks/whatsapp/route.ts` — V5-3 §12 HMAC
    pending (V3 B1)

═══════════════════════════════════════════════════════
AUDIT SUMMARY — current state at SHA `e5e277a`
═══════════════════════════════════════════════════════

### Routes shipped (public)
- `/` (home), `/about`, `/services`, `/services/[slug]`
- `/work`, `/work/[slug]`, `/teams`, `/teams/[slug]`
- `/pick`, `/pick/[slug]` (template browser)
- `/pricing`, `/process`, `/policies`, `/policies/[slug]`,
  `/trust`, `/faq`, `/contact`
- `/request` (brief builder)
- `/login`, `/pay/[paymentId]`, `/payment`

### Routes shipped (client portal)
- `/client` (overview), `/client/dashboard`, `/client/projects`
- `/client/projects/[projectId]`, `/client/projects/[projectId]/messages`
- `/client/proposals`, `/client/payment/[invoiceId]`,
  `/client/payments`
- `/client/messages`, `/client/files`, `/client/notifications`,
  `/client/profile`, `/client/reviews`

### Routes shipped (operator personas)
- `/sales` (overview), `/sales/leads`, `/sales/match`, `/sales/proposals`
- `/pm` (overview), `/pm/projects`, `/pm/revisions`
- `/delivery`, `/delivery/assets`
- `/finance`, `/finance/invoices`, `/finance/payments`
- `/owner`, `/admin`
- `/support`, `/support/[threadId]`
- `/project/[projectId]`, `/proposals/[proposalId]`,
  `/checkout/template/[slug]`

### API routes
- `/api/auth/logout`, `/api/locale`
- `/api/cron/studio-automation`
- `/api/portal/download` (V5-2 server proxy ✓)
- `/api/studio/domain-check`
- `/api/support/create`, `/api/support/reply`
- `/api/webhooks/resend` (HMAC ✓)
- `/api/webhooks/whatsapp` (HMAC pending — V5-3 B1)

### Database
- 12 app-local migrations including:
  - Studio init + policies + extensions
  - Brief domain intent (V2 sales)
  - Client portal (`20260503120000_studio_client_portal.sql`)
  - Brief drafts (`20260503130000_studio_brief_drafts.sql`) +
    drafts guards
  - Studio messaging (`20260503140000_studio_messaging.sql`)
  - Live schema guards + project updates live drift + legacy table
    compatibility (recent hardening)

Tables likely: `studio_briefs`, `studio_brief_drafts`, `studio_proposals`,
`studio_projects`, `studio_project_updates`, `studio_messaging_*`,
`studio_invoices`, `studio_payments`, `studio_templates`, `studio_teams`,
`studio_team_members`, `studio_files`, `studio_reviews`,
`studio_client_portal_*`.

### Existing strengths
- Most complete service-business stack of any division
- Brief builder (`/request`) → proposal → project → delivery flow
- Template-driven pricing with `/pick` browser
- Client portal end-to-end (V2 wave)
- Phase 3b: AI draft refine bot in /client message composer
- Server-proxy download via `/api/portal/download` (V5-2 fix)
- Real prices/timelines/packages on 14 templates (V5-3, uncommitted)

### Known gaps and bugs
- **WhatsApp HMAC** missing (V5-3 B1).
- **`apps/studio/lib/studio/settings-shared.ts`** uncommitted edits.
- **Brief builder** at `/request` — needs polish; multi-step with auto-save,
  domain intent classification (per `studio_brief_domain_intent`), preview,
  estimated price + timeline.
- **Proposal** flow — proposal accept → project create. Needs e-signature
  (similar to jobs offer letter) and proposal-version diff.
- **Project workspace** — `/client/projects/[projectId]` and
  `/project/[projectId]` may have IA overlap; consolidate to one
  canonical surface (preferably `/client/projects/[projectId]` for
  client + `/pm/projects/[projectId]` for PM).
- **Project updates** — `studio_project_updates` table exists; needs
  premium update card UI with photos + status + milestone tracking +
  client acknowledgement.
- **Revisions** — `/pm/revisions` exists; needs revision request flow
  with versioning, before/after preview, approval cycle.
- **Delivery / assets** — `/delivery/assets` is the asset handoff surface;
  needs Cloudinary/Supabase Storage zip-export + branded asset pack
  with brand guidelines.
- **Sales pipeline** — `/sales/leads`, `/sales/match`, `/sales/proposals`
  need kanban with drag-to-move, lead → opportunity → proposal →
  closed-won/lost lifecycle.
- **PM workspace** — `/pm` is overview only; needs Gantt/timeline view,
  resource allocation, milestone tracking, blocker queue.
- **Finance** — invoices + payments shipped; needs aging report,
  payment plan, multi-currency settlement.
- **Templates** — V5-3 14 templates uncommitted; commit + verify pricing
  governance via `@henryco/pricing`.
- **Notifications-ui** wired in /client; verify on every shell.
- **Search palette** not mounted (V3 H1).
- **HenryCoHeroCard** consumed (V2-HERO-01 ✓ on /home).
- **Studio module** in account dashboard — verify routes through to
  /client; or just deep-link.
- **Support** — `/support/[threadId]` uses messaging-thread (Phase 3a ✓).

### Cross-division
- Hub directory → studio ✓
- Account `?module=studio` ✓
- Studio → marketplace integration: vendor with branded storefront could
  pay studio for storefront design (V3 gap)
- Studio → jobs: studio's "team" pages could feed jobs employer
  verification (V3 gap)

═══════════════════════════════════════════════════════
DEEP AUDIT FINDINGS
═══════════════════════════════════════════════════════

| Dimension | Finding |
|---|---|
| **IA** | Public discovery + brief + proposal + project + delivery + finance — the broadest IA of any division. Some surfaces overlap (`/project/[id]` vs `/client/projects/[id]`); consolidate. |
| **Flow logic** | Discover → Pick template OR Request brief → Proposal → Accept (e-signature ✗) → Project → Update → Revision → Delivery → Review — most steps shipped; e-signature + revision cycle thin. |
| **Cross-division** | Studio is the highest-touch service; could power storefront design for marketplace vendors (V3 gap). |
| **Empty / loading / error** | Inconsistent across operator surfaces. |
| **Competitor parity** | Toptal / Working Not Working / 99designs / Ueno (defunct ref) / IDEO — best-in-class for: public service catalogue, project portal with client + PM coordination, asset delivery, billing transparency, contract e-signature, revision cycle. Several gaps. |
| **Trust / payment** | Pricing transparent (templates) ✓; proposals + invoices via `@henryco/payment-surface`; e-signature absent. |
| **Mobile** | Client portal acceptable on mobile; PM workspace poor on mobile (Gantt + kanban need tablet+). |
| **Accessibility** | Per-route axe pending. |
| **Performance** | OK; large asset previews need lazy-load. |
| **SEO** | `Service` JSON-LD on each service detail required. `Organization` + `LocalBusiness` on home. |
| **Localization** | Foundation strings ✓; service descriptions + template names from DB. |
| **Data adequacy** | Likely missing: `studio_proposal_signatures`, `studio_revisions`, `studio_milestones`, `studio_resource_allocations`, `studio_asset_packs`, `studio_payment_plans`. |

═══════════════════════════════════════════════════════
MANDATORY REBUILD SCOPE
═══════════════════════════════════════════════════════

### A. Public surfaces

1. **`/` (home)** — `<HenryCoHeroCard>` studio accent. Above-the-fold:
   featured work rail, capability evidence (active projects, on-time %,
   client satisfaction), CTAs ("Pick a template" → /pick, "Tell us about
   your project" → /request).
2. **`/services`, `/services/[slug]`** — service catalogue with per-service
   detail (deliverables, timeline, price-from, sample work). `Service`
   JSON-LD on each.
3. **`/work`, `/work/[slug]`** — case study portfolio with hero, problem,
   approach, outcome, metrics, gallery.
4. **`/teams`, `/teams/[slug]`** — studio team profiles (could power jobs
   verification — V3 gap).
5. **`/pick`, `/pick/[slug]`** — template browser with filters; per-template
   detail with pricing (from `@henryco/pricing` + 14 templates per V5-3),
   deliverables, timeline, "Buy now" → checkout.
6. **`/request`** — premium brief builder. Steps: (1) Project type
   (domain intent classification per `studio_brief_domain_intent`),
   (2) Goals + outcomes, (3) Audience, (4) Inspiration links + assets,
   (5) Budget + timeline, (6) Contact. Auto-save to `studio_brief_drafts`.
   Submit creates `studio_briefs` row + sales lead.
7. **`/pricing`** — transparent pricing matrix per service tier.
8. **`/process`** — editorial premium process page.
9. **`/policies`, `/policies/[slug]`** — legal + service policies.
10. **`/trust`, `/about`, `/faq`, `/contact`** — editorial premium
    pages.
11. **`/login`, `/pay/[paymentId]`, `/payment`** — keep with shared
    primitives.
12. **`/checkout/template/[slug]`** — template purchase checkout via
    `@henryco/payment-surface`.

### B. Client portal (`/client/*`)

Note: studio's /client surface is canonical; account.* `?module=studio`
deep-links here rather than re-implementing.

- **`/client` + `/client/dashboard`** — overview: active projects, next
  milestone, pending review, recent updates, outstanding invoices
- **`/client/projects`** — list with status, next milestone
- **`/client/projects/[projectId]`** — project workspace: hero (status
  + next milestone + team), updates feed, milestones tab, files tab,
  messages tab (uses `@henryco/messaging-thread`), revisions tab,
  invoices tab
- **`/client/projects/[projectId]/messages`** — full thread view (deep
  link to messages tab)
- **`/client/proposals`** — list + detail with e-signature accept
  (NEW — see Distinctive Rules)
- **`/client/messages`** — cross-project inbox
- **`/client/files`** — cross-project asset library with download
  (server-proxied via `/api/portal/download`) + asset pack bulk download
- **`/client/notifications`** — wired via `@henryco/notifications-ui`
- **`/client/payments`, `/client/payment/[invoiceId]`** — payment via
  `@henryco/payment-surface`; receipt PDF via `@henryco/branded-documents`
- **`/client/reviews`** — post-project review submission
- **`/client/profile`** — profile + organization + team members

### C. Sales (`/sales/*`)

- **`/sales`** — overview: pipeline value, conversion %, active
  proposals, hot leads
- **`/sales/leads`** — lead list with filters; drag-to-stage kanban
  (Lead → Qualified → Proposal → Negotiation → Closed-won/lost)
- **`/sales/match`** — match leads to studio capability + team
- **`/sales/proposals`** — proposal list + builder with versioning,
  e-signature, accept/reject

### D. PM (`/pm/*`)

- **`/pm`** — overview: active projects, on-time %, blockers,
  this-week deliverables
- **`/pm/projects`** — project list with status, next milestone, team,
  client; click into project workspace
- **`/pm/projects/[projectId]`** — PM workspace: Gantt timeline,
  milestone CRUD, resource allocation, internal notes (visible to PM
  team only — RLS), blocker queue, risk register
- **`/pm/revisions`** — revision request queue across projects with
  approve/reject

### E. Delivery (`/delivery/*`)

- **`/delivery`** — overview: pending handoffs, today's deliveries
- **`/delivery/assets`** — asset packaging + branded zip export +
  brand guidelines doc generation

### F. Finance (`/finance/*`)

- **`/finance`** — overview: revenue MTD, outstanding AR, aged
  receivables, runway
- **`/finance/invoices`** — invoice list with aging, "Send reminder"
  CTA, "Mark as paid"
- **`/finance/payments`** — payment list with reconciliation status

### G. Operator (`/owner`, `/admin`, `/support`)

- **`/owner`** — strategic dashboard
- **`/admin`** — taxonomy (service catalogue, template catalogue, team
  member CRUD)
- **`/support`, `/support/[threadId]`** — support thread engine (Phase
  3a + 3b ✓)

### H. Database

Add app-local migrations:

1. `<TS>_studio_proposal_signatures.sql` — `studio_proposal_signatures`
   (proposal_id, signed_at, signed_by_user_id, signature_image_url
   nullable, ip_address, user_agent, locale).
2. `<TS>_studio_revisions.sql` — `studio_revisions` (project_id,
   request_text, attached_files jsonb, status enum, reviewed_at,
   approved_by_pm_user_id, version int).
3. `<TS>_studio_milestones.sql` — `studio_milestones` (project_id,
   name, due_at, completed_at, owner_user_id).
4. `<TS>_studio_resource_allocations.sql` — `studio_resource_allocations`
   (team_member_user_id, project_id, allocated_pct, week_starting).
5. `<TS>_studio_asset_packs.sql` — `studio_asset_packs` (project_id,
   pack_name, files jsonb[], generated_at).
6. `<TS>_studio_payment_plans.sql` — `studio_payment_plans` (invoice_id,
   schedule jsonb, paid_milestones jsonb).
7. `<TS>_studio_realtime_publication.sql` — projects + updates +
   messages + revisions to Realtime.

All migrations on Supabase preview branch first; RLS verified.

### I. APIs and crons

- Audit + extend `/api/support/create`, `/api/support/reply`,
  `/api/portal/download`, `/api/studio/domain-check`.
- New: `POST /api/studio/proposals/sign` — e-signature accept
- New: `POST /api/studio/revisions` — revision request CRUD
- New: `POST /api/studio/milestones` — milestone CRUD
- New: `POST /api/studio/asset-packs/generate` — generate branded zip
- **MUST land** WhatsApp HMAC on `/api/webhooks/whatsapp` (V3 B1)
- Cron: extend `/api/cron/studio-automation`:
  - Send milestone-due reminders
  - Send invoice payment reminders (3, 7, 14 days)
  - Send proposal expiry reminders
  - Aggregate weekly digest for PM + finance
- Commit `apps/studio/lib/studio/settings-shared.ts` uncommitted edits.

### J. Components

Reuse cross-division primitives. Build (studio-specific):
- `<BriefBuilder>` (multi-step with auto-save + domain intent
  classifier)
- `<TemplateCard>`, `<TemplateGrid>`, `<TemplateDetail>`
- `<ProposalBuilder>` (versioned editor)
- `<ProposalAcceptFlow>` with e-signature
- `<ProjectWorkspace>` (tabs: overview, updates, milestones, files,
  messages, revisions, invoices)
- `<ProjectUpdateCard>` with photos + status + ack
- `<MilestoneList>` + `<MilestoneEditor>`
- `<RevisionRequestForm>` + `<RevisionVersionCompare>`
- `<AssetLibrary>` with filter + select + bulk download
- `<AssetPackBuilder>` with brand guideline doc
- `<SalesKanban>` with drag-to-stage
- `<PMGantt>` (timeline view)
- `<ResourceAllocationGrid>`
- `<InvoiceTable>` with aging
- `<PaymentPlanEditor>`

### K. External integrations

- **Cloudinary** — project files, asset packs, brand guidelines
- **Resend** — proposal sent, milestone reminders, invoice reminders
- **WhatsApp** — optional client touch
- **DocuSign / Dropbox Sign** — proposal e-signature (env-gated; typed-name
  fallback with audit_log)

### L. Crons + observability

- `/api/cron/studio-automation` instrumented + Sentry. Idempotent.

═══════════════════════════════════════════════════════
UNIFORMITY RULES
═══════════════════════════════════════════════════════

(Same matrix; see `docs/rebuild-prompts/logistics.md` § "UNIFORMITY
RULES". Studio-specific: `@henryco/branded-documents` adds
`StudioProposalDocument`, `StudioInvoiceDocument`,
`StudioBrandGuidelinesDocument` templates. Studio is the only division
with full client portal + PM + sales surfaces, but they all consume
shared primitives.)

ALL master `DASHBOARD-REBUILD-PROMPT-V2-FINAL.md` §4.1 + §4.2
anti-patterns apply.

Studio-specific anti-pattern call-outs:
- Brief builder must auto-save (long forms with state loss = trust
  failure)
- No "Get a quote!" patronizing copy — "Tell us about your project"
- Use studio accent `#4AC1C5`; never default blue
- Project workspace tabs must NOT lazy-load with skeleton flash on
  every tab change — preload all tab data on project enter

═══════════════════════════════════════════════════════
DISTINCTIVE RULES — WHAT STUDIO MUST BUILD
═══════════════════════════════════════════════════════

1. **Brief builder with domain intent classification** — only studio
   has this shape. Auto-save mandatory.
2. **Proposal versioning + e-signature accept** — only studio + jobs
   have e-signature; studio's wraps a proposal (price + scope + timeline);
   jobs's wraps an offer letter.
3. **Multi-stakeholder project workspace** — client + PM + delivery +
   finance + sales all see the same project from different lenses; only
   studio has this shape.
4. **Revision cycle with versioning** — request → review → approve →
   bake into next version.
5. **Milestone-driven payment plan** — invoice released per milestone.
6. **Asset pack generation** — branded zip with files + brand
   guidelines doc; only studio.
7. **PM Gantt + resource allocation** — only studio.
8. **Sales kanban** — only studio (jobs has hiring kanban; different
   shape — applicant pipeline vs sales pipeline).
9. **Template browser with instant-buy flow** — only studio (`/pick`).

═══════════════════════════════════════════════════════
COMPETITOR BENCHMARK
═══════════════════════════════════════════════════════

- **Toptal** — best-in-class for talent + project portal
- **99designs** — best-in-class for design template marketplace
- **Webflow's freelancer portal** — best-in-class for client-facing
  project workspace
- **HoneyBook** — best-in-class for service-business CRM + invoicing
- **IDEO / Frog (agencies)** — best-in-class for case study + portfolio
  presentation

The bar: a client at `/client/projects/[id]` should feel they are using
a premium product designed by the studio for the studio's clients —
white-glove, transparent, calm. A PM at `/pm` should feel they are
using a premium project management tool (Linear/Asana-class).

═══════════════════════════════════════════════════════
TRUST, PAYMENT, COMPLIANCE
═══════════════════════════════════════════════════════

- Payment via `@henryco/payment-surface`; multi-currency settlement.
- Pricing breakdown row pre-payment (V2 governance).
- Proposal e-signature: signed timestamp + IP + user-agent + locale
  captured; signed PDF stored in Cloudinary.
- Audit log on every proposal sign + every revision approval + every
  asset pack export + every invoice mark-paid.
- KYC: clients self-service; team members KYC for sensitive actions
  (per `kyc_sensitive_action_gating.md`).
- WhatsApp webhook HMAC mandatory.
- Files retention per `data-retention-and-delete-readiness.md`;
  client can request deletion of completed-project files after retention
  period.

═══════════════════════════════════════════════════════
MOBILE AND DESKTOP
═══════════════════════════════════════════════════════

- 320/375/390/430/768/1024 px.
- Brief builder mobile: full-screen step transitions, auto-save indicator
  visible, sticky-bottom continue.
- Client project workspace mobile: tab bar above the fold; tabs as
  bottom sheet on phones.
- PM Gantt: gate to "Open on tablet+ for full Gantt view" on phones;
  show milestone list as fallback.
- Sales kanban: column-stacked vertical scroll on mobile, swipe-to-stage.

═══════════════════════════════════════════════════════
LOCALIZATION
═══════════════════════════════════════════════════════

- `@henryco/i18n` foundation only.
- Service + template names: jsonb i18n.
- Brief drafts: stored in submitted locale; renderable by PM in their
  locale (no auto-translate this pass).
- Currency display: `@henryco/pricing` formatting; multi-currency
  settlement.
- RTL verified.

═══════════════════════════════════════════════════════
VALIDATION GATE — V1 through V13 + studio-specific
═══════════════════════════════════════════════════════

V1–V13 from master §3. Studio-specific:

- **S1** — WhatsApp HMAC verified.
- **S2** — Brief builder auto-saves every 30s + on blur; resumes on
  reload from `studio_brief_drafts`.
- **S3** — Proposal e-signature: signed timestamp + IP + UA + locale
  captured + audit_log row written + PDF generated and stored.
- **S4** — Revision request flow: client requests → PM reviews → PM
  approves/rejects → version increments → client notified.
- **S5** — Asset pack generation: zip includes all approved files +
  brand guidelines PDF; download via signed URL with 7-day expiry.
- **S6** — Sales kanban drag-to-stage persists; activity log written.
- **S7** — Multi-currency: invoice in USD, paid in NGN with FX rate
  snapshot; receipt PDF shows both.
- **S8** — Project workspace tab change does NOT show skeleton flash
  for already-loaded data.
- **S9** — `apps/studio/lib/studio/settings-shared.ts` uncommitted
  edits committed and reviewed.
- **S10** — Client portal download via `/api/portal/download` server
  proxy (V5-2) — all download CTAs route through this; no direct
  Cloudinary URL exposure.

═══════════════════════════════════════════════════════
DEPLOYMENT
═══════════════════════════════════════════════════════

1. Branch `feat/v3-pass-21-studio`.
2. Migrations on Supabase preview branch first.
3. PR with V1–V13 + S1–S10 PASS table.
4. Vercel preview live-checked.
5. Merge → `studio.henrycogroup.com`.
6. Persist report at `.codex-temp/v3-pass-21-studio/report.md`.

═══════════════════════════════════════════════════════
FINAL REPORT
═══════════════════════════════════════════════════════

Sections same shape as logistics: H0 recon, files modified, migrations,
V1–V13 + S1–S10 gate table, anti-pattern audit, mobile parity,
Lighthouse + CWV, a11y audit, hand-off, final classification.

═══════════════════════════════════════════════════════
SELF-VERIFICATION CHECKLIST
═══════════════════════════════════════════════════════

- [ ] Public surfaces in §A rebuilt with `Service` JSON-LD on every
      service detail
- [ ] Client portal in §B premium quality (project workspace tabs
      preload, no skeleton flash)
- [ ] Sales surface in §C with kanban + e-signature proposals
- [ ] PM surface in §D with Gantt + resource allocation + revision
      queue
- [ ] Delivery surface in §E with branded asset pack export
- [ ] Finance surface in §F with aging + payment plans
- [ ] Operator surfaces in §G
- [ ] Migrations in §H applied with RLS verified
- [ ] APIs in §I shipped with idempotency + observability
- [ ] Components in §J built reusing primitives
- [ ] WhatsApp HMAC landed
- [ ] E-signature provider integrated (with typed-name fallback)
- [ ] V5-3 14 templates with real prices/timelines/packages committed
- [ ] `apps/studio/lib/studio/settings-shared.ts` committed
- [ ] Mobile parity at 6 breakpoints
- [ ] i18n: every string under a key; RTL renders
- [ ] V1–V13 + S1–S10 PASS or N/A with justification
- [ ] Final report persisted
- [ ] PR opened with PASS table in body
