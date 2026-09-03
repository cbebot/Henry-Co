"use client";

/**
 * apps/account/app/error.tsx — V3-10 canonical error boundary.
 *
 * V3-10 S7 + A8 + A9 reference. The conductor's Wave B.1 merge order
 * lands V3-10 first specifically so V3-07 (hardcoded text), V3-09
 * (mobile), and the other parallel passes can extract from THIS file's
 * pattern.
 *
 * Pattern:
 *   1. Resolve locale via `useOptionalHenryCoLocale()` (falls back to
 *      English if the boundary fires above the LocaleProvider).
 *   2. Pull localized copy from `getErrorFallbackCopy(locale)` —
 *      surface:error namespace, 12 locales.
 *   3. Pass an `onErrorReport` callback that:
 *        a. emits a structured warn-level log line via
 *           @henryco/observability/logger (PII-redacted)
 *        b. captures to Sentry with the digest as `extra.digest`
 *      Both are best-effort — boundary never crashes if reporting fails.
 *   4. Render <HenryCoErrorFallback> from @henryco/ui/public-shell.
 *
 * Anti-patterns enforced (V3-10 A7):
 *   - No stack-trace exposure to the user. The shared component renders
 *     only the headline + body + ref id.
 *   - No session/payment payload logged. Only `{ name, message, digest, division }`
 *     is emitted to the structured logger; `defaultRedactor` strips any
 *     additional context keys.
 */
import * as Sentry from "@sentry/nextjs";
import { logger } from "@henryco/observability/logger";
import {
  getErrorFallbackCopy,
  useOptionalHenryCoLocale,
  DEFAULT_LOCALE,
} from "@henryco/i18n";
import { HenryCoErrorFallback } from "@henryco/ui/public-shell";

const DIVISION = "account";

export default function AccountError({
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
        // Structured log entry — redactor strips any keys matching the
        // default deny-list before transmission. `digest` is the Next.js
        // server-generated ID that matches the Sentry event.
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
        // Sentry capture — beforeSend in buildClientSentryConfig will
        // run PII redaction on the event body. Tag the division so
        // owner dashboards can filter by app.
        try {
          Sentry.captureException(e, {
            tags: { division, source: "app/error.tsx" },
            extra: { digest: e.digest },
          });
        } catch {
          // Sentry not initialised in dev / DSN missing — silent.
        }
      }}
    />
  );
}
