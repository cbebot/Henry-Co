"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { getStudioPortalCopy } from "@henryco/i18n";
import { refineDraftAction } from "@/lib/portal/refine-draft-action";

/**
 * "✨ Refine" button for the message-thread composer. Sends the live
 * draft to Claude (haiku) for a polish pass and replaces the draft with
 * the refined version. If the API key is missing or the model errors,
 * the original draft is kept unchanged.
 *
 * Lives in apps/studio because it knows about studio's project context
 * (title + summary) — those flow into the AI prompt for grounding so
 * the model doesn't invent facts. The engine slot
 * (composerExtras render prop) keeps this host-specific without
 * polluting the shared package.
 */
export type RefineWithAiButtonProps = {
  draft: string;
  setDraft: (value: string) => void;
  projectTitle?: string | null;
  projectSummary?: string | null;
};

export function RefineWithAiButton({
  draft,
  setDraft,
  projectTitle,
  projectSummary,
}: RefineWithAiButtonProps) {
  const locale = useHenryCoLocale();
  const copy = getStudioPortalCopy(locale);
  const [pending, startTransition] = useTransition();
  const [hint, setHint] = useState<string | null>(null);

  const disabled = pending || draft.trim().length < 6;

  function handleRefine() {
    if (disabled) return;
    setHint(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("draft", draft);
      if (projectTitle) formData.set("projectTitle", projectTitle);
      if (projectSummary) formData.set("projectSummary", projectSummary);
      const result = await refineDraftAction(formData);
      if (result.ok) {
        setDraft(result.refined);
        setHint(copy.refineButton.refinedHint);
        setTimeout(() => setHint(null), 1800);
      } else {
        setHint(result.message);
        setTimeout(() => setHint(null), 4000);
      }
    });
  }

  return (
    <div className="ws-refine-ai-wrap">
      <button
        type="button"
        className="ws-refine-ai-btn"
        onClick={handleRefine}
        disabled={disabled}
        aria-label={copy.refineButton.ariaLabel}
        title={copy.refineButton.title}
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        <span className="ws-refine-ai-label">{pending ? copy.refineButton.refining : copy.refineButton.refine}</span>
      </button>
      {hint ? (
        <span className="ws-refine-ai-hint" role="status" aria-live="polite">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
