"use client";

import { HenryCoErrorFallback } from "@henryco/ui/public-shell";

/**
 * Jobs root error boundary.
 *
 * V3 Wave A1 D6 coverage: every web app's `app/error.tsx` must consume
 * `HenryCoErrorFallback` so error states across the platform read with
 * one calm, branded voice. The prior bespoke jobs-only fallback drifted
 * off-pattern (different copy, different chrome, locally-defined
 * Tailwind classes) and is replaced here with the shared primitive.
 */
export default function jobsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <HenryCoErrorFallback error={error} reset={reset} division="jobs" />;
}
