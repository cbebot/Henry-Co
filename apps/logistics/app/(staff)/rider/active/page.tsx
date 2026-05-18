import Link from "next/link";
import { ArrowLeft, Compass, MapPin, Package } from "lucide-react";
import {
  Panel,
  EmptyState,
} from "@henryco/dashboard-shell/components";
import { translateSurfaceLabel } from "@henryco/i18n";
import { getLogisticsPublicLocale } from "@/lib/locale-server";
import { getLogisticsViewer } from "@/lib/logistics/auth";
import {
  getRiderDashboardData,
  getShipmentDetail,
} from "@/lib/logistics/data";
import { formatCurrency } from "@/lib/env";
import { PODCaptureClient } from "@/components/operator/PODCaptureClient";

/**
 * V3 PASS 21 — Rider workspace: currently-on-leg view.
 *
 * Renders the targeted shipment with:
 *   - Pickup + dropoff address detail (rider needs the full data).
 *   - Customer contact CTA (tel: link — riders typically call from
 *     their device).
 *   - <PODCaptureClient/> for proof of delivery.
 */

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ shipment?: string; leg?: string }>;
};

export default async function RiderActivePage({ searchParams }: PageProps) {
  const locale = await getLogisticsPublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const params = await searchParams;
  const viewer = await getLogisticsViewer();
  const dashboard = await getRiderDashboardData(viewer);

  const candidate =
    dashboard.riderShipments.find((s) => s.id === params.shipment) ??
    dashboard.riderShipments.find(
      (s) =>
        s.lifecycleStatus !== "delivered" && s.lifecycleStatus !== "cancelled",
    ) ??
    null;

  if (!candidate) {
    return (
      <div className="space-y-6 py-6">
        <header>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
            {t("Active leg")}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {t("No active leg")}
          </h1>
        </header>
        <Panel tone="flat">
          <EmptyState
            kicker={t("Queue empty")}
            headline={t("No assignment in progress")}
            body={t("When you have a shipment, this page shows the customer contact, pickup + dropoff detail, and the POD capture form.")}
            action={
              <Link
                href="/rider"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--logistics-line)] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white hover:bg-white/[0.08]"
              >
                {t("Back to today")}
              </Link>
            }
          />
        </Panel>
      </div>
    );
  }

  const detail = await getShipmentDetail(candidate.id);

  return (
    <div className="space-y-8 py-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/rider"
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--logistics-accent-soft)] hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            {t("Today")}
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {candidate.recipientName}
          </h1>
          <p className="mt-2 inline-flex items-center gap-2 text-sm text-[var(--logistics-muted)]">
            <Compass className="h-4 w-4 text-[var(--logistics-accent)]" aria-hidden />
            {candidate.trackingCode} ·{" "}
            {candidate.serviceType.replaceAll("_", " ")} · {candidate.urgency}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
            {t("Quoted total")}
          </p>
          <p className="mt-1 text-base font-semibold tracking-tight text-white">
            {formatCurrency(
              candidate.amountQuoted,
              candidate.pricingBreakdown.currency,
            )}
          </p>
        </div>
      </header>

      <section
        className="grid gap-3 sm:grid-cols-2"
        aria-label={t("Pickup and dropoff")}
      >
        <Panel tone="flat">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-[var(--logistics-accent-soft)]">
            {t("Pickup")}
          </p>
          {detail?.shipment.pickupAddress ? (
            <div className="mt-3 space-y-1.5 text-sm">
              <p className="font-semibold tracking-tight text-white">
                {detail.shipment.pickupAddress.contactName}
              </p>
              <p className="text-[var(--logistics-muted)]">
                {detail.shipment.pickupAddress.line1}
              </p>
              {detail.shipment.pickupAddress.line2 ? (
                <p className="text-[var(--logistics-muted)]">
                  {detail.shipment.pickupAddress.line2}
                </p>
              ) : null}
              <p className="text-[var(--logistics-muted)]">
                {detail.shipment.pickupAddress.city},{" "}
                {detail.shipment.pickupAddress.region}
              </p>
              {detail.shipment.pickupAddress.phone ? (
                <a
                  className="inline-flex items-center gap-2 pt-2 text-sm font-semibold text-[var(--logistics-accent-soft)] hover:underline"
                  href={`tel:${detail.shipment.pickupAddress.phone}`}
                >
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  {t("Call sender")}
                </a>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--logistics-muted)]">
              {t("Address not provided yet.")}
            </p>
          )}
        </Panel>
        <Panel tone="flat">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-[var(--logistics-accent-soft)]">
            {t("Dropoff")}
          </p>
          {detail?.shipment.dropoffAddress ? (
            <div className="mt-3 space-y-1.5 text-sm">
              <p className="font-semibold tracking-tight text-white">
                {detail.shipment.dropoffAddress.contactName}
              </p>
              <p className="text-[var(--logistics-muted)]">
                {detail.shipment.dropoffAddress.line1}
              </p>
              {detail.shipment.dropoffAddress.line2 ? (
                <p className="text-[var(--logistics-muted)]">
                  {detail.shipment.dropoffAddress.line2}
                </p>
              ) : null}
              <p className="text-[var(--logistics-muted)]">
                {detail.shipment.dropoffAddress.city},{" "}
                {detail.shipment.dropoffAddress.region}
              </p>
              {detail.shipment.dropoffAddress.phone ? (
                <a
                  className="inline-flex items-center gap-2 pt-2 text-sm font-semibold text-[var(--logistics-accent-soft)] hover:underline"
                  href={`tel:${detail.shipment.dropoffAddress.phone}`}
                >
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  {t("Call recipient")}
                </a>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--logistics-muted)]">
              {t("Address not provided yet.")}
            </p>
          )}
        </Panel>
      </section>

      <section aria-label={t("Parcel")}>
        <Panel tone="flat">
          <div className="flex items-start gap-3">
            <Package className="mt-0.5 h-5 w-5 text-[var(--logistics-accent)]" aria-hidden />
            <div className="min-w-0">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-[var(--logistics-accent-soft)]">
                {t("Parcel")}
              </p>
              <p className="mt-2 text-sm font-semibold tracking-tight text-white">
                {candidate.parcelType}
                {candidate.fragile ? ` · ${t("Fragile")}` : ""}
              </p>
              {candidate.parcelDescription ? (
                <p className="mt-1 text-sm leading-relaxed text-[var(--logistics-muted)]">
                  {candidate.parcelDescription}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-[var(--logistics-muted)]">
                {candidate.weightKg ? `${candidate.weightKg} kg` : t("Weight TBD")} ·{" "}
                {candidate.sizeTier} · {t("promise window")}{" "}
                {candidate.pricingBreakdown.promiseWindowHours[0]}–
                {candidate.pricingBreakdown.promiseWindowHours[1]}h
              </p>
            </div>
          </div>
        </Panel>
      </section>

      <section aria-label={t("Proof of delivery")}>
        <PODCaptureClient shipmentId={candidate.id} legId={null} />
      </section>
    </div>
  );
}
