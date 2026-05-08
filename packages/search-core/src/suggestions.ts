/**
 * Suggestions — server-side ranker that produces ordered "what should
 * the user open next" rows for the empty-query state of the Cmd+K
 * palette.
 *
 * The signal sources, in order of priority:
 *
 *   1. Lifecycle actionables (`customer_lifecycle_snapshots.snapshot.actionables`)
 *      — the user's outstanding cross-pillar work, already ranked by
 *      the lifecycle ranker. These are the strongest signal because
 *      lifecycle blockers (verification pending, awaiting payment,
 *      etc.) are usually the highest-value action a user can take.
 *
 *   2. Recent customer notifications — the most recent un-read
 *      notifications give the user a quick way to jump back into
 *      whatever produced them.
 *
 * Both sources are RLS-keyed on `user_id = auth.uid()` per the
 * existing migrations.
 *
 * Anti-pattern #11 enforcement: this is a NEW read-only function;
 * no state-changing routes are introduced. The function takes an
 * authenticated Supabase client (the user's own session client, NOT
 * the service role) so RLS applies naturally.
 *
 * Cache discipline: callers MUST set `Cache-Control: private,
 * max-age=0, must-revalidate`. Suggestions are personal and stale
 * very quickly; we never share a response across users.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  LifecycleActionable,
  LifecyclePriority,
  LifecycleSnapshot,
} from "@henryco/lifecycle";
import { LIFECYCLE_PRIORITY_WEIGHT, LIFECYCLE_SNAPSHOT_TABLE } from "@henryco/lifecycle";

/**
 * The suggestion shape the palette consumes. We deliberately keep this
 * narrower than `UnifiedSearchResult` — suggestions are a different
 * surface (empty-state of the palette, not a search result list) and
 * compressing them into the larger shape would invite consumers to
 * confuse the two.
 */
export interface PaletteSuggestion {
  id: string;
  /** "Continue", "Resume", "Open" — verb-first label. */
  label: string;
  /** Optional kicker (pillar / division). */
  kicker: string | null;
  /** Optional one-line context. */
  detail: string | null;
  /** Destination URL — every suggestion is a navigable target. */
  href: string;
  /** Source: "lifecycle" | "notification". */
  source: "lifecycle" | "notification";
  /** Priority — drives the order. */
  priority: LifecyclePriority;
  /** Composite ranking score (higher = surfaced higher). */
  score: number;
}

export interface SuggestionsWirePayload {
  ok: true;
  generatedAt: number;
  suggestions: PaletteSuggestion[];
}

export interface BuildSuggestionsOptions {
  /** Authenticated Supabase client for the requesting user. */
  supabase: SupabaseClient;
  /** Resolved user_id — typed in to avoid an extra getUser() round-trip. */
  user_id: string;
  /** Ceiling on returned suggestions. Default 8. */
  limit?: number;
  /** Override "now" for deterministic testing. */
  now?: () => Date;
}

const DEFAULT_LIMIT = 8;

/**
 * Read the user's lifecycle snapshot + recent notifications and build a
 * ranked suggestion list.
 *
 * Returns an empty list (NOT an error) when:
 *   - The snapshot row does not exist yet.
 *   - The user has no recent notifications.
 *   - Both queries fail in a non-recoverable way; we log + return empty.
 */
export async function buildPaletteSuggestions(
  options: BuildSuggestionsOptions,
): Promise<PaletteSuggestion[]> {
  const { supabase, user_id, limit = DEFAULT_LIMIT } = options;
  const now = options.now ?? (() => new Date());

  const [lifecycle, notifications] = await Promise.all([
    fetchLifecycleSuggestions(supabase, user_id),
    fetchNotificationSuggestions(supabase, user_id, now()),
  ]);

  const all = [...lifecycle, ...notifications];

  // Dedup by destination URL — a single backing item should never
  // surface twice. Keep the higher-scored entry.
  const byHref = new Map<string, PaletteSuggestion>();
  for (const s of all) {
    const existing = byHref.get(s.href);
    if (!existing || s.score > existing.score) byHref.set(s.href, s);
  }

  return Array.from(byHref.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(0, limit));
}

