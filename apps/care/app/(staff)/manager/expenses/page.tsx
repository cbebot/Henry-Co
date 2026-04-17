import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  ReceiptText,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import ImageFileField from "@/components/forms/ImageFileField";
import PendingSubmitButton from "@/components/forms/PendingSubmitButton";
import { requireRoles } from "@/lib/auth/server";
import { getExpenses, getPayments } from "@/lib/admin/care-admin";
import { logProtectedPageAccess } from "@/lib/security/logger";
import { createExpenseAction } from "../../owner/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manager Expenses | Henry & Co. Fabric Care",
  description:
    "Manager expense control room for recording operational costs with clean auditability.",
};

import { formatMoney } from "@/lib/format";

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

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function approvalTone(status?: string | null) {
  const key = String(status || "").toLowerCase();

  if (key === "approved") {
    return "border-emerald-300/30 bg-emerald-500/10 text-emerald-100";
  }

  if (key === "voided") {
    return "border-red-300/30 bg-red-500/10 text-red-100";
  }

  return "border-amber-300/30 bg-amber-500/10 text-amber-100";
}

export default async function ManagerExpensesPage() {
  await requireRoles(["owner", "manager"]);
  await logProtectedPageAccess("/manager/expenses");

  const [expenses, payments] = await Promise.all([
    getExpenses({ scope: "active", limit: 300 }),
    getPayments({ scope: "active", limit: 300 }),
  ]);

  const recordedExpenses = expenses.filter(
    (row) => String(row.approval_status || "").toLowerCase() === "recorded"
  );
  const approvedExpenses = expenses.filter(
    (row) => String(row.approval_status || "").toLowerCase() === "approved"
  );

  const totalExpenses = expenses
    .filter((row) => String(row.approval_status || "").toLowerCase() !== "voided")
    .reduce((sum, row) => sum + Number(row.amount || 0), 0);

  const totalApprovedExpenses = approvedExpenses.reduce(
    (sum, row) => sum + Number(row.amount || 0),
    0
  );

  const totalRecordedInflow = payments.reduce(
    (sum, row) => sum + Number(row.amount || 0),
    0
  );

  return (
    <div className="space-y-8">
      <section className="rounded-[38px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_22px_80px_rgba(0,0,0,0.20)]">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
          Manager expense room
        </div>
        <h2 className="mt-2 text-4xl font-black text-white sm:text-5xl">
          Record every operational cost immediately.
        </h2>
        <p className="mt-4 max-w-3xl text-white/65">
          Expenses should be entered the same day they happen. Fuel, packaging, detergent,
          logistics, and maintenance should never stay outside the system.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <QuickLink href="/manager">Back to dashboard</QuickLink>
          <QuickLink href="/manager/operations">Open operations</QuickLink>
          <QuickLink href="/owner/finance">Owner finance view</QuickLink>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={ReceiptText}
          label="Total expenses"
          value={formatMoney(totalExpenses)}
          note="All non-voided records"
        />
        <MetricCard
          icon={BadgeCheck}
          label="Approved expenses"
          value={formatMoney(totalApprovedExpenses)}
          note="Accepted by owner"
        />
        <MetricCard
          icon={TriangleAlert}
          label="Pending approval"
          value={String(recordedExpenses.length)}
          note="Still awaiting owner decision"
        />
        <MetricCard
          icon={Wallet}
          label="Recorded inflow"
          value={formatMoney(totalRecordedInflow)}
          note="Compare inflow against costs"
        />
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel
          eyebrow="New expense"
          title="Record manager expense"
          subtitle="Enter the cost once, with enough detail that the owner can trust the record immediately."
        >
          <form action={createExpenseAction} className="grid gap-4">
            <input type="hidden" name="source_route" value="/manager/expenses" />

            <div className="grid gap-4 md:grid-cols-2">
              <input
                name="expense_date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className={inputCls}
                required
              />
              <input
                name="booking_lookup"
                placeholder="Tracking code or booking ID (optional)"
                className={inputCls}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <select name="category" required className={inputCls} defaultValue="">
                <option value="" disabled className="text-black">
                  Select expense category
                </option>
                <option value="fuel" className="text-black">Fuel</option>
                <option value="logistics" className="text-black">Logistics</option>
                <option value="detergent" className="text-black">Detergent</option>
                <option value="packaging" className="text-black">Packaging</option>
                <option value="maintenance" className="text-black">Maintenance</option>
                <option value="utility" className="text-black">Utility</option>
                <option value="refund" className="text-black">Refund</option>
                <option value="operations" className="text-black">Operations</option>
                <option value="staff_welfare" className="text-black">Staff welfare</option>
                <option value="other" className="text-black">Other</option>
              </select>

              <input
                name="vendor"
                placeholder="Vendor / recipient (optional)"
                className={inputCls}
              />
            </div>

            <textarea
              name="description"
              rows={4}
              placeholder="What exactly was this money used for?"
              className={textareaCls}
              required
            />

            <div className="grid gap-4 md:grid-cols-2">
              <input
                name="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                className={inputCls}
                required
              />

              <select name="payment_method" className={inputCls} defaultValue="">
                <option value="" className="text-black">Payment method (optional)</option>
                <option value="cash" className="text-black">Cash</option>
                <option value="transfer" className="text-black">Transfer</option>
                <option value="pos" className="text-black">POS</option>
                <option value="online" className="text-black">Online</option>
                <option value="other" className="text-black">Other</option>
              </select>
            </div>

            <input
              name="receipt_url"
              placeholder="Manual proof URL (optional)"
              className={inputCls}
            />
            <ImageFileField
              name="receipt_file"
              label="Receipt or proof image"
              hint="Upload a receipt, fuel proof, or supporting photo when available."
            />

            <textarea
              name="notes"
              rows={3}
              placeholder="Extra notes for owner review..."
              className={textareaCls}
            />

            <PendingSubmitButton
              label="Save expense record"
              pendingLabel="Saving expense..."
              icon={<ArrowRight className="h-4 w-4" />}
            />
          </form>
        </Panel>

        <Panel
          eyebrow="Approval queue"
          title="Recent expense records"
          subtitle="The owner should be able to understand these records clearly and approve with confidence."
        >
          <div className="grid gap-4">
            {expenses.length > 0 ? (
              expenses.slice(0, 20).map((expense) => (
                <article
                  key={expense.id}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-white">
                        {expense.category}
                      </div>
                      <div className="mt-1 text-xs text-white/45">
                        {expense.expense_no} • {expense.vendor || "No vendor"}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-black text-red-200">
                        {formatMoney(expense.amount)}
                      </div>
                      <div className="mt-1 text-xs text-white/45">
                        {formatDate(expense.expense_date)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-relaxed text-white/75">
                    {expense.description}
                  </div>

                  {expense.receipt_url ? (
                    <a
                      href={expense.receipt_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex text-sm font-semibold text-[color:var(--accent-strong)]"
                    >
                      View uploaded proof
                    </a>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${approvalTone(
                        expense.approval_status
                      )}`}
                    >
                      {expense.approval_status}
                    </span>

                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                      {expense.payment_method || "No payment method"}
                    </span>
                  </div>

                  <div className="mt-3 text-xs text-white/45">
                    Created {formatDateTime(expense.created_at)}
                  </div>
                </article>
              ))
            ) : (
              <EmptyState text="No expense records yet." />
            )}
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
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.16)]">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
        <Icon className="h-6 w-6 text-[color:var(--accent-strong)]" />
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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center text-white/55">
      {text}
    </div>
  );
}

const inputCls =
  "h-12 rounded-2xl border border-white/10 bg-white/[0.05] px-4 text-sm font-medium text-white outline-none";

const textareaCls =
  "rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium text-white outline-none";
