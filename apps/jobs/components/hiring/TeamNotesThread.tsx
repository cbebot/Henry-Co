"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { JobsCopy } from "@henryco/i18n";

type Note = {
  id: string;
  parentNoteId: string | null;
  authorUserId: string;
  authorName: string | null;
  body: string;
  mentions: string[];
  createdAt: string;
};

type Member = { userId: string; name: string | null };

type Props = {
  applicationId: string;
  notes: Note[];
  members: Member[];
  currentUserId: string;
  copy: JobsCopy["employerHiringSuite"];
};

/**
 * V3-70 S4 — internal team-notes thread with @mentions. Mentions are chosen from
 * business members only (the affordance can't reference a non-member), which maps
 * exactly to the server-side member-only resolution + per-mention notification.
 */
export function TeamNotesThread({ applicationId, notes, members, currentUserId, copy }: Props) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [mentions, setMentions] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [, startTransition] = useTransition();

  const mentionable = useMemo(() => members.filter((m) => m.userId !== currentUserId), [members, currentUserId]);
  const roots = notes.filter((n) => !n.parentNoteId);
  const repliesByParent = useMemo(() => {
    const map = new Map<string, Note[]>();
    for (const n of notes) {
      if (n.parentNoteId) map.set(n.parentNoteId, [...(map.get(n.parentNoteId) ?? []), n]);
    }
    return map;
  }, [notes]);

  function toggleMention(userId: string) {
    setMentions((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function post() {
    const trimmed = body.trim();
    if (!trimmed) return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch("/api/employer/hiring/comment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          applicationId,
          body: trimmed,
          parentNoteId: replyTo,
          mentions: Array.from(mentions),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message || copy.notesError);
        return;
      }
      setBody("");
      setReplyTo(null);
      setMentions(new Set());
      startTransition(() => router.refresh());
    } catch {
      setError(copy.notesError);
    } finally {
      setPosting(false);
    }
  }

  const renderNote = (note: Note, isReply = false) => (
    <div key={note.id} className={`rounded-2xl bg-[var(--jobs-paper-soft)] p-3 ${isReply ? "ml-6 mt-2" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{note.authorName ?? "Teammate"}</span>
        <span className="text-xs text-[var(--jobs-muted)]">{new Date(note.createdAt).toLocaleString()}</span>
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{note.body}</p>
      {!isReply && (
        <button
          type="button"
          onClick={() => setReplyTo(replyTo === note.id ? null : note.id)}
          className="mt-1 text-xs font-semibold text-[var(--jobs-accent)]"
        >
          {copy.notesReply}
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      {roots.length === 0 ? (
        <p className="rounded-2xl bg-[var(--jobs-paper-soft)] p-4 text-center text-sm text-[var(--jobs-muted)]">
          {copy.notesEmpty}
        </p>
      ) : (
        <div className="space-y-2">
          {roots.map((root) => (
            <div key={root.id}>
              {renderNote(root)}
              {(repliesByParent.get(root.id) ?? []).map((reply) => renderNote(reply, true))}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-[var(--jobs-line)] p-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={copy.notesComposerPlaceholder}
          rows={3}
          className="w-full resize-y rounded-xl border border-[var(--jobs-line)] bg-[var(--jobs-paper)] p-2 text-sm"
        />
        {mentionable.length > 0 && (
          <div className="mt-2">
            <span className="text-xs text-[var(--jobs-muted)]">{copy.notesMentionLabel}:</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {mentionable.map((m) => {
                const active = mentions.has(m.userId);
                return (
                  <button
                    key={m.userId}
                    type="button"
                    onClick={() => toggleMention(m.userId)}
                    aria-pressed={active}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      active ? "bg-[var(--jobs-accent)] text-white" : "bg-[var(--jobs-accent-soft)] text-[var(--jobs-ink)]"
                    }`}
                  >
                    @{m.name ?? m.userId.slice(0, 6)}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-[var(--jobs-muted)]">{copy.notesMentionHint}</p>
          </div>
        )}
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={post}
            disabled={posting || !body.trim()}
            className="rounded-xl bg-[var(--jobs-accent)] px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {posting ? copy.notesPosting : copy.notesPost}
          </button>
          {replyTo && (
            <span className="text-xs text-[var(--jobs-muted)]">↳ {copy.notesReply}</span>
          )}
        </div>
        {error && (
          <p role="status" className="mt-2 text-sm text-[var(--jobs-warning)]">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
