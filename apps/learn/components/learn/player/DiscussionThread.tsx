"use client";

/**
 * DiscussionThread — per-lesson Q&A using messaging-thread shape.
 *
 * V3 PASS 21 contract: per-lesson discussion, replies, instructor highlight,
 * resolved/pinned states. Reads/writes via parent action.
 */

import { useState } from "react";
import { PendingSubmitButton } from "@/components/learn/pending-submit-button";

export type DiscussionEntry = {
  id: string;
  authorDisplayName: string;
  body: string;
  createdAt: string;
  isInstructorReply: boolean;
  isPinned: boolean;
  isResolved: boolean;
  parentId: string | null;
  replies?: DiscussionEntry[];
};

export type DiscussionThreadProps = {
  lessonId: string;
  courseId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  postAction: (formData: FormData) => any;
  entries: DiscussionEntry[];
  labels: {
    title: string;
    empty: string;
    composerPlaceholder: string;
    post: string;
    posting: string;
    reply: string;
    cancelReply: string;
    instructor: string;
    pinned: string;
    resolved: string;
  };
};

function formatLocalDateTime(value: string): string {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

function buildThreadTree(entries: DiscussionEntry[]): DiscussionEntry[] {
  const byParent = new Map<string | null, DiscussionEntry[]>();
  for (const entry of entries) {
    const key = entry.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(entry);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  function attach(entry: DiscussionEntry): DiscussionEntry {
    const children = byParent.get(entry.id) ?? [];
    return { ...entry, replies: children.map(attach) };
  }
  return (byParent.get(null) ?? []).map(attach);
}

function EntryNode({
  entry,
  depth,
  labels,
  onReply,
  replyToId,
}: {
  entry: DiscussionEntry;
  depth: number;
  labels: DiscussionThreadProps["labels"];
  onReply: (id: string | null) => void;
  replyToId: string | null;
}) {
  return (
    <li className={depth > 0 ? "ml-6 border-l border-[var(--learn-line)] pl-4" : ""}>
      <article className="rounded-[1.2rem] border border-[var(--learn-line)] bg-white/5 p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-[var(--learn-ink)]">
            {entry.authorDisplayName}
          </span>
          {entry.isInstructorReply ? (
            <span className="rounded-full border border-[var(--learn-copper)]/40 bg-[var(--learn-copper)]/10 px-2 py-0.5 font-semibold text-[var(--learn-copper)]">
              {labels.instructor}
            </span>
          ) : null}
          {entry.isPinned ? (
            <span className="rounded-full border border-amber-200/40 bg-amber-200/10 px-2 py-0.5 font-semibold text-amber-100">
              {labels.pinned}
            </span>
          ) : null}
          {entry.isResolved ? (
            <span className="rounded-full border border-emerald-200/40 bg-emerald-200/10 px-2 py-0.5 font-semibold text-emerald-100">
              {labels.resolved}
            </span>
          ) : null}
          <span className="ml-auto text-[var(--learn-ink-soft)]">
            {formatLocalDateTime(entry.createdAt)}
          </span>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--learn-ink-soft)]">
          {entry.body}
        </p>
        <button
          type="button"
          onClick={() => onReply(replyToId === entry.id ? null : entry.id)}
          className="mt-2 text-xs font-semibold text-[var(--learn-copper)] underline-offset-2 hover:underline"
        >
          {replyToId === entry.id ? labels.cancelReply : labels.reply}
        </button>
      </article>
      {entry.replies && entry.replies.length > 0 ? (
        <ul className="mt-3 space-y-3">
          {entry.replies.map((reply) => (
            <EntryNode
              key={reply.id}
              entry={reply}
              depth={depth + 1}
              labels={labels}
              onReply={onReply}
              replyToId={replyToId}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function DiscussionThread({
  lessonId,
  courseId,
  postAction,
  entries,
  labels,
}: DiscussionThreadProps) {
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const tree = buildThreadTree(entries);

  return (
    <section className="rounded-[1.6rem] border border-[var(--learn-line)] bg-white/[0.04] p-6">
      <h3 className="text-base font-semibold tracking-tight text-[var(--learn-ink)]">
        {labels.title}
      </h3>

      <form action={postAction} className="mt-4 space-y-3">
        <input type="hidden" name="lessonId" value={lessonId} />
        <input type="hidden" name="courseId" value={courseId} />
        {replyTo ? <input type="hidden" name="parentId" value={replyTo} /> : null}
        <textarea
          name="body"
          rows={3}
          required
          placeholder={labels.composerPlaceholder}
          className="w-full rounded-2xl border border-[var(--learn-line)] bg-transparent px-4 py-3 text-sm text-[var(--learn-ink)]"
        />
        <div className="flex justify-end">
          <PendingSubmitButton pendingLabel={labels.posting}>{labels.post}</PendingSubmitButton>
        </div>
      </form>

      {tree.length === 0 ? (
        <p className="mt-5 text-sm text-[var(--learn-ink-soft)]">{labels.empty}</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {tree.map((entry) => (
            <EntryNode
              key={entry.id}
              entry={entry}
              depth={0}
              labels={labels}
              onReply={setReplyTo}
              replyToId={replyTo}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
