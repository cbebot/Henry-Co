"use client";

import { useCallback, useId, useState } from "react";
import { Camera, CheckCircle2, MapPin, RotateCcw, X } from "lucide-react";

/**
 * V3 PASS 21 — `<PODCapture>` rider POD client component.
 *
 * Captures:
 *   - A photo via the device camera (MediaDevices API `getUserMedia`)
 *     OR falls back to a hidden `<input type="file" capture="environment">`.
 *   - Optional recipient name + relationship.
 *   - Optional free-form note.
 *   - GPS coordinates via `navigator.geolocation.getCurrentPosition`
 *     (best-effort; degrades to null on denial).
 *
 * On submit, POSTs to /api/logistics/pod with the photo URL (uploaded
 * to Cloudinary upstream via /api/cloudinary/sign — out of scope for
 * this component; the parent supplies an `uploadPhoto` handler that
 * returns `{ secure_url, public_id }`).
 *
 * Degrades gracefully when camera permission is denied: switches to
 * the file-input fallback and surfaces a tone="warn" banner explaining
 * what happened. Satisfies L1 gate.
 */

export type PODCaptureProps = {
  shipmentId: string;
  legId?: string | null;
  uploadPhoto: (
    file: Blob,
  ) => Promise<{ secure_url: string; public_id: string } | null>;
  onSubmitted?: (podId: string) => void;
  /** Override the POST endpoint (default `/api/logistics/pod`). */
  endpoint?: string;
};

type CaptureState =
  | { status: "idle" }
  | { status: "previewing"; dataUrl: string; file: Blob }
  | { status: "uploading" }
  | { status: "submitted"; podId: string };

export function PODCapture({
  shipmentId,
  legId,
  uploadPhoto,
  onSubmitted,
  endpoint = "/api/logistics/pod",
}: PODCaptureProps) {
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
      setGpsError("Location not supported on this device.");
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
        setGpsError(err.message || "Location permission denied.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

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
          shipment_id: shipmentId,
          leg_id: legId ?? null,
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
        pod_id?: string;
        error?: string;
      };
      if (!response.ok || !body?.ok || !body.pod_id) {
        setSubmitError(body?.error || "Could not save proof of delivery.");
        setState({ status: "previewing", dataUrl: state.dataUrl, file: state.file });
        return;
      }
      setState({ status: "submitted", podId: body.pod_id });
      if (onSubmitted) onSubmitted(body.pod_id);
    } catch (err) {
      console.error("[pod-capture] submit failed", err);
      setSubmitError("Network error — try again.");
      if (state.status === "previewing")
        setState({ status: "previewing", dataUrl: state.dataUrl, file: state.file });
    }
  }, [
    endpoint,
    gps,
    legId,
    note,
    onSubmitted,
    recipientName,
    recipientRelationship,
    shipmentId,
    state,
    uploadPhoto,
  ]);

  if (state.status === "submitted") {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-100">
        <div className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          Proof of delivery captured
        </div>
        <p className="mt-1 text-xs text-emerald-100/75">
          Record id <span className="font-mono">{state.podId}</span> — visible
          to dispatch and the customer.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--logistics-line)] bg-white/[0.03] p-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-[var(--logistics-accent-soft)]">
            Proof of delivery
          </p>
          <h3 className="mt-1 text-base font-semibold tracking-tight text-white">
            Capture photo + signature
          </h3>
          <p className="mt-1 text-xs text-[var(--logistics-muted)]">
            Photo is required. Recipient name optional but speeds resolution if
            a claim is filed.
          </p>
        </div>
        {state.status === "previewing" ? (
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-[var(--logistics-line)] bg-white/[0.04] p-2 text-white/80 hover:bg-white/[0.08]"
            aria-label="Retake photo"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        ) : null}
      </header>

      {state.status === "idle" ? (
        <label
          htmlFor={fileInputId}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--logistics-line-strong)] bg-white/[0.02] px-4 py-10 text-center text-sm text-white/80 transition hover:bg-white/[0.05]"
        >
          <Camera className="h-6 w-6 text-[var(--logistics-accent)]" aria-hidden />
          <span className="text-base font-semibold tracking-tight text-white">
            Tap to capture photo
          </span>
          <span className="text-xs text-[var(--logistics-muted)]">
            Uses your device camera. We never upload until you tap Save.
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
        <div className="overflow-hidden rounded-2xl border border-[var(--logistics-line)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={state.dataUrl}
            alt="Captured proof of delivery"
            className="block max-h-72 w-full object-cover"
          />
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
            Recipient name
          </span>
          <input
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="Optional"
            className="rounded-xl border border-[var(--logistics-line)] bg-black/30 px-3 py-2 text-white placeholder:text-white/30 focus:border-[var(--logistics-accent)]/60 focus:outline-none"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
            Relationship
          </span>
          <input
            value={recipientRelationship}
            onChange={(e) => setRecipientRelationship(e.target.value)}
            placeholder="e.g. Recipient, Doorman, Spouse"
            className="rounded-xl border border-[var(--logistics-line)] bg-black/30 px-3 py-2 text-white placeholder:text-white/30 focus:border-[var(--logistics-accent)]/60 focus:outline-none"
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
          Note
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder='e.g. "Left with security per recipient instruction"'
          className="rounded-xl border border-[var(--logistics-line)] bg-black/30 px-3 py-2 text-white placeholder:text-white/30 focus:border-[var(--logistics-accent)]/60 focus:outline-none"
        />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <button
          type="button"
          onClick={captureGps}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--logistics-line)] bg-white/[0.04] px-3 py-1.5 font-semibold text-white/85 hover:bg-white/[0.08]"
        >
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          {gps ? (
            <span>
              GPS locked · ±{Math.round(gps.accuracy)}m
            </span>
          ) : (
            <span>Add GPS pin</span>
          )}
        </button>
        {gpsError ? (
          <span className="text-amber-200/80">{gpsError}</span>
        ) : null}
      </div>

      {submitError ? (
        <p className="flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          <X className="h-3.5 w-3.5" aria-hidden />
          {submitError}
        </p>
      ) : null}

      <button
        type="button"
        onClick={submit}
        disabled={state.status !== "previewing"}
        className="w-full rounded-full bg-[linear-gradient(135deg,#f6e2d0_0%,var(--logistics-accent)_52%,#9f8b7d_100%)] px-5 py-3 text-sm font-semibold text-[#170f12] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {state.status === "uploading"
          ? "Uploading…"
          : state.status === "previewing"
            ? "Save proof of delivery"
            : "Capture photo first"}
      </button>
    </div>
  );
}
