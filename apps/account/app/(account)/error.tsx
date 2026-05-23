"use client";

/**
 * apps/account/app/(account)/error.tsx — V3-10 canonical inner-shell
 * error boundary.
 *
 * DIAG-IOS-01 root-cause fix. The previous implementation called
 * `useHenryCoLocale()` (the THROWING hook), which would itself throw
 * when this boundary fired ABOVE the `<LocaleProvider>` mount — most
 * commonly when an iOS-Safari hydration mismatch interrupted the
 * provider tree mid-render. The inner throw would bubble UP to the
 * outer `apps/account/app/error.tsx`, surfacing the user-facing V3-10
 * fallback ("Something didn't load") on every authenticated page.
 *
 * The class of bug:
 *
 *   inner-layout server fetch rejects
 *     → React error boundary at `(account)/error.tsx` fires
 *       → `useHenryCoLocale()` throws (no LocaleProvider ancestor)
 *         → root `app/error.tsx` catches the SECOND throw
 *           → V3-10 fallback paints
 *
 * Two architectural shifts close it for good:
 *
 *   1. Use `useOptionalHenryCoLocale()` (returns `null`, never throws)
 *      with an explicit `DEFAULT_LOCALE` fallback.
 *
 *   2. Render via `<HenryCoErrorFallback>` from `@henryco/ui/public-shell`
 *      — the same canonical primitive `apps/account/app/error.tsx` uses,
 *      with `getErrorFallbackCopy(locale)`. The two boundaries now share
 *      one branded UI surface so the visual handoff is invisible to the
 *      user if a double-throw ever recurs.
 *
 *   3. `onErrorReport` mirrors the V3-10 pattern: structured log via
 *      `@henryco/observability/logger` + Sentry capture, with the
 *      `division` tag set to `account.inner` so support can distinguish
 *      inner-shell catches from root catches in the dashboard. Both
 *      reporter calls are wrapped in try/catch so a logger outage cannot
 *      crash the boundary itself.
 */
import * as Sentry from "@sentry/nextjs";
import { logger } from "@henryco/observability/logger";
import {
  getErrorFallbackCopy,
  useOptionalHenryCoLocale,
  DEFAULT_LOCALE,
} from "@henryco/i18n";
import { HenryCoErrorFallback } from "@henryco/ui/public-shell";

const DIVISION = "account.inner";

export default function AccountInnerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useOptionalHenryCoLocale() ?? DEFAULT_LOCALE;
  const copy = getErrorFallbackCopy(locale);

  return (
    <HenryCoErrorFallback
      error={error}
      reset={reset}
      division={DIVISION}
      copy={copy}
      onErrorReport={({ error: e, division }) => {
        try {
          logger
            .child({ module: `${division}.error-boundary` })
            .error("error_boundary_caught", {
              division,
              digest: e.digest,
              name: e.name,
              message: e.message,
            });
        } catch {
          // Logger failure must not crash the boundary.
        }
        try {
          Sentry.captureException(e, {
            tags: { division, source: "app/(account)/error.tsx" },
            extra: { digest: e.digest },
          });
        } catch {
          // Sentry not initialised — silent.
        }
        // Best-effort POST to /api/runtime-error so the digest is grep-able
        // in Vercel runtime logs even if Sentry DSN is misconfigured. Wrapped
        // in try/catch + .catch() — a failed POST must not throw.
        try {
          void fetch("/api/runtime-error", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            keepalive: true,
            body: JSON.stringify({
              surface: division,
              digest: e.digest ?? null,
              message: e.message ?? null,
              stack: e.stack ?? null,
              path: typeof window !== "undefined" ? window.location.pathname : null,
              userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
              at: new Date().toISOString(),
            }),
          }).catch(() => {
            // Network failure inside a boundary must never re-throw.
          });
        } catch {
          // Even synthesizing the payload must not throw.
        }
      }}
    />
  );
}
