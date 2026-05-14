import { Package, PackageCheck, PackageX, Truck, Pencil } from "lucide-react";

import {
  formatNaira,
  formatStamp,
  orderKind,
  orderStatusLabel,
  type OrderKind,
  type OrderRow,
} from "./helpers";

type Props = {
  orders: ReadonlyArray<OrderRow>;
  marketplaceOrigin: string;
  limit?: number;
};

const ICON_BY_KIND: Record<OrderKind, typeof Package> = {
  "in-flight": Truck,
  delivered: PackageCheck,
  issue: PackageX,
  scheduled: Package,
  draft: Pencil,
};

export function MarketplaceOrders({ orders, marketplaceOrigin, limit = 8 }: Props) {
  const rows = orders.slice(0, limit);
  if (rows.length === 0) return null;

  return (
    <div className="acct-mkt__list" role="list" aria-label="Recent orders">
      {rows.map((order) => {
        const kind = orderKind(order);
        const Icon = ICON_BY_KIND[kind];
        const status = orderStatusLabel(order);
        const stamp = formatStamp(order.placedAt);
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
            aria-label={`Order ${orderNo} · ${status}`}
          >
            <span className="acct-mkt__row-icon" data-kind={kind} aria-hidden>
              <Icon size={16} />
            </span>
            <div className="acct-mkt__row-meta">
              <span className="acct-mkt__row-title">Order {orderNo}</span>
              <span className="acct-mkt__row-sub">
                {formatNaira(order.grandTotal)} · placed {stamp}
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
