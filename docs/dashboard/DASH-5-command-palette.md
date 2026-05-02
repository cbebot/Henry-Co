# DASH-5 — Command Palette (Cmd+K) (Forged Prompt)

```
TOOL: Claude Code (Opus 4.7)
EFFORT: xhigh
PROJECT: HenryCo Ecosystem · henrycogroup.com · V2 active
PASS: V2-DASH-05 — Command palette (Cmd+K) cross-division entries
EXPECTED DURATION: Medium. May run in parallel with DASH-4 + DASH-6 after
                   DASH-3 completes (master §2 parallelism rules).

═══════════════════════════════════════════════════════
ROLE
═══════════════════════════════════════════════════════

Principal Systems Architect, Production Engineer, and Continuity Auditor for
the HenryCo Ecosystem. Opus 4.7. Self-verify against V1–V13.

═══════════════════════════════════════════════════════
CONTEXT — read in this order BEFORE writing code
═══════════════════════════════════════════════════════

1. docs/dashboard/DASHBOARD-AUDIT-REPORT.md (§C.5 — search fragmentation;
   §A.16 — apps/staff search.ts; §C.10 #8 — no shared command palette)
2. docs/dashboard/DASHBOARD-REBUILD-PROMPT-V2-FINAL.md (master)
3. docs/dashboard/DASH-1..DASH-4 forged prompts
4. .codex-temp/v2-dash-03/report.md (each module's getCommandPaletteEntries
   manifest is the source for cross-module commands)
5. apps/account/lib/search.ts (cross-division search — to consolidate)
6. apps/hub/lib/search.ts (owner-side cross-division — Track B; DASH-5
   reads it for parity reference but does not modify in this phase)
7. apps/staff/lib/search.ts (staff cross-division — to consolidate)
8. apps/<vertical>/app/(public)/search/page.tsx for each division
   (per-division search — DASH-5 federates through, doesn't replace)

═══════════════════════════════════════════════════════
TRUTH HIERARCHY
═══════════════════════════════════════════════════════

CODE / DEPLOYMENT / LIVE truth — see master §3.

═══════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════

A Linear-class command palette accessible via Cmd+K (or Ctrl+K on
non-mac) that:

1. Cross-division search via a single ranked search service
   - Consolidate apps/account/lib/search.ts + apps/staff/lib/search.ts
     (and parity-reference apps/hub/lib/search.ts for Track B) into
     packages/search/ (new) or extend @henryco/intelligence.
   - The search service is permission-aware — every result is filtered
     server-side through the viewer's role gate.
   - Federation across:
       * customer surfaces (orders, bookings, listings, applications,
         courses, certificates, invoices, support threads)
       * staff surfaces (tasks, queues, signals — when viewer is staff)
   - Ranking: relevance × recency × role-fit. Same shape as the signal
     feed ranker (DASH-1 + DASH-4) so the patterns stay coherent.

2. Cross-module commands
   - Each module manifest's getCommandPaletteEntries(viewer) (DASH-2 +
     DASH-3 shipped these) becomes the command source.
   - Aggregator runs at shell mount; rebuilds when the rail's eligible
     modules change (e.g. a feature-flag flip exposes building/hotel).

3. Recents + suggestions
   - Recents stored client-side in localStorage scoped to user_id (cleared
     on global signOut).
   - Suggestions ranked by lifecycle stage + recent activity (server-
     side; same data layer as Smart Home next-best actions in DASH-4).

4. Keyboard map
   - Cmd+K / Ctrl+K opens palette.
   - "?" anywhere outside an input opens a keyboard-shortcuts cheat
     sheet rendered as <Drawer>.
   - Esc closes.
   - Tab cycles result groups; ↑/↓ navigates results; Enter activates.
   - Cmd+1..9 jumps to numbered modules in the rail.

5. Surface
   - <Dialog> centered on desktop; <BottomSheet> on mobile (audit §C.10
     #9 — mobile-as-different-layout).
   - Result groups: Search results, Commands, Recents, Suggestions.
   - Each result row uses primitives from @henryco/dashboard-shell;
     no custom card markup.

═══════════════════════════════════════════════════════
GATE STRUCTURE
═══════════════════════════════════════════════════════

G0 — Recon at .codex-temp/v2-dash-05/recon.md.
G1 — packages/search/ scaffolded (or extension to
     @henryco/intelligence). Server search service lands.
G2 — Aggregator: every module's getCommandPaletteEntries collected at
     shell mount.
G3 — Recents + suggestions store.
G4 — Cmd+K surface (Dialog desktop / BottomSheet mobile). "?" cheat
     sheet drawer.
G5 — Keyboard map wired in (Esc, Tab, arrows, Enter, Cmd+1..9).
G6 — V1–V13 verification.
G7 — RLS verification on the search service: cross-tenant probe to
     confirm the federated search does NOT leak rows from other tenants.
G8 — Persisted report at .codex-temp/v2-dash-05/report.md.

═══════════════════════════════════════════════════════
ANTI-PATTERNS — applied to DASH-5
═══════════════════════════════════════════════════════

From master §4.1:
  #4 Decorative tiles — every command must invoke a real action. No
     "More commands coming soon" placeholders.
  #7 Reimplemented role helpers — the search service consumes
     packages/auth role gates. No client-side role re-derivation.
  #11 Migrating state-changing endpoints — DASH-5 introduces a new
     /api/search endpoint (or extends apps/account/api/search) but
     doesn't migrate state-changing routes.

From master §4.2:
  #13 No emoji-as-icon in result rows — use icon set.
  #14 No default tailwind dialogs — Panel + Drawer + BottomSheet
      primitives.
  #15 No blue primary on the active row — accent uses HenryCo gold.
  #21 Mobile = different layout — BottomSheet on mobile, NOT a
      cropped Dialog.

DO NOT:
- Build a generative-AI "ask a question" command (V3).
- Build a vector store / embeddings layer (V3).
- Federate search across other users' data (RLS hard guarantee).
- Cache search results across users (server cache must be user-scoped
  or no-cache).

═══════════════════════════════════════════════════════
VERIFICATION REQUIREMENT — DASH-5 gate
═══════════════════════════════════════════════════════

V1 build/typecheck/lint  — PASS required.
V2 auth-continuity        — PASS required.
V3 RLS verification        — PASS required: search service cross-tenant
                           probe with two non-privileged users. 0 rows
                           leak.
V4 Realtime smoke           — N/A — search is request/response.
V5 Mobile parity           — PASS required: BottomSheet at 320, 375,
                           390, 430; Dialog at 768, 1024.
V6 Lighthouse + CWV         — PASS required (palette open is interactive
                           latency — INP < 200 ms is the hard gate).
V7 WCAG AA                  — PASS required: dialog has focus trap,
                           role=combobox, aria-activedescendant for the
                           result list, Esc closes.
V8 Sender identity          — N/A.
V9 CTA reality              — PASS required: every command entry traced
                           to its destination route or handler with
                           file:line.
V10 Empty / loading / error / success — PASS required: empty query
                           shows recents + suggestions; loading state on
                           300 ms+ search latency; error state on
                           server failure with retry; success unlocks
                           the result row activation.
V11 No console errors       — PASS required.
V12 No 4xx/5xx              — PASS required.
V13 Role × division coverage — PASS required: every persona's palette
                           shows only their eligible commands.

═══════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════

Persist at .codex-temp/v2-dash-05/report.md:
  Files modified
  What was done
  How to verify
  Uncertainties
  Anti-pattern audit
  Verification gate (V1–V13)
  Command-coverage trace (every module's getCommandPaletteEntries
                         listed; verify the aggregator picks each up)
  Search RLS probe results
  Classification: DASH-5-COMPLETE | DASH-5-PARTIAL | DASH-5-BLOCKED
  Hand-off

PR title: feat(dashboard): DASH-5 Cmd+K command palette + federated
                              search.

═══════════════════════════════════════════════════════
V2 SCOPE BOUNDARY
═══════════════════════════════════════════════════════

NOT permitted in DASH-5:
  - Generative-AI commands (V3).
  - Vector-store / embeddings (V3).
  - New divisions.
  - Realtime fan-out UI (DASH-6).
  - Mobile bottom action bar (DASH-7 — palette uses BottomSheet
    primitive but the bottom action bar is separate).
  - Owner Track B (DASH-8).

═══════════════════════════════════════════════════════
PERSISTED-REPORT REQUIREMENT
═══════════════════════════════════════════════════════

  .codex-temp/v2-dash-05/recon.md
  .codex-temp/v2-dash-05/command-coverage.md
  .codex-temp/v2-dash-05/search-rls-probe.md
  .codex-temp/v2-dash-05/report.md         (final)

═══════════════════════════════════════════════════════
END OF DASH-5 FORGED PROMPT
═══════════════════════════════════════════════════════
```

---

## Authoring notes

- **Why packages/search/ rather than extending @henryco/intelligence.** Audit §C.5-1 calls out three duplicated search implementations. A dedicated package keeps the shape obvious. If the team prefers the intelligence package, the deliverable is identical — just a different home.
- **Why "?" cheat sheet.** Power users (and especially staff) will live in the palette. Discoverability of keyboard shortcuts is its own gate — Linear, Stripe, Vercel ship the cheat sheet for exactly this reason.
- **Why client-side recents but server-side suggestions.** Recents are personal and ephemeral; localStorage is fine and avoids a write per command. Suggestions are derived from real data (lifecycle, activity) and must respect RLS.
