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
}

export function ConsentNotice({ preferencesHref }: ConsentNoticeProps) {
  const [visible, setVisible] = useState(false);

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
      aria-label="Privacy notice"
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-[var(--site-bg,#fff)] px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] sm:px-6"
      style={{ borderColor: "var(--site-border, #e5e7eb)" }}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--site-text-soft,#6b7280)]">
          <span className="font-medium text-[var(--site-text,#111827)]">
            Essential storage only.
          </span>{" "}
          Optional analytics and marketing tracking are disabled by default.
          {preferencesHref ? (
            <>
              {" "}
              You can review or change these at any time in your{" "}
              <Link
                href={preferencesHref}
                onClick={dismiss}
                className="font-medium underline underline-offset-2 hover:no-underline"
              >
                privacy settings
              </Link>
              .
            </>
          ) : null}
        </p>

        <div className="flex shrink-0 items-center gap-2">
          {preferencesHref ? (
            <Link
              href={preferencesHref}
              onClick={dismiss}
              className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--site-surface,#f3f4f6)]"
              style={{ borderColor: "var(--site-border, #e5e7eb)", color: "var(--site-text, #111827)" }}
            >
              Review settings
            </Link>
          ) : null}
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg bg-[var(--site-text,#111827)] px-3 py-1.5 text-sm font-medium text-[var(--site-bg,#fff)] transition-colors hover:opacity-80"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
