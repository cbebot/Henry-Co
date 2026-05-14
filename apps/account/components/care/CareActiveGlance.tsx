import { ArrowUpRight, Calendar, CreditCard, MapPin } from "lucide-react";

import type { LinkedCareBooking } from "@/lib/care-sync";
import {
  formatBookingWhen,
  formatNaira,
  statusKind,
  statusLabel,
  type CareLocale,
} from "./helpers";

type Props = {
  booking: LinkedCareBooking;
  locale: CareLocale;
  labels: {
    nextActionLabel: string;
    serviceLabel: string;
    pickupLabel: string;
    balanceLabel: string;
    trackingLabel: string;
  };
};

export function CareActiveGlance({ booking, locale, labels }: Props) {
  const kind = statusKind(booking);
  const status = statusLabel(booking, locale);
  const when = formatBookingWhen(booking.pickup_date, booking.pickup_slot, locale);
  const action = booking.nextAction;
  const balance = booking.payment.balanceDue;

  return (
    <section
      className="acct-care__glance"
      data-tone={action.tone}
      data-kind={kind}
      aria-label={labels.nextActionLabel}
    >
      <header className="acct-care__glance-head">
        <div>
          <span className="acct-care__glance-kicker">{labels.nextActionLabel}</span>
          <h2 className="acct-care__glance-title">{action.label}</h2>
          <p className="acct-care__glance-desc">{action.description}</p>
        </div>
        <span className="acct-care__glance-status" data-kind={kind}>
          {status}
        </span>
      </header>

      <dl className="acct-care__glance-meta">
        <div className="acct-care__glance-meta-row">
          <dt>
            <Calendar size={14} aria-hidden />
            {labels.serviceLabel}
          </dt>
          <dd>{booking.service_type || "Care service"}</dd>
        </div>
        <div className="acct-care__glance-meta-row">
          <dt>
            <MapPin size={14} aria-hidden />
            {labels.pickupLabel}
          </dt>
          <dd>
            <span className="acct-care__glance-meta-primary">{when}</span>
            {booking.pickup_address ? (
              <span className="acct-care__glance-meta-secondary">{booking.pickup_address}</span>
            ) : null}
          </dd>
        </div>
        {booking.tracking_code ? (
          <div className="acct-care__glance-meta-row">
            <dt>{labels.trackingLabel}</dt>
            <dd>
              <code className="acct-care__glance-code">{booking.tracking_code}</code>
            </dd>
          </div>
        ) : null}
        {balance > 0 ? (
          <div className="acct-care__glance-meta-row" data-emphasis="payment">
            <dt>
              <CreditCard size={14} aria-hidden />
              {labels.balanceLabel}
            </dt>
            <dd>{formatNaira(balance)}</dd>
          </div>
        ) : null}
      </dl>

      <a
        className="acct-care__glance-cta"
        href={action.href}
        target={action.href.startsWith("/") ? undefined : "_blank"}
        rel={action.href.startsWith("/") ? undefined : "noopener noreferrer"}
        data-tone={action.tone}
      >
        {action.label}
        <ArrowUpRight size={14} aria-hidden />
      </a>
    </section>
  );
}
