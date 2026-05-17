import { ArrowUpRight, Truck } from "lucide-react";

import { formatAccountTemplate, getAccountCopy } from "@henryco/i18n/server";

import { requireAccountUser } from "@/lib/auth";
import { getAccountAppLocale } from "@/lib/locale-server";
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

export async function generateMetadata() {
  const locale = await getAccountAppLocale();
  const copy = getAccountCopy(locale).divisionLogistics;
  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
  };
}

export default async function LogisticsPage() {
  const [locale, user] = await Promise.all([
    getAccountAppLocale(),
    requireAccountUser(),
  ]);
  const copy = getAccountCopy(locale).divisionLogistics;
  const email =
    typeof user.email === "string" && user.email.trim()
      ? user.email.trim().toLowerCase()
      : null;
  const snapshot = await getLogisticsSnapshotForAccountUser(user.id, email);

  return (
    <div className="acct-log acct-fade-in">
      <section className="acct-log__hero" aria-label={copy.hero.ariaLabel}>
        <div className="acct-log__hero-row">
          <div>
            <span className="acct-log__hero-eyebrow">
              <span className="acct-log__hero-eyebrow-dot" aria-hidden />
              {copy.hero.brand}
            </span>
            <h1 className="acct-log__hero-title hc-h1 acct-display">
              {copy.hero.title}
            </h1>
            <p className="acct-log__hero-blurb hc-body-sm">
              {copy.hero.body}
              <span style={{ whiteSpace: "nowrap" }}>{copy.hero.bodyDomain}</span>
              {" "}
            </p>
          </div>
          <a
            className="acct-log__hero-cta"
            href={logisticsBookUrl()}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Truck size={16} aria-hidden />
            {copy.hero.ctaNewDelivery}
            <ArrowUpRight size={14} aria-hidden />
          </a>
        </div>
        <HeroMetrics metrics={snapshot.metrics} copy={copy} />
      </section>

      <LiveShipmentMap
        active={snapshot.active}
        hasAnyShipments={snapshot.hasAnyShipments}
        copy={copy}
      />

      {snapshot.active.length > 0 ? (
        <section aria-labelledby="acct-log-active-head">
          <div className="acct-log__section-head">
            <h2 id="acct-log-active-head" className="acct-log__section-title hc-h3 acct-display">
              {copy.sections.activeTitle}
            </h2>
            <span className="acct-log__section-meta">
              {formatAccountTemplate(copy.sections.activeMetaTemplate, {
                count: snapshot.active.length,
              })}
            </span>
          </div>
          <div className="acct-log__rail" role="list" aria-label={copy.sections.activeRailAriaLabel}>
            {snapshot.active.map((s) => (
              <div role="listitem" key={s.id}>
                <ShipmentCard shipment={s} copy={copy} />
              </div>
            ))}
          </div>
        </section>
      ) : snapshot.hasAnyShipments ? (
        <section className="acct-log__empty" aria-label={copy.sections.emptyAriaLabel}>
          <span className="acct-log__empty-icon" aria-hidden>
            <Truck size={18} />
          </span>
          <h3 className="acct-log__empty-title">{copy.sections.emptyTitle}</h3>
          <p className="acct-log__empty-body">{copy.sections.emptyBody}</p>
        </section>
      ) : null}

      <section aria-labelledby="acct-log-actions-head">
        <div className="acct-log__section-head">
          <h2 id="acct-log-actions-head" className="acct-log__section-title hc-h3 acct-display">
            {copy.sections.actionsTitle}
          </h2>
          <span className="acct-log__section-meta">{copy.sections.actionsMeta}</span>
        </div>
        <QuickActions copy={copy} />
      </section>

      {snapshot.recent.length > 0 ? (
        <section aria-labelledby="acct-log-recent-head">
          <div className="acct-log__section-head">
            <h2 id="acct-log-recent-head" className="acct-log__section-title hc-h3 acct-display">
              {copy.sections.recentTitle}
            </h2>
            <span className="acct-log__section-meta">
              {formatAccountTemplate(copy.sections.recentMetaTemplate, {
                recent: snapshot.recent.length,
                lifetime: snapshot.shipments.length,
              })}
            </span>
          </div>
          <CompletedTimeline recent={snapshot.recent} copy={copy} />
        </section>
      ) : null}

      {snapshot.metrics.totalSpendMinor > 0 ? (
        <section aria-labelledby="acct-log-spend-head">
          <div className="acct-log__section-head">
            <h2 id="acct-log-spend-head" className="acct-log__section-title hc-h3 acct-display">
              {copy.sections.spendTitle}
            </h2>
            <span className="acct-log__section-meta">{copy.sections.spendMeta}</span>
          </div>
          <SpendStrip spendByMonth={snapshot.spendByMonth} copy={copy} />
        </section>
      ) : null}
    </div>
  );
}
