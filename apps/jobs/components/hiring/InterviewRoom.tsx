"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { Video, MessageCircle, NotepadText, Mic, Camera, Share2 } from "lucide-react";
import {
  getJobsCopy,
  useHenryCoLocale,
  type JobsCopy,
} from "@henryco/i18n";

/**
 * V3 PASS 21 — InterviewRoom (Distinctive Rule #2).
 *
 * Renders the Daily.co iframe embed for a scheduled interview room with:
 *   - left rail: video iframe (Daily.co provider)
 *   - right rail tabs: chat (in-room) | notes (employer-only)
 *
 * Daily.co requires the join URL to be present. When the upstream room
 * provisioning failed, we render a placeholder card so the employer can
 * pivot to a paste-link fallback.
 *
 * Mobile parity: at <md width, the layout collapses to a vertical
 * stack with chat/notes accessible via tab bar.
 */

type Role = "candidate" | "employer";

type InterviewRoomProps = {
  roomId: string;
  /**
   * The linked application id. Reserved for future analytics + linkable
   * detail-route enhancements; not consumed by the iframe today.
   */
  applicationId?: string;
  scheduledAt: string;
  durationMinutes: number;
  joinUrl: string | null;
  role: Role;
  employerNotes?: string | null;
  candidateName?: string;
  employerName?: string;
};

type TabKey = "chat" | "notes";

const NOTES_AUTOSAVE_INTERVAL_MS = 30_000;

export function InterviewRoom({
  roomId,
  scheduledAt,
  durationMinutes,
  joinUrl,
  role,
  employerNotes,
  candidateName,
  employerName,
}: InterviewRoomProps) {
  const locale = useHenryCoLocale();
  const copy: JobsCopy = getJobsCopy(locale);
  const labels = copy.interviewRoom;
  const [tab, setTab] = useState<TabKey>(role === "employer" ? "notes" : "chat");
  const [notes, setNotes] = useState(employerNotes ?? "");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const lastSavedRef = useRef(employerNotes ?? "");

  // Auto-save notes every 30s. Employer-only.
  useEffect(() => {
    if (role !== "employer") return;
    const interval = setInterval(() => {
      if (notes === lastSavedRef.current) return;
      void persistNotes(notes);
    }, NOTES_AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, role]);

  async function persistNotes(value: string) {
    if (role !== "employer") return;
    startTransition(async () => {
      try {
        const response = await fetch(`/api/jobs/interviews/rooms/${roomId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: value }),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as {
            message?: string;
          };
          setError(body.message || labels.notesSaveError);
          return;
        }
        lastSavedRef.current = value;
        setSavedAt(new Date().toISOString());
        setError(null);
      } catch (err) {
        console.error("[InterviewRoom] note save failed:", err);
        setError(labels.notesSaveError);
      }
    });
  }

  function handleNotesBlur() {
    if (notes !== lastSavedRef.current) {
      void persistNotes(notes);
    }
  }

  const tabs: { id: TabKey; label: string; icon: React.ReactNode; hide?: boolean }[] = [
    {
      id: "chat",
      label: labels.tabChat,
      icon: <MessageCircle aria-hidden className="h-4 w-4" />,
    },
    {
      id: "notes",
      label: labels.tabNotes,
      icon: <NotepadText aria-hidden className="h-4 w-4" />,
      hide: role !== "employer",
    },
  ];

  const startTime = new Date(scheduledAt);
  const scheduledLabel = startTime.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="rounded-3xl border border-[var(--jobs-line)] bg-[var(--jobs-paper)] p-4 shadow-sm md:p-6">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--jobs-line)] pb-4">
        <div>
          <div className="jobs-kicker">{labels.kicker}</div>
          <h3 className="mt-1 text-lg font-semibold leading-tight">
            {role === "employer"
              ? candidateName || labels.candidateFallback
              : employerName || labels.employerFallback}
          </h3>
          <p className="text-xs text-[var(--jobs-muted)]">
            {scheduledLabel} · {durationMinutes} {labels.minutes}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--jobs-muted)]">
          <Mic aria-hidden className="h-3.5 w-3.5" />
          <Camera aria-hidden className="h-3.5 w-3.5" />
          <Share2 aria-hidden className="h-3.5 w-3.5" />
        </div>
      </header>

      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-2xl border border-[var(--jobs-line)] bg-black/95">
          {joinUrl ? (
            <iframe
              ref={iframeRef}
              src={joinUrl}
              title={labels.iframeTitle}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="aspect-video w-full"
              style={{ border: 0 }}
            />
          ) : (
            <div className="flex aspect-video items-center justify-center p-6 text-center text-sm text-white/80">
              <div className="space-y-3">
                <Video aria-hidden className="mx-auto h-8 w-8" />
                <p>{labels.placeholder}</p>
              </div>
            </div>
          )}
        </div>

        <aside className="flex flex-col rounded-2xl border border-[var(--jobs-line)] bg-[var(--jobs-paper-soft)]">
          <nav className="flex items-center gap-1 border-b border-[var(--jobs-line)] p-2">
            {tabs
              .filter((entry) => !entry.hide)
              .map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setTab(entry.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    tab === entry.id
                      ? "bg-[var(--jobs-accent)] text-white"
                      : "text-[var(--jobs-muted)] hover:text-[var(--jobs-ink)]"
                  }`}
                  aria-pressed={tab === entry.id}
                >
                  {entry.icon}
                  <span>{entry.label}</span>
                </button>
              ))}
          </nav>

          <div className="flex-1 p-3">
            {tab === "chat" ? (
              <p className="text-sm leading-6 text-[var(--jobs-muted)]">
                {labels.chatHint}
              </p>
            ) : null}

            {tab === "notes" && role === "employer" ? (
              <div className="space-y-2">
                <label
                  htmlFor={`interview-notes-${roomId}`}
                  className="jobs-kicker"
                >
                  {labels.notesLabel}
                </label>
                <textarea
                  id={`interview-notes-${roomId}`}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  onBlur={handleNotesBlur}
                  rows={10}
                  className="w-full rounded-xl border border-[var(--jobs-line)] bg-white/60 p-3 text-sm leading-6 text-[var(--jobs-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--jobs-accent)]"
                  placeholder={labels.notesPlaceholder}
                />
                <div className="flex items-center justify-between text-xs text-[var(--jobs-muted)]">
                  <span>
                    {isPending
                      ? labels.notesSaving
                      : savedAt
                        ? `${labels.notesSavedAt} ${new Date(savedAt).toLocaleTimeString(
                            undefined,
                            { hour: "2-digit", minute: "2-digit" },
                          )}`
                        : labels.notesAutosave}
                  </span>
                  {error ? (
                    <span className="text-[var(--jobs-danger,#a00)]">
                      {error}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
