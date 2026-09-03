import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  ClipboardList,
  CreditCard,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { getCareCopy } from "@henryco/i18n/server";
import { requireRoles } from "@/lib/auth/server";
import {
  getAdminBookings,
  getExpenses,
  getFinanceSummary,
  getOrderItems,
  getPayments,
  getUrgentBookings,
} from "@/lib/admin/care-admin";
import { isServiceBookingRecord } from "@/lib/care-booking-shared";
import { getCarePublicLocale } from "@/lib/locale-server";
import { logProtectedPageAccess } from "@/lib/security/logger";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCarePublicLocale();
  const copy = getCareCopy(locale);
  return {
    title: copy.staffManager.metadata.title,
    description: copy.staffManager.metadata.description,
  };
}

function formatMoney(value: number | string) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

function formatDate(value: string | null | undefined, dash: string) {
  if (!value) return dash;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function ManagerPage() {
  await requireRoles(["owner", "manager"]);
  await logProtectedPageAccess("/manager");

  const locale = await getCarePublicLocale();
  const copy = getCareCopy(locale);
  const sm = copy.staffManager;

  const [bookings, urgentBookings, orderItems, payments, expenses, finance] = await Promise.all([
    getAdminBookings({ scope: "active", limit: 500 }),
    getUrgentBookings(8),
    getOrderItems({ scope: "active", limit: 500 }),
    getPayments({ scope: "active", limit: 500 }),
    getExpenses({ scope: "active", limit: 500 }),
    getFinanceSummary(),
  ]);

  const totalRegisteredPieces = orderItems.reduce(
    (sum, row) => sum + Number(row.quantity || 0),
    0
  );

  const totalInflow = payments.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const pendingExpenses = expenses.filter(
    (row) => String(row.approval_status || "").toLowerCase() === "recorded"
  );
  const approvedExpenses = expenses.filter(
    (row) => String(row.approval_status || "").toLowerCase() === "approved"
  );

  const activeBookings = bookings.filter(
    (row) => !["delivered", "cancelled"].includes(String(row.status || "").toLowerCase())
  );

  const bookingsWithoutItems = activeBookings.filter(
    (booking) =>
      !isServiceBookingRecord(booking) &&
      !orderItems.some((item) => item.booking_id === booking.id)
  );

  const balanceNote = sm.pressurePanel.overallBalance.flowTemplate
    .replace("{inflow}", formatMoney(finance.total_inflow))
    .replace("{outflow}", formatMoney(finance.total_outflow));

  return (
    <div className="space-y-8">
      <section className="rounded-[38px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_22px_80px_rgba(0,0,0,0.20)]">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
          {sm.hero.eyebrow}
        </div>
        <h2 className="mt-2 text-4xl font-semibold text-white sm:text-5xl">
          {sm.hero.title}
        </h2>
        <p className="mt-4 max-w-3xl text-white/65">{sm.hero.body}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <QuickLink href="/manager/operations">{sm.quickLinks.openOperations}</QuickLink>
          <QuickLink href="/manager/expenses">{sm.quickLinks.openExpenses}</QuickLink>
          <QuickLink href="/track">{sm.quickLinks.trackingPage}</QuickLink>
          <QuickLink href="/book">{sm.quickLinks.createWalkIn}</QuickLink>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          icon={ClipboardList}
          label={sm.metrics.activeBookings.label}
          value={String(activeBookings.length)}
          note={sm.metrics.activeBookings.note}
        />
        <MetricCard
          icon={AlertTriangle}
          label={sm.metrics.urgentQueue.label}
          value={String(urgentBookings.length)}
          note={sm.metrics.urgentQueue.note}
        />
        <MetricCard
          icon={Sparkles}
          label={sm.metrics.registeredPieces.label}
          value={String(totalRegisteredPieces)}
          note={sm.metrics.registeredPieces.note}
        />
        <MetricCard
          icon={Wallet}
          label={sm.metrics.recordedInflow.label}
          value={formatMoney(totalInflow)}
          note={sm.metrics.recordedInflow.note}
        />
        <MetricCard
          icon={CreditCard}
          label={sm.metrics.pendingExpenses.label}
          value={String(pendingExpenses.length)}
          note={sm.metrics.pendingExpenses.note}
        />
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel
          eyebrow={sm.urgentPanel.eyebrow}
          title={sm.urgentPanel.title}
          subtitle={sm.urgentPanel.subtitle}
        >
          <div className="grid gap-4">
            {urgentBookings.length > 0 ? (
              urgentBookings.map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <div className="font-mono text-sm font-semibold text-[color:var(--accent-strong)]">
                    {booking.tracking_code}
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {booking.customer_name}
                  </div>
                  <div className="mt-1 text-sm text-white/65">
                    {booking.service_type} • {booking.status}
                  </div>
                  <div className="mt-1 text-sm text-white/45">
                    {formatDate(booking.pickup_date, sm.dash)} •{" "}
                    {booking.pickup_slot || sm.urgentPanel.noSlot}
                  </div>

                  <div className="mt-4">
                    <Link
                      href={`/manager/operations?booking=${encodeURIComponent(
                        booking.tracking_code
                      )}`}
                      className="care-button-primary inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
                    >
                      {sm.urgentPanel.openBooking}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState text={sm.urgentPanel.empty} />
            )}
          </div>
        </Panel>

        <Panel
          eyebrow={sm.pressurePanel.eyebrow}
          title={sm.pressurePanel.title}
          subtitle={sm.pressurePanel.subtitle}
        >
          <div className="grid gap-4">
            <InfoTile
              icon={ShieldCheck}
              label={sm.pressurePanel.missingIntake.label}
              value={String(bookingsWithoutItems.length)}
              note={sm.pressurePanel.missingIntake.note}
            />
            <InfoTile
              icon={ReceiptText}
              label={sm.pressurePanel.approvedExpenses.label}
              value={String(approvedExpenses.length)}
              note={sm.pressurePanel.approvedExpenses.note}
            />
            <InfoTile
              icon={BadgeCheck}
              label={sm.pressurePanel.overallBalance.label}
              value={formatMoney(finance.balance)}
              note={balanceNote}
            />
          </div>
        </Panel>
      </section>
    </div>
  );
}

function QuickLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white transition hover:border-[color:var(--accent)]/40 hover:bg-white/[0.08]"
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.16)]">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
        <Icon className="h-6 w-6 text-[color:var(--accent)]" />
      </div>
      <div className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
        {label}
      </div>
      <div className="mt-2 text-4xl font-black text-white">{value}</div>
      <div className="mt-2 text-sm text-white/60">{note}</div>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
        {eyebrow}
      </div>
      <h2 className="mt-2 text-3xl font-semibold text-white">{title}</h2>
      <p className="mt-2 text-white/65">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
        <Icon className="h-5 w-5 text-[color:var(--accent-strong)]" />
      </div>
      <div className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
        {label}
      </div>
      <div className="mt-2 text-3xl font-black text-white">{value}</div>
      <div className="mt-2 text-sm leading-relaxed text-white/60">{note}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center text-white/55">
      {text}
    </div>
  );
}
