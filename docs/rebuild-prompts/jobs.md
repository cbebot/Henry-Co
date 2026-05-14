# JOBS — Division Rebuild Prompt (V3 PASS 21)

```
TOOL: Claude Code (Opus 4.7 · 1M context · xhigh effort)
PROJECT: HenryCo Ecosystem · henrycogroup.com
DIVISION: HenryCo Jobs
LIVE DOMAIN: jobs.henrycogroup.com
REPO: github.com/cbebot/Henry-Co
BRANCH: main (Vercel auto-deploy)
BACKEND: Supabase (single project, multi-app schema)
PASS: V3 PASS 21 — DIVISION REBUILD · JOBS
EXPECTED DURATION: Long. Jobs is mid-to-large (~16k LOC) with the
                   widest persona surface (candidate + employer +
                   recruiter + admin/owner) of any division. The
                   "interview room" is named in PRODUCT-GAP-LEDGER but
                   not built.
```

═══════════════════════════════════════════════════════
ROLE
═══════════════════════════════════════════════════════

Principal product architect, division systems strategist, and
implementation engineer for HenryCo Jobs. Ship code; self-verify against
V1–V13 + jobs-specific gates.

═══════════════════════════════════════════════════════
SCOPE
═══════════════════════════════════════════════════════

Rebuild Jobs end-to-end:

- Public surfaces (`jobs.henrycogroup.com`)
- Candidate authenticated surface
- Employer authenticated surface
- Recruiter authenticated surface
- Operator surfaces (admin, moderation, owner)
- Supabase tables + RLS
- APIs + crons + webhooks
- Jobs-specific components

Out of scope: shared shell + cross-division packages; other divisions.

═══════════════════════════════════════════════════════
CONTEXT — read in this order
═══════════════════════════════════════════════════════

1. `docs/v3/V3-DISCOVERY-INVENTORY.md`
2. `docs/dashboard/DASHBOARD-REBUILD-PROMPT-V2-FINAL.md`
3. `packages/config/company.ts` — `COMPANY.divisions.jobs` (accent
   `#0E7C86`, accentText `#0E7C86`)
4. `apps/jobs/` — every existing route, lib, component
5. `apps/jobs/app/api/hiring/messages/*` — V5-3 §12 conversation
   membership check (V3 D7) — pending
6. `apps/jobs/app/api/hiring/messages/flag/route.ts` — flag IDOR fix
   pending (V3 B3)
7. `packages/messaging-thread/` (jobs/hiring messages already migrated
   to messaging-thread per Phase 3a — verify still wired)
8. `packages/chat-composer/` (jobs/hiring composer)
9. `PRODUCT-GAP-LEDGER.md` — "interview room" + "verified candidate
   profile" named but not built

═══════════════════════════════════════════════════════
AUDIT SUMMARY — current state at SHA `e5e277a`
═══════════════════════════════════════════════════════

### Routes shipped (public)
- `/` (home), `/jobs` (listings), `/jobs/[slug]` (detail)
- `/categories/[slug]`, `/employers/[slug]`
- `/talent`, `/hire`, `/careers`, `/help`, `/trust`
- `/login`, `/signup`, `/auth/callback`, `/pay/[paymentId]`

### Routes shipped (candidate)
- `/candidate` (overview), `/candidate/profile`, `/candidate/applications`
- `/candidate/saved-jobs`, `/candidate/alerts`, `/candidate/files`
- `/candidate/conversations`, `/candidate/conversations/[conversationId]`
- `/candidate/interviews`, `/candidate/settings`

### Routes shipped (employer)
- `/employer` (overview), `/employer/jobs`, `/employer/jobs/new`,
  `/employer/jobs/[id]`
- `/employer/applicants`, `/employer/applicants/[id]`
- `/employer/hiring`, `/employer/hiring/[pipelineId]`,
  `/employer/hiring/[pipelineId]/[applicationId]`
- `/employer/analytics`, `/employer/company`, `/employer/settings`

