# LEARN — Division Rebuild Prompt (V3 PASS 21)

```
TOOL: Claude Code (Opus 4.7 · 1M context · xhigh effort)
PROJECT: HenryCo Ecosystem · henrycogroup.com
DIVISION: HenryCo Learn
LIVE DOMAIN: learn.henrycogroup.com
REPO: github.com/cbebot/Henry-Co
BRANCH: main (Vercel auto-deploy)
BACKEND: Supabase (single project, multi-app schema)
PASS: V3 PASS 21 — DIVISION REBUILD · LEARN
EXPECTED DURATION: Long. Learn is mid-complexity (~15.7k LOC) with
                   public discovery + 3 personas (learner, instructor,
                   owner) + the verified-certificate surface that's
                   already shipped end-to-end.
```

═══════════════════════════════════════════════════════
ROLE
═══════════════════════════════════════════════════════

Principal product architect, division systems strategist, and
implementation engineer for HenryCo Learn. Ship code; self-verify against
V1–V13 + learn-specific gates.

═══════════════════════════════════════════════════════
SCOPE
═══════════════════════════════════════════════════════

Rebuild Learn end-to-end:

- Public surfaces (`learn.henrycogroup.com`)
- Learner authenticated surface
- Instructor authenticated surface
- Operator surfaces (admin, content, owner)
- Supabase tables + RLS
- APIs + crons
- Learn-specific components

Out of scope: shared shell + cross-division packages; other divisions.

═══════════════════════════════════════════════════════
CONTEXT — read in this order
═══════════════════════════════════════════════════════

1. `docs/v3/V3-DISCOVERY-INVENTORY.md`
2. `docs/dashboard/DASHBOARD-REBUILD-PROMPT-V2-FINAL.md`
3. `packages/config/company.ts` — `COMPANY.divisions.learn` (accent
   `#3C8C7A`, accentText `#2E6E5F`)
4. `apps/learn/` — every existing route, lib, component
5. `apps/learn/supabase/migrations/*` — `20260402233000_learn_init.sql`,
   `20260402233500_learn_policies.sql`,
   `20260403120000_learn_teacher_applications.sql`,
   `20260501000000_learn_unlock_policy.sql`
6. `packages/branded-documents/` — `LearnCertificateDocument` template
   already shipped (V2-DOCS-01); `/api/certificates/[code]/pdf` is live
7. `apps/learn/lib/learn/seed.ts` — `LEARN_BOOTSTRAP_VERSION` controls
   course seeding

═══════════════════════════════════════════════════════
AUDIT SUMMARY — current state at SHA `e5e277a`
═══════════════════════════════════════════════════════

### Routes shipped (public)
- `/` (home), `/academy` (how it works), `/courses`, `/courses/[slug]`
- `/categories/[slug]`, `/instructors`, `/instructors/[slug]`
- `/paths`, `/paths/[slug]`
- `/certifications`, `/certifications/verify`,
  `/certifications/verify/[code]`
- `/teach` (instructor application)
- `/help`, `/trust`
- `/login`, `/signup`

### Routes shipped (learner)
- `/learner` (overview), `/learner/courses`, `/learner/courses/[courseId]`
- `/learner/progress`, `/learner/certificates`, `/learner/saved`
- `/learner/payments`, `/learner/notifications`, `/learner/settings`

### Routes shipped (instructor)
- `/instructor` (overview)

### Routes shipped (operator)
- `/admin`, `/analytics`, `/content`
- `/owner` (overview), `/owner/courses`, `/owner/paths`,
  `/owner/learners`, `/owner/instructors`, `/owner/certificates`,
  `/owner/assignments`, `/owner/analytics`, `/owner/settings`
- `/support`

### API routes
- `/api/auth/logout`, `/api/locale`
- `/api/learn/announcement`, `/api/learn/bootstrap`
- `/api/cron/learn-automation`
- `/api/certificates/[code]/pdf` (V2-DOCS-01 — premium PDF certificate
  with QR + verification ✓)
- `/auth/callback`

### Database
- 4 app-local migrations (init, policies, teacher applications, unlock
  policy)
- `learn_teacher_applications`, `learn_courses`, `learn_lessons`,
  `learn_enrollments`, `learn_certificates`, `learn_progress` (verify
  exact schema)

### Existing strengths
- Verified certificate flow shipped end-to-end with branded PDF + QR +
  public verification at `/certifications/verify/[code]`
- Course → lesson → progress data model present
- Instructor application flow exists (`/teach`)
- Owner course/path/learner/instructor management surfaces shipped

