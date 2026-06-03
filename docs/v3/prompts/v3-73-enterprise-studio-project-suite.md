# V3-73 — Partner & Enterprise: Studio Project Suite

**Pass ID:** V3-73  ·  **Phase:** H (Partner & Enterprise)  ·  **Pillar:** P8 (Partner & Business)
**Dependencies:** V3-57 (Business Profiles + Tools)  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role

You are the V3 Studio Project-Suite engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass deepens the studio's project layer into a **client-facing project portal with rigorous revisions tracking and payment-gated asset delivery** — the surface a paying client lives in while a brand/design/motion project runs. The line it must not cross: it does not touch brief intake (existing studio) or pricing (`@henryco/pricing`); it does not change payment behaviour — it *reads* payment state to gate final-file unlock. Watermarking and HMAC-signed approvals are the trust spine; they must be airtight.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/73-enterprise-studio-project-suite` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

The studio app already ships a substantial project backend. Real surfaces exist today: the client portal at `apps/studio/app/client/projects/page.tsx` and `apps/studio/app/client/projects/[projectId]/page.tsx` (with a `messages/` thread), the operator/PM workspace at `apps/studio/app/pm/projects/`, a project view at `apps/studio/app/project/[projectId]/`, asset delivery at `apps/studio/app/delivery/assets/`, and the API at `apps/studio/app/api/studio/{milestones,proposals,revisions,asset-packs}/` plus `apps/studio/app/api/portal/`. `@henryco/branded-documents` ships `studio-proposal.tsx`, `studio-invoice.tsx`, and `studio-brand-guidelines.tsx`. So milestones, proposals, asset packs, and a revisions API already exist in skeleton. What this pass elevates: a *cohesive client portal* that shows the full project state (timeline/gantt, files, approvals, communication) in one place; a *revisions tracking system at depth* with per-revision HMAC-signed approval snapshots and a clear round-trip counter (X used / Y remaining per package); and *payment-gated asset access* where previews are watermarked and final files unlock only on confirmed payment. This is the enterprise project suite the studio's higher-tier clients expect — built on the existing project/milestone/revision backend, not a rebuild of it.

## Mandatory scope

### S1 — Client portal (cohesive)

Elevate `apps/studio/app/client/projects/[projectId]/page.tsx` into a complete portal that composes the existing backend into one client view. Resolve the project by RLS-scoped client identity (or a V3-57 `business_members` membership when the client is a business). The portal renders:

- **Project overview + timeline.** A gantt/timeline of milestones read from `api/studio/milestones`, with stage status and dates. Reuse the existing milestone backend.
- **Files + asset packs.** The deliverables and asset packs from `api/studio/asset-packs` and `apps/studio/app/delivery/assets/`, with previews (watermarked, S4) and final files (payment-gated, S4).
- **Approvals workflow.** Per-deliverable approve/request-changes actions wired to the revisions backend (S3).
- **Communication thread.** The existing `client/projects/[projectId]/messages/` thread (`@henryco/messaging-thread` / `@henryco/chat-composer`) embedded in the portal context.

No new project/milestone schema — compose the existing `api/studio/*` endpoints. Add only what S3 (revisions depth) and S4 (asset access) require.

### S2 — Studio operator workspace (extend, do not fork)

Extend the existing `apps/studio/app/pm/projects/` operator workspace so an operator sees the client-side state mirror: which deliverables are awaiting approval, revision counts per package, and which final files are locked vs unlocked by payment. No kanban/gantt rebuild — augment the existing PM views with the revision-round and payment-unlock signals from S3/S4.

### S3 — Revisions tracking at depth

Build the revision system on top of the existing `api/studio/revisions` endpoint. A revision is one round of changes on a deliverable; each package has a contracted revision allowance; each client approval produces a tamper-evident signed snapshot.

```sql
CREATE TABLE studio_deliverable_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  deliverable_id UUID NOT NULL,
  revision_number INT NOT NULL,                -- 1-based, monotonic per deliverable
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted','changes_requested','approved')),
  requested_by UUID REFERENCES auth.users(id), -- client who requested changes
  change_notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approval_signature TEXT,                      -- HMAC-signed snapshot (S3, Principle 12)
  approval_snapshot JSONB,                      -- the exact deliverable state approved
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (deliverable_id, revision_number)
);
ALTER TABLE studio_deliverable_revisions ENABLE ROW LEVEL SECURITY;
-- Client reads/acts on their own project's revisions; studio operators read all (via existing studio-staff predicate).
CREATE POLICY studio_revisions_client ON studio_deliverable_revisions
  FOR SELECT USING (
    project_id IN (SELECT id FROM studio_projects WHERE client_user_id = auth.uid())
    OR project_id IN (
      SELECT p.id FROM studio_projects p
      JOIN business_members bm ON bm.business_id = p.client_business_id
      WHERE bm.user_id = auth.uid()
    )
  );
```

