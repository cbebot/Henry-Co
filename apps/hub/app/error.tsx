"use client";

/**
 * apps/hub/app/error.tsx — V3-10 error boundary.
 * See apps/account/app/error.tsx for the canonical pattern reference.
 */
import * as Sentry from "@sentry/nextjs";
import { logger } from "@henryco/observability/logger";
import {
  getErrorFallbackCopy,
  useOptionalHenryCoLocale,
  DEFAULT_LOCALE,
} from "@henryco/i18n";
import { HenryCoErrorFallback } from "@henryco/ui/public-shell";

const DIVISION = "hub";

export default function HubError({
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
        } catch {}
        try {
          Sentry.captureException(e, {
            tags: { division, source: "app/error.tsx" },
            extra: { digest: e.digest },
          });
        } catch {}
        // DIAG-IOS-01 — phone home via local /api/runtime-error so the
        // digest is grep-able in Vercel runtime logs without depending
        // on a configured Sentry DSN.
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
          }).catch(() => {});
        } catch {}
      }}
    />
  );
}
