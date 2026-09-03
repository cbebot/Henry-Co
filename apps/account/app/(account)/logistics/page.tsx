import { RouteLiveRefresh } from "@henryco/ui";
import { Truck } from "lucide-react";

import { formatAccountTemplate, getAccountCopy } from "@henryco/i18n/server";
import {
  HeroCard,
  EmptyStateCard,
  NextStepRow,
  DivisionLanding,
  type HeroCardTile,
} from "@henryco/dashboard-shell/surfaces";

import { requireAccountUser } from "@/lib/auth";
import { DivisionResumeChip } from "@/components/recovery/DivisionResumeChip";
import { getAccountAppLocale } from "@/lib/locale-server";
import {
  getLogisticsSnapshotForAccountUser,
  logisticsBookUrl,
} from "@/lib/logistics-module";

import "@/components/logistics/styles.css";
import { CompletedTimeline } from "@/components/logistics/CompletedTimeline";
import { LiveShipmentMap } from "@/components/logistics/LiveShipmentMap";
import { QuickActions } from "@/components/logistics/QuickActions";
import { ShipmentCard } from "@/components/logistics/ShipmentCard";
import { SpendStrip } from "@/components/logistics/SpendStrip";

export const dynamic = "force-dynamic";

function formatSpendCompact(amountMinor: number): string {
  const naira = amountMinor / 100;
  if (naira >= 1_000_000) {
    const v = (naira / 1_000_000).toFixed(naira >= 10_000_000 ? 0 : 1);
    return `₦${v}m`;
  }
  if (naira >= 1_000) {
    const v = (naira / 1_000).toFixed(naira >= 10_000 ? 0 : 1);
    return `₦${v}k`;
  }
  return `₦${Math.round(naira).toLocaleString("en-NG")}`;
}

export async function generateMetadata() {
  const locale = await getAccountAppLocale();
  const copy = getAccountCopy(locale).divisionLogistics;
  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
  };
}

