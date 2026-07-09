import { DivisionImage } from "@henryco/dashboard-shell/components";
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
import {
  WorkspaceMobileNav,
  type WorkspaceNavGroup,
} from "@/components/marketplace/workspace-mobile-nav";
import {
  BRAND_EMAILS,
  getAccountUrl,
  getDivisionConfig,
  getHubUrl,
  getSupportWhatsAppHref,
} from "@henryco/config";
import { HenryCoWordmark } from "@henryco/ui/brand";
import { translateSurfaceLabel } from "@henryco/i18n";
import { ProductCardClient } from "@/components/marketplace/product-card-client";
import type { SellerTier } from "@henryco/ui";
import { PublicHeaderClient } from "@/components/marketplace/public-header-client";
import { PublicSiteFooter } from "@henryco/ui/public-design";
import { manrope, MARKETPLACE_PUBLIC_THEME_STYLE } from "@/components/marketplace/marketplace-public-theme";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { getMarketplacePublicCopy } from "@/lib/public-copy";
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

export async function PublicSurface({ children }: { children: React.ReactNode }) {
  const locale = await getMarketplacePublicLocale();
  const copy = getMarketplacePublicCopy(locale);
  const t = (s: string) => translateSurfaceLabel(locale, s);
  const footerColumns = [
    { title: copy.footer.shopTitle, links: copy.footer.shopLinks },
    {
      title: copy.footer.sellTitle,
      links: [
        ...copy.footer.sellLinks,
        { href: getAccountUrl("/marketplace"), label: t("Your account") },
      ],
    },
    {
      title: copy.footer.supportTitle,
      links: [
        { href: "/help", label: t("Help and support") },
        { href: getHubUrl("/contact"), label: t("Contact") },
        { href: "/trust", label: t("Trust") },
      ],
    },
  ];
  return (
    <div
      className={`${manrope.variable} market-page home-accent-scope flex min-h-screen flex-col bg-[color:var(--home-canvas)] text-[color:var(--home-ink)]`}
      style={MARKETPLACE_PUBLIC_THEME_STYLE}
    >
      <PublicHeader signedIn={false} />
      <main id="henryco-main" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <PublicSiteFooter
        copy={{
          statement: t(
            "A calmer marketplace — verified sellers, honest delivery, every order on one trusted record.",
          ),
          divisionsLabel: t("The Henry Onyx group"),
          rightsReserved: t("All rights reserved."),
          attribution: t("Built in-house by Henry Onyx Studio."),
        }}
        columns={footerColumns}
        support={{ email: BRAND_EMAILS.marketplace }}
      />
      <MarketplaceCartDrawer />
    </div>
  );
}

export async function PublicFooter() {
  const locale = await getMarketplacePublicLocale();
  const copy = getMarketplacePublicCopy(locale);
  return (
    <footer className="mt-20 border-t border-[var(--market-line)] bg-[rgba(2,4,10,0.84)] text-[var(--market-paper-white)] backdrop-blur-2xl">
      <div
        aria-hidden
        className="pointer-events-none mx-auto h-px max-w-[1480px] bg-gradient-to-r from-transparent via-[var(--market-brass)]/35 to-transparent"
      />
      <div className="mx-auto max-w-[1480px] px-4 py-12 sm:px-6 xl:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--market-brass)]">
              <Sparkles className="h-3.5 w-3.5" />
              {translateSurfaceLabel(locale, "Henry Onyx Marketplace")}
            </div>
            <p className="max-w-md text-sm leading-7 text-[var(--market-muted)]">
              {copy.footer.brandBody}
            </p>
            <div className="space-y-1.5 text-sm text-[var(--market-muted)]">
              <p className="text-[var(--market-paper-white)]">{BRAND_EMAILS.marketplace}</p>
              {/* NUMBER-PURGE (2026-07-10): the spaced-digit literal here dodged
                  every prior sweep and kept the company number crawlable. The
                  masked WhatsApp link (single company source) replaces it —
                  digits live only in the href, never in visible text. */}
              <a
                href={getSupportWhatsAppHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block transition-colors hover:text-[var(--market-paper-white)]"
              >
                WhatsApp
              </a>
            </div>
          </div>

          <FooterColumn
            title={copy.footer.shopTitle}
            links={copy.footer.shopLinks}
          />

          <FooterColumn
            title={copy.footer.sellTitle}
            links={[
              ...copy.footer.sellLinks,
              {
                href: getAccountUrl("/marketplace"),
                label: translateSurfaceLabel(locale, "Your account"),
                external: true,
              },
            ]}
          />

          <FooterColumn
            title={copy.footer.supportTitle}
            links={[
              { href: "/help", label: translateSurfaceLabel(locale, "Help and support") },
              {
                href: getHubUrl("/contact"),
                label: translateSurfaceLabel(locale, "Contact"),
                external: true,
              },
              { href: "/trust", label: translateSurfaceLabel(locale, "Trust") },
              {
                href: getHubUrl("/preferences"),
                label: translateSurfaceLabel(locale, "Preferences"),
                external: true,
              },
            ]}
          />
        </div>

        <div className="mt-10 flex flex-col items-start gap-3 border-t border-[var(--market-line)] pt-5 text-xs text-[var(--market-muted)]/90 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>&copy; {new Date().getFullYear()} {translateSurfaceLabel(locale, "Henry Onyx Marketplace")}. {translateSurfaceLabel(locale, "All rights reserved")}.</span>
            <a
              href={getHubUrl("/privacy")}
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-[var(--market-paper-white)]"
            >
              {translateSurfaceLabel(locale, "Privacy")}
            </a>
            <a
              href={getHubUrl("/terms")}
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-[var(--market-paper-white)]"
            >
              {translateSurfaceLabel(locale, "Terms")}
            </a>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em]">
            <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--market-brass)]" />
            {translateSurfaceLabel(locale, "Designed and built in-house by Henry Onyx Studio for the Henry Onyx ecosystem")}
          </span>
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
    <section>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          <p className="market-kicker">{kicker}</p>
          <h1 className="market-heading mt-4 max-w-3xl text-balance text-[var(--market-paper-white)]">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--market-muted)] sm:text-lg">
            {description}
          </p>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}

