"use server";

import type { TypedSupabaseClient } from "@henryco/data";
import { henryDivisionSchema } from "@henryco/intelligence";
import { emitEvent, logger, persistEvent } from "@henryco/observability";
import { requireAccountUser } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { nextActionEnabled } from "./flag";

/**
 * V3-39 — server actions for the next-action chip (dismiss + click telemetry).
 *
 * Both actions are flag-gated, auth-derived (the viewer comes from the server
 * session, NEVER from the payload), and strictly validated — a client-supplied
 * id only ever selects the viewer's OWN row (the dismissal upsert writes
 * user_id = session user; next_action_dismissals RLS WITH CHECK is the tenant
 * boundary and service_role has NO grant on the table at all).
 *
 * Best-effort semantics: the chip hides optimistically client-side; a failed
 * persist here means the dismissal resurfaces next render — never an error
 * surface, never a thrown 500.
 */

const CONTEXT_KINDS = new Set([
  "account_home",
  "marketplace_listing",
  "care_service",
  "jobs_detail",
  "studio_brief",
  "learn_course",
  "property_listing",
  "logistics_booking",
]);

const ACTION_ID_PATTERN = /^[a-z0-9][a-z0-9_.:-]{0,127}$/i;

const actionLogger = logger.child({ namespace: "next_action.actions" });

// NOTE: no `export type` here — a type export from a "use server" module
// breaks Turbopack (V3-CHAT-THREAD lesson). The result alias stays private.
type NextActionActionResult = { ok: boolean };

export async function dismissNextActionAction(input: {
  contextKind: string;
  actionId: string;
}): Promise<NextActionActionResult> {
  if (!nextActionEnabled()) return { ok: false };
  const user = await requireAccountUser();

  const contextKind = typeof input?.contextKind === "string" ? input.contextKind : "";
  const actionId = typeof input?.actionId === "string" ? input.actionId : "";
  if (!CONTEXT_KINDS.has(contextKind) || !ACTION_ID_PATTERN.test(actionId)) {
    return { ok: false };
  }

  try {
    // The AUTHENTICATED client: RLS (auth.uid() = user_id) is the boundary —
    // the migration deliberately gives service_role no path to this table.
    const client = (await createSupabaseServer()) as unknown as TypedSupabaseClient;
    const { error } = await client.from("next_action_dismissals").upsert(
      {
        user_id: user.id,
        context_kind: contextKind,
        action_id: actionId,
        dismissed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,context_kind,action_id" },
    );
    if (error) {
      actionLogger.warn("dismiss_persist_failed", { viewerId: user.id, code: error.code });
      return { ok: false };
    }

    const payload = {
      surface: "account" as const,
      context_kind: contextKind,
      action_id: actionId,
      placement: "floating_chip" as const,
      sensitive: false,
      outcome: "removed" as const,
    };
    emitEvent({
      name: "henry.next_action.dismissed",
      classification: "user_action",
      outcome: "removed",
      actorId: user.id,
      payload,
      logger: actionLogger,
    });
    void persistEvent({
      supabase: createAdminSupabase(),
      name: "henry.next_action.dismissed",
      actorId: user.id,
      payload,
    });
    return { ok: true };
  } catch (e) {
    actionLogger.warn("dismiss_failed", {
      viewerId: user.id,
      error: e instanceof Error ? e.message : String(e),
    });
    return { ok: false };
  }
}

export async function recordNextActionClickAction(input: {
  contextKind: string;
  actionId: string;
  division: string;
  stitched: boolean;
}): Promise<NextActionActionResult> {
  if (!nextActionEnabled()) return { ok: false };
  const user = await requireAccountUser();

  const contextKind = typeof input?.contextKind === "string" ? input.contextKind : "";
  const actionId = typeof input?.actionId === "string" ? input.actionId : "";
  const division = henryDivisionSchema.safeParse(input?.division);
  if (!CONTEXT_KINDS.has(contextKind) || !ACTION_ID_PATTERN.test(actionId) || !division.success) {
    return { ok: false };
  }

  try {
    const payload = {
      surface: "account" as const,
      context_kind: contextKind,
      division: division.data,
      action_id: actionId,
      placement: "floating_chip" as const,
      sensitive: false,
      stitched: input?.stitched === true,
      outcome: "completed" as const,
    };
    emitEvent({
      name: "henry.next_action.clicked",
      classification: "user_action",
      outcome: "completed",
      actorId: user.id,
      payload,
      logger: actionLogger,
    });
    void persistEvent({
      supabase: createAdminSupabase(),
      name: "henry.next_action.clicked",
      actorId: user.id,
      payload,
    });
    return { ok: true };
  } catch (e) {
    actionLogger.warn("click_record_failed", {
      viewerId: user.id,
      error: e instanceof Error ? e.message : String(e),
    });
    return { ok: false };
  }
}
