# Onyx Arena — "Learn to Win": Coach, Living Boards & Practice-vs-AI

- **Date:** 2026-06-22
- **Status:** Approved (scope ratified by owner) — design phase
- **Branch / worktree:** `v3/gaming-02-arena-learn-to-win` @ `C:/Users/HP VICTUS/henryco-gaming` (off `origin/main`)
- **Builds on:** V3-GAMING-01 (PR #324, merged + migration applied to prod, flag-dark)
- **Money / DB:** ZERO money, ZERO migrations, ZERO new DB objects. Free-play only.

## 1. Problem

The arena shipped functional but **unteachable and static**. `/play` renders a grid of
plain squares with no explanation of the goal, the connection rule, or the
swap/fracture twists — a newcomer cannot tell they are "Onyx", that their goal is
to link top↔bottom, or how to win. There is no animation, no opponent presence,
no way to play without a second human online, and the swap/fracture actions have
**no UI at all**. Owner directive: *teach users how to win*, make it *lively and
interactive like real-world games*, *push it further*, free-play flagship — and do
not dim the ambition.

## 2. Goals

1. **Teach** — a smart, contextual coach that explains the goal, the rules, and
   *how to win* (strategy), for both games, without a wall of text.
2. **Liveliness** — rebuild both boards into animated, responsive, real-game
   surfaces (true hexagons, stone-drop, glowing goal edges, turn states, win
   animation, prize-reveal) — fully reduced-motion-aware.
3. **Play now** — an on-device AI so a solo user can play and learn immediately,
   available even while live multiplayer stays flag-dark.

Scope: **both games** (Onyx Lines + Onyx Cards). Coach + Practice ship **live**
(no flag, no DB); live multiplayer stays gated by `isGamingArenaReady()`.

## 3. Non-goals (out of scope this pass)

- No money / stake / escrow (separate legally-gated pass).
- No DB schema change, no migration, no new RPC. Practice is 100% client-side.
- No change to the server-authoritative live-match path (`apply_gaming_move` etc.)
  beyond reusing the rebuilt board components.
- Onyx Quiz (Pass 2 title) — not built.

## 4. Three pillars

### Pillar 1 — The Coach (teach the goal + how to win)

- **Goal strip** (always on, both games): one-line, player-specific objective with
  the player's goal made *visible* on the board (Onyx Lines: the two owned edges
  glow; Onyx Cards: "win the most prize value over 10 rounds").
- **Replayable interactive tutorial** — a stepped coach panel that highlights live
  board elements as it explains. Onyx Lines steps: (1) you are Onyx, connect
  top↔bottom → (2) stones link by hex adjacency (pulse the 6 neighbours) → (3) the
  "exactly one of you connects" Hex insight → (4) **bridges** = the core safe-link
  pattern (shown on board) → (5) the twists: vein blockers, swap (pie rule),
  fracture → (6) how-to-win: every move both extends you and blocks them, center
  control, bridge ladders. Onyx Cards steps: identical hands → public prize order →
  effective value wins → facet bonus → vein carry → shadow bid → how-to-win:
  spend high on high prizes, dump low cards on low prizes, hold shadow for a swing.
- **Contextual in-play hints** (driven by pure logic, see §5): swap becomes legal →
  explain; a fracture would break an opponent threat → suggest; **opponent is one
  move from connecting → "⚠ block {cell}"**; Onyx Cards → "this prize is worth
  {n} with carry — bid accordingly."

### Pillar 2 — Living boards (lively, real-game feel)

**Onyx Lines** — rebuild `OnyxLinesBoard` from square buttons into true hexagons
(CSS `clip-path` hex cells on a proper rhombic offset grid):

- Colored **edge rails**: the player's two goal edges glow in their stone color.
- **Stone placement** animation (scale-in + settle) with a gold sheen on the last move.
- **Hover ghost-stone** in the player's color on empty cells, only on their turn.
- **Turn state**: my turn → board "awake" (subtle lift + edge pulse); opponent turn
  → calm "thinking", with live opponent presence (live match) / AI label (practice).
- **Largest-chain highlight** while building; **animated winning path** edge-to-edge
  on victory + a brief victory moment.
- **Swap & Fracture action bar** (new): buttons enabled only when the move is legal
  (`placements===1 && !swapped` for swap; `!fractureUsed[seat] && allowFracture` for
  fracture, with a fracture-target picking mode), each with a one-line explanation.

