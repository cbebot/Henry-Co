"use client";

import { ArrowRight, Check, LoaderCircle, Sparkles } from "lucide-react";
import { useId, useState } from "react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { generateStudioBriefDraftAction } from "@/lib/studio/brief-copilot-action";
import type { StudioBriefDraft } from "@/lib/studio/request-fields";
import {
  composeChangeDescription,
  diffStructuredAgainstDraft,
  patchFromDiffs,
  type BriefFieldDiff,
} from "./sections";

/** Localized display label per draft field for the diff preview. */
function fieldLabel(field: BriefFieldDiff["field"], t: (text: string) => string): string {
  const labels: Partial<Record<BriefFieldDiff["field"], string>> = {
    serviceKind: t("Service"),
    selectedProjectType: t("Project type"),
    selectedPlatform: t("Platform"),
    selectedDesign: t("Design"),
    preferredLanguage: t("Language"),
    selectedFramework: t("Framework"),
    selectedBackend: t("Backend"),
    selectedHosting: t("Hosting"),
    selectedPages: t("Pages"),
    selectedModules: t("Features"),
    selectedAddOns: t("Add-ons"),
    selectedTech: t("Stack preferences"),
    businessType: t("Business type"),
    budgetBand: t("Budget"),
    urgency: t("Urgency"),
    timeline: t("Timeline"),
    goals: t("Goals"),
    scopeNotes: t("Scope notes"),
  };
  return labels[field] ?? field;
}

function clip(value: string, max = 42): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function nameList(values: string[], t: (text: string) => string): string {
  const shown = values.slice(0, 2).map((value) => clip(value, 34));
  const rest = values.length - shown.length;
  return rest > 0 ? `${shown.join(", ")} +${rest} ${t("more")}` : shown.join(", ");
}

/** One human line per diff entry — "Pages: 6 → 3 · adds Booking". */
function diffLine(entry: BriefFieldDiff, t: (text: string) => string): string {
  if (Array.isArray(entry.to)) {
    const from = Array.isArray(entry.from) ? entry.from : [];
    const fromSet = new Set(from.map((item) => item.trim()));
    const toSet = new Set(entry.to.map((item) => item.trim()));
    const added = entry.to.filter((item) => !fromSet.has(item.trim()));
    const removed = from.filter((item) => !toSet.has(item.trim()));
    const parts = [`${from.length} → ${entry.to.length}`];
    if (added.length > 0) parts.push(`${t("adds")} ${nameList(added, t)}`);
    if (removed.length > 0) parts.push(`${t("removes")} ${nameList(removed, t)}`);
    return parts.join(" · ");
  }
  const from = typeof entry.from === "string" && entry.from.trim() ? clip(entry.from) : "—";
  return `${from} → ${clip(entry.to)}`;
}

type ReviseState =
  | { kind: "idle" }
  | { kind: "preview"; diffs: BriefFieldDiff[] }
  | { kind: "no_change" }
  | { kind: "applied" }
  | { kind: "refused"; message: string };

/**
 * "Describe a change" — a calm one-line box above the section cards. The
 * request goes to the EXISTING free one-shot co-pilot action with the
 * current brief attached; the reply is previewed as a field-level diff and
 * only patched into the draft on Apply. Refusals show the action's own
 * honest copy verbatim. Server-side caps govern usage — no client limits.
 */
