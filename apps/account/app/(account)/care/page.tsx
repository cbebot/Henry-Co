import Link from "next/link";
import { Bell, ExternalLink, LifeBuoy, Sparkles } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import {
  getCareBookings,
  getDivisionActivity,
  getDivisionNotifications,
  getDivisionSupportThreads,
} from "@/lib/division-data";
import { timeAgoLocalized } from "@/lib/format";
import { getAccountAppLocale } from "@/lib/locale-server";
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
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
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
  const copy =
    locale === "fr"
      ? {
          title: "Care",
          description:
            "Vos réservations Care, codes de suivi, reçus et prochaines actions réunis au même endroit.",
          bookService: "Réserver un service",
          openTracking: "Ouvrir le suivi",
          emptyTitle: "Aucune réservation Care liée pour le moment",
          emptyDescription:
            "Les nouvelles réservations faites en étant connecté apparaîtront ici immédiatement. Les anciennes réservations apparaîtront aussi une fois que leur e-mail ou téléphone correspondra à votre profil partagé.",
          bookWithCare: "Réserver avec Care",
          updateProfile: "Mettre à jour le profil",
          notificationsTitle: "Notifications Care",
          notificationsEmpty:
            "Les alertes propres à Care apparaîtront ici quand des réservations seront liées ou mises à jour.",
          notificationFallback: "Notification Care",
          followUpTitle: "Suivi Care",
          followUpEmpty:
            "Dès qu’une réservation Care sera en cours, le suivi et l’activité de support du compte partagé apparaîtront ici.",
          supportThreadFallback: "Fil de support Care",
          activityFallback: "Activité Care",
          liveStatus: "actif",
        }
      : {
          title: "Care",
          description:
            "Your Care bookings, tracking codes, receipts, and upcoming actions in one place.",
          bookService: "Book service",
          openTracking: "Open tracking",
          emptyTitle: "No Care bookings are linked yet",
          emptyDescription:
            "New bookings made while signed in will appear here immediately. Older bookings will also surface here once their email or phone matches your shared account profile.",
          bookWithCare: "Book with Care",
          updateProfile: "Update profile",
          notificationsTitle: "Care notifications",
          notificationsEmpty:
            "Care-specific alerts will appear here when bookings are linked or updated.",
          notificationFallback: "Care notification",
          followUpTitle: "Care follow-up",
          followUpEmpty:
            "Once Care bookings are in motion, shared-account follow-up and support activity will surface here.",
          supportThreadFallback: "Care support thread",
          activityFallback: "Care activity",
          liveStatus: "live",
        };

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title={copy.title}
        description={copy.description}
        icon={Sparkles}
        actions={
          <div className="flex flex-wrap gap-3">
            <a
              href="https://care.henrycogroup.com/book"
              target="_blank"
              rel="noopener noreferrer"
              className="acct-button-secondary rounded-xl"
            >
              {copy.bookService} <ExternalLink size={14} />
            </a>
            <a
              href="https://care.henrycogroup.com/track"
              target="_blank"
              rel="noopener noreferrer"
              className="acct-button-primary rounded-xl"
            >
              {copy.openTracking} <ExternalLink size={14} />
            </a>
          </div>
        }
      />

      {bookings.length > 0 ? (
        <CareBookingsDashboard
          locale={locale}
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
            {copy.emptyTitle}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[var(--acct-muted)]">
            {copy.emptyDescription}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a
              href="https://care.henrycogroup.com/book"
              target="_blank"
              rel="noopener noreferrer"
              className="acct-button-primary rounded-xl"
            >
              {copy.bookWithCare} <ExternalLink size={14} />
            </a>
            <Link href="/settings" className="acct-button-secondary rounded-xl">
              {copy.updateProfile}
            </Link>
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="acct-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Bell size={14} className="text-[var(--acct-muted)]" />
            <p className="acct-kicker">{copy.notificationsTitle}</p>
          </div>
          {notifications.length === 0 ? (
            <p className="py-6 text-sm text-[var(--acct-muted)]">
              {copy.notificationsEmpty}
            </p>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 5).map((notification) => (
                <div
                  key={String(notification.id)}
                  className="rounded-xl bg-[var(--acct-surface)] px-4 py-3"
                >
                  <p className="text-sm font-medium text-[var(--acct-ink)]">
                    {String(notification.title || copy.notificationFallback)}
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
            <p className="acct-kicker">{copy.followUpTitle}</p>
          </div>
          {supportThreads.length === 0 && activity.length === 0 ? (
            <p className="py-6 text-sm text-[var(--acct-muted)]">
              {copy.followUpEmpty}
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
                    {String(thread.subject || copy.supportThreadFallback)}
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
                    {String(item.title || copy.activityFallback)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--acct-muted)]">
                    {String(item.status || copy.liveStatus)} • {timeAgoLocalized(String(item.created_at || new Date().toISOString()), locale)}
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
