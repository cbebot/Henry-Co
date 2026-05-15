"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

import { getStudioCopy } from "@henryco/i18n";
import type { AppLocale } from "@henryco/i18n";

type FormState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string }
  | { kind: "success"; signatureId: string; acceptedAt: string };

export type ProposalAcceptFlowProps = {
  proposalId: string;
  locale?: AppLocale;
  signWellAvailable?: boolean;
  fallbackName?: string | null;
  onSuccess?: (input: { signatureId: string; acceptedAt: string }) => void;
};

/**
 * V3 PASS 21 — <ProposalAcceptFlow>.
 *
 * Renders the e-signature accept block on /client/proposals/[id]. Two
 * paths:
 *   - SignWell embedded flow when SIGNWELL_API_KEY is provisioned on
 *     the server (caller signals via `signWellAvailable`). On
 *     completion the caller POSTs envelope id back through here.
 *   - Typed-name fallback when SignWell is not configured. User types
 *     full legal name and ticks the acknowledgement checkbox. Submits
 *     to /api/studio/proposals/sign with provider="typed_name".
 *
 * Captures IP / UA / locale server-side via the API; this component
 * only collects the user's intent.
 */
export function ProposalAcceptFlow({
  proposalId,
  locale = "en",
  signWellAvailable = false,
  fallbackName = null,
  onSuccess,
}: ProposalAcceptFlowProps) {
  const copy = getStudioCopy(locale);
  const [typedName, setTypedName] = useState(fallbackName || "");
  const [acknowledged, setAcknowledged] = useState(false);
  const [state, setState] = useState<FormState>({ kind: "idle" });
  const [pending, startTransition] = useTransition();

  function submit(provider: "signwell" | "typed_name") {
    if (!acknowledged) {
      setState({ kind: "error", message: copy.proposal.acknowledgementLabel });
      return;
    }
    if (provider === "typed_name" && !typedName.trim()) {
      setState({ kind: "error", message: copy.proposal.typedNameLabel });
      return;
    }
    setState({ kind: "submitting" });
    startTransition(async () => {
      try {
        const response = await fetch("/api/studio/proposals/sign", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            proposal_id: proposalId,
            typed_name: typedName.trim() || null,
            locale,
            acknowledgement: true,
            provider,
          }),
        });
        const payload = (await response.json().catch(() => null)) as
          | { ok: boolean; signature_id?: string; accepted_at?: string; error?: string }
          | null;
        if (!response.ok || !payload?.ok) {
          let message = copy.errors.proposalSignFailed;
          if (payload?.error === "proposal_expired") message = copy.errors.proposalExpired;
          if (payload?.error === "proposal_already_signed") message = copy.errors.proposalAlreadySigned;
          if (payload?.error === "unauthenticated") message = copy.errors.unauthorized;
          setState({ kind: "error", message });
          return;
        }
        setState({
          kind: "success",
          signatureId: payload.signature_id || "",
          acceptedAt: payload.accepted_at || new Date().toISOString(),
        });
        onSuccess?.({
          signatureId: payload.signature_id || "",
          acceptedAt: payload.accepted_at || new Date().toISOString(),
        });
      } catch {
        setState({ kind: "error", message: copy.errors.proposalSignFailed });
      }
    });
  }

  const disabled = pending || state.kind === "submitting" || state.kind === "success";

  return (
    <section
      className="rounded-2xl border border-[color:var(--hc-line)] bg-[color:var(--hc-paper-elev)] p-6"
      data-testid="proposal-accept-flow"
    >
      <header className="mb-4 flex items-start gap-3">
        <span className="rounded-full bg-[color:var(--hc-accent-soft)] p-2 text-[color:var(--hc-accent-text)]">
          <ShieldCheck aria-hidden className="h-5 w-5" />
        </span>
        <div>
          <h3 className="hc-heading-3">{copy.proposal.acceptHeading}</h3>
          <p className="hc-body-muted mt-1 text-sm">{copy.proposal.acceptBody}</p>
        </div>
      </header>

      {!signWellAvailable ? (
        <div className="mb-4 space-y-2">
          <label className="hc-label block" htmlFor="proposal-typed-name">
            {copy.proposal.typedNameLabel}
          </label>
          <input
            id="proposal-typed-name"
            type="text"
            value={typedName}
            placeholder={copy.proposal.typedNamePlaceholder}
            onChange={(e) => setTypedName(e.target.value)}
            disabled={disabled}
            className="hc-input w-full rounded-lg border border-[color:var(--hc-line)] bg-[color:var(--hc-paper)] px-3 py-2 text-sm text-[color:var(--hc-ink)]"
            maxLength={200}
            autoComplete="name"
          />
          <p className="hc-body-muted text-xs">{copy.proposal.typedNameHelp}</p>
        </div>
      ) : null}

      <label className="mb-4 flex items-start gap-3 text-sm text-[color:var(--hc-ink)]">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
          disabled={disabled}
          className="mt-0.5 h-4 w-4 rounded border-[color:var(--hc-line)]"
        />
        <span>{copy.proposal.acknowledgementLabel}</span>
      </label>

      {state.kind === "error" ? (
        <p className="mb-3 inline-flex items-center gap-2 text-sm text-[color:var(--hc-danger)]">
          <AlertCircle aria-hidden className="h-4 w-4" />
          <span>{state.message}</span>
        </p>
      ) : null}

      {state.kind === "success" ? (
        <p className="mb-3 inline-flex items-center gap-2 text-sm text-[color:var(--hc-success)]">
          <CheckCircle2 aria-hidden className="h-4 w-4" />
          <span>{copy.proposal.statusAccepted}</span>
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {signWellAvailable ? (
          <button
            type="button"
            onClick={() => submit("signwell")}
            disabled={disabled || !acknowledged}
            className="hc-button-primary inline-flex items-center gap-2 rounded-full bg-[color:var(--hc-accent)] px-5 py-2 text-sm font-semibold text-[color:var(--hc-accent-text)] disabled:opacity-60"
          >
            {state.kind === "submitting" ? (
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            ) : null}
            <span>
              {copy.proposal.acceptCta} ({copy.proposal.signatureProviderSignWell})
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => submit("typed_name")}
            disabled={disabled || !acknowledged || !typedName.trim()}
            className="hc-button-primary inline-flex items-center gap-2 rounded-full bg-[color:var(--hc-accent)] px-5 py-2 text-sm font-semibold text-[color:var(--hc-accent-text)] disabled:opacity-60"
          >
            {state.kind === "submitting" ? (
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            ) : null}
            <span>{copy.proposal.acceptCta}</span>
          </button>
        )}
      </div>
    </section>
  );
}