### Routes shipped (recruiter)
- `/recruiter` (overview), `/recruiter/jobs`, `/recruiter/candidates`,
  `/recruiter/candidates/[candidateId]`
- `/recruiter/employers`, `/recruiter/pipeline`, `/recruiter/history`,
  `/recruiter/verification`

### Routes shipped (operator)
- `/admin`, `/moderation`, `/owner`, `/analytics`

### API routes
- `/api/auth/logout`, `/api/locale`
- `/api/candidate/documents`
- `/api/cron/jobs-alerts`
- `/api/hiring/interviews`
- `/api/hiring/messages` (V5-3 §12: conversation membership check
  pending — V3 D7)
- `/api/hiring/messages/flag` (V5-3: IDOR fix pending — V3 B3)
- `/auth/session`

### Database
- 0 app-local migrations. Jobs uses hub schema:
  - `jobs_role_memberships` (candidate, employer, recruiter, admin)
  - Jobs domain tables presumably inferred from feature surfaces
    (verify; if missing, add)

### Existing strengths
- Widest persona coverage of any division (candidate + employer +
  recruiter + operator) — IA is well-shaped
- Hiring messages migrated to `@henryco/messaging-thread` (Phase 3a)
- Realtime spine activated across all jobs pages (Phase 7b)
- Chat composer integrated for hiring messages

### Known gaps and bugs
- **Conversation membership check missing** on `/api/hiring/messages`
  (V5-3 §12, V3 D7) — non-members may read messages.
- **Flag IDOR** on `/api/hiring/messages/flag` (V5-3, V3 B3) — any user
  may flag any message.
- **Interview room** named in PRODUCT-GAP-LEDGER but not built — no
  scheduled-video-call surface, no in-app calendar, no recording.
- **Verified candidate profile** named but only partially shipped — KYC
  badge exists; skill verification, experience verification, reference
  verification all missing.
- **Pipeline / kanban** for `/employer/hiring/[pipelineId]` — drag-and-drop
  application status board likely thin.
- **Application** form — needs polish: progress saving, multi-file
  resume + portfolio, cover letter, application-specific questions.
- **Job alerts** — `/candidate/alerts` exists; cadence + filtering scope
  may be incomplete.
- **Job posting** flow `/employer/jobs/new` — needs premium polish (rich
  description editor, salary range disclosure, benefit chips, screening
  questions).
- **Salary intelligence** — no median salary surfacing; competitor
  standard.
- **Recruiter pipeline** — `/recruiter/pipeline` likely thin.
- **Notifications-ui** wired (Phase 7b) — verify on every shell.
- **Search palette** not mounted (V3 H1).
- **Branded-documents** — `JobsApplicationDocument` deferred (V3 G3).
- **HenryCoHeroCard** likely not consumed on jobs home (V3 J2).
- **Mobile** — application form on mobile is the highest-friction surface;
  needs polish.

### Cross-division
- Hub directory → jobs ✓
- Account `?module=jobs` ✓
- Verified candidate profile could feed care/property/marketplace
  trust signals (V3 integration — owner decision)

═══════════════════════════════════════════════════════
DEEP AUDIT FINDINGS
═══════════════════════════════════════════════════════

| Dimension | Finding |
|---|---|
| **IA** | Strong persona coverage. Each persona's IA is shipped at adequate breadth; depth varies. |
| **Flow logic** | Discover → Apply → ⚠ (form quality varies); Employer post → Pipeline → Hire → ⚠ (kanban thin); Interview → ✗ (room missing); Hire offer → ✗ (no offer flow). |
| **Cross-division** | Verified profile signals are unique to jobs and could power trust elsewhere. |
| **Empty / loading / error** | Inconsistent. |
| **Competitor parity** | LinkedIn / Indeed / Wellfound / Lever / Greenhouse — all ship: rich profile builder, salary intel, applicant tracking, kanban pipeline, scheduled video interview, offer letter generation, e-signature. Several gaps. |
| **Trust / payment / dispute** | Verification badges partial. Employer pays via `@henryco/payment-surface`. No refund flow for cancelled job posts. |
| **Mobile** | Application form needs work. |
| **Accessibility** | Per-route axe pending. |
| **Performance** | OK. |
| **SEO** | Job posting JSON-LD (`JobPosting`) MUST be present on every job detail page (Google for Jobs requirement). Verify consumed in `@henryco/seo`. |
| **Localization** | Foundation strings ✓; job descriptions user-content (English unless employer chooses). |
| **Data adequacy** | Likely missing: `jobs_skills` taxonomy, `jobs_skill_verifications`, `jobs_experience_verifications`, `jobs_reference_checks`, `jobs_interview_rooms`, `jobs_offer_letters`, `jobs_salary_benchmarks`. |

