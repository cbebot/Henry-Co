"use client";

/**
 * apps/studio/app/client/projects/[projectId]/error.tsx — V3-07(S6) i18n migration.
 *
 * Local error boundary for `/client/projects/[projectId]`. Without this,
 * a render error in any tab (overview / progress / files / messages /
 * payments) bubbles to the studio app's global error.tsx and the user
 * lands on the generic surface with no project context.
 *
 * Catching at this scope keeps the chrome (sidebar, mobile-header, etc.)
 * intact and gives the visitor a real recovery path. V3-07(S6) wires
 * this to V3-10's HenryCoErrorFallback so all 12 locales render the
 * correct copy and the structured-log + Sentry capture pattern matches
 * the rest of the app.
 */
import * as Sentry from "@sentry/nextjs";
import { logger } from "@henryco/observability/logger";
import {
  getErrorFallbackCopy,
  useOptionalHenryCoLocale,
  DEFAULT_LOCALE,
} from "@henryco/i18n";
import { HenryCoErrorFallback } from "@henryco/ui/public-shell";

const DIVISION = "studio.client-project";

export default function ClientProjectError({
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
            tags: { division, source: "app/client/projects/[projectId]/error.tsx" },
            extra: { digest: e.digest },
          });
        } catch {
          // Sentry not initialised — silent.
        }
      }}
    />
  );
}
