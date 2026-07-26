"use server";

import { buildUnifiedViewer } from "@henryco/auth/server";
import { parseHenryFeatureFlags, isFlagEnabled } from "@henryco/intelligence";
import { getEligibleModules, type ModuleSlug } from "@henryco/dashboard-shell";
import { upsertUserHomeLayout } from "@henryco/data/home-layout";
import { emitEvent, logger, persistEvent } from "@henryco/observability";
import {
  writeAuditLog,
  type AuditLogSupabaseClient,
} from "@henryco/observability/audit-log";
import type { TypedSupabaseClient } from "@henryco/data";
import { requireAccountUser } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { getCachedSignalFeed } from "@/lib/smart-home/signal-feed-cache";
import { deriveBlockedModules } from "@/lib/personalization/signal-scores";

// Side-effect: register modules so getEligibleModules() has the registry.
import "@/app/(account)/_modules";

const actionLogger = logger.child({ namespace: "personalization.customize" });

function personalizationHomeEnabled(): boolean {
  return isFlagEnabled(
    parseHenryFeatureFlags(process.env as Record<string, string | undefined>),
    "personalization_home",
  );
}

export type SaveLayoutInput = {
  // Optional: a device's order is sent only when the user reordered it, so an
  // untouched device keeps its prior column (signal ranking keeps flowing).
  desktopOrder?: string[];
  mobileOrder?: string[];
  hidden: string[];
  pinned: string[];
};

export type LayoutActionResult = { ok: true } | { ok: false; error: "save_failed" };

function sanitizeSlugs(
  input: ReadonlyArray<unknown>,
  known: ReadonlySet<ModuleSlug>,
): ModuleSlug[] {
  const seen = new Set<ModuleSlug>();
  const out: ModuleSlug[] = [];
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const slug = raw as ModuleSlug;
    if (!known.has(slug) || seen.has(slug)) continue;
    seen.add(slug);
    out.push(slug);
  }
  return out;
}

/**
 * Persist the viewer's home layout. Validates every slug against the LIVE
 * register (unknown slugs dropped), enforces blocker-cannot-be-hidden
 * server-side (defense-in-depth; computeHomeLayout also enforces it at render),
 * writes the audit log, and emits S6 telemetry. The RLS WITH CHECK on
 * user_home_layouts is the tenant boundary — a forged user_id can never write
 * another user's row.
 *
 * Auth runs OUTSIDE the try so `requireAccountUser`'s redirect propagates.
 */
export async function saveHomeLayoutAction(
  input: SaveLayoutInput,
): Promise<LayoutActionResult> {
  if (!personalizationHomeEnabled()) return { ok: false, error: "save_failed" };
  const user = await requireAccountUser();
  const viewer = await buildUnifiedViewer({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
  });

  try {
    const known = new Set<ModuleSlug>(
      getEligibleModules(viewer).map((m) => m.slug),
    );

    const desktopOrder =
      input.desktopOrder !== undefined
        ? sanitizeSlugs(input.desktopOrder, known)
        : undefined;
    const mobileOrder =
      input.mobileOrder !== undefined
        ? sanitizeSlugs(input.mobileOrder, known)
        : undefined;
    const pinned = sanitizeSlugs(input.pinned ?? [], known);
    let hidden = sanitizeSlugs(input.hidden ?? [], known);

    // Server-side blocker enforcement: strip any module that currently holds
    // an open blocker (security/urgent signal) from the hidden set — a blocker
    // module can never be hidden. Signal-only (cheap, cached); the lifecycle
    // pass at render adds the rest via computeHomeLayout.
    try {
      const feed = await getCachedSignalFeed(viewer, { limit: 50 });
      const blocked = deriveBlockedModules(feed.items, null, known);
      hidden = hidden.filter((slug) => !blocked.has(slug));
    } catch (e) {
      actionLogger.warn("blocker_check_failed", {
        viewerId: user.id,
        error: e instanceof Error ? e.message : String(e),
      });
    }

    const client = (await createSupabaseServer()) as unknown as TypedSupabaseClient;
    await upsertUserHomeLayout(client, viewer, "account", {
      ...(desktopOrder !== undefined ? { desktopModuleOrder: desktopOrder } : {}),
      ...(mobileOrder !== undefined ? { mobileModuleOrder: mobileOrder } : {}),
      hiddenModules: hidden,
      pinnedModules: pinned,
    });

    void writeAuditLog(client as unknown as AuditLogSupabaseClient, {
      action: "personalization.layout.updated",
      entityType: "user_home_layout",
      entityId: user.id,
      newValues: {
        pinned_count: pinned.length,
        hidden_count: hidden.length,
        desktop_count: desktopOrder?.length ?? null,
        mobile_count: mobileOrder?.length ?? null,
      },
      division: "account",
    });

    const admin = createAdminSupabase();
    if (pinned.length > 0) {
      const payload = { surface: "account" as const, pinned_count: pinned.length, outcome: "saved" as const };
      emitEvent({ name: "henry.personalization.module.pinned", classification: "user_action", outcome: "saved", actorId: user.id, payload });
      void persistEvent({ supabase: admin, name: "henry.personalization.module.pinned", actorId: user.id, payload });
    }
    if (hidden.length > 0) {
      const payload = { surface: "account" as const, hidden_count: hidden.length, outcome: "saved" as const };
      emitEvent({ name: "henry.personalization.module.hidden", classification: "user_action", outcome: "saved", actorId: user.id, payload });
      void persistEvent({ supabase: admin, name: "henry.personalization.module.hidden", actorId: user.id, payload });
    }

    // The home page is force-dynamic and getUserHomeLayout is uncached, so the
    // saved layout applies on the next render without explicit revalidation.
    return { ok: true };
  } catch (e) {
    actionLogger.error("save_layout_failed", {
      viewerId: user.id,
      error: e instanceof Error ? e.message : String(e),
    });
    return { ok: false, error: "save_failed" };
  }
}

/** Reset the layout to the default DASH ordering (clears all overrides). */
export async function resetHomeLayoutAction(): Promise<LayoutActionResult> {
  if (!personalizationHomeEnabled()) return { ok: false, error: "save_failed" };
  const user = await requireAccountUser();
  const viewer = await buildUnifiedViewer({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
  });

  try {
    const client = (await createSupabaseServer()) as unknown as TypedSupabaseClient;
    await upsertUserHomeLayout(client, viewer, "account", {
      desktopModuleOrder: [],
      mobileModuleOrder: [],
      hiddenModules: [],
      pinnedModules: [],
    });

    void writeAuditLog(client as unknown as AuditLogSupabaseClient, {
      action: "personalization.layout.updated",
      entityType: "user_home_layout",
      entityId: user.id,
      newValues: { reset: true },
      division: "account",
    });

    const payload = { surface: "account" as const, outcome: "removed" as const };
    emitEvent({ name: "henry.personalization.layout.reset", classification: "user_action", outcome: "removed", actorId: user.id, payload });
    void persistEvent({ supabase: createAdminSupabase(), name: "henry.personalization.layout.reset", actorId: user.id, payload });

    return { ok: true };
  } catch (e) {
    actionLogger.error("reset_layout_failed", {
      viewerId: user.id,
      error: e instanceof Error ? e.message : String(e),
    });
    return { ok: false, error: "save_failed" };
  }
}
