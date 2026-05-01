"use client";

import { HenryCoErrorFallback } from "@henryco/ui/public-shell";

export default function careError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <HenryCoErrorFallback error={error} reset={reset} division="care" />;
}
