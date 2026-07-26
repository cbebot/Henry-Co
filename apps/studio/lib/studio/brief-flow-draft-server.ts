import "server-only";

/**
 * SA-1 — server persistence for the brief flow. Two concerns, one idiom:
 *
 *   1. `studio_brief_flow_drafts` — the resumable draft envelope, upserted
 *      as the person fills the brief (abandoned-brief recovery).
 *   2. `studio_brief_conversations(+_messages)` — durable, PII-redacted
 *      coach transcripts (the intelligence_conversations idiom).
 *
 * Everything here is BEST-EFFORT and never throws (the persist.ts
 * contract): the person's draft already lives in their browser and the
 * coach reply already rendered — saving a server copy is a side effect and
 * must never take the flow down with it. Every write re-checks ownership
 * (user match, or anonymous + session match) and otherwise starts a fresh
 * row: never write across identities.
 */

import { getOrCreateCopilotSessionId } from "@/lib/studio/copilot-session";
import { redactChatText } from "@/lib/studio/brief-chat";
import {
  briefFlowDraftHasSubstance,
  canReuseBriefFlowRow,
  sanitizeBriefFlowDraft,
  STUDIO_BRIEF_DRAFT_VERSION,
  type BriefFlowDraftSource,
} from "@/lib/studio/brief-flow-draft";
import type { StudioBriefDraft } from "@/lib/studio/request-fields";
import { createAdminSupabase, hasAdminSupabaseEnv, hasPublicSupabaseEnv } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";

type FlowIdentity = { sessionId: string; userId: string | null };

async function resolveIdentity(): Promise<FlowIdentity | null> {
  try {
    const sessionId = await getOrCreateCopilotSessionId();
    let userId: string | null = null;
    if (hasPublicSupabaseEnv()) {
      try {
        const supabase = await createSupabaseServer();
        const auth = await supabase.auth.getUser();
        userId = auth.data.user?.id ?? null;
      } catch {
        userId = null;
      }
    }
    return { sessionId, userId };
  } catch {
    return null;
  }
}

const FLOW_DRAFT_TABLE = "studio_brief_flow_drafts";
const CONVERSATION_TABLE = "studio_brief_conversations";
const MESSAGE_TABLE = "studio_brief_conversation_messages";

/**
 * Upsert the caller's ACTIVE draft row (one per session). Select-then-write
 * instead of ON CONFLICT because the uniqueness lives on a partial index
 * (status='active'), which PostgREST upsert cannot target.
 */
export async function saveStudioBriefFlowDraft(input: {
  draft: StudioBriefDraft;
  source: BriefFlowDraftSource;
}): Promise<boolean> {
  try {
    if (!hasAdminSupabaseEnv()) return false;
    if (!briefFlowDraftHasSubstance(input.draft)) return false;
    const identity = await resolveIdentity();
    if (!identity) return false;

    const admin = createAdminSupabase();
    const { data: existing } = await admin
      .from(FLOW_DRAFT_TABLE)
      .select("id, session_id, user_id")
      .eq("session_id", identity.sessionId)
      .eq("status", "active")
      .maybeSingle();

    const now = new Date().toISOString();
    if (existing && canReuseBriefFlowRow(existing, identity)) {
      const { error } = await admin
        .from(FLOW_DRAFT_TABLE)
        .update({
          draft: input.draft,
          draft_version: STUDIO_BRIEF_DRAFT_VERSION,
          source: input.source,
          user_id: identity.userId,
          updated_at: now,
        } as never)
        .eq("id", existing.id);
      return !error;
    }

    const { error } = await admin.from(FLOW_DRAFT_TABLE).insert({
      session_id: identity.sessionId,
      user_id: identity.userId,
      draft: input.draft,
      draft_version: STUDIO_BRIEF_DRAFT_VERSION,
      source: input.source,
      status: "active",
    } as never);
    return !error;
  } catch {
    return false;
  }
}

export type RecoveredBriefFlowDraft = {
  draft: StudioBriefDraft;
  source: BriefFlowDraftSource;
  updatedAt: string;
};

/**
 * The newest recoverable draft for this person: the signed-in user's rows
 * first (any device), then the anonymous session row (this device's cookie,
 * surviving a cleared localStorage). Local same-device drafts still win in
 * the composer — this is the fallback layer, not the primary store.
 */
export async function loadStudioBriefFlowDraft(): Promise<RecoveredBriefFlowDraft | null> {
  try {
    if (!hasAdminSupabaseEnv()) return null;
    const identity = await resolveIdentity();
    if (!identity) return null;

    const admin = createAdminSupabase();

    const rows: Array<Record<string, unknown>> = [];
    if (identity.userId) {
      const { data } = await admin
        .from(FLOW_DRAFT_TABLE)
        .select("session_id, user_id, draft, draft_version, source, updated_at")
        .eq("user_id", identity.userId)
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(1);
      if (data?.[0]) rows.push(data[0] as Record<string, unknown>);
    }
    if (rows.length === 0) {
      const { data } = await admin
        .from(FLOW_DRAFT_TABLE)
        .select("session_id, user_id, draft, draft_version, source, updated_at")
        .eq("session_id", identity.sessionId)
        .eq("status", "active")
        .maybeSingle();
      if (data) rows.push(data as Record<string, unknown>);
    }

    const row = rows[0];
    if (!row) return null;
    if (
      !canReuseBriefFlowRow(
        { user_id: (row.user_id as string | null) ?? null, session_id: String(row.session_id) },
        identity,
      )
    ) {
      return null;
    }
    if (Number(row.draft_version) !== STUDIO_BRIEF_DRAFT_VERSION) return null;

    const draft = sanitizeBriefFlowDraft(row.draft);
    if (!draft || !briefFlowDraftHasSubstance(draft)) return null;

    const source = String(row.source) as BriefFlowDraftSource;
    return {
      draft,
      source: source === "guided" || source === "copilot" ? source : "composer",
      updatedAt: String(row.updated_at ?? ""),
    };
  } catch {
    return null;
  }
}

