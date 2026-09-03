"use client";

import { AlertTriangle, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { joinClassNames } from "@/components/studio/request-builder-data";

/**
 * SectionCard — one reviewable slice of the brief.
 *
 * Collapsed: a calm summary of the section's current state + an "Adjust"
 * control. Open: the section's focused editor. Cards whose editor brings its
 * own `studio-panel` chrome (the reused Path step and the domain section)
 * set `bare` so the card renders a plain header above them instead of
 * nesting panels.
 *
 * The `data-section` anchor is what the submit-time validation sweep scrolls
 * to when a failure maps to this card.
 */
export function SectionCard({
  sectionKey,
  kicker,
  title,
  summaryParts,
  attention,
  incompleteLabel,
  open,
  onToggle,
  adjustLabel,
  closeLabel,
  bare,
  children,
}: {
  sectionKey: string;
  /** Localized eyebrow, e.g. "01 · Project". */
  kicker: string;
  /** Localized card title. */
  title: string;
  /** Prose parts from `sectionSummary`; joined with a middle dot. */
  summaryParts: string[];
  /** Localized submit-time validation message owned by this card, if any. */
  attention?: string | null;
  /** Localized chip shown while the section is still incomplete; null hides it. */
  incompleteLabel?: string | null;
  open: boolean;
  onToggle: () => void;
  adjustLabel: string;
  closeLabel: string;
  bare?: boolean;
  children: ReactNode;
}) {
  const bodyId = `brief-section-${sectionKey}-body`;

  const header = (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--studio-signal)]">
          {kicker}
        </div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-[1.05rem] font-semibold tracking-tight text-[var(--studio-ink)]">
            {title}
          </h3>
          {incompleteLabel ? (
            <span className="rounded-full border border-[var(--studio-line)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
              {incompleteLabel}
            </span>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={bodyId}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--studio-line)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink)] transition hover:border-[var(--studio-signal)]/45 hover:bg-[color:var(--home-surface-04)]"
      >
        {open ? closeLabel : adjustLabel}
        <ChevronDown
          className={joinClassNames(
            "h-3.5 w-3.5 text-[var(--studio-signal)] transition",
            open ? "rotate-180" : "",
          )}
          aria-hidden
        />
      </button>
    </div>
  );

  const summary =
    !open && summaryParts.length > 0 ? (
      <p className="mt-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
        {summaryParts.map((part, index) => (
          <span key={`${part}-${index}`}>
            {index > 0 ? <span className="mx-2 opacity-40">·</span> : null}
            <span className={index === 0 ? "font-medium text-[var(--studio-ink)]" : undefined}>
              {part}
            </span>
          </span>
        ))}
      </p>
    ) : null;

  const attentionRow = attention ? (
    <p
      role="alert"
      className="mt-3 flex items-start gap-1.5 text-[12.5px] leading-snug text-[color:var(--studio-warn,_var(--home-accent-text))]"
    >
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{attention}</span>
    </p>
  ) : null;

  if (bare && open) {
    return (
      <section data-section={sectionKey} className="space-y-4">
        <div className="px-1">
          {header}
          {attentionRow}
        </div>
        <div id={bodyId}>{children}</div>
      </section>
    );
  }

  return (
    <section
      data-section={sectionKey}
      className="studio-panel rounded-[1.6rem] p-5 sm:p-6"
    >
      {header}
      {summary}
      {attentionRow}
      {open ? (
        <div id={bodyId} className="mt-5 border-t border-[var(--studio-line)] pt-5">
          {children}
        </div>
      ) : null}
    </section>
  );
}