(Adapt the `studio_projects` column names to the existing schema — the policy intent is: client/their-business reads their project's revisions; operators read all via the studio-staff predicate already in use.)

- **Per-deliverable revision history.** The full chain of revisions with status, change notes, and who acted.
- **Approval signature per revision.** On approve, compute an HMAC-signed snapshot of the exact approved deliverable state (`approval_signature` over `approval_snapshot` with a server-side secret) — defence-in-depth proof of what the client approved and when (ANTI-CLONE Principle 12). The signature is verifiable server-side; the snapshot is immutable once signed.
- **Round-trip counter.** Per package, show "X revisions used / Y remaining" from the contracted allowance (read from the proposal/package). When the allowance is exhausted, further change-requests are flagged as billable (surfaced to operator + client; the actual billing is the existing studio billing path, not changed here).

### S4 — Asset access control (watermark + payment unlock)

Two-tier asset access, enforced server-side at the file-serving boundary — never client-trust.

- **Watermarked previews.** Every preview served before final unlock carries a visible low-opacity `${client_identity}.${timestamp}` watermark and an invisible HMAC-signed identity tag in metadata (ANTI-CLONE Principle 5). Reuse the watermarking pattern from `@henryco/branded-documents` (the same Principle-5 mechanism V3-18 uses for invoices) and the `branded_document_exports` export-tracking table for asset exports.
- **Final files unlock on payment.** Final, un-watermarked deliverable files are served only when the project's payment state is confirmed-paid. Read payment truth from the studio payment surface (`apps/studio/app/client/payment(s)/` + the studio finance/invoice tables) — **status = provider-confirmed money-truth, never optimistic UX**. The unlock is a server-side check at the signed-URL issuance boundary: no confirmed payment → no final-file signed URL (short-lived JWT, owner-only). This pass does not change how payment is taken — it only reads the confirmed status to gate the unlock.

### S5 — Telemetry

Extend `@henryco/observability` `HenryEventName` with exactly these three, mapped exhaustively:

```
henry.studio_project.client_viewed
henry.studio_project.revision_requested
henry.studio_project.deliverable_approved
```

Emit `henry.studio_project.client_viewed` on portal load, `henry.studio_project.revision_requested` on a change-request, `henry.studio_project.deliverable_approved` on an approval (with `revision_number` in the payload). Final-file unlock and watermark export write `@henryco/observability/audit-log` rows (Principle-5 export tracking).

## Out of scope

- Brief intake + scope step — existing studio (unchanged).
- Pricing computation — `@henryco/pricing` (unchanged); the revision-allowance figure is *read* from the package/proposal.
- Taking payment / payment provider behaviour — existing studio payment path + V3-13/15 (this pass only reads confirmed status to gate unlock).
- Motion/video production workflow — V3-55 (this suite is project-management depth, not the motion service).

## Dependencies

- **Requires:** V3-57 (`businesses` + `business_members` for business-client portal access).
- **Soft-reads:** the existing studio milestone/proposal/asset-pack/revision backend; the studio payment surface (confirmed status); `@henryco/branded-documents` (watermark + export tracking).
- **Blocks:** nothing downstream depends on this pass directly.

## Inheritance

- The existing studio project backend: `apps/studio/app/client/projects/*`, `apps/studio/app/pm/projects/*`, `apps/studio/app/project/[projectId]/*`, `apps/studio/app/delivery/assets/*`, `apps/studio/app/api/studio/{milestones,proposals,revisions,asset-packs}/*`, `apps/studio/app/api/portal/*`.
- `@henryco/branded-documents` — `studio-proposal.tsx` / `studio-invoice.tsx` / `studio-brand-guidelines.tsx`, the Principle-5 watermark mechanism, and `branded_document_exports`.
- `@henryco/messaging-thread` / `@henryco/chat-composer` — the project communication thread.
- `@henryco/observability` + `@henryco/observability/audit-log` — telemetry + Principle-5 export tracking.

## Implementation requirements

### Files

The elevated `apps/studio/app/client/projects/[projectId]/page.tsx` portal + its composing components; the operator augmentation in `apps/studio/app/pm/projects/*`; the migration `apps/studio/supabase/migrations/<ts>_studio_deliverable_revisions.sql` (the `studio_deliverable_revisions` table + RLS + the HMAC-signature columns); the revision actions extending `apps/studio/app/api/studio/revisions/`; the asset-unlock signed-URL handler at the file-serving boundary; the three new events in `packages/observability/src/events.ts`.

### Trust / safety / compliance

Client-portal RLS: a client (or their V3-57 business members) reads only their own project's milestones, files, revisions, and messages; operators read via the existing studio-staff predicate. Approval snapshots are HMAC-signed and immutable (Principle 12). Final-file unlock is a server-side payment-truth gate at signed-URL issuance — short-lived JWT, owner-only, never client-trusted; an un-paid project can never obtain a final-file URL. Every preview is watermarked (Principle 5) and every export is tracked in `branded_document_exports`. Approvals and unlocks are audit-logged.

### Mobile + desktop parity

The client portal is responsive: overview, timeline, files, approvals, and the message thread work on web mobile (safe-area + keyboard avoidance per V3-09). The operator PM workspace is desktop-primary (dense). The Expo super-app links out to the portal in this pass; final-file download obeys the same payment-truth gate regardless of surface.

### i18n

All labels, statuses (`submitted`/`changes_requested`/`approved`, locked/unlocked), the round-trip counter copy ("X used / Y remaining"), and errors flow through `@henryco/i18n`, namespace **`surface:studio-project`**. Status copy and every error are typed copy keys; runtime DeepL (Pattern B) covers the other locales. No hardcoded user-facing strings.

### Brand & design system

The division label is **"Henry Onyx Studio"** sourced from `@henryco/config` (`company.ts`), never hardcoded — the studio brand sweep (PR #187) already aligned the studio surfaces; do not regress it. Every link/signed-URL host resolves through `henryDomain('studio', …)` / `getAccountUrl()` — zero literal `henrycogroup.com`. UI uses the locked studio accent (the §9 `.studio-public` accent fix is already folded in) + Fraunces display where editorial, design-system tokens only, light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed. Watermark + branded documents carry the **"Henry Onyx Limited"** legal entity from `@henryco/config` `legalName`.

## Validation gates

1. Standard CI: typecheck, lint, test, build (the only required branch-protection context: `Lint, typecheck, test, build`).
2. **Client portal renders project state** for a seeded project: timeline/milestones, files (watermarked previews), approvals, and message thread all present; truthful empty/loading/zero states (V3-08 rule).
3. **Revision tracking + approval suite** (≈14 specs): a change-request increments the revision chain; an approval produces a verifiable HMAC `approval_signature` over an immutable `approval_snapshot`; the round-trip counter decrements and flags billable when the allowance is exhausted; revision numbers are monotonic per deliverable (`UNIQUE` enforced).
4. **Watermark + unlock correctness** (the trust spine): every preview carries the visible + invisible Principle-5 watermark and an export-tracking row; a final-file signed URL is issued **only** when payment status is confirmed-paid; an unpaid project request returns no URL; the unlock check is server-side at the issuance boundary (client cannot bypass).
5. **RLS verification**: client A cannot read project B's revisions/files/messages; business-member access works via V3-57; operator read works via the studio-staff predicate.
6. **Real-browser** check (portal overview, files, approvals) on web mobile + desktop: light + dark, CLS ≈ 0, `pnpm a11y:contrast` clean.

## Deployment gate

All gates green; the only required check (`Lint, typecheck, test, build`) passing; branch `v3/73-enterprise-studio-project-suite` off `origin/main` → PR → squash-merge (no force-push, no branch-protection bypass). **14-day soak**; monitor `henry.studio_project.*` + audit-log, and specifically verify zero final-file leaks (no signed URL issued for an unpaid project) across the soak before general rollout.

## Final report contract

`.codex-temp/v3-73-enterprise-studio-project-suite/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion).

## Self-verification

- [ ] Client portal composes the existing milestone/asset-pack/revision/message backend into one RLS-scoped view (client + V3-57 business access).
- [ ] Operator PM workspace augmented with revision-round + payment-unlock signals (no kanban/gantt rebuild).
- [ ] `studio_deliverable_revisions` with monotonic revision numbers, change-request → approval chain, and an immutable HMAC `approval_signature` over `approval_snapshot` (Principle 12).
- [ ] Round-trip counter ("X used / Y remaining") from the package allowance; over-allowance flagged billable.
- [ ] Watermarked previews (visible + invisible, Principle 5) with `branded_document_exports` tracking.
- [ ] Final-file unlock gated server-side on confirmed-paid money-truth at signed-URL issuance; no unpaid leak; short-lived owner-only JWT.
- [ ] Three `henry.studio_project.*` events added to `HenryEventName` and emitted; approvals + unlocks audit-logged.
- [ ] RLS proven client/business/operator-scoped; cross-project access denied.
- [ ] Brand "Henry Onyx Studio" + legal "Henry Onyx Limited" from `@henryco/config`; zero hardcoded domains/strings; tokens-only UI light+dark CLS≈0; studio accent fix not regressed.
- [ ] Report written.
