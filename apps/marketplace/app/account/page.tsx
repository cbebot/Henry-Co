import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Clock3,
  Heart,
  Package,
  PackageCheck,
  PackageOpen,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
} from "lucide-react";
import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import { accountNav } from "@/lib/marketplace/navigation";
import type {
  MarketplaceNotification,
  MarketplaceOrder,
  MarketplaceProduct,
  MarketplaceVendor,
} from "@/lib/marketplace/types";

export const dynamic = "force-dynamic";

const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number, currency: string) {
  if (currency === "NGN") return nairaFormatter.format(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatRelative(iso: string) {
  if (!iso) return "";
  const created = new Date(iso).getTime();
  if (Number.isNaN(created)) return "";
  const diff = Date.now() - created;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

const ORDER_STATUS_STYLES: Record<string, string> = {
  placed: "border-amber-500/35 bg-amber-500/12 text-amber-200",
  awaiting_payment: "border-amber-500/35 bg-amber-500/12 text-amber-200",
  paid_held: "border-amber-500/35 bg-amber-500/12 text-amber-200",
  payment_verified: "border-sky-500/35 bg-sky-500/12 text-sky-200",
  fulfillment_in_progress: "border-sky-500/35 bg-sky-500/12 text-sky-200",
  processing: "border-sky-500/35 bg-sky-500/12 text-sky-200",
  partially_shipped: "border-sky-500/35 bg-sky-500/12 text-sky-200",
  shipped: "border-emerald-500/35 bg-emerald-500/12 text-emerald-200",
  delivered: "border-emerald-500/45 bg-emerald-500/15 text-emerald-100",
  delivered_pending_confirmation: "border-emerald-500/35 bg-emerald-500/10 text-emerald-200",
  refunded: "border-rose-500/35 bg-rose-500/12 text-rose-200",
  cancelled: "border-zinc-500/35 bg-zinc-500/15 text-zinc-300",
};

const ACTIVE_ORDER_STATUSES: ReadonlyArray<MarketplaceOrder["status"]> = [
  "placed",
  "awaiting_payment",
  "paid_held",
  "payment_verified",
  "fulfillment_in_progress",
  "processing",
  "partially_shipped",
  "shipped",
];
const IN_TRANSIT_STATUSES: ReadonlyArray<MarketplaceOrder["status"]> = [
  "shipped",
  "partially_shipped",
];

function orderStatusLabel(status: MarketplaceOrder["status"]) {
  return status.replace(/_/g, " ");
}

export default async function AccountOverviewPage() {
  await requireMarketplaceUser("/account");
  const data = await getBuyerDashboardData();
  const viewerName =
    data.viewer.user?.fullName?.trim() ||
    data.viewer.user?.email?.split("@")[0] ||
    "Buyer";
  const firstName = viewerName.split(/\s+/)[0];

  const activeStatusSet = new Set<MarketplaceOrder["status"]>(ACTIVE_ORDER_STATUSES);
  const inTransitSet = new Set<MarketplaceOrder["status"]>(IN_TRANSIT_STATUSES);
  const activeOrders = data.orders.filter((order) => activeStatusSet.has(order.status));
  const inTransit = data.orders.filter((order) => inTransitSet.has(order.status)).length;
  const savedCount = data.wishlist.length;
  const followingCount = data.follows.length;
  const recentOrders = data.orders.slice(0, 3);
  const wishlistPreview = data.wishlist.slice(0, 4);
  const followsPreview = data.follows.slice(0, 3);
  const notificationsPreview = data.notifications.slice(0, 5);
  const unreadNotifications = data.notifications.filter((item) => !item.readAt).length;

  return (
    <WorkspaceShell
      title={`Welcome back, ${firstName}`}
      description="Your orders, saved items, store follows, and account activity in one calmer view. HenryCo unifies these signals across divisions so the trail stays attached to the same account."
      nav={accountNav("/account")}
      actions={
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/track"
            className="market-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--market-brass)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#04070d] active:translate-y-[0.5px]"
          >
            <Search className="h-4 w-4" />
            Track an order
          </Link>
          <Link
            href="/search"
            className="market-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--market-brass)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#04070d] active:translate-y-[0.5px]"
          >
            Continue shopping
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      }
    >
      {/* KPI rail — four operating signals from the buyer's account. */}
      <section
        aria-label="Account snapshot"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <KpiCard
          icon={Package}
          label="Active orders"
          value={String(activeOrders.length)}
          hint={
            activeOrders.length > 0
              ? `${activeOrders.length} order${activeOrders.length === 1 ? "" : "s"} still in motion.`
              : "No orders in motion right now."
          }
        />
        <KpiCard
          icon={PackageCheck}
          label="In transit"
          value={String(inTransit)}
          hint={
            inTransit > 0
              ? "Tracked through dispatch and delivery."
              : "Once an order ships, it lands here."
          }
        />
        <KpiCard
          icon={Heart}
          label="Saved items"
          value={String(savedCount)}
          hint={savedCount > 0 ? "Pieces you've kept an eye on." : "Heart anything to start a wishlist."}
        />
        <KpiCard
          icon={Store}
          label="Following"
          value={String(followingCount)}
          hint={
            followingCount > 0
              ? `${followingCount} store${followingCount === 1 ? "" : "s"} you follow for drops.`
              : "Follow stores to catch new drops first."
          }
        />
      </section>

      {/* Quick actions — explicit next steps that recur for buyers. */}
      <section
        aria-label="Quick actions"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <QuickActionCard
          href="/track"
          icon={Search}
          eyebrow="Track"
          title="Track an order"
          body="Look up an order by its reference code."
        />
        <QuickActionCard
          href="/account/wishlist"
          icon={Heart}
          eyebrow="Saved"
          title="Open wishlist"
          body="Pieces you saved, ready to revisit."
        />
        <QuickActionCard
          href="/account/addresses"
          icon={PackageOpen}
          eyebrow="Profile"
          title="Manage addresses"
          body="Default delivery and saved locations."
        />
        <QuickActionCard
          href={data.application ? "/account/seller-application/review" : "/account/seller-application/start"}
          icon={Sparkles}
          eyebrow={data.application ? "Application" : "Become a seller"}
          title={data.application ? "Continue your seller application" : "Apply to sell on HenryCo"}
          body={
            data.application
              ? `Status: ${data.application.status.replace(/_/g, " ")}.`
              : "Reach buyers across the HenryCo ecosystem."
          }
        />
      </section>

      {/* Active orders — latest 3, with status pills + group fulfillment.
          When empty, an editorial empty state with a clear CTA. */}
      <section className="market-paper rounded-[1.9rem] p-6 sm:p-7">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="market-kicker">Recent orders</p>
            <h2 className="mt-2 text-[1.4rem] font-semibold leading-tight tracking-tight text-[var(--market-paper-white)] sm:text-[1.55rem]">
              {recentOrders.length > 0
                ? "Latest activity from your purchases"
                : "Your orders will live here"}
            </h2>
          </div>
          {data.orders.length > 0 ? (
            <Link
              href="/account/orders"
              className="inline-flex items-center gap-1.5 rounded-full text-sm font-semibold text-[var(--market-paper-white)] underline-offset-4 transition hover:underline"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>

        {recentOrders.length > 0 ? (
          <ul className="mt-6 divide-y divide-[var(--market-line)] border-y border-[var(--market-line)]">
            {recentOrders.map((order) => (
              <li key={order.id} className="py-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                      Order {order.orderNo}
                    </p>
                    <p className="mt-1 text-[1.05rem] font-semibold tracking-tight text-[var(--market-paper-white)]">
                      {formatCurrency(order.grandTotal, order.currency)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--market-muted)]">
                      Placed {formatRelative(order.placedAt)}
                      {order.shippingCity ? ` · ${order.shippingCity}` : ""}
                      {order.groups.length > 0 ? ` · ${order.groups.length} store${order.groups.length === 1 ? "" : "s"}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                        ORDER_STATUS_STYLES[order.status] ||
                        "border-[var(--market-line)] bg-[rgba(255,255,255,0.05)] text-[var(--market-paper-white)]"
                      }`}
                    >
                      <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
                      {orderStatusLabel(order.status)}
                    </span>
                    <Link
                      href={`/account/orders/${order.orderNo}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--market-line)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--market-paper-white)] transition outline-none hover:bg-[rgba(255,255,255,0.04)] focus-visible:ring-2 focus-visible:ring-[var(--market-brass)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#04070d]"
                    >
                      View
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-6 border-l-2 border-[var(--market-brass)]/55 pl-5">
            <p className="text-sm leading-7 text-[var(--market-muted)]">
              You haven&rsquo;t placed an order yet. Browse the marketplace to find verified
              stores and curated drops.
            </p>
            <Link
              href="/search"
              className="market-button-primary mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--market-brass)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#04070d] active:translate-y-[0.5px]"
            >
              Browse marketplace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      {/* Saved items + Following stores — quick recall of taste and merchants. */}
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="market-paper rounded-[1.9rem] p-6 sm:p-7">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="market-kicker">Saved items</p>
              <h3 className="mt-2 text-[1.2rem] font-semibold leading-tight tracking-tight text-[var(--market-paper-white)] sm:text-[1.35rem]">
                {wishlistPreview.length > 0
                  ? "Pieces you kept an eye on"
                  : "Your wishlist is empty"}
              </h3>
            </div>
            {wishlistPreview.length > 0 ? (
              <Link
                href="/account/wishlist"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--market-paper-white)] underline-offset-4 transition hover:underline"
              >
                Open wishlist
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </div>
          {wishlistPreview.length > 0 ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {wishlistPreview.map((item) => (
                <SavedItemTile key={item.id} product={item} />
              ))}
            </div>
          ) : (
            <p className="mt-5 max-w-md text-sm leading-7 text-[var(--market-muted)]">
              Heart products you want to revisit. They&rsquo;ll wait for you in your account
              alongside your orders and follows.
            </p>
          )}
        </article>

        <article className="market-paper rounded-[1.9rem] p-6 sm:p-7">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="market-kicker">Following</p>
              <h3 className="mt-2 text-[1.2rem] font-semibold leading-tight tracking-tight text-[var(--market-paper-white)] sm:text-[1.35rem]">
                {followsPreview.length > 0
                  ? "Stores you watch"
                  : "Follow stores to catch drops first"}
              </h3>
            </div>
            {followsPreview.length > 0 ? (
              <Link
                href="/account/following"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--market-paper-white)] underline-offset-4 transition hover:underline"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </div>
          {followsPreview.length > 0 ? (
            <ul className="mt-5 divide-y divide-[var(--market-line)] border-y border-[var(--market-line)]">
              {followsPreview.map((vendor) => (
                <li key={vendor.id} className="py-4">
                  <FollowedStoreRow vendor={vendor} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 max-w-md text-sm leading-7 text-[var(--market-muted)]">
              Tap the store name on a product page to follow. We&rsquo;ll surface their next drop
              here.
            </p>
          )}
        </article>
      </section>

      {/* Recent activity — notifications + dispute / support signal */}
      <section className="market-paper rounded-[1.9rem] p-6 sm:p-7">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="market-kicker">Recent activity</p>
            <h3 className="mt-2 text-[1.2rem] font-semibold leading-tight tracking-tight text-[var(--market-paper-white)] sm:text-[1.35rem]">
              {notificationsPreview.length > 0
                ? "Updates from your account"
                : "Activity will land here"}
            </h3>
          </div>
          {data.notifications.length > 0 ? (
            <Link
              href="/account/notifications"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--market-paper-white)] underline-offset-4 transition hover:underline"
            >
              View all
              {unreadNotifications > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--market-brass)] px-1.5 text-[10px] font-semibold text-[var(--market-noir)]">
                  {unreadNotifications}
                </span>
              ) : null}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>
        {notificationsPreview.length > 0 ? (
          <ul className="mt-5 divide-y divide-[var(--market-line)] border-y border-[var(--market-line)]">
            {notificationsPreview.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </ul>
        ) : (
          <p className="mt-5 text-sm leading-7 text-[var(--market-muted)]">
            Order confirmations, dispatch updates, and store messages will appear here.
          </p>
        )}
      </section>
    </WorkspaceShell>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Package;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="market-paper rounded-[1.6rem] p-5">
      <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.24em] text-[var(--market-muted)]">
        <Icon className="h-3.5 w-3.5 text-[var(--market-brass)]" />
        {label}
      </div>
      <p className="mt-3 text-[1.85rem] font-semibold leading-tight tracking-tight text-[var(--market-paper-white)] sm:text-[2.1rem]">
        {value}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--market-muted)]">{hint}</p>
    </article>
  );
}

function QuickActionCard({
  href,
  icon: Icon,
  eyebrow,
  title,
  body,
}: {
  href: string;
  icon: typeof Search;
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col justify-between rounded-[1.6rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.03)] p-5 transition outline-none hover:border-[var(--market-brass)]/40 hover:bg-[rgba(255,255,255,0.05)] focus-visible:ring-2 focus-visible:ring-[var(--market-brass)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#04070d] active:translate-y-[0.5px]"
    >
      <div>
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--market-brass)]">
          <Icon className="h-3.5 w-3.5" />
          {eyebrow}
        </div>
        <p className="mt-3 text-[1rem] font-semibold leading-snug tracking-tight text-[var(--market-paper-white)]">
          {title}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--market-muted)]">{body}</p>
      </div>
      <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--market-paper-white)] opacity-75 transition group-hover:opacity-100">
        Open
        <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function SavedItemTile({ product }: { product: MarketplaceProduct }) {
  const imageSrc = product.gallery?.[0] || null;
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block overflow-hidden rounded-[1.4rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] transition outline-none hover:border-[var(--market-brass)]/45 focus-visible:ring-2 focus-visible:ring-[var(--market-brass)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#04070d]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[rgba(0,0,0,0.2)]">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={product.title}
            fill
            sizes="(max-width: 1024px) 50vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ShoppingBag className="h-6 w-6 text-[var(--market-muted)]" />
          </div>
        )}
      </div>
      <div className="space-y-1 p-3">
        <p className="line-clamp-1 text-sm font-semibold tracking-tight text-[var(--market-paper-white)]">
          {product.title}
        </p>
        <p className="text-xs font-semibold text-[var(--market-brass)]">
          {formatCurrency(product.basePrice, product.currency || "NGN")}
        </p>
      </div>
    </Link>
  );
}

function FollowedStoreRow({ vendor }: { vendor: MarketplaceVendor }) {
  const initials = vendor.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0])
    .join("")
    .toUpperCase();
  return (
    <Link
      href={`/store/${vendor.slug}`}
      className="group flex items-center gap-4 transition outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-[var(--market-brass)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#04070d]"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--market-line)] bg-[rgba(255,255,255,0.05)] text-xs font-bold tracking-tight text-[var(--market-paper-white)]">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold tracking-tight text-[var(--market-paper-white)]">
          {vendor.name}
        </p>
        <p className="truncate text-xs text-[var(--market-muted)]">
          {vendor.verificationLevel ? `${vendor.verificationLevel} verified` : "Verified vendor"}
          {vendor.responseSlaHours ? ` · ${vendor.responseSlaHours}h response` : ""}
        </p>
      </div>
      {vendor.trustScore ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--market-paper-white)]">
          <ShieldCheck className="h-3 w-3 text-[var(--market-brass)]" />
          {vendor.trustScore}%
        </span>
      ) : null}
    </Link>
  );
}

function ActivityRow({ item }: { item: MarketplaceNotification }) {
  const isUnread = !item.readAt;
  return (
    <li className="flex items-start gap-4 py-4">
      <span
        aria-hidden
        className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${
          isUnread ? "bg-[var(--market-brass)]" : "bg-[var(--market-line)]"
        }`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold tracking-tight text-[var(--market-paper-white)]">
            {item.title}
          </p>
          {isUnread ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--market-brass)]/45 bg-[var(--market-brass)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-brass)]">
              New
            </span>
          ) : null}
        </div>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[var(--market-muted)]">
          {item.body}
        </p>
        <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
          <Clock3 className="h-3 w-3" />
          {formatRelative(item.createdAt)}
        </p>
      </div>
    </li>
  );
}
