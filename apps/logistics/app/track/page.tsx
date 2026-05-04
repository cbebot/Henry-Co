import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Clock3, Eye, MapPinned, ShieldCheck } from "lucide-react";
import { getAccountUrl } from "@henryco/config";
import { buildLogisticsMapViewport } from "@/lib/logistics/map-provider";
import { getPublicLogisticsSnapshot, getShipmentByTrackingLookup, getShipmentDetail } from "@/lib/logistics/data";
import { getRecentLogisticsShipmentsForViewer } from "@/lib/logistics/recent-shipments";
import { formatCurrency } from "@/lib/env";
import LogisticsTimeline from "@/components/tracking/LogisticsTimeline";
import RecentShipmentCards from "@/components/tracking/RecentShipmentCards";
import TrackingMapPanel from "@/components/tracking/TrackingMapPanel";

export const metadata: Metadata = {
  title: "Track shipment | HenryCo Logistics",
  description: "Track your HenryCo Logistics shipment with milestone visibility and honest map context.",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ code?: string; phone?: string }>;
};

export default async function TrackPage({ searchParams }: Props) {
  const { code, phone } = await searchParams;
  const [snapshot, recentShipments] = await Promise.all([
    getPublicLogisticsSnapshot(),
    getRecentLogisticsShipmentsForViewer().catch(() => []),
  ]);
  const shipment = code && phone ? await getShipmentByTrackingLookup({ trackingCode: code, phone }) : null;
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

  return (
    <main id="henryco-main" tabIndex={-1} className="px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[88rem] space-y-12">
        <section>
          <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--logistics-accent-soft)]">
                Visibility &middot; Milestones &middot; Proof
              </p>
              <h1 className="mt-5 max-w-2xl text-balance text-[2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-white sm:text-[2.6rem] md:text-[3rem]">
                Track a shipment.
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--logistics-muted)]">
                {snapshot.settings.trackingLookupHelp} Signed-in customers also see logistics
                activity inside their shared HenryCo account.
              </p>
            </div>
            <ul className="grid gap-3 text-sm">
              {[
                {
                  icon: Eye,
                  title: "Customer-visible milestones only",
                  body: "We never show internal dispatch noise — only the events both sides can act on.",
                },
                {
                  icon: ShieldCheck,
                  title: "Lookup is phone-bound",
                  body: "The recipient or sender phone authorises the read, so codes alone do not leak shipment data.",
                },
              ].map(({ icon: Icon, title, body }) => (
                <li
                  key={title}
                  className="flex gap-4 border-b border-[var(--logistics-line)] py-4 last:border-b-0"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--logistics-line)] bg-white/[0.03] text-[var(--logistics-accent)]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold tracking-tight text-white">{title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--logistics-muted)]">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {recentShipments.length ? (
          <RecentShipmentCards shipments={recentShipments} />
        ) : null}

        <section>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
            {recentShipments.length
              ? "Or enter a tracking code manually"
              : "Look up a shipment"}
          </p>
          <form
            className="mt-5 grid gap-4 border-y border-[var(--logistics-line)] py-6 sm:grid-cols-[1fr,1fr,auto] sm:items-end"
            method="get"
            action="/track"
          >
            <label className="grid gap-1 text-sm">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                Tracking code
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
                Sender or recipient phone
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
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#f6e2d0_0%,var(--logistics-accent)_52%,#9f8b7d_100%)] px-6 py-3 text-sm font-semibold text-[#170f12] transition hover:-translate-y-0.5"
              >
                View status
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <Link
              href={getAccountUrl("/logistics")}
              className="font-semibold text-[var(--logistics-accent-soft)] underline-offset-4 hover:underline"
            >
              Account logistics hub
            </Link>
            <span className="text-white/30">·</span>
            <Link
              href="/support"
              className="font-semibold text-white/80 underline-offset-4 hover:underline"
            >
              Contact dispatch
            </Link>
          </div>
        </section>

        {lookupAttempted && !detail ? (
          <section className="border-l-2 border-amber-400/60 pl-5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-amber-200/85">
              No shipment found
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--logistics-muted)]">
              We couldn’t find a shipment for that code and phone combination. Confirm the code on
              your booking confirmation and use the same phone you listed as sender or recipient.
              If both look correct, the dispatch desk can verify your record.
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <Link
                href="/support"
                className="font-semibold text-[var(--logistics-accent-soft)] underline-offset-4 hover:underline"
              >
                Open a support thread
              </Link>
              <span className="text-white/30">·</span>
              <Link
                href="/book"
                className="font-semibold text-white/80 underline-offset-4 hover:underline"
              >
                Book a new shipment
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
                    Shipment
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[1.7rem]">
                    {detail.shipment.trackingCode}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--logistics-muted)]">
                    {detail.shipment.zoneLabel || "Lane TBD"} ·{" "}
                    {detail.shipment.serviceType.replaceAll("_", " ")} · {detail.shipment.urgency}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/45">
                    Status
                  </p>
                  <p className="mt-1 text-lg font-semibold capitalize text-white">
                    {detail.shipment.lifecycleStatus.replaceAll("_", " ")}
                  </p>
                  <p className="mt-2 text-sm text-[var(--logistics-muted)]">
                    Indicative total{" "}
                    {formatCurrency(detail.shipment.amountQuoted, detail.shipment.pricingBreakdown.currency)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--logistics-muted)]">
                    Typical window {detail.shipment.pricingBreakdown.promiseWindowHours[0]}–
                    {detail.shipment.pricingBreakdown.promiseWindowHours[1]}h · confidence{" "}
                    {detail.shipment.pricingBreakdown.promiseConfidence}%
                  </p>
                </div>
              </div>
            </section>

            <TrackingMapPanel map={map} />

            <section className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
              <div>
                <div className="flex items-baseline gap-3">
                  <Clock3 className="h-4 w-4 text-[var(--logistics-accent)]" aria-hidden />
                  <h3 className="text-base font-semibold tracking-tight text-white">Timeline</h3>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                    Customer-visible milestones
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
                      Proof of delivery
                    </h3>
                  </div>
                  {detail.proof ? (
                    <dl className="mt-5 divide-y divide-[var(--logistics-line)] border-y border-[var(--logistics-line)]">
                      <div className="flex items-baseline gap-3 py-3">
                        <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                          Recipient
                        </dt>
                        <dd className="ml-auto text-right text-sm font-semibold tracking-tight text-white">
                          {detail.proof.recipientName}
                        </dd>
                      </div>
                      <div className="flex items-baseline gap-3 py-3">
                        <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                          Delivered
                        </dt>
                        <dd className="ml-auto text-right text-sm font-semibold tracking-tight text-white">
                          {new Date(detail.proof.deliveredAt).toLocaleString()}
                        </dd>
                      </div>
                      <div className="flex items-baseline gap-3 py-3">
                        <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                          Type
                        </dt>
                        <dd className="ml-auto text-right text-sm font-semibold capitalize tracking-tight text-white">
                          {detail.proof.proofType}
                        </dd>
                      </div>
                      {detail.proof.note ? (
                        <div className="py-3">
                          <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                            Note
                          </dt>
                          <dd className="mt-1 text-sm leading-7 text-[var(--logistics-muted)]">
                            {detail.proof.note}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : (
                    <p className="mt-4 text-sm leading-7 text-[var(--logistics-muted)]">
                      Proof will appear here after delivery is completed and verified.
                    </p>
                  )}
                </div>
                {detail.issues.filter((i) => i.status !== "resolved").length > 0 ? (
                  <div className="border-l-2 border-amber-400/55 pl-5">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-amber-200/85">
                      Active exception
                    </p>
                    <ul className="mt-3 space-y-3 text-sm leading-7 text-[var(--logistics-muted)]">
                      {detail.issues
                        .filter((i) => i.status !== "resolved")
                        .map((issue) => (
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
                      Contact support
                    </a>
                  </div>
                ) : null}
                <div className="border-l-2 border-[var(--logistics-accent)]/55 pl-5">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--logistics-accent-soft)]">
                    <MapPinned className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />
                    Lane note
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--logistics-muted)]">
                    {detail.shipment.pickupAddress?.line1 ?? "Pickup TBD"} →{" "}
                    {detail.shipment.dropoffAddress?.line1 ?? "Dropoff TBD"}. Promise window{" "}
                    {detail.shipment.pricingBreakdown.promiseWindowHours[0]}–
                    {detail.shipment.pricingBreakdown.promiseWindowHours[1]}h.
                  </p>
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