export function DescribeChange({
  draft,
  onApply,
}: {
  draft: StudioBriefDraft;
  onApply: (patch: Partial<StudioBriefDraft>) => void;
}) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const inputId = useId();
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<ReviseState>({ kind: "idle" });

  async function requestRevision() {
    const request = text.trim();
    if (!request || pending) return;
    setPending(true);
    try {
      const formData = new FormData();
      formData.set("description", composeChangeDescription(draft, request));
      const result = await generateStudioBriefDraftAction(formData);
      if (!result.ok) {
        // The action's copy is already honest and calm — show it verbatim.
        setState({ kind: "refused", message: result.message });
        return;
      }
      const diffs = diffStructuredAgainstDraft(result.structured, draft);
      setState(diffs.length > 0 ? { kind: "preview", diffs } : { kind: "no_change" });
    } catch {
      setState({
        kind: "refused",
        message: t("The co-pilot could not be reached. Check your connection and send it again."),
      });
    } finally {
      setPending(false);
    }
  }

  function applyPreview() {
    if (state.kind !== "preview") return;
    onApply(patchFromDiffs(state.diffs));
    setText("");
    setState({ kind: "applied" });
  }

  return (
    <section className="studio-panel rounded-[1.6rem] p-5 sm:p-6">
      <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        {t("Describe a change")}
      </div>
      <label htmlFor={inputId} className="sr-only">
        {t("Describe a change")}
      </label>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          id={inputId}
          type="text"
          value={text}
          disabled={pending}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            // This box lives inside the brief form — Enter should revise,
            // never post the brief.
            if (event.key === "Enter") {
              event.preventDefault();
              void requestRevision();
            }
          }}
          placeholder={t("e.g. Make it 3 pages and add booking")}
          className="studio-input min-w-0 flex-1 rounded-[1.2rem] px-4 py-3"
        />
        <button
          type="button"
          onClick={() => void requestRevision()}
          disabled={pending || text.trim().length === 0}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-[var(--studio-line)] px-5 py-3 text-sm font-semibold text-[var(--studio-ink)] transition hover:border-[var(--studio-signal)]/45 hover:bg-[color:var(--home-surface-04)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <ArrowRight className="h-3.5 w-3.5 text-[var(--studio-signal)]" aria-hidden />
          )}
          {pending ? t("Updating the brief…") : t("Preview the change")}
        </button>
      </div>
      <p className="mt-2 text-[0.72rem] leading-snug text-[var(--studio-ink-soft)]">
        {t("Nothing changes until you apply the preview. You can also adjust any card directly below.")}
      </p>

      {state.kind === "refused" ? (
        <p role="status" className="mt-4 border-l-2 border-[var(--studio-signal)]/55 pl-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
          {state.message}
        </p>
      ) : null}

      {state.kind === "no_change" ? (
        <p role="status" className="mt-4 border-l-2 border-[var(--studio-signal)]/55 pl-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
          {t("The brief already covers that — nothing to change.")}
        </p>
      ) : null}

      {state.kind === "applied" ? (
        <p role="status" className="mt-4 flex items-start gap-2 border-l-2 border-[var(--studio-signal)]/55 pl-3 text-sm leading-7 text-[var(--studio-ink-soft)]">
          <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--studio-signal)]" aria-hidden />
          <span>{t("Applied. The pricing panel reflects the updated brief.")}</span>
        </p>
      ) : null}

      {state.kind === "preview" ? (
        <div className="mt-4 rounded-[1.2rem] border border-[var(--studio-line)] bg-[color:var(--home-surface-04)] p-4">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-ink-soft)]">
            {t("Proposed changes")} · <span className="tabular-nums">{state.diffs.length}</span>
          </div>
          <ul className="mt-2 divide-y divide-[var(--studio-line)]/60">
            {state.diffs.map((entry) => (
              <li key={entry.field} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2 text-sm">
                <span className="font-semibold text-[var(--studio-ink)]">
                  {fieldLabel(entry.field, t)}
                </span>
                <span className="min-w-0 text-[13px] leading-6 text-[var(--studio-ink-soft)]">
                  {diffLine(entry, t)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={applyPreview}
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--home-accent)] px-5 py-2.5 text-sm font-semibold text-[color:var(--home-accent-ink)] transition-colors hover:bg-[color:var(--home-accent-strong)]"
            >
              <Check className="h-3.5 w-3.5" aria-hidden />
              {t("Apply")}
            </button>
            <button
              type="button"
              onClick={() => setState({ kind: "idle" })}
              className="inline-flex items-center rounded-full border border-[var(--studio-line)] px-5 py-2.5 text-sm font-semibold text-[var(--studio-ink)] transition hover:border-[var(--studio-signal)]/40"
            >
              {t("Discard")}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
