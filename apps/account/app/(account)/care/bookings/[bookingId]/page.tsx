import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  ExternalLink,
  LifeBuoy,
  MapPin,
  Receipt,
  Sparkles,
  Wallet,
} from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import {
  markNotificationsReadByActionUrl,
  markNotificationsReadByReference,
} from "@/lib/account-data";
import { getDivisionInvoices, getDivisionSupportThreads } from "@/lib/division-data";
import { getCareBookingHref, isExternalHref } from "@/lib/account-links";
import { formatDate, formatCurrencyAmount, timeAgoLocalized } from "@/lib/format";
import { getAccountAppLocale } from "@/lib/locale-server";
import { listLinkedCareBookingsForUser } from "@/lib/care-sync";
import PageHeader from "@/components/layout/PageHeader";

export const dynamic = "force-dynamic";

function toneClasses(tone: "normal" | "warning" | "success") {
  return tone === "success"
    ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-700"
    : tone === "warning"
      ? "border-amber-400/25 bg-amber-500/10 text-amber-700"
      : "border-sky-400/25 bg-sky-500/10 text-sky-700";
}

function renderExternalAction(href: string, label: string) {
  return isExternalHref(href) ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="acct-button-secondary rounded-xl">
      {label} <ExternalLink size={14} />
    </a>
  ) : (
    <Link href={href} className="acct-button-secondary rounded-xl">
      {label}
    </Link>
  );
}

