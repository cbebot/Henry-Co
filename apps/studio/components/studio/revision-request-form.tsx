"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";

import { getStudioCopy } from "@henryco/i18n";
import type { AppLocale } from "@henryco/i18n";

type FormState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string }
  | { kind: "success"; revisionId: string; version: number };

export type RevisionAttachmentOption = {
  id: string;
  label: string;
};

export type RevisionRequestFormProps = {
  projectId: string;
  locale?: AppLocale;
  attachmentOptions?: RevisionAttachmentOption[];
  beforePublicId?: string | null;
  deliverableId?: string | null;
  onSuccess?: (input: { revisionId: string; version: number }) => void;
};

/**
 * V3 PASS 21 — <RevisionRequestForm>.
 *
 * Client-side form a project owner uses to request a revision. POSTs
 * to /api/studio/revisions (the dual-shape endpoint; routes through the
 * client-request branch). Submission is gated by a non-empty summary
 * and by the user's authentication cookie (server validates).
 *
 * Strings are routed through @henryco/i18n studio-copy (V3 PASS 21);
 * the API also returns localized errors through PASS 18B runtime cache.
 */
export function RevisionRequestForm({
  projectId,
  locale = "en",
  attachmentOptions = [],
  beforePublicId = null,
  deliverableId = null,
  onSuccess,
}: RevisionRequestFormProps) {
  const copy = getStudioCopy(locale);
  const [summary, setSummary] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [state, setState] = useState<FormState>({ kind: "idle" });
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    if (!summary.trim()) {
      setState({ kind: "error", message: copy.revisions.summaryLabel });
      return;
    }
    setState({ kind: "submitting" });
    startTransition(async () => {
      try {
        const attached = Array.from(selected).map((id) => ({ id }));
        const response = await fetch("/api/studio/revisions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            project_id: projectId,
            summary: summary.trim(),
            attached_files: attached,
            before_public_id: beforePublicId,
            deliverable_id: deliverableId,
          }),
        });
        const payload = (await response.json().catch(() => null)) as
          | { ok: boolean; revision_id?: string; version?: number; error?: string }
          | null;
        if (!response.ok || !payload?.ok) {
          setState({
            kind: "error",
            message:
              payload?.error === "forbidden"
                ? copy.errors.revisionInvalidProject
                : payload?.error === "unauthenticated"
                  ? copy.errors.unauthorized
                  : copy.errors.revisionSubmitFailed,
          });
          return;
        }
        setState({
          kind: "success",
          revisionId: payload.revision_id || "",
          version: payload.version || 1,
        });
        setSummary("");
        setSelected(new Set());
        onSuccess?.({
          revisionId: payload.revision_id || "",
          version: payload.version || 1,
        });
      } catch {
        setState({ kind: "error", message: copy.errors.revisionSubmitFailed });
      }
    });
  }

  const disabled = pending || state.kind === "submitting";

  return (
    <section
      className="rounded-2xl border border-[color:var(--hc-line)] bg-[color:var(--hc-paper-elev)] p-6"
      data-testid="revision-request-form"
    >
      <header className="mb-4">
        <p className="hc-kicker">{copy.revisions.title}</p>
        <h3 className="hc-heading-3 mt-1">{copy.revisions.requestHeading}</h3>
        <p className="hc-body-muted mt-1">{copy.revisions.requestBody}</p>
      </header>

      <label className="hc-label mb-1 block" htmlFor="revision-summary">
        {copy.revisions.summaryLabel}
      </label>
      <textarea
        id="revision-summary"
        rows={4}
        maxLength={2000}
        placeholder={copy.revisions.summaryPlaceholder}
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        disabled={disabled}
        className="hc-input w-full resize-y rounded-lg border border-[color:var(--hc-line)] bg-[color:var(--hc-paper)] p-3 font-sans text-sm text-[color:var(--hc-ink)]"
      />

      {attachmentOptions.length > 0 ? (
        <div className="mt-4">
          <p className="hc-label mb-2">{copy.revisions.attachLabel}</p>
          <div className="flex flex-wrap gap-2">
            {attachmentOptions.map((option) => {
              const isOn = selected.has(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggle(option.id)}
                  disabled={disabled}
                  data-active={isOn}
                  className="rounded-full border border-[color:var(--hc-line)] bg-[color:var(--hc-paper)] px-3 py-1 text-xs font-medium text-[color:var(--hc-ink)] data-[active=true]:border-[color:var(--hc-accent)] data-[active=true]:bg-[color:var(--hc-accent-soft)] data-[active=true]:text-[color:var(--hc-accent-text)]"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {state.kind === "error" ? (
        <p className="hc-body-muted mt-3 inline-flex items-center gap-2 text-sm text-[color:var(--hc-danger)]">
          <AlertCircle aria-hidden className="h-4 w-4" />
          <span>{state.message}</span>
        </p>
      ) : null}

      {state.kind === "success" ? (
        <p className="hc-body-muted mt-3 inline-flex items-center gap-2 text-sm text-[color:var(--hc-success)]">
          <CheckCircle2 aria-hidden className="h-4 w-4" />
          <span>
            {copy.revisions.versionLabel} {state.version}
          </span>
        </p>
      ) : null}

      <div className="mt-4">
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !summary.trim()}
          className="hc-button-primary inline-flex items-center gap-2 rounded-full bg-[color:var(--hc-accent)] px-5 py-2 text-sm font-semibold text-[color:var(--hc-accent-text)] disabled:opacity-60"
        >
          {state.kind === "submitting" ? (
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
          ) : (
            <Send aria-hidden className="h-4 w-4" />
          )}
          <span>{copy.revisions.submitCta}</span>
        </button>
      </div>
    </section>
  );
}
