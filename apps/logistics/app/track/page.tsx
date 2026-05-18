import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Clock3, Eye, MapPinned, ShieldCheck } from "lucide-react";
import { getAccountUrl } from "@henryco/config";
import { translateSurfaceLabel } from "@henryco/i18n";
import { resolveLocalizedDynamicField } from "@henryco/i18n/server";
import { getLogisticsPublicLocale } from "@/lib/locale-server";
import { buildLogisticsMapViewport } from "@/lib/logistics/map-provider";
import {
  getPublicLogisticsSnapshot,
  getShipmentByTrackingLookup,
  getShipmentDetail,
} from "@/lib/logistics/data";
import { getRecentLogisticsShipmentsForViewer } from "@/lib/logistics/recent-shipments";
import { formatCurrency } from "@/lib/env";
import LogisticsTimeline from "@/components/tracking/LogisticsTimeline";
import RecentShipmentCards from "@/components/tracking/RecentShipmentCards";
import TrackingMapPanel from "@/components/tracking/TrackingMapPanel";
import {
  PortalHero,
  PortalLiveStrip,
  PortalSection,
  PortalDividedList,
  type PortalCapabilityMetric,
  type PortalDividedListItem,
} from "@/components/portal";
import "@/components/portal/styles.css";

export const metadata: Metadata = {
  title: "Track shipment | HenryCo Logistics",
  description:
    "Track your HenryCo Logistics shipment with milestone visibility and honest map context.",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ code?: string; phone?: string }>;
};

