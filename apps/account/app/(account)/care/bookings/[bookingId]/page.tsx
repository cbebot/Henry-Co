import Link from "next/link";
import { ArrowLeft, CalendarClock, ExternalLink, LifeBuoy, MapPin, Receipt, Sparkles, Wallet } from "lucide-react";
import { formatPrice } from "@henryco/i18n";
import { requireAccountUser } from "@/lib/auth";
import { markNotificationsReadByActionUrl, markNotificationsReadByReference } from "@/lib/account-data";
import { getDivisionInvoices, getDivisionSupportThreads } from "@/lib/division-data";
import { getCareBookingHref, isExternalHref } from "@/lib/account-links";
import { formatDate, timeAgo } from "@/lib/format";
import { listLinkedCareBookingsForUser } from "@/lib/care-sync";
import PageHeader from "@/components/layout/PageHeader";

export const dynamic = "force-dynamic";
function formatMoney(value: number | null | undefined) { return formatPrice(value); }
function toneClasses(tone: "normal" | "warning" | "success") { return tone === "success" ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-700" : tone === "warning" ? "border-amber-400/25 bg-amber-500/10 text-amber-700" : "border-sky-400/25 bg-sky-500/10 text-sky-700"; }
function renderExternalAction(href: string, label: string) { return isExternalHref(href) ? <a href={href} target="_blank" rel="noopener noreferrer" className="acct-button-secondary rounded-xl">{label} <ExternalLink size={14} /></a> : <Link href={href} className="acct-button-secondary rounded-xl">{label}</Link>; }

export default async function CareBookingDetailPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const user = await requireAccountUser();
  const [bookings, invoices, supportThreads] = await Promise.all([
    listLinkedCareBookingsForUser({ userId: user.id, email: user.email, fullName: user.fullName, phone: user.phone }),
    getDivisionInvoices(user.id, "care"),
    getDivisionSupportThreads(user.id, "care"),
  ]);
  const booking = bookings.find((item) => item.id === bookingId) || null;
  if (!booking) return <div className="space-y-4 acct-fade-in"><Link href="/care" className="acct-button-ghost w-fit rounded-xl"><ArrowLeft size={16} /> Back to care</Link><div className="acct-empty py-20"><p className="text-sm text-[var(--acct-muted)]">Booking not found.</p></div></div>;
  await Promise.all([markNotificationsReadByReference(user.id, "care_booking", booking.id), markNotificationsReadByActionUrl(user.id, getCareBookingHref(booking.id)), markNotificationsReadByActionUrl(user.id, `/care?booking=${encodeURIComponent(booking.id)}`)]);
  const relatedInvoices = invoices.filter((invoice) => String(invoice.reference_id || "") === booking.id);
  const relatedSupport = supportThreads.filter((thread) => String(thread.reference_id || "") === booking.id || String(thread.id || "") === booking.id);
  return (
    <div className="space-y-6 acct-fade-in">
      <Link href="/care" className="acct-button-ghost w-fit rounded-xl"><ArrowLeft size={16} /> Back to care</Link>
      <PageHeader title={booking.tracking_code || booking.id} description="Dedicated care booking route with the next action, payment context, and linked records in one place." icon={Sparkles} actions={<div className="flex flex-wrap gap-2"><Link href="/support/new" className="acct-button-primary rounded-xl">Get help</Link>{renderExternalAction(booking.nextAction.href, booking.nextAction.label)}{booking.reviewUrl ? renderExternalAction(booking.reviewUrl, "Leave review") : null}</div>} />
      <div className={`rounded-3xl border p-5 ${toneClasses(booking.nextAction.tone)}`}><p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em]">Next step</p><p className="mt-2 text-lg font-semibold">{booking.nextAction.label}</p><p className="mt-2 max-w-3xl text-sm leading-7">{booking.nextAction.description}</p></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="acct-card p-5"><div className="flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]"><Sparkles size={14} /> Service</div><p className="mt-3 text-lg font-semibold text-[var(--acct-ink)]">{booking.service_type || "Care service"}</p><p className="mt-1 text-sm text-[var(--acct-muted)]">{booking.item_summary || "Booking details are being prepared."}</p></div>
        <div className="acct-card p-5"><div className="flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]"><CalendarClock size={14} /> Schedule</div><p className="mt-3 text-lg font-semibold text-[var(--acct-ink)]">{booking.pickup_date ? formatDate(booking.pickup_date) : "Schedule pending"}</p><p className="mt-1 text-sm text-[var(--acct-muted)]">{booking.pickup_slot || "Time slot pending"}</p></div>
        <div className="acct-card p-5"><div className="flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]"><MapPin size={14} /> Address</div><p className="mt-3 text-lg font-semibold text-[var(--acct-ink)]">{booking.pickup_address || "Address pending"}</p><p className="mt-1 text-sm text-[var(--acct-muted)]">Updated {timeAgo(booking.updated_at || booking.created_at || new Date().toISOString())}</p></div>
        <div className="acct-card p-5"><div className="flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]"><Wallet size={14} /> Payment</div><p className="mt-3 text-lg font-semibold text-[var(--acct-ink)]">{formatMoney(booking.payment.balanceDue)} due</p><p className="mt-1 text-sm text-[var(--acct-muted)]">{booking.payment.verificationLabel}</p></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="acct-card p-5"><div className="mb-4 flex items-center gap-2"><Receipt size={14} className="text-[var(--acct-muted)]" /><p className="acct-kicker">Payment verification</p></div><div className="space-y-3 text-sm text-[var(--acct-ink)]"><div><span className="font-semibold">Verification status:</span> {booking.payment.verificationLabel}</div><div><span className="font-semibold">Recorded paid:</span> {formatMoney(booking.payment.amountPaidRecorded)}</div><div><span className="font-semibold">Amount due:</span> {formatMoney(booking.payment.amountDue)}</div><div><span className="font-semibold">Receipt submissions:</span> {booking.payment.receiptCount}</div>{booking.payment.lastSubmittedAt ? <div><span className="font-semibold">Last submitted:</span> {formatDate(booking.payment.lastSubmittedAt)}</div> : null}{booking.payment.latestReviewReason ? <p className="rounded-2xl bg-[var(--acct-surface)] px-4 py-3 text-[var(--acct-muted)]">{booking.payment.latestReviewReason}</p> : null}<p className="text-[var(--acct-muted)]">{booking.payment.verificationMessage}</p></div></section>
        <section className="acct-card p-5"><div className="mb-4 flex items-center gap-2"><LifeBuoy size={14} className="text-[var(--acct-muted)]" /><p className="acct-kicker">Account linkage</p></div><div className="space-y-3 text-sm text-[var(--acct-ink)]"><div><span className="font-semibold">Status:</span> {booking.status || "Pending"}</div><div><span className="font-semibold">Tracking:</span> {booking.trackUrl}</div><div><span className="font-semibold">Review link:</span> {booking.reviewUrl || "Not available yet"}</div><p className="text-[var(--acct-muted)]">This deep link clears care booking notifications when the shared ledger has tagged them with the booking reference or the historical `?booking=` URL.</p></div></section>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="acct-card p-5"><div className="mb-4 flex items-center justify-between"><p className="acct-kicker">Linked invoices</p><Link href="/invoices" className="text-xs font-medium text-[var(--acct-gold)] hover:underline">All invoices</Link></div>{relatedInvoices.length === 0 ? <p className="text-sm text-[var(--acct-muted)]">No invoice row is attached to this booking in the shared ledger yet.</p> : <div className="space-y-2">{relatedInvoices.map((invoice) => <Link key={String(invoice.id)} href={`/invoices/${invoice.id}`} className="flex items-center justify-between rounded-xl bg-[var(--acct-surface)] px-4 py-3 transition-colors hover:bg-[var(--acct-line)]"><div><p className="text-sm font-medium text-[var(--acct-ink)]">{String(invoice.description || invoice.invoice_no || "Invoice")}</p><p className="text-xs text-[var(--acct-muted)]">{String(invoice.status || "Status pending")}</p></div><p className="text-sm font-semibold text-[var(--acct-ink)]">₦{Number(invoice.total_kobo || 0).toLocaleString()}</p></Link>)}</div>}</section>
        <section className="acct-card p-5"><div className="mb-4 flex items-center justify-between"><p className="acct-kicker">Support threads</p><Link href="/support" className="text-xs font-medium text-[var(--acct-gold)] hover:underline">Support inbox</Link></div>{relatedSupport.length === 0 ? <p className="text-sm text-[var(--acct-muted)]">No support thread is linked directly to this booking yet. Use support if this booking needs manual attention.</p> : <div className="space-y-2">{relatedSupport.map((thread) => <Link key={String(thread.id)} href={`/support/${thread.id}`} className="flex items-center justify-between rounded-xl bg-[var(--acct-surface)] px-4 py-3 transition-colors hover:bg-[var(--acct-line)]"><div><p className="text-sm font-medium text-[var(--acct-ink)]">{String(thread.subject || "Support thread")}</p><p className="text-xs text-[var(--acct-muted)]">{String(thread.status || "Open")}</p></div><span className="acct-chip acct-chip-blue text-[0.6rem]">Open</span></Link>)}</div>}</section>
      </div>
    </div>
  );
}
