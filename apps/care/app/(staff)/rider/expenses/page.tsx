import type { Metadata } from "next";
import ImageFileField from "@/components/forms/ImageFileField";
import PendingSubmitButton from "@/components/forms/PendingSubmitButton";
import { requireRoles } from "@/lib/auth/server";
import { getExpenses } from "@/lib/admin/care-admin";
import { logProtectedPageAccess } from "@/lib/security/logger";
import { createExpenseAction } from "../../owner/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rider Expenses | Henry & Co. Fabric Care",
  description: "Rider fuel, toll, repair, and movement expense recording.",
};

function formatMoney(value: number) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

export default async function RiderExpensesPage() {
  await requireRoles(["owner", "manager", "rider"]);
  await logProtectedPageAccess("/rider/expenses");

  const recentExpenses = await getExpenses({ scope: "active", limit: 12 });

  return (
    <div className="space-y-8">
      <section className="rounded-[34px] border border-black/10 bg-white/80 p-8 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent-deep)] dark:text-[color:var(--accent)]">
          Rider expenses
        </div>
        <h1 className="mt-2 text-4xl font-black text-zinc-950 dark:text-white">
          Record movement costs clearly.
        </h1>
        <p className="mt-3 max-w-3xl text-zinc-600 dark:text-white/65">
          Use this page for fuel, toll, repair, maintenance, and delivery-related spending.
        </p>
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <form action={createExpenseAction} className="grid gap-4">
            <input type="hidden" name="source_route" value="/rider/expenses" />

            <div className="grid gap-4 md:grid-cols-2">
              <input name="expense_date" type="date" className={inputCls} />
              <input
                name="booking_lookup"
                placeholder="Tracking code or booking ID (optional)"
                className={inputCls}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <select name="category" className={inputCls} defaultValue="fuel">
                <option value="fuel">fuel</option>
                <option value="toll">toll</option>
                <option value="repair">repair</option>
                <option value="maintenance">maintenance</option>
                <option value="transport">transport</option>
                <option value="other">other</option>
              </select>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Amount"
                className={inputCls}
              />
            </div>

            <input name="payment_method" placeholder="Cash / transfer / POS" className={inputCls} />
            <input name="description" placeholder="What was this expense for?" className={inputCls} />
            <textarea name="notes" rows={4} placeholder="Extra note" className={textareaCls} />
            <ImageFileField
              name="receipt_file"
              label="Fuel or receipt proof"
              hint="Optional, but recommended for fuel, toll, repairs, and any cost that may need review later."
            />
            <input name="receipt_url" placeholder="Manual proof URL (optional)" className={inputCls} />

            <PendingSubmitButton label="Save expense" pendingLabel="Saving expense..." />
          </form>
        </section>

        <section className="rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="grid gap-4">
            {recentExpenses.length > 0 ? (
              recentExpenses.map((expense) => (
                <article
                  key={expense.id}
                  className="rounded-3xl border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="font-semibold text-zinc-950 dark:text-white">{expense.category}</div>
                  <div className="mt-1 text-xs text-zinc-500 dark:text-white/45">
                    {expense.expense_no} • {expense.approval_status}
                  </div>
                  <div className="mt-3 font-black text-red-600 dark:text-red-300">
                    {formatMoney(expense.amount)}
                  </div>
                  {expense.receipt_url ? (
                    <a
                      href={expense.receipt_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex text-sm font-semibold text-[color:var(--accent)]"
                    >
                      View proof
                    </a>
                  ) : null}
                </article>
              ))
            ) : (
              <div className="rounded-3xl border border-black/10 bg-black/[0.03] p-10 text-center text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-white/55">
                No expenses yet.
              </div>
            )}
          </div>
        </section>
      </section>
    </div>
  );
}

const inputCls =
  "h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white";

const textareaCls =
  "rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-zinc-900 outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white";