═══════════════════════════════════════════════════════
MANDATORY REBUILD SCOPE
═══════════════════════════════════════════════════════

### A. Public surfaces

1. **`/` (home)** — `<HenryCoHeroCard>` jobs accent. Above-the-fold:
   featured jobs rail, search bar (role + location + salary), capability
   evidence (active listings, verified employers, hires this month).
2. **`/jobs`** — premium search results. Filters: role, location (with
   remote toggle), salary range, employment type, seniority, company
   size. Sort: relevance, recent, salary high/low. Save-search button.
3. **`/jobs/[slug]`** — premium job detail with `JobPosting` JSON-LD.
   Sections: hero (title, company, location, salary disclosure),
   description, requirements, benefits, screening questions preview,
   "Apply" CTA, "Save" CTA, similar jobs rail, employer card with
   verification badge.
4. **`/employers/[slug]`** — premium employer page: company description,
   verification status, all open roles, employee testimonials (if any),
   benefits.
5. **`/categories/[slug]`** — category landing with role rail.
6. **`/talent`** — landing for candidates: feature evidence, sign-up CTA.
7. **`/hire`** — landing for employers: feature evidence, sign-up CTA,
   pricing.
8. **`/careers`** — HenryCo internal hiring page (jobs at HenryCo itself).
9. **`/help`, `/trust`, `/login`, `/signup`, `/pay/[paymentId]`** — keep
   with shared primitives; ensure `<ContactForm>` posts via
   `staff_notifications` audience `jobs:support`.

### B. Candidate authenticated surface

`account.henrycogroup.com/?module=jobs-candidate` (separate package
`@henryco/dashboard-modules-jobs-candidate`):

- **Overview** — saved jobs, active applications, upcoming interviews,
  recent matches
- **Profile builder** — premium multi-section editor: basics, summary,
  experience (per-role with company + duration + bullet description),
  education, skills (with proficiency + verification), portfolio,
  references. Auto-save. Profile completeness meter. Verification badges
  per section.
- **Applications** — list with status, "Withdraw", "View thread", "View
  job" CTAs
- **Saved jobs** — `@henryco/cart-saved-items` for the saved primitive
  (yes — same primitive)
- **Alerts** — saved-search alerts with cadence (daily, weekly), pause
- **Conversations** — `@henryco/messaging-thread` per conversation
- **Interviews** — upcoming + past with calendar export, "Join room"
  (Interview Room — see Distinctive Rules)
- **Files** — resume + portfolio archive (Cloudinary)
- **Settings** — privacy (visibility), notification preferences

### C. Employer authenticated surface

`account.henrycogroup.com/?module=jobs-employer` (separate package
`@henryco/dashboard-modules-jobs-employer`):

- **Overview** — active job count, total applicants today, pipeline
  health, time-to-hire trend
- **Jobs** — list with status (active, draft, archived), "New job"
  premium creator with: title, description (rich editor), required vs
  nice-to-have skills, salary range (mandatory disclosure for trust),
  benefits chips, screening questions, application form fields, expiry,
  budget
- **Applicants** — per-job + cross-job; filter by status, score; "Move
  to pipeline" CTA
- **Hiring pipelines** — per-job kanban (Applied → Reviewed →
  Phone-screen → Interview → Offer → Hired / Rejected). Drag-to-move
  with bulk actions.
