import Link from "next/link";
import { ArrowRight, Calendar, Package } from "lucide-react";
import type { LogisticsRecentShipment } from "@/lib/logistics/recent-shipments";

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

function formatStatus(status: string) {
  return status
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

/**
 * RecentShipmentCards — surfaces a signed-in customer's three most recent
 * shipments above the manual /track form (CHROME-01B FIX 7). The card
 * pre-populates the tracking code and the sender/recipient phone the
 * lookup expects, so a returning customer can land on their shipment
 * with one click instead of typing both fields again.
 */
export default function RecentShipmentCards({
  shipments,
}: {
  shipments: LogisticsRecentShipment[];
}) {
  if (!shipments.length) return null;

  return (
    <section>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--logistics-accent-soft)]">
          Your recent shipments
        </p>
        <span className="text-[11px] font-medium text-white/55">
          Tap a card to open it
        </span>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shipments.map((shipment) => {
          const date =
            formatDate(shipment.scheduledDeliveryAt) ??
            formatDate(shipment.createdAt);
          const phoneHint = shipment.senderPhone || shipment.recipientPhone || "";
          const params = new URLSearchParams();
          if (shipment.trackingCode) params.set("code", shipment.trackingCode);
          if (phoneHint) params.set("phone", phoneHint);
          const href = `/track?${params.toString()}`;

          return (
            <li key={shipment.trackingCode || Math.random()}>
              <Link
                href={href}
                className="group block h-full rounded-2xl border border-[var(--logistics-line)] bg-white/[0.03] p-4 transition hover:-translate-y-0.5 hover:border-white/22 hover:bg-white/[0.05]"
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-[var(--logistics-accent)]"
                  >
                    <Package className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-white/68">
                      {shipment.trackingCode || "—"}
                    </p>
                    <p className="mt-1 line-clamp-1 text-sm font-semibold tracking-tight text-white">
                      {shipment.zoneLabel ||
                        shipment.recipientName ||
                        "Shipment"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-medium text-white/65">
                  {date ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" aria-hidden />
                      {date}
                    </span>
                  ) : null}
                  {shipment.lifecycleStatus ? (
                    <span className="rounded-full border border-white/10 bg-black/25 px-2 py-0.5">
                      {formatStatus(shipment.lifecycleStatus)}
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-white">
                  Open shipment
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
