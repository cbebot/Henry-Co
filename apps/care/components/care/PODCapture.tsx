"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { Camera, CheckCircle2, MapPin, RotateCcw, X } from "lucide-react";
import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";

/**
 * V3 PASS 21 — Care `<PODCapture>` rider POD client component.
 *
 * Mirrors logistics/components/operator/PODCapture.tsx (commit
 * b667567d). Care uses two legs (pickup, delivery) — leg defaults to
 * 'delivery'.
 *
 * Captures:
 *   - Photo via `<input type="file" capture="environment">`.
 *   - Optional recipient name + relationship.
 *   - Optional free-form note.
 *   - GPS via navigator.geolocation (best-effort; degrades on denial).
 *
 * On submit, calls `uploadPhoto(file)` (parent-supplied — typically
 * posts to a signed-upload endpoint) and then POSTs the resulting
 * Cloudinary URL + metadata to /api/care/pod.
 *
 * RLS: caller must have is_staff_in('care') AND be the
 * captured_by_user_id; the API route enforces this via
 * createSupabaseServer().auth.getUser().
 */

export type CarePODLeg = "pickup" | "delivery";

export type CarePODCaptureProps = {
  bookingId: string;
  leg?: CarePODLeg;
  locale: AppLocale;
  uploadPhoto: (
    file: Blob,
  ) => Promise<{ secure_url: string; public_id: string } | null>;
  onSubmitted?: (podId: string) => void;
  endpoint?: string;
};

type CaptureState =
  | { status: "idle" }
  | { status: "previewing"; dataUrl: string; file: Blob }
  | { status: "uploading" }
  | { status: "submitted"; podId: string };

export function CarePODCapture({
  bookingId,
  leg = "delivery",
  locale,
  uploadPhoto,
  onSubmitted,
  endpoint = "/api/care/pod",
}: CarePODCaptureProps) {
  const t = useMemo(() => {
    return (text: string) => translateSurfaceLabel(locale, text);
  }, [locale]);
  const fileInputId = useId();
  const [state, setState] = useState<CaptureState>({ status: "idle" });
  const [recipientName, setRecipientName] = useState("");
  const [recipientRelationship, setRecipientRelationship] = useState("");
  const [note, setNote] = useState("");
  const [gps, setGps] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const captureGps = useCallback(() => {
    setGpsError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGpsError(t("Location not supported on this device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        setGpsError(err.message || t("Location permission denied."));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [t]);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setState({ status: "previewing", dataUrl, file });
    };
    reader.readAsDataURL(file);
  }, []);

  const reset = useCallback(() => {
    setState({ status: "idle" });
    setSubmitError(null);
  }, []);

  const submit = useCallback(async () => {
    if (state.status !== "previewing") return;
    setState({ status: "uploading" });
    setSubmitError(null);
    try {
      const uploaded = await uploadPhoto(state.file);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          booking_id: bookingId,
          leg,
          photo_url: uploaded?.secure_url ?? null,
          cloudinary_public_id: uploaded?.public_id ?? null,
          gps_lat: gps?.lat ?? null,
          gps_lng: gps?.lng ?? null,
          gps_accuracy_m: gps?.accuracy ?? null,
          recipient_name: recipientName.trim() || null,
          recipient_relationship: recipientRelationship.trim() || null,
          note: note.trim() || null,
        }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        pod?: { id?: string };
        error?: string;
      };
      if (!response.ok || !body?.ok || !body.pod?.id) {
        setSubmitError(body?.error || t("Could not save proof of delivery."));
        setState({ status: "previewing", dataUrl: state.dataUrl, file: state.file });
        return;
      }
      setState({ status: "submitted", podId: body.pod.id });
      if (onSubmitted) onSubmitted(body.pod.id);
    } catch (err) {
      console.error("[care-pod-capture] submit failed", err);
      setSubmitError(t("Network error — try again."));
      if (state.status === "previewing")
        setState({ status: "previewing", dataUrl: state.dataUrl, file: state.file });
    }
  }, [
    bookingId,
    endpoint,
    gps,
    leg,
    note,
    onSubmitted,
    recipientName,
    recipientRelationship,
    state,
    t,
    uploadPhoto,
  ]);

  if (state.status === "submitted") {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-800 dark:text-emerald-100">
        <div className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          {t("Proof captured")}
        </div>
        <p className="mt-1 text-xs opacity-75">
          {t("Record id")} <span className="font-mono">{state.podId}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] care-accent-text">
            {leg === "pickup"
              ? t("Pickup confirmation")
              : t("Proof of delivery")}
          </p>
          <h3 className="mt-1 text-base font-semibold tracking-tight">
            {t("Capture photo + optional signature")}
          </h3>
          <p className="mt-1 text-xs care-muted">
            {t(
              "Photo is required. Recipient name optional but speeds resolution if a claim is filed.",
            )}
          </p>
        </div>
        {state.status === "previewing" ? (
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-black/10 bg-white/70 p-2 dark:border-white/10 dark:bg-white/[0.05]"
            aria-label={t("Retake photo")}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        ) : null}
      </header>

      {state.status === "idle" ? (
        <label
          htmlFor={fileInputId}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/12 bg-black/[0.03] px-4 py-10 text-center text-sm transition hover:bg-[color:var(--accent)]/6 dark:border-white/12 dark:bg-white/[0.03]"
        >
          <Camera className="h-6 w-6 care-accent-text" aria-hidden />
          <span className="text-base font-semibold tracking-tight">
            {t("Tap to capture photo")}
          </span>
          <span className="text-xs care-muted">
            {t("Uses your device camera. Nothing uploads until you tap Save.")}
          </span>
          <input
            id={fileInputId}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
      ) : null}

      {state.status === "previewing" ? (
        <div className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={state.dataUrl}
            alt={t("Captured proof of delivery")}
            className="block max-h-72 w-full object-cover"
          />
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] care-muted">
            {t("Recipient name")}
          </span>
          <input
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder={t("Optional")}
            className="rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:border-[color:var(--accent)]/35 dark:border-white/10 dark:bg-white/[0.05]"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] care-muted">
            {t("Relationship")}
          </span>
          <input
            value={recipientRelationship}
            onChange={(e) => setRecipientRelationship(e.target.value)}
            placeholder={t("Recipient, doorman, spouse, ...")}
            className="rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:border-[color:var(--accent)]/35 dark:border-white/10 dark:bg-white/[0.05]"
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] care-muted">
          {t("Note")}
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder={t("Left with security per recipient instruction, ...")}
          className="rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:border-[color:var(--accent)]/35 dark:border-white/10 dark:bg-white/[0.05]"
        />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <button
          type="button"
          onClick={captureGps}
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 font-semibold transition hover:border-[color:var(--accent)]/35 dark:border-white/10 dark:bg-white/[0.05]"
        >
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          {gps
            ? `${t("GPS locked")} · ±${Math.round(gps.accuracy)}m`
            : t("Add GPS pin")}
        </button>
        {gpsError ? <span className="text-amber-700 dark:text-amber-200">{gpsError}</span> : null}
      </div>

      {submitError ? (
        <p className="flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-200">
          <X className="h-3.5 w-3.5" aria-hidden />
          {submitError}
        </p>
      ) : null}

      <button
        type="button"
        onClick={submit}
        disabled={state.status !== "previewing"}
        className="w-full rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-[#07111F] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {state.status === "uploading"
          ? t("Uploading...")
          : state.status === "previewing"
            ? t("Save proof of delivery")
            : t("Capture photo first")}
      </button>
    </div>
  );
}
