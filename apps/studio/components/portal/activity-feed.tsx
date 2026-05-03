import {
  CheckCircle2,
  CreditCard,
  FileText,
  MessageCircle,
  RefreshCcw,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { relativeTime } from "@/lib/portal/helpers";
import type { ClientProjectUpdate } from "@/types/portal";

const updateIcons: Record<string, LucideIcon> = {
  milestone_complete: CheckCircle2,
  file_shared: FileText,
  message_sent: MessageCircle,
  payment_received: CreditCard,
  payment_verified: CreditCard,
  status_changed: RefreshCcw,
  revision_requested: RefreshCcw,
  approval_given: CheckCircle2,
  note: Sparkles,
};

const updateAccents: Record<string, string> = {
  milestone_complete: "text-[#8de8b3]",
  file_shared: "text-[#bcd6ff]",
  message_sent: "text-[var(--studio-signal)]",
  payment_received: "text-[#f3d28a]",
  payment_verified: "text-[#8de8b3]",
  status_changed: "text-[var(--studio-ink-soft)]",
  revision_requested: "text-[#f3d28a]",
  approval_given: "text-[#8de8b3]",
  note: "text-[var(--studio-signal)]",
};

export function ActivityFeed({
  updates,
  projectTitleById,
}: {
  updates: ClientProjectUpdate[];
  projectTitleById?: Map<string, string>;
}) {
  if (updates.length === 0) return null;

  return (
    <ol className="portal-step-rail relative space-y-4 pl-7">
      {updates.map((update) => {
        const Icon = updateIcons[update.updateType] ?? Sparkles;
        const accent = updateAccents[update.updateType] ?? "text-[var(--studio-signal)]";
        const projectTitle = projectTitleById?.get(update.projectId);

        return (
          <li key={update.id} className="relative">
            <span
              className={`absolute left-[-1.65rem] top-1 grid h-7 w-7 place-items-center rounded-full border border-[var(--studio-line-strong)] bg-[var(--studio-bg)] ${accent}`}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="rounded-2xl border border-[var(--studio-line)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-[14px] font-semibold text-[var(--studio-ink)]">
                  {update.title}
                </span>
                <span className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
                  {relativeTime(update.createdAt)}
                </span>
              </div>
              {update.body ? (
                <p className="mt-1.5 text-[13px] leading-5 text-[var(--studio-ink-soft)]">
                  {update.body}
                </p>
              ) : null}
              {projectTitle ? (
                <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                  {projectTitle}
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
