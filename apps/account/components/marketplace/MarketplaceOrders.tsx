import { Package, PackageCheck, PackageX, Truck, Pencil } from "lucide-react";

import {
  formatNaira,
  formatStamp,
  orderKind,
  orderStatusLabel,
  type OrderKind,
  type OrderRow,
} from "./helpers";

type OrdersLabels = {
  ariaLabel: string;
  rowTitleTemplate: string;
  rowSubTemplate: string;
  rowAriaLabelTemplate: string;
  statusFallbackDraft: string;
  statusValueLabels: Record<string, string>;
  dash: string;
};

type Props = {
  orders: ReadonlyArray<OrderRow>;
  marketplaceOrigin: string;
  labels: OrdersLabels;
  limit?: number;
};

const ICON_BY_KIND: Record<OrderKind, typeof Package> = {
  "in-flight": Truck,
  delivered: PackageCheck,
  issue: PackageX,
  scheduled: Package,
  draft: Pencil,
};

function fill(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export function MarketplaceOrders({ orders, marketplaceOrigin, labels, limit = 8 }: Props) {
  const rows = orders.slice(0, limit);
  if (rows.length === 0) return null;

  return (
    <div className="acct-mkt__list" role="list" aria-label={labels.ariaLabel}>
      {rows.map((order) => {
        const kind = orderKind(order);
        const Icon = ICON_BY_KIND[kind];
        const status = orderStatusLabel(order, {
          statusValueLabels: labels.statusValueLabels,
          fallbackDraft: labels.statusFallbackDraft,
        });
        const stamp = formatStamp(order.placedAt, labels.dash);
        const orderNo = order.orderNo || order.id.slice(0, 8);
        const href = `${marketplaceOrigin}/orders/${encodeURIComponent(order.id)}`;

        return (
          <a
            key={order.id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="acct-mkt__row"
            role="listitem"
            aria-label={fill(labels.rowAriaLabelTemplate, { orderNo, status })}
          >
            <span className="acct-mkt__row-icon" data-kind={kind} aria-hidden>
              <Icon size={16} />
            </span>
            <div className="acct-mkt__row-meta">
              <span className="acct-mkt__row-title">
                {fill(labels.rowTitleTemplate, { orderNo })}
              </span>
              <span className="acct-mkt__row-sub">
                {fill(labels.rowSubTemplate, {
                  amount: formatNaira(order.grandTotal),
                  stamp,
                })}
              </span>
            </div>
            <span className="acct-mkt__chip" data-kind={kind}>
              {status}
            </span>
          </a>
        );
      })}
    </div>
  );
}
