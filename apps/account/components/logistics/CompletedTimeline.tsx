import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import {
  logisticsTrackUrl,
  type AccountLogisticsShipment,
} from "@/lib/logistics-module";
import { serviceLabel, shortDate } from "./status";

type Props = {
  recent: AccountLogisticsShipment[];
};

export function CompletedTimeline({ recent }: Props) {
  if (recent.length === 0) return null;
  return (
    <ul className="acct-log__timeline" role="list" aria-label="Recent deliveries">
      {recent.map((shipment) => {
        const ref = shipment.lastEventAt || shipment.updatedAt || shipment.createdAt;
        const when = shortDate(ref);
        const href = shipment.trackingCode ? logisticsTrackUrl(shipment.trackingCode) : null;
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
                Delivered to {shipment.dropoff?.contactName || shipment.recipientName}
              </span>
              <span className="acct-log__timeline-meta">
                {shipment.trackingCode} · {serviceLabel(shipment.serviceType)}
                {shipment.zoneLabel ? ` · ${shipment.zoneLabel}` : ""}
                {href ? (
                  <>
                    {" · "}
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--acct-ink)", textDecoration: "none" }}
                    >
                      Receipt
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
