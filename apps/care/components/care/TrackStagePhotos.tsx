"use client";

import { useEffect, useState } from "react";
import { Camera, ImageIcon, MapPin, ShieldCheck } from "lucide-react";
import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";

/**
 * V3 PASS 21 — `<TrackStagePhotos>`
 *
 * Premium photo timeline for /track. Renders garment intake +
 * completion photos from `care_booking_garments` and POD photos from
 * `care_pod_records`. The customer-facing endpoint /api/care/track
 * returns these as optional aggregates when the tracking code matches.
 *
 * Falls back to a calm "No photos yet" state when nothing is captured.
 * Cloudinary URLs are absolute https URLs; we render with next/image
 * is not used here to keep the component zero-config on care.* — no
 * loader configuration is required.
 */

export type StagePhoto = {
  id: string;
  url: string;
  caption: string;
  stage: "intake" | "completion" | "pickup_pod" | "delivery_pod";
  captured_at: string;
  recipient_name?: string | null;
  gps_lat?: number | null;
  gps_lng?: number | null;
};

type TrackStagePhotosProps = {
  locale: AppLocale;
  photos: StagePhoto[];
};

const STAGE_ORDER: Record<StagePhoto["stage"], number> = {
  pickup_pod: 0,
  intake: 1,
  completion: 2,
  delivery_pod: 3,
};

const STAGE_LABEL: Record<StagePhoto["stage"], string> = {
  pickup_pod: "Picked up",
  intake: "Intake at depot",
  completion: "Service complete",
  delivery_pod: "Delivered",
};

export default function TrackStagePhotos({ locale, photos }: TrackStagePhotosProps) {
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sorted = [...photos].sort((a, b) => {
    const stageDiff = STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage];
    if (stageDiff !== 0) return stageDiff;
    return new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime();
  });

  useEffect(() => {
    if (!activeId) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeId]);

  if (sorted.length === 0) {
    return (
      <section className="rounded-[32px] border border-black/10 bg-white/85 p-6 shadow-[0_14px_34px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04]">
        <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent)]/20 bg-[color:var(--accent)]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] care-accent-text">
          <Camera className="h-4 w-4" />
          {t("Stage photos")}
        </div>
        <h3 className="mt-3 text-xl font-bold">{t("Photos will appear as your service progresses.")}</h3>
        <p className="care-muted mt-2 text-sm leading-7">
          {t(
            "Our team photographs every garment at intake and again at completion. Pickup and delivery confirmations also include a stamped photo.",
          )}
        </p>
      </section>
    );
  }

  const active = sorted.find((photo) => photo.id === activeId) ?? null;

  return (
    <section className="rounded-[32px] border border-black/10 bg-white/85 p-6 shadow-[0_14px_34px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent)]/20 bg-[color:var(--accent)]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] care-accent-text">
            <Camera className="h-4 w-4" />
            {t("Stage photos")}
          </div>
          <h3 className="mt-3 text-xl font-bold">{t("Photos through every stage.")}</h3>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-200">
          <ShieldCheck className="h-3.5 w-3.5" />
          {sorted.length} {t("captured")}
        </span>
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {sorted.map((photo) => (
          <li
            key={photo.id}
            className="overflow-hidden rounded-2xl border border-black/8 dark:border-white/8"
          >
            <button
              type="button"
              onClick={() => setActiveId(photo.id)}
              className="group block w-full text-start"
              aria-label={`${t("Open photo")} — ${t(STAGE_LABEL[photo.stage])}`}
            >
              <div className="relative aspect-square bg-black/5 dark:bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <div className="absolute bottom-2 start-2 end-2 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                  {t(STAGE_LABEL[photo.stage])}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
          onClick={() => setActiveId(null)}
        >
          <div
            className="relative max-h-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-xl dark:bg-zinc-950"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveId(null)}
              aria-label={t("Close")}
              className="absolute end-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.url}
              alt={active.caption}
              className="block max-h-[80vh] w-full object-contain"
            />
            <div className="border-t border-black/8 px-5 py-4 dark:border-white/8">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] care-accent-text">
                {t(STAGE_LABEL[active.stage])}
              </div>
              <div className="mt-1 text-sm font-semibold">{active.caption}</div>
              <div className="mt-1 text-xs care-muted">
                {new Date(active.captured_at).toLocaleString(locale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                {active.recipient_name ? ` · ${active.recipient_name}` : null}
              </div>
              {active.gps_lat != null && active.gps_lng != null ? (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-black/[0.03] px-3 py-1 text-xs care-muted dark:border-white/8 dark:bg-white/5">
                  <MapPin className="h-3.5 w-3.5" />
                  {active.gps_lat.toFixed(4)}, {active.gps_lng.toFixed(4)}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
