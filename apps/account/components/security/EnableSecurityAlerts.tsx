"use client";

import { Bell, BellOff, BellRing } from "lucide-react";
import { ButtonPendingContent } from "@henryco/ui";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";

import { usePushAlerts } from "./usePushAlerts";

/**
 * Per-device push opt-in. Push reaches the user even when email is capped and
 * the tab is closed — the redundant money-grade channel for security alerts.
 */
export default function EnableSecurityAlerts() {
  const locale = useHenryCoLocale();
  const t = (s: string) => translateSurfaceLabel(locale, s);
  const { ready, supported, permission, subscribed, busy, error, subscribe, unsubscribe } =
    usePushAlerts();

  // Avoid a flash of the wrong state before the browser capabilities resolve.
  if (!ready) {
    return (
      <div className="rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4">
        <p className="text-sm text-[var(--acct-muted)]">{t("Checking this device…")}</p>
      </div>
    );
  }

  const errorCopy =
    error === "permission_denied"
      ? t("Notifications are blocked. Turn them on in your browser settings, then try again.")
      : error === "not_configured"
        ? t("Push alerts aren't available right now.")
        : error === "unsupported"
          ? t("This browser doesn't support push alerts.")
          : error === "failed"
            ? t("We couldn't update push alerts. Please try again.")
            : null;

  const blocked = !supported || permission === "denied";

  return (
    <div className="rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--acct-soft,rgba(10,16,24,0.05))]">
          {subscribed ? (
            <BellRing size={18} className="text-[var(--acct-ink)]" />
          ) : (
            <Bell size={18} className="text-[var(--acct-ink)]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--acct-ink)]">
            {subscribed ? t("Push alerts are on for this device") : t("Get push alerts on this device")}
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--acct-muted)]">
            {subscribed
              ? t("You'll get an instant alert here if anyone signs in to your account.")
              : t("Be alerted instantly on this device when there's a new sign-in — even with the tab closed.")}
          </p>

          {blocked ? (
            <p className="mt-3 text-sm leading-6 text-[var(--acct-muted)]">
              {!supported
                ? t("This browser doesn't support push alerts.")
                : t("Notifications are blocked. Turn them on in your browser settings to enable alerts.")}
            </p>
          ) : null}

          {errorCopy && !blocked ? (
            <div className="mt-3 rounded-xl bg-[var(--acct-red-soft)] px-4 py-3 text-sm text-[var(--acct-red)]">
              {errorCopy}
            </div>
          ) : null}

          {!blocked ? (
            subscribed ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void unsubscribe()}
                className="acct-button-secondary mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl"
              >
                <ButtonPendingContent
                  pending={busy}
                  pendingLabel={t("Updating…")}
                  spinnerLabel={t("Updating…")}
                  textClassName="inline-flex items-center gap-2 font-semibold"
                >
                  <>
                    <BellOff size={16} />
                    {t("Turn off on this device")}
                  </>
                </ButtonPendingContent>
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => void subscribe()}
                className="acct-button-primary mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl"
              >
                <ButtonPendingContent
                  pending={busy}
                  pendingLabel={t("Enabling…")}
                  spinnerLabel={t("Enabling…")}
                  textClassName="inline-flex items-center gap-2 font-semibold"
                >
                  <>
                    <Bell size={16} />
                    {t("Enable push alerts")}
                  </>
                </ButtonPendingContent>
              </button>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