async function fetchLifecycleSuggestions(
  supabase: SupabaseClient,
  user_id: string,
): Promise<PaletteSuggestion[]> {
  try {
    const { data, error } = await supabase
      .from(LIFECYCLE_SNAPSHOT_TABLE)
      .select("snapshot")
      .eq("user_id", user_id)
      .maybeSingle();
    if (error || !data) return [];

    const snapshot = (data as { snapshot: LifecycleSnapshot | null }).snapshot;
    const actionables = snapshot?.actionables ?? [];

    return actionables.slice(0, 6).map((a, index) => toLifecycleSuggestion(a, index));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("[search-core/suggestions] lifecycle fetch failed:", error);
    return [];
  }
}

function toLifecycleSuggestion(a: LifecycleActionable, index: number): PaletteSuggestion {
  const priorityWeight = LIFECYCLE_PRIORITY_WEIGHT[a.priority];
  // Lifecycle source carries a +200 bonus so it ranks above any plain
  // notification suggestion. Index decay keeps the existing lifecycle
  // ranking order stable.
  const score = 200 + priorityWeight - index * 4;
  return {
    id: `lifecycle:${a.pillar}:${a.referenceId ?? index}`,
    label: a.actionLabel || a.title,
    kicker: a.title,
    detail: a.detail || a.blockerReason,
    href: a.actionUrl,
    source: "lifecycle",
    priority: a.priority,
    score,
  };
}

async function fetchNotificationSuggestions(
  supabase: SupabaseClient,
  user_id: string,
  now: Date,
): Promise<PaletteSuggestion[]> {
  try {
    const { data, error } = await supabase
      .from("customer_notifications")
      .select(
        "id, title, body, deep_link_url, created_at, urgent, severity, source, category",
      )
      .eq("user_id", user_id)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error || !data) return [];

    return (data as NotificationRow[])
      .filter((row) => Boolean(row.deep_link_url))
      .slice(0, 6)
      .map((row, index) => toNotificationSuggestion(row, index, now));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("[search-core/suggestions] notifications fetch failed:", error);
    return [];
  }
}

interface NotificationRow {
  id: string;
  title: string | null;
  body: string | null;
  deep_link_url: string | null;
  created_at: string;
  urgent: boolean | null;
  severity: string | null;
  source: string | null;
  category: string | null;
}

function toNotificationSuggestion(
  row: NotificationRow,
  index: number,
  now: Date,
): PaletteSuggestion {
  const priority = derivePriority(row);
  const ageMs = Math.max(0, now.getTime() - new Date(row.created_at).getTime());
  // Recency boost — a notification from 1h ago scores higher than one
  // from 1 day ago. 100 + decay over 7 days; floor at 0.
  const recencyHours = ageMs / (1000 * 60 * 60);
  const recencyBoost = Math.max(0, 100 - recencyHours);
  // Notifications source baseline = 100 so lifecycle (200+) ranks higher.
  const priorityBoost = LIFECYCLE_PRIORITY_WEIGHT[priority];
  const score = 100 + recencyBoost + priorityBoost - index * 2;

  return {
    id: `notification:${row.id}`,
    label: row.title?.trim() || "Open notification",
    kicker: row.source ? humanise(row.source) : row.category ? humanise(row.category) : null,
    detail: row.body?.trim() || null,
    href: row.deep_link_url ?? "/notifications",
    source: "notification",
    priority,
    score,
  };
}

function derivePriority(row: NotificationRow): LifecyclePriority {
  if (row.urgent) return "critical";
  switch ((row.severity ?? "").toLowerCase()) {
    case "critical":
    case "urgent":
      return "critical";
    case "warning":
    case "high":
      return "high";
    case "low":
      return "low";
    default:
      return "normal";
  }
}

function humanise(slug: string): string {
  return slug
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function toSuggestionsWire(
  suggestions: PaletteSuggestion[],
): SuggestionsWirePayload {
  return {
    ok: true,
    generatedAt: Date.now(),
    suggestions,
  };
}
