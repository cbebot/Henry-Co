import { HenryCoActivityIndicator } from "@henryco/ui";

/** Lightweight route fallback — no decorative delays or fake progress bars. */
export default function AccountRouteLoading({
  title = "Account",
  description = "Your account overview.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 py-12">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] shadow-[var(--acct-shadow)] text-[var(--acct-gold)]">
        <HenryCoActivityIndicator label="Loading account" />
      </div>
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold text-[var(--acct-ink)]">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--acct-muted)]">{description}</p>
      </div>
    </div>
  );
}
