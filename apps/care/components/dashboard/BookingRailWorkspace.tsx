import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Clock3, MapPin, Phone } from "lucide-react";
import type { AdminBookingRow } from "@/lib/admin/care-admin";
import {
  type DashboardQueueGroup,
  bookingStatusSummary,
} from "@/lib/dashboard-queues";
import { tonePillClasses, WorkspaceEmptyState } from "@/components/dashboard/WorkspacePrimitives";

function formatDate(value?: string | null) {
  if (!value) return "No scheduled date yet";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BookingRailWorkspace({
  groups,
  selectedBooking,
  buildBookingHref,
  detail,
  emptyTitle,
  emptyText,
}: {
  groups: DashboardQueueGroup[];
  selectedBooking: AdminBookingRow | null;
  buildBookingHref: (booking: AdminBookingRow) => string;
  detail: ReactNode;
  emptyTitle: string;
  emptyText: string;
}) {
  const totalVisible = groups.reduce((sum, group) => sum + group.bookings.length, 0);

  return (
    <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-[2.2rem] border border-black/10 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex items-center justify-between gap-3 px-1 pb-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
              Active queue
            </div>
            <div className="mt-1 text-2xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white">
              Operational rails
            </div>
          </div>
          <div className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
            {totalVisible} visible
          </div>
        </div>

        <div className="max-h-[68rem] space-y-5 overflow-y-auto pr-1">
          {totalVisible > 0 ? (
            groups.map((group) =>
              group.bookings.length > 0 ? (
                <div key={group.id} className="space-y-3">
                  <div className="flex items-center justify-between gap-3 px-1">
                    <div>
                      <div
                        className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${tonePillClasses(group.tone)}`}
                      >
                        {group.title}
                      </div>
                      <div className="mt-2 text-xs leading-6 text-zinc-500 dark:text-white/45">
                        {group.description}
                      </div>
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
                      {group.bookings.length}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {group.bookings.map((booking) => {
                      const summary = bookingStatusSummary(booking);
                      const active = selectedBooking?.id === booking.id;

                      return (
                        <Link
                          key={booking.id}
                          href={buildBookingHref(booking)}
                          className={`block rounded-[1.6rem] border p-4 transition ${
                            active
                              ? "border-[color:var(--accent)]/28 bg-[color:var(--accent)]/10 shadow-[0_18px_48px_rgba(56,72,184,0.12)]"
                              : "border-black/10 bg-black/[0.03] hover:border-black/15 hover:bg-black/[0.04] dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[color:var(--accent)]">
                              {booking.tracking_code}
                            </span>
                            <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                              {summary.familyLabel}
                            </span>
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${tonePillClasses(
                                summary.isOverdue
                                  ? "critical"
                                  : summary.isStale
                                    ? "warning"
                                    : "info"
                              )}`}
                            >
                              {summary.statusLabel}
                            </span>
                          </div>

                          <div className="mt-3 text-lg font-semibold text-zinc-950 dark:text-white">
                            {booking.customer_name}
                          </div>
                          <div className="mt-1 text-sm text-zinc-600 dark:text-white/65">
                            {booking.service_type}
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <InfoLine icon={Clock3}>
                              {formatDate(booking.pickup_date)}
                              {booking.pickup_slot ? ` • ${booking.pickup_slot}` : ""}
                            </InfoLine>
                            <InfoLine icon={Phone}>
                              {booking.phone || booking.email || "Customer contact on file"}
                            </InfoLine>
                          </div>

                          <div className="mt-3 line-clamp-2 text-sm leading-7 text-zinc-500 dark:text-white/50">
                            <span className="inline-flex items-start gap-2">
                              <MapPin className="mt-1 h-4 w-4 shrink-0 text-[color:var(--accent)]" />
                              <span>{booking.pickup_address}</span>
                            </span>
                          </div>

                          <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--accent)]">
                            Open detail
                            <ArrowRight className="h-3.5 w-3.5" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : null
            )
          ) : (
            <WorkspaceEmptyState title={emptyTitle} text={emptyText} />
          )}
        </div>
      </div>

      <div>{detail}</div>
    </section>
  );
}

function InfoLine({
  icon: Icon,
  children,
}: {
  icon: typeof Clock3;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/80 p-3 text-sm text-zinc-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/68">
      <span className="inline-flex items-center gap-2">
        <Icon className="h-4 w-4 text-[color:var(--accent)]" />
        {children}
      </span>
    </div>
  );
}
