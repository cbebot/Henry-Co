"use client";

import { useEffect, useState } from "react";
import { X, Globe } from "lucide-react";
import {
  getLocaleDisplayLabel,
  isPublicSelectorLocale,
  LOCALE_LABELS,
  type AppLocale,
} from "@henryco/i18n";

const DISMISSED_KEY = "hc-locale-suggestion-dismissed";

interface LocaleSuggestionProps {
  /** Locale detected from Accept-Language / CDN country headers. null = no suggestion to show. */
  suggestedLocale: AppLocale | null;
  /** Locale the page is currently rendered in (cookie-resolved). */
  currentLocale: AppLocale;
  /** Path to POST the locale change to. Defaults to /api/locale. */
  localeApiPath?: string;
}

/**
 * Non-blocking, one-time, easily-dismissable language suggestion chip.
 *
 * Appears in the bottom-start corner ~1.8 s after first render.
 * Only shows when the header-detected locale differs from the current locale
 * and the user has never dismissed it (tracked in localStorage).
 *
 * On "Switch": POSTs the new locale to the locale API and reloads the page.
 * On "Keep" / ×: records dismissal in localStorage and hides permanently.
 */
export function LocaleSuggestion({
  suggestedLocale,
  currentLocale,
  localeApiPath = "/api/locale",
}: LocaleSuggestionProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!suggestedLocale || suggestedLocale === currentLocale) return;
    if (!isPublicSelectorLocale(suggestedLocale)) return;

    try {
      if (window.localStorage.getItem(DISMISSED_KEY)) return;
    } catch {
      // localStorage blocked — silently skip
      return;
    }

    const timer = setTimeout(() => setVisible(true), 1800);
    return () => clearTimeout(timer);
  }, [suggestedLocale, currentLocale]);

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    } catch { /* ignore */ }
    setVisible(false);
  }

  async function accept() {
    if (!suggestedLocale) return;
    try {
      await fetch(localeApiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: suggestedLocale }),
      });
    } catch { /* non-fatal — locale cookie will still update */ }
    dismiss();
    window.location.reload();
  }

  if (!visible || !suggestedLocale || !isPublicSelectorLocale(suggestedLocale)) return null;

  const nativeLabel = getLocaleDisplayLabel(suggestedLocale);
  const enLabel = LOCALE_LABELS[suggestedLocale]?.en ?? suggestedLocale;
  const currentNative = getLocaleDisplayLabel(currentLocale);

  return (
    <div
      role="region"
      aria-label="Language suggestion"
      className="fixed bottom-5 start-5 z-40 flex max-w-[17rem] items-start gap-3 rounded-2xl border border-white/10 bg-zinc-900/95 px-4 py-3.5 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <Globe
        className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/40"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{nativeLabel}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-white/50">
          Switch to {enLabel}?
        </p>
        <div className="mt-2.5 flex gap-1.5">
          <button
            type="button"
            onClick={accept}
            className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-black transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            Switch
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-full border border-white/12 px-3 py-1 text-[11px] font-medium text-white/55 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            Keep {currentNative}
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss language suggestion"
        className="mt-0.5 flex-shrink-0 text-white/30 transition hover:text-white/70 focus-visible:outline-none"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
