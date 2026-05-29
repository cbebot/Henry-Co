/**
 * @henryco/dashboard-shell/module-state-contract — V3-08 module-state
 * taxonomy.
 *
 * The "Empty Dashboard Truth" pass (V3-08) requires every dashboard
 * module / KPI tile / home widget to distinguish FIVE states so a
 * zero never lies:
 *
 *   - real      — a live query returned rows; render the data.
 *   - empty_yet — query returned zero rows because the viewer has done
 *                 nothing yet (first-run). Teach the next action.
 *   - empty_none— query returned zero rows for valid filters (the
 *                 viewer HAS history but nothing matches the current
 *                 lens / scope). Distinct copy from `empty_yet`.
 *   - loading   — query is in-flight. The shell wraps render() in a
 *                 Suspense boundary; this state is for components that
 *                 own their own fetch lifecycle.
 *   - error     — query failed. Render a retry affordance, never a
 *                 fabricated zero.
 *
 * The existing `HomeWidget` contract (`./home-widget`) already carries
 * optional `empty` / `loading` / `error` slots. This module formalises
 * the DISTINCTION between the two empty flavours (`empty_yet` vs
 * `empty_none`) — the gap the audit (§3.9) called out — and gives
 * callers a single helper to derive the state from a query result so
 * the "no data yet" vs "we haven't loaded yet" decision is made once,
 * consistently, instead of ad-hoc per widget.
 *
 * This file ships TYPES + PURE HELPERS only. No React, no I/O. The
 * copy that renders each state still flows through `@henryco/i18n`
 * at the call site (zero hardcoded strings here).
 */

/**
 * The canonical state a module/tile/widget can be in. Ordered by
 * "render priority" — `error` and `loading` take precedence over the
 * data/empty distinction because they describe the FETCH, not the
 * result.
 */
export type ModuleDataState =
  | "real"
  | "empty_yet"
  | "empty_none"
  | "loading"
  | "error";

/**
 * The source classification of a module's data — surfaced in
 * telemetry (`henry.dashboard.module.rendered.source`) so the owner
 * workspace can tell a "live query returned nothing" tile from a
 * "derived/computed" tile from a "static entry-point" tile.
 *
 *   - live      — a real query against a user-scoped table.
 *   - derived   — computed from other live data (no own query).
 *   - aggregate — cross-division rollup (e.g. signal feed score).
 *   - static    — an entry-point card with no per-viewer data (e.g. a
 *                 "browse" prompt). MUST NOT render fake trends/counts.
 */
export type ModuleDataSource = "live" | "derived" | "aggregate" | "static";

/**
 * Inputs the state resolver needs. Kept deliberately small: whether
 * the fetch is still running, whether it failed, how many rows came
 * back, and whether the viewer has ANY history in this surface (the
 * single bit that separates `empty_yet` from `empty_none`).
 */
export type ModuleStateInput = {
  /** True while the underlying query is in-flight. */
  loading?: boolean;
  /** Set when the query failed (any thrown/rejected reason). */
  error?: unknown;
  /**
   * Row count the query returned for the CURRENT lens/filter. Zero is
   * a valid, truthful value — it just routes to one of the two empty
   * states rather than `real`.
   */
  rowCount: number;
  /**
   * Has the viewer ever produced data in this surface (ignoring the
   * current filter)? When `false`, zero rows means `empty_yet`
   * (first-run). When `true`, zero rows means `empty_none` (history
   * exists, nothing matches this lens). When omitted, we conservatively
   * treat zero as `empty_yet` — first-run copy is the safer default
   * (it never implies the viewer "lost" data).
   */
  hasEverHadData?: boolean;
};

/**
 * Resolve the canonical state from a query result. Pure + total —
 * every input maps to exactly one state. Call this once per
 * module/tile/widget so the "which empty?" decision is centralised.
 *
 * Precedence: error > loading > (rowCount > 0 ? real : empty flavour).
 */
export function resolveModuleState(input: ModuleStateInput): ModuleDataState {
  if (input.error !== undefined && input.error !== null) return "error";
  if (input.loading) return "loading";
  if (input.rowCount > 0) return "real";
  // Zero rows + not loading + no error → an empty flavour. The
  // `hasEverHadData` bit decides which. Undefined → first-run default.
  return input.hasEverHadData ? "empty_none" : "empty_yet";
}

/**
 * Convenience predicate: is this state one of the two "no rows"
 * flavours? Used by the hidden-when-empty pattern (V3-08 S8) — a
 * module that has no value when empty can collapse on either empty
 * flavour, while still rendering `real` / `loading` / `error`.
 */
export function isEmptyState(state: ModuleDataState): boolean {
  return state === "empty_yet" || state === "empty_none";
}

/**
 * Render-decision the hidden-when-empty pattern produces. A module
 * declares its `emptyBehaviour`; the shell maps the resolved state +
 * the "show all modules" toggle into one of these.
 *
 *   - render        — render the module's real/loading/error/empty UI.
 *   - collapse      — omit the module entirely (truly-empty + the
 *                     module opted into hide-when-empty + the viewer
 *                     has NOT toggled "show all").
 */
export type ModuleRenderDecision = "render" | "collapse";

/**
 * How a module behaves when it resolves to an empty state.
 *
 *   - teach   — always render; show first-run / none-for-you teaching
 *               copy (the default — most modules teach on empty).
 *   - hide    — collapse when truly empty UNLESS the viewer asked to
 *               see everything ("Show all modules" toggle, V3-08 S8).
 */
export type ModuleEmptyBehaviour = "teach" | "hide";

/**
 * Decide whether to render or collapse a module given its resolved
 * state, its declared empty behaviour, and whether the viewer has the
 * "show all modules" toggle on. Pure.
 *
 * Only `hide` modules in an empty state with the toggle OFF collapse.
 * Everything else renders — including errors and loading, which must
 * never be hidden (the owner needs to see a sick module).
 */
export function decideModuleRender(params: {
  state: ModuleDataState;
  emptyBehaviour: ModuleEmptyBehaviour;
  showAllModules: boolean;
}): ModuleRenderDecision {
  const { state, emptyBehaviour, showAllModules } = params;
  if (emptyBehaviour === "hide" && isEmptyState(state) && !showAllModules) {
    return "collapse";
  }
  return "render";
}

/**
 * The telemetry-friendly string form of a state — matches the
 * `state` payload field on `henry.dashboard.module.rendered`. Kept as
 * a const map (not just the union) so the owner-workspace
 * module-health tile can label each state without re-deriving copy.
 */
export const MODULE_STATE_TELEMETRY: Record<ModuleDataState, string> = {
  real: "real",
  empty_yet: "empty_yet",
  empty_none: "empty_none",
  loading: "loading",
  error: "error",
} as const;