**Onyx Cards** — rebuild `OnyxCardsTable`:

- **Prize track** with facet colors, current-prize spotlight, carry badge, and a
  **round-resolution reveal** animation (both cards flip, winner highlighted, score ticks).
- **Hand** as real cards with hover/lift, facet pips, a clear **commit** affordance,
  and a distinct **shadow-bid** toggle with its "double, revealed only on a loss" note.
- **History rail** of resolved rounds (your card vs theirs, who won, facet bonus).

All animation via CSS keyframes in `apps/account/app/globals.css`, gated behind
`@media (prefers-reduced-motion: no-preference)`; the static layout is always correct.

### Pillar 3 — Practice vs the Onyx AI (play + learn now)

- **Client-only** match driver (`PracticeClient`) using the pure exported rules
  (`validateMove`/`applyMove`/`resolveOutcome`/`initialState`) — no server, no DB,
  no network. Renders through the **same rebuilt board components** as live play by
  synthesizing a local `MatchView` (human = seat 0, AI = seat 1).
- **On-device AI** (pure, in `@henryco/gaming-arena`, client-safe `.` entry):
  - *Onyx Lines:* connection heuristic. Compute each seat's **completion distance**
    (Dijkstra: own=0, empty=1, opp/blocker=∞, hex adjacency). Choose the move that
    most improves `(oppDistance − myDistance)`; bridge-template aware; uses
    fracture/swap when it meaningfully shifts the distance. Deterministic.
  - *Onyx Cards:* value-matching heuristic over the public prize track + known
    remaining hands; limited-depth bid search; holds shadow for a high-swing prize.
  - **3 difficulties** (Gentle / Even / Sharp) = search depth + greediness knobs.
  - **Narration**: the AI surfaces its current threat/intent ("I'm building toward
    the right edge — cut me at C5"), which doubles as live teaching.

## 5. Architecture

### New pure modules — `packages/gaming-arena/src` (client-safe `.` entry, NOT `./server`)

- `ai/onyx-lines-ai.ts` — `chooseLinesMove(state, seat, difficulty): GameMove`
  + `completionDistance(board, seat): number` (also reused by hints).
- `ai/onyx-cards-ai.ts` — `chooseCardsCommit(state, seat, difficulty): GameMove`.
- `ai/threats.ts` — `detectLinesThreat(state, seat)` (opponent-connects-in-1, etc.),
  `cardsHint(state, seat)`. Pure; powers the contextual coach hints.
- `ai/index.ts` barrel; re-export from `src/index.ts`. `Difficulty = "gentle"|"even"|"sharp"`.
- These are PURE and deterministic for Onyx Lines (no RNG) — straightforward TDD.

### App surface — `apps/account/app/(account)/play`

- `_components/OnyxLinesBoard.tsx` — rebuilt (hexagons, edges, animations, swap/fracture bar).
- `_components/OnyxCardsTable.tsx` — rebuilt (prize reveal, hand, shadow, history).
- `_components/Coach.tsx` — stepped tutorial + contextual hints (per game), board-highlight aware.
- `_components/GoalStrip.tsx` — always-on goal banner.
- `_components/PracticeClient.tsx` — client-only driver (local state + AI loop), reuses the boards.
- `practice/page.tsx` — practice surface (game + difficulty pick → PracticeClient). Available
  regardless of the arena flag (gated only by auth, like the rest of the account app).
- `page.tsx` — when `!isGamingArenaReady()`, replace the dead "No live matches yet"
  card with a **Learn & Practice** entry (Coach + Practice CTAs + "live matches soon");
  when ready, show lobby + Learn + Practice.
- Board prop contract is unchanged (`view`, `copy`, `onMove`, `busy`) so live `MatchClient`
  and `PracticeClient` share the components; `PracticeClient` synthesizes the `MatchView`.

### i18n — `packages/i18n` arena copy

Extend `ArenaCopy` with `coach`, `practice`, `rules`, `hints` sections (both games),
added to **all 12 locales** (`i18n:check:strict` gates). English authored in full;
other locales translated where natural, English-fallback where not, following the
existing arena-copy pattern. No hardcoded display strings in components.

## 6. Data flow (practice)

- **Onyx Lines:** user clicks cell → `onMove({type:'place',cell})` → validate (pure)
  → apply (pure) → setState → if `toMove === aiSeat` & active → `chooseLinesMove` →
  validate → apply → setState. Swap/fracture flow identically.
- **Onyx Cards:** user commits → AI commits (`chooseCardsCommit` on pre-commit state)
  → apply both (order-independent) → round resolves inside the 2nd apply → animate reveal.
- All synchronous, deterministic, in-memory. No `Date.now`/`Math.random` in rules.

## 7. Testing & verification

- **TDD** the AI + threats in `packages/gaming-arena` (node:test): takes an immediate
  win, blocks an immediate loss, never returns an illegal move, respects difficulty
  monotonicity, hint detects opponent-connects-in-1. Deterministic for Onyx Lines.
- Component sanity: boards render for a synthesized practice view; reduced-motion path correct.
- Gates: `pnpm --filter @henryco/gaming-arena test`, `lint`, `typecheck`,
  `i18n:check:strict`, and `pnpm --filter @henryco/account build` (serial on Windows).
- Adversarial self-review pass on the AI (does it ever cheat / desync from server rules?
  it must use the *same* pure rules, so a practice game is replay-identical).

## 8. Risks / mitigations

- **i18n volume (12 locales):** large copy surface. Mitigate: structured English
  authored once; locale fallback pattern; keep coach copy concise.
- **Hex AI quality:** a weak bot teaches bad habits. Mitigate: distance-heuristic is a
  known-good Hex baseline; "Sharp" adds bridge templates; ship with tests asserting it
  never misses a 1-move win/block.
- **Board rebuild regressions on the live path:** unchanged prop contract; live match
  path untouched server-side; verify live + practice render from the same components.
- **Windows build thrash:** build the account app serially, in this clean-named worktree.

## 9. Out of scope / follow-ups

- Onyx Quiz; ranked ladders; spectator mode.
- Flipping `GAMING_ARENA_ENABLED` for live multiplayer (owner-gated, separate).

## 10. Addendum — "World-class" elevation (owner directive, 2026-06-22, in progress)

After the first slice shipped to PR #330, the owner directed a deeper pass to make the
EXISTING free game (Onyx Lines) world-class — NOT to add games. The other catalog games
are a separate later pass. Legal gate for the free game is cleared (free-play only here).
Driven by the research workflow `onyx-lines-worldclass-research`; built test-first, then
adversarially verified. Requirements (nothing left shallow):

1. **AI overhaul (top priority).** Replace the 1-ply greedy bot with a genuinely strong,
   forward-looking engine: resistance / two-distance evaluation + virtual-connection (bridge)
   awareness + pruned alpha-beta (or MCTS) search. It MUST carry **multiple strategies/personas**
   and **vary its play across games** (seeded softmax sampling + opening book) so a human cannot
   memorize or predict one line and "cheat" it. Seeded/pure for reproducible tests; fresh crypto
   seed per real game for variety.
2. **Honest difficulty calibration.** "Easy is hard" today — recalibrate tiers so Gentle is
   genuinely beatable by a novice and the top tier is formidable (depth + temperature + blunder
   rate + feature gating per tier, with expected win-rates).
3. **Premium ORIGINAL sound.** Bespoke Web Audio synthesis (no samples, no imitation) — a signature
   Henry Onyx sonic identity with distinct place / win / loss / threat / UI cues; mute + volume
   persisted; user-gesture init; reduced-motion/quiet-by-default respected.
4. **Premium ORIGINAL result moment.** On a decided game, a crafted result presentation built from
   scratch: the winning connection path animates edge-to-edge, an original animated result
   toast/banner (win / loss / tie) with the win sound and rematch + "review the game" actions.
   Accessible (ARIA live, focus management) and reduced-motion-aware. NOT a generic/library toast.
5. **Depth / value features.** On-demand hint (best move + one-line why), undo/takeback in practice,
   move history + post-game analysis (winning path + turning-point), choose-your-side (experience
   the swap/pie rule), local records/streaks per tier, colorblind-safe colors + keyboard play.

All additive, free-play, client-side: still ZERO money, ZERO migration, ZERO new DB objects.
Lands as further commits on `v3/gaming-02-arena-learn-to-win` → updates PR #330 → same preview.
