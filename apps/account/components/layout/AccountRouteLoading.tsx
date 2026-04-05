import { Loader2 } from "lucide-react";

/** Lightweight route fallback — no decorative delays; matches real streaming behavior. */
export default function AccountRouteLoading({
  title = "Loading",
  description = "Fetching your latest account data.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 py-12">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] shadow-[var(--acct-shadow)]">
        <Loader2 size={22} className="animate-spin text-[var(--acct-gold)]" aria-hidden />
      </div>
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold text-[var(--acct-ink)]">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--acct-muted)]">{description}</p>
      </div>
      <div className="mt-4 h-1 w-full max-w-xs overflow-hidden rounded-full bg-[var(--acct-line)]">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-[var(--acct-gold)]/70" />
      </div>
    </div>
  );
}