- **Application detail** — candidate profile snapshot, resume preview,
  cover letter, screening answers, interview history, internal notes,
  schedule-interview CTA, offer-letter CTA
- **Analytics** — funnel, source breakdown, time-to-hire, cost-per-hire
- **Company** — employer profile editor, verification badge, team members
  with roles
- **Settings** — billing, integrations, notification preferences

### D. Recruiter authenticated surface

`/recruiter/*` (consumes `@henryco/workspace-shell`):

- **Overview** — active candidates, active employers, pipeline stage
  counts, recent activity
- **Candidates** — searchable directory with verification + last-active
- **Candidate detail** — full profile with notes, hide/show fields,
  outreach history
- **Employers** — managed-employer roster
- **Pipeline** — recruiter pipeline view (different shape than employer
  kanban; recruiter sees cross-employer)
- **History** — placement history with revenue/commission
- **Verification queue** — recruiter can verify candidate skills,
  experience, references (special role)

### E. Operator surfaces

- **Admin** — taxonomy (skills, categories, role titles), cron health
- **Moderation** — flagged posts, flagged messages, KYC queue (employer
  verification)
- **Owner** — strategic dashboard
- **Analytics** — platform-wide metrics

### F. Database

Add app-local migrations under `apps/jobs/supabase/migrations/`:

1. `<TS>_jobs_taxonomy.sql` — `jobs_skills`, `jobs_categories`,
   `jobs_role_titles` tables with i18n jsonb names + slugs.
2. `<TS>_jobs_skill_verifications.sql` — `jobs_skill_verifications`
   (candidate_user_id, skill_id, verified_by_user_id, evidence_type,
   evidence_url, status enum).
3. `<TS>_jobs_experience_verifications.sql` — same shape for experience
   entries.
4. `<TS>_jobs_reference_checks.sql` — reference contact + outcome.
5. `<TS>_jobs_interview_rooms.sql` — `jobs_interview_rooms` (id,
   application_id fk, scheduled_at, duration_minutes, room_token,
   provider enum [daily.co | jitsi | google-meet | zoom], join_url,
   recording_url nullable, status enum).
6. `<TS>_jobs_offer_letters.sql` — `jobs_offer_letters` (application_id,
   issued_at, terms jsonb, signed_at nullable, signed_signature jsonb).
7. `<TS>_jobs_salary_benchmarks.sql` — `jobs_salary_benchmarks` (role_id,
   location, currency, p25, p50, p75, sample_size, sourced_at).
8. `<TS>_jobs_pipeline_stages.sql` — configurable pipeline stages per
   job/employer.
9. `<TS>_jobs_application_notes.sql` — internal notes on an application
   (employer + recruiter visible).
10. `<TS>_jobs_realtime_publication.sql` — applications + messages +
    interviews to Realtime.

All migrations on Supabase preview branch first; RLS verified.

### G. APIs and crons

- `POST /api/jobs/listings` — CRUD job posts
- `POST /api/jobs/applications` — submit application
- `POST /api/jobs/pipeline/move` — move applicant in pipeline
- `POST /api/jobs/interviews` — schedule interview (creates room)
- `POST /api/jobs/offers` — issue offer letter
- `POST /api/jobs/verifications/skill` — verify a skill
- `GET /api/jobs/salary/[role]/[location]` — salary benchmark lookup
- **MUST land** V5-3 fixes:
  - `/api/hiring/messages` conversation membership check (V3 D7)
  - `/api/hiring/messages/flag` IDOR fix (V3 B3)
- Cron: extend `/api/cron/jobs-alerts`:
  - Send saved-search alerts (cadence)
  - Send application status changes (employer → candidate)
  - Send interview reminders (24h, 1h)
  - Send offer-letter expiry reminders

### H. Components

Reuse cross-division primitives. Build (jobs-specific):
- `<JobCard>`, `<JobGrid>`, `<JobDetail>`
- `<JobSearchBar>` with role + location + salary
- `<JobApplicationFlow>` (multi-step form with auto-save)
- `<ProfileBuilder>` (multi-section editor with auto-save + completeness
  meter)
