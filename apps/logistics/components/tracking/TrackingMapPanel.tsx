import type { LogisticsMapViewport } from "@/lib/logistics/map-provider";

export default function TrackingMapPanel({ map }: { map: LogisticsMapViewport }) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-[var(--logistics-line)] bg-black/25">
      <div className="border-b border-[var(--logistics-line)] px-4 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">Route map</div>
        <p className="mt-1 text-sm text-[var(--logistics-muted)]">
          We only plot coordinates captured from your addresses or live rider telemetry — never simulated GPS.
        </p>
      </div>
      <div className="relative aspect-[16/10] w-full bg-gradient-to-br from-[#1a1210] to-[#0a0809]">
        {map.embedUrl ? (
          <iframe title="Shipment map" src={map.embedUrl} className="h-full w-full border-0" loading="lazy" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="text-sm font-medium text-white/90">Map preview unavailable</div>
            <p className="max-w-md text-sm text-[var(--logistics-muted)]">
              Add latitude and longitude to pickup or delivery addresses, or enable a map provider (Mapbox / Google)
              to unlock richer rendering. Live rider breadcrumbs appear here automatically once the rider app posts
              coordinates to logistics tracking.
            </p>
          </div>
        )}
      </div>
      <div className="grid gap-3 border-t border-[var(--logistics-line)] p-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--logistics-line)] bg-white/[0.03] px-3 py-2 text-sm">
          <div className="text-[10px] uppercase tracking-wider text-white/40">Pickup pin</div>
          <div className="mt-1 text-white">{map.pickup ? `${map.pickup.lat.toFixed(5)}, ${map.pickup.lng.toFixed(5)}` : "Not set"}</div>
        </div>
        <div className="rounded-2xl border border-[var(--logistics-line)] bg-white/[0.03] px-3 py-2 text-sm">
          <div className="text-[10px] uppercase tracking-wider text-white/40">Delivery pin</div>
          <div className="mt-1 text-white">{map.dropoff ? `${map.dropoff.lat.toFixed(5)}, ${map.dropoff.lng.toFixed(5)}` : "Not set"}</div>
        </div>
        <div className="rounded-2xl border border-[var(--logistics-line)] bg-white/[0.03] px-3 py-2 text-sm">
          <div className="text-[10px] uppercase tracking-wider text-white/40">Live rider</div>
          <div className="mt-1 text-white">
            {map.live ? `${map.live.lat.toFixed(5)}, ${map.live.lng.toFixed(5)}` : map.showLiveLocationPlaceholder ? "Awaiting GPS" : "—"}
          </div>
        </div>
      </div>
      {map.showLiveLocationPlaceholder ? (
        <div className="border-t border-[var(--logistics-line)] bg-[rgba(215,117,57,0.08)] px-4 py-3 text-sm text-[var(--logistics-muted)]">
          Rider assignment is active. A live position will appear when dispatch or the rider device shares coordinates.
        </div>
      ) : null}
    </div>
  );
}
