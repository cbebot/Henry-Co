"use client";

import { ArrowRight, Trash2 } from "lucide-react";

import { formatRelativeAgo, type RelativeAgoCopy } from "./relative-ago";
import { STALE_THRESHOLD_MS } from "./draft-storage";
import type { DraftListEntry } from "./types";

/**
 * `DraftPanel` — the "continue where you left off" UI driven by the
 * collected `useFormDraft` entries. Renders a card per saved draft
 * with a `Continue` CTA and an optional `Discard` action.
 *
 * The host wires data by listing drafts (e.g. via `listDrafts()`
 * from this package) and mapping each entry to a `DraftListEntry`
 * with a `href` back to the matching form route. The panel itself
 * stays purely presentational — no localStorage access here so the
 * panel renders predictably under SSR + Suspense.
 */
export type DraftPanelCopy = RelativeAgoCopy & {
  panelTitle: string;
  panelEmpty: string;
  continueButton: string;
  discardDraft: string;
  staleNotice: string; // contains `{when}` placeholder
  staleKeep: string;
  staleDiscard: string;
};

export type DraftPanelProps = {
  drafts: DraftListEntry[];
  copy: DraftPanelCopy;
  /** Optional callback when the user discards an entry from the panel. */
  onDiscard?: (key: string) => void;
  /** Optional CSS class on the section wrapper. */
  className?: string;
};

export function DraftPanel({ drafts, copy, onDiscard, className }: DraftPanelProps) {
  if (drafts.length === 0) {
    return (
      <section
        className={className ?? "rounded-xl border border-border bg-card px-4 py-6"}
        aria-label={copy.panelTitle}
      >
        <div className="mb-1 text-sm font-medium text-foreground">
          {copy.panelTitle}
        </div>
        <div className="text-xs text-muted-foreground">{copy.panelEmpty}</div>
      </section>
    );
  }

  const sorted = [...drafts].sort((a, b) => b.savedAt - a.savedAt);

  return (
    <section className={className ?? "space-y-2"} aria-label={copy.panelTitle}>
      <h2 className="text-sm font-semibold text-foreground">{copy.panelTitle}</h2>
      <ul className="space-y-2">
        {sorted.map((draft) => (
          <DraftCard
            key={draft.key}
            draft={draft}
            copy={copy}
            onDiscard={onDiscard}
          />
        ))}
      </ul>
    </section>
  );
}

function DraftCard({
  draft,
  copy,
  onDiscard,
}: {
  draft: DraftListEntry;
  copy: DraftPanelCopy;
  onDiscard?: (key: string) => void;
}) {
  const ago = formatRelativeAgo(draft.savedAt, copy);
  const stale = Date.now() - draft.savedAt > STALE_THRESHOLD_MS;

  return (
    <li className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground">
            {draft.title}
          </div>
          <div className="text-xs text-muted-foreground">{ago}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {onDiscard ? (
            <button
              type="button"
              onClick={() => onDiscard(draft.key)}
              aria-label={copy.discardDraft}
              className="rounded p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
          <a
            href={draft.href}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            {copy.continueButton}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
      {stale ? (
        <div
          className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-900 dark:bg-amber-900/20 dark:text-amber-100"
          role="note"
        >
          {copy.staleNotice.replace("{when}", ago)}
        </div>
      ) : null}
    </li>
  );
}
