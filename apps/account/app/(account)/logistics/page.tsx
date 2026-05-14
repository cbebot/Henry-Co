import { ArrowUpRight, Truck } from "lucide-react";

import { requireAccountUser } from "@/lib/auth";
import {
  getLogisticsSnapshotForAccountUser,
  logisticsBookUrl,
} from "@/lib/logistics-module";

import "@/components/logistics/styles.css";
import { CompletedTimeline } from "@/components/logistics/CompletedTimeline";
import { HeroMetrics } from "@/components/logistics/HeroMetrics";
import { LiveShipmentMap } from "@/components/logistics/LiveShipmentMap";
import { QuickActions } from "@/components/logistics/QuickActions";
import { ShipmentCard } from "@/components/logistics/ShipmentCard";
import { SpendStrip } from "@/components/logistics/SpendStrip";

export const dynamic = "force-dynamic";

export default async function LogisticsPage() {
  const user = await requireAccountUser();
  const email =
    typeof user.email === "string" && user.email.trim()
      ? user.email.trim().toLowerCase()
      : null;
  const snapshot = await getLogisticsSnapshotForAccountUser(user.id, email);

  return (
    <div className="acct-log acct-fade-in">
      <section className="acct-log__hero" aria-label="Logistics overview">
        <div className="acct-log__hero-row">
          <div>
            <span className="acct-log__hero-eyebrow">
              <span className="acct-log__hero-eyebrow-dot" aria-hidden />
              HenryCo Logistics
            </span>
            <h1 className="acct-log__hero-title hc-h1 acct-display">
              Every parcel, one room.
            </h1>
            <p className="acct-log__hero-blurb hc-body-sm">
              Pickups, drop-offs, ETAs and proofs of delivery — all mirrored
              from the logistics network into your account. Book once on
              <span style={{ whiteSpace: "nowrap" }}> logistics.henrycogroup.com</span>
              and your shipments appear here automatically.
            </p>
          </div>
          <a
            className="acct-log__hero-cta"
            href={logisticsBookUrl()}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Truck size={16} aria-hidden />
            New delivery
            <ArrowUpRight size={14} aria-hidden />
          </a>
        </div>
        <HeroMetrics metrics={snapshot.metrics} />
      </section>

      <LiveShipmentMap active={snapshot.active} hasAnyShipments={snapshot.hasAnyShipments} />

      {snapshot.active.length > 0 ? (
        <section aria-labelledby="acct-log-active-head">
          <div className="acct-log__section-head">
            <h2 id="acct-log-active-head" className="acct-log__section-title hc-h3 acct-display">
              In flight right now
            </h2>
            <span className="acct-log__section-meta">
              {snapshot.active.length} active · auto-syncs from logistics
            </span>
          </div>
          <div className="acct-log__rail" role="list" aria-label="Active shipments">
            {snapshot.active.map((s) => (
              <div role="listitem" key={s.id}>
                <ShipmentCard shipment={s} />
              </div>
            ))}
          </div>
        </section>
      ) : snapshot.hasAnyShipments ? (
        <section className="acct-log__empty" aria-label="No active shipments">
          <span className="acct-log__empty-icon" aria-hidden>
            <Truck size={18} />
          </span>
          <h3 className="acct-log__empty-title">No active shipments</h3>
          <p className="acct-log__empty-body">
            Your past deliveries are below. Book another and it will appear
            here as soon as the rider confirms pickup.
          </p>
        </section>
      ) : null}

      <section aria-labelledby="acct-log-actions-head">
        <div className="acct-log__section-head">
          <h2 id="acct-log-actions-head" className="acct-log__section-title hc-h3 acct-display">
            Run a delivery
          </h2>
          <span className="acct-log__section-meta">Shortcuts to common flows</span>
        </div>
        <QuickActions />
      </section>

      {snapshot.recent.length > 0 ? (
        <section aria-labelledby="acct-log-recent-head">
          <div className="acct-log__section-head">
            <h2 id="acct-log-recent-head" className="acct-log__section-title hc-h3 acct-display">
              Recently delivered
            </h2>
            <span className="acct-log__section-meta">
              Last {snapshot.recent.length} of {snapshot.shipments.length} lifetime
            </span>
          </div>
          <CompletedTimeline recent={snapshot.recent} />
        </section>
      ) : null}

      {snapshot.metrics.totalSpendMinor > 0 ? (
        <section aria-labelledby="acct-log-spend-head">
          <div className="acct-log__section-head">
            <h2 id="acct-log-spend-head" className="acct-log__section-title hc-h3 acct-display">
              Spend · last 6 months
            </h2>
            <span className="acct-log__section-meta">Paid only</span>
          </div>
          <SpendStrip spendByMonth={snapshot.spendByMonth} />
        </section>
      ) : null}
    </div>
  );
}