### Known gaps and bugs
- **Course player** — `/learner/courses/[courseId]` likely renders lesson
  list but the actual lesson player (video + reading + quiz + assignment)
  may be thin. Need: video player with playback rate + captions + bookmarks,
  reading mode with table-of-contents, quiz engine with grading, assignment
  upload with instructor review.
- **Quiz / assessment engine** — `learn_unlock_policy` migration suggests
  some unlock logic exists but the full quiz UX (multiple-choice,
  free-response, multi-step) likely isn't shipped at premium quality.
- **Instructor authoring** — `/instructor` is a single overview page; no
  course authoring tools (lesson editor, quiz builder, video upload,
  resource attach).
- **Path engine** — `/paths` exists but path progression logic (course A
  → course B unlocked) and visualization may be thin.
- **Cohort + scheduled courses** — only self-paced today; cohort-based
  with start dates isn't modelled.
- **Discussion / Q&A** — no per-lesson or per-course discussion thread.
- **Live class / webinar** — no live session surface.
- **Offline / mobile** — no offline lesson download (PWA cache).
- **Notifications-ui** likely on learner shell but verify.
- **Search palette** not mounted on learn shells (V3 H1).
- **HenryCoHeroCard** likely not consumed on learn home (V3 J2).
- **Learn module** in account dashboard (`?module=learn`) likely thin.
- **`/learner/certificates`** — list shipped; needs polish (download +
  share + "verify by URL" CTA).
- **Resource URLs** — `LEARN_BOOTSTRAP_VERSION` was bumped to remove
  example.com URLs (per stash on feat/dash-08-owner-track-b); seed needs
  real resource handling.

### Cross-division
- Hub directory → learn ✓
- Account `?module=learn` ✓ (carry-forward)
- Verified certificate signal could feed jobs candidate verification
  (V3 integration gap)

═══════════════════════════════════════════════════════
DEEP AUDIT FINDINGS
═══════════════════════════════════════════════════════

| Dimension | Finding |
|---|---|
| **IA** | Public discovery solid. Learner IA shipped at adequate breadth. Instructor IA basically empty. Owner IA solid. |
| **Flow logic** | Browse → Enroll → ⚠ (player thin); Progress → ✓ (data model exists); Certificate → ✓ (PDF + verify shipped). Instructor authoring flow → ✗. |
| **Cross-division** | Verified certificates could power jobs candidate verification. |
| **Empty / loading / error** | Inconsistent. |
| **Competitor parity** | Coursera / edX / Udemy / Maven / Teachable — all ship: rich video player with captions + speed + bookmarks, quiz engine with auto-grading, assignment with peer/instructor review, discussion forum per lesson, certificate of completion (we ship!), instructor authoring suite, cohort + live sessions, mobile app with offline. Multiple gaps. |
| **Trust / payment** | Course payment via `@henryco/payment-surface`. Instructor payout flow not modelled. Refund flow unclear. |
| **Mobile** | Course player on mobile is the highest-friction surface; needs polish. |
| **Accessibility** | Lesson video needs captions for WCAG; quiz keyboard navigation per WCAG 2.1.1. |
| **Performance** | Video streaming via Cloudinary or external? Verify per-lesson load < 3s. |
| **SEO** | `Course` JSON-LD on each course detail required. |
| **Localization** | Foundation strings ✓; course content user-content; path titles likely English. |
| **Data adequacy** | Likely missing: `learn_quizzes`, `learn_quiz_questions`, `learn_quiz_answers`, `learn_assignments`, `learn_assignment_submissions`, `learn_discussions`, `learn_discussion_replies`, `learn_cohorts`, `learn_live_sessions`, `learn_lesson_resources` (real types), `learn_lesson_bookmarks`, `learn_instructor_payouts`. |

═══════════════════════════════════════════════════════
MANDATORY REBUILD SCOPE
═══════════════════════════════════════════════════════

### A. Public surfaces

1. **`/` (home)** — `<HenryCoHeroCard>` learn accent. Above-the-fold:
   featured paths rail, search, capability evidence (active learners,
   completion rate, certified graduates). NO giant hero text.
2. **`/academy`** — editorial "How it works" page.
3. **`/courses`** — premium catalogue. Filters: category, level, duration,
   price, language, cohort vs self-paced.
4. **`/courses/[slug]`** — premium course detail with `Course` JSON-LD.
   Sections: hero (title, instructor, duration, price), syllabus
   (lesson tree expandable), what-you-learn list, requirements,
   testimonials, similar courses, "Enroll" CTA.
