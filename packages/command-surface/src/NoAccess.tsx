import { ShieldX } from "lucide-react";

/** The denied-surface state — proves the access boundary is real, not cosmetic. */
export function NoAccess({
  surfaceLabel,
  viewerLabel,
}: {
  surfaceLabel: string;
  viewerLabel: string;
}) {
  return (
    <div className="rounded-[var(--cc-radius-lg)] border border-[var(--cc-line)] bg-[var(--cc-panel)] px-6 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--cc-line-strong)] bg-[var(--cc-elevated)]">
        <ShieldX className="h-5 w-5 text-[var(--cc-critical)]" aria-hidden />
      </div>
      <h2 className="cc-display mt-4 text-[22px] text-[var(--cc-ink)]">Access restricted</h2>
      <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-[var(--cc-muted)]">
        A <strong className="text-[var(--cc-ink-soft)]">{viewerLabel}</strong> session cannot view the{" "}
        {surfaceLabel}. This boundary is enforced by the same predicate model the live surfaces use
        (<span className="font-mono text-[12px]">hasOwnerAccess</span> /{" "}
        <span className="font-mono text-[12px]">hasStaffAccess</span>), mocked for staging.
      </p>
    </div>
  );
}
