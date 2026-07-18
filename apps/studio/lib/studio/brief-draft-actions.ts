"use server";

/**
 * SA-1 — client-callable persistence actions for the brief flow. Thin
 * shells over brief-flow-draft-server.ts: sanitize first, never throw,
 * return a plain ok flag the UI may ignore (autosave is fire-and-forget).
 */

import {
  BRIEF_FLOW_DRAFT_SOURCES,
  sanitizeBriefFlowDraft,
  type BriefFlowDraftSource,
} from "@/lib/studio/brief-flow-draft";
import {
  markStudioBriefConversationHandedOff,
  saveStudioBriefFlowDraft,
} from "@/lib/studio/brief-flow-draft-server";

export async function saveStudioBriefFlowDraftAction(input: {
  draft: unknown;
  source?: string;
}): Promise<{ ok: boolean }> {
  try {
    const draft = sanitizeBriefFlowDraft(input?.draft);
    if (!draft) return { ok: false };
    const source: BriefFlowDraftSource = BRIEF_FLOW_DRAFT_SOURCES.includes(
      input?.source as BriefFlowDraftSource,
    )
      ? (input.source as BriefFlowDraftSource)
      : "composer";
    const ok = await saveStudioBriefFlowDraft({ draft, source });
    return { ok };
  } catch {
    return { ok: false };
  }
}

export async function markBriefConversationHandedOffAction(input: {
  conversationId: string;
}): Promise<{ ok: boolean }> {
  try {
    await markStudioBriefConversationHandedOff(String(input?.conversationId ?? ""));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
