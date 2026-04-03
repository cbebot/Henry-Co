import type { Metadata } from "next";
import {
  BadgeCheck,
  Boxes,
  Search,
  ShieldCheck,
} from "lucide-react";
import PendingSubmitButton from "@/components/forms/PendingSubmitButton";
import { requireRoles } from "@/lib/auth/server";
import {
  getAdminPricing,
  getOrderItems,
  monthArchiveNote,
} from "@/lib/admin/care-admin";
import { logProtectedPageAccess } from "@/lib/security/logger";
import { createOrderItemAction } from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Owner Records | Henry & Co. Fabric Care",
  description: "Every cloth recorded online, searchable, archived cleanly, and structured for accountability.",
};

function formatMoney(value?: number | null) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

export default async function OwnerRecordsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; scope?: string; urgentOnly?: string }>;
}) {
  await requireRoles(["owner"]);
  await logProtectedPageAccess("/owner/records");

  const params = (await searchParams) ?? {};
  const q = String(params.q || "").trim();
  const scope = (String(params.scope || "active").trim() || "active") as
    | "active"
    | "archive"
    | "all";
  const urgentOnly = String(params.urgentOnly || "") === "1";

  const [items, pricingItems] = await Promise.all([
    getOrderItems({
      scope,
      q,
      urgentOnly,
      limit: 500,
    }),
    getAdminPricing(),
  ]);

  const activePricing = pricingItems.filter((row) => row.is_active);
  const totalPieces = items.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
  const totalTrackedValue = items.reduce(
    (sum, row) => sum + Number(row.line_total ?? 0),
    0
  );

  return (
    <div className="space-y-8">
      <section className="rounded-[38px] border border-black/10 bg-white/80 p-8 shadow-[0_22px_80px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent-deep)] dark:text-[color:var(--accent)]">
          Owner record intelligence
        </div>
        <h1 className="mt-2 text-4xl font-black text-zinc-950 dark:text-white sm:text-5xl">
          Every cloth should exist in the system.
        </h1>
        <p className="mt-4 max-w-3xl text-zinc-600 dark:text-white/65">
          This page protects long-term accountability. Every item can be tracked,
          searched, archived, and reviewed later without confusion.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <StatCard icon={Boxes} label="Record rows" value={String(items.length)} />
        <StatCard icon={ShieldCheck} label="Total pieces" value={String(totalPieces)} />
        <StatCard icon={BadgeCheck} label="Tracked value" value={formatMoney(totalTrackedValue)} />
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent-deep)] dark:text-[color:var(--accent)]">
            Manual intake
          </div>
          <h2 className="mt-2 text-3xl font-bold text-zinc-950 dark:text-white">
            Register an item quickly
          </h2>
          <p className="mt-2 text-zinc-600 dark:text-white/65">
            Owner can register garments manually while still using live pricing-backed item selection.
          </p>

          <form action={createOrderItemAction} className="mt-6 grid gap-4">
            <input type="hidden" name="source_route" value="/owner/records" />

            <input
              name="booking_lookup"
              placeholder="Booking tracking code"
              className={inputCls}
              required
            />

            <div className="grid gap-4 md:grid-cols-2">
              <select name="pricing_id" className={inputCls}>
                <option value="">Select pricing item</option>
                {activePricing.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.category} — {row.item_name} ({formatMoney(row.price)}/{row.unit})
                  </option>
                ))}
              </select>

              <input
                name="garment_type"
                placeholder="Or enter manual garment type"
                className={inputCls}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <input
                name="service_type"
                placeholder="Service type override"
                className={inputCls}
              />
              <input
                name="brand"
                placeholder="Brand"
                className={inputCls}
              />
              <input
                name="color"
                placeholder="Color"
                className={inputCls}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <input
                name="quantity"
                type="number"
                min="1"
                defaultValue="1"
                className={inputCls}
              />

              <select name="treatment" defaultValue="standard" className={inputCls}>
                <option value="standard">Standard handling</option>
                <option value="stain">Stain treatment</option>
                <option value="deep_stain">Deep stain rescue</option>
                <option value="delicate">Delicate handling</option>
              </select>

              <label className="inline-flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-zinc-800 shadow-sm dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white/80">
                <input type="checkbox" name="urgent" className="accent-[color:var(--accent)]" />
                Mark as urgent
              </label>
            </div>

            <textarea
              name="notes"
              placeholder="Condition notes, stain notes, missing button, special handling..."
              className={textareaCls}
            />

            <PendingSubmitButton
              label="Register item"
              pendingLabel="Registering item"
              className="h-12 rounded-2xl px-5 text-[#07111F]"
            />
          </form>
        </div>

        <div className="rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <form className="grid gap-3 xl:grid-cols-[1.2fr_0.7fr_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-white/35" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Search by item tag, customer, garment, color, booking..."
                className="h-12 w-full rounded-2xl border border-black/10 bg-white pl-11 pr-4 text-sm font-medium text-zinc-900 shadow-sm outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
              />
            </div>

            <select
              name="scope"
              defaultValue={scope}
              className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
            >
              <option value="active">Active only</option>
              <option value="archive">Archive only</option>
              <option value="all">All records</option>
            </select>

            <label className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-zinc-800 shadow-sm dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white/80">
              <input
                type="checkbox"
                name="urgentOnly"
                value="1"
                defaultChecked={urgentOnly}
                className="accent-[color:var(--accent)]"
              />
              Urgent only
            </label>

            <button
              type="submit"
              className="h-12 rounded-2xl border border-black/10 bg-white px-5 text-sm font-semibold text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
            >
              Filter
            </button>
          </form>

          <div className="mt-4 rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
            {monthArchiveNote()}
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        {items.length > 0 ? (
          items.map((row) => (
            <article
              key={row.id}
              className="rounded-[34px] border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.06)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-sm font-bold text-[color:var(--accent-deep)] dark:text-[color:var(--accent-strong)]">
                  {row.item_tag}
                </span>
                {row.urgent ? (
                  <span className="rounded-full border border-red-300/30 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-red-700 dark:text-red-100">
                    urgent
                  </span>
                ) : null}
                <span className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                  {row.intake_status}
                </span>
                {row.line_total != null ? (
                  <span className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-100">
                    {formatMoney(row.line_total)}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Garment">{row.garment_type}</Field>
                <Field label="Booking">{row.booking?.tracking_code || row.booking_id}</Field>
                <Field label="Customer">{row.booking?.customer_name || "—"}</Field>
                <Field label="Qty">{String(row.quantity)}</Field>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3 xl:grid-cols-5">
                <Field label="Service">{row.service_type || "—"}</Field>
                <Field label="Color">{row.color || "—"}</Field>
                <Field label="Brand">{row.brand || "—"}</Field>
                <Field label="Unit price">{row.unit_price != null ? formatMoney(row.unit_price) : "—"}</Field>
                <Field label="Pickup">
                  {row.booking?.pickup_date || "—"} {row.booking?.pickup_slot ? `• ${row.booking.pickup_slot}` : ""}
                </Field>
              </div>

              {row.notes ? (
                <div className="mt-4 rounded-2xl border border-black/10 bg-black/[0.03] p-4 text-sm leading-relaxed text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/75">
                  {row.notes}
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <EmptyState text="No item records matched your current filter." />
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04]">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
        <Icon className="h-6 w-6 text-[color:var(--accent-deep)] dark:text-[color:var(--accent-strong)]" />
      </div>
      <div className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
        {label}
      </div>
      <div className="mt-2 text-4xl font-black text-zinc-950 dark:text-white">{value}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/45">
        <BadgeCheck className="h-4 w-4 text-[color:var(--accent-deep)] dark:text-[color:var(--accent-strong)]" />
        {label}
      </div>
      <div className="mt-2 text-sm text-zinc-800 dark:text-white/80">{children}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white/80 p-16 text-center text-zinc-500 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55">
      {text}
    </div>
  );
}

const inputCls =
  "h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white";

const textareaCls =
  "min-h-[110px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm outline-none dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white";
