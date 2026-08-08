# V3-FIRE-STUDIO — proposed fix migrations (HELD)

Proposed remediation from a **read-only** audit of `apps/studio` against live prod
(`rzkbgwuznmdxnnhmjazy`). Placed **outside** any apply pipeline and **not** run.
**Do not apply until the architect re-verifies and the owner approves.**

Most studio fixes are **app-layer** (no migration) — see `../V3-FIRE-STUDIO-2026-06-27.md`:
- **STU-1 (HIGH):** `apps/studio/app/api/documents/support-thread/[id]/route.ts` — require `thread.division === 'studio'` before exporting.
- **STU-2 (MED):** add a `division`/assignment scope to the support write routes (transitions/report/mute/transfer).
- **STU-3 (MED):** `/api/portal/download` — resolve `?u=` to an owned deliverable; de-wildcard the host allowlist.
- **STU-4 (MED):** `apps/studio/lib/studio/store.ts` `stableSecret()` — require `STUDIO_PORTAL_SECRET`, throw on missing; drop `FALLBACK_SECRET`.
- **STU-6/7/8 (LOW):** mark-read role gate, revisions null-owner, milestone `Math.trunc`, projected token view-model, asset-pack payment gate + signed URLs (before the dormant V3-PASS-21 tables apply).

This migration only covers **STU-5** (FORCE RLS).
