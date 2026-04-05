"use client";

import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HenryCoActivityIndicator } from "@henryco/ui";
import {
  FileText,
  Image as ImageIcon,
  Mic,
  Paperclip,
  Pin,
  Reply,
  Search,
  Send,
  Settings2,
  Square,
  X,
} from "lucide-react";

type Thread = {
  id: string;
  slug: string;
  kind: string;
  title: string;
  division: string | null;
  visibility?: string | null;
  created_at: string;
  updated_at: string;
  unread_count: number;
  pinned: boolean;
};

type AttachmentRow = {
  id: string;
  kind: string;
  mime_type: string;
  byte_size: number;
  duration_seconds?: number | null;
  file_name?: string | null;
  storage_path: string;
  storage_bucket: string;
};

type MessageRow = {
  id: string;
  thread_id: string;
  author_id: string | null;
  author_label: string | null;
  body: string;
  parent_id: string | null;
  created_at: string;
  delivery_state?: string | null;
  client_nonce?: string | null;
  hq_internal_comm_attachments?: AttachmentRow[] | null;
};

type MemberHit = {
  user_id: string;
  label: string;
  email_hint: string | null;
  source: string;
  can_dm?: boolean;
};

type SearchHit = {
  id: string;
  thread_id: string;
  thread_title: string;
  author_label: string | null;
  body: string;
  created_at: string;
};

type UploadKind = "image" | "video" | "file" | "voice";

function mapMimeToKind(mime: string): UploadKind | null {
  const m = mime.toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "voice";
  return "file";
}

async function fetchSignedUrl(path: string) {
  const res = await fetch(
    `/api/owner/internal-comms/attachments/signed?path=${encodeURIComponent(path)}`,
    { cache: "no-store" }
  );
  const payload = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !payload.url) throw new Error(payload.error || "Could not load media.");
  return payload.url;
}

