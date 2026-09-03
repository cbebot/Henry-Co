import { ArrowUpRight, CheckCircle2 } from "lucide-react";

import type { AccountCopy } from "@henryco/i18n";
import { formatAccountTemplate } from "@henryco/i18n";

import {
  logisticsTrackUrl,
  type AccountLogisticsShipment,
} from "@/lib/logistics-module";
import { serviceLabel, shortDate } from "./status";

type Props = {
  recent: AccountLogisticsShipment[];
  copy: AccountCopy["divisionLogistics"];
};

export function CompletedTimeline({ recent, copy }: Props) {
  if (recent.length === 0) return null;
  return (
    <ul className="acct-log__timeline" role="list" aria-label={copy.timeline.ariaLabel}>
      {recent.map((shipment) => {
        const ref = shipment.lastEventAt || shipment.updatedAt || shipment.createdAt;
        const when = shortDate(ref);
        const href = shipment.trackingCode ? logisticsTrackUrl(shipment.trackingCode) : null;
        const recipient = shipment.dropoff?.contactName || shipment.recipientName;
        return (
          <li className="acct-log__timeline-row" key={shipment.id}>
            <div className="acct-log__timeline-when" aria-hidden>
              <span className="acct-log__timeline-day">{when.day}</span>
              <span className="acct-log__timeline-month">{when.month}</span>
            </div>
            <div className="acct-log__timeline-body">
              <span className="acct-log__timeline-title">
                <CheckCircle2
                  size={14}
                  aria-hidden
                  style={{ marginRight: 6, color: "var(--acct-green)", verticalAlign: "middle" }}
                />
                {formatAccountTemplate(copy.timeline.deliveredToTemplate, { name: recipient })}
              </span>
              <span className="acct-log__timeline-meta">
                {shipment.trackingCode}
                {copy.shipment.detailSeparator}
                {serviceLabel(shipment.serviceType, copy)}
                {shipment.zoneLabel ? `${copy.shipment.detailSeparator}${shipment.zoneLabel}` : ""}
                {href ? (
                  <>
                    {copy.shipment.detailSeparator}
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--acct-ink)", textDecoration: "none" }}
                    >
                      {copy.timeline.receiptCta}
                      <ArrowUpRight size={11} aria-hidden style={{ verticalAlign: "middle", marginLeft: 2 }} />
                    </a>
                  </>
                ) : null}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
