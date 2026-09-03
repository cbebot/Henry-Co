"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { translateSurfaceLabel, type JobsCopy } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { toast } from "@henryco/ui/feedback";

export function InterviewScheduler({
  applicationId,
  copy,
}: {
  applicationId: string;
  copy: JobsCopy["interviewScheduler"];
}) {
  const TIMEZONE_OPTIONS = [
    { value: "Africa/Lagos", label: copy.tzLagos },
    { value: "Africa/Porto-Novo", label: copy.tzCotonou },
    { value: "Africa/Accra", label: copy.tzAccra },
    { value: "Europe/London", label: copy.tzLondon },
    { value: "America/New_York", label: copy.tzNewYork },
    { value: "America/Chicago", label: copy.tzChicago },
    { value: "America/Los_Angeles", label: copy.tzLosAngeles },
    { value: "Europe/Berlin", label: copy.tzBerlin },
  ];

  const DURATION_OPTIONS = [
    { value: 15, label: copy.duration15 },
    { value: 30, label: copy.duration30 },
    { value: 45, label: copy.duration45 },
    { value: 60, label: copy.duration60 },
    { value: 90, label: copy.duration90 },
  ];
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
  const router = useRouter();
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date || !time) {
      setError(copy.validationError);
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
          // Show the route's human-readable message, not the machine code.
          setError(data.message || copy.networkError);
          return;
        }
        setOpen(false);
        setTitle("");
        setDate("");
        setTime("");
        setNotes("");
        // V3-ACTIONS-01: acknowledge in place and soft-refresh the interview
        // list — a document reload would discard the message composer draft
        // and the recruiter's scroll position.
        toast.success(t("Interview scheduled."), {
          body: t("The candidate is notified and the interview joins this application's timeline."),
          chime: true,
        });
        router.refresh();
      } catch {
        setError(copy.networkError);
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
        {copy.triggerLabel}
      </button>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-[var(--jobs-border)] bg-[var(--jobs-bg)] px-3 py-2 text-sm outline-none transition focus:border-[var(--jobs-accent)]";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[var(--jobs-border)] bg-[var(--jobs-paper-soft)] p-5">
      <div className="text-sm font-semibold">{copy.formTitle}</div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--jobs-muted)]">{copy.labelTitle}</span>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={copy.titlePlaceholder} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--jobs-muted)]">{copy.labelType}</span>
          <select value={interviewType} onChange={(e) => setInterviewType(e.target.value)} className={inputClass}>
            <option value="video">{copy.typeVideo}</option>
            <option value="phone">{copy.typePhone}</option>
            <option value="in-person">{copy.typeInPerson}</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--jobs-muted)]">{copy.labelDate}</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--jobs-muted)]">{copy.labelTime}</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--jobs-muted)]">{copy.labelDuration}</span>
          <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputClass}>
            {DURATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs text-[var(--jobs-muted)]">{copy.labelTimezone}</span>
        <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputClass}>
          {TIMEZONE_OPTIONS.map((tz) => (
            <option key={tz.value} value={tz.value}>{tz.label}</option>
          ))}
        </select>
      </label>

      {interviewType === "video" && (
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--jobs-muted)]">{copy.labelMeetingUrl}</span>
          <input type="url" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder={copy.meetingUrlPlaceholder} className={inputClass} />
        </label>
      )}

      {interviewType === "in-person" && (
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--jobs-muted)]">{copy.labelLocation}</span>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder={copy.locationPlaceholder} className={inputClass} />
        </label>
      )}

      <label className="block">
        <span className="mb-1 block text-xs text-[var(--jobs-muted)]">{copy.labelNotes}</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder={copy.notesPlaceholder} className={`${inputClass} resize-none`} />
      </label>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={isPending} className="rounded-lg bg-[var(--jobs-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40">
          {isPending ? copy.submitPending : copy.submitLabel}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-[var(--jobs-border)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--jobs-paper-soft)]">
          {copy.cancelLabel}
        </button>
      </div>
    </form>
  );
}
