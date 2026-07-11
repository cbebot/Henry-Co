"use client";

/**
 * IntelligenceExtras — the composer extras block shared by every Intelligence
 * shell (mobile FAB launcher + founder desktop dock): the F3 governed-action
 * chip→review-card→outcome flow, the L4 offer→quote→run card, and the
 * catalog-bound navigation chips + human handoff.
 *
 * Extracted from IntelligenceLauncher (OCC-2). All colours flow from the
 * --hc-il-* seam tokens carried by the host panel (see IntelligenceLauncherStyles),
 * so both themes are correct wherever this renders.
 */

import { ArrowUpRight, LifeBuoy, Sparkles as Sparkle } from "lucide-react";
import type { IntelligenceChat } from "./use-intelligence-chat";

/** Kobo -> a currency string. NGN today; the currency travels with the quote for the seam. */
function formatMoney(kobo: number, currency: string): string {
  const major = Math.round(kobo) / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "NGN", maximumFractionDigits: 2 }).format(major);
  } catch {
    return `${currency || "NGN"} ${major.toFixed(2)}`;
  }
}

export function IntelligenceExtras({ chat, supportHref }: { chat: IntelligenceChat; supportHref: string }) {
  const {
    t,
    actions,
    handoff,
    offer,
    quote,
    deepBusy,
    deepError,
    proposedAction,
    actionExpanded,
    setActionExpanded,
    actionBusy,
    actionOutcome,
    setActionOutcome,
    setQuote,
    getQuote,
    runDeep,
    confirmAction,
    dismissAction,
  } = chat;

  const hasOffer = Boolean(offer);
  const hasAction = Boolean(proposedAction) || Boolean(actionOutcome);
  if (actions.length === 0 && !handoff && !hasOffer && !hasAction) return null;
  const reversibilityLabel = proposedAction
    ? proposedAction.reversibility === "reversible"
      ? t("Reversible")
      : proposedAction.reversibility === "hard-to-reverse"
        ? t("Hard to reverse")
        : t("Cannot be undone")
    : "";
  return (
    <div className="hc-il-extras">
      {/* F3 governed action — a compact chip first (fix #7: viewing is a
          deliberate click), expanding to the full true-state card, then the
          confirm click. */}
      {actionOutcome ? (
        <div className={`hc-il-action-outcome hc-il-action-outcome--${actionOutcome.kind}`} role="status">
          <span>{actionOutcome.message}</span>
          <button type="button" className="hc-il-action-dismiss" onClick={() => setActionOutcome(null)}>
            {t("Dismiss")}
          </button>
        </div>
      ) : null}
      {proposedAction && !actionExpanded ? (
        <div className="hc-il-action-chip">
          <span className="hc-il-action-chip-label">
            {t("Action ready")}: {proposedAction.title}
          </span>
          <button type="button" className="hc-il-action-review" onClick={() => setActionExpanded(true)}>
            {t("Review")}
          </button>
        </div>
      ) : null}
      {proposedAction && actionExpanded ? (
        <div className="hc-il-action-card" role="group" aria-label={t("Confirm action")}>
          <div className="hc-il-action-card-head">
            <span className="hc-il-action-card-title">{proposedAction.title}</span>
            <span className={`hc-il-action-tag hc-il-action-tag--${proposedAction.reversibility}`}>
              {reversibilityLabel}
            </span>
          </div>
          <p className="hc-il-action-card-body">{proposedAction.body}</p>
          {proposedAction.rationale ? (
            <p className="hc-il-action-card-why">{proposedAction.rationale}</p>
          ) : null}
          {proposedAction.requiresReauth ? (
            // Pre-warn before the confirm click (money-tranche actions, F3c) so
            // the owner knows the step-up is coming rather than meeting a 403.
            <p className="hc-il-action-card-reauth">
              {t("You'll be asked to re-verify your identity to confirm this.")}
            </p>
          ) : null}
          <div className="hc-il-action-card-buttons">
            <button
              type="button"
              className="hc-il-action-confirm"
              onClick={() => void confirmAction()}
              disabled={actionBusy}
            >
              {actionBusy ? t("Working…") : proposedAction.confirmLabel}
            </button>
            <button type="button" className="hc-il-action-cancel" onClick={dismissAction} disabled={actionBusy}>
              {t("Cancel")}
            </button>
          </div>
        </div>
      ) : null}
      {offer ? (
        <div className="hc-il-offer">
          <div className="hc-il-offer-head">
            <Sparkle className="hc-il-offer-icon" aria-hidden />
            <span className="hc-il-offer-title">{offer.title}</span>
          </div>
          <p className="hc-il-offer-blurb">{offer.blurb}</p>
          {quote ? (
            <>
              <p className="hc-il-offer-price">
                {formatMoney(quote.displayAmountMinor, quote.displayCurrency)}
                {quote.approximate ? (
                  <span className="hc-il-offer-approx">
                    {t("approx. charged in")} {quote.chargeCurrency} {formatMoney(quote.chargeKobo, quote.chargeCurrency)}
                  </span>
                ) : null}
              </p>
              <div className="hc-il-offer-actions">
                <button type="button" className="hc-il-offer-run" onClick={() => void runDeep()} disabled={deepBusy}>
                  {deepBusy ? t("Running…") : t("Run it")}
                </button>
                <button type="button" className="hc-il-offer-cancel" onClick={() => setQuote(null)} disabled={deepBusy}>
                  {t("Not now")}
                </button>
              </div>
            </>
          ) : (
            <button type="button" className="hc-il-offer-see" onClick={() => void getQuote()} disabled={deepBusy}>
              {deepBusy ? t("Checking the price…") : t("See the price")}
            </button>
          )}
          {deepError ? <p className="hc-il-offer-error">{deepError}</p> : null}
        </div>
      ) : null}
      {actions.length || handoff ? (
        <div className="hc-il-actions">
          {actions.map((action) => (
            <a key={action.href} href={action.href} className="hc-il-chip">
              {action.label}
              <ArrowUpRight className="hc-il-chip-icon" aria-hidden />
            </a>
          ))}
          {handoff ? (
            <a href={supportHref} className="hc-il-chip hc-il-chip-human">
              <LifeBuoy className="hc-il-chip-icon" aria-hidden />
              {t("Talk to the team")}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
