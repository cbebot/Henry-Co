"use client";

import { useState, useTransition } from "react";
import { CalendarPlus } from "lucide-react";

const TIMEZONE_OPTIONS = [
  { value: "Africa/Lagos", label: "West Africa (Lagos)" },
  { value: "Africa/Porto-Novo", label: "West Africa (Cotonou)" },
  { value: "Africa/Accra", label: "GMT (Accra)" },
  { value: "Europe/London", label: "UK (London)" },
  { value: "America/New_York", label: "US Eastern" },
  { value: "America/Chicago", label: "US Central" },
  { value: "America/Los_Angeles", label: "US Pacific" },
  { value: "Europe/Berlin", label: "Central Europe" },
];

const DURATION_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
];

export function InterviewScheduler({ applicationId }: { applicationId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [timezone, setTimezone] = useState("Africa/Lagos");
  const [interviewType, setInterviewType] = useState("video");
  const [location, setLocation] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date || !time) {
      setError("Title, date, and time are required.");
      return;
    }
    setError(null);

    const scheduledAt = new Date(`${date}T${time}`).toISOString();

    startTransition(async () => {
      try {
        const res = await fetch("/api/hiring/interviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicationId,
            title: title.trim(),
            scheduledAt,
            durationMinutes: duration,
            timezone,
            interviewType,
            location: location.trim() || undefined,
            meetingUrl: meetingUrl.trim() || undefined,
            notes: notes.trim() || undefined,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Failed to schedule interview.");
          return;
        }
        setOpen(false);
        window.location.reload();
      } catch {
        setError("Network error. Please try again.");
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-[var(--jobs-accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        <CalendarPlus className="h-4 w-4" />
        Schedule interview
      </button>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-[var(--jobs-border)] bg-[var(--jobs-bg)] px-3 py-2 text-sm outline-none transition focus:border-[var(--jobs-accent)]";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[var(--jobs-border)] bg-[var(--jobs-paper-soft)] p-5">
      <div className="text-sm font-semibold">Schedule a new interview</div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--jobs-muted)]">Title</span>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Technical interview" className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--jobs-muted)]">Type</span>
          <select value={interviewType} onChange={(e) => setInterviewType(e.target.value)} className={inputClass}>
            <option value="video">Video call</option>
            <option value="phone">Phone call</option>
            <option value="in-person">In-person</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--jobs-muted)]">Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--jobs-muted)]">Time</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--jobs-muted)]">Duration</span>
          <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputClass}>
            {DURATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs text-[var(--jobs-muted)]">Timezone</span>
        <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputClass}>
          {TIMEZONE_OPTIONS.map((tz) => (
            <option key={tz.value} value={tz.value}>{tz.label}</option>
          ))}
        </select>
      </label>

      {interviewType === "video" && (
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--jobs-muted)]">Meeting URL</span>
          <input type="url" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://meet.google.com/..." className={inputClass} />
        </label>
      )}

      {interviewType === "in-person" && (
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--jobs-muted)]">Location</span>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Office address" className={inputClass} />
        </label>
      )}

      <label className="block">
        <span className="mb-1 block text-xs text-[var(--jobs-muted)]">Notes (optional)</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Interview preparation notes..." className={`${inputClass} resize-none`} />
      </label>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={isPending} className="rounded-lg bg-[var(--jobs-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40">
          {isPending ? "Scheduling..." : "Schedule"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-[var(--jobs-border)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--jobs-paper-soft)]">
          Cancel
        </button>
      </div>
    </form>
  );
}
