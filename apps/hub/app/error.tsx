"use client";

import { HenryCoErrorFallback } from "@henryco/ui/public-shell";

export default function hubError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <HenryCoErrorFallback error={error} reset={reset} division="hub" />;
}
