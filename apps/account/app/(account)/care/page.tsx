import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarClock, ExternalLink, Receipt, Sparkles, Wallet } from "lucide-react";
import { getDivisionUrl } from "@henryco/config";
import { requireAccountUser } from "@/lib/auth";
import { getDivisionInvoices, getDivisionSupportThreads } from "@/lib/division-data";
import { getCareBookingHref, isExternalHref } from "@/lib/account-links";
import { formatDate, timeAgo } from "@/lib/format";
import { listLinkedCareBookingsForUser, type LinkedCareBooking } from "@/lib/care-sync";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/layout/EmptyState";

export const dynamic = "force-dynamic";
function formatMoney(value: number | null | undefined) { return `₦${Number(value || 0).toLocaleString()}`; }
function bookingStatusChip(status?: string | null) {
  const normalized = String(status || "").trim().toLowerCase();
  if (["delivered", "completed", "service_completed", "customer_confirmed"].includes(normalized)) return "acct-chip-green";
  if (["cancelled", "failed"].includes(normalized)) return "acct-chip-red";
  if (["payment_pending", "awaiting_payment", "pending"].includes(normalized)) return "acct-chip-orange";
  return "acct-chip-blue";
}
function renderAction(href: string, label: string) {
  return isExternalHref(href) ? <a href={href} target="_blank" rel="noopener noreferrer" className="acct-button-secondary rounded-xl">{label} <ExternalLink size={14} /></a> : <Link href={href} className="acct-button-secondary rounded-xl">{label}</Link>;
}

export default async function CarePage({ searchParams }: { searchParams?: Promise<{ booking?: string }> }) {
  const params = (await searchParams) || {};
  const bookingId = String(params.booking || "").trim();
  if (bookingId) redirect(getCareBookingHref(bookingId));
  const user = await requireAccountUser();
  const [bookings, invoices, supportThreads] = await Promise.all([
    listLinkedCareBookingsForUser({ userId: user.id, email: user.email, fullName: user.fullName, phone: user.phone }),
    getDivisionInvoices(user.id, "care"),
    getDivisionSupportThreads(user.id, "care"),
  ]);
  const careBase = getDivisionUrl("care");
  const latestBooking = bookings[0] || null;
  const paymentAttention = bookings.find((booking) => booking.payment.balanceDue > 0 || booking.payment.verificationStatus.toLowerCase() !== "approved") || null;
  const reviewReady = bookings.find((booking) => Boolean(booking.reviewUrl)) || null;

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader title="Care" description="Bookings, payment follow-up, and service progress now route to dedicated booking detail pages instead of a page refresh loop." icon={Sparkles} actions={<div className="flex flex-wrap items-center gap-2"><a href={`${careBase}/book`} target="_blank" rel="noopener noreferrer" className="acct-button-primary rounded-xl">Book service <ExternalLink size={14} /></a><a href={careBase} target="_blank" rel="noopener noreferrer" className="acct-button-secondary rounded-xl">Open Care site <ExternalLink size={14} /></a></div>} />
      <div className="grid gap-4 md:grid-cols-3">
        <Link href={latestBooking ? getCareBookingHref(latestBooking.id) : "/support/new"} className="acct-metric transition-shadow hover:shadow-lg"><div className="flex items-center justify-between"><p className="acct-kicker">Latest booking</p><CalendarClock size={18} className="text-[#6B7CFF]" /></div><p className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{latestBooking ? latestBooking.tracking_code || latestBooking.id : "No bookings yet"}</p><p className="mt-1 text-xs text-[var(--acct-muted)]">{latestBooking ? `${latestBooking.service_type || "Care service"} · ${timeAgo(latestBooking.updated_at || latestBooking.created_at || new Date().toISOString())}` : "Start from the Care booking flow."}</p></Link>
        <Link href={paymentAttention ? getCareBookingHref(paymentAttention.id) : "/invoices"} className="acct-metric transition-shadow hover:shadow-lg"><div className="flex items-center justify-between"><p className="acct-kicker">Payment attention</p><Wallet size={18} className="text-[var(--acct-orange)]" /></div><p className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{paymentAttention ? formatMoney(paymentAttention.payment.balanceDue) : "Nothing urgent"}</p><p className="mt-1 text-xs text-[var(--acct-muted)]">{paymentAttention ? paymentAttention.payment.verificationLabel : "Open shared invoices if you need a payment record."}</p></Link>
        <Link href={reviewReady ? getCareBookingHref(reviewReady.id) : "/support"} className="acct-metric transition-shadow hover:shadow-lg"><div className="flex items-center justify-between"><p className="acct-kicker">Review-ready</p><Receipt size={18} className="text-[var(--acct-green)]" /></div><p className="mt-2 text-lg font-semibold text-[var(--acct-ink)]">{reviewReady ? reviewReady.tracking_code || reviewReady.id : "No completed visit yet"}</p><p className="mt-1 text-xs text-[var(--acct-muted)]">{reviewReady ? "Open the booking detail to leave a review or confirm the final outcome." : "You will see the next reviewable booking here."}</p></Link>
      </div>
      {bookings.length === 0 ? (
        <EmptyState icon={Sparkles} title="No linked care bookings yet" description="Care bookings are linked into account hub from shared identity matches. If you already booked elsewhere and nothing appears here, the remaining gap is division-to-account linkage or deployment freshness." action={<a href={`${careBase}/book`} target="_blank" rel="noopener noreferrer" className="acct-button-primary rounded-xl">Start a care booking <ExternalLink size={14} /></a>} />
      ) : (
        <section className="space-y-3"><div className="flex items-center justify-between"><p className="acct-kicker">Your bookings</p><p className="text-xs text-[var(--acct-muted)]">Each booking now has its own detail route.</p></div><div className="space-y-3">{bookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)}</div></section>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="acct-card p-5"><div className="mb-4 flex items-center justify-between"><p className="acct-kicker">Care invoices</p><Link href="/invoices" className="text-xs font-medium text-[var(--acct-gold)] hover:underline">Open invoice history</Link></div>{invoices.length === 0 ? <p className="text-sm text-[var(--acct-muted)]">No care invoices are synced yet.</p> : <div className="space-y-2">{invoices.slice(0, 4).map((invoice) => <Link key={String(invoice.id)} href={`/invoices/${invoice.id}`} className="flex items-center justify-between rounded-xl bg-[var(--acct-surface)] px-4 py-3 transition-colors hover:bg-[var(--acct-line)]"><div><p className="text-sm font-medium text-[var(--acct-ink)]">{String(invoice.description || invoice.invoice_no || "Care invoice")}</p><p className="text-xs text-[var(--acct-muted)]">{invoice.created_at ? formatDate(String(invoice.created_at)) : "Date pending"}</p></div><p className="text-sm font-semibold text-[var(--acct-ink)]">₦{Number(invoice.total_kobo || 0).toLocaleString()}</p></Link>)}</div>}</section>
        <section className="acct-card p-5"><div className="mb-4 flex items-center justify-between"><p className="acct-kicker">Care support</p><Link href="/support" className="text-xs font-medium text-[var(--acct-gold)] hover:underline">Open support inbox</Link></div>{supportThreads.length === 0 ? <p className="text-sm text-[var(--acct-muted)]">No care support threads yet. Use support if any booking needs manual help.</p> : <div className="space-y-2">{supportThreads.slice(0, 3).map((thread) => <Link key={thread.id} href={`/support/${thread.id}`} className="flex items-center justify-between rounded-xl bg-[var(--acct-surface)] px-4 py-3 transition-colors hover:bg-[var(--acct-line)]"><div><p className="text-sm font-medium text-[var(--acct-ink)]">{thread.subject}</p><p className="text-xs text-[var(--acct-muted)]">{timeAgo(thread.updated_at)}</p></div><span className="acct-chip acct-chip-blue text-[0.6rem]">{thread.status}</span></Link>)}</div>}</section>
      </div>
    </div>
  );
}

