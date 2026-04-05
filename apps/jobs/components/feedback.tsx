import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

export function InlineNotice({
  title,
  body,
  tone = "info",
}: {
  title: string;
  body: string;
  tone?: "info" | "success" | "warn";
}) {
  const toneStyles = {
    info: "border-[var(--jobs-line)] bg-[var(--jobs-accent-soft)] text-[var(--jobs-ink)]",
    success: "border-[var(--jobs-success-soft)] bg-[var(--jobs-success-soft)] text-[var(--jobs-success)]",
    warn: "border-[var(--jobs-warning-soft)] bg-[var(--jobs-warning-soft)] text-[var(--jobs-warning)]",
  } as const;

  return (
    <div className={`rounded-[1.5rem] border p-4 sm:p-5 ${toneStyles[tone]}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-2xl bg-white/65 p-2 text-current shadow-sm">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <p className="mt-1 text-sm leading-7 text-current/80">{body}</p>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  kicker = "Nothing here yet",
  title,
  body,
  action,
}: {
  kicker?: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[1.8rem] border border-dashed border-[var(--jobs-line)] bg-[var(--jobs-paper-soft)] px-5 py-8 text-center sm:px-8">
      <p className="jobs-kicker">{kicker}</p>
      <h3 className="mt-4 text-xl font-semibold tracking-[-0.03em]">{title}</h3>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[var(--jobs-muted)]">{body}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
