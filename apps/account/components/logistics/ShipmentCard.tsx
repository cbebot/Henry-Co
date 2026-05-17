import { ArrowDown, ArrowUp, Clock } from "lucide-react";

import type { AccountCopy } from "@henryco/i18n";
import { formatAccountTemplate } from "@henryco/i18n";

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
  copy: AccountCopy["divisionLogistics"];
};

function addressLine(
  address: AccountLogisticsShipment["pickup"],
  copy: AccountCopy["divisionLogistics"],
): string {
  if (!address) return copy.shipment.addressPending;
  const parts = [address.city, address.region].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  return address.line1 || copy.shipment.addressPending;
}

export function ShipmentCard({ shipment, copy }: Props) {
  const tone = statusTone(shipment.lifecycleStatus);
  const label = statusLabel(shipment.lifecycleStatus, copy);
  const eta = etaFragment(shipment.scheduledDeliveryAt, copy);
  const trackHref = shipment.trackingCode ? logisticsTrackUrl(shipment.trackingCode) : null;
  const trackingCodeLabel = shipment.trackingCode || shipment.id.slice(0, 8).toUpperCase();
  return (
    <article className="acct-log__shipment">
      <header className="acct-log__shipment-head">
        <span
          className="acct-log__shipment-code"
          aria-label={formatAccountTemplate(copy.shipment.trackingCodeAriaTemplate, {
            code: trackingCodeLabel,
          })}
        >
          {trackingCodeLabel}
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
          <span className="acct-log__route-where">{addressLine(shipment.pickup, copy)}</span>
        </span>
        <span className="acct-log__route-rule" aria-hidden />
        <span className="acct-log__route-pin" data-kind="dropoff" aria-hidden>
          <ArrowDown size={14} />
        </span>
        <span className="acct-log__route-meta">
          <span className="acct-log__route-name">
            {shipment.dropoff?.contactName || shipment.recipientName}
          </span>
          <span className="acct-log__route-where">{addressLine(shipment.dropoff, copy)}</span>
        </span>
      </div>
      <footer className="acct-log__shipment-foot">
        <span>
          {serviceLabel(shipment.serviceType, copy)}
          {copy.shipment.detailSeparator}
          {urgencyLabel(shipment.urgency, copy)}
        </span>
        {eta ? (
          <span
            className="acct-log__shipment-eta"
            aria-label={formatAccountTemplate(copy.shipment.etaAriaTemplate, { eta })}
          >
            <Clock size={12} aria-hidden /> {eta}
          </span>
        ) : (
          <span className="acct-log__shipment-eta" aria-hidden style={{ color: "var(--acct-muted)" }}>
            {copy.shipment.etaPending}
          </span>
        )}
      </footer>
      {trackHref ? (
        <a
          href={trackHref}
          target="_blank"
          rel="noopener noreferrer"
          className="acct-log__shipment-link"
          aria-label={formatAccountTemplate(copy.shipment.openTrackingAriaTemplate, {
            code: trackingCodeLabel,
          })}
        >
          <span>{copy.shipment.trackCta}</span>
        </a>
      ) : null}
    </article>
  );
}
