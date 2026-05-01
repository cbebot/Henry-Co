"use client";

import { HenryCoErrorFallback } from "@henryco/ui/public-shell";

export default function studioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <HenryCoErrorFallback error={error} reset={reset} division="studio" />;
}
