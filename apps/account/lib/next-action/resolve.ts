import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import type { TypedSupabaseClient } from "@henryco/data";
import { getNextActionCopy, type NextActionCopy } from "@henryco/i18n/server";
import {
  pickFloatingChipAction,
  resolveNextAction,
  type NextAction,
  type NextActionDismissalRef,
  type PageContext,
  type PageContextKind,
  type UserContext,
} from "@henryco/intelligence";
import { emitEvent, logger, persistEvent } from "@henryco/observability";
import { getAccountAppLocale } from "@/lib/locale-server";
import { resolvePersonalizationConsentForViewer } from "@/lib/personalization/consent";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { nextActionEnabled } from "./flag";

const nextActionLogger = logger.child({ namespace: "next_action.resolve" });

/**
 * V3-39 — resolve THE floating next-action chip for the account shell.
 *
 * Privacy / degrade posture (E-D2 + PRIVACY-NDPR SS4, PROD-ACTUAL aware):
 *   - The in-product next step runs on LEGITIMATE INTEREST, default ON, with
 *     user control: only a persisted `next_action_prompts_enabled === false`
 *     suppresses; an absent column (migration unapplied on prod), null, or a
 *     read failure degrades to the default (ON) - never a crash.
 *   - The cross-division STITCH is PROFILING: gated on the V3-34
 *     account-authoritative consent helper and FAILS SAFE - unknown / error /
 *     absent all resolve to false, so the same-page floor stands alone.
 *   - Every read is the viewer's own row (admin reads carry an explicit
 *     user_id = viewer predicate; the dismissals read rides the viewer's
 *     AUTHENTICATED client where RLS is the tenant boundary - the migration
 *     grants service_role NOTHING on next_action_dismissals).
 *   - Any unexpected failure returns null (no chip) - the shell never breaks.
 *
 * The resolver ships ONLY the final chip projection to the client; the
 * candidate catalog, scores, and signals never leave the server.
 */
export type ResolvedNextActionChip = {
  action: NextAction;
  labels: NextActionCopy["chip"];
};

/** Mirrors `trustToState` in lib/intelligence-rollout.ts (single vocabulary). */
function trustStateFromVerification(status: unknown): UserContext["trustState"] {
  const normalized = typeof status === "string" ? status.toLowerCase() : "";
  if (normalized === "verified") return "verified";
  if (normalized === "pending") return "pending_review";
  return "needs_action";
}

/**
 * Mirrors `calculateProfileCompletion` in lib/trust.ts (kept in lockstep so
 * the chip's "finish your profile" gate agrees with the trust surface, without
 * paying the full 6-query trust-profile fan-out on every shell render).
 */
function profileCompletionScore(
  profile: Record<string, unknown> | null,
  documentCount: number,
): number {
  if (!profile) return 0;
  const has = (key: string) =>
    typeof profile[key] === "string" && (profile[key] as string).trim().length > 0;
  let score = 0;
  if (has("full_name")) score += 22;
  if (has("phone")) score += 16;
  if (has("avatar_url")) score += 10;
  if (has("language")) score += 8;
  if (has("currency")) score += 8;
  if (documentCount > 0) score += 14;
  if (documentCount >= 3) score += 8;
  return Math.min(score, 100);
}

/** Build the deterministic UserContext from the viewer's OWN rows (cheap). */
async function buildViewerContext(userId: string): Promise<UserContext> {
  const admin = createAdminSupabase();
  const [profileRes, documentsRes, savedJobsRes] = await Promise.all([
    admin
      .from("customer_profiles")
      .select("full_name, phone, avatar_url, language, currency, verification_status")
      .eq("id", userId)
      .maybeSingle(),
    admin
      .from("customer_documents")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", userId),
    admin
      .from("saved_items")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", userId)
      .eq("division", "jobs")
      .eq("status", "active"),
  ]);

  const profile = (profileRes.data ?? null) as Record<string, unknown> | null;
  const documentCount = documentsRes.count ?? 0;
  const savedJobsCount = savedJobsRes.count ?? 0;

  return {
    roleHint: "buyer",
    trustState: trustStateFromVerification(profile?.verification_status),
    profileCompleteness: profileCompletionScore(profile, documentCount) / 100,
    recentDivisions: ["account"],
    savedJobIds: savedJobsCount > 0 ? ["saved-jobs"] : [],
  };
}

/** The viewer's own dismissals via the AUTHENTICATED (RLS) client. Best-effort:
 *  a read failure (table unapplied on prod, transient error) yields none. */
async function readOwnDismissals(
  client: TypedSupabaseClient,
  userId: string,
): Promise<NextActionDismissalRef[]> {
  try {
    const { data, error } = await client
      .from("next_action_dismissals")
      .select("context_kind, action_id")
      .eq("user_id", userId)
      .limit(200);
    if (error || !data) return [];
    return data.map((row) => ({
      contextKind: row.context_kind as PageContextKind,
      actionId: row.action_id,
    }));
  } catch {
    return [];
  }
}

/** Care completion statuses — the `canLeaveReview` set in lib/care-sync.ts. */
const CARE_COMPLETED_STATUSES = new Set([
  "delivered",
  "customer_confirmed",
  "inspection_completed",
  "service_completed",
  "supervisor_signoff",
]);

