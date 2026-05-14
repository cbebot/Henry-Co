import { ArrowDown, ArrowUp, Clock } from "lucide-react";
import {
  logisticsTrackUrl,
  type AccountLogisticsShipment,
} from "@/lib/logistics-module";
import {
  etaFragment,
  serviceLabel,
  statusLabel,
  statusTone,
  urgencyLabel,
} from "./status";

type Props = {
  shipment: AccountLogisticsShipment;
};

function addressLine(address: AccountLogisticsShipment["pickup"]): string {
  if (!address) return "Address pending";
  const parts = [address.city, address.region].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  return address.line1 || "Address pending";
}

export function ShipmentCard({ shipment }: Props) {
  const tone = statusTone(shipment.lifecycleStatus);
  const label = statusLabel(shipment.lifecycleStatus);
  const eta = etaFragment(shipment.scheduledDeliveryAt);
  const trackHref = shipment.trackingCode ? logisticsTrackUrl(shipment.trackingCode) : null;
  return (
    <article className="acct-log__shipment">
      <header className="acct-log__shipment-head">
        <span className="acct-log__shipment-code" aria-label={`Tracking code ${shipment.trackingCode}`}>
          {shipment.trackingCode || shipment.id.slice(0, 8).toUpperCase()}
        </span>
        <span className="acct-log__status-pill" data-tone={tone}>
          {label}
        </span>
      </header>
      <div className="acct-log__route">
        <span className="acct-log__route-pin" data-kind="pickup" aria-hidden>
          <ArrowUp size={14} />
        </span>
        <span className="acct-log__route-meta">
          <span className="acct-log__route-name">
            {shipment.pickup?.contactName || shipment.senderName}
          </span>
          <span className="acct-log__route-where">{addressLine(shipment.pickup)}</span>
        </span>
        <span className="acct-log__route-rule" aria-hidden />
        <span className="acct-log__route-pin" data-kind="dropoff" aria-hidden>
          <ArrowDown size={14} />
        </span>
        <span className="acct-log__route-meta">
          <span className="acct-log__route-name">
            {shipment.dropoff?.contactName || shipment.recipientName}
          </span>
          <span className="acct-log__route-where">{addressLine(shipment.dropoff)}</span>
        </span>
      </div>
      <footer className="acct-log__shipment-foot">
        <span>
          {serviceLabel(shipment.serviceType)} · {urgencyLabel(shipment.urgency)}
        </span>
        {eta ? (
          <span className="acct-log__shipment-eta" aria-label={`ETA ${eta}`}>
            <Clock size={12} aria-hidden /> {eta}
          </span>
        ) : (
          <span className="acct-log__shipment-eta" aria-hidden style={{ color: "var(--acct-muted)" }}>
            ETA pending
          </span>
        )}
      </footer>
      {trackHref ? (
        <a
          href={trackHref}
          target="_blank"
          rel="noopener noreferrer"
          className="acct-log__shipment-link"
          aria-label={`Open tracking for ${shipment.trackingCode}`}
        >
          <span>Track shipment</span>
        </a>
      ) : null}
    </article>
  );
}