5. **`/paths`, `/paths/[slug]`** — paths combine 3-7 courses; show
   progression visually with "X of N courses complete".
6. **`/categories/[slug]`** — category landing.
7. **`/instructors`, `/instructors/[slug]`** — instructor directory +
   profile with verification badge, courses authored, learner count,
   average rating.
8. **`/certifications`** — list of all certifications you can earn.
9. **`/certifications/verify`, `/certifications/verify/[code]`** — public
   verification page (already shipped — keep premium quality).
10. **`/teach`** — premium instructor application flow. Steps: (1) About
    you, (2) Teaching topic, (3) Sample syllabus, (4) Sample lesson video
    upload, (5) KYC, (6) Submit. Writes `learn_teacher_applications`.
11. **`/help`, `/trust`, `/login`, `/signup`** — keep with shared
    primitives.

### B. Learner authenticated surface

`account.henrycogroup.com/?module=learn` (separate package
`@henryco/dashboard-modules-learn`):

- **Overview** — active courses, current streak, due assignments,
  upcoming live sessions, recent certificates
- **My courses** — enrolled list with progress meter; "Resume" CTA
- **Course player** — `/learner/courses/[courseId]` — premium player:
  - **Lesson tree** sidebar with progress dots
  - **Lesson body** by type:
    - Video: `<VideoPlayer>` with captions + speed + bookmarks +
      keyboard nav; resumes from last position; supports captions in
      multiple locales
    - Reading: rich text + table of contents; scroll position persisted;
      reading time estimate
    - Quiz: `<QuizEngine>` with multiple-choice + multi-select +
      free-response + grading; show explanation after answer; track score
    - Assignment: `<AssignmentSubmission>` with file upload + free-text;
      instructor review surface
  - **Resources** rail per lesson (real downloads, not example.com)
  - **Discussion** per lesson (`<DiscussionThread>` — uses
    `@henryco/messaging-thread` shape)
  - **Notes** — learner private notes per lesson
- **Progress** — overall progress, streak, hours learned, badges
- **Certificates** — earned + pending; "Download PDF" + "Verify URL" +
  "Share to LinkedIn" CTAs
- **Saved** — saved courses (use `@henryco/cart-saved-items` primitive)
- **Payments** — receipts; refund request CTA
- **Notifications** — wired via `@henryco/notifications-ui`
- **Settings** — locale, captions language, video quality default

### C. Instructor authenticated surface

`/instructor/*` (consumes `@henryco/workspace-shell`):

- **Overview** — active courses, learner count, recent reviews, payout
  status
- **Courses** — authored list; "New course" creator with: title,
  description (rich editor), category, level, duration estimate, syllabus
  builder (drag-to-reorder lessons), price, prerequisites
- **Lesson editor** — per-lesson: type (video/reading/quiz/assignment),
  content editor, resources upload, captions upload (or auto-generate
  via Cloudinary/Mux), preview
- **Quiz builder** — per-quiz: questions, answer types, correct answers,
  explanations, scoring, unlock policy
- **Assignments** — submissions queue with grade + feedback
- **Discussions** — instructor-respond to learner Q&A
- **Live sessions** — schedule + manage cohort live classes
- **Analytics** — enrollment, completion, average rating per course
- **Payouts** — earnings + payout history; "Request payout" CTA
- **Settings**

### D. Operator surfaces

- **Admin** — taxonomy (categories, skills, levels), cron health
- **Content** — content moderation queue (flagged lessons, flagged
  reviews)
- **Owner** — strategic dashboard + course/path/learner/instructor/
  certificate/assignment management (mostly shipped; polish to premium)
- **Analytics** — platform-wide funnel, completion, NPS
- **Support** — `@henryco/messaging-thread`

### E. Database

Add app-local migrations under `apps/learn/supabase/migrations/`:

1. `<TS>_learn_quizzes.sql` — `learn_quizzes`, `learn_quiz_questions`,
   `learn_quiz_answer_options`, `learn_quiz_attempts`,
   `learn_quiz_answer_responses`. RLS: learner can SELECT/INSERT own;
   instructor can SELECT for their courses; staff all.
2. `<TS>_learn_assignments.sql` — `learn_assignments`,
   `learn_assignment_submissions` (with file URLs), `learn_assignment_grades`.
3. `<TS>_learn_discussions.sql` — per-lesson discussion threads.
4. `<TS>_learn_cohorts.sql` — cohort-based courses with start date,
   enrollment cap, schedule.
