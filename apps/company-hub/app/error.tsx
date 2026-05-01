"use client";

import { HenryCoErrorFallback } from "@henryco/ui/public-shell";

export default function companyhubError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <HenryCoErrorFallback error={error} reset={reset} division="company-hub" />;
}
