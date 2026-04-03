import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
} from "lucide-react";
import { ProductCardClient } from "@/components/marketplace/product-card-client";
import { PublicHeaderClient } from "@/components/marketplace/public-header-client";
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

export function PublicFooter() {
  return (
    <footer className="mt-16 border-t border-[color:rgba(255,255,255,0.06)] bg-[var(--market-noir)] text-[var(--market-paper-white)]">
      <div className="mx-auto grid max-w-[1480px] gap-8 px-4 py-14 sm:px-6 xl:grid-cols-[1.2fr,0.8fr,0.8fr,0.8fr] xl:px-8">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-3 rounded-full border border-[color:rgba(255,255,255,0.12)] bg-[color:rgba(255,255,255,0.04)] px-4 py-2">
            <Sparkles className="h-4 w-4 text-[var(--market-brass)]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--market-brass)]">
              HenryCo Marketplace
            </span>
          </div>
          <p className="max-w-xl font-[family:var(--font-marketplace-display)] text-[2.35rem] leading-[1.02] tracking-[-0.04em] text-[var(--market-paper-white)]">
            Premium commerce with calmer hierarchy, better trust, and sharper operator control.
          </p>
          <p className="max-w-2xl text-sm leading-7 text-[color:rgba(255,255,255,0.64)]">
            Built for HenryCo’s ecosystem with verified sellers, split-order clarity, stronger delivery accountability, premium merchandising, and a cleaner operational nervous system.
          </p>
        </div>

        <div className="space-y-4 text-sm text-[color:rgba(255,255,255,0.68)]">
          <p className="font-semibold uppercase tracking-[0.18em] text-[var(--market-paper-white)]">
            Shop
          </p>
          <Link href="/search">Browse catalog</Link>
          <Link href="/deals">Deals and timed edits</Link>
          <Link href="/trust">Trust passport</Link>
          <Link href="/help">Support and delivery help</Link>
        </div>

        <div className="space-y-4 text-sm text-[color:rgba(255,255,255,0.68)]">
          <p className="font-semibold uppercase tracking-[0.18em] text-[var(--market-paper-white)]">
            Sell
          </p>
          <Link href="/sell">Why sell on HenryCo</Link>
          <Link href="/account/seller-application">Seller application</Link>
          <Link href="/vendor">Vendor workspace</Link>
          <p>Moderated listings and quality-first trust standards.</p>
        </div>

        <div className="space-y-4 text-sm text-[color:rgba(255,255,255,0.68)]">
          <p className="font-semibold uppercase tracking-[0.18em] text-[var(--market-paper-white)]">
            Support
          </p>
          <p>marketplace@henrycogroup.com</p>
          <p>+234 913 395 7084</p>
          <p>marketplace.henrycogroup.com</p>
          <p>Accountable messaging, dispute support, and finance visibility stay inside one system.</p>
        </div>
      </div>
    </footer>
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
    <section className="market-panel overflow-hidden rounded-[2.2rem] p-6 sm:p-8 lg:p-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <p className="market-kicker">{kicker}</p>
          <h1 className="market-heading">{title}</h1>
          <p className="max-w-2xl text-base leading-8 text-[var(--market-muted)]">{description}</p>
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
        <article key={item.label} className="market-paper rounded-[1.6rem] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--market-muted)]">
            {item.label}
          </p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-[var(--market-ink)]">
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
    <article className="market-paper overflow-hidden rounded-[1.85rem]">
      <div className="relative h-44 overflow-hidden">
        <Image
          src={imageSrc}
          alt={vendor.name}
          fill
          sizes="(max-width: 1024px) 100vw, 33vw"
          className="object-cover"
        />
      </div>
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          {vendor.badges.slice(0, 3).map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-3 py-1 text-xs font-semibold text-[var(--market-muted)]"
            >
              {badge}
            </span>
          ))}
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold tracking-tight text-[var(--market-ink)]">
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
    <div className="rounded-2xl border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-3 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--market-muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--market-ink)]">{value}</p>
    </div>
  );
}

export function CollectionCard({ collection }: { collection: MarketplaceCollection }) {
  return (
    <article className="market-panel rounded-[1.9rem] p-6">
      <p className="market-kicker">{collection.kicker}</p>
      <h3 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--market-ink)]">
        {collection.title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{collection.description}</p>
      <p className="mt-5 text-sm font-medium text-[var(--market-ink)]">{collection.highlight}</p>
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
    <article className="market-panel rounded-[2rem] p-6 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <p className="market-kicker">{campaign.surface}</p>
          <h2 className="text-4xl font-semibold tracking-tight text-[var(--market-ink)]">
            {campaign.title}
          </h2>
          <p className="max-w-2xl text-base leading-8 text-[var(--market-muted)]">
            {campaign.description}
          </p>
          {campaign.countdown ? (
            <p className="text-sm font-semibold text-[var(--market-claret)]">{campaign.countdown}</p>
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
  return (
    <section className="market-paper rounded-[1.9rem] p-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-[var(--market-brass)]" />
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
          Trust Passport
        </p>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TrustPassportCard icon={<CheckCircle2 className="h-5 w-5" />} label="Verification" value={vendor.verificationLevel} />
        <TrustPassportCard icon={<Truck className="h-5 w-5" />} label="Fulfillment" value={`${vendor.fulfillmentRate}%`} />
        <TrustPassportCard icon={<Store className="h-5 w-5" />} label="Dispute Rate" value={`${vendor.disputeRate}%`} />
        <TrustPassportCard icon={<ShieldCheck className="h-5 w-5" />} label="Response SLA" value={`${vendor.responseSlaHours}h`} />
      </div>
    </section>
  );
}

function TrustPassportCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] p-4">
      <div className="flex items-center gap-3 text-[var(--market-brass)]">{icon}</div>
      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold capitalize text-[var(--market-ink)]">{value}</p>
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
    <div className="mx-auto grid max-w-[1480px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[280px,1fr] xl:px-8">
      <aside className="market-panel rounded-[2rem] p-4">
        <p className="market-kicker">Workspace</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{description}</p>
        <nav className="mt-6 space-y-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition",
                item.active
                  ? "bg-[var(--market-noir)] text-white"
                  : "bg-[var(--market-paper-white)] text-[var(--market-ink)]"
              )}
            >
              <span>{item.label}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          ))}
        </nav>
      </aside>
      <main className="space-y-6">
        <section className="market-panel rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="market-kicker">Operator Surface</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight">{title}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--market-muted)]">
                {description}
              </p>
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        </section>
        {children}
      </main>
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
    <article className="market-paper rounded-[1.5rem] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
        {label}
      </p>
      <p className="mt-3 text-4xl font-semibold tracking-tight text-[var(--market-ink)]">{value}</p>
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
    <section className="market-soft rounded-[1.75rem] p-8 text-center">
      <p className="text-2xl font-semibold tracking-tight text-[var(--market-ink)]">{title}</p>
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
