import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, ShieldAlert, Sparkles, TrendingDown } from "lucide-react";
import {
  WorkspaceHero,
  WorkspaceInfoTile,
  WorkspaceMetricCard,
  WorkspacePanel,
  tonePillClasses,
} from "@/components/dashboard/WorkspacePrimitives";
import { requireRoles } from "@/lib/auth/server";
import { getOperationsIntelligenceSnapshot } from "@/lib/operations-intelligence";
import { logProtectedPageAccess } from "@/lib/security/logger";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner Insights | Henry & Co. Fabric Care",
  description: "Owner intelligence surface built from live booking, support, payment, and review signals.",
};

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function deltaLabel(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(0)}%`;
}

export default async function OwnerInsightsPage() {
  await requireRoles(["owner"]);
  await logProtectedPageAccess("/owner/insights");

  const snapshot = await getOperationsIntelligenceSnapshot();

  return (
    <div className="space-y-8">
      <WorkspaceHero
        eyebrow="Owner intelligence"
        title="Real operational advice, derived from the live platform."
        description="This page turns live bookings, support threads, payment proofs, intake gaps, and review patterns into owner-facing signals that can be acted on immediately. Nothing here is generic; every alert is backed by observable platform data."
        actions={
          <>
            <Link
              href="/owner/bookings"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent-secondary)] px-5 py-3 text-sm font-semibold text-[#07111F]"
            >
              Open booking oversight
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/support/inbox"
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
            >
              Open support inbox
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        }
      />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <WorkspaceMetricCard
          icon={ShieldAlert}
          label="Overdue bookings"
          value={String(snapshot.overdueBookings.length)}
          note="Jobs that have moved past the promised day without resolution."
        />
        <WorkspaceMetricCard
          icon={Sparkles}
          label="Stale bookings"
          value={String(snapshot.staleBookings.length)}
          note="Active jobs with no fresh movement in the last 24 hours."
        />
        <WorkspaceMetricCard
          icon={BarChart3}
          label="Support pressure"
          value={String(snapshot.staleSupportThreadCount + snapshot.urgentSupportThreadCount)}
          note="Stale and urgent conversations combined."
        />
        <WorkspaceMetricCard
          icon={TrendingDown}
          label="Booking flow delta"
          value={deltaLabel(snapshot.lowBookingFlowDeltaPercent)}
          note={`${snapshot.recentBookingCount} recent requests vs ${snapshot.previousBookingCount} in the prior window.`}
        />
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <WorkspacePanel
          eyebrow="Signals"
          title="Priority issues the owner should act on"
          subtitle="These signals are generated from live operations data across bookings, support, payments, intake, and review quality."
        >
          <div className="grid gap-4">
            {snapshot.signals.length > 0 ? (
              snapshot.signals.map((signal) => (
                <Link
                  key={signal.id}
                  href={signal.href}
                  className="rounded-[1.7rem] border border-black/10 bg-black/[0.03] p-5 transition hover:border-[color:var(--accent)]/28 hover:bg-[color:var(--accent)]/8 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div
                        className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${tonePillClasses(
                          signal.tone
                        )}`}
                      >
                        {signal.group}
                      </div>
                      <div className="mt-3 text-xl font-semibold text-zinc-950 dark:text-white">
                        {signal.title}
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-white/45">
                      {formatDateTime(signal.createdAt)}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-white/64">
                    {signal.summary}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--accent)]">
                    Open source queue
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-[1.7rem] border border-black/10 bg-black/[0.03] p-8 text-sm leading-7 text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/64">
                No material bottleneck is being surfaced from the current live data snapshot.
              </div>
            )}
          </div>
        </WorkspacePanel>

        <WorkspacePanel
          eyebrow="Signal health"
          title="Key operational indicators"
          subtitle="These are the concrete counts feeding the owner alert layer."
        >
          <div className="grid gap-4">
            <WorkspaceInfoTile
              label="Garment intake gaps"
              value={String(snapshot.garmentBookingsMissingIntake.length)}
              note="Bookings still missing registered garment line items."
            />
            <WorkspaceInfoTile
              label="Unresolved payment proofs"
              value={String(snapshot.unresolvedPaymentProofCount)}
              note="Customer proof still waiting on review decisions."
            />
            <WorkspaceInfoTile
              label="Repeat complaint risk"
              value={String(snapshot.repeatComplaintCount)}
              note="Customers with multiple active support threads in the last 30 days."
            />
            <WorkspaceInfoTile
              label="Pending review moderation"
              value={String(snapshot.pendingReviewCount)}
              note="Public review submissions still waiting on approval or rejection."
            />
            <WorkspaceInfoTile
              label="Recent approved review average"
              value={
                snapshot.lowReviewAverage == null ? "Not enough approved reviews yet" : snapshot.lowReviewAverage.toFixed(1)
              }
              note="Based only on the latest approved public-facing reviews."
            />
          </div>
        </WorkspacePanel>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
        <WorkspacePanel
          eyebrow="Booking risk"
          title="Bookings that deserve owner visibility"
          subtitle="These are the strongest backlog and trust-risk signals pulled directly from the live active queue."
        >
          <div className="grid gap-4">
            {snapshot.overdueBookings.slice(0, 6).map((booking) => (
              <Link
                key={booking.id}
                href={`/owner/bookings?booking=${encodeURIComponent(booking.tracking_code)}`}
                className="rounded-[1.6rem] border border-black/10 bg-black/[0.03] p-4 transition hover:border-[color:var(--accent)]/28 hover:bg-[color:var(--accent)]/8 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--accent)]">
                  {booking.tracking_code}
                </div>
                <div className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">
                  {booking.customer_name}
                </div>
                <div className="mt-2 text-sm text-zinc-600 dark:text-white/64">
                  {booking.service_type}
                </div>
              </Link>
            ))}
          </div>
        </WorkspacePanel>

        <WorkspacePanel
          eyebrow="Owner guidance"
          title="What to do next"
          subtitle="These are not generic suggestions; each recommendation corresponds to signals currently visible in the platform."
        >
          <div className="grid gap-4">
            <div className="rounded-[1.6rem] border border-black/10 bg-black/[0.03] p-5 text-sm leading-7 text-zinc-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/68">
              If overdue and stale bookings are both elevated, use owner booking oversight to identify where team follow-through has slowed and whether assignment or payment issues are keeping jobs open longer than promised.
            </div>
            <div className="rounded-[1.6rem] border border-black/10 bg-black/[0.03] p-5 text-sm leading-7 text-zinc-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/68">
              If support pressure and payment proof backlog rise together, inspect the support queue before the customer experience turns from slow to distrustful. That combination usually means update cadence is slipping.
            </div>
            <div className="rounded-[1.6rem] border border-black/10 bg-black/[0.03] p-5 text-sm leading-7 text-zinc-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/68">
              If booking flow drops while review quality softens, treat it as a growth warning rather than a marketing issue only. The live service experience is likely influencing demand.
            </div>
          </div>
        </WorkspacePanel>
      </section>
    </div>
  );
}