5. `<TS>_learn_live_sessions.sql` — scheduled live sessions per cohort.
6. `<TS>_learn_lesson_resources.sql` — real lesson resources (file_url
   from Cloudinary, label, type).
7. `<TS>_learn_lesson_bookmarks.sql` — per-learner bookmarks within video
   lessons (timestamp).
8. `<TS>_learn_lesson_notes.sql` — private learner notes per lesson.
9. `<TS>_learn_instructor_payouts.sql` — instructor revenue + payout
   ledger.
10. `<TS>_learn_realtime_publication.sql` — discussions + live sessions
    + assignment submissions to Realtime.

Bump `LEARN_BOOTSTRAP_VERSION` in seed; remove all example.com URLs
(see stash from parallel session).

### F. APIs and crons

- `POST /api/learn/enrollment` — enroll learner in course
- `POST /api/learn/progress` — record lesson completion
- `POST /api/learn/quiz/submit` — submit quiz attempt + auto-grade
- `POST /api/learn/assignments/submit` — submit assignment
- `POST /api/learn/assignments/grade` — instructor grade
- `POST /api/learn/discussions` — post + reply
- `POST /api/learn/instructor/courses` — instructor course CRUD
- `POST /api/learn/instructor/payout-request`
- `GET /api/learn/cohorts/[id]/calendar` — cohort schedule
- Cron: extend `/api/cron/learn-automation`:
  - Send lesson reminders (next-up)
  - Send streak break warnings
  - Send live-session reminders (24h, 1h)
  - Send assignment-due reminders
  - Send certificate-issued notifications

### G. Components

Reuse cross-division primitives. Build (learn-specific):
- `<CourseCard>`, `<CourseGrid>`, `<CourseDetail>`
- `<PathCard>`, `<PathDetail>` with course progression
- `<LessonTree>` sidebar with progress dots
- `<VideoPlayer>` (Cloudinary or HLS, with captions + speed + bookmarks
  + keyboard nav; pause on tab blur)
- `<ReadingMode>` with TOC + scroll position persistence
- `<QuizEngine>` with question types + grading + explanations
- `<AssignmentSubmission>` with file upload + free-text
- `<AssignmentGradePanel>` (instructor side)
- `<DiscussionThread>` (uses `@henryco/messaging-thread` shape)
- `<CohortCalendar>` with live sessions
- `<CertificateCard>` (earned + pending)
- `<InstructorAuthoringSuite>` (course/lesson/quiz editor)
- `<ProgressMeter>`, `<StreakChip>`, `<BadgeGrid>`

### H. External integrations

- **Cloudinary or Mux** — video hosting + transcoding + captions (env-gated;
  if Mux env present, use Mux; else Cloudinary; else SVG-fallback message
  if neither configured)
- **Resend** — confirmations, reminders
- **WhatsApp** (optional) — reminders

### I. Crons + observability

- `/api/cron/learn-automation` instrumented + Sentry. Idempotent.

═══════════════════════════════════════════════════════
UNIFORMITY RULES
═══════════════════════════════════════════════════════

(Same matrix; see `docs/rebuild-prompts/logistics.md` § "UNIFORMITY
RULES". Learn-specific note: `LearnCertificateDocument` template already
shipped in `@henryco/branded-documents` — keep using it.)

ALL master `DASHBOARD-REBUILD-PROMPT-V2-FINAL.md` §4.1 + §4.2
anti-patterns apply.

Learn-specific anti-pattern call-outs:
- No autoplay-with-sound on video player (WCAG 1.4.2)
- No video without captions (or captions explicitly marked as N/A)
- No quiz without keyboard nav
- Use learn accent `#3C8C7A`; never default blue

═══════════════════════════════════════════════════════
DISTINCTIVE RULES — WHAT LEARN MUST BUILD
═══════════════════════════════════════════════════════

1. **Course player** — multi-modal (video + reading + quiz +
   assignment) with progress persistence; no other division has this
   shape.
2. **Quiz engine** with question types + auto-grading + explanations.
3. **Assignment submission + instructor grading** flow.
4. **Per-lesson discussion thread** (uses messaging-thread but with
   lesson context).
5. **Verified certificate with public verification URL + QR** — already
   shipped end-to-end; KEEP at premium quality.
6. **Path with course progression** — only learn has this shape.
7. **Cohort + live sessions** — first-class.
8. **Instructor authoring suite** — only learn has this.
9. **Streak + badges** — only learn has gamification.

═══════════════════════════════════════════════════════
COMPETITOR BENCHMARK
═══════════════════════════════════════════════════════

