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
import { logProtectedPageAccess } from "@/lib/security/logger";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manager Dashboard | Henry & Co. Fabric Care",
  description:
    "Manager command dashboard for intake, live operations, inflow, and expense control.",
};

function formatMoney(value: number | string) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
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

  return (
    <div className="space-y-8">
      <section className="rounded-[38px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_22px_80px_rgba(0,0,0,0.20)]">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
          Manager operations room
        </div>
        <h2 className="mt-2 text-4xl font-black text-white sm:text-5xl">
          Run the day. Keep the records truthful.
        </h2>
        <p className="mt-4 max-w-3xl text-white/65">
          This is the manager’s live control layer. Intake, pricing-backed registration,
          status movement, payment capture, and daily expenses should all be handled from here
          without confusion.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <QuickLink href="/manager/operations">Open operations</QuickLink>
          <QuickLink href="/manager/expenses">Open expenses</QuickLink>
          <QuickLink href="/track">Tracking page</QuickLink>
          <QuickLink href="/book">Create walk-in booking</QuickLink>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          icon={ClipboardList}
          label="Active bookings"
          value={String(activeBookings.length)}
          note="Current live workload"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Urgent queue"
          value={String(urgentBookings.length)}
          note="Needs quick attention"
        />
        <MetricCard
          icon={Sparkles}
          label="Registered pieces"
          value={String(totalRegisteredPieces)}
          note="Pricing-backed item records"
        />
        <MetricCard
          icon={Wallet}
          label="Recorded inflow"
          value={formatMoney(totalInflow)}
          note="Money logged against bookings"
        />
        <MetricCard
          icon={CreditCard}
          label="Pending expenses"
          value={String(pendingExpenses.length)}
          note="Awaiting owner review"
        />
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel
          eyebrow="Priority"
          title="Urgent bookings"
          subtitle="These are the jobs the manager should not ignore."
        >
          <div className="grid gap-4">
            {urgentBookings.length > 0 ? (
              urgentBookings.map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <div className="font-mono text-sm font-bold text-[color:var(--accent-strong)]">
                    {booking.tracking_code}
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {booking.customer_name}
                  </div>
                  <div className="mt-1 text-sm text-white/65">
                    {booking.service_type} • {booking.status}
                  </div>
                  <div className="mt-1 text-sm text-white/45">
                    {formatDate(booking.pickup_date)} • {booking.pickup_slot || "No slot"}
                  </div>

                  <div className="mt-4">
                    <Link
                      href={`/manager/operations?booking=${encodeURIComponent(
                        booking.tracking_code
                      )}`}
                      className="care-button-primary inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
                    >
                      Open booking
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState text="No urgent bookings right now." />
            )}
          </div>
        </Panel>

        <Panel
          eyebrow="Manager truth checks"
          title="Operational pressure points"
          subtitle="These indicators help the manager stop hidden mistakes before they become company problems."
        >
          <div className="grid gap-4">
            <InfoTile
              icon={ShieldCheck}
              label="Garment bookings missing intake"
              value={String(bookingsWithoutItems.length)}
              note="Only garment bookings should be flagged here. Service bookings are tracked separately."
            />
            <InfoTile
              icon={ReceiptText}
              label="Approved expenses"
              value={String(approvedExpenses.length)}
              note="These costs have already been accepted by owner review."
            />
            <InfoTile
              icon={BadgeCheck}
              label="Overall balance"
              value={formatMoney(finance.balance)}
              note={`${formatMoney(finance.total_inflow)} in • ${formatMoney(
                finance.total_outflow
              )} out`}
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
      <h2 className="mt-2 text-3xl font-bold text-white">{title}</h2>
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