const LIFECYCLE_LABELS: Record<string, { label: string; tone: "active" | "good" | "warn" | "neutral" }> = {
  quote_requested: { label: "Quote requested", tone: "neutral" },
  quoted: { label: "Quoted", tone: "neutral" },
  awaiting_payment: { label: "Awaiting payment", tone: "neutral" },
  booked: { label: "Booked", tone: "neutral" },
  assigned: { label: "Rider assigned", tone: "active" },
  pickup_confirmed: { label: "Pickup confirmed", tone: "active" },
  in_transit: { label: "In transit", tone: "active" },
  delayed: { label: "Delayed", tone: "warn" },
  attempted_delivery: { label: "Attempted delivery", tone: "warn" },
  delivered: { label: "Delivered", tone: "good" },
  failed_delivery: { label: "Delivery failed", tone: "warn" },
  return_initiated: { label: "Return initiated", tone: "warn" },
  returned: { label: "Returned", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export default async function TrackPage({ searchParams }: Props) {
  const locale = await getLogisticsPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const { code, phone } = await searchParams;
  const [snapshot, recentShipmentsRaw] = await Promise.all([
    getPublicLogisticsSnapshot(),
    getRecentLogisticsShipmentsForViewer().catch(() => []),
  ]);
  // Pre-resolve zone_label for the recent-shipment cards (server-rendered)
  // so non-English customers see translated lane copy on the picker.
  // recipientName stays unwrapped — it's a personal name (PII).
  const recentShipments = await Promise.all(
    recentShipmentsRaw.map(async (item) => ({
      ...item,
      zoneLabel: item.zoneLabel
        ? await resolveLocalizedDynamicField({
            record: item as unknown as Record<string, unknown>,
            field: "zoneLabel",
            locale,
            fallback: item.zoneLabel,
            machineTranslate: locale !== "en",
          })
        : null,
    })),
  );
  const shipment =
    code && phone ? await getShipmentByTrackingLookup({ trackingCode: code, phone }) : null;
  const detail = shipment ? await getShipmentDetail(shipment.id) : null;
  const map = detail
    ? buildLogisticsMapViewport({
        lifecycleStatus: detail.shipment.lifecycleStatus,
        pickupAddress: detail.shipment.pickupAddress,
        dropoffAddress: detail.shipment.dropoffAddress,
        trackingPoints: detail.trackingPoints,
      })
    : null;
  const lookupAttempted = Boolean(code && phone);
  const status = detail ? LIFECYCLE_LABELS[detail.shipment.lifecycleStatus] : null;
  const isLive = status?.tone === "active" || status?.tone === "warn";
  const isDelivered = detail?.shipment.lifecycleStatus === "delivered";
  const promiseWindow = detail?.shipment.pricingBreakdown.promiseWindowHours;

  // Route Supabase-row text on the tracking surface through cached DeepL.
  //   - settings.trackingLookupHelp + settings.pickupHours: platform copy
  //     merged from `logistics_settings` rows.
  //   - shipment.zoneLabel: free-text lane label persisted on the row.
  //   - proof.note: dispatcher / rider proof note.
  //   - issue.summary / issue.details: customer-facing exception copy.
  //   - shipment.supportSummary: customer-facing support summary.
  //   - pickup/dropoff line1 / instructions / landmark: free-text address
  //     fields persisted on logistics_addresses; line1 is rendered raw.
  // TODO(list-row): recipient_name + sender_name are personal names (PII) —
  // skipped per the skip rule for proper-noun-like tokens.
  // TODO(list-row): detail.shipment.parcelDescription is not rendered on the
  // public tracking page (kept for ops); revisit if a public surface appears.
  const [
    trackingLookupHelpLocalized,
    zoneLabelLocalized,
    proofNoteLocalized,
    pickupLine1Localized,
    dropoffLine1Localized,
    issuesLocalized,
  ] = await Promise.all([
    resolveLocalizedDynamicField({
      record: snapshot.settings as unknown as Record<string, unknown>,
      field: "trackingLookupHelp",
      locale,
      fallback: snapshot.settings.trackingLookupHelp,
      machineTranslate: locale !== "en",
    }),
    detail?.shipment.zoneLabel
      ? resolveLocalizedDynamicField({
          record: detail.shipment as unknown as Record<string, unknown>,
          field: "zoneLabel",
          locale,
          fallback: detail.shipment.zoneLabel,
          machineTranslate: locale !== "en",
        })
      : Promise.resolve<string | null>(null),
    detail?.proof?.note
      ? resolveLocalizedDynamicField({
          record: detail.proof as unknown as Record<string, unknown>,
          field: "note",
          locale,
          fallback: detail.proof.note,
          machineTranslate: locale !== "en",
        })
      : Promise.resolve<string | null>(null),
    detail?.shipment.pickupAddress?.line1
      ? resolveLocalizedDynamicField({
          record: detail.shipment.pickupAddress as unknown as Record<string, unknown>,
          field: "line1",
          locale,
          fallback: detail.shipment.pickupAddress.line1,
          machineTranslate: locale !== "en",
        })
      : Promise.resolve<string | null>(null),
    detail?.shipment.dropoffAddress?.line1
      ? resolveLocalizedDynamicField({
          record: detail.shipment.dropoffAddress as unknown as Record<string, unknown>,
          field: "line1",
          locale,
          fallback: detail.shipment.dropoffAddress.line1,
          machineTranslate: locale !== "en",
        })
      : Promise.resolve<string | null>(null),
    detail
      ? Promise.all(
          detail.issues
            .filter((i) => i.status !== "resolved")
            .map(async (issue) => ({
              ...issue,
              summary: await resolveLocalizedDynamicField({
                record: issue as unknown as Record<string, unknown>,
                field: "summary",
                locale,
                fallback: issue.summary,
                machineTranslate: locale !== "en",
              }),
              details: await resolveLocalizedDynamicField({
                record: issue as unknown as Record<string, unknown>,
                field: "details",
                locale,
                fallback: issue.details,
                machineTranslate: locale !== "en",
              }),
            })),
        )
      : Promise.resolve<
          Array<(NonNullable<typeof detail>)["issues"][number]>
        >([]),
  ]);

  /*
   * Capability evidence for the tracking hero. When no lookup is in
   * play we surface platform-level numbers; once a shipment is loaded
   * we shift to shipment-level evidence (status, ETA, lane, promise
   * confidence). Every metric ships with a trend (anti-pattern #18).
   */
  const heroCapability: PortalCapabilityMetric[] = detail
    ? [
        {
          label: t("Status"),
          value: status?.label ? t(status.label) : t("Unknown"),
          trend: zoneLabelLocalized ?? t("Lane TBD"),
          trendDirection: status?.tone === "good" ? "pos" : "neutral",
          pulse: Boolean(isLive),
          emphasis: true,
        },
        {
          label: t("Promise window"),
          value: promiseWindow ? `${promiseWindow[0]}–${promiseWindow[1]}h` : "—",
          trend: `${detail.shipment.pricingBreakdown.promiseConfidence ?? 0}% ${t("confidence")}`,
        },
        {
          label: t("Service tier"),
          value: detail.shipment.serviceType.replaceAll("_", " "),
          trend: `${t("Urgency")} · ${detail.shipment.urgency}`,
        },
        {
          label: t("Indicative total"),
          value: new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(
            detail.shipment.amountQuoted,
          ),
          currencyGlyph: detail.shipment.pricingBreakdown.currency === "NGN" ? "₦" : "",
          trend: isDelivered ? t("Delivered") : t("Quoted at booking"),
        },
      ]
    : [
        {
          label: t("Active zones"),
          value: String(snapshot.zones.filter((z) => z.active).length),
          trend: t("Live coverage today"),
          trendDirection: "pos",
          pulse: snapshot.zones.some((z) => z.active),
          emphasis: true,
        },
        {
          label: t("Lookup security"),
          value: t("Phone-bound"),
          trend: t("Code + phone, never code alone"),
        },
        {
          label: t("Visibility"),
          value: t("Customer-only events"),
          trend: t("Internal dispatch noise hidden"),
        },
        {
          label: t("Proof model"),
          value: t("Recipient + time"),
          trend: snapshot.settings.timezone,
        },
      ];

  const promiseGuardrails: PortalDividedListItem[] = [
    {
      icon: Eye,
      title: t("Customer-visible milestones only"),
      body: t("We never show internal dispatch noise — only the events both sides can act on."),
    },
    {
      icon: ShieldCheck,
      title: t("Lookup is phone-bound"),
      body: t("The recipient or sender phone authorises the read, so codes alone do not leak shipment data."),
    },
    {
      icon: MapPinned,
      title: t("Live position when shared"),
      body: t("Map updates when dispatch shares a rider GPS pin. Until then, pickup and dropoff pins anchor the route."),
    },
  ];

  return (
    <main id="henryco-main" tabIndex={-1} className="px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[88rem] log-pf">
        <PortalHero
          eyebrow={t("Visibility · Milestones · Proof")}
          title={
            detail
              ? `${t("Tracking")} ${detail.shipment.trackingCode}.`
              : t("Track a shipment.")
          }
          blurb={
            detail
              ? `${zoneLabelLocalized ?? t("Lane pending")} · ${detail.shipment.serviceType.replaceAll(
                  "_",
                  " ",
                )} · ${detail.shipment.urgency}. ${t("Milestones update as dispatch progresses; signed-in customers see logistics activity inside their shared HenryCo account.")}`
              : `${trackingLookupHelpLocalized} ${t("Signed-in customers also see logistics activity inside their shared HenryCo account.")}`
          }
          capabilityMetrics={heroCapability}
          ctas={
            detail
              ? [
                  { href: "/support", label: t("Open a support thread"), variant: "secondary" },
                  {
                    href: getAccountUrl("/logistics"),
                    label: t("Account logistics hub"),
                    variant: "ghost",
                    external: true,
                  },
                ]
              : [
                  { href: "/book", label: t("Book a delivery"), variant: "primary" },
                  { href: "/quote", label: t("Request a quote"), variant: "secondary" },
                  {
                    href: getAccountUrl("/logistics"),
                    label: t("Account logistics hub"),
                    variant: "ghost",
                    external: true,
                  },
                ]
          }
        />

        {detail && isLive ? (
          <PortalLiveStrip
            eyebrow={t("Live · last update tracked")}
            title={status?.label ? t(status.label) : t("In motion")}
            meta={
              pickupLine1Localized && dropoffLine1Localized
                ? `${pickupLine1Localized} → ${dropoffLine1Localized}`
                : t("Awaiting pinned route")
            }
            etaLabel={t("ETA window")}
            etaValue={
              promiseWindow ? `${promiseWindow[0]}–${promiseWindow[1]}h` : "—"
            }
            etaMeta={
              `${detail.shipment.pricingBreakdown.promiseConfidence ?? 0}% ${t("confidence")}`
            }
          />
        ) : null}

        {recentShipments.length ? <RecentShipmentCards shipments={recentShipments} /> : null}

        <PortalSection
          id="log-pf-track-lookup"
          kicker={
            recentShipments.length
              ? t("Or enter a tracking code manually")
              : t("Look up a shipment")
          }
          title={t("Tracking code + phone.")}
          meta={t("Both fields required for secure lookup")}
        >
          <form
            className="mt-2 grid gap-4 border-y border-[var(--logistics-line)] py-6 sm:grid-cols-[1fr,1fr,auto] sm:items-end"
            method="get"
            action="/track"
          >
            <label className="grid gap-1 text-sm">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                {t("Tracking code")}
              </span>
              <input
                name="code"
                defaultValue={code || ""}
                required
                placeholder="HCL-XXXXXX"
                className="rounded-2xl border border-[var(--logistics-line)] bg-black/30 px-4 py-3 uppercase text-white placeholder:normal-case placeholder:text-white/30 focus:border-[var(--logistics-accent)]/60 focus:outline-none"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                {t("Sender or recipient phone")}
              </span>
              <input
                name="phone"
                type="tel"
                defaultValue={phone || ""}
                required
                placeholder="+234…"
                className="rounded-2xl border border-[var(--logistics-line)] bg-black/30 px-4 py-3 text-white placeholder:text-white/30 focus:border-[var(--logistics-accent)]/60 focus:outline-none"
              />
            </label>
            <div className="flex flex-wrap gap-3 sm:justify-end">
              <button type="submit" className="log-pf__cta log-pf__cta-primary">
                {t("View status")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </form>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <Link
              href={getAccountUrl("/logistics")}
              className="font-semibold text-[var(--logistics-accent-soft)] underline-offset-4 hover:underline"
            >
              {t("Account logistics hub")}
            </Link>
            <span className="text-white/30">·</span>
            <Link
              href="/support"
              className="font-semibold text-white/80 underline-offset-4 hover:underline"
            >
              {t("Contact dispatch")}
            </Link>
          </div>
        </PortalSection>

        {lookupAttempted && !detail ? (
          <section className="border-l-2 border-amber-400/60 pl-5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-amber-200/85">
              {t("No shipment found")}
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--logistics-muted)]">
              {t("We couldn’t find a shipment for that code and phone combination. Confirm the code on your booking confirmation and use the same phone you listed as sender or recipient. If both look correct, the dispatch desk can verify your record.")}
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <Link
                href="/support"
                className="font-semibold text-[var(--logistics-accent-soft)] underline-offset-4 hover:underline"
              >
                {t("Open a support thread")}
              </Link>
              <span className="text-white/30">·</span>
              <Link
                href="/book"
                className="font-semibold text-white/80 underline-offset-4 hover:underline"
              >
                {t("Book a new shipment")}
              </Link>
            </div>
          </section>
        ) : null}

        {detail && map ? (
          <div className="space-y-10">
            <section className="border-y border-[var(--logistics-line)] py-6">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-white/45">
                    {t("Shipment")}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[1.7rem]">
                    {detail.shipment.trackingCode}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--logistics-muted)]">
                    {zoneLabelLocalized || t("Lane TBD")} ·{" "}
                    {detail.shipment.serviceType.replaceAll("_", " ")} ·{" "}
                    {detail.shipment.urgency}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/45">
                    {t("Status")}
                  </p>
                  <p className="mt-1 text-lg font-semibold capitalize text-white">
                    {detail.shipment.lifecycleStatus.replaceAll("_", " ")}
                  </p>
                  <p className="mt-2 text-sm text-[var(--logistics-muted)]">
                    {t("Indicative total")}{" "}
                    {formatCurrency(
                      detail.shipment.amountQuoted,
                      detail.shipment.pricingBreakdown.currency,
                    )}
                  </p>
                  <p className="mt-1 text-xs text-[var(--logistics-muted)]">
                    {t("Typical window")} {detail.shipment.pricingBreakdown.promiseWindowHours[0]}–
                    {detail.shipment.pricingBreakdown.promiseWindowHours[1]}h · {t("confidence")}{" "}
                    {detail.shipment.pricingBreakdown.promiseConfidence}%
                  </p>
                </div>
              </div>
            </section>

            <TrackingMapPanel map={map} shipment={detail.shipment} locale={locale} />

            <section className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
              <div>
                <div className="flex items-baseline gap-3">
                  <Clock3 className="h-4 w-4 text-[var(--logistics-accent)]" aria-hidden />
                  <h3 className="text-base font-semibold tracking-tight text-white">
                    {t("Timeline")}
                  </h3>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                    {t("Customer-visible milestones")}
                  </span>
                </div>
                <div className="mt-6 border-t border-[var(--logistics-line)] pt-6">
                  <LogisticsTimeline shipment={detail.shipment} events={detail.events} />
                </div>
              </div>
              <div className="space-y-8">
                <div>
                  <div className="flex items-baseline gap-3">
                    <ShieldCheck className="h-4 w-4 text-[var(--logistics-accent)]" aria-hidden />
                    <h3 className="text-base font-semibold tracking-tight text-white">
                      {t("Proof of delivery")}
                    </h3>
                  </div>
                  {detail.proof ? (
                    <dl className="mt-5 divide-y divide-[var(--logistics-line)] border-y border-[var(--logistics-line)]">
                      <div className="flex items-baseline gap-3 py-3">
                        <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                          {t("Recipient")}
                        </dt>
                        <dd className="ml-auto text-right text-sm font-semibold tracking-tight text-white">
                          {detail.proof.recipientName}
                        </dd>
                      </div>
                      <div className="flex items-baseline gap-3 py-3">
                        <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                          {t("Delivered")}
                        </dt>
                        <dd className="ml-auto text-right text-sm font-semibold tracking-tight text-white">
                          {new Date(detail.proof.deliveredAt).toLocaleString()}
                        </dd>
                      </div>
                      <div className="flex items-baseline gap-3 py-3">
                        <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                          {t("Type")}
                        </dt>
                        <dd className="ml-auto text-right text-sm font-semibold capitalize tracking-tight text-white">
                          {detail.proof.proofType}
                        </dd>
                      </div>
                      {proofNoteLocalized ? (
                        <div className="py-3">
                          <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                            {t("Note")}
                          </dt>
                          <dd className="mt-1 text-sm leading-7 text-[var(--logistics-muted)]">
                            {proofNoteLocalized}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : (
                    <p className="mt-4 text-sm leading-7 text-[var(--logistics-muted)]">
                      {t("Proof will appear here after delivery is completed and verified.")}
                    </p>
                  )}
                </div>
                {issuesLocalized.length > 0 ? (
                  <div className="border-l-2 border-amber-400/55 pl-5">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-amber-200/85">
                      {t("Active exception")}
                    </p>
                    <ul className="mt-3 space-y-3 text-sm leading-7 text-[var(--logistics-muted)]">
                      {issuesLocalized.map((issue) => (
                        <li key={issue.id}>
                          <span className="font-semibold text-white">{issue.summary}</span> —{" "}
                          {issue.details}
                        </li>
                      ))}
                    </ul>
                    <a
                      href={`mailto:${snapshot.settings.supportEmail}`}
                      className="mt-3 inline-block text-sm font-semibold text-[var(--logistics-accent-soft)] underline-offset-4 hover:underline"
                    >
                      {t("Contact support")}
                    </a>
                  </div>
                ) : null}
                <div className="border-l-2 border-[var(--logistics-accent)]/55 pl-5">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--logistics-accent-soft)]">
                    <MapPinned className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />
                    {t("Lane note")}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--logistics-muted)]">
                    {pickupLine1Localized ?? t("Pickup TBD")} →{" "}
                    {dropoffLine1Localized ?? t("Dropoff TBD")}. {t("Promise window")}{" "}
                    {detail.shipment.pricingBreakdown.promiseWindowHours[0]}–
                    {detail.shipment.pricingBreakdown.promiseWindowHours[1]}h.
                  </p>
                </div>
              </div>
            </section>
          </div>
        ) : null}

        {!detail ? (
          <PortalSection
            id="log-pf-track-promise"
            kicker={t("The tracking contract")}
            title={t("What you see, and why we built it this way.")}
          >
            <PortalDividedList items={promiseGuardrails} />
          </PortalSection>
        ) : null}
      </div>
    </main>
  );
}
