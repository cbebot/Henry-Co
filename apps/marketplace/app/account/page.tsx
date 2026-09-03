import Link from "next/link";
import { DivisionImage } from "@henryco/dashboard-shell/components";
import { HeroCard, NextStepRow } from "@henryco/dashboard-shell/surfaces";
import { translateSurfaceLabel } from "@henryco/i18n";
import {
  ArrowRight,
  ArrowUpRight,
  Clock3,
  CreditCard,
  Navigation,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Store,
} from "lucide-react";
import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import { accountWorkspaceNav } from "@/lib/marketplace/navigation";
import {
  buildBuyerHero,
  buildBuyerNextStep,
  buyerDashboardStats,
  type BuyerDashboardInput,
  type BuyerNextStepModel,
} from "@/lib/marketplace/buyer-home";
import type {
  MarketplaceNotification,
  MarketplaceOrder,
  MarketplaceProduct,
  MarketplaceVendor,
} from "@/lib/marketplace/types";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

/* TODO(wave3-catalogue): paginate translation — buyer account dashboard
   surfaces previews from wishlist, follows, and notifications, each of which
   carry DB-driven titles/bodies. Translating every row per render would
   compound DeepL spend; defer to a focused wave with caching. */

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

/* Register-L status palette — theme-aware semantic tokens (defined in the
   .market-workspace-light scope). The -ink text clears WCAG AA against the
   matching -soft tint in both light and dark. */
const ORDER_STATUS_STYLES: Record<string, string> = {
  placed: "border-[color:var(--acct-orange)]/35 bg-[color:var(--acct-orange-soft)] text-[color:var(--acct-orange-ink)]",
  awaiting_payment: "border-[color:var(--acct-orange)]/35 bg-[color:var(--acct-orange-soft)] text-[color:var(--acct-orange-ink)]",
  paid_held: "border-[color:var(--acct-orange)]/35 bg-[color:var(--acct-orange-soft)] text-[color:var(--acct-orange-ink)]",
  payment_verified: "border-[color:var(--acct-blue)]/35 bg-[color:var(--acct-blue-soft)] text-[color:var(--acct-blue-ink)]",
  fulfillment_in_progress: "border-[color:var(--acct-blue)]/35 bg-[color:var(--acct-blue-soft)] text-[color:var(--acct-blue-ink)]",
  processing: "border-[color:var(--acct-blue)]/35 bg-[color:var(--acct-blue-soft)] text-[color:var(--acct-blue-ink)]",
  partially_shipped: "border-[color:var(--acct-blue)]/35 bg-[color:var(--acct-blue-soft)] text-[color:var(--acct-blue-ink)]",
  shipped: "border-[color:var(--acct-green)]/35 bg-[color:var(--acct-green-soft)] text-[color:var(--acct-green-ink)]",
  delivered: "border-[color:var(--acct-green)]/45 bg-[color:var(--acct-green-soft)] text-[color:var(--acct-green-ink)]",
  delivered_pending_confirmation: "border-[color:var(--acct-orange)]/35 bg-[color:var(--acct-orange-soft)] text-[color:var(--acct-orange-ink)]",
  refunded: "border-[color:var(--acct-red)]/35 bg-[color:var(--acct-red-soft)] text-[color:var(--acct-red-ink)]",
  cancelled: "border-[var(--hc-line)] bg-[color:var(--market-fill-faint)] text-[color:var(--hc-ink-muted)]",
};

function orderStatusLabel(status: MarketplaceOrder["status"]) {
  return status.replace(/_/g, " ");
}

function nextStepIcon(iconKey: BuyerNextStepModel["iconKey"]): ReactNode {
  const cls = "h-[18px] w-[18px]";
  if (iconKey === "confirm") return <PackageCheck className={cls} />;
  if (iconKey === "pay") return <CreditCard className={cls} />;
  if (iconKey === "seller") return <Store className={cls} />;
  return <Navigation className={cls} />;
}