- `<PipelineKanban>` (drag-and-drop application stages)
- `<InterviewRoom>` (video room embed + chat sidebar + notes)
- `<OfferLetterEditor>` (terms editor + e-signature)
- `<VerificationBadge>` (skill, experience, reference, KYC)
- `<SalaryRange>` (mandatory disclosure render)
- `<EmployerCard>`, `<CompanyProfile>`

### I. External integrations

- **Cloudinary** — resume + portfolio + verification evidence
- **Daily.co / Jitsi / Google Meet / Zoom** — interview room provider
  (env-gated; default to Daily.co if `DAILY_API_KEY` set; Jitsi as
  no-account fallback)
- **DocuSign / Dropbox Sign** — offer letter e-signature (env-gated;
  store signed PDF in Cloudinary; if env missing, fall back to typed-name
  acknowledgement with audit_log)
- **Resend** — application confirmations, status updates, interview
  reminders
- **WhatsApp** — interview reminders (optional)

### J. Crons + observability

- `/api/cron/jobs-alerts` instrumented + Sentry. Idempotent.
- Audit log on every employer/recruiter mutation.

═══════════════════════════════════════════════════════
UNIFORMITY RULES
═══════════════════════════════════════════════════════

(Same matrix; see `docs/rebuild-prompts/logistics.md` § "UNIFORMITY
RULES". Jobs adds: `JobsApplicationDocument` template to
`@henryco/branded-documents`; `<InterviewRoom>` is jobs-only.)

ALL master `DASHBOARD-REBUILD-PROMPT-V2-FINAL.md` §4.1 + §4.2
anti-patterns apply.

Jobs-specific anti-pattern call-outs:
- No "Apply now" without idle/pending/disabled/spinner/success-lock
- Salary range MUST be disclosed (no "competitive" placeholder — that
  is a trust failure)
- No `<input type="file">` without preview + size validation
- Use jobs accent `#0E7C86`; never default blue

═══════════════════════════════════════════════════════
DISTINCTIVE RULES — WHAT JOBS MUST BUILD
═══════════════════════════════════════════════════════

1. **Verified candidate profile** — KYC + skill + experience + reference
   verification, each with badge + evidence trail. Unique surface across
   the ecosystem.
2. **Interview Room** — first-class scheduled video room with chat
   sidebar + employer notes. Only jobs needs this shape (studio uses
   thread for client meetings; jobs needs scheduled live).
3. **Pipeline kanban** — application stage board with drag-to-move +
   bulk actions.
4. **Offer letter editor + e-signature** — only jobs.
5. **Salary benchmarks** — `jobs_salary_benchmarks` lookup for
   transparency.
6. **`JobPosting` JSON-LD** — Google for Jobs SEO requirement; only
   jobs needs.
7. **Multi-persona authenticated surfaces** — candidate + employer +
   recruiter coexist on same identity (same user can be both candidate
   and employer for their own company); IdentityBar role-switcher
   matters most here.

═══════════════════════════════════════════════════════
COMPETITOR BENCHMARK
═══════════════════════════════════════════════════════

- **LinkedIn** — best-in-class profile + network (we don't replicate
  network)
- **Indeed** — best-in-class job aggregation
- **Wellfound (AngelList Talent)** — best-in-class startup hiring
  surface + transparent salary
- **Lever / Greenhouse** — best-in-class ATS (kanban + offer letter +
  e-signature)

The bar: a candidate at `account.henrycogroup.com/?module=jobs-candidate`
should feel they are using a premium hiring product. An employer at
`account.henrycogroup.com/?module=jobs-employer` should feel they are
using Greenhouse, not a job board.

═══════════════════════════════════════════════════════
TRUST, PAYMENT, COMPLIANCE
═══════════════════════════════════════════════════════