- **Coursera** — best-in-class for path + cohort + university brand
- **edX** — best-in-class for verified certificate
- **Udemy** — best-in-class for self-paced catalogue + instructor
  earnings
- **Maven** — best-in-class for cohort-based premium courses
- **Teachable** — best-in-class for instructor authoring + payout

The bar: a learner at `account.henrycogroup.com/?module=learn` should
feel they are using a premium learning product (Coursera-quality), not a
basic LMS.

═══════════════════════════════════════════════════════
TRUST, PAYMENT, COMPLIANCE
═══════════════════════════════════════════════════════

- Course payment via `@henryco/payment-surface`; pricing breakdown row.
- Instructor payout flow with KYC + bank account verification (use
  `kyc_sensitive_action_gating.md`).
- Refund window: 7-day (configurable per course).
- Certificate verification public URL must NOT leak PII beyond name +
  course + completion date + grade (if applicable).
- Audit log on every instructor course publication + every cohort
  schedule change.
- Cohort enrollment cap enforcement at SQL level (race-safe via
  `INSERT ... ON CONFLICT` or transaction).

═══════════════════════════════════════════════════════
MOBILE AND DESKTOP
═══════════════════════════════════════════════════════

- 320/375/390/430/768/1024 px.
- Course player mobile: full-bleed video; bottom sheet with lesson tree
  + actions; sticky-bottom "Continue" CTA.
- Quiz mobile: one question per screen with progress bar + back/next
  thumb-zone CTAs.
- Discussion mobile: full-screen thread with composer at bottom.
- Reading mode mobile: serif typography, line-height 1.6, max-width
  measure.

═══════════════════════════════════════════════════════
LOCALIZATION
═══════════════════════════════════════════════════════

- `@henryco/i18n` foundation only.
- Course content (user-content): render in original locale.
- Captions language: per-learner setting; if not present in lesson,
  show "Captions not available in <locale>".
- Pricing display: `@henryco/pricing` formatting.
- RTL verified.

═══════════════════════════════════════════════════════
VALIDATION GATE — V1 through V13 + learn-specific
═══════════════════════════════════════════════════════

V1–V13 from master §3. Learn-specific:

- **L1** — Video player resumes from last position on reload.
- **L2** — Captions display when available; "captions not available"
  surfaced when missing.
- **L3** — Quiz engine grades client-side preview but server-side
  authoritative on submit.
- **L4** — Assignment file upload accepts up to 50 MB; rejects
  oversized; previews on submission.
- **L5** — Cohort enrollment cap enforced (race-safe); 11th enrollee
  on a 10-cap cohort gets "Cohort full".
- **L6** — Certificate verification URL renders without auth; only
  exposes name + course + completion date + grade.
- **L7** — Instructor payout request writes audit_log + creates
  payout record in `learn_instructor_payouts`.
- **L8** — `LEARN_BOOTSTRAP_VERSION` bumped; all example.com URLs
  removed from seed.

═══════════════════════════════════════════════════════
DEPLOYMENT
═══════════════════════════════════════════════════════

1. Branch `feat/v3-pass-21-learn`.
2. Migrations on Supabase preview branch first.
3. PR with V1–V13 + L1–L8 PASS table.
4. Vercel preview live-checked.
5. Merge → `learn.henrycogroup.com`.
6. Persist report at `.codex-temp/v3-pass-21-learn/report.md`.

═══════════════════════════════════════════════════════
FINAL REPORT
═══════════════════════════════════════════════════════

Sections same shape as logistics: H0 recon, files modified, migrations,
V1–V13 + L1–L8 gate table, anti-pattern audit, mobile parity, Lighthouse
+ CWV, a11y audit, hand-off, final classification.

═══════════════════════════════════════════════════════
SELF-VERIFICATION CHECKLIST
═══════════════════════════════════════════════════════

- [ ] Public surfaces in §A rebuilt with `Course` JSON-LD on every
      course detail
- [ ] Learner surface in §B with premium course player (video + reading
      + quiz + assignment)
- [ ] Instructor surface in §C with full authoring suite
- [ ] Operator surfaces in §D
- [ ] Migrations in §E applied with RLS verified
- [ ] APIs in §F shipped with idempotency + observability
- [ ] Components in §G built reusing primitives
- [ ] Video provider integrated (Mux preferred, Cloudinary fallback)
- [ ] Mobile parity at 6 breakpoints
- [ ] i18n: every string under a key; RTL renders
- [ ] V1–V13 + L1–L8 PASS or N/A with justification
- [ ] Final report persisted
- [ ] PR opened with PASS table in body