export function KpiGrid({ items }: { items: MarketplaceKpi[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-6 border-y border-[var(--market-line)] py-6 sm:flex sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-12 md:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1.5">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
            {item.label}
          </dt>
          <dd className="text-[1.7rem] font-semibold leading-tight tracking-tight text-[var(--market-paper-white)] sm:text-[2rem]">
            {item.value}
          </dd>
          <p className="max-w-sm text-[12.5px] leading-relaxed text-[var(--market-muted)]">
            {item.hint}
          </p>
        </div>
      ))}
    </dl>
  );
}

export function ProductCard({
  product,
  sellerTier,
  deliveryPromise,
}: {
  product: MarketplaceProduct;
  /** V3-58 server-derived seller tier for the listing's vendor; omitted → no chip. */
  sellerTier?: SellerTier;
  /** V3-DELIVERY-COMPLETE-01 tier-clamped Delivery Promise for the vendor; null → no badge. */
  deliveryPromise?: { coveredStates: string[] } | null;
}) {
  return <ProductCardClient product={product} sellerTier={sellerTier} deliveryPromise={deliveryPromise} />;
}

export function VendorCard({
  vendor,
  copy,
}: {
  vendor: MarketplaceVendor;
  copy?: ReturnType<typeof getMarketplacePublicCopy>;
}) {
  const localeCopy = copy ?? getMarketplacePublicCopy("en");
  const imageSrc =
    vendor.heroImage ||
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80";

  return (
    <Link href={`/store/${vendor.slug}`} className="group block">
      <article className="overflow-hidden rounded-[1.8rem] border border-[color:var(--home-line)] bg-[color:var(--home-sheet)] shadow-[0_30px_90px_-45px_rgb(var(--home-ink-rgb)/0.18)] transition duration-300 group-hover:-translate-y-1 group-hover:border-[color:var(--home-accent)]/50">
        <div className="relative h-44 overflow-hidden">
          <DivisionImage
            src={imageSrc}
            alt={vendor.name}
            fill
            sizes="(max-width: 1024px) 100vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
            radius="0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--home-ink-rgb)/0.78)] via-[rgb(var(--home-ink-rgb)/0.16)] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-1.5 p-5">
            {vendor.badges.slice(0, 3).map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-[color:var(--home-sheet)]/25 bg-[rgb(var(--home-ink-rgb)/0.55)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--home-sheet)] backdrop-blur-md"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-5 p-6">
          <div>
            <h3 className="text-[1.4rem] font-semibold leading-tight tracking-[-0.015em] text-[var(--market-paper-white)] sm:text-[1.55rem]">
              {vendor.name}
            </h3>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--market-muted)]">
              {vendor.description}
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-3 border-y border-[var(--market-line)] py-4">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                {localeCopy.trustPassport.verification}
              </dt>
              <dd className="mt-1.5 text-[1.05rem] font-semibold leading-tight tracking-tight text-[var(--market-paper-white)]">
                {vendor.trustScore}%
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                {localeCopy.trustPassport.responseSla}
              </dt>
              <dd className="mt-1.5 text-[1.05rem] font-semibold leading-tight tracking-tight text-[var(--market-paper-white)]">
                {vendor.responseSlaHours}h
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                Rating
              </dt>
              <dd className="mt-1.5 text-[1.05rem] font-semibold leading-tight tracking-tight text-[var(--market-paper-white)]">
                {vendor.reviewScore > 0 ? vendor.reviewScore.toFixed(1) : "New"}
              </dd>
            </div>
          </dl>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--market-brass)] underline-offset-4 group-hover:underline">
            {localeCopy.trustPassport.visitStore}
            <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </article>
    </Link>
  );
}