/**
 * The viewer's OWN just-completed cross-division actions (30-day window) —
 * the S3 stitch sources. Called ONLY with profiling consent (the caller gates
 * on the V3-34 helper before reading). Best-effort: any failure yields [].
 */
async function readRecentCompletedActions(
  userId: string,
): Promise<NonNullable<PageContext["recentCompletedActions"]>> {
  try {
    const admin = createAdminSupabase();
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const [activityRes, ordersRes] = await Promise.all([
      admin
        .from("customer_activity")
        .select("division, activity_type, status, created_at")
        .eq("user_id", userId)
        .in("division", ["care", "learn"])
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(60),
      admin
        .from("marketplace_orders")
        .select("status, placed_at")
        .eq("user_id", userId)
        .eq("status", "delivered")
        .gte("placed_at", since)
        .order("placed_at", { ascending: false })
        .limit(1),
    ]);

    const completed: NonNullable<PageContext["recentCompletedActions"]> = [];
    for (const row of activityRes.data ?? []) {
      const status = typeof row.status === "string" ? row.status.toLowerCase() : "";
      if (
        row.division === "care" &&
        row.activity_type === "care_booking" &&
        CARE_COMPLETED_STATUSES.has(status)
      ) {
        completed.push({ kind: "care_booking", division: "care", at: row.created_at });
      }
      if (row.division === "learn" && row.activity_type === "learn_certificate_issued") {
        completed.push({ kind: "learn_course", division: "learn", at: row.created_at });
      }
    }
    const order = (ordersRes.data ?? [])[0];
    if (order?.placed_at) {
      completed.push({
        kind: "marketplace_purchase",
        division: "marketplace",
        at: order.placed_at,
      });
    }
    return completed;
  } catch {
    return [];
  }
}

export async function resolveAccountNextAction(params: {
  viewer: UnifiedViewer;
  /** The already-fetched customer_preferences row (or null) from the shell. */
  preferences: Record<string, unknown> | null;
}): Promise<ResolvedNextActionChip | null> {
  if (!nextActionEnabled()) return null;
  const userId = params.viewer.user.id;

  try {
    // Only a persisted FALSE suppresses; absent/null/unknown = default ON.
    const rawPref = params.preferences?.next_action_prompts_enabled;
    if (rawPref === false) return null;

    const [locale, client] = await Promise.all([
      getAccountAppLocale(),
      createSupabaseServer() as Promise<unknown> as Promise<TypedSupabaseClient>,
    ]);
    const copy = getNextActionCopy(locale);

    const [ctx, stitchConsent, dismissed] = await Promise.all([
      buildViewerContext(userId),
      // PROFILING consent (V3-34 helper) — FAILS SAFE to false on any error.
      resolvePersonalizationConsentForViewer(client, params.viewer).catch(() => false),
      readOwnDismissals(client, userId),
    ]);

    // The stitch sources are read ONLY under consent (no profiling read at all
    // when the gate is closed — not just an unused result).
    const recentCompletedActions = stitchConsent
      ? await readRecentCompletedActions(userId)
      : [];

    const page: PageContext = {
      kind: "account_home",
      division: "account",
      recentCompletedActions,
    };

    const actions = resolveNextAction(ctx, page, {
      copy: copy.actions,
      promptsEnabled: typeof rawPref === "boolean" ? rawPref : null,
      stitchConsent,
      dismissed,
      // The V3-36 seam: when the cross-division recommendation engine merges,
      // its viewer-scoped, consent-gated set is injected here and the stitch
      // reuses ITS items (one recommendation truth). Absent — V3-36 unmerged /
      // dark — the deterministic stitch catalog stands (never imported).
      providedRecommendations: undefined,
    });

    const chip = pickFloatingChipAction(actions);
    if (!chip) return null;

    // S6 telemetry — ids and enums only, never PII, never a score.
    const payload = {
      surface: "account" as const,
      context_kind: chip.contextKind,
      division: chip.division,
      action_id: chip.id,
      sensitive: chip.sensitive,
      placement: chip.placement,
      stitched: chip.stitched,
      outcome: "completed" as const,
    };
    emitEvent({
      name: "henry.next_action.surfaced",
      classification: "system_state",
      outcome: "completed",
      actorId: userId,
      payload,
      logger: nextActionLogger,
    });
    void persistEvent({
      supabase: createAdminSupabase(),
      name: "henry.next_action.surfaced",
      actorId: userId,
      payload,
    });
    if (chip.stitched) {
      // Distinct stitch event (BUILD-PLAN delta) — cross-division lift is
      // measured against this, not the generic surface event.
      emitEvent({
        name: "henry.next_action.stitched",
        classification: "system_state",
        outcome: "completed",
        actorId: userId,
        payload,
        logger: nextActionLogger,
      });
      void persistEvent({
        supabase: createAdminSupabase(),
        name: "henry.next_action.stitched",
        actorId: userId,
        payload,
      });
    }

    return { action: chip, labels: copy.chip };
  } catch (e) {
    // Best-effort surface: a resolver failure never breaks the account shell.
    nextActionLogger.warn("resolve_next_action_failed", {
      viewerId: userId,
      error: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}
