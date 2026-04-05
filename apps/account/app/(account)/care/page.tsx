import Link from "next/link";
import { Bell, ExternalLink, LifeBuoy, Sparkles } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import {
  getCareBookings,
  getDivisionActivity,
  getDivisionNotifications,
  getDivisionSupportThreads,
} from "@/lib/division-data";
import { timeAgo } from "@/lib/format";
import PageHeader from "@/components/layout/PageHeader";
import CareBookingsDashboard, {
  CARE_BOOKING_FILTER_OPTIONS,
  matchesCareFilter,
  type CareBookingFilterId,
} from "@/components/divisions/CareBookingsDashboard";

export const dynamic = "force-dynamic";

const CARE_PAGE_SIZE = 12;

export default async function CarePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAccountUser();
  const params = searchParams ? await searchParams : {};
  const selectedBookingId = typeof params.booking === "string" ? params.booking : null;
  const filterRaw = typeof params.filter === "string" ? params.filter : "all";
  const activeFilter: CareBookingFilterId = CARE_BOOKING_FILTER_OPTIONS.some((o) => o.id === filterRaw)
    ? (filterRaw as CareBookingFilterId)
    : "all";
  const pageRaw = typeof params.page === "string" ? Number.parseInt(params.page, 10) : 1;
  const pageRequested = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const [bookings, activity, notifications, supportThreads] = await Promise.all([
    getCareBookings(user.id),
    getDivisionActivity(user.id, "care"),
    getDivisionNotifications(user.id, "care"),
    getDivisionSupportThreads(user.id, "care"),
  ]);

  const filteredBookings = bookings.filter((b) => matchesCareFilter(b, activeFilter));
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / CARE_PAGE_SIZE));
  const page = Math.min(pageRequested, totalPages);
  const listSlice = filteredBookings.slice((page - 1) * CARE_PAGE_SIZE, page * CARE_PAGE_SIZE);

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title="Care"
        description="Your Care bookings, tracking codes, receipts, and upcoming actions in one place."
        icon={Sparkles}
        actions={
          <div className="flex flex-wrap gap-3">
            <a
              href="https://care.henrycogroup.com/book"
              target="_blank"
              rel="noopener noreferrer"
              className="acct-button-secondary rounded-xl"
            >
              Book service <ExternalLink size={14} />
            </a>
            <a
              href="https://care.henrycogroup.com/track"
              target="_blank"
              rel="noopener noreferrer"
              className="acct-button-primary rounded-xl"
            >
              Open tracking <ExternalLink size={14} />
            </a>
          </div>
        }
      />

      {bookings.length > 0 ? (
        <CareBookingsDashboard
          bookings={filteredBookings}
          listBookings={listSlice}
          selectedBookingId={selectedBookingId}
          activeFilter={activeFilter}
          page={page}
          totalPages={totalPages}
          pageSize={CARE_PAGE_SIZE}
          totalFiltered={filteredBookings.length}
        />
      ) : (
        <section className="acct-card p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(107,124,255,0.12)]">
            <Sparkles size={24} className="text-[#6B7CFF]" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-[var(--acct-ink)]">
            No Care bookings are linked yet
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[var(--acct-muted)]">
            New bookings made while signed in will appear here immediately. Older bookings will also surface here once their email or phone matches your shared account profile.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a
              href="https://care.henrycogroup.com/book"
              target="_blank"
              rel="noopener noreferrer"
              className="acct-button-primary rounded-xl"
            >
              Book with Care <ExternalLink size={14} />
            </a>
            <Link href="/settings" className="acct-button-secondary rounded-xl">
              Update profile
            </Link>
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="acct-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Bell size={14} className="text-[var(--acct-muted)]" />
            <p className="acct-kicker">Care notifications</p>
          </div>
          {notifications.length === 0 ? (
            <p className="py-6 text-sm text-[var(--acct-muted)]">
              Care-specific alerts will appear here when bookings are linked or updated.
            </p>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 5).map((notification) => (
                <div
                  key={String(notification.id)}
                  className="rounded-xl bg-[var(--acct-surface)] px-4 py-3"
                >
                  <p className="text-sm font-medium text-[var(--acct-ink)]">
                    {String(notification.title || "Care notification")}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--acct-muted)]">
                    {String(notification.body || "")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="acct-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <LifeBuoy size={14} className="text-[var(--acct-muted)]" />
            <p className="acct-kicker">Care follow-up</p>
          </div>
          {supportThreads.length === 0 && activity.length === 0 ? (
            <p className="py-6 text-sm text-[var(--acct-muted)]">
              Once Care bookings are in motion, shared-account follow-up and support activity will surface here.
            </p>
          ) : (
            <div className="space-y-3">
              {supportThreads.slice(0, 3).map((thread) => (
                <Link
                  key={String(thread.id)}
                  href={`/support/${String(thread.id)}`}
                  className="block rounded-xl bg-[var(--acct-surface)] px-4 py-3 transition-colors hover:bg-[var(--acct-line)]"
                >
                  <p className="text-sm font-medium text-[var(--acct-ink)]">
                    {String(thread.subject || "Care support thread")}
                  </p>
                  <p className="mt-1 text-xs text-[var(--acct-muted)]">
                    {String(thread.status || "open")}
                  </p>
                </Link>
              ))}

              {activity.slice(0, 2).map((item) => (
                <div
                  key={String(item.id)}
                  className="rounded-xl border border-[var(--acct-line)] px-4 py-3"
                >
                  <p className="text-sm font-medium text-[var(--acct-ink)]">
                    {String(item.title || "Care activity")}
                  </p>
                  <p className="mt-1 text-xs text-[var(--acct-muted)]">
                    {String(item.status || "live")} • {timeAgo(String(item.created_at || new Date().toISOString()))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