/** The brief landed in submitStudioBrief — retire the recovery row so the
 * next visit starts clean instead of resurrecting a submitted brief. */
export async function markStudioBriefFlowDraftSubmitted(): Promise<void> {
  try {
    if (!hasAdminSupabaseEnv()) return;
    const identity = await resolveIdentity();
    if (!identity) return;

    const admin = createAdminSupabase();
    await admin
      .from(FLOW_DRAFT_TABLE)
      .update({ status: "submitted", updated_at: new Date().toISOString() } as never)
      .eq("session_id", identity.sessionId)
      .eq("status", "active");
    if (identity.userId) {
      await admin
        .from(FLOW_DRAFT_TABLE)
        .update({ status: "submitted", updated_at: new Date().toISOString() } as never)
        .eq("user_id", identity.userId)
        .eq("status", "active");
    }
  } catch {
    // best-effort — a stale recovery row is a nuisance, not a failure.
  }
}

/**
 * Persist one coach exchange (user turn + assistant reply), PII-redacted.
 * A client-supplied conversation id is re-fetched and reused ONLY when this
 * identity owns it; anything else silently starts a fresh conversation —
 * the exact IDOR discipline of account's intelligence persist.ts.
 * Returns the server conversation id (for the client to pin) or null.
 */
export async function persistStudioBriefChatTurn(input: {
  conversationId?: string | null;
  userMessage: string;
  assistantReply: string;
}): Promise<string | null> {
  try {
    if (!hasAdminSupabaseEnv()) return null;
    const identity = await resolveIdentity();
    if (!identity) return null;

    const admin = createAdminSupabase();
    const now = new Date().toISOString();

    let conversationId: string | null = null;
    const requestedId = String(input.conversationId ?? "").trim();
    if (requestedId) {
      const { data: row } = await admin
        .from(CONVERSATION_TABLE)
        .select("id, session_id, user_id")
        .eq("id", requestedId)
        .maybeSingle();
      if (
        row &&
        canReuseBriefFlowRow(
          { user_id: (row.user_id as string | null) ?? null, session_id: String(row.session_id) },
          identity,
        )
      ) {
        conversationId = String(row.id);
      }
    }

    const redactedUser = redactChatText(input.userMessage).slice(0, 4000);
    if (!conversationId) {
      const { data: created, error } = await admin
        .from(CONVERSATION_TABLE)
        .insert({
          session_id: identity.sessionId,
          user_id: identity.userId,
          status: "active",
          title: redactedUser.slice(0, 120) || null,
        } as never)
        .select("id")
        .maybeSingle();
      if (error || !created) return null;
      conversationId = String((created as Record<string, unknown>).id);
    } else {
      await admin
        .from(CONVERSATION_TABLE)
        .update({ updated_at: now, user_id: identity.userId ?? undefined } as never)
        .eq("id", conversationId);
    }

    const redactedReply = redactChatText(input.assistantReply).slice(0, 4000);
    const rows = [
      redactedUser ? { conversation_id: conversationId, role: "user", content: redactedUser } : null,
      redactedReply
        ? { conversation_id: conversationId, role: "assistant", content: redactedReply }
        : null,
    ].filter(Boolean);
    if (rows.length > 0) {
      await admin.from(MESSAGE_TABLE).insert(rows as never);
    }

    return conversationId;
  } catch {
    return null;
  }
}

/** Finalize handoff — the conversation became a draft brief. Ownership-checked. */
export async function markStudioBriefConversationHandedOff(
  conversationId: string,
): Promise<void> {
  try {
    if (!hasAdminSupabaseEnv()) return;
    const requestedId = String(conversationId ?? "").trim();
    if (!requestedId) return;
    const identity = await resolveIdentity();
    if (!identity) return;

    const admin = createAdminSupabase();
    const { data: row } = await admin
      .from(CONVERSATION_TABLE)
      .select("id, session_id, user_id")
      .eq("id", requestedId)
      .maybeSingle();
    if (
      !row ||
      !canReuseBriefFlowRow(
        { user_id: (row.user_id as string | null) ?? null, session_id: String(row.session_id) },
        identity,
      )
    ) {
      return;
    }

    await admin
      .from(CONVERSATION_TABLE)
      .update({ status: "handed_off", updated_at: new Date().toISOString() } as never)
      .eq("id", requestedId);
  } catch {
    // best-effort.
  }
}
