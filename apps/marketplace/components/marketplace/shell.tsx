import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
} from "lucide-react";
import { MarketplaceCartDrawer } from "@/components/marketplace/cart-drawer";
import { getAccountUrl } from "@henryco/config";
import { ProductCardClient } from "@/components/marketplace/product-card-client";
import { PublicHeaderClient } from "@/components/marketplace/public-header-client";
import { MarketplaceToastStack } from "@/components/marketplace/toast-stack";
import { cn } from "@/lib/utils";
import type {
  MarketplaceCampaign,
  MarketplaceCollection,
  MarketplaceKpi,
  MarketplaceProduct,
  MarketplaceVendor,
} from "@/lib/marketplace/types";

export function PublicHeader(_props: {
  signedIn: boolean;
  signedInLabel?: string | null;
}) {
  void _props;
  return <PublicHeaderClient />;
}

export function PublicSurface({ children }: { children: React.ReactNode }) {
  return (
    <div className="market-page">
      <PublicHeader signedIn={false} />
      <main>{children}</main>
      <PublicFooter />
      <MarketplaceCartDrawer />
      <MarketplaceToastStack />
    </div>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-20 border-t border-[var(--market-line)] bg-[rgba(2,4,10,0.84)] text-[var(--market-paper-white)] backdrop-blur-2xl">
      <div className="mx-auto max-w-[1480px] px-4 py-14 sm:px-6 xl:px-8">
        <div className="market-panel relative overflow-hidden rounded-[2.4rem] px-6 py-8 sm:px-8 sm:py-10">
          <div className="absolute inset-y-0 right-0 hidden w-[34%] bg-[radial-gradient(circle_at_center,rgba(154,174,164,0.18),transparent_64%)] lg:block" />
          <div className="relative grid gap-10 xl:grid-cols-[1.2fr,0.8fr,0.8fr,0.8fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-2">
                <Sparkles className="h-4 w-4 text-[var(--market-brass)]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--market-brass)]">
                  HenryCo Marketplace
                </span>
              </div>
              <div className="space-y-4">
                <p className="max-w-3xl font-[family:var(--font-marketplace-display)] text-[2.8rem] leading-[1.02] tracking-[-0.05em] text-[var(--market-paper-white)] sm:text-[3.4rem]">
                  Dark-glass commerce with cleaner trust, calmer hierarchy, and sharper post-order care.
                </p>
                <p className="max-w-2xl text-sm leading-7 text-[var(--market-muted)]">
                  HenryCo Marketplace is built for high-trust buying, verified sellers, and a cleaner
                  experience from checkout to delivery.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/search"
                  className="market-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                >
                  Explore the catalog <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={getAccountUrl("/marketplace")}
                  className="market-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                >
                  Open HenryCo account <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <FooterColumn
              title="Shop"
              links={[
                { href: "/search", label: "Search the marketplace" },
                { href: "/deals", label: "Deals and timed edits" },
                { href: "/trust", label: "Trust passport" },
                { href: "/policies/buyer-protection", label: "Buyer protection policy" },
                { href: "/help", label: "Support and resolution" },
              ]}
            />

            <FooterColumn
              title="Sell"
              links={[
                { href: "/sell", label: "Why sell on HenryCo" },
                { href: "/sell/pricing", label: "Seller pricing and fees" },
                { href: "/policies/seller-policy", label: "Seller policy" },
                { href: "/account/seller-application", label: "Seller application" },
                { href: "/vendor", label: "Vendor workspace" },
                { href: getAccountUrl("/marketplace"), label: "HenryCo account", external: true },
              ]}
            />

            <div className="space-y-4 text-sm text-[var(--market-muted)]">
              <p className="font-semibold uppercase tracking-[0.18em] text-[var(--market-paper-white)]">
                Support
              </p>
              <p>marketplace@henrycogroup.com</p>
              <p>+234 913 395 7084</p>
              <p>marketplace.henrycogroup.com</p>
              <div className="rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-4 text-sm leading-7">
                Orders, seller conversations, support updates, and payment records stay connected in
                one HenryCo account.
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string; external?: boolean }>;
}) {
  return (
    <div className="space-y-4 text-sm text-[var(--market-muted)]">
      <p className="font-semibold uppercase tracking-[0.18em] text-[var(--market-paper-white)]">{title}</p>
      <div className="grid gap-3">
        {links.map((item) => (
          <Link
            key={`${title}-${item.href}-${item.label}`}
            href={item.href}
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noreferrer" : undefined}
            className="inline-flex items-center gap-2 transition hover:text-[var(--market-paper-white)]"
          >
            {item.label}
            {item.external ? <ArrowUpRight className="h-3.5 w-3.5" /> : null}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function PageIntro({
  kicker,
  title,
  description,
  actions,
}: {
  kicker: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className="market-panel relative overflow-hidden rounded-[2.35rem] p-6 sm:p-8 lg:p-10">
      <div className="absolute inset-y-0 right-0 hidden w-[32%] bg-[radial-gradient(circle_at_center,rgba(154,174,164,0.15),transparent_68%)] lg:block" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl space-y-4">
          <p className="market-kicker">{kicker}</p>
          <h1 className="market-heading max-w-4xl text-[var(--market-paper-white)]">{title}</h1>
          <p className="max-w-3xl text-base leading-8 text-[var(--market-muted)]">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}

export function KpiGrid({ items }: { items: MarketplaceKpi[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <article key={item.label} className="market-soft rounded-[1.7rem] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--market-muted)]">
            {item.label}
          </p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-[var(--market-paper-white)]">
            {item.value}
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{item.hint}</p>
        </article>
      ))}
    </div>
  );
}

export function ProductCard({ product }: { product: MarketplaceProduct }) {
  return <ProductCardClient product={product} />;
}

export function VendorCard({ vendor }: { vendor: MarketplaceVendor }) {
  const imageSrc =
    vendor.heroImage ||
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80";

  return (
    <article className="market-paper overflow-hidden rounded-[1.95rem]">
      <div className="relative h-52 overflow-hidden">
        <Image
          src={imageSrc}
          alt={vendor.name}
          fill
          sizes="(max-width: 1024px) 100vw, 33vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(4,7,13,0.84)] via-[rgba(4,7,13,0.26)] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <div className="flex flex-wrap gap-2">
            {vendor.badges.slice(0, 3).map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.08)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-paper-white)]"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-5 p-5">
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold tracking-tight text-[var(--market-paper-white)]">
            {vendor.name}
          </h3>
          <p className="text-sm leading-7 text-[var(--market-muted)]">{vendor.description}</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <TrustStat label="Trust" value={`${vendor.trustScore}%`} />
          <TrustStat label="SLA" value={`${vendor.responseSlaHours}h`} />
          <TrustStat label="Reviews" value={vendor.reviewScore.toFixed(1)} />
        </div>
        <Link
          href={`/store/${vendor.slug}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--market-brass)]"
        >
          Visit store <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function TrustStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.3rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--market-muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--market-paper-white)]">{value}</p>
    </div>
  );
}

export function CollectionCard({ collection }: { collection: MarketplaceCollection }) {
  return (
    <article className="market-panel rounded-[1.95rem] p-6">
      <p className="market-kicker">{collection.kicker}</p>
      <h3 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--market-paper-white)]">
        {collection.title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{collection.description}</p>
      <p className="mt-5 text-sm font-medium text-[var(--market-paper-white)]">{collection.highlight}</p>
      <Link
        href={`/collections/${collection.slug}`}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--market-brass)]"
      >
        Explore collection <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

export function CampaignBanner({ campaign }: { campaign: MarketplaceCampaign }) {
  return (
    <article className="market-panel relative overflow-hidden rounded-[2.15rem] p-6 sm:p-8">
      <div className="absolute inset-y-0 right-0 w-[36%] bg-[radial-gradient(circle_at_center,rgba(221,182,120,0.18),transparent_68%)]" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <p className="market-kicker">{campaign.surface}</p>
          <h2 className="text-4xl font-semibold tracking-tight text-[var(--market-paper-white)]">
            {campaign.title}
          </h2>
          <p className="max-w-2xl text-base leading-8 text-[var(--market-muted)]">
            {campaign.description}
          </p>
          {campaign.countdown ? (
            <p className="text-sm font-semibold text-[var(--market-alert)]">{campaign.countdown}</p>
          ) : null}
        </div>
        <Link
          href={campaign.ctaHref}
          className="market-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
        >
          {campaign.ctaLabel} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

export function TrustPassport({ vendor }: { vendor: MarketplaceVendor }) {
  const passport = vendor.trustPassport;
  const signalCards =
    passport?.signals.slice(0, 4) || [
      {
        id: "verification",
        label: "Verification",
        value: vendor.verificationLevel,
      },
      {
        id: "fulfillment",
        label: "Fulfillment",
        value: `${vendor.fulfillmentRate}%`,
      },
      {
        id: "dispute",
        label: "Dispute rate",
        value: `${vendor.disputeRate}%`,
      },
      {
        id: "sla",
        label: "Response SLA",
        value: `${vendor.responseSlaHours}h`,
      },
    ];

  return (
    <section className="market-paper rounded-[2rem] p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-[var(--market-brass)]" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
              Trust Passport
            </p>
            {passport ? (
              <p className="mt-1 text-sm leading-7 text-[var(--market-muted)]">{passport.summary}</p>
            ) : null}
          </div>
        </div>
        {passport ? (
          <div className="rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-right">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--market-muted)]">Trust posture</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--market-paper-white)]">{passport.score}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--market-brass)]">{passport.label}</p>
          </div>
        ) : null}
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {signalCards.map((signal, index) => (
          <TrustPassportCard
            key={signal.id}
            icon={
              index === 0 ? <CheckCircle2 className="h-5 w-5" /> : index === 1 ? <Truck className="h-5 w-5" /> : index === 2 ? <Store className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />
            }
            label={signal.label}
            value={signal.value}
            detail={"detail" in signal ? signal.detail : undefined}
          />
        ))}
      </div>
      {passport?.suspiciousFlags.length ? (
        <div className="mt-5 rounded-[1.5rem] border border-[rgba(255,171,151,0.26)] bg-[rgba(126,33,18,0.08)] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--market-alert)]">
            Operator watch
          </p>
          <div className="mt-3 space-y-2 text-sm leading-7 text-[var(--market-muted)]">
            {passport.suspiciousFlags.map((flag) => (
              <p key={flag}>{flag}</p>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function TrustPassportCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] p-4">
      <div className="flex items-center gap-3 text-[var(--market-brass)]">{icon}</div>
      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold capitalize text-[var(--market-paper-white)]">{value}</p>
      {detail ? <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">{detail}</p> : null}
    </div>
  );
}

export function WorkspaceShell({
  title,
  description,
  nav,
  actions,
  children,
}: {
  title: string;
  description: string;
  nav: Array<{ href: string; label: string; active?: boolean }>;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid max-w-[1480px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[300px,1fr] xl:px-8">
      <aside className="market-panel rounded-[2.1rem] p-4">
        <p className="market-kicker">Workspace</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--market-paper-white)]">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{description}</p>
        <nav className="mt-6 space-y-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-[1.25rem] px-4 py-3 text-sm font-semibold transition",
                item.active
                  ? "bg-[linear-gradient(135deg,rgba(246,240,222,0.14),rgba(117,209,255,0.1))] text-[var(--market-paper-white)]"
                  : "bg-[rgba(255,255,255,0.04)] text-[var(--market-muted)] hover:text-[var(--market-paper-white)]"
              )}
            >
              <span>{item.label}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          ))}
        </nav>
      </aside>
      <main className="space-y-6">
        <section className="market-panel rounded-[2.1rem] p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="market-kicker">Operator Surface</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--market-paper-white)]">
                {title}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--market-muted)]">
                {description}
              </p>
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        </section>
        {children}
      </main>
      <MarketplaceToastStack />
    </div>
  );
}

export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="market-paper rounded-[1.6rem] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
        {label}
      </p>
      <p className="mt-3 text-4xl font-semibold tracking-tight text-[var(--market-paper-white)]">{value}</p>
      <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{hint}</p>
    </article>
  );
}

export function EmptyState({
  title,
  body,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  body: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <section className="market-soft rounded-[1.85rem] p-8 text-center">
      <p className="text-2xl font-semibold tracking-tight text-[var(--market-paper-white)]">{title}</p>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[var(--market-muted)]">{body}</p>
      {ctaHref && ctaLabel ? (
        <Link
          href={ctaHref}
          className="market-button-primary mt-5 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </section>
  );
}