export default async function AccountOverviewPage() {
  const locale = await getMarketplacePublicLocale();
  await requireMarketplaceUser("/account");
  const data = await getBuyerDashboardData();
  const t = (value: string) => translateSurfaceLabel(locale, value);

  const viewerName =
    data.viewer.user?.fullName?.trim() ||
    data.viewer.user?.email?.split("@")[0] ||
    t("Buyer");
  const firstName = viewerName.split(/\s+/)[0];

  const input: BuyerDashboardInput = {
    orders: data.orders,
    wishlist: data.wishlist,
    follows: data.follows,
    notifications: data.notifications,
    application: data.application,
  };
  const stats = buyerDashboardStats(input);
  const hero = buildBuyerHero(stats, t);
  const nextStep = buildBuyerNextStep(input, stats, t);

  const recentOrders = data.orders.slice(0, 3);
  const wishlistPreview = data.wishlist.slice(0, 4);
  const followsPreview = data.follows.slice(0, 3);
  const notificationsPreview = data.notifications.slice(0, 5);
  const unreadNotifications = stats.unread;

  return (
    <WorkspaceShell
      title={firstName}
      description={t(
        "Orders, saved pieces, store follows, and account activity — one calm record across every store.",
      )}
      {...accountWorkspaceNav("/account", locale)}
      hero={
        <HeroCard
          variant="paired"
          tone={hero.tone}
          eyebrow={hero.eyebrow}
          headline={hero.headline}
          blurb={hero.blurb}
          ariaLabel={hero.ariaLabel}
          ariaTilesLabel={hero.ariaTilesLabel}
          ctaPrimary={hero.ctaPrimary}
          ctaSecondary={hero.ctaSecondary}
          tiles={hero.tiles}
          side={hero.side}
        />
      }
    >
      {nextStep ? (
        <NextStepRow
          tone={nextStep.tone}
          kicker={nextStep.kicker}
          title={nextStep.title}
          detail={nextStep.detail}
          icon={nextStepIcon(nextStep.iconKey)}
          cta={nextStep.cta}
        />
      ) : null}

      {/* Recent orders — latest 3, with status pills + group fulfillment.
          When empty, an editorial empty state with a clear CTA. */}
      <section className="market-paper rounded-[1.9rem] p-6 sm:p-7">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="market-kicker">{t("Recent orders")}</p>
            <h2 className="mt-2 text-[1.4rem] font-semibold leading-tight tracking-tight text-[var(--hc-ink)] sm:text-[1.55rem]">
              {recentOrders.length > 0
                ? t("Latest activity from your purchases")
                : t("Your orders will live here")}
            </h2>
          </div>
          {data.orders.length > 0 ? (
            <Link
              href="/account/orders"
              className="inline-flex items-center gap-1.5 rounded-full text-sm font-semibold text-[var(--hc-ink)] underline-offset-4 transition hover:underline"
            >
              {t("View all")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>

        {recentOrders.length > 0 ? (
          <ul className="mt-6 divide-y divide-[var(--hc-line)] border-y border-[var(--hc-line)]">
            {recentOrders.map((order) => (
              <li key={order.id} className="py-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--hc-ink-muted)]">
                      {t("Order")} {order.orderNo}
                    </p>
                    <p className="acct-figure mt-1 text-[1.15rem] font-semibold tracking-tight text-[var(--hc-ink)]">
                      {formatCurrency(order.grandTotal, order.currency)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--hc-ink-muted)]">
                      {t("Placed")} {formatRelative(order.placedAt)}
                      {order.shippingCity ? ` · ${order.shippingCity}` : ""}
                      {order.groups.length > 0
                        ? ` · ${order.groups.length} ${t(order.groups.length === 1 ? "store" : "stores")}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                        ORDER_STATUS_STYLES[order.status] ||
                        "border-[var(--hc-line)] bg-[color:var(--market-fill-soft)] text-[var(--hc-ink)]"
                      }`}
                    >
                      <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
                      {orderStatusLabel(order.status)}
                    </span>
                    <Link
                      href={`/account/orders/${order.orderNo}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--hc-line)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--hc-ink)] transition outline-none hover:bg-[color:var(--market-fill-faint)] focus-visible:ring-2 focus-visible:ring-[var(--hc-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--hc-bg)]"
                    >
                      {t("View")}
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-6 border-l-2 border-[var(--hc-accent)]/55 pl-5">
            <p className="text-sm leading-7 text-[var(--hc-ink-muted)]">
              {t(
                "You haven't placed an order yet. Browse the marketplace to find verified stores and curated drops.",
              )}
            </p>
            <Link
              href="/search"
              className="market-button-primary mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--hc-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--hc-bg)] active:translate-y-[0.5px]"
            >
              {t("Browse marketplace")}
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
              <p className="market-kicker">{t("Saved items")}</p>
              <h3 className="mt-2 text-[1.2rem] font-semibold leading-tight tracking-tight text-[var(--hc-ink)] sm:text-[1.35rem]">
                {wishlistPreview.length > 0
                  ? t("Pieces you kept an eye on")
                  : t("Your wishlist is empty")}
              </h3>
            </div>
            {wishlistPreview.length > 0 ? (
              <Link
                href="/account/wishlist"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--hc-ink)] underline-offset-4 transition hover:underline"
              >
                {t("Open wishlist")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </div>
          {wishlistPreview.length > 0 ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {wishlistPreview.map((item) => (
                <SavedItemTile key={item.id} product={item} t={t} />
              ))}
            </div>
          ) : (
            <p className="mt-5 max-w-md text-sm leading-7 text-[var(--hc-ink-muted)]">
              {t(
                "Heart products you want to revisit. They'll wait for you in your account alongside your orders and follows.",
              )}
            </p>
          )}
        </article>

        <article className="market-paper rounded-[1.9rem] p-6 sm:p-7">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="market-kicker">{t("Following")}</p>
              <h3 className="mt-2 text-[1.2rem] font-semibold leading-tight tracking-tight text-[var(--hc-ink)] sm:text-[1.35rem]">
                {followsPreview.length > 0
                  ? t("Stores you watch")
                  : t("Follow stores to catch drops first")}
              </h3>
            </div>
            {followsPreview.length > 0 ? (
              <Link
                href="/account/following"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--hc-ink)] underline-offset-4 transition hover:underline"
              >
                {t("View all")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </div>
          {followsPreview.length > 0 ? (
            <ul className="mt-5 divide-y divide-[var(--hc-line)] border-y border-[var(--hc-line)]">
              {followsPreview.map((vendor) => (
                <li key={vendor.id} className="py-4">
                  <FollowedStoreRow vendor={vendor} t={t} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 max-w-md text-sm leading-7 text-[var(--hc-ink-muted)]">
              {t(
                "Tap the store name on a product page to follow. We'll surface their next drop here.",
              )}
            </p>
          )}
        </article>
      </section>

      {/* Recent activity — notifications + dispute / support signal */}
      <section className="market-paper rounded-[1.9rem] p-6 sm:p-7">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="market-kicker">{t("Recent activity")}</p>
            <h3 className="mt-2 text-[1.2rem] font-semibold leading-tight tracking-tight text-[var(--hc-ink)] sm:text-[1.35rem]">
              {notificationsPreview.length > 0
                ? t("Updates from your account")
                : t("Activity will land here")}
            </h3>
          </div>
          {data.notifications.length > 0 ? (
            <Link
              href="/account/notifications"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--hc-ink)] underline-offset-4 transition hover:underline"
            >
              {t("View all")}
              {unreadNotifications > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--hc-accent)] px-1.5 text-[10px] font-semibold text-[color:var(--hc-ink-on-accent)]">
                  {unreadNotifications}
                </span>
              ) : null}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>
        {notificationsPreview.length > 0 ? (
          <ul className="mt-5 divide-y divide-[var(--hc-line)] border-y border-[var(--hc-line)]">
            {notificationsPreview.map((item) => (
              <ActivityRow key={item.id} item={item} t={t} />
            ))}
          </ul>
        ) : (
          <p className="mt-5 text-sm leading-7 text-[var(--hc-ink-muted)]">
            {t("Order confirmations, dispatch updates, and store messages will appear here.")}
          </p>
        )}
      </section>
    </WorkspaceShell>
  );
}

function SavedItemTile({
  product,
  t,
}: {
  product: MarketplaceProduct;
  t: (value: string) => string;
}) {
  const imageSrc = product.gallery?.[0] || null;
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block overflow-hidden rounded-[1.4rem] border border-[var(--hc-line)] bg-[color:var(--market-fill-faint)] transition outline-none hover:border-[var(--hc-accent)]/45 focus-visible:ring-2 focus-visible:ring-[var(--hc-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--hc-bg)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[color:var(--market-fill-faint)]">
        {imageSrc ? (
          <DivisionImage
            src={imageSrc}
            alt={product.title}
            fill
            sizes="(max-width: 1024px) 50vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
            radius="0"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ShoppingBag className="h-6 w-6 text-[var(--hc-ink-muted)]" aria-label={t("No image")} />
          </div>
        )}
      </div>
      <div className="space-y-1 p-3">
        <p className="line-clamp-1 text-sm font-semibold tracking-tight text-[var(--hc-ink)]">
          {product.title}
        </p>
        <p className="acct-figure text-xs font-semibold text-[var(--hc-accent-text)]">
          {formatCurrency(product.basePrice, product.currency || "NGN")}
        </p>
      </div>
    </Link>
  );
}

function FollowedStoreRow({
  vendor,
  t,
}: {
  vendor: MarketplaceVendor;
  t: (value: string) => string;
}) {
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
      className="group flex items-center gap-4 transition outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-[var(--hc-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--hc-bg)]"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--hc-line)] bg-[color:var(--market-fill-soft)] text-xs font-semibold tracking-tight text-[var(--hc-ink)]">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold tracking-tight text-[var(--hc-ink)]">
          {vendor.name}
        </p>
        <p className="truncate text-xs text-[var(--hc-ink-muted)]">
          {vendor.verificationLevel ? `${vendor.verificationLevel} ${t("verified")}` : t("Verified vendor")}
          {vendor.responseSlaHours ? ` · ${vendor.responseSlaHours}h ${t("response")}` : ""}
        </p>
      </div>
      {vendor.trustScore ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--hc-line)] bg-[color:var(--market-fill-faint)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--hc-ink)]">
          <ShieldCheck className="h-3 w-3 text-[var(--hc-accent-text)]" />
          {vendor.trustScore}%
        </span>
      ) : null}
    </Link>
  );
}

function ActivityRow({
  item,
  t,
}: {
  item: MarketplaceNotification;
  t: (value: string) => string;
}) {
  const isUnread = !item.readAt;
  return (
    <li className="flex items-start gap-4 py-4">
      <span
        aria-hidden
        className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${
          isUnread ? "bg-[var(--hc-accent)]" : "bg-[var(--hc-line)]"
        }`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold tracking-tight text-[var(--hc-ink)]">
            {item.title}
          </p>
          {isUnread ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--hc-accent)]/45 bg-[var(--hc-accent)]/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--hc-accent-text)]">
              {t("New")}
            </span>
          ) : null}
        </div>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[var(--hc-ink-muted)]">
          {item.body}
        </p>
        <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--hc-ink-muted)]">
          <Clock3 className="h-3 w-3" />
          {formatRelative(item.createdAt)}
        </p>
      </div>
    </li>
  );
}
