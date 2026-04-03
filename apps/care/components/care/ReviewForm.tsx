"use client";

import { useRef, useState } from "react";
import { ArrowRight, Camera, ShieldCheck, Star } from "lucide-react";
import ImageFileField from "@/components/forms/ImageFileField";
import { emitCareToast } from "@/components/feedback/CareToaster";
import { CareLoadingGlyph } from "@/components/ui/CareLoading";

type ReviewFormProps = {
  initialTrackingCode?: string;
  initialPhone?: string;
};

export default function ReviewForm({
  initialTrackingCode = "",
  initialPhone = "",
}: ReviewFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    setDone(false);
    formData.set("rating", String(rating));

    try {
      const res = await fetch("/api/care/reviews", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        const message = data.error || "Could not submit the verified review.";
        setError(message);
        emitCareToast({
          tone: "error",
          title: "Review could not be submitted",
          description: message,
        });
        return;
      }

      setDone(true);
      formRef.current?.reset();
      setResetKey((current) => current + 1);
      emitCareToast({
        tone: "success",
        title: "Review received",
        description: "Thank you. Your review has been received for checking.",
      });
    } catch {
      const message = "Network error. Please try again.";
      setError(message);
      emitCareToast({
        tone: "error",
        title: "Network error",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="care-card rounded-[32px] p-6 sm:p-8">
      <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent)]/18 bg-[color:var(--accent)]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] care-accent-text">
        <ShieldCheck className="h-4 w-4" />
        Verified client review
      </div>
      <h2 className="mt-4 text-3xl font-bold">Leave a verified service review.</h2>
      <p className="care-muted mt-3 text-sm leading-7">
        Reviews are matched to completed bookings before they appear publicly. Share your tracking
        code, the phone number used for the booking, and your experience. You can also attach an
        optional photo of the finished result.
      </p>

      <form
        ref={formRef}
        className="mt-6 grid gap-4"
        action={async (formData) => {
          await onSubmit(formData);
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            name="tracking_code"
            defaultValue={initialTrackingCode}
            placeholder="Tracking code"
            className="care-input care-ring rounded-2xl px-4 py-3 text-base md:text-sm"
            required
          />
          <input
            name="phone"
            defaultValue={initialPhone}
            placeholder="Booking phone number"
            className="care-input care-ring rounded-2xl px-4 py-3 text-base md:text-sm"
            required
          />
        </div>

        <div className="rounded-2xl border border-[var(--care-border)] bg-[color:var(--care-bg-soft)] p-4">
          <div className="text-sm font-semibold">Rating</div>
          <div className="mt-3 flex gap-2">
            {Array.from({ length: 5 }).map((_, index) => {
              const value = index + 1;
              const active = value <= rating;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="rounded-xl p-2 transition hover:bg-[color:var(--care-bg-elevated)]"
                >
                  <Star
                    className={`h-6 w-6 ${active ? "fill-[color:var(--accent)] text-[color:var(--accent)]" : "text-white/30"}`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <textarea
          name="review_text"
          placeholder="Describe the finish, punctuality, communication, and how the service felt overall."
          className="care-input care-ring min-h-[160px] rounded-2xl px-4 py-3 text-base md:text-sm"
          required
        />

        <div className="rounded-[1.8rem] border border-[var(--care-border)] bg-[color:var(--care-bg-soft)] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-white">
            <Camera className="h-4 w-4 text-[color:var(--accent)]" />
            Optional service photo
          </div>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-white/65">
            Add a garment finish photo, room result, or site photo if you want the approved
            review to feel more vivid.
          </p>
          <div className="mt-4">
            <ImageFileField
              key={resetKey}
              name="photo"
              label="Review photo"
              hint="Optional. Upload one clear photo of the completed result."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-[#07111F] shadow-[0_16px_40px_rgba(92,108,255,0.24)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_56px_rgba(92,108,255,0.28)] disabled:translate-y-0 disabled:opacity-60"
        >
          {loading ? (
            <CareLoadingGlyph size="sm" className="text-[#07111F]" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          {loading ? "Submitting review..." : "Submit verified review"}
        </button>
      </form>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {done ? (
        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50">
          Review submitted successfully. Once it has been checked, it may appear on HenryCo Care
          public pages.
        </div>
      ) : null}
    </div>
  );
}
