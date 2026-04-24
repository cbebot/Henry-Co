import Link from "next/link";
import type { Metadata } from "next";
import { getAccountUrl } from "@henryco/config";
import { buildLogisticsMapViewport } from "@/lib/logistics/map-provider";
import { getPublicLogisticsSnapshot, getShipmentByTrackingLookup, getShipmentDetail } from "@/lib/logistics/data";
import { formatCurrency } from "@/lib/env";
import LogisticsTimeline from "@/components/tracking/LogisticsTimeline";
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
  const snapshot = await getPublicLogisticsSnapshot();
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

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-10">
        <div>
          <h1 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">Track a shipment.</h1>
          <p className="mt-3 max-w-2xl text-pretty text-sm text-[var(--logistics-muted)] sm:text-base">
            {snapshot.settings.trackingLookupHelp} Signed-in customers also see logistics activity inside their shared HenryCo account.
          </p>
        </div>

        <form className="rounded-[1.75rem] border border-[var(--logistics-line)] bg-[var(--logistics-panel)] p-5 sm:p-6" method="get" action="/track">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--logistics-muted)]">Tracking code</span>
              <input
                name="code"
                defaultValue={code || ""}
                required
                placeholder="HCL-XXXXXX"
                className="rounded-2xl border border-[var(--logistics-line)] bg-black/30 px-4 py-3 uppercase text-white placeholder:normal-case"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-[var(--logistics-muted)]">Sender or recipient phone</span>
              <input
                name="phone"
                type="tel"
                defaultValue={phone || ""}
                required
                placeholder="+234…"
                className="rounded-2xl border border-[var(--logistics-line)] bg-black/30 px-4 py-3 text-white"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-full bg-[linear-gradient(135deg,#f6e2d0_0%,var(--logistics-accent)_52%,#9f8b7d_100%)] px-6 py-2.5 text-sm font-semibold text-[#170f12]"
            >
              View status
            </button>
            <Link href={getAccountUrl("/logistics")} className="rounded-full border border-[var(--logistics-line)] px-6 py-2.5 text-sm font-semibold text-white/90">
              Account logistics hub
            </Link>
          </div>
        </form>

        {code && phone && !detail ? (
          <div className="rounded-[1.5rem] border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-100" role="alert">
            We could not find a shipment for that code and phone combination. Check the code on your confirmation and
            use the same phone you listed as sender or recipient.
          </div>
        ) : null}

        {detail && map ? (
          <div className="space-y-8">
            <section className="rounded-[1.75rem] border border-[var(--logistics-line)] bg-[var(--logistics-panel)] p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">Shipment</div>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{detail.shipment.trackingCode}</h2>
                  <p className="mt-1 text-sm text-[var(--logistics-muted)]">
                    {detail.shipment.zoneLabel || "Lane TBD"} · {detail.shipment.serviceType.replaceAll("_", " ")} ·{" "}
                    {detail.shipment.urgency}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wider text-white/45">Status</div>
                  <div className="mt-1 text-lg font-semibold capitalize text-white">
                    {detail.shipment.lifecycleStatus.replaceAll("_", " ")}
                  </div>
                  <div className="mt-2 text-sm text-[var(--logistics-muted)]">
                    Indicative total {formatCurrency(detail.shipment.amountQuoted, detail.shipment.pricingBreakdown.currency)}
                  </div>
                  <div className="mt-1 text-xs text-[var(--logistics-muted)]">
                    Typical window {detail.shipment.pricingBreakdown.promiseWindowHours[0]}–
                    {detail.shipment.pricingBreakdown.promiseWindowHours[1]}h · confidence{" "}
                    {detail.shipment.pricingBreakdown.promiseConfidence}%
                  </div>
                </div>
              </div>
            </section>

            <TrackingMapPanel map={map} />

            <section className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
              <div className="rounded-[1.75rem] border border-[var(--logistics-line)] bg-[var(--logistics-panel)] p-5 sm:p-7">
                <h3 className="text-lg font-semibold text-white">Timeline</h3>
                <p className="mt-1 text-sm text-[var(--logistics-muted)]">Customer-visible milestones only.</p>
                <div className="mt-6">
                  <LogisticsTimeline shipment={detail.shipment} events={detail.events} />
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-[1.75rem] border border-[var(--logistics-line)] bg-[var(--logistics-panel)] p-5">
                  <h3 className="text-lg font-semibold text-white">Proof of delivery</h3>
                  {detail.proof ? (
                    <dl className="mt-4 space-y-2 text-sm text-[var(--logistics-muted)]">
                      <div>
                        <dt className="text-white/50">Recipient</dt>
                        <dd className="text-white">{detail.proof.recipientName}</dd>
                      </div>
                      <div>
                        <dt className="text-white/50">Delivered</dt>
                        <dd className="text-white">{new Date(detail.proof.deliveredAt).toLocaleString()}</dd>
                      </div>
                      <div>
                        <dt className="text-white/50">Type</dt>
                        <dd className="capitalize text-white">{detail.proof.proofType}</dd>
                      </div>
                      {detail.proof.note ? (
                        <div>
                          <dt className="text-white/50">Note</dt>
                          <dd>{detail.proof.note}</dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : (
                    <p className="mt-3 text-sm text-[var(--logistics-muted)]">
                      Proof will appear here after delivery is completed and verified.
                    </p>
                  )}
                </div>
                {detail.issues.filter((i) => i.status !== "resolved").length > 0 ? (
                  <div className="rounded-[1.75rem] border border-amber-500/25 bg-amber-500/5 p-5">
                    <h3 className="text-lg font-semibold text-amber-100">Active exception</h3>
                    <ul className="mt-3 space-y-2 text-sm text-[var(--logistics-muted)]">
                      {detail.issues
                        .filter((i) => i.status !== "resolved")
                        .map((issue) => (
                          <li key={issue.id}>
                            <span className="font-medium text-white">{issue.summary}</span> — {issue.details}
                          </li>
                        ))}
                    </ul>
                    <a href={`mailto:${snapshot.settings.supportEmail}`} className="mt-4 inline-block text-sm font-semibold text-[var(--logistics-accent-soft)]">
                      Contact support
                    </a>
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