function AttachmentPreview({ att }: { att: AttachmentRow }) {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const u = await fetchSignedUrl(att.storage_path);
        if (!cancelled) setUrl(u);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Preview failed.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [att.storage_path]);

  if (err) {
    return (
      <p className="mt-2 rounded-lg border border-[var(--acct-line)] bg-[var(--acct-bg)] px-3 py-2 text-xs text-[var(--acct-red)]">
        {err}
      </p>
    );
  }

  if (!url) {
    return (
      <div className="mt-2 flex items-center gap-2 text-xs text-[var(--acct-muted)]">
        <HenryCoActivityIndicator size="sm" className="text-[var(--acct-gold)]" label="Loading attachment" />
        Loading…
      </div>
    );
  }

  if (att.kind === "image") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-2 block overflow-hidden rounded-lg border border-[var(--acct-line)]"
      >
        {/* Signed URLs are API-generated; Next/Image remotePatterns would require config churn. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={att.file_name || "Image"} className="max-h-64 w-full object-contain" />
      </a>
    );
  }

  if (att.kind === "voice" || att.kind === "video") {
    return att.kind === "voice" ? (
      <audio className="mt-2 w-full" controls src={url} preload="metadata">
        <track kind="captions" />
      </audio>
    ) : (
      <video className="mt-2 max-h-72 w-full rounded-lg border border-[var(--acct-line)]" controls src={url} preload="metadata">
        <track kind="captions" />
      </video>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="mt-2 inline-flex items-center gap-2 rounded-lg border border-[var(--acct-line)] bg-[var(--acct-bg)] px-3 py-2 text-xs font-semibold text-[var(--owner-accent)]"
    >
      <FileText className="h-4 w-4" aria-hidden />
      {att.file_name || "Download file"}
    </a>
  );
}

export default function InternalTeamCommsClient() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realtimeDegraded, setRealtimeDegraded] = useState(false);
  const [draft, setDraft] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [debouncedMessageSearch, setDebouncedMessageSearch] = useState("");
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<MessageRow | null>(null);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [roomTitle, setRoomTitle] = useState("");
  const [roomKind, setRoomKind] = useState<Thread["kind"]>("group");
  const [roomDivision, setRoomDivision] = useState("");
  const [roomWelcome, setRoomWelcome] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const [debouncedMemberQuery, setDebouncedMemberQuery] = useState("");
  const [memberHits, setMemberHits] = useState<MemberHit[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [startingDm, setStartingDm] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<BlobPart[]>([]);
  const [selfUserId, setSelfUserId] = useState<string | null>(null);

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return null;
    return createBrowserClient(url, anon);
  }, []);

  useEffect(() => {
    void (async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      setSelfUserId(data.user?.id ?? null);
    })();
  }, [supabase]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 280);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedMessageSearch(messageSearch.trim()), 320);
    return () => window.clearTimeout(t);
  }, [messageSearch]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedMemberQuery(memberQuery.trim()), 320);
    return () => window.clearTimeout(t);
  }, [memberQuery]);

  useEffect(() => {
    if (debouncedMemberQuery.length < 2) {
      setMemberHits([]);
      return;
    }
    let cancelled = false;
    setLoadingMembers(true);
    void (async () => {
      try {
        const res = await fetch(
          `/api/owner/internal-comms/members?q=${encodeURIComponent(debouncedMemberQuery)}`,
          { cache: "no-store" }
        );
        const payload = (await res.json()) as { members?: MemberHit[]; hint?: string | null };
        if (cancelled) return;
        const next = Array.isArray(payload.members) ? payload.members : [];
        setMemberHits(next);
        if (payload.hint && next.length === 0) setError(payload.hint);
      } catch {
        if (!cancelled) setMemberHits([]);
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedMemberQuery]);

  useEffect(() => {
    if (debouncedMessageSearch.length < 2 || !activeId) {
      setSearchHits([]);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    void (async () => {
      try {
        const qs = new URLSearchParams({
          q: debouncedMessageSearch,
          threadId: activeId,
        });
        const res = await fetch(`/api/owner/internal-comms/search?${qs.toString()}`, { cache: "no-store" });
        const payload = (await res.json()) as { results?: SearchHit[] };
        if (!cancelled) setSearchHits(Array.isArray(payload.results) ? payload.results : []);
      } catch {
        if (!cancelled) setSearchHits([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedMessageSearch, activeId]);

  const loadThreads = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent);
    if (!silent) setLoadingThreads(true);
    setError(null);
    try {
      const q = debouncedSearch ? `?q=${encodeURIComponent(debouncedSearch)}` : "";
      const res = await fetch(`/api/owner/internal-comms/threads${q}`, { cache: "no-store" });
      const payload = (await res.json()) as {
        threads?: Thread[];
        degraded?: boolean;
        message?: string;
        error?: string;
      };
      const list = Array.isArray(payload.threads) ? payload.threads : [];
      setThreads(list);
      if (payload.degraded && payload.message) {
        setError(payload.message);
      } else if (payload.error && !silent) {
        setError(payload.error);
      }
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

  const loadMessages = useCallback(
    async (threadId: string, opts?: { silent?: boolean }) => {
      const silent = Boolean(opts?.silent);
      if (!silent) setLoadingMessages(true);
      if (!silent) setError(null);
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
        if (!silent) setLoadingMessages(false);
      }
    },
    [loadThreads]
  );

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (activeId) void loadMessages(activeId);
  }, [activeId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (!supabase || !activeId) return;

    const channel = supabase
      .channel(`hq-ic-${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "hq_internal_comm_messages",
          filter: `thread_id=eq.${activeId}`,
        },
        async (payload) => {
          const row = payload.new as { id?: string };
          const id = row?.id;
          if (!id) return;
          setMessages((cur) => {
            if (cur.some((m) => m.id === id)) return cur;
            return cur;
          });
          const { data, error } = await supabase
            .from("hq_internal_comm_messages")
            .select(
              `
              id,
              thread_id,
              author_id,
              author_label,
              body,
              parent_id,
              created_at,
              delivery_state,
              client_nonce,
              hq_internal_comm_attachments (
                id,
                kind,
                mime_type,
                byte_size,
                duration_seconds,
                file_name,
                storage_path,
                storage_bucket
              )
            `
            )
            .eq("id", id)
            .maybeSingle();
          if (error || !data) {
            setRealtimeDegraded(true);
            void loadMessages(activeId, { silent: true });
            return;
          }
          setMessages((cur) => {
            if (cur.some((m) => m.id === id)) {
              return cur.map((m) => (m.id === id ? (data as MessageRow) : m));
            }
            return [...cur, data as MessageRow];
          });
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setRealtimeDegraded(true);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, activeId, loadMessages]);

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

  async function uploadWithRegister(threadId: string, file: File, kind: UploadKind) {
    const reg = await fetch("/api/owner/internal-comms/attachments/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        byteSize: file.size,
        kind,
      }),
    });
    const payload = (await reg.json()) as {
      attachmentId?: string;
      storagePath?: string;
      bucket?: string;
      mimeType?: string;
      error?: string;
    };
    if (!reg.ok || !payload.attachmentId || !payload.storagePath || !payload.bucket) {
      throw new Error(payload.error || "Could not start upload.");
    }
    if (!supabase) {
      throw new Error("Sign in session is required for secure uploads.");
    }
    const { error: upErr } = await supabase.storage
      .from(payload.bucket)
      .upload(payload.storagePath, file, {
        contentType: payload.mimeType || file.type,
        upsert: false,
      });
    if (upErr) {
      throw new Error(upErr.message || "Upload failed.");
    }
    return {
      attachmentId: payload.attachmentId,
      storagePath: payload.storagePath,
      kind,
      mimeType: payload.mimeType || file.type,
      byteSize: file.size,
      fileName: file.name,
    };
  }

  async function handlePickFiles(files: FileList | null) {
    if (!files?.length || !activeId || uploadBusy) return;
    setUploadBusy(true);
    setError(null);
    try {
      const metas: Array<{
        attachmentId: string;
        storagePath: string;
        kind: UploadKind;
        mimeType: string;
        byteSize: number;
        fileName: string;
        durationSeconds?: number | null;
      }> = [];
      for (const file of Array.from(files)) {
        const kind = mapMimeToKind(file.type || "");
        if (!kind) {
          setError("Unsupported file type.");
          continue;
        }
        const meta = await uploadWithRegister(activeId, file, kind);
        metas.push({ ...meta, durationSeconds: null });
      }
      if (metas.length === 0) return;

      const clientNonce = crypto.randomUUID();
      const res = await fetch("/api/owner/internal-comms/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: activeId,
          body: "",
          parentId: replyTo?.id ?? null,
          clientNonce,
          attachments: metas,
        }),
      });
      const payload = (await res.json()) as { message?: MessageRow; error?: string };
      if (!res.ok) {
        setError(payload.error || "Send failed.");
        return;
      }
      if (payload.message) {
        setMessages((c) => {
          if (c.some((m) => m.id === payload.message!.id)) return c;
          return [...c, payload.message as MessageRow];
        });
      } else {
        await loadMessages(activeId, { silent: true });
      }
      setReplyTo(null);
      void loadThreads({ silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploadBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function toggleRecording() {
    if (!activeId) return;
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordChunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : undefined });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (ev) => {
        if (ev.data.size > 0) recordChunksRef.current.push(ev.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        void (async () => {
          const blob = new Blob(recordChunksRef.current, { type: mr.mimeType || "audio/webm" });
          if (blob.size < 16) return;
          const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: blob.type });
          setUploadBusy(true);
          try {
            const meta = await uploadWithRegister(activeId, file, "voice");
            const clientNonce = crypto.randomUUID();
            const res = await fetch("/api/owner/internal-comms/messages", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                threadId: activeId,
                body: "",
                parentId: replyTo?.id ?? null,
                clientNonce,
                attachments: [{ ...meta, durationSeconds: null }],
              }),
            });
            const payload = (await res.json()) as { message?: MessageRow; error?: string };
            if (!res.ok) {
              setError(payload.error || "Could not save voice note.");
              return;
            }
            if (payload.message) {
              setMessages((c) => [...c, payload.message as MessageRow]);
            } else {
              await loadMessages(activeId, { silent: true });
            }
            setReplyTo(null);
            void loadThreads({ silent: true });
          } catch (e) {
            setError(e instanceof Error ? e.message : "Voice note failed.");
          } finally {
            setUploadBusy(false);
          }
        })();
      };
      mr.start(200);
      setIsRecording(true);
    } catch {
      setError("Microphone access was denied or is unavailable.");
    }
  }

  async function handleSend() {
    const text = draft.trim();
    if (!activeId || (!text && !uploadBusy) || sending) return;
    if (!text) return;
    setSending(true);
    setError(null);
    const clientNonce = crypto.randomUUID();
    try {
      const res = await fetch("/api/owner/internal-comms/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: activeId,
          body: text,
          parentId: replyTo?.id ?? null,
          clientNonce,
        }),
      });
      const payload = (await res.json()) as { message?: MessageRow; error?: string };
      if (!res.ok) {
        setError(payload.error || "Send failed.");
        return;
      }
      if (payload.message) {
        setMessages((current) => {
          if (current.some((m) => m.id === payload.message!.id)) return current;
          return [...current, payload.message as MessageRow];
        });
      } else {
        await loadMessages(activeId, { silent: true });
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

  async function startDirectChat(peerUserId: string) {
    if (!peerUserId || startingDm) return;
    setStartingDm(true);
    setError(null);
    try {
      const res = await fetch("/api/owner/internal-comms/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peerUserId }),
      });
      const payload = (await res.json()) as { thread?: Thread; error?: string };
      if (!res.ok || !payload.thread) {
        setError(payload.error || "Could not start direct chat.");
        return;
      }
      setMemberQuery("");
      setMemberHits([]);
      await loadThreads({ silent: true });
      setActiveId(payload.thread.id);
    } catch {
      setError("Could not start direct chat.");
    } finally {
      setStartingDm(false);
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
            Direct chat
          </p>
          <p className="mt-2 text-xs leading-5 text-[var(--acct-muted)]">
            Search people in your workforce or owner roster (type at least 2 characters). Starting a chat only works for
            authorized staff or owner profiles.
          </p>
          <div className="relative mt-3">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--acct-muted)]"
              aria-hidden
            />
            <input
              type="search"
              value={memberQuery}
              onChange={(e) => setMemberQuery(e.target.value)}
              placeholder="Search people…"
              className="w-full rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] py-2.5 pl-9 pr-3 text-sm text-[var(--acct-ink)] outline-none focus:border-[var(--acct-gold)]"
              aria-label="Search people for direct chat"
            />
          </div>
          {loadingMembers ? (
            <p className="mt-2 text-xs text-[var(--acct-muted)]">Searching…</p>
          ) : memberHits.length > 0 ? (
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg)] p-1">
              {memberHits.map((m) => (
                <li key={m.user_id}>
                  <button
                    type="button"
                    disabled={startingDm || m.can_dm === false}
                    title={
                      m.can_dm === false
                        ? "Add this person to workforce or owner profiles before direct messaging."
                        : undefined
                    }
                    onClick={() => void startDirectChat(m.user_id)}
                    className="flex w-full flex-col rounded-lg px-2 py-2 text-left text-sm hover:bg-[var(--acct-surface)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="font-semibold text-[var(--acct-ink)]">{m.label}</span>
                    <span className="text-[11px] text-[var(--acct-muted)]">
                      {m.email_hint || m.user_id.slice(0, 8)}… · {m.source}
                      {m.can_dm === false ? " · roster only" : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : debouncedMemberQuery.length >= 2 ? (
            <p className="mt-2 text-xs text-[var(--acct-muted)]">No matches. Try another email fragment or name.</p>
          ) : null}
        </div>

        <div className="rounded-[1.15rem] border border-[var(--acct-line)] bg-[var(--acct-bg)] p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--acct-muted)]">
              Governance
            </p>
            <Link
              href="/owner/settings/comms"
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--acct-line)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--acct-ink)] hover:bg-[var(--acct-surface)]"
            >
              <Settings2 className="h-3 w-3" aria-hidden />
              Rules
            </Link>
          </div>
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
            No channels match your search. If storage is not provisioned yet, apply HenryCo Hub Supabase migrations and
            wait for the schema cache to refresh.
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
            Owner-protected HQ surface. Messages use Supabase row-level security, private storage, and realtime delivery
            with safe fallback to REST.
          </p>
          {realtimeDegraded ? (
            <p className="mt-2 text-xs font-medium text-[var(--acct-gold)]">
              Live updates degraded — history stays accurate; refresh if something looks stale.
            </p>
          ) : null}
          <div className="relative mt-3">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--acct-muted)]"
              aria-hidden
            />
            <input
              type="search"
              value={messageSearch}
              onChange={(e) => setMessageSearch(e.target.value)}
              placeholder="Search in this thread…"
              className="w-full rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg)] py-2.5 pl-9 pr-3 text-sm text-[var(--acct-ink)] outline-none focus:border-[var(--acct-gold)]"
              aria-label="Search messages in thread"
            />
          </div>
          {searchLoading ? (
            <p className="mt-2 text-xs text-[var(--acct-muted)]">Searching messages…</p>
          ) : searchHits.length > 0 ? (
            <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-2 text-xs">
              {searchHits.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    className="w-full rounded-lg px-2 py-1.5 text-left hover:bg-[var(--acct-surface)]"
                    onClick={() => {
                      document.getElementById(`msg-${h.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                  >
                    <span className="font-semibold text-[var(--acct-ink)]">{h.author_label || "Team"}</span>
                    <span className="block line-clamp-2 text-[var(--acct-muted)]">{h.body}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : debouncedMessageSearch.length >= 2 ? (
            <p className="mt-2 text-xs text-[var(--acct-muted)]">No matches in this thread.</p>
          ) : null}
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4" style={{ maxHeight: "min(52vh, 520px)" }}>
          {error ? (
            <div className="rounded-xl bg-[var(--acct-red-soft)] px-4 py-3 text-sm text-[var(--acct-red)]">{error}</div>
          ) : null}
          {loadingMessages ? (
            <div className="flex justify-center py-12">
              <HenryCoActivityIndicator className="text-[var(--acct-gold)]" label="Loading messages" />
            </div>
          ) : (
            messages.map((m) => {
              const parent = m.parent_id ? parentById.get(m.parent_id) : null;
              const atts = m.hq_internal_comm_attachments;
              const list = Array.isArray(atts) ? atts : [];
              return (
                <article
                  key={m.id}
                  id={`msg-${m.id}`}
                  className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] px-4 py-3"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-[var(--acct-ink)]">
                      {m.author_label || "Team"}
                      {m.author_id && m.author_id === selfUserId ? (
                        <span className="ml-2 text-[10px] font-normal uppercase tracking-wider text-[var(--acct-muted)]">
                          You
                        </span>
                      ) : null}
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
                  {m.body?.trim() ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--acct-ink)]">{m.body}</p>
                  ) : null}
                  {list.map((att) => (
                    <AttachmentPreview key={att.id} att={att} />
                  ))}
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
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
            onChange={(e) => void handlePickFiles(e.target.files)}
          />
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!activeId || uploadBusy}
              onClick={() => {
                const el = fileInputRef.current;
                if (!el) return;
                el.accept = "image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt";
                el.click();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg)] px-3 py-2 text-xs font-semibold text-[var(--acct-ink)] disabled:opacity-50"
            >
              <Paperclip className="h-4 w-4" aria-hidden />
              Attach
            </button>
            <button
              type="button"
              disabled={!activeId || uploadBusy}
              onClick={() => {
                const el = fileInputRef.current;
                if (!el) return;
                el.accept = "image/*";
                el.click();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg)] px-3 py-2 text-xs font-semibold text-[var(--acct-ink)] disabled:opacity-50"
            >
              <ImageIcon className="h-4 w-4" aria-hidden />
              Photo
            </button>
            <button
              type="button"
              disabled={!activeId || uploadBusy || isRecording}
              onClick={() => {
                const el = fileInputRef.current;
                if (!el) return;
                el.accept = "video/*";
                el.click();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg)] px-3 py-2 text-xs font-semibold text-[var(--acct-ink)] disabled:opacity-50"
            >
              Video
            </button>
            <button
              type="button"
              disabled={!activeId || uploadBusy}
              onClick={() => void toggleRecording()}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold disabled:opacity-50 ${
                isRecording
                  ? "border-[var(--acct-red)] bg-[var(--acct-red-soft)] text-[var(--acct-red)]"
                  : "border-[var(--acct-line)] bg-[var(--acct-bg)] text-[var(--acct-ink)]"
              }`}
            >
              {isRecording ? <Square className="h-4 w-4 fill-current" aria-hidden /> : <Mic className="h-4 w-4" aria-hidden />}
              {isRecording ? "Stop" : "Voice note"}
            </button>
            {uploadBusy ? (
              <span className="inline-flex items-center gap-2 text-xs text-[var(--acct-muted)]">
                <HenryCoActivityIndicator size="sm" className="text-[var(--acct-gold)]" label="Uploading" />
                Uploading…
              </span>
            ) : null}
          </div>
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
