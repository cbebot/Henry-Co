"use client";

import { useState } from "react";
import {
  CalendarClock,
  Check,
  ChevronDown,
  Clock4,
  FileText,
  Folder,
  ImageIcon,
  Users,
} from "lucide-react";
import type { ProjectThreadContext } from "@/lib/messaging/types";
import { formatMessageTimestamp } from "@/lib/messaging/utils";

type Props = {
  context: ProjectThreadContext;
  /** When false, panel is hidden (mobile/tablet collapsed). */
  expanded: boolean;
  onToggle: () => void;
  /** Variant: "fixed" on desktop (always visible), "sheet" on tablet. */
  variant?: "fixed" | "sheet";
};

/**
 * The right-rail context panel. Spec mandates four sections, each
 * collapsible. The panel is what makes the messaging surface
 * categorically different from a general messenger — it answers
 * "why are we talking" without the client having to ask.
 */
export function ContextPanel({
  context,
  expanded,
  onToggle,
  variant = "fixed",
}: Props) {
  if (variant === "sheet" && !expanded) {
    return null;
  }

  return (
    <aside
      className={`flex flex-col gap-3 overflow-y-auto border-l border-[var(--studio-thread-line)] bg-[var(--studio-thread-rail)] p-4 ${
        variant === "fixed"
          ? "hidden w-[260px] shrink-0 lg:flex"
          : "fixed inset-y-0 right-0 z-40 w-[88vw] max-w-[320px] shadow-[0_24px_64px_rgba(0,0,0,0.5)] motion-safe:animate-[studio-msg-slide-in-right_240ms_ease-out] sm:w-[320px]"
      }`}
      aria-label="Project context"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--studio-thread-ink-muted)]">
          Project context
        </h3>
        {variant === "sheet" ? (
          <button
            type="button"
            onClick={onToggle}
            className="rounded-full p-1 text-[var(--studio-thread-ink-muted)] transition-colors hover:bg-[var(--studio-thread-hover)] hover:text-[var(--studio-thread-ink-soft)]"
            aria-label="Close project context"
          >
            ×
          </button>
        ) : null}
      </div>

      <CurrentMilestoneSection context={context} />
      <RecentFilesSection context={context} />
      <TimelineSection context={context} />
      <TeamSection context={context} />
    </aside>
  );
}

function Section({
  title,
  icon: Icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: typeof CalendarClock;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-2xl border border-[var(--studio-thread-line)] bg-[var(--studio-thread-card)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.10em] text-[var(--studio-thread-ink-muted)]">
          <Icon className="h-3.5 w-3.5 text-[var(--studio-thread-accent-text)]" aria-hidden />
          {title}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[var(--studio-thread-ink-muted)] transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>
      {open ? <div className="border-t border-[var(--studio-thread-line-soft)] px-3 py-3">{children}</div> : null}
    </section>
  );
}

function CurrentMilestoneSection({ context }: { context: ProjectThreadContext }) {
  const milestone = context.currentMilestone;
  if (!milestone) {
    return (
      <Section title="Current milestone" icon={CalendarClock}>
        <p className="text-[12px] text-[var(--studio-thread-ink-muted)]">No active milestone yet.</p>
      </Section>
    );
  }

  const statusBadge = (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] ${
        milestone.status === "approved"
          ? "bg-[var(--studio-thread-success)]/15 text-[var(--studio-thread-success)]"
          : milestone.status === "in_progress"
            ? "bg-[var(--studio-thread-accent-soft)] text-[var(--studio-thread-accent-text)]"
            : milestone.status === "blocked"
              ? "bg-red-500/15 text-red-300"
              : "bg-[var(--studio-thread-hover)] text-[var(--studio-thread-ink-muted)]"
      }`}
    >
      {milestone.status.replace("_", " ")}
    </span>
  );

  return (
    <Section title="Current milestone" icon={CalendarClock}>
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-[14px] font-semibold leading-tight text-[var(--studio-thread-ink)]">
          {milestone.name}
        </h4>
        {statusBadge}
      </div>
      {milestone.description ? (
        <p className="mt-1.5 text-[12px] leading-snug text-[var(--studio-thread-ink-soft)]">
          {milestone.description}
        </p>
      ) : null}
      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--studio-thread-ink-muted)]">
        <Clock4 className="h-3 w-3" aria-hidden />
        <span>{milestone.dueLabel || "Due TBD"}</span>
      </div>
    </Section>
  );
}

function RecentFilesSection({ context }: { context: ProjectThreadContext }) {
  if (context.recentFiles.length === 0) {
    return (
      <Section title="Recent files" icon={Folder}>
        <p className="text-[12px] text-[var(--studio-thread-ink-muted)]">
          No files shared yet. Files appear here when the team uploads
          deliverables.
        </p>
      </Section>
    );
  }
  return (
    <Section title="Recent files" icon={Folder}>
      <ul className="flex flex-col gap-2">
        {context.recentFiles.map((file) => {
          const isImage =
            (file.fileType || "").toLowerCase().includes("image") ||
            Boolean(file.thumbnailUrl);
          return (
            <li key={file.id}>
              <a
                href={file.url || "#"}
                target={file.url ? "_blank" : undefined}
                rel={file.url ? "noopener noreferrer" : undefined}
                className="group flex items-center gap-2.5 rounded-xl border border-[var(--studio-thread-line-soft)] bg-[var(--studio-thread-hover)] px-2 py-1.5 transition-colors hover:bg-[var(--studio-thread-hover)]"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg ${
                    isImage
                      ? "bg-[var(--studio-thread-inset)]"
                      : "bg-[var(--studio-thread-accent-soft)] text-[var(--studio-thread-accent-text)]"
                  }`}
                >
                  {isImage && file.thumbnailUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={file.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : isImage ? (
                    <ImageIcon className="h-4 w-4" aria-hidden />
                  ) : (
                    <FileText className="h-4 w-4" aria-hidden />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-medium text-[var(--studio-thread-ink)]">
                    {file.label}
                  </div>
                  <div className="text-[10px] tabular-nums text-[var(--studio-thread-ink-muted)]">
                    {formatMessageTimestamp(file.sharedAt)}
                  </div>
                </div>
              </a>
            </li>
          );
        })}
      </ul>
      <a
        href="../files"
        className="mt-3 block text-center text-[11px] font-medium text-[var(--studio-thread-accent-text)] hover:underline"
      >
        View all files
      </a>
    </Section>
  );
}

