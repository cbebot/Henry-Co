import Link from "next/link";
import { Bookmark, Clock, ShoppingBag, Sparkles } from "lucide-react";
import type { SavedItemRecord, SavedItemSnapshotCore, SavedItemDivision } from "@henryco/cart-saved-items";
import { formatNaira } from "@/lib/format";

const DIVISION_LABEL: Record<SavedItemDivision, string> = {
  marketplace: "Marketplace",
  care: "Care",
  learn: "Academy",
  logistics: "Logistics",
  property: "Property",
  jobs: "Jobs",
  studio: "Studio",
  account: "Account",
};

const DIVISION_HOME: Record<SavedItemDivision, string> = {
  marketplace: "https://marketplace.henrycogroup.com",
  care: "https://care.henrycogroup.com",
  learn: "https://learn.henrycogroup.com",
  logistics: "https://logistics.henrycogroup.com",
  property: "https://property.henrycogroup.com",
  jobs: "https://jobs.henrycogroup.com",
  studio: "https://studio.henrycogroup.com",
  account: "/",
};

type RecentlyViewedRow = {
  division: string;
  item_type: string;
  item_id: string;
  title: string | null;
  href: string | null;
  image_url: string | null;
  last_viewed_at: string;
};

type CartRecoveryRow = {
  last_division: string | null;
  last_surface: string | null;
  last_item_count: number | null;
  last_subtotal_kobo: number | null;
  last_visited_at: string | null;
} | null;

export function WelcomeBackSurface({
  savedItems,
  recentlyViewed,
  cartRecovery,
  firstName,
}: {
  savedItems: SavedItemRecord[];
  recentlyViewed: RecentlyViewedRow[];
  cartRecovery: CartRecoveryRow;
  firstName: string | null;
}) {
  const hasSomething =
    savedItems.length > 0 ||
    recentlyViewed.length > 0 ||
    (cartRecovery && (cartRecovery.last_item_count ?? 0) > 0);

  if (!hasSomething) return null;

  const renderedAt = new Date();
  const expiringSoon = savedItems
    .map((item) => ({
      item,
      daysToExpire: Math.round(
        (new Date(item.expiresAt).getTime() - renderedAt.getTime()) / 86_400_000
      ),
    }))
    .filter(({ daysToExpire }) => daysToExpire <= 14)
    .slice(0, 3);

  const cartResumeAvailable =
    cartRecovery &&
    (cartRecovery.last_item_count ?? 0) > 0 &&
    cartRecovery.last_division &&
    cartRecovery.last_surface;

  return (
    <section className="acct-card relative overflow-hidden p-5 sm:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-gradient-to-b from-[var(--acct-gold-soft)] to-transparent opacity-60"
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="acct-kicker">Welcome back</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--acct-ink)]">
            {firstName ? `Pick up where you left off, ${firstName}.` : "Pick up where you left off."}
          </h2>
          <p className="mt-1 text-xs text-[var(--acct-muted)]">
            Saved items, recent finds, and an unfinished basket — all kept for you across every device.
          </p>
        </div>
        <Link
          href="/saved-items"
          className="inline-flex items-center gap-1 self-start rounded-full bg-[var(--acct-ink)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--acct-bg)] hover:opacity-90"
        >
          <Bookmark size={12} />
          Saved items
        </Link>
      </div>

      <div className="relative mt-5 grid gap-3 lg:grid-cols-3">
        {/* Cart resume */}
        {cartResumeAvailable ? (
          <Link
            href={
              cartRecovery!.last_surface!.startsWith("http")
                ? cartRecovery!.last_surface!
                : `${DIVISION_HOME[(cartRecovery!.last_division as SavedItemDivision) ?? "marketplace"]}${cartRecovery!.last_surface}`
            }
            className="group flex flex-col gap-3 rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-4 transition hover:border-[var(--acct-gold)]/40"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--acct-gold-soft)] text-[var(--acct-gold)]">
                <ShoppingBag size={16} />
              </span>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[var(--acct-muted)]">
                Resume basket
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--acct-ink)]">
                {DIVISION_LABEL[(cartRecovery!.last_division as SavedItemDivision) ?? "marketplace"]}
                {" "}— {cartRecovery!.last_item_count} item
                {cartRecovery!.last_item_count === 1 ? "" : "s"} waiting
              </p>
              {cartRecovery!.last_subtotal_kobo ? (
                <p className="mt-1 text-xs text-[var(--acct-muted)]">
                  Subtotal {formatNaira(cartRecovery!.last_subtotal_kobo)}
                </p>
              ) : null}
            </div>
            <p className="text-xs font-semibold text-[var(--acct-gold)]">Continue checkout →</p>
          </Link>
        ) : null}

        {/* Saved expiring */}
        {expiringSoon.length > 0 ? (
          <Link
            href="/saved-items"
            className="group flex flex-col gap-3 rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-4 transition hover:border-[var(--acct-gold)]/40"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--acct-gold-soft)] text-[var(--acct-gold)]">
                <Clock size={16} />
              </span>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[var(--acct-muted)]">
                Saved · expiring soon
              </p>
            </div>
            <ul className="space-y-2">
              {expiringSoon.map(({ item, daysToExpire }) => {
                const snap = item.itemSnapshot as SavedItemSnapshotCore;
                const days = Math.max(0, daysToExpire);
                return (
                  <li key={item.id} className="flex items-center gap-2 text-xs">
                    <span className="block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--acct-gold)]" />
                    <span className="truncate text-[var(--acct-ink)]">{snap?.title || item.itemType}</span>
                    <span className="ml-auto shrink-0 text-[var(--acct-muted)]">
                      {days <= 1 ? "today" : `${days}d`}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="text-xs font-semibold text-[var(--acct-gold)]">Open saved items →</p>
          </Link>
        ) : null}

        {/* Recently viewed */}
        {recentlyViewed.length > 0 ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--acct-gold-soft)] text-[var(--acct-gold)]">
                <Sparkles size={16} />
              </span>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[var(--acct-muted)]">
                Recently viewed
              </p>
            </div>
            <ul className="space-y-2">
              {recentlyViewed.slice(0, 3).map((item) => (
                <li key={`${item.division}:${item.item_id}`} className="flex items-center gap-2 text-xs">
                  <span className="block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--acct-muted)]" />
                  <Link
                    href={
                      item.href
                        ? item.href.startsWith("http")
                          ? item.href
                          : `${DIVISION_HOME[item.division as SavedItemDivision] || ""}${item.href}`
                        : DIVISION_HOME[item.division as SavedItemDivision] || "/"
                    }
                    className="truncate text-[var(--acct-ink)] hover:text-[var(--acct-gold)]"
                  >
                    {item.title || `${item.item_type} #${item.item_id.slice(0, 6)}`}
                  </Link>
                  <span className="ml-auto shrink-0 text-[var(--acct-muted)]">
                    {DIVISION_LABEL[item.division as SavedItemDivision] || item.division}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
