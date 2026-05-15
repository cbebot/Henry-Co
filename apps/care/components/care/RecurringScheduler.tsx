"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  PauseCircle,
  PlayCircle,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";
import { emitCareToast } from "@/components/feedback/CareToaster";
import { CareLoadingGlyph } from "@/components/ui/CareLoading";

const CADENCE_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every other week" },
  { value: "monthly", label: "Monthly" },
] as const;

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

type ScheduleRow = {
  id: string;
  cadence: string;
  day_of_week: number | null;
  time_of_day: string | null;
  pickup_window: string | null;
  service_payload: Record<string, unknown>;
  pickup_address: Record<string, unknown>;
  contact_phone: string | null;
  notes: string | null;
  status: string;
  paused_until: string | null;
  next_run_at: string | null;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
};

type RecurringSchedulerProps = {
  locale: AppLocale;
};

export default function RecurringScheduler({ locale }: RecurringSchedulerProps) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({
    cadence: "weekly",
    day_of_week: 1,
    pickup_window: "",
    notes: "",
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/care/recurring");
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || t("Could not load schedules."));
        return;
      }
      setRows(data.schedules || []);
    } catch {
      setError(t("Network error. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  async function createSchedule() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/care/recurring", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          cadence: draft.cadence,
          day_of_week: draft.day_of_week,
          pickup_window: draft.pickup_window.trim() || null,
          notes: draft.notes.trim() || null,
          status: "active",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || t("Could not save schedule."));
        emitCareToast({
          tone: "error",
          title: t("Schedule not saved"),
          description: data.error || "",
        });
        return;
      }
      emitCareToast({
        tone: "success",
        title: t("Schedule active"),
        description: t("We will auto-book this run ahead of time."),
      });
      setDraft({ cadence: "weekly", day_of_week: 1, pickup_window: "", notes: "" });
      setOpen(false);
      void load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(row: ScheduleRow) {
    const nextStatus = row.status === "active" ? "paused" : "active";
    try {
      const res = await fetch("/api/care/recurring", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: row.id,
          cadence: row.cadence,
          day_of_week: row.day_of_week,
          pickup_window: row.pickup_window,
          notes: row.notes,
          status: nextStatus,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        emitCareToast({
          tone: "error",
          title: t("Update failed"),
          description: data.error || "",
        });
        return;
      }
      void load();
    } catch {
      emitCareToast({
        tone: "error",
        title: t("Update failed"),
        description: t("Network error."),
      });
    }
  }

  async function cancel(row: ScheduleRow) {
    if (!window.confirm(t("Cancel this recurring schedule?"))) {
      return;
    }
    try {
      const res = await fetch(`/api/care/recurring?id=${encodeURIComponent(row.id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        emitCareToast({
          tone: "error",
          title: t("Cancel failed"),
          description: data.error || "",
        });
        return;
      }
      void load();
    } catch {
      emitCareToast({
        tone: "error",
        title: t("Cancel failed"),
        description: t("Network error."),
      });
    }
  }

  return (
    <section
      aria-label={t("Recurring care schedules")}
      className="care-card rounded-[32px] p-6 sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent)]/22 bg-[color:var(--accent)]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] care-accent-text">
            <CalendarDays className="h-4 w-4" />
            {t("Auto-book")}
          </div>
          <h2 className="mt-3 text-2xl font-bold">{t("Recurring care schedules.")}</h2>
          <p className="care-muted mt-2 text-sm leading-7">
            {t(
              "Set a weekly, biweekly, or monthly cadence. We auto-book the next run 24 hours ahead — pause or cancel anytime.",
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-[#07111F] transition hover:bg-[color:var(--accent)]/95"
        >
          {open ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {open ? t("Close") : t("New schedule")}
        </button>
      </div>

      {open ? (
        <div className="mt-6 rounded-2xl border border-[color:var(--accent)]/15 bg-[color:var(--accent)]/4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="font-semibold">{t("Cadence")}</span>
              <select
                value={draft.cadence}
                onChange={(event) =>
                  setDraft({ ...draft, cadence: event.target.value })
                }
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base outline-none focus:border-[color:var(--accent)]/35 dark:border-white/10 dark:bg-white/[0.05]"
              >
                {CADENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.label)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-semibold">{t("Day of week")}</span>
              <select
                value={draft.day_of_week}
                onChange={(event) =>
                  setDraft({ ...draft, day_of_week: Number(event.target.value) })
                }
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base outline-none focus:border-[color:var(--accent)]/35 dark:border-white/10 dark:bg-white/[0.05]"
              >
                {DAY_LABELS.map((label, index) => (
                  <option key={label} value={index}>
                    {t(label)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-semibold">{t("Preferred window")}</span>
              <input
                type="text"
                value={draft.pickup_window}
                onChange={(event) =>
                  setDraft({ ...draft, pickup_window: event.target.value })
                }
                placeholder={t("Morning, 9am – 12pm, ...")}
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base outline-none focus:border-[color:var(--accent)]/35 dark:border-white/10 dark:bg-white/[0.05]"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-semibold">{t("Notes")}</span>
              <input
                type="text"
                value={draft.notes}
                onChange={(event) =>
                  setDraft({ ...draft, notes: event.target.value })
                }
                placeholder={t("Optional handling notes")}
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-base outline-none focus:border-[color:var(--accent)]/35 dark:border-white/10 dark:bg-white/[0.05]"
              />
            </label>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={createSchedule}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-[#07111F] transition hover:bg-[color:var(--accent)]/95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <CareLoadingGlyph className="h-4 w-4" />
                  {t("Saving...")}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {t("Save schedule")}
                </>
              )}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-100">
          {error}
        </div>
      ) : null}

      <ul className="mt-6 grid gap-3" aria-label={t("Active schedules")}>
        {loading ? (
          <li className="rounded-2xl border border-dashed border-black/12 px-4 py-3 text-sm care-muted dark:border-white/12">
            {t("Loading...")}
          </li>
        ) : rows.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-black/12 px-4 py-6 text-sm care-muted dark:border-white/12">
            {t("No recurring schedules yet. Create one above to auto-book your next visit.")}
          </li>
        ) : (
          rows.map((row) => {
            const dayLabel =
              row.day_of_week != null && row.day_of_week >= 0 && row.day_of_week <= 6
                ? t(DAY_LABELS[row.day_of_week])
                : "—";
            const nextRunLabel = row.next_run_at
              ? new Date(row.next_run_at).toLocaleString(locale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : t("Not yet scheduled");
            return (
              <li
                key={row.id}
                className="flex flex-col gap-3 rounded-2xl border border-black/8 bg-white/70 px-5 py-4 dark:border-white/8 dark:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] care-accent-text">
                    {t(row.cadence)}
                  </div>
                  <div className="mt-1 text-base font-semibold">{dayLabel}</div>
                  <div className="mt-1 text-xs care-muted">
                    {row.pickup_window ?? t("No preferred window")}
                  </div>
                  <div className="mt-1 text-xs care-muted">
                    {t("Next run")}: {nextRunLabel}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                      row.status === "active"
                        ? "border border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                        : "border border-amber-400/40 bg-amber-500/10 text-amber-700 dark:text-amber-200"
                    }`}
                  >
                    {t(row.status)}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleStatus(row)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold transition hover:border-[color:var(--accent)]/35 dark:border-white/10 dark:bg-white/[0.05]"
                  >
                    {row.status === "active" ? (
                      <>
                        <PauseCircle className="h-3.5 w-3.5" />
                        {t("Pause")}
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-3.5 w-3.5" />
                        {t("Resume")}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => cancel(row)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-red-300/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-500/15 dark:text-red-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("Cancel")}
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ul>

      <div className="mt-4 inline-flex items-center gap-2 text-xs care-muted">
        <RotateCcw className="h-3.5 w-3.5" />
        {t("Schedules respect timezone, paused windows, and skip dates.")}
      </div>
    </section>
  );
}
