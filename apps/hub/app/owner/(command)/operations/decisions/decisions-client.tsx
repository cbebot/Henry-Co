"use client";

/**
 * SA-4 — the operator decisions inbox (Register-D, hub command portal). The
 * operator raises durable one-tap proposals while the owner is away; this
 * renders the triaged queue. A tap posts the proposal token to the SAME
 * reauth-gated confirm route the chat card uses — fetchWithSensitiveAction
 * opens the password modal on the 401 challenge for requiresReauth actions.
 * The inbox carries NO authority: the confirm route re-reads live state and
 * aborts on drift.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { fetchWithSensitiveAction } from "@henryco/auth/client/sensitive-action-modal";
import { dismissOperatorProposalAction } from "./actions";
import { usePushAlerts } from "./usePushAlerts";

export type OperatorDecisionItem = {
  token: string;
  actionKey: string;
  title: string;
  body: string;
  confirmLabel: string;
  rationale: string | null;
  requiresReauth: boolean;
  createdAt: string;
};

export function OperatorDecisionsClient({ items }: { items: OperatorDecisionItem[] }) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busyToken, setBusyToken] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function confirm(item: OperatorDecisionItem) {
    setBusyToken(item.token);
    setNote(null);
    try {
      const res = await fetchWithSensitiveAction("/api/owner/intelligence/actions/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": `operator-${item.token}` },
        body: JSON.stringify({ token: item.token }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        outcome?: string;
        error?: string;
        reason?: string;
      };
      if (res.ok && data.outcome === "executed") {
        setNote(t("Done — the action was carried out."));
        router.refresh();
      } else if (data.outcome === "conflict") {
        setNote(t("The record changed since this was prepared. A fresh card will follow."));
        router.refresh();
      } else {
        setNote(data.error || t("That could not be completed."));
      }
    } catch {
      setNote(t("That could not be completed."));
    } finally {
      setBusyToken(null);
    }
  }

  function dismiss(token: string) {
    setBusyToken(token);
    setNote(null);
    startTransition(async () => {
      const res = await dismissOperatorProposalAction({ token });
      setBusyToken(null);
      if (res.ok) {
        router.refresh();
      } else {
        setNote(t("That decision was already resolved."));
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="acct-card p-6 text-sm opacity-80">
        {t("Nothing is waiting on you. The operator keeps working and will raise the next decision here.")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {note ? <div className="acct-card p-3 text-sm">{note}</div> : null}
      {items.map((item) => (
        <div key={item.token} className="acct-card p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-1 text-sm whitespace-pre-line opacity-85">{item.body}</p>
              {item.rationale ? (
                <p className="mt-2 text-xs opacity-70">
                  {t("Operator note")}: {item.rationale}
                </p>
              ) : null}
            </div>
            {item.requiresReauth ? (
              <span className="shrink-0 rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide opacity-80">
                {t("Password required")}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="acct-button-primary"
              disabled={busyToken === item.token}
              onClick={() => void confirm(item)}
            >
              {busyToken === item.token ? t("Working…") : item.confirmLabel}
            </button>
            <button
              type="button"
              className="acct-button-secondary"
              disabled={busyToken === item.token}
              onClick={() => dismiss(item.token)}
            >
              {t("Dismiss")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/** One-tap owner-device push registration for operator escalations. */
export function OwnerPushEnroll() {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const push = usePushAlerts();

  if (!push.ready || !push.supported) return null;
  return (
    <div className="acct-card flex items-center justify-between gap-3 p-4">
      <p className="text-sm opacity-85">
        {push.subscribed
          ? t("Urgent operator escalations reach this device.")
          : t("Get urgent operator escalations on this device, even with the tab closed.")}
      </p>
      <button
        type="button"
        className="acct-button-secondary shrink-0"
        disabled={push.busy}
        onClick={() => void (push.subscribed ? push.unsubscribe() : push.subscribe())}
      >
        {push.busy
          ? t("Working…")
          : push.subscribed
            ? t("Turn off on this device")
            : t("Enable alerts")}
      </button>
    </div>
  );
}
