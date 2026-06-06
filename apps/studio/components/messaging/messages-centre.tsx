"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type {
  ProjectThreadSummary,
  ThreadInitialState,
} from "@/lib/messaging/types";
import { formatMessageTimestamp } from "@/lib/messaging/utils";
import { ProjectThread } from "./thread";
import { EmptyThreadState } from "./empty-state";

type Props = {
  summaries: ProjectThreadSummary[];
  /** Pre-loaded initial state for the thread that should open by default. */
  initialThread?: ThreadInitialState | null;
  /** URL template with {projectId} placeholder. Resolved on the client.
   * Replaces the previous function-prop pattern which RSC can't pass
   * across the server/client boundary. */
  hrefTemplate?: string;
};

/**
 * Surface 2 — the unified messages centre. Two-column on desktop:
 * project thread list on the left, selected thread on the right.
 * On mobile the list and the open thread are mutually exclusive
 * full-screen views.
 */
export function MessagesCentre({
  summaries,
  initialThread,
  hrefTemplate,
}: Props) {
  const hrefForProject = hrefTemplate
    ? (projectId: string) => hrefTemplate.replace("{projectId}", projectId)
    : undefined;
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    initialThread?.context.projectId || summaries[0]?.projectId || null,
  );
  const [openOnMobile, setOpenOnMobile] = useState<boolean>(
    Boolean(initialThread),
  );

  const sorted = useMemo(
    () =>
      [...summaries].sort((a, b) => {
        const aTime = a.lastMessage
          ? new Date(a.lastMessage.createdAt).getTime()
          : 0;
        const bTime = b.lastMessage
          ? new Date(b.lastMessage.createdAt).getTime()
          : 0;
        return bTime - aTime;
      }),
    [summaries],
  );

  if (summaries.length === 0) {
    return (
      <div className="flex h-full min-h-0 w-full items-center justify-center bg-[var(--studio-thread-canvas)] p-6">
        <EmptyThreadState
          projectName="your projects"
          teamLabel={null}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-[var(--studio-thread-canvas)]">
      {/* List column */}
      <div
        className={`flex min-w-0 flex-col border-r border-[var(--studio-thread-line)] bg-[var(--studio-thread-rail)] sm:w-[320px] sm:shrink-0 ${
          openOnMobile ? "hidden sm:flex" : "flex w-full"
        }`}
      >
        <header className="shrink-0 border-b border-[var(--studio-thread-line)] px-4 py-3">
          <h1 className="text-[16px] font-semibold tracking-[-0.005em] text-[var(--studio-thread-ink)]">
            Messages
          </h1>
          <p className="mt-0.5 text-[11px] text-[var(--studio-thread-ink-muted)]">
            {sorted.length} project{sorted.length === 1 ? "" : "s"} ·
            <span className="ml-1 text-[var(--studio-thread-accent-text)]">
              {sorted.reduce((acc, s) => acc + s.unreadCount, 0)} unread
            </span>
          </p>
        </header>
        <ul className="flex-1 overflow-y-auto">
          {sorted.map((summary) => {
            const isSelected = summary.projectId === selectedProjectId;
            return (
              <li key={summary.projectId}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProjectId(summary.projectId);
                    setOpenOnMobile(true);
                  }}
                  className={`flex w-full items-start gap-3 border-b border-[var(--studio-thread-line-soft)] px-4 py-3 text-left transition-colors ${
                    isSelected
                      ? "bg-[var(--studio-thread-inset)]"
                      : "hover:bg-[var(--studio-thread-hover)]"
                  }`}
                  aria-current={isSelected ? "true" : undefined}
                >
                  <span
                    className={`mt-1 flex h-2 w-2 shrink-0 items-center justify-center rounded-full ${
                      summary.unreadCount > 0
                        ? "bg-[var(--studio-thread-accent)]"
                        : "bg-transparent"
                    }`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h2
                        className={`truncate text-[13px] font-semibold ${
                          summary.unreadCount > 0
                            ? "text-[var(--studio-thread-ink)]"
                            : "text-[var(--studio-thread-ink-soft)]"
                        }`}
                      >
                        {summary.projectTitle}
                      </h2>
                      {summary.lastMessage ? (
                        <time
                          className="shrink-0 text-[10px] tabular-nums text-[var(--studio-thread-ink-muted)]"
                          dateTime={summary.lastMessage.createdAt}
                        >
                          {formatMessageTimestamp(
                            summary.lastMessage.createdAt,
                          )}
                        </time>
                      ) : null}
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-[12px] text-[var(--studio-thread-ink-muted)]">
                      {summary.lastMessage ? (
                        <>
                          <span className="font-medium text-[var(--studio-thread-ink-soft)]">
                            {summary.lastMessage.senderName}:
                          </span>{" "}
                          {summary.lastMessage.bodyExcerpt || "(attachment)"}
                        </>
                      ) : (
                        <span className="italic text-[var(--studio-thread-ink-faint)]">
                          No messages yet
                        </span>
                      )}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded-full bg-[var(--studio-thread-hover)] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.08em] text-[var(--studio-thread-ink-muted)]">
                        {summary.projectStatus.replace("_", " ")}
                      </span>
                      {summary.unreadCount > 0 ? (
                        <span className="rounded-full bg-[var(--studio-thread-accent-soft)] px-1.5 py-0.5 text-[9px] font-medium tabular-nums text-[var(--studio-thread-accent-text)]">
                          {summary.unreadCount} new
                        </span>
                      ) : null}
                    </div>
                    {hrefForProject ? (
                      <Link
                        href={hrefForProject(summary.projectId)}
                        className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-[var(--studio-thread-accent-text)] hover:text-[var(--studio-thread-accent-text)]"
                      >
                        Project workspace
                        <ArrowRight className="h-3 w-3" aria-hidden />
                      </Link>
                    ) : null}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Thread column */}
      <div
        className={`flex min-w-0 flex-1 flex-col ${
          openOnMobile ? "flex" : "hidden sm:flex"
        }`}
      >
        {selectedProjectId && initialThread &&
        initialThread.context.projectId === selectedProjectId ? (
          <ProjectThread
            initial={initialThread}
            showBack
            onBack={() => setOpenOnMobile(false)}
            hideContextPanel
          />
        ) : (
          <ThreadColumnPlaceholder
            projectId={selectedProjectId}
            hrefForProject={hrefForProject}
            onBack={() => setOpenOnMobile(false)}
            summary={
              sorted.find((s) => s.projectId === selectedProjectId) ?? null
            }
          />
        )}
      </div>
    </div>
  );
}

function ThreadColumnPlaceholder({
  projectId,
  hrefForProject,
  summary,
  onBack,
}: {
  projectId: string | null;
  hrefForProject?: (projectId: string) => string;
  summary: ProjectThreadSummary | null;
  onBack: () => void;
}) {
  if (!projectId || !summary) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-[13px] text-[var(--studio-thread-ink-muted)]">
        Select a project to open its conversation.
      </div>
    );
  }

  const href = hrefForProject ? hrefForProject(projectId) : "#";

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-[var(--studio-thread-line)] bg-[var(--studio-thread-rail)] px-3 py-2.5 sm:px-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full p-1.5 text-[var(--studio-thread-ink-soft)] transition-colors hover:bg-[var(--studio-thread-hover)] hover:text-[var(--studio-thread-ink)] sm:hidden"
          aria-label="Back to message list"
        >
          ←
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[14px] font-semibold tracking-[-0.005em] text-[var(--studio-thread-ink)]">
            {summary.projectTitle}
          </h1>
        </div>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="max-w-md text-[13px] text-[var(--studio-thread-ink-muted)]">
          Open this project&apos;s full conversation, including history, files,
          and team context.
        </p>
        <Link
          href={href}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--studio-thread-accent-line)] bg-[var(--studio-thread-accent-soft)] px-4 py-2 text-[12px] font-medium text-[var(--studio-thread-accent-text)] transition-colors hover:bg-[var(--studio-thread-accent-soft)]"
        >
          Open project conversation
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
