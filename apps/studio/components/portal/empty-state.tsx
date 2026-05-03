import type { LucideIcon } from "lucide-react";

export function PortalEmptyState({
  icon: Icon,
  title,
  body,
  action,
  tone = "default",
}: {
  icon?: LucideIcon;
  title: string;
  body: string;
  action?: React.ReactNode;
  tone?: "default" | "muted";
}) {
  return (
    <div
      className={`portal-card-elev relative flex flex-col items-center gap-4 px-6 py-10 text-center sm:py-14 ${
        tone === "muted" ? "opacity-95" : ""
      }`}
    >
      {Icon ? (
        <div className="grid h-12 w-12 place-items-center rounded-full border border-[var(--studio-line-strong)] bg-[rgba(151,244,243,0.06)] text-[var(--studio-signal)]">
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <div className="max-w-md space-y-2">
        <h3 className="text-xl font-semibold tracking-[-0.02em] text-[var(--studio-ink)]">
          {title}
        </h3>
        <p className="text-sm leading-6 text-[var(--studio-ink-soft)]">{body}</p>
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
