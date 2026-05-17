import { ArrowUpRight, MapPin, Truck } from "lucide-react";

import type { AccountCopy } from "@henryco/i18n";
import { formatAccountTemplate } from "@henryco/i18n";

import {
  buildLogisticsStaticMapUrl,
  logisticsBookUrl,
  type AccountLogisticsShipment,
} from "@/lib/logistics-module";

type Props = {
  active: AccountLogisticsShipment[];
  hasAnyShipments: boolean;
  copy: AccountCopy["divisionLogistics"];
};

/**
 * Server-rendered Mapbox Static Images hero. Pin colors mirror the rest of
 * the module — logistics copper for pickups, ink for dropoffs. No client
 * JS, no map-gl bundle bloat. Falls back to a striped "geocoding pending"
 * tile when no shipment has lat/lng yet, and to a book-now empty tile when
 * the user has zero shipments at all.
 */
export function LiveShipmentMap({ active, hasAnyShipments, copy }: Props) {
  const url = buildLogisticsStaticMapUrl(active, { width: 1200, height: 480, retina: true });
  const geocodedCount = active.reduce(
    (acc, s) => acc + (s.pickup?.coord ? 1 : 0) + (s.dropoff?.coord ? 1 : 0),
    0,
  );

  if (!hasAnyShipments) {
    return (
      <section className="acct-log__map" aria-label={copy.map.noShipmentsAriaLabel}>
        <div className="acct-log__map-fallback">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <span className="acct-log__action-icon" aria-hidden>
              <Truck size={18} />
            </span>
            <strong style={{ color: "var(--acct-ink)", fontSize: 16 }}>
              {copy.map.noShipmentsTitle}
            </strong>
            <span style={{ maxWidth: "36ch" }}>{copy.map.noShipmentsBody}</span>
            <a className="acct-log__map-cta" href={logisticsBookUrl()} target="_blank" rel="noreferrer">
              {copy.map.noShipmentsCta}
              <ArrowUpRight size={14} aria-hidden />
            </a>
          </div>
        </div>
      </section>
    );
  }

  if (!url) {
    return (
      <section className="acct-log__map" aria-label={copy.map.pendingAriaLabel}>
        <div className="acct-log__map-fallback">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <span className="acct-log__action-icon" aria-hidden>
              <MapPin size={18} />
            </span>
            <strong style={{ color: "var(--acct-ink)", fontSize: 15 }}>
              {copy.map.pendingTitle}
            </strong>
            <span style={{ maxWidth: "40ch" }}>{copy.map.pendingBody}</span>
          </div>
        </div>
      </section>
    );
  }

  const altTemplate =
    geocodedCount === 1 ? copy.map.altTemplateSingular : copy.map.altTemplatePlural;
  const liveBadgeTemplate =
    active.length === 1
      ? copy.map.liveBadgeTemplateSingular
      : copy.map.liveBadgeTemplatePlural;
  return (
    <section className="acct-log__map" aria-label={copy.map.activeAriaLabel}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={formatAccountTemplate(altTemplate, { count: geocodedCount })}
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
          {formatAccountTemplate(liveBadgeTemplate, { count: active.length })}
        </span>
      </div>
    </section>
  );
}
