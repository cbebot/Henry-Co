import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, CalendarDays, Home, Sparkles } from "lucide-react";
import {
  WorkspaceHero,
  WorkspaceMetricCard,
  WorkspacePanel,
} from "@/components/dashboard/WorkspacePrimitives";
import { requireRoles } from "@/lib/auth/server";
import { getAdminBookings } from "@/lib/admin/care-admin";
import {
  inferCareServiceFamily,
  isRecurringService,
  parseServiceBookingSummary,
  getTrackingStatusLabel,
} from "@/lib/care-tracking";
import { isServiceBookingRecord } from "@/lib/care-booking-shared";
import { logProtectedPageAccess } from "@/lib/security/logger";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Staff Overview | Henry & Co. Fabric Care",
  description: "Field execution overview for home and office service readiness, assignments, and visit history.",
};

function formatDate(value?: string | null) {
  if (!value) return "No date set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function StaffOverviewPage() {
  await requireRoles(["owner", "manager", "staff"]);
  await logProtectedPageAccess("/staff");

  const bookings = await getAdminBookings({ scope: "all", limit: 500 });
  const serviceBookings = bookings.filter((booking) => isServiceBookingRecord(booking));
  const activeQueue = serviceBookings.filter(
    (booking) => !["customer_confirmed", "inspection_completed", "service_completed", "supervisor_signoff", "cancelled"].includes(
      String(booking.status || "").toLowerCase()
    )
  );
  const historyQueue = serviceBookings.filter((booking) =>
    ["customer_confirmed", "inspection_completed", "service_completed", "supervisor_signoff", "cancelled"].includes(
      String(booking.status || "").toLowerCase()
    )
  );
  const homeQueue = activeQueue.filter((booking) => inferCareServiceFamily(booking) === "home");
  const officeQueue = activeQueue.filter((booking) => inferCareServiceFamily(booking) === "office");
  const recurringCount = serviceBookings.filter((booking) =>
    isRecurringService(parseServiceBookingSummary(booking.item_summary))
  ).length;

  return (
    <div className="space-y-8">
      <WorkspaceHero
        eyebrow="Field execution"
        title="Run service visits cleanly without garment work in the way."
        description="Staff operations are now split into overview, assignments, and history. Home and office service execution stays readable at higher volume because live work no longer shares space with finished visits."
        actions={
          <>
            <Link
              href="/staff/assignments"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent-secondary)] px-5 py-3 text-sm font-semibold text-[#07111F]"
            >
              Open assignments
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/staff/history"
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
            >
              Open history
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        }
      />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <WorkspaceMetricCard
          icon={Sparkles}
          label="Active service visits"
          value={String(activeQueue.length)}
          note="Home and office jobs still in execution."
        />
        <WorkspaceMetricCard
          icon={Home}
          label="Home cleaning"
          value={String(homeQueue.length)}
          note="Residential field visits currently active."
        />
        <WorkspaceMetricCard
          icon={Building2}
          label="Office cleaning"
          value={String(officeQueue.length)}
          note="Commercial visits currently active."
        />
        <WorkspaceMetricCard
          icon={CalendarDays}
          label="Recurring plans"
          value={String(recurringCount)}
          note="Ongoing service plans tracked across active and completed visits."
        />
      </section>

      <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
        <WorkspacePanel
          eyebrow="Assignments"
          title="Live execution queue"
          subtitle="Open assignments to update service stages, inspect property details, and keep today’s field work moving."
        >
          <div className="grid gap-4">
            {activeQueue.slice(0, 4).map((booking) => (
              <Link
                key={booking.id}
                href={`/staff/assignments?booking=${encodeURIComponent(booking.tracking_code)}`}
                className="rounded-[1.6rem] border border-black/10 bg-black/[0.03] p-4 transition hover:border-[color:var(--accent)]/28 hover:bg-[color:var(--accent)]/8 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--accent)]">
                  {booking.tracking_code}
                </div>
                <div className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">
                  {booking.customer_name}
                </div>
                <div className="mt-2 text-sm text-zinc-600 dark:text-white/64">
                  {formatDate(booking.pickup_date)} •{" "}
                  {getTrackingStatusLabel(booking.status, inferCareServiceFamily(booking))}
                </div>
              </Link>
            ))}
          </div>
        </WorkspacePanel>

        <WorkspacePanel
          eyebrow="History"
          title="Completed visit archive"
          subtitle="Open history to review closed visits, recurring cadence, and previous execution notes without crowding the live queue."
        >
          <div className="grid gap-4">
            {historyQueue.slice(0, 4).map((booking) => (
              <Link
                key={booking.id}
                href={`/staff/history?booking=${encodeURIComponent(booking.tracking_code)}`}
                className="rounded-[1.6rem] border border-black/10 bg-black/[0.03] p-4 transition hover:border-[color:var(--accent)]/28 hover:bg-[color:var(--accent)]/8 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <div className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--accent)]">
                  {booking.tracking_code}
                </div>
                <div className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">
                  {booking.customer_name}
                </div>
                <div className="mt-2 text-sm text-zinc-600 dark:text-white/64">
                  {getTrackingStatusLabel(booking.status, inferCareServiceFamily(booking))}
                </div>
              </Link>
            ))}
          </div>
        </WorkspacePanel>
      </section>
    </div>
  );
}