/**
 * Logistics landing.
 *
 * ACCOUNT-PREMIUM-01 (session 2, Phase 2B). Lifts the inline hero into the
 * shared <HeroCard /> primitive. Preserves LiveShipmentMap. Surfaces a
 * NextStepRow for delayed or exception shipments.
 */
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

  // ── State picker ─────────────────────────────────────────────────
  const delayedOrException = snapshot.active.find((s) => {
    const status = String(s.lifecycleStatus || "").toLowerCase();
    return status === "delayed" || status === "exception" || status === "attempted_delivery";
  });

  const state: "empty" | "calm" | "active" | "attention" =
    snapshot.metrics.activeCount === 0 && snapshot.shipments.length === 0
      ? "empty"
      : delayedOrException
        ? "attention"
        : snapshot.metrics.activeCount > 0
          ? "active"
          : "calm";

  // ── HeroCard tiles (lifted from HeroMetrics) ─────────────────────
  const tiles: ReadonlyArray<HeroCardTile> = [
    {
      label: copy.metrics.activeNowLabel,
      value: snapshot.metrics.activeCount,
      foot:
        snapshot.metrics.activeCount === 1
          ? copy.metrics.activeFootSingular
          : copy.metrics.activeFootPlural,
      tone: snapshot.metrics.activeCount > 0 ? "active" : "default",
    },
    {
      label: copy.metrics.deliveredMonthLabel,
      value: snapshot.metrics.deliveredThisMonth,
      foot: formatAccountTemplate(copy.metrics.deliveredMonthFootTemplate, {
        count: snapshot.metrics.lifetimeShipments,
      }),
    },
    {
      label: copy.metrics.onTimeRateLabel,
      value:
        snapshot.metrics.onTimeRatePct == null
          ? "—"
          : `${snapshot.metrics.onTimeRatePct}%`,
      foot:
        snapshot.metrics.onTimeRatePct == null
          ? copy.metrics.onTimeRateFootEmpty
          : copy.metrics.onTimeRateFootHasValue,
      tone:
        snapshot.metrics.onTimeRatePct !== null && snapshot.metrics.onTimeRatePct >= 90
          ? "accent"
          : "default",
    },
    {
      label: copy.metrics.totalSpendLabel,
      value: formatSpendCompact(snapshot.metrics.totalSpendMinor),
      foot: copy.metrics.totalSpendFoot,
    },
  ];

  let nextStep: React.ReactNode = null;
  if (delayedOrException) {
    const drop = delayedOrException.dropoff;
    const dropLabel = drop
      ? [drop.line1, drop.city].filter(Boolean).join(", ") || null
      : null;
    nextStep = (
      <NextStepRow
        tone="attention"
        kicker={copy.statusLabels.delayed}
        title={delayedOrException.trackingCode || copy.hero.title}
        detail={dropLabel ?? copy.shipment.addressPending}
        cta={{
          label: copy.shipment.trackCta,
          href: `${logisticsBookUrl()}/track/${delayedOrException.trackingCode}`,
          newTab: true,
        }}
      />
    );
  }

  const sections = [
    ...(snapshot.active.length > 0
      ? [
          {
            id: "acct-log-active",
            title: copy.sections.activeTitle,
            meta: formatAccountTemplate(copy.sections.activeMetaTemplate, {
              count: snapshot.active.length,
            }),
            content: (
              <div
                className="acct-log__rail"
                role="list"
                aria-label={copy.sections.activeRailAriaLabel}
              >
                {snapshot.active.map((s) => (
                  <div role="listitem" key={s.id}>
                    <ShipmentCard shipment={s} copy={copy} />
                  </div>
                ))}
              </div>
            ),
          },
        ]
      : snapshot.hasAnyShipments
        ? [
            {
              id: "acct-log-empty-active",
              title: copy.sections.activeTitle,
              meta: copy.sections.emptyAriaLabel,
              content: (
                <EmptyStateCard
                  kicker={copy.sections.activeTitle}
                  title={copy.sections.emptyTitle}
                  body={copy.sections.emptyBody}
                  cta={{
                    label: copy.hero.ctaNewDelivery,
                    href: logisticsBookUrl(),
                    newTab: true,
                  }}
                />
              ),
            },
          ]
        : []),
    {
      id: "acct-log-actions",
      title: copy.sections.actionsTitle,
      meta: copy.sections.actionsMeta,
      content: <QuickActions copy={copy} />,
    },
    ...(snapshot.recent.length > 0
      ? [
          {
            id: "acct-log-recent",
            title: copy.sections.recentTitle,
            meta: formatAccountTemplate(copy.sections.recentMetaTemplate, {
              recent: snapshot.recent.length,
              lifetime: snapshot.shipments.length,
            }),
            content: <CompletedTimeline recent={snapshot.recent} copy={copy} />,
          },
        ]
      : []),
    ...(snapshot.metrics.totalSpendMinor > 0
      ? [
          {
            id: "acct-log-spend",
            title: copy.sections.spendTitle,
            meta: copy.sections.spendMeta,
            content: <SpendStrip spendByMonth={snapshot.spendByMonth} copy={copy} />,
          },
        ]
      : []),
  ];

  const heroTone: "calm" | "active" | "attention" | "empty" =
    state === "empty"
      ? "empty"
      : state === "attention"
        ? "attention"
        : state === "active"
          ? "active"
          : "calm";

  return (
    <DivisionLanding
      className="acct-log acct-fade-in"
      hero={
        <HeroCard
          variant="paired"
          tone={heroTone}
          eyebrow={`${copy.hero.brand}`}
          headline={copy.hero.title}
          blurb={`${copy.hero.body} ${copy.hero.bodyDomain}`}
          ariaLabel={copy.hero.ariaLabel}
          ariaTilesLabel={copy.metrics.ariaLabel}
          ctaPrimary={{
            label: copy.hero.ctaNewDelivery,
            href: logisticsBookUrl(),
            newTab: true,
          }}
          tiles={tiles}
          side={{
            kicker: copy.metrics.activeNowLabel,
            title: copy.metrics.totalSpendLabel,
            body: copy.metrics.totalSpendFoot,
          }}
        />
      }
      nextStep={
        <>
          {/* SP6: division-scoped resume chip — renders only when a REAL pending journey exists here. */}
          <DivisionResumeChip division="logistics" userId={user.id} />
          {nextStep}
        </>
      }
      /* SMART (2026-07-10): statuses tick without manual refresh — same 15s
         visible-tab revalidate the marketplace + wallet landings already run. */
      footer={<RouteLiveRefresh />}
      sections={[
        {
          id: "acct-log-map",
          title: copy.sections.activeTitle,
          meta: copy.sections.activeRailAriaLabel,
          content: (
            <LiveShipmentMap
              active={snapshot.active}
              hasAnyShipments={snapshot.hasAnyShipments}
              copy={copy}
            />
          ),
        },
        ...sections,
      ]}
    />
  );
}
// Truck import kept available for potential future use; preserved so existing
// CSS / iconography contracts stay accessible.
void Truck;