export function CollectionCard({
  collection,
  copy,
}: {
  collection: MarketplaceCollection;
  copy?: ReturnType<typeof getMarketplacePublicCopy>;
}) {
  const localeCopy = copy ?? getMarketplacePublicCopy("en");
  return (
    <Link href={`/collections/${collection.slug}`} className="group block">
      <article className="rounded-[1.8rem] border border-[color:var(--home-line)] bg-[color:var(--home-sheet)] p-6 shadow-[0_30px_90px_-45px_rgb(var(--home-ink-rgb)/0.18)] transition duration-300 group-hover:-translate-y-1 group-hover:border-[color:var(--home-accent)]/50">
        <p className="market-kicker">{collection.kicker}</p>
        <h3 className="mt-4 text-[1.5rem] font-semibold leading-tight tracking-[-0.015em] text-[var(--market-paper-white)] sm:text-[1.7rem]">
          {collection.title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-[var(--market-muted)]">
          {collection.description}
        </p>
        {collection.highlight ? (
          <p className="mt-5 border-l-2 border-[var(--market-brass)]/55 pl-4 text-sm font-semibold leading-relaxed text-[var(--market-paper-white)]">
            {collection.highlight}
          </p>
        ) : null}
        <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--market-brass)] underline-offset-4 group-hover:underline">
          {localeCopy.home.categoryLink}
          <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </article>
    </Link>
  );
}

export function CampaignBanner({ campaign }: { campaign: MarketplaceCampaign }) {
  return (
    <article className="border-y border-[var(--market-line)] py-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="market-kicker">{campaign.surface}</p>
          <h2 className="mt-4 max-w-2xl text-balance text-[1.85rem] font-semibold leading-[1.1] tracking-[-0.025em] text-[var(--market-paper-white)] sm:text-[2.2rem] md:text-[2.6rem]">
            {campaign.title}
          </h2>
          <p className="mt-4 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--market-muted)]">
            {campaign.description}
          </p>
          {campaign.countdown ? (
            <p className="mt-4 inline-flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-alert)]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--market-alert)]" />
              {campaign.countdown}
            </p>
          ) : null}
        </div>
        <Link
          href={campaign.ctaHref}
          className="market-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
        >
          {campaign.ctaLabel} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

export function TrustPassport({
  vendor,
  copy,
}: {
  vendor: MarketplaceVendor;
  copy?: ReturnType<typeof getMarketplacePublicCopy>;
}) {
  const localeCopy = copy ?? getMarketplacePublicCopy("en");
  return (
    <section>
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-4 w-4 text-[var(--market-brass)]" />
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--market-brass)]">
          {localeCopy.trustPassport.title}
        </p>
        <span className="h-px flex-1 bg-[var(--market-line)]" />
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6 border-y border-[var(--market-line)] py-6 sm:flex sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-12 md:grid-cols-4">
        <TrustPassportRow
          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
          label={localeCopy.trustPassport.verification}
          value={vendor.verificationLevel}
        />
        <TrustPassportRow
          icon={<Truck className="h-3.5 w-3.5" />}
          label={localeCopy.trustPassport.fulfillment}
          value={`${vendor.fulfillmentRate}%`}
        />
        <TrustPassportRow
          icon={<Store className="h-3.5 w-3.5" />}
          label={localeCopy.trustPassport.disputeRate}
          value={`${vendor.disputeRate}%`}
        />
        <TrustPassportRow
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
          label={localeCopy.trustPassport.responseSla}
          value={`${vendor.responseSlaHours}h`}
        />
      </dl>
    </section>
  );
}

function TrustPassportRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-[var(--market-brass)]">
        {icon}
        <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
          {label}
        </dt>
      </div>
      <dd className="text-[1.5rem] font-semibold capitalize leading-tight tracking-tight text-[var(--market-paper-white)] sm:text-[1.75rem]">
        {value}
      </dd>
    </div>
  );
}

