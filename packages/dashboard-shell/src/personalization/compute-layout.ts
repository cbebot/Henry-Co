import type { ModuleSlug } from "../register";

/**
 * V3-34 — the deterministic home-layout projection.
 *
 * `computeHomeLayout` is the DETERMINISTIC FLOOR of the personalization
 * fabric (Phase E ARCHITECTURE §3). It re-orders the *already registered*
 * modules by the user's explicit preference first, then by the existing
 * `get_signal_feed` relevance score, with a clean fallback to the default
 * DASH ordering for new users. It is a pure function — zero IO, no clock
 * read (the caller injects `now`), no AI — so the Smart Home renders
 * correctly with the AI gateway, the personalization flag, or the network
 * entirely off.
 *
 * ANTI-CLONE Principle 1 holds here: the relevance *score* is an input
 * (server-computed, opaque). This function never serializes it — it emits
 * only the projected order + a localized-later reason code. The user may
 * override ordering (pin/hide/reorder); the user never reads the score.
 */

/** A registered, viewer-entitled module the projection may place. */
export type LayoutModuleInput = {
  slug: ModuleSlug;
  /** The module's static DASH weight (0..100) — the final tiebreaker. */
  defaultWeight: number;
  /**
   * Whether the module currently holds an open blocker for this viewer
   * (unfinished KYC, failed payment, expiring session). Derived by the
   * caller from lifecycle actionables + trust state (ARCHITECTURE §3
   * re-grounding #3) — NOT a stored register field. A blocked module is
   * force-shown and can never be hidden.
   */
  hasOpenBlocker?: boolean;
};

export type HomeLayoutPreference = {
  desktopOrder: ModuleSlug[];
  mobileOrder: ModuleSlug[];
  hidden: ModuleSlug[];
  pinned: ModuleSlug[];
};

export type HomeLayoutInput = {
  /** Only the modules the viewer is entitled to (role-gate filtered). */
  registeredModules: ReadonlyArray<LayoutModuleInput>;
  /**
   * Per-module relevance score derived from `get_signal_feed` items
   * grouped by source → max score. Empty when personalization consent is
   * withheld (the caller drops behavioural signals), so the tail falls
   * back to `defaultWeight` only — first-party config still applies, no
   * behavioural inference. Scores are opaque; never rendered.
   */
  signalScores: ReadonlyMap<ModuleSlug, number>;
  /** `null` = new user, no persisted row yet → pure fallback ordering. */
  preference: HomeLayoutPreference | null;
  device: "mobile" | "desktop";
  /** Injected clock (ISO-8601). Keeps the function pure + testable. */
  now: string;
};

export type LayoutReasonCode =
  | "user_pinned"
  | "user_hidden"
  | "user_ordered"
  | "high_signal_score"
  | "recent_division_use"
  | "open_blocker" // unfinished KYC, payment failure, expiring session
  | "default_order";

export type HomeLayoutEntry = { slug: ModuleSlug; reason: LayoutReasonCode };

export type HomeLayoutResult = {
  ordered: ReadonlyArray<HomeLayoutEntry>;
  hidden: ReadonlyArray<ModuleSlug>;
  computedAt: string;
};

/** Stable de-dup helper preserving first-seen order. */
function pruneToKnown(
  slugs: ReadonlyArray<ModuleSlug> | undefined,
  known: ReadonlySet<ModuleSlug>,
): ModuleSlug[] {
  if (!slugs) return [];
  const seen = new Set<ModuleSlug>();
  const out: ModuleSlug[] = [];
  for (const slug of slugs) {
    if (!known.has(slug) || seen.has(slug)) continue;
    seen.add(slug);
    out.push(slug);
  }
  return out;
}

/**
 * Project the viewer's preference + signal scores onto the registered
 * module set. Precedence (strict):
 *   1. pinned modules first, in the user's pinned order;
 *   2. open-blocker modules next (can never be hidden);
 *   3. remaining modules in the user's explicit device order;
 *   4. anything left by descending signal score, then defaultWeight;
 *   5. hidden modules excluded from `ordered` and returned in `hidden`
 *      (unless they hold an open blocker — a blocker overrides hide).
 */
export function computeHomeLayout(input: HomeLayoutInput): HomeLayoutResult {
  const { registeredModules, signalScores, preference, device, now } = input;

  const known = new Set<ModuleSlug>(registeredModules.map((m) => m.slug));
  const byslug = new Map<ModuleSlug, LayoutModuleInput>(
    registeredModules.map((m) => [m.slug, m]),
  );
  const blocked = new Set<ModuleSlug>(
    registeredModules.filter((m) => m.hasOpenBlocker).map((m) => m.slug),
  );

  const pinned = pruneToKnown(preference?.pinned, known);
  const pinnedSet = new Set<ModuleSlug>(pinned);

  // Hidden = user-hidden ∩ known, MINUS blocked (blocker can't be hidden),
  // MINUS pinned (an explicit pin wins over a stale hide).
  const effectiveHidden = pruneToKnown(preference?.hidden, known).filter(
    (slug) => !blocked.has(slug) && !pinnedSet.has(slug),
  );
  const hiddenSet = new Set<ModuleSlug>(effectiveHidden);

  const deviceOrder = pruneToKnown(
    device === "mobile" ? preference?.mobileOrder : preference?.desktopOrder,
    known,
  );

  const placed = new Set<ModuleSlug>();
  const ordered: HomeLayoutEntry[] = [];
  const place = (slug: ModuleSlug, reason: LayoutReasonCode) => {
    if (placed.has(slug) || hiddenSet.has(slug)) return;
    placed.add(slug);
    ordered.push({ slug, reason });
  };

  // 1. pinned (in user order)
  for (const slug of pinned) place(slug, "user_pinned");

  // 2. open blockers (force-shown, never hidden)
  for (const m of registeredModules) {
    if (m.hasOpenBlocker) place(m.slug, "open_blocker");
  }

  // 3. user's explicit device order
  for (const slug of deviceOrder) place(slug, "user_ordered");

  // 4. the tail — descending signal score, then descending defaultWeight,
  //    then slug for a fully deterministic tiebreak.
  const tail = registeredModules
    .filter((m) => !placed.has(m.slug) && !hiddenSet.has(m.slug))
    .slice()
    .sort((a, b) => {
      const sa = signalScores.get(a.slug) ?? 0;
      const sb = signalScores.get(b.slug) ?? 0;
      if (sb !== sa) return sb - sa;
      if (b.defaultWeight !== a.defaultWeight)
        return b.defaultWeight - a.defaultWeight;
      return a.slug.localeCompare(b.slug);
    });
  for (const m of tail) {
    const score = signalScores.get(m.slug) ?? 0;
    place(m.slug, score > 0 ? "high_signal_score" : "default_order");
  }

  return {
    ordered,
    // Return hidden in a stable order (respect the module registry order).
    hidden: registeredModules
      .map((m) => m.slug)
      .filter((slug) => hiddenSet.has(slug)),
    computedAt: now,
  };
}
