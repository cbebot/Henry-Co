import type { ModuleSlug } from "@henryco/dashboard-shell";
import type { SignalFeedItem } from "@henryco/data";
import type { LifecycleSnapshot } from "@henryco/lifecycle";
import type { AnnotatedHomeWidget } from "@/lib/smart-home/widgets";

/**
 * V3-34 — turn the viewer's own signal feed + lifecycle into the pure inputs
 * `computeHomeLayout` consumes. All functions here are pure and viewer-local:
 * they only ever read the CURRENT viewer's own signals (already RLS-scoped by
 * get_signal_feed) and never cross to another user (Prime Directive 10).
 *
 * Re-grounding note (anchor delta): the V3-34 prompt says "group signal items
 * by `source`", but `SignalFeedItem.source` is a free-string table label
 * (customer_activity / customer_notifications) — NOT a ModuleSlug. We map on
 * `division` (the real module axis) with `source` as a fallback, coercing each
 * to a canonical ModuleSlug and keeping only slugs the viewer is entitled to.
 */

// division / source labels that don't equal their ModuleSlug 1:1.
const DIVISION_SLUG_ALIASES: Record<string, ModuleSlug> = {
  account: "customer-overview",
  overview: "customer-overview",
  hub: "customer-overview",
  security: "settings",
  identity: "settings",
  verification: "settings",
  kyc: "settings",
  trust: "settings",
  payments: "wallet",
  payment: "wallet",
  finance: "wallet",
  billing: "wallet",
};

/**
 * Coerce a free-string division/source/pillar label to a canonical ModuleSlug,
 * keeping only slugs present in `known` (the viewer's entitled module set).
 * Unknown labels return null and are dropped — never guessed.
 */
export function coerceModuleSlug(
  label: string | null | undefined,
  known: ReadonlySet<ModuleSlug>,
): ModuleSlug | null {
  if (!label) return null;
  const norm = label.trim().toLowerCase();
  if (!norm) return null;
  const candidate = (DIVISION_SLUG_ALIASES[norm] ?? norm) as ModuleSlug;
  return known.has(candidate) ? candidate : null;
}

/**
 * Per-module relevance score = max signal score across that module's signals.
 * Empty when the caller withholds signals (consent off) → the projection's tail
 * falls back to defaultWeight only. Scores are opaque; never serialized.
 */
export function deriveSignalScores(
  items: ReadonlyArray<SignalFeedItem>,
  known: ReadonlySet<ModuleSlug>,
): Map<ModuleSlug, number> {
  const scores = new Map<ModuleSlug, number>();
  for (const item of items) {
    const slug =
      coerceModuleSlug(item.division, known) ??
      coerceModuleSlug(item.source, known);
    if (!slug) continue;
    const prev = scores.get(slug) ?? 0;
    if (item.score > prev) scores.set(slug, item.score);
  }
  return scores;
}

/**
 * Modules that currently hold an open blocker — force-shown, never hideable.
 * Best-effort (a UX safety rail, not a security control): security/urgent
 * signals by division + critical lifecycle actionables by pillar. A missed
 * mapping only means the user MAY hide that module; V3-36 refines the mapping.
 */
export function deriveBlockedModules(
  signals: ReadonlyArray<SignalFeedItem>,
  lifecycle: LifecycleSnapshot | null,
  known: ReadonlySet<ModuleSlug>,
): Set<ModuleSlug> {
  const blocked = new Set<ModuleSlug>();
  for (const s of signals) {
    if (s.priority !== "security" && s.priority !== "urgent") continue;
    const slug = coerceModuleSlug(s.division, known);
    if (slug) blocked.add(slug);
  }
  for (const a of lifecycle?.actionables ?? []) {
    if (a.priority !== "critical") continue;
    const slug = coerceModuleSlug(a.pillar, known);
    if (slug) blocked.add(slug);
  }
  return blocked;
}

/**
 * Per-module default weight = the highest HomeWidget.weight the module emits.
 * This is the module-level projection of the existing per-widget DASH weight —
 * the final tiebreaker in the deterministic floor.
 */
export function deriveModuleDefaultWeights(
  widgets: ReadonlyArray<AnnotatedHomeWidget>,
): Map<ModuleSlug, number> {
  const weights = new Map<ModuleSlug, number>();
  for (const w of widgets) {
    const slug = w.module.slug;
    const prev = weights.get(slug) ?? 0;
    if (w.weight > prev) weights.set(slug, w.weight);
  }
  return weights;
}
