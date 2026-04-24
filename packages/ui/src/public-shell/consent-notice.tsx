"use client";

// ---------------------------------------------------------------------------
// packages/ui/src/public-shell/consent-notice.tsx
//
// First-visit privacy notice.
//
// Appears ONLY when no consent choice has ever been persisted.
// Does NOT block usage, does NOT render as a modal, does NOT fire analytics
// before consent is given. Treated as a calm, premium strip — not an alarm.
// ---------------------------------------------------------------------------

import Link from "next/link";
import { useEffect, useState } from "react";
import { getConsentCopy, type AppLocale } from "@henryco/i18n";
import {
  buildHenryCoConsentState,
  persistHenryCoConsent,
  readStoredHenryCoConsent,
} from "../public/consent-state";
import { cn } from "../lib/cn";

interface ConsentNoticeProps {
  /**
   * Optional URL where the user can review and update privacy preferences.
   * When provided, a "Review settings" link is shown alongside "Got it".
   * When omitted, only the "Got it" dismiss button is shown.
   */
  preferencesHref?: string;
  locale?: AppLocale;
  /** Override tone if the division shell runs on a dark canvas (e.g. Care). */
  tone?: "auto" | "onDark";
}

const CONSENT_NOTICE_LABELS: Record<
  AppLocale,
  { gotIt: string; reviewSettings: string; privacyNoticeAria: string }
> = {
  en: { gotIt: "Got it", reviewSettings: "Review settings", privacyNoticeAria: "Privacy notice" },
  fr: { gotIt: "Compris", reviewSettings: "Vérifier les réglages", privacyNoticeAria: "Avis de confidentialité" },
  es: { gotIt: "Entendido", reviewSettings: "Revisar ajustes", privacyNoticeAria: "Aviso de privacidad" },
  pt: { gotIt: "Entendi", reviewSettings: "Rever ajustes", privacyNoticeAria: "Aviso de privacidade" },
  ar: { gotIt: "فهمت", reviewSettings: "مراجعة الإعدادات", privacyNoticeAria: "إشعار الخصوصية" },
  de: { gotIt: "Verstanden", reviewSettings: "Einstellungen prüfen", privacyNoticeAria: "Datenschutzhinweis" },
  it: { gotIt: "Capito", reviewSettings: "Rivedi impostazioni", privacyNoticeAria: "Avviso sulla privacy" },
  ig: { gotIt: "Ọ dị mma", reviewSettings: "Lelee ntọala", privacyNoticeAria: "Nkwupụta nzuzo" },
  yo: { gotIt: "Ó yé mi", reviewSettings: "Ṣàyẹ̀wò ètò", privacyNoticeAria: "Ìkéde ìpamọ́" },
  ha: { gotIt: "Na gane", reviewSettings: "Duba saituna", privacyNoticeAria: "Sanarwar sirri" },
  zh: { gotIt: "知道了", reviewSettings: "查看设置", privacyNoticeAria: "隐私提示" },
  hi: { gotIt: "समझ गया", reviewSettings: "सेटिंग देखें", privacyNoticeAria: "गोपनीयता सूचना" },
};

export function ConsentNotice({ preferencesHref, locale = "en", tone = "auto" }: ConsentNoticeProps) {
  const [visible, setVisible] = useState(false);
  const labels = CONSENT_NOTICE_LABELS[locale] || CONSENT_NOTICE_LABELS.en;
  const consentCopy = getConsentCopy(locale);
  const onDark = tone === "onDark";

  useEffect(() => {
    const stored = readStoredHenryCoConsent();
    if (!stored) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    const essentialOnly = buildHenryCoConsentState({
      updatedAt: new Date().toISOString(),
    });
    persistHenryCoConsent(essentialOnly, window.location.hostname);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label={labels.privacyNoticeAria}
      className={cn(
        "fixed inset-x-0 bottom-0 z-[110] px-3 pb-[max(env(safe-area-inset-bottom,0px),0.75rem)] sm:px-5",
        "pointer-events-none"
      )}
    >
      <div
        className={cn(
          "pointer-events-auto mx-auto max-w-5xl rounded-2xl border backdrop-blur-xl",
          onDark
            ? "border-white/10 bg-[#0b1018]/90 text-white shadow-[0_24px_72px_-30px_rgba(0,0,0,0.7)]"
            : "border-zinc-200/80 bg-white/96 text-zinc-900 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.38)] dark:border-white/10 dark:bg-[#0b1018]/90 dark:text-white"
        )}
      >
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:px-5">
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className={cn(
                "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                onDark ? "bg-amber-300/90" : "bg-amber-500/90 dark:bg-amber-300/90"
              )}
            />
            <p
              className={cn(
                "text-sm leading-6",
                onDark ? "text-white/78" : "text-zinc-700 dark:text-white/78"
              )}
            >
              {consentCopy.banner.body}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
            {preferencesHref ? (
              <Link
                href={preferencesHref}
                onClick={dismiss}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide transition",
                  onDark
                    ? "border-white/15 text-white hover:bg-white/5"
                    : "border-zinc-200/90 text-zinc-800 hover:bg-zinc-50 dark:border-white/15 dark:text-white dark:hover:bg-white/5"
                )}
              >
                {labels.reviewSettings}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-4 py-1.5 text-xs font-semibold tracking-wide text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {labels.gotIt}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