- Employer KYC required to post jobs.
- Candidate KYC required for verification badges (`kyc_sensitive_action_gating.md`).
- Salary disclosure mandatory (trust + transparency).
- Employer payment via `@henryco/payment-surface`; pricing breakdown row.
- Discrimination prevention: anonymous review mode (employer cannot see
  protected attributes during initial review; can see after pipeline
  advancement). This is a future hardening — V3 scope: design the data
  model so it's possible.
- Audit log on every employer/recruiter mutation.
- Hiring message conversation membership check (V3 D7) — fix mandatory.
- Flag IDOR (V3 B3) — fix mandatory.

═══════════════════════════════════════════════════════
MOBILE AND DESKTOP
═══════════════════════════════════════════════════════

- 320/375/390/430/768/1024 px.
- Job application form mobile: full-screen step transitions; resume
  upload via native file picker; auto-save every step.
- Pipeline kanban mobile: column-stacked vertical scroll, swipe-to-move.
- Interview room mobile: full-bleed video; chat in bottom sheet.

═══════════════════════════════════════════════════════
LOCALIZATION
═══════════════════════════════════════════════════════

- `@henryco/i18n` foundation only.
- Job descriptions: user content; render in original locale.
- Skill / category / role title taxonomy: jsonb i18n; resolved by user
  locale.
- Salary display: locale + currency formatting.
- RTL verified.

═══════════════════════════════════════════════════════
VALIDATION GATE — V1 through V13 + jobs-specific
═══════════════════════════════════════════════════════

V1–V13 from master §3. Jobs-specific:

- **J1** — `/api/hiring/messages` returns 403 to non-conversation members
  (V3 D7).
- **J2** — `/api/hiring/messages/flag` returns 403 unless flagger is a
  conversation member (V3 B3).
- **J3** — Profile auto-save persists every 30s + on blur; resumes on
  page reload.
- **J4** — Pipeline drag-to-move persists with optimistic UI + rollback
  on server error.
- **J5** — Interview room joins on iOS Safari + Chrome Android with
  camera + mic permission flows.
- **J6** — `JobPosting` JSON-LD validates and is indexed by Google
  Rich Results test.
- **J7** — Offer letter signing writes audit_log + stores signed PDF
  in Cloudinary.
- **J8** — Salary range disclosure is mandatory at job creation;
  validation rejects empty/placeholder.

═══════════════════════════════════════════════════════
DEPLOYMENT
═══════════════════════════════════════════════════════

1. Branch `feat/v3-pass-21-jobs`.
2. Migrations on Supabase preview branch first.
3. PR with V1–V13 + J1–J8 PASS table.
4. Vercel preview live-checked.
5. Merge → `jobs.henrycogroup.com`.
6. Persist report at `.codex-temp/v3-pass-21-jobs/report.md`.

═══════════════════════════════════════════════════════
FINAL REPORT
═══════════════════════════════════════════════════════

Sections same shape as logistics: H0 recon, files modified, migrations,
V1–V13 + J1–J8 gate table, anti-pattern audit, mobile parity, Lighthouse
+ CWV, a11y audit, hand-off, final classification.

═══════════════════════════════════════════════════════
SELF-VERIFICATION CHECKLIST
═══════════════════════════════════════════════════════

- [ ] Public surfaces in §A rebuilt with `JobPosting` JSON-LD on every
      job detail
- [ ] Candidate surface in §B with auto-saving profile builder + verified
      badges
- [ ] Employer surface in §C with kanban + offer-letter editor +
      e-signature
- [ ] Recruiter surface in §D
- [ ] Operator surfaces in §E
- [ ] Migrations in §F applied with RLS verified
- [ ] V5-3 §12 fixes (D7 + B3) landed
- [ ] APIs in §G shipped with idempotency + observability
- [ ] Components in §H built
- [ ] Interview room provider integrated (Daily.co default; Jitsi
      fallback)
- [ ] E-signature provider integrated (with typed-name fallback)
- [ ] Mobile parity at 6 breakpoints
- [ ] i18n: every string under a key; RTL renders
- [ ] V1–V13 + J1–J8 PASS or N/A with justification
- [ ] Final report persisted
- [ ] PR opened with PASS table in body