export default async function CareBookingDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const [bookings, invoices, supportThreads] = await Promise.all([
    listLinkedCareBookingsForUser({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
    }),
    getDivisionInvoices(user.id, "care"),
    getDivisionSupportThreads(user.id, "care"),
  ]);
  const copy =
    locale === "fr"
      ? {
          back: "Retour à Care",
          notFound: "Réservation introuvable.",
          description:
            "Route dédiée de réservation Care avec l’action suivante, le contexte de paiement et les enregistrements liés au même endroit.",
          getHelp: "Obtenir de l’aide",
          leaveReview: "Laisser un avis",
          nextStep: "Étape suivante",
          service: "Service",
          serviceFallback: "Service Care",
          preparing: "Les détails de la réservation sont en préparation.",
          schedule: "Planification",
          schedulePending: "Planification en attente",
          timeSlotPending: "Créneau en attente",
          address: "Adresse",
          addressPending: "Adresse en attente",
          updated: "Mis à jour",
          payment: "Paiement",
          due: "dus",
          paymentVerification: "Vérification du paiement",
          verificationStatus: "Statut de vérification",
          recordedPaid: "Montant payé enregistré",
          amountDue: "Montant dû",
          receiptSubmissions: "Envois de reçu",
          lastSubmitted: "Dernier envoi",
          accountLinkage: "Lien avec le compte",
          status: "Statut",
          pending: "En attente",
          tracking: "Suivi",
          reviewLink: "Lien d’avis",
          unavailable: "Pas encore disponible",
          linkageBody:
            "Ce lien profond efface les notifications de réservation Care lorsque le registre partagé les a taguées avec la référence de réservation ou l’ancienne URL `?booking=`.",
          linkedInvoices: "Factures liées",
          allInvoices: "Toutes les factures",
          noInvoices:
            "Aucune ligne de facture n’est encore rattachée à cette réservation dans le registre partagé.",
          invoiceFallback: "Facture",
          statusPending: "Statut en attente",
          supportThreads: "Fils de support",
          supportInbox: "Boîte support",
          noSupport:
            "Aucun fil de support n’est encore directement lié à cette réservation. Utilisez le support si cette réservation demande une attention manuelle.",
          supportFallback: "Fil de support",
          open: "Ouvert",
        }
      : {
          back: "Back to care",
          notFound: "Booking not found.",
          description:
            "Dedicated care booking route with the next action, payment context, and linked records in one place.",
          getHelp: "Get help",
          leaveReview: "Leave review",
          nextStep: "Next step",
          service: "Service",
          serviceFallback: "Care service",
          preparing: "Booking details are being prepared.",
          schedule: "Schedule",
          schedulePending: "Schedule pending",
          timeSlotPending: "Time slot pending",
          address: "Address",
          addressPending: "Address pending",
          updated: "Updated",
          payment: "Payment",
          due: "due",
          paymentVerification: "Payment verification",
          verificationStatus: "Verification status",
          recordedPaid: "Recorded paid",
          amountDue: "Amount due",
          receiptSubmissions: "Receipt submissions",
          lastSubmitted: "Last submitted",
          accountLinkage: "Account linkage",
          status: "Status",
          pending: "Pending",
          tracking: "Tracking",
          reviewLink: "Review link",
          unavailable: "Not available yet",
          linkageBody:
            "This deep link clears care booking notifications when the shared ledger has tagged them with the booking reference or the historical `?booking=` URL.",
          linkedInvoices: "Linked invoices",
          allInvoices: "All invoices",
          noInvoices: "No invoice row is attached to this booking in the shared ledger yet.",
          invoiceFallback: "Invoice",
          statusPending: "Status pending",
          supportThreads: "Support threads",
          supportInbox: "Support inbox",
          noSupport:
            "No support thread is linked directly to this booking yet. Use support if this booking needs manual attention.",
          supportFallback: "Support thread",
          open: "Open",
        };
  const booking = bookings.find((item) => item.id === bookingId) || null;

  if (!booking) {
    return (
      <div className="space-y-4 acct-fade-in">
        <Link href="/care" className="acct-button-ghost w-fit rounded-xl">
          <ArrowLeft size={16} /> {copy.back}
        </Link>
        <div className="acct-empty py-20">
          <p className="text-sm text-[var(--acct-muted)]">{copy.notFound}</p>
        </div>
      </div>
    );
  }

  await Promise.all([
    markNotificationsReadByReference(user.id, "care_booking", booking.id),
    markNotificationsReadByActionUrl(user.id, getCareBookingHref(booking.id)),
    markNotificationsReadByActionUrl(user.id, `/care?booking=${encodeURIComponent(booking.id)}`),
  ]);

  const relatedInvoices = invoices.filter((invoice) => String(invoice.reference_id || "") === booking.id);
  const relatedSupport = supportThreads.filter(
    (thread) => String(thread.reference_id || "") === booking.id || String(thread.id || "") === booking.id
  );
  const moneyLocale = locale === "fr" ? "fr-FR" : "en-NG";

  return (
    <div className="space-y-6 acct-fade-in">
      <Link href="/care" className="acct-button-ghost w-fit rounded-xl">
        <ArrowLeft size={16} /> {copy.back}
      </Link>

      <PageHeader
        title={booking.tracking_code || booking.id}
        description={copy.description}
        icon={Sparkles}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/support/new" className="acct-button-primary rounded-xl">
              {copy.getHelp}
            </Link>
            {renderExternalAction(booking.nextAction.href, booking.nextAction.label)}
            {booking.reviewUrl ? renderExternalAction(booking.reviewUrl, copy.leaveReview) : null}
          </div>
        }
      />

      <div className={`rounded-3xl border p-5 ${toneClasses(booking.nextAction.tone)}`}>
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em]">{copy.nextStep}</p>
        <p className="mt-2 text-lg font-semibold">{booking.nextAction.label}</p>
        <p className="mt-2 max-w-3xl text-sm leading-7">{booking.nextAction.description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="acct-card p-5">
          <div className="flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">
            <Sparkles size={14} /> {copy.service}
          </div>
          <p className="mt-3 text-lg font-semibold text-[var(--acct-ink)]">{booking.service_type || copy.serviceFallback}</p>
          <p className="mt-1 text-sm text-[var(--acct-muted)]">{booking.item_summary || copy.preparing}</p>
        </div>
        <div className="acct-card p-5">
          <div className="flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">
            <CalendarClock size={14} /> {copy.schedule}
          </div>
          <p className="mt-3 text-lg font-semibold text-[var(--acct-ink)]">
            {booking.pickup_date ? formatDate(booking.pickup_date, { locale: moneyLocale }) : copy.schedulePending}
          </p>
          <p className="mt-1 text-sm text-[var(--acct-muted)]">{booking.pickup_slot || copy.timeSlotPending}</p>
        </div>
        <div className="acct-card p-5">
          <div className="flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">
            <MapPin size={14} /> {copy.address}
          </div>
          <p className="mt-3 text-lg font-semibold text-[var(--acct-ink)]">{booking.pickup_address || copy.addressPending}</p>
          <p className="mt-1 text-sm text-[var(--acct-muted)]">
            {copy.updated} {timeAgoLocalized(booking.updated_at || booking.created_at || new Date().toISOString(), locale)}
          </p>
        </div>
        <div className="acct-card p-5">
          <div className="flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--acct-muted)]">
            <Wallet size={14} /> {copy.payment}
          </div>
          <p className="mt-3 text-lg font-semibold text-[var(--acct-ink)]">
            {formatCurrencyAmount(booking.payment.balanceDue, "NGN", { unit: "naira", locale: moneyLocale })} {copy.due}
          </p>
          <p className="mt-1 text-sm text-[var(--acct-muted)]">{booking.payment.verificationLabel}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="acct-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Receipt size={14} className="text-[var(--acct-muted)]" />
            <p className="acct-kicker">{copy.paymentVerification}</p>
          </div>
          <div className="space-y-3 text-sm text-[var(--acct-ink)]">
            <div><span className="font-semibold">{copy.verificationStatus}:</span> {booking.payment.verificationLabel}</div>
            <div><span className="font-semibold">{copy.recordedPaid}:</span> {formatCurrencyAmount(booking.payment.amountPaidRecorded, "NGN", { unit: "naira", locale: moneyLocale })}</div>
            <div><span className="font-semibold">{copy.amountDue}:</span> {formatCurrencyAmount(booking.payment.amountDue, "NGN", { unit: "naira", locale: moneyLocale })}</div>
            <div><span className="font-semibold">{copy.receiptSubmissions}:</span> {booking.payment.receiptCount}</div>
            {booking.payment.lastSubmittedAt ? (
              <div><span className="font-semibold">{copy.lastSubmitted}:</span> {formatDate(booking.payment.lastSubmittedAt, { locale: moneyLocale })}</div>
            ) : null}
            {booking.payment.latestReviewReason ? (
              <p className="rounded-2xl bg-[var(--acct-surface)] px-4 py-3 text-[var(--acct-muted)]">{booking.payment.latestReviewReason}</p>
            ) : null}
            <p className="text-[var(--acct-muted)]">{booking.payment.verificationMessage}</p>
          </div>
        </section>

        <section className="acct-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <LifeBuoy size={14} className="text-[var(--acct-muted)]" />
            <p className="acct-kicker">{copy.accountLinkage}</p>
          </div>
          <div className="space-y-3 text-sm text-[var(--acct-ink)]">
            <div><span className="font-semibold">{copy.status}:</span> {booking.status || copy.pending}</div>
            <div><span className="font-semibold">{copy.tracking}:</span> {booking.trackUrl}</div>
            <div><span className="font-semibold">{copy.reviewLink}:</span> {booking.reviewUrl || copy.unavailable}</div>
            <p className="text-[var(--acct-muted)]">{copy.linkageBody}</p>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="acct-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="acct-kicker">{copy.linkedInvoices}</p>
            <Link href="/invoices" className="text-xs font-medium text-[var(--acct-gold)] hover:underline">
              {copy.allInvoices}
            </Link>
          </div>
          {relatedInvoices.length === 0 ? (
            <p className="text-sm text-[var(--acct-muted)]">{copy.noInvoices}</p>
          ) : (
            <div className="space-y-2">
              {relatedInvoices.map((invoice) => (
                <Link
                  key={String(invoice.id)}
                  href={`/invoices/${invoice.id}`}
                  className="flex items-center justify-between rounded-xl bg-[var(--acct-surface)] px-4 py-3 transition-colors hover:bg-[var(--acct-line)]"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--acct-ink)]">
                      {String(invoice.description || invoice.invoice_no || copy.invoiceFallback)}
                    </p>
                    <p className="text-xs text-[var(--acct-muted)]">
                      {String(invoice.status || copy.statusPending)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[var(--acct-ink)]">
                    {formatCurrencyAmount(Number(invoice.total_kobo || 0), "NGN", {
                      unit: "kobo",
                      locale: moneyLocale,
                    })}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="acct-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="acct-kicker">{copy.supportThreads}</p>
            <Link href="/support" className="text-xs font-medium text-[var(--acct-gold)] hover:underline">
              {copy.supportInbox}
            </Link>
          </div>
          {relatedSupport.length === 0 ? (
            <p className="text-sm text-[var(--acct-muted)]">{copy.noSupport}</p>
          ) : (
            <div className="space-y-2">
              {relatedSupport.map((thread) => (
                <Link
                  key={String(thread.id)}
                  href={`/support/${thread.id}`}
                  className="flex items-center justify-between rounded-xl bg-[var(--acct-surface)] px-4 py-3 transition-colors hover:bg-[var(--acct-line)]"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--acct-ink)]">
                      {String(thread.subject || copy.supportFallback)}
                    </p>
                    <p className="text-xs text-[var(--acct-muted)]">
                      {String(thread.status || copy.open)}
                    </p>
                  </div>
                  <span className="acct-chip acct-chip-blue text-[0.6rem]">{copy.open}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
