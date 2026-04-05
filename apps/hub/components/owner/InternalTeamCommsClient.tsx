"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HenryCoActivityIndicator } from "@henryco/ui";
import { Pin, Reply, Search, Send, X } from "lucide-react";

type Thread = {
  id: string;
  slug: string;
  kind: string;
  title: string;
  division: string | null;
  created_at: string;
  updated_at: string;
  unread_count: number;
  pinned: boolean;
};

type MessageRow = {
  id: string;
  thread_id: string;
  author_id: string | null;
  author_label: string | null;
  body: string;
  parent_id: string | null;
  created_at: string;
};

export default function InternalTeamCommsClient() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [replyTo, setReplyTo] = useState<MessageRow | null>(null);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [roomTitle, setRoomTitle] = useState("");
  const [roomKind, setRoomKind] = useState<Thread["kind"]>("group");
  const [roomDivision, setRoomDivision] = useState("");
  const [roomWelcome, setRoomWelcome] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 280);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const loadThreads = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent);
    if (!silent) setLoadingThreads(true);
    setError(null);
    try {
      const q = debouncedSearch ? `?q=${encodeURIComponent(debouncedSearch)}` : "";
      const res = await fetch(`/api/owner/internal-comms/threads${q}`, { cache: "no-store" });
      const payload = (await res.json()) as { threads?: Thread[]; error?: string };
      const list = Array.isArray(payload.threads) ? payload.threads : [];
      setThreads(list);
      setActiveId((prev) => {
        if (prev && list.some((t) => t.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
    } catch {
      if (!silent) setError("Could not load internal threads.");
    } finally {
      if (!silent) setLoadingThreads(false);
    }
  }, [debouncedSearch]);

  const loadMessages = useCallback(async (threadId: string) => {
    setLoadingMessages(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/owner/internal-comms/messages?threadId=${encodeURIComponent(threadId)}&limit=80`,
        { cache: "no-store" }
      );
      const payload = (await res.json()) as { messages?: MessageRow[]; error?: string };
      if (!res.ok) {
        setError(payload.error || "Could not load messages.");
        setMessages([]);
        return;
      }
      setMessages(Array.isArray(payload.messages) ? payload.messages : []);
      void loadThreads({ silent: true });
    } catch {
      setError("Could not load messages.");
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [loadThreads]);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (activeId) void loadMessages(activeId);
  }, [activeId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeId) || null,
    [threads, activeId]
  );

  const parentById = useMemo(() => {
    const map = new Map<string, MessageRow>();
    for (const m of messages) map.set(m.id, m);
    return map;
  }, [messages]);

  async function togglePin(thread: Thread, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const res = await fetch("/api/owner/internal-comms/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: thread.id, pinned: !thread.pinned }),
      });
      if (!res.ok) return;
      setThreads((cur) =>
        cur.map((t) => (t.id === thread.id ? { ...t, pinned: !t.pinned } : t))
      );
      void loadThreads({ silent: true });
    } catch {
      /* ignore */
    }
  }

  async function handleSend() {
    const text = draft.trim();
    if (!activeId || !text || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/owner/internal-comms/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: activeId,
          body: text,
          parentId: replyTo?.id ?? null,
        }),
      });
      const payload = (await res.json()) as { message?: MessageRow; error?: string };
      if (!res.ok) {
        setError(payload.error || "Send failed.");
        return;
      }
      if (payload.message) {
        setMessages((current) => [...current, payload.message as MessageRow]);
      } else {
        await loadMessages(activeId);
      }
      setDraft("");
      setReplyTo(null);
      void loadThreads({ silent: true });
    } catch {
      setError("Send failed.");
    } finally {
      setSending(false);
    }
  }

  async function handleCreateRoom() {
    const title = roomTitle.trim();
    if (!title || creatingRoom) return;

    setCreatingRoom(true);
    setError(null);
    try {
      const res = await fetch("/api/owner/internal-comms/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          kind: roomKind,
          division: roomDivision.trim() || null,
          welcome: roomWelcome.trim() || null,
        }),
      });
      const payload = (await res.json()) as { thread?: Thread; error?: string };
      if (!res.ok || !payload.thread) {
        setError(payload.error || "Could not create the room.");
        return;
      }
      setRoomTitle("");
      setRoomDivision("");
      setRoomWelcome("");
      await loadThreads({ silent: true });
      setActiveId(payload.thread.id);
    } catch {
      setError("Could not create the room.");
    } finally {
      setCreatingRoom(false);
    }
  }

  if (loadingThreads && threads.length === 0) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)]">
        <HenryCoActivityIndicator className="text-[var(--acct-gold)]" label="Loading channels" />
        <span className="sr-only">Loading internal communications</span>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,260px)_1fr]">
      <aside className="space-y-3 rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-3">
        <div className="rounded-[1.15rem] border border-[var(--acct-line)] bg-[var(--acct-bg)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--acct-muted)]">
            Governance
          </p>
          <div className="mt-3 space-y-2">
            <input
              value={roomTitle}
              onChange={(e) => setRoomTitle(e.target.value)}
              placeholder="New room title"
              className="w-full rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-3 py-2.5 text-sm text-[var(--acct-ink)] outline-none focus:border-[var(--acct-gold)]"
            />
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <select
                value={roomKind}
                onChange={(e) => setRoomKind(e.target.value as Thread["kind"])}
                className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-3 py-2.5 text-sm text-[var(--acct-ink)] outline-none focus:border-[var(--acct-gold)]"
                aria-label="Room type"
              >
                <option value="group">Group room</option>
                <option value="broadcast">Broadcast room</option>
                <option value="announcement">Announcement room</option>
                <option value="dm">Direct room</option>
              </select>
              <input
                value={roomDivision}
                onChange={(e) => setRoomDivision(e.target.value)}
                placeholder="Division slug"
                className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-3 py-2.5 text-sm text-[var(--acct-ink)] outline-none focus:border-[var(--acct-gold)]"
              />
            </div>
            <textarea
              value={roomWelcome}
              onChange={(e) => setRoomWelcome(e.target.value)}
              rows={3}
              placeholder="Optional opening message or governance note…"
              className="w-full rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-3 py-2.5 text-sm text-[var(--acct-ink)] outline-none focus:border-[var(--acct-gold)]"
            />
            <button
              type="button"
              onClick={() => void handleCreateRoom()}
              disabled={creatingRoom || !roomTitle.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--acct-gold)] px-4 py-2.5 text-sm font-semibold text-[var(--market-noir,#1a1814)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creatingRoom ? (
                <HenryCoActivityIndicator
                  size="sm"
                  className="text-[var(--market-noir,#1a1814)]"
                  label="Creating room"
                />
              ) : (
                "Create governed room"
              )}
            </button>
          </div>
        </div>

        <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--acct-muted)]">
          Channels
        </p>
        <div className="relative px-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--acct-muted)]"
            aria-hidden
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search channels…"
            className="w-full rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg)] py-2.5 pl-9 pr-3 text-sm text-[var(--acct-ink)] outline-none focus:border-[var(--acct-gold)]"
            aria-label="Search channels"
          />
        </div>
        {threads.length === 0 ? (
          <p className="px-2 text-sm text-[var(--acct-muted)]">
            No threads match your search. Apply Hub database migrations for internal comms, then refresh.
          </p>
        ) : (
          <ul className="space-y-1">
            {threads.map((t) => (
              <li key={t.id} className="flex items-stretch gap-1">
                <button
                  type="button"
                  onClick={() => setActiveId(t.id)}
                  className={`min-w-0 flex-1 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                    t.id === activeId
                      ? "bg-[var(--acct-gold-soft)] text-[var(--acct-ink)]"
                      : "text-[var(--acct-muted)] hover:bg-[var(--acct-surface)]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {t.pinned ? (
                      <Pin className="h-3.5 w-3.5 shrink-0 text-[var(--acct-gold)]" aria-hidden />
                    ) : null}
                    <span className="truncate">{t.title}</span>
                  </span>
                  {t.unread_count > 0 ? (
                    <span className="mt-1 inline-flex rounded-full bg-[var(--acct-gold)] px-2 py-0.5 text-[10px] font-bold text-[var(--market-noir,#1a1814)]">
                      {t.unread_count > 99 ? "99+" : t.unread_count} new
                    </span>
                  ) : null}
                </button>
                <button
                  type="button"
                  title={t.pinned ? "Unpin channel" : "Pin channel"}
                  onClick={(e) => void togglePin(t, e)}
                  className="shrink-0 rounded-xl border border-transparent px-2 text-[var(--acct-muted)] hover:border-[var(--acct-line)] hover:bg-[var(--acct-surface)]"
                >
                  <Pin className={`h-4 w-4 ${t.pinned ? "text-[var(--acct-gold)]" : ""}`} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <section className="flex min-h-[420px] flex-col rounded-[1.5rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)]">
        <header className="border-b border-[var(--acct-line)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--acct-ink)]">
            {activeThread?.title || "Internal chat"}
          </h2>
          <p className="mt-1 text-xs text-[var(--acct-muted)]">
            Owner-protected HQ surface. Reply threads, search channels, and unread badges require the members
            migration applied in Supabase.
          </p>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4" style={{ maxHeight: "min(52vh, 520px)" }}>
          {error ? (
            <div className="rounded-xl bg-[var(--acct-red-soft)] px-4 py-3 text-sm text-[var(--acct-red)]">
              {error}
            </div>
          ) : null}
          {loadingMessages ? (
            <div className="flex justify-center py-12">
              <HenryCoActivityIndicator className="text-[var(--acct-gold)]" label="Loading messages" />
            </div>
          ) : (
            messages.map((m) => {
              const parent = m.parent_id ? parentById.get(m.parent_id) : null;
              return (
                <article
                  key={m.id}
                  className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-3"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-[var(--acct-ink)]">
                      {m.author_label || "Team"}
                    </span>
                    <time className="text-xs text-[var(--acct-muted)]" dateTime={m.created_at}>
                      {new Date(m.created_at).toLocaleString()}
                    </time>
                  </div>
                  {parent ? (
                    <p className="mt-2 line-clamp-2 rounded-lg border border-[var(--acct-line)] bg-[var(--acct-bg)] px-3 py-2 text-xs text-[var(--acct-muted)]">
                      <span className="font-semibold text-[var(--acct-ink)]">↩ {parent.author_label}: </span>
                      {parent.body}
                    </p>
                  ) : null}
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--acct-ink)]">
                    {m.body}
                  </p>
                  <button
                    type="button"
                    onClick={() => setReplyTo(m)}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--owner-accent)]"
                  >
                    <Reply className="h-3.5 w-3.5" aria-hidden />
                    Reply in thread
                  </button>
                </article>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <footer className="border-t border-[var(--acct-line)] p-4">
          {replyTo ? (
            <div className="mb-3 flex items-start justify-between gap-2 rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-3 py-2 text-xs text-[var(--acct-muted)]">
              <div>
                <span className="font-semibold text-[var(--acct-ink)]">Replying to {replyTo.author_label}</span>
                <p className="mt-1 line-clamp-2">{replyTo.body}</p>
              </div>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="shrink-0 rounded-lg p-1 text-[var(--acct-muted)] hover:bg-[var(--acct-surface)]"
                aria-label="Cancel reply"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              placeholder="Write an internal message…"
              className="min-h-[88px] flex-1 resize-y rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg)] px-4 py-3 text-sm text-[var(--acct-ink)] outline-none focus:border-[var(--acct-gold)]"
            />
            <button
              type="button"
              disabled={sending || !draft.trim() || !activeId}
              onClick={() => void handleSend()}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--acct-gold)] px-6 text-sm font-semibold text-[var(--market-noir,#1a1814)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? (
                <HenryCoActivityIndicator size="sm" className="text-[var(--market-noir,#1a1814)]" label="Sending" />
              ) : (
                <Send className="h-4 w-4" aria-hidden />
              )}
              Send
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
