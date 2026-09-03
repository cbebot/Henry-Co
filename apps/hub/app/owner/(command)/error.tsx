"use client";

/**
 * apps/hub/app/owner/(command)/error.tsx — V3-07(S6) i18n migration.
 *
 * Owner command-center route boundary. Previously rendered hardcoded
 * English copy; now reuses V3-10's HenryCoErrorFallback so all 12
 * locales work and structured logging + Sentry capture follow the
 * same pattern as every other division boundary.
 */
import * as Sentry from "@sentry/nextjs";
import { logger } from "@henryco/observability/logger";
import {
  getErrorFallbackCopy,
  useOptionalHenryCoLocale,
  DEFAULT_LOCALE,
} from "@henryco/i18n";
import { HenryCoErrorFallback } from "@henryco/ui/public-shell";

const DIVISION = "hub.owner-command";

export default function OwnerCommandError({
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
            tags: { division, source: "app/owner/(command)/error.tsx" },
            extra: { digest: e.digest },
          });
        } catch {
          // Sentry not initialised — silent.
        }
      }}
    />
  );
}