function BookingCard({ booking }: { booking: LinkedCareBooking }) {
  return (
    <div className="acct-card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3"><div className="flex flex-wrap items-center gap-3"><Link href={getCareBookingHref(booking.id)} className="text-base font-semibold text-[var(--acct-ink)] hover:text-[var(--acct-gold)]">{booking.tracking_code || booking.id}</Link><span className={`acct-chip ${bookingStatusChip(booking.status)}`}>{booking.status || "In progress"}</span></div><div className="space-y-1 text-sm text-[var(--acct-muted)]"><p>{booking.service_type || "Care service"}</p><p>{booking.pickup_date ? formatDate(booking.pickup_date) : "Schedule pending"}{booking.pickup_slot ? ` · ${booking.pickup_slot}` : ""}</p><p>{booking.pickup_address || "Address pending"}</p></div></div>
        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[26rem]"><div className="rounded-2xl bg-[var(--acct-surface)] p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Outstanding</p><p className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">{formatMoney(booking.payment.balanceDue)}</p></div><div className="rounded-2xl bg-[var(--acct-surface)] p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Verification</p><p className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">{booking.payment.verificationLabel}</p></div><div className="rounded-2xl bg-[var(--acct-surface)] p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">Next step</p><p className="mt-2 text-sm font-semibold text-[var(--acct-ink)]">{booking.nextAction.label}</p></div></div>
      </div>
      <p className="mt-4 rounded-2xl bg-[var(--acct-surface)] px-4 py-3 text-sm text-[var(--acct-muted)]">{booking.nextAction.description}</p>
      <div className="mt-4 flex flex-wrap gap-2"><Link href={getCareBookingHref(booking.id)} className="acct-button-primary rounded-xl">Open booking</Link>{renderAction(booking.nextAction.href, booking.nextAction.label)}{booking.reviewUrl ? renderAction(booking.reviewUrl, "Leave review") : null}</div>
    </div>
  );
}
