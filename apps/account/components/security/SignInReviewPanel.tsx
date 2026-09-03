"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Check, ShieldCheck } from "lucide-react";
import { ButtonPendingContent } from "@henryco/ui";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";

export type SignInReviewPanelProps = {
  eventId: string;
  deviceLabel: string;
  locationLabel: string | null;
  whenLabel: string | null;
};

/**
 * "Was this you?" — the in-app response to a new-device/new-location sign-in.
 * Both actions are authenticated, same-origin POSTs (the live session is the
 * credential): "Yes" trusts the alerted device; "No" secures the account
 * (signs out everywhere + starts a password reset).
 */
export default function SignInReviewPanel({
  eventId,
  deviceLabel,
  locationLabel,
  whenLabel,
}: SignInReviewPanelProps) {
  const locale = useHenryCoLocale();
  const t = (s: string) => translateSurfaceLabel(locale, s);
  const router = useRouter();
  const [pending, setPending] = useState<null | "yes" | "no">(null);
  const [done, setDone] = useState<null | "trusted" | "secured">(null);
  const [error, setError] = useState<string | null>(null);

  const handleTrust = async () => {
    if (pending) return;
    setPending("yes");
    setError(null);
    try {
      const res = await fetch("/api/security/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ eventId }),
      });
      if (!res.ok) throw new Error("confirm failed");
      setDone("trusted");
      router.refresh();
    } catch {
      setError(t("We couldn't update this. Please try again."));
      setPending(null);
    }
  };

  const handleSecure = async () => {
    if (pending) return;
    setPending("no");
    setError(null);
    try {
      const res = await fetch("/api/security/secure", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: "{}",
      });
      if (!res.ok) throw new Error("secure failed");
      setDone("secured");
      // All sessions are now invalid; route to sign in afresh.
      setTimeout(() => router.replace("/login?secured=1"), 1800);
    } catch {
      setError(t("We couldn't secure your account. Please try again."));
      setPending(null);
    }
  };

  if (done === "trusted") {
    return (
      <div className="rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--acct-accent-soft,rgba(16,185,129,0.12))]">
            <ShieldCheck size={18} className="text-[var(--acct-ink)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--acct-ink)]">{t("This device is now trusted")}</p>
            <p className="mt-1 text-sm leading-7 text-[var(--acct-muted)]">
              {t("Thanks for confirming. We won't ask about this device again.")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (done === "secured") {
    return (
      <div className="rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-surface)] p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--acct-red-soft)]">
            <ShieldCheck size={18} className="text-[var(--acct-red)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--acct-ink)]">{t("Your account is being secured")}</p>
            <p className="mt-1 text-sm leading-7 text-[var(--acct-muted)]">
              {t("We're signing you out everywhere and emailing you a link to set a new password.")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[1.5rem] border border-[var(--acct-red)] bg-[var(--acct-red-soft)] p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--acct-surface)]">
          <ShieldAlert size={18} className="text-[var(--acct-red)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[var(--acct-red)]">
            {t("Security check")}
          </p>
          <p className="mt-1 text-base font-semibold text-[var(--acct-ink)]">{t("Was this you?")}</p>
          <p className="mt-1 text-sm leading-7 text-[var(--acct-muted)]">
            {t("We noticed a new sign-in to your account. If it was you, confirm the device. If not, secure your account now.")}
          </p>

          <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--acct-muted)]">{t("When")}</dt>
              <dd className="mt-1 text-sm text-[var(--acct-ink)]">{whenLabel || t("Just now")}</dd>
            </div>
            <div>
              <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--acct-muted)]">{t("Device")}</dt>
              <dd className="mt-1 text-sm text-[var(--acct-ink)]">{deviceLabel}</dd>
            </div>
            {locationLabel ? (
              <div>
                <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--acct-muted)]">{t("Near")}</dt>
                <dd className="mt-1 text-sm text-[var(--acct-ink)]">{locationLabel}</dd>
              </div>
            ) : null}
          </dl>

          {error ? (
            <div className="mt-4 rounded-xl bg-[var(--acct-surface)] px-4 py-3 text-sm text-[var(--acct-red)]">
              {error}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => void handleTrust()}
              className="acct-button-primary inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl"
            >
              <ButtonPendingContent
                pending={pending === "yes"}
                pendingLabel={t("Confirming…")}
                spinnerLabel={t("Confirming…")}
                textClassName="inline-flex items-center gap-2 font-semibold"
              >
                <>
                  <Check size={16} />
                  {t("Yes, it was me")}
                </>
              </ButtonPendingContent>
            </button>

            <button
              type="button"
              disabled={pending !== null}
              onClick={() => void handleSecure()}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[var(--acct-red)] bg-[var(--acct-surface)] px-5 font-semibold text-[var(--acct-red)] transition-colors hover:bg-[var(--acct-red-soft)] disabled:opacity-60"
            >
              <ButtonPendingContent
                pending={pending === "no"}
                pendingLabel={t("Securing…")}
                spinnerLabel={t("Securing…")}
                textClassName="inline-flex items-center gap-2 font-semibold"
              >
                <>
                  <ShieldAlert size={16} />
                  {t("No, secure my account")}
                </>
              </ButtonPendingContent>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
