"use client";

import Link from "next/link";
import { ArrowRight, Calendar, Package } from "lucide-react";
import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";
import type { CareRecentBooking } from "@/lib/care-recent-bookings";

function formatDate(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusLabel(status: string) {
  return status
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

/**
 * RecentBookingCards — a signed-in customer's three most recent care bookings
 * as clickable cards above the manual lookup on /track. Light-first care theme
 * (cobalt `--accent`, readable on the #eef2fb surface) with dark overrides; the
 * former build was dark-only + hub-gold, so the cards were invisible and
 * off-brand on the light track page. Strings flow through the surface
 * translator like the rest of /track.
 */
export default function RecentBookingCards({
  bookings,
  locale,
  onSelect,
}: {
  bookings: CareRecentBooking[];
  locale: AppLocale;
  /**
   * Optional handler — when provided the card behaves like a button that
   * pre-fills the lookup form. Otherwise it links to the tracked URL.
   */
  onSelect?: (trackingCode: string) => void;
}) {
  if (!bookings.length) return null;
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <section className="mb-8">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[color:var(--accent)]">
          {t("Your recent bookings")}
        </p>
        <span className="text-[11px] font-medium text-zinc-500 dark:text-white/55">
          {t("Tap a card to open it")}
        </span>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {bookings.map((booking, index) => {
          const date = formatDate(booking.pickupDate) ?? formatDate(booking.createdAt);
          const card = (
            <article className="group flex h-full flex-col rounded-2xl border border-black/10 bg-white/70 p-4 text-left transition hover:-translate-y-0.5 hover:border-[color:var(--accent)]/40 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20 dark:hover:bg-white/[0.05]">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-[color:var(--accent)]/10 text-[color:var(--accent)] dark:border-white/10"
                >
                  <Package className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-zinc-500 dark:text-white/68">
                    {booking.trackingCode || "—"}
                  </p>
                  <p className="mt-1 line-clamp-1 text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
                    {booking.serviceType || t("Care booking")}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-medium text-zinc-500 dark:text-white/65">
                {date ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" aria-hidden />
                    {date}
                  </span>
                ) : null}
                {booking.status ? (
                  <span className="rounded-full border border-black/10 bg-zinc-50 px-2 py-0.5 dark:border-white/10 dark:bg-black/25">
                    {t(statusLabel(booking.status))}
                  </span>
                ) : null}
              </div>
              <div className="mt-auto pt-4">
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-zinc-950 dark:text-white">
                  {t("Open booking")}
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </article>
          );

          if (onSelect && booking.trackingCode) {
            return (
              <li key={booking.trackingCode}>
                <button
                  type="button"
                  onClick={() => onSelect(booking.trackingCode)}
                  className="block w-full"
                >
                  {card}
                </button>
              </li>
            );
          }

          return (
            <li key={booking.trackingCode || `booking-${index}`}>
              <Link
                href={
                  booking.trackingCode
                    ? `/track?code=${encodeURIComponent(booking.trackingCode)}`
                    : "/track"
                }
                className="block"
              >
                {card}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