function TimelineSection({ context }: { context: ProjectThreadContext }) {
  const timeline = context.timeline;
  if (timeline.length === 0) {
    return (
      <Section title="Project timeline" icon={CalendarClock} defaultOpen={false}>
        <p className="text-[12px] text-[var(--studio-thread-ink-muted)]">Timeline will appear here as milestones are added.</p>
      </Section>
    );
  }

  // Limit to 7 visible per spec — collapse older completed.
  const visible = timeline.length <= 7
    ? timeline
    : [
        ...timeline.filter((m) => m.status !== "approved").slice(0, 6),
        ...timeline.filter((m) => m.status === "approved").slice(-1),
      ];

  return (
    <Section title="Project timeline" icon={CalendarClock} defaultOpen={false}>
      <ol className="relative flex flex-col gap-3 pl-4">
        <span
          aria-hidden
          className="absolute left-1.5 top-1.5 bottom-1.5 w-px bg-[var(--studio-thread-hover)]"
        />
        {visible.map((stage) => {
          const isComplete = stage.status === "approved";
          const isCurrent = stage.status === "in_progress";
          return (
            <li key={stage.id} className="relative pl-3">
              <span
                aria-hidden
                className={`absolute -left-[2px] top-1 flex h-3 w-3 items-center justify-center rounded-full border ${
                  isComplete
                    ? "border-[var(--studio-thread-success)] bg-[var(--studio-thread-success)] text-[var(--studio-thread-canvas)]"
                    : isCurrent
                      ? "border-[var(--studio-thread-accent)] bg-[var(--studio-thread-accent-soft)] motion-safe:animate-[studio-msg-pulse_2.4s_ease-in-out_infinite]"
                      : "border-[var(--studio-thread-line)] bg-transparent"
                }`}
              >
                {isComplete ? <Check className="h-2 w-2" /> : null}
              </span>
              <div className="text-[12px] font-medium leading-tight text-[var(--studio-thread-ink)]">
                {stage.name}
              </div>
              <div className="mt-0.5 text-[10px] tabular-nums text-[var(--studio-thread-ink-muted)]">
                {stage.dueLabel}
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

function TeamSection({ context }: { context: ProjectThreadContext }) {
  if (context.team.length === 0) {
    return (
      <Section title="Studio team" icon={Users} defaultOpen={false}>
        <p className="text-[12px] text-[var(--studio-thread-ink-muted)]">
          The Studio team for this project will appear here.
        </p>
      </Section>
    );
  }
  return (
    <Section title="Studio team" icon={Users} defaultOpen={false}>
      <ul className="flex flex-col gap-2">
        {context.team.map((member) => {
          const initials = (member.name || "")
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase() || "")
            .join("") || "S";
          return (
            <li key={member.id} className="flex items-center gap-2.5">
              <span
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--studio-thread-accent-soft)] to-transparent text-[11px] font-semibold text-[var(--studio-thread-accent-text)]"
                aria-hidden
              >
                {initials}
                {member.isOnline ? (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--studio-thread-card)] bg-[var(--studio-thread-accent)]"
                    aria-label="Active"
                  />
                ) : null}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-medium leading-tight text-[var(--studio-thread-ink)]">
                  {member.name}
                </div>
                <div className="text-[10px] uppercase tracking-[0.06em] text-[var(--studio-thread-ink-muted)]">
                  {member.label}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
