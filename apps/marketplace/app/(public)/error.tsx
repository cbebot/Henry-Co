"use client";

/**
 * apps/marketplace/app/(public)/error.tsx — V3-07(S6) i18n migration.
 *
 * Route-segment boundary for the public marketplace shell. V3-10 shipped
 * the canonical surface:error namespace + HenryCoErrorFallback component;
 * this boundary now plugs into that pattern so all 12 locales work and
 * the structured log + Sentry tagging behave identically to the app-root
 * boundary.
 */
import * as Sentry from "@sentry/nextjs";
import { logger } from "@henryco/observability/logger";
import {
  getErrorFallbackCopy,
  useOptionalHenryCoLocale,
  DEFAULT_LOCALE,
} from "@henryco/i18n";
import { HenryCoErrorFallback } from "@henryco/ui/public-shell";

const DIVISION = "marketplace.public";

export default function MarketplacePublicError({
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
            tags: { division, source: "app/(public)/error.tsx" },
            extra: { digest: e.digest },
          });
        } catch {
          // Sentry not initialised — silent.
        }
      }}
    />
  );
}