export async function WorkspaceShell({
  title,
  description,
  nav,
  navGroups,
  actions,
  hero,
  children,
}: {
  title: string;
  description: string;
  nav: Array<{ href: string; label: string; active?: boolean }>;
  /**
   * Optional grouped representation of the same nav for mobile rendering.
   * If omitted, the entire flat `nav` is rendered as a single "Workspace"
   * group inside the mobile drawer.
   */
  navGroups?: WorkspaceNavGroup[];
  actions?: React.ReactNode;
  /**
   * V3-INNER-L (elevation) — optional editorial masthead. When provided it
   * REPLACES the generic `title`/`description` title-bar in the main column
   * (the buyer home passes a state-driven <HeroCard /> here, answering Q1+Q2
   * above the fold per account-design-language). The sidebar still renders
   * `title`/`description` as the workspace identity, and `title`/`description`
   * still feed the mobile nav — so pages without a hero are unchanged.
   */
  hero?: React.ReactNode;
  children: React.ReactNode;
}) {
  const locale = await getMarketplacePublicLocale();
  const copy = getMarketplacePublicCopy(locale);
  const division = getDivisionConfig("marketplace");
  const tShell = (s: string) => translateSurfaceLabel(locale, s);
  const groupsForMobile: WorkspaceNavGroup[] =
    navGroups && navGroups.length > 0
      ? navGroups
      : [{ label: tShell("Workspace"), items: nav }];
  const activeLabel = nav.find((item) => item.active)?.label ?? null;
  return (
    <div className="mx-auto grid max-w-[1480px] gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[300px,1fr] xl:px-8">
      <WorkspaceMobileNav
        title={title}
        description={description}
        groups={groupsForMobile}
        currentLabel={activeLabel}
        labels={{
          kicker: tShell("Workspace"),
          currentSection: tShell("Current section"),
          openMenu: tShell("Open workspace menu"),
          menuTitle: tShell("Workspace menu"),
          closeMenu: tShell("Close workspace menu"),
          fallbackActive: tShell("Overview"),
        }}
      />
      <aside className="market-panel hidden rounded-[2.1rem] p-4 lg:block">
        {/* Brand lockup — engineered "Henry Onyx" SVG wordmark (currentColor →
            ink) primary, division a muted sub-label (getDivisionConfig). No
            CMS logo_url in chrome. */}
        <div className="flex items-center gap-2.5 border-b border-[var(--market-line)] px-1 pb-4">
          <HenryCoWordmark
            fontFamily="Fraunces"
            height={18}
            className="text-[var(--market-paper-white)]"
          />
          <span aria-hidden className="h-3 w-px bg-[var(--market-line-strong)]" />
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[var(--market-muted)]">
            {division.shortName}
          </span>
        </div>
        <p className="market-kicker mt-5">{copy.workspace.kicker}</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--market-paper-white)]">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{description}</p>
        <nav className="mt-6 space-y-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "flex items-center justify-between rounded-[1.25rem] px-4 py-3 text-sm font-semibold transition",
                item.active
                  ? "text-[color:var(--market-paper-white)]"
                  : "text-[color:var(--market-muted)] hover:text-[color:var(--market-paper-white)]"
              )}
              style={{
                background: item.active
                  ? "var(--market-nav-active)"
                  : "var(--market-nav-fill)",
              }}
            >
              <span>{item.label}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          ))}
        </nav>
      </aside>
      <main className="space-y-6">
        {hero ?? (
          <section className="market-panel rounded-[2.1rem] p-6 sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="market-kicker">{copy.workspace.operatorKicker}</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--market-paper-white)] sm:text-4xl">
                  {title}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--market-muted)]">
                  {description}
                </p>
              </div>
              {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
            </div>
          </section>
        )}
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
    <article className="border-t border-[var(--market-line)] pt-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
        {label}
      </p>
      <p className="mt-3 text-[2rem] font-semibold leading-tight tracking-tight text-[var(--market-paper-white)] sm:text-[2.3rem]">
        {value}
      </p>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--market-muted)]">{hint}</p>
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
    <section className="border-l-2 border-[var(--market-brass)]/55 px-5 py-4">
      <p className="text-[1.4rem] font-semibold leading-tight tracking-[-0.015em] text-[var(--market-paper-white)] sm:text-[1.65rem]">
        {title}
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--market-muted)]">{body}</p>
      {ctaHref && ctaLabel ? (
        <Link
          href={ctaHref}
          className="market-button-primary mt-5 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
        >
          {ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </section>
  );
}
