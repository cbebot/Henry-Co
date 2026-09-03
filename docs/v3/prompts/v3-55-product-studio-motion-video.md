# V3-55 — Product Expansion: Studio Motion + Video Services

**Pass ID:** V3-55  ·  **Phase:** G (Product Expansion)  ·  **Pillar:** P1 (Service Breadth)
**Dependencies:** V3-12  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** — (asset-access + IP rigor, not money/identity behavior)

---

## Role
You are the V3 Studio engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass adds the **motion/video vertical** to Studio: a video-specific service catalog, a video-aware brief intake (aspect ratio, duration, storyboard), a storyboard→rough-cut→final production workflow, and watermarked-preview-vs-final-HD delivery gated on payment via signed URLs. The line you must not cross: this is a **new service vertical on the existing Studio backend** — reuse the proposal/milestone/asset-pack/delivery primitives; do not fork the project model, and do not change any payment *behavior* (delivery is gated on the existing payment status, not a new money flow). Deep project-management suite is V3-73.

## Project
| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/55-product-studio-motion-video` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
Studio already has a deep delivery backend built under the earlier "V3 PASS 21" cycle; this pass adds the video vertical on top of it rather than building new infrastructure:

- **Backend that exists.** `apps/studio/supabase/migrations` ships proposals + signatures (`20260514130000_studio_proposal_signatures.sql`), revisions/versioning (`..130500`), milestone extensions (`..131000`), payment plans (`..131500`), resource allocations (`..132000`), and **asset packs** (`20260514132500_studio_asset_packs.sql` — `public.studio_asset_packs` with `status pending → generating → ready → failed → expired`, `expires_at`, RLS client-read scoped to the project). The brief domain/intent model exists (`20260405120000_studio_brief_domain_intent.sql`, `20260503130000_studio_brief_drafts.sql`), plus client portal + messaging.
- **Surfaces that exist.** `apps/studio/app/request/page.tsx` (the canonical brief composer — copilot + custom lanes), `apps/studio/app/proposals/[proposalId]`, `apps/studio/app/pm/` (projects/revisions kanban), `apps/studio/app/project/[projectId]`, and `apps/studio/app/delivery/page.tsx` (deliverables with `status` incl. `approved`, files split into `deliverable`/`reference` kinds, "Studio vault").
- **Primitives that exist.** `@henryco/branded-documents` (templates incl. `studio-proposal`, `studio-invoice`, `studio-brand-guidelines`) for IP/scope docs; **Cloudinary** integration for asset transforms/storage; the studio payment surface (`apps/studio/app/pay`, `/payment`, `/checkout`) — behavior-locked.

**The gap this pass closes.** Studio sells design/brand work, but there is no **motion/video** service path: no video service catalog (explainer, motion graphics, editing, 3D, brand stings), no video-aware brief fields (aspect ratio, duration, style refs, deadline), no storyboard sign-off stage, no rough-cut review loop, and no watermarked-preview-vs-final-HD delivery discipline. The asset-pack and deliverable plumbing exists but is not specialized for multi-format video (mp4/mov/prores) or for gating final HD behind payment. This pass adds the video vertical end-to-end while reusing the existing project/proposal/asset/delivery spine.

## Mandatory scope

### S1 — Motion service catalog
Add a video service taxonomy to the Studio service catalog: `explainer_video`, `motion_graphics`, `video_editing`, `three_d_animation`, `brand_sting`. Each carries a per-service intake schema reference, base pricing/estimate inputs (feeding the existing estimate path — no new money flow), and a public service surface. Persist as catalog data (migration `<TS>_studio_motion_catalog.sql`) so ops can tune without a deploy; mark these services as `vertical='motion'`. **Acceptance:** the five services appear in the catalog and in `apps/studio/app/request` lane selection; estimates compute through the existing path.

### S2 — Video-aware brief intake
Extend the brief composer (`apps/studio/app/request/page.tsx` + brief-drafts model) with a video intake step that captures: aspect ratio (16:9 / 9:16 / 1:1 / custom), target duration, style references (links + uploaded refs via the existing asset flow), deadline, and deliverable-format expectations (mp4/mov/prores). Store on the brief draft (`studio_brief_drafts` extension column or a typed `intake jsonb`). Reuse the existing asset-upload flow for reference uploads — do not build a new uploader. **Acceptance:** a motion brief persists all video fields to the draft and carries them into the generated proposal.

### S3 — Production workflow (storyboard → rough cut → final)
Add a motion production stage machine layered on the existing milestone/revision model: `brief_accepted → storyboard → storyboard_signed_off → rough_cut → rough_cut_approved → final_delivery → delivered`. Each stage is a milestone; storyboard sign-off and rough-cut approval are explicit client actions (reuse the existing proposal-signature/approval primitive). Sign-off is recorded immutably (who/when). **Acceptance:** the stages render in `apps/studio/app/pm` + the client portal; storyboard sign-off and rough-cut approval persist and gate the next stage.

### S4 — Multi-format asset delivery via Cloudinary
Extend the existing asset-pack/deliverable flow for video: generate multiple output formats (mp4, mov, prores) through Cloudinary transforms, registered as `studio_asset_packs` rows (`status pending → generating → ready`). Deliverables are tagged with format + resolution. **Acceptance:** a delivered motion project produces a multi-format pack; each format is a retrievable deliverable; pack lifecycle (`generating → ready → expired`) is honored.

### S5 — Watermarked preview vs payment-gated final download
Previews (storyboard frames, rough cuts, and pre-payment finals) are served **watermarked** via Cloudinary watermark transform; the **final HD/un-watermarked download is unlocked only after the existing payment status is `paid`** for the relevant milestone/plan. Access to any asset is buyer-only via **signed URL** (never a public Cloudinary URL). This consumes the existing studio payment status — it does **not** create or change a money flow (payment surface behavior-locked). **Acceptance:** before payment, every video asset the client can see is watermarked; after payment-confirmed status, the un-watermarked HD download is available; all access is signed-URL + buyer-scoped; unauthorized users get 403.

### S6 — IP / scope documentation + telemetry
Record IP rights + usage scope in the proposal via the existing `@henryco/branded-documents` `studio-proposal` template (motion-aware clauses: ownership transfer on final payment, usage rights, source-file inclusion). Emit via `@henryco/observability`: `henry.studio.motion.intake_started`, `henry.studio.motion.storyboard_signed_off`, `henry.studio.motion.rough_cut_approved`, `henry.studio.motion.delivered` (carrying `{ projectId, serviceType, format }`, no PII). **Acceptance:** the proposal carries motion IP clauses; all four events fire on their transitions.

## Out of scope
- Deep project-management suite (Gantt, resourcing depth, client-portal at scale) — **V3-73** (enterprise studio project suite).
- Live-streaming / real-time production — out of scope for V3 entirely.
- Any change to the studio payment flow, pricing engine money math, or checkout — payment surface is **behavior-locked**; this pass only *reads* payment status to gate delivery.
- Brand-guidelines / static design verticals — already shipped; this pass is video-only.

## Dependencies
Depends on **V3-12** (Foundation Lock certified) and the shipped Studio backend. **Blocks downstream:** V3-73 (project suite at depth builds on the motion stage machine). Soft-coupled to V3-32 (studio brief assist) which may later auto-draft motion briefs.

## Inheritance
Builds on: the existing `apps/studio` backend (`studio_asset_packs`, proposals/signatures, milestones/revisions, brief drafts, deliverables, client portal, messaging); `@henryco/branded-documents` (`studio-proposal` template); the Cloudinary integration (transforms, watermark, signed URLs); the behavior-locked studio payment surface (`apps/studio/app/pay`/`/payment`/`/checkout`); `@henryco/observability`; `@henryco/i18n`; `@henryco/config`.

## Implementation requirements
### Files
- New: `apps/studio/supabase/migrations/<TS>_studio_motion_catalog.sql`, `<TS>_studio_motion_intake.sql` (brief intake jsonb + production-stage columns).
- Changed: `apps/studio/app/request/page.tsx` (+ brief-draft composer) for the video intake step; `apps/studio/app/pm/` + client portal for the motion stage machine; `apps/studio/app/delivery/page.tsx` for multi-format + watermark-vs-final.
- New: `apps/studio/lib/studio/motion/` (catalog, intake schema, stage machine, Cloudinary watermark + signed-URL helpers, telemetry).
- Changed: `@henryco/branded-documents` consumption for motion IP clauses (via props/config — do not hardcode clause copy; source from i18n/config).

### Trust / safety / compliance
Every asset (preview or final) is served via **signed URL**, buyer-scoped, never a public URL — RLS on `studio_asset_packs`/deliverables already scopes client reads to the project; preserve it. Final-HD unlock is gated strictly on **provider-confirmed payment status** (`paid`), never optimistic UI. IP rights documented in the proposal before production starts. No raw client PII in telemetry. Cloudinary signing keys handled server-side only (never shipped to the client bundle).

### Mobile + desktop parity
Brief intake + storyboard/rough-cut review are responsive (web mobile + desktop); preview playback works on mobile. The heavier PM/kanban surfaces are desktop-first but must not break on tablet. Native (Expo) is out of scope for this pass (web-first vertical).

### i18n
All motion service labels, intake field labels, stage names, watermark/preview copy, delivery copy, and IP-clause text flow through `@henryco/i18n` under namespace `surface:studio-motion`. 12 locales; status/errors/clauses translated. Format/codec tokens (`mp4`/`mov`/`prores`) and aspect-ratio tokens are identifiers (exempt).

### Brand & design system
All user-facing brand strings = **Henry Onyx Studio** via `@henryco/config` (`COMPANY.divisions.studio.name`), never hardcoded — note `apps/studio/app/request/page.tsx` currently carries retired "Henry & Co. Studio" metadata; correct any motion-surface brand strings to Henry Onyx via config. Studio surfaces use the locked studio `--site-*`/`--accent` tokens + Fraunces for editorial headings; light + dark, CLS ≈ 0, contrast not regressed. Zero hardcoded domains — asset/delivery links go through `henryDomain('studio')` / signed Cloudinary URLs.

## Validation gates
1. **CI green:** `pnpm typecheck && pnpm lint && pnpm test && pnpm build` for `apps/studio`.
2. **Intake flow smoke:** a motion brief persists all video fields and carries them into the proposal.
3. **Storyboard sign-off + rough-cut approval persist** and gate the next stage; sign-off is immutable (who/when).
4. **Multi-format delivery:** a delivered project produces mp4/mov/prores deliverables; pack lifecycle honored.
5. **Watermark vs final download:** pre-payment assets are watermarked; post-`paid` HD download available; all access signed-URL + buyer-scoped; unauthorized → 403.
6. **Payment behavior unchanged:** assert no change to the studio payment surface money path (delivery only *reads* status).
7. **i18n gate:** `pnpm i18n:scan` passes; namespace `surface:studio-motion` complete; no hardcoded user-facing strings.

## Deployment gate
All gates green; PR on `v3/55-product-studio-motion-video` off `origin/main` → CI green → squash-merge. Run a **14-day soak** with at least one internal end-to-end motion project (brief → storyboard sign-off → rough cut → payment → final HD download). Confirm the watermark-vs-final gate behaves correctly against real Cloudinary signed URLs and real payment status. Owner review not required (no D-gate).

## Final report contract
`.codex-temp/v3-55-product-studio-motion-video/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion).

## Self-verification
- [ ] S1: five motion services in the catalog + request lane; estimates compute through the existing path.
- [ ] S2: video-aware brief intake persists aspect ratio/duration/refs/deadline/formats into the draft and proposal.
- [ ] S3: storyboard → rough cut → final stage machine with immutable client sign-offs gating progression.
- [ ] S4: multi-format (mp4/mov/prores) delivery via Cloudinary registered as asset packs.
- [ ] S5: watermarked previews vs payment-gated final HD download; all access signed-URL + buyer-scoped; payment behavior unchanged.
- [ ] S6: motion IP clauses in the proposal; all four telemetry events fire.
- [ ] Cross-cutting: zero hardcoded domains/strings; "Henry & Co." corrected to Henry Onyx via config; i18n namespace `surface:studio-motion`; tokens-only UI; report written.
