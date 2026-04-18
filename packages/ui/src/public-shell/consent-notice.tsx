"use client";

// ---------------------------------------------------------------------------
// packages/ui/src/public-shell/consent-notice.tsx
//
// First-visit consent notice.
//
// Appears ONLY when no consent choice has ever been persisted
// (readStoredHenryCoConsent() returns null — no localStorage entry, no cookie).
//
// Does NOT block usage.
// Does NOT claim "we use cookies" in a misleading way.
// Does NOT render a modal or overlay.
// Does NOT fire any analytics before consent is given.
//
// Behavior:
//  - Reads stored consent state on mount (client-only).
//  - If already set (even essential-only): never shows.
//  - "Got it" saves essential-only consent so the notice never reappears.
//  - Optional preferencesHref renders a "Review settings" link.
//  - Dismisses immediately; does not reappear.
//
// Design: small strip at bottom of viewport, calm, not alarming.
// ---------------------------------------------------------------------------

import Link from "next/link";
import { useEffect, useState } from "react";
import { getConsentCopy, type AppLocale } from "@henryco/i18n";
import {
  buildHenryCoConsentState,
  persistHenryCoConsent,
  readStoredHenryCoConsent,
} from "../public/consent-state";

interface ConsentNoticeProps {
  /**
   * Optional URL where the user can review and update privacy preferences.
   * When provided, a "Review settings" link is shown alongside "Got it".
   * When omitted, only the "Got it" dismiss button is shown.
   */
  preferencesHref?: string;
  locale?: AppLocale;
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

export function ConsentNotice({ preferencesHref, locale = "en" }: ConsentNoticeProps) {
  const [visible, setVisible] = useState(false);
  const labels = CONSENT_NOTICE_LABELS[locale] || CONSENT_NOTICE_LABELS.en;
  const consentCopy = getConsentCopy(locale);

  useEffect(() => {
    // Show only when no prior consent decision exists
    const stored = readStoredHenryCoConsent();
    if (!stored) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    // Save essential-only consent so this notice never reappears
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
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-[var(--site-bg,#fff)] px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] sm:px-6"
      style={{ borderColor: "var(--site-border, #e5e7eb)" }}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--site-text-soft,#6b7280)]">
          {consentCopy.banner.body}
        </p>

        <div className="flex shrink-0 items-center gap-2">
          {preferencesHref ? (
            <Link
              href={preferencesHref}
              onClick={dismiss}
              className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--site-surface,#f3f4f6)]"
              style={{ borderColor: "var(--site-border, #e5e7eb)", color: "var(--site-text, #111827)" }}
            >
              {labels.reviewSettings}
            </Link>
          ) : null}
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg bg-[var(--site-text,#111827)] px-3 py-1.5 text-sm font-medium text-[var(--site-bg,#fff)] transition-colors hover:opacity-80"
          >
            {labels.gotIt}
          </button>
        </div>
      </div>
    </div>
  );
}
