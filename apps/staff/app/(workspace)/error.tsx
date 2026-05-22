"use client";

/**
 * apps/staff/app/(workspace)/error.tsx — V3-07(S6) i18n migration.
 *
 * Operator surface; previously rendered hardcoded English via the
 * DASH-9 G9 minimal stub. Now reuses V3-10's HenryCoErrorFallback so
 * the staff workspace inherits the same calm fallback + structured
 * log + Sentry capture pattern as the per-division apps.
 *
 * Note: home link still falls back to "/" (HenryCoErrorFallback default).
 * Staff workspace operators land back on the workspace root, which
 * matches the previous "/modules/staff-overview" intent within the
 * staff app.
 */
import * as Sentry from "@sentry/nextjs";
import { logger } from "@henryco/observability/logger";
import {
  getErrorFallbackCopy,
  useOptionalHenryCoLocale,
  DEFAULT_LOCALE,
} from "@henryco/i18n";
import { HenryCoErrorFallback } from "@henryco/ui/public-shell";

const DIVISION = "staff.workspace";

export default function WorkspaceError({
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
            tags: { division, source: "app/(workspace)/error.tsx" },
            extra: { digest: e.digest },
          });
        } catch {
          // Sentry not initialised — silent.
        }
      }}
    />
  );
}
