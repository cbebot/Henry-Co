"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { AlertTriangle, ArrowRight, Camera, ShieldCheck, X } from "lucide-react";
import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";
import { emitCareToast } from "@/components/feedback/CareToaster";
import { CareLoadingGlyph } from "@/components/ui/CareLoading";

const MAX_EVIDENCE = 5;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

type DamageClaimFormProps = {
  locale: AppLocale;
  /** Booking the claim is filed against. Optional — the customer may
   *  file a claim from /account/care/claims without a specific
   *  booking in scope. */
  bookingId?: string;
  /** Tracking code surfaced as a read-only label when filing from a
   *  booking detail page. */
  trackingCode?: string;
  /** Garment label to pre-fill. */
  garmentLabel?: string;
};

type FileSlot = { id: string; file: File; previewUrl: string };

function newSlot(file: File): FileSlot {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
    file,
    previewUrl: URL.createObjectURL(file),
  };
}

export default function DamageClaimForm({
  locale,
  bookingId,
  trackingCode,
  garmentLabel,
}: DamageClaimFormProps) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [label, setLabel] = useState(garmentLabel ?? "");
  const [amount, setAmount] = useState<number | "">("");
  const [slots, setSlots] = useState<FileSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function pickFiles(event: ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(event.target.files ?? []);
    event.target.value = "";
    const next = [...slots];
    let rejected = 0;
    for (const file of incoming) {
      if (next.length >= MAX_EVIDENCE) break;
      if (!ALLOWED_TYPES.has(file.type)) {
        rejected += 1;
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        rejected += 1;
        continue;
      }
      next.push(newSlot(file));
    }
    if (rejected > 0) {
      setError(t("Some files were skipped. Use JPG, PNG, or WebP under 8MB."));
    } else {
      setError("");
    }
    setSlots(next);
  }

  function removeSlot(id: string) {
    setSlots((current) => {
      const removed = current.find((slot) => slot.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((slot) => slot.id !== id);
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setDone(false);

    try {
      const form = new FormData();
      if (bookingId) form.set("booking_id", bookingId);
      if (label.trim()) form.set("garment_label", label.trim());
      form.set("reason", reason.trim());
      if (description.trim()) form.set("description", description.trim());
      if (typeof amount === "number" && Number.isFinite(amount)) {
        form.set("requested_amount_minor", String(Math.round(amount * 100)));
      }
      slots.forEach((slot, index) => {
        form.set(`evidence_${index}`, slot.file);
      });

      const response = await fetch("/api/care/claims", {
        method: "POST",
        body: form,
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.ok) {
        const message = payload.error || t("Claim could not be filed.");
        setError(message);
        emitCareToast({
          tone: "error",
          title: t("Claim could not be filed"),
          description: message,
        });
        return;
      }

      setDone(true);
      setReason("");
      setDescription("");
      setAmount("");
      slots.forEach((slot) => URL.revokeObjectURL(slot.previewUrl));
      setSlots([]);
      emitCareToast({
        tone: "success",
        title: t("Claim received"),
        description: t("Our team will follow up by email within one business day."),
      });
    } catch {
      const message = t("Network error. Please try again.");
      setError(message);
      emitCareToast({
        tone: "error",
        title: t("Network error"),
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="care-card rounded-[32px] p-6 sm:p-8"
      aria-label={t("File a damage claim")}
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-200">
        <AlertTriangle className="h-4 w-4" />
        {t("Damage or loss claim")}
      </div>

      <h2 className="mt-4 text-3xl font-bold">{t("File a damage claim.")}</h2>
      <p className="care-muted mt-3 text-sm leading-7">
        {t(
          "Tell us what happened, attach photo evidence of the affected garments, and our team will investigate within one business day.",
        )}
      </p>

      {trackingCode ? (
        <div className="mt-6 rounded-2xl border border-[color:var(--accent)]/20 bg-[color:var(--accent)]/8 px-4 py-3 text-sm font-semibold care-accent-text">
          {t("Tracking code")}: {trackingCode}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm">
          <span className="font-semibold">{t("Garment label (optional)")}</span>
          <input
            type="text"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder={t("e.g. cream agbada, navy blazer")}
            maxLength={120}
            className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-base outline-none focus:border-[color:var(--accent)]/35 dark:border-white/10 dark:bg-white/[0.05]"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-semibold">{t("Short reason")}</span>
          <input
            type="text"
            required
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            minLength={4}
            maxLength={240}
            placeholder={t("Stain, missing item, damaged button, ...")}
            className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-base outline-none focus:border-[color:var(--accent)]/35 dark:border-white/10 dark:bg-white/[0.05]"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-semibold">{t("Details")}</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={2000}
            rows={5}
            placeholder={t(
              "When did you notice the issue? Where on the garment is it? What outcome are you hoping for?",
            )}
            className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-base outline-none focus:border-[color:var(--accent)]/35 dark:border-white/10 dark:bg-white/[0.05]"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-semibold">
            {t("Requested compensation (optional)")}
          </span>
          <input
            type="number"
            min={0}
            step={100}
            value={amount === "" ? "" : amount}
            onChange={(event) => {
              const raw = event.target.value;
              setAmount(raw === "" ? "" : Number(raw));
            }}
            placeholder={t("Naira amount")}
            className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-base outline-none focus:border-[color:var(--accent)]/35 dark:border-white/10 dark:bg-white/[0.05]"
          />
        </label>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
            {t("Photo evidence")} ({slots.length} / {MAX_EVIDENCE})
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={slots.length >= MAX_EVIDENCE || loading}
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent)]/25 bg-[color:var(--accent)]/10 px-3 py-2 text-xs font-semibold care-accent-text transition hover:bg-[color:var(--accent)]/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Camera className="h-3.5 w-3.5" />
            {t("Add image")}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={pickFiles}
          className="sr-only"
        />

        {slots.length > 0 ? (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {slots.map((slot) => (
              <li
                key={slot.id}
                className="relative aspect-square overflow-hidden rounded-2xl border border-black/8 bg-black/5 dark:border-white/8 dark:bg-white/5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slot.previewUrl}
                  alt={slot.file.name}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeSlot(slot.id)}
                  aria-label={t("Remove image")}
                  className="absolute end-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="care-muted mt-3 text-xs leading-6">
            {t("Up to 5 images, JPG / PNG / WebP, 8MB each.")}
          </p>
        )}
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-100">
          {error}
        </div>
      ) : null}

      {done ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-200">
          <ShieldCheck className="h-4 w-4" />
          {t("Claim received")}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading || reason.trim().length < 4}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-[#07111F] transition hover:bg-[color:var(--accent)]/95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <CareLoadingGlyph className="h-4 w-4" />
            {t("Submitting...")}
          </>
        ) : (
          <>
            {t("File claim")}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
