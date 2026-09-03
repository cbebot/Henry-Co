"use client";

/**
 * TrackAttemptedCode — echoes the order reference the visitor tried to look up
 * on the graceful track not-found page. `not-found.tsx` is a server component
 * with no access to the route params, so we read the attempted code from the
 * URL on the client (the pathname is still `/track/<code>` when the not-found
 * boundary renders) and show it back so the message is specific and helpful.
 *
 * The label arrives pre-translated from the server (Pattern B). Renders nothing
 * when there is no meaningful code to echo (e.g. the bare `/track` segment).
 */

import { usePathname } from "next/navigation";

export function TrackAttemptedCode({ label }: { label: string }) {
  const pathname = usePathname();
  const raw = pathname?.split("/").filter(Boolean).pop() ?? "";
  let code = raw;
  try {
    code = decodeURIComponent(raw);
  } catch {
    code = raw;
  }
  if (!code || code.toLowerCase() === "track") return null;

  return (
    <p className="mt-4 text-sm text-[var(--market-muted)]">
      {label}{" "}
      <span className="break-all font-semibold text-[var(--market-ink)]">{code}</span>
    </p>
  );
}
