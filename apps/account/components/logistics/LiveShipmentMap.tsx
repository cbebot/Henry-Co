import { ArrowUpRight, MapPin, Truck } from "lucide-react";
import {
  buildLogisticsStaticMapUrl,
  logisticsBookUrl,
  type AccountLogisticsShipment,
} from "@/lib/logistics-module";

type Props = {
  active: AccountLogisticsShipment[];
  hasAnyShipments: boolean;
};

/**
 * Server-rendered Mapbox Static Images hero. Pin colors mirror the rest of
 * the module — logistics copper for pickups, ink for dropoffs. No client
 * JS, no map-gl bundle bloat. Falls back to a striped "geocoding pending"
 * tile when no shipment has lat/lng yet, and to a book-now empty tile when
 * the user has zero shipments at all.
 */
export function LiveShipmentMap({ active, hasAnyShipments }: Props) {
  const url = buildLogisticsStaticMapUrl(active, { width: 1200, height: 480, retina: true });
  const geocodedCount = active.reduce(
    (acc, s) => acc + (s.pickup?.coord ? 1 : 0) + (s.dropoff?.coord ? 1 : 0),
    0,
  );

  if (!hasAnyShipments) {
    return (
      <section className="acct-log__map" aria-label="No shipments yet">
        <div className="acct-log__map-fallback">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <span className="acct-log__action-icon" aria-hidden>
              <Truck size={18} />
            </span>
            <strong style={{ color: "var(--acct-ink)", fontSize: 16 }}>
              Your map will light up when you book your first delivery
            </strong>
            <span style={{ maxWidth: "36ch" }}>
              Every active pickup and drop-off pins here automatically. Book
              once and your shipments mirror back from the logistics site.
            </span>
            <a className="acct-log__map-cta" href={logisticsBookUrl()} target="_blank" rel="noreferrer">
              Book a delivery
              <ArrowUpRight size={14} aria-hidden />
            </a>
          </div>
        </div>
      </section>
    );
  }

  if (!url) {
    return (
      <section className="acct-log__map" aria-label="Map preview">
        <div className="acct-log__map-fallback">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <span className="acct-log__action-icon" aria-hidden>
              <MapPin size={18} />
            </span>
            <strong style={{ color: "var(--acct-ink)", fontSize: 15 }}>Geocoding pending</strong>
            <span style={{ maxWidth: "40ch" }}>
              Your active shipments will pin to the map as soon as the pickup
              and drop-off addresses are geocoded by dispatch.
            </span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="acct-log__map" aria-label="Active shipments map">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={`Map showing ${geocodedCount} active pickup and drop-off pin${
          geocodedCount === 1 ? "" : "s"
        }`}
        className="acct-log__map-frame"
        loading="lazy"
        decoding="async"
      />
      <div className="acct-log__map-overlay">
        <span className="acct-log__map-badge" role="status">
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "var(--log-copper)",
              boxShadow: "0 0 0 4px color-mix(in srgb, var(--log-copper) 25%, transparent)",
            }}
            aria-hidden
          />
          Live · {active.length} active shipment{active.length === 1 ? "" : "s"}
        </span>
      </div>
    </section>
  );
}
