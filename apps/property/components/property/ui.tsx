import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BedDouble,
  Building2,
  CalendarRange,
  CarFront,
  ChevronRight,
  MapPin,
  ShieldCheck,
  Sparkles,
  SquareStack,
} from "lucide-react";
import { cn, formatCompactNumber, formatCurrency } from "@/lib/utils";
import type {
  PropertyAgent,
  PropertyArea,
  PropertyDifferentiator,
  PropertyFeaturedCampaign,
  PropertyListing,
  PropertyManagedRecord,
} from "@/lib/property/types";
import type { PropertyPublicCopy } from "@/lib/public-copy";

/**
 * Premium editorial Property UI primitives.
 *
 * Convention:
 *   - Section intros use eyebrow + display + body, no panel chrome.
 *   - Metric / fact / trust grids use editorial divided <dl> rails or
 *     inline <ul> with hairline rules — never dark-tile 4-up grids.
 *   - Cards (listing/area/agent/managed/differentiator) keep one outer
 *     surface (image rounded card or paper-warm wrap) but their inside
 *     uses divided typographic rows, not nested rounded sub-tiles.
 */

export function PropertySectionIntro({
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
        <div className="max-w-3xl">
          <p className="property-kicker">{kicker}</p>
          <h1 className="property-heading mt-4 text-balance">{title}</h1>
          <p className="mt-4 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--property-ink-soft)] sm:text-lg">
            {description}
          </p>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}

export function PropertyMetricGrid({
  items,
}: {
  items: Array<{ label: string; value: string; hint: string }>;
}) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-6 border-y border-[var(--property-line)] py-6 sm:flex sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-12 md:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1.5">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-muted)]">
            {item.label}
          </dt>
          <dd className="text-[1.7rem] font-semibold leading-tight tracking-tight text-[var(--property-ink)] sm:text-[2rem]">
            {item.value}
          </dd>
          <p className="max-w-sm text-[12.5px] leading-relaxed text-[var(--property-ink-soft)]">
            {item.hint}
          </p>
        </div>
      ))}
    </dl>
  );
}

export { PropertySearchBar } from "./property-search-bar";

export function PropertyCampaignPanel({ campaign }: { campaign: PropertyFeaturedCampaign }) {
  return (
    <article className="border-y border-[var(--property-line)] py-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="property-kicker">{campaign.surface}</p>
          <h2 className="mt-4 max-w-2xl text-balance text-[1.85rem] font-semibold leading-[1.1] tracking-[-0.025em] text-[var(--property-ink)] sm:text-[2.2rem] md:text-[2.6rem]">
            {campaign.title}
          </h2>
          <p className="mt-4 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--property-ink-soft)]">
            {campaign.description}
          </p>
        </div>
        <Link
          href={campaign.ctaHref}
          className="property-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
        >
          {campaign.ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

export function PropertyListingCard({
  listing,
  href,
  saved,
  copy,
  priority,
}: {
  listing: PropertyListing;
  href?: string;
  saved?: boolean;
  copy?: PropertyPublicCopy;
  /** When true, the hero image loads eagerly with high fetchpriority — use
   *  for above-the-fold cards (typically the first row in a grid). */
  priority?: boolean;
}) {
  const listingCopy = copy?.listingCard;
  const target = href || `/property/${listing.slug}`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.8rem] border border-[var(--property-line)] bg-[rgba(0,0,0,0.04)] transition duration-300 hover:-translate-y-1 hover:border-[var(--property-accent-strong)]/40 hover:shadow-[0_22px_60px_rgba(0,0,0,0.18)]">
      <Link href={target} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={listing.heroImage}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
            priority={priority}
            loading={priority ? "eager" : "lazy"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(16,10,8,0.78)] via-[rgba(16,10,8,0.14)] to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
            {listing.trustBadges.slice(0, 2).map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-white/15 bg-[rgba(16,10,8,0.65)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-md"
              >
                {badge}
              </span>
            ))}
          </div>
          {saved ? (
            <span className="absolute right-4 top-4 rounded-full border border-white/15 bg-[rgba(16,10,8,0.65)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-md">
              {listingCopy?.saved ?? "Saved"}
            </span>
          ) : null}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/75">
                {listing.kind}
                <span className="mx-1.5 opacity-50">·</span>
                <span className="font-medium tracking-[0.18em]">{listing.locationLabel}</span>
              </p>
            </div>
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-5 p-5 sm:p-6">
        <div>
          <Link href={target} className="block">
            <h3 className="text-[1.35rem] font-semibold leading-snug tracking-tight text-[var(--property-ink)] transition group-hover:text-[var(--property-accent-strong)] sm:text-[1.5rem]">
              {listing.title}
            </h3>
          </Link>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--property-ink-soft)]">
            {listing.summary}
          </p>
        </div>

        <ul className="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-[var(--property-line)] py-4 text-sm text-[var(--property-ink-soft)] md:grid-cols-4">
          <ListingFact
            icon={<BedDouble className="h-3.5 w-3.5" />}
            value={
              listing.bedrooms
                ? `${listing.bedrooms} ${listingCopy?.beds ?? "beds"}`
                : listingCopy?.openPlan ?? "Open plan"
            }
          />
          <ListingFact
            icon={<Building2 className="h-3.5 w-3.5" />}
            value={
              listing.bathrooms
                ? `${listing.bathrooms} ${listingCopy?.baths ?? "baths"}`
                : listing.kind
            }
          />
          <ListingFact
            icon={<SquareStack className="h-3.5 w-3.5" />}
            value={
              listing.sizeSqm
                ? `${listing.sizeSqm} ${listingCopy?.sqm ?? "sqm"}`
                : listingCopy?.premiumFit ?? "Premium fit"
            }
          />
          <ListingFact
            icon={<CarFront className="h-3.5 w-3.5" />}
            value={
              listing.parkingSpaces
                ? `${listing.parkingSpaces} ${listingCopy?.parking ?? "parking"}`
                : listingCopy?.noParking ?? "No parking"
            }
          />
        </ul>

        <div className="mt-auto flex items-end justify-between gap-4">
          <div>
            <p className="text-[1.6rem] font-semibold leading-tight tracking-tight text-[var(--property-ink)]">
              {formatCurrency(listing.price, listing.currency)}
            </p>
            <p className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[var(--property-ink-soft)]">
              {listing.priceInterval}
            </p>
          </div>
          <Link
            href={target}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--property-accent-strong)] underline-offset-4 transition hover:underline"
          >
            {listingCopy?.view ?? "View"}
            <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function ListingFact({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <li className="flex items-center gap-1.5 text-[12.5px] leading-tight text-[var(--property-ink-soft)]">
      <span className="text-[var(--property-accent-strong)]">{icon}</span>
      <span>{value}</span>
    </li>
  );
}

export function PropertyAreaCard({
  area,
  count,
  copy,
}: {
  area: PropertyArea;
  count: number;
  copy?: PropertyPublicCopy;
}) {
  const areaCopy = copy?.areaCard;
  return (
    <article className="group overflow-hidden rounded-[1.8rem] border border-[var(--property-line)] bg-[rgba(0,0,0,0.04)] transition duration-300 hover:-translate-y-1 hover:border-[var(--property-accent-strong)]/40">
      <div className="relative bg-[radial-gradient(circle_at_top_left,rgba(232,184,148,0.22),transparent_42%),linear-gradient(135deg,rgba(191,122,71,0.18),rgba(18,13,10,0.04))] px-6 py-9">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--property-accent-strong)]">
          {area.city}
        </p>
        <h3 className="mt-3 text-[1.7rem] font-semibold leading-tight tracking-[-0.015em] text-[var(--property-ink)] sm:text-[1.95rem]">
          {area.name}
        </h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--property-ink-soft)]">
          {area.hero}
        </p>
      </div>
      <div className="space-y-5 p-6">
        <p className="text-sm leading-relaxed text-[var(--property-ink-soft)]">{area.marketNote}</p>
        <dl className="grid grid-cols-2 gap-4 border-y border-[var(--property-line)] py-4">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-muted)]">
              {areaCopy?.averageRent ?? "Average rent"}
            </dt>
            <dd className="mt-1.5 text-[1.05rem] font-semibold tracking-tight text-[var(--property-ink)]">
              {formatCurrency(area.averageRent)}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-muted)]">
              {areaCopy?.averageSale ?? "Average sale"}
            </dt>
            <dd className="mt-1.5 text-[1.05rem] font-semibold tracking-tight text-[var(--property-ink)]">
              {formatCurrency(area.averageSale)}
            </dd>
          </div>
        </dl>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
            {count} {areaCopy?.liveListings ?? "live listings"}
          </span>
          <Link
            href={`/area/${area.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--property-accent-strong)] underline-offset-4 transition hover:underline"
          >
            {areaCopy?.exploreArea ?? "Explore area"}
            <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function PropertyAgentCard({ agent }: { agent: PropertyAgent }) {
  return (
    <article className="overflow-hidden rounded-[1.8rem] border border-[var(--property-line)] bg-[rgba(0,0,0,0.04)]">
      <div className="grid gap-0 sm:grid-cols-[0.5fr,1fr]">
        <div className="relative h-72 sm:h-full">
          <Image
            src={agent.photoUrl}
            alt={agent.name}
            fill
            sizes="(max-width: 1024px) 100vw, 25vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col gap-5 p-6 sm:p-7">
          <div>
            <p className="property-kicker">{agent.label}</p>
            <h3 className="mt-3 text-[1.4rem] font-semibold leading-tight tracking-[-0.015em] text-[var(--property-ink)] sm:text-[1.6rem]">
              {agent.name}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--property-ink-soft)]">
              {agent.bio}
            </p>
          </div>
          {agent.badges.length ? (
            <div className="flex flex-wrap gap-1.5">
              {agent.badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-[var(--property-line)] px-2.5 py-1 text-[10.5px] font-medium tracking-tight text-[var(--property-ink-soft)]"
                >
                  {badge}
                </span>
              ))}
            </div>
          ) : null}
          <dl className="divide-y divide-[var(--property-line)] border-t border-[var(--property-line)] text-sm">
            <div className="flex items-baseline gap-3 py-2.5">
              <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-muted)]">
                Email
              </dt>
              <dd className="ml-auto truncate text-right text-sm font-medium text-[var(--property-ink)]">
                {agent.email}
              </dd>
            </div>
            <div className="flex items-baseline gap-3 py-2.5">
              <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-muted)]">
                Phone
              </dt>
              <dd className="ml-auto truncate text-right text-sm font-medium text-[var(--property-ink)]">
                {agent.phone}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </article>
  );
}

export function PropertyManagedRecordCard({
  record,
  compact,
}: {
  record: PropertyManagedRecord;
  compact?: boolean;
}) {
  return (
    <article
      className={cn(
        "rounded-[1.8rem] border border-[var(--property-line)] bg-[rgba(0,0,0,0.04)] p-6",
        compact && "p-5",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="property-kicker">{record.serviceType}</p>
          <h3 className="mt-3 text-[1.35rem] font-semibold leading-tight tracking-[-0.015em] text-[var(--property-ink)] sm:text-[1.55rem]">
            {record.title}
          </h3>
        </div>
        <PropertyStatusBadge status={record.status} />
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--property-ink-soft)]">
        {record.narrative}
      </p>
      <dl className="mt-5 divide-y divide-[var(--property-line)] border-y border-[var(--property-line)] text-sm sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:border-y">
        <div className="py-3 sm:px-4 sm:py-4 sm:first:pl-0">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-muted)]">
            Owner
          </dt>
          <dd className="mt-1.5 text-sm font-semibold tracking-tight text-[var(--property-ink)]">
            {record.ownerName}
          </dd>
        </div>
        <div className="py-3 sm:px-4 sm:py-4">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-muted)]">
            Portfolio value
          </dt>
          <dd className="mt-1.5 text-sm font-semibold tracking-tight text-[var(--property-ink)]">
            {formatCurrency(record.portfolioValue)}
          </dd>
        </div>
        <div className="py-3 sm:px-4 sm:py-4 sm:last:pr-0">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-muted)]">
            Service lines
          </dt>
          <dd className="mt-1.5 text-sm font-semibold tracking-tight text-[var(--property-ink)]">
            {record.serviceLines.length}
          </dd>
        </div>
      </dl>
      {record.serviceLines.length ? (
        <div className="mt-5 flex flex-wrap gap-1.5">
          {record.serviceLines.map((line) => (
            <span
              key={line}
              className="rounded-full border border-[var(--property-line)] px-2.5 py-1 text-[10.5px] font-medium tracking-tight text-[var(--property-ink-soft)]"
            >
              {line}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function PropertyDifferentiatorCard({
  item,
}: {
  item: PropertyDifferentiator;
}) {
  return (
    <article className="rounded-[1.8rem] border border-[var(--property-line)] bg-[rgba(0,0,0,0.04)] p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[1.2rem] font-semibold leading-tight tracking-tight text-[var(--property-ink)] sm:text-[1.35rem]">
          {item.name}
        </h3>
        <span className="shrink-0 font-mono text-[10.5px] font-semibold tracking-[0.22em] text-[var(--property-accent-strong)]">
          {item.innovationScore}/10
        </span>
      </div>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--property-ink-soft)]">
        {item.description}
      </p>
      <div className="mt-5 grid gap-6 border-y border-[var(--property-line)] py-5 md:grid-cols-2 md:divide-x md:divide-[var(--property-line)] md:py-4">
        <div className="md:pr-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--property-sage)]">
            Pros
          </p>
          <ul className="mt-2 space-y-1.5">
            {item.pros.map((value) => (
              <li
                key={value}
                className="flex gap-2 text-sm leading-relaxed text-[var(--property-ink-soft)]"
              >
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--property-sage)]" />
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:pl-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--property-accent-strong)]">
            Trade-offs
          </p>
          <ul className="mt-2 space-y-1.5">
            {item.cons.map((value) => (
              <li
                key={value}
                className="flex gap-2 text-sm leading-relaxed text-[var(--property-ink-soft)]"
              >
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--property-accent-strong)]" />
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-4 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-muted)]">
        Difficulty: {item.difficulty.replace("_", " ")}
      </p>
    </article>
  );
}

export function PropertyWorkspaceShell({
  kicker,
  title,
  description,
  nav,
  actions,
  children,
}: {
  kicker: string;
  title: string;
  description: string;
  nav: Array<{ href: string; label: string; active?: boolean }>;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid max-w-[92rem] gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[260px,1fr] lg:px-10">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="property-kicker">{kicker}</p>
        <h1 className="mt-4 text-balance text-[1.65rem] font-semibold leading-tight tracking-[-0.015em] text-[var(--property-ink)] sm:text-[1.85rem]">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--property-ink-soft)]">
          {description}
        </p>
        <nav className="mt-7 divide-y divide-[var(--property-line)] border-y border-[var(--property-line)]">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between gap-3 py-3 text-sm font-semibold transition",
                item.active
                  ? "text-[var(--property-accent-strong)]"
                  : "text-[var(--property-ink)] hover:text-[var(--property-accent-strong)]",
              )}
            >
              <span>{item.label}</span>
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition",
                  item.active ? "text-[var(--property-accent-strong)]" : "text-[var(--property-ink-muted)]",
                )}
              />
            </Link>
          ))}
        </nav>
      </aside>

      <main className="space-y-10">
        <section>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="property-kicker">{kicker}</p>
              <h2 className="mt-4 text-balance text-[2rem] font-semibold leading-[1.05] tracking-[-0.025em] text-[var(--property-ink)] sm:text-[2.6rem] md:text-[2.9rem]">
                {title}
              </h2>
              <p className="mt-4 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--property-ink-soft)]">
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

export function PropertyMetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="border-t border-[var(--property-line)] pt-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-muted)]">
        {label}
      </p>
      <p className="mt-3 text-[2rem] font-semibold leading-tight tracking-tight text-[var(--property-ink)] sm:text-[2.3rem]">
        {value}
      </p>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--property-ink-soft)]">{hint}</p>
    </article>
  );
}

export function PropertyEmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="border-l-2 border-[var(--property-accent-strong)]/55 px-5 py-4">
      <h3 className="text-[1.4rem] font-semibold leading-tight tracking-[-0.015em] text-[var(--property-ink)] sm:text-[1.65rem]">
        {title}
      </h3>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--property-ink-soft)]">
        {body}
      </p>
      {action ? <div className="mt-5 flex">{action}</div> : null}
    </section>
  );
}

export function PropertyStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone =
    normalized === "approved" || normalized === "active" || normalized === "completed"
      ? "property-status-badge-positive"
      : normalized === "rejected" || normalized === "cancelled" || normalized === "failed"
        ? "property-status-badge-negative"
        : "property-status-badge-neutral";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]",
        tone,
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function PropertyQuickFacts({ listing }: { listing: PropertyListing }) {
  const facts = [
    {
      icon: <MapPin className="h-3.5 w-3.5" />,
      label: "Area",
      value: listing.locationLabel,
    },
    {
      icon: <CalendarRange className="h-3.5 w-3.5" />,
      label: "Availability",
      value: listing.availableNow ? "Available now" : "Future availability",
    },
    {
      icon: <ShieldCheck className="h-3.5 w-3.5" />,
      label: "Trust",
      value: `${listing.trustBadges.length} signals`,
    },
    {
      icon: <Sparkles className="h-3.5 w-3.5" />,
      label: "Headline",
      value: listing.headlineMetrics.slice(0, 2).join(" · "),
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-y border-[var(--property-line)] py-6 md:grid-cols-4">
      {facts.map((fact) => (
        <div key={fact.label} className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-[var(--property-accent-strong)]">
            {fact.icon}
            <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-muted)]">
              {fact.label}
            </dt>
          </div>
          <dd className="line-clamp-2 text-sm font-semibold tracking-tight text-[var(--property-ink)]">
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function PropertyPortfolioStats({
  listings,
  managedRecords,
  copy,
}: {
  listings: PropertyListing[];
  managedRecords: PropertyManagedRecord[];
  copy?: PropertyPublicCopy;
}) {
  const statsCopy = copy?.stats;
  const managed = listings.filter((item) => item.managedByHenryCo).length;
  const featured = listings.filter((item) => item.featured).length;
  const portfolioValue = managedRecords.reduce((sum, item) => sum + item.portfolioValue, 0);

  return (
    <ol className="grid gap-8 md:grid-cols-3 md:divide-x md:divide-[var(--property-line)]">
      <li>
        <p className="property-kicker">{statsCopy?.managedStock ?? "Managed stock"}</p>
        <p className="mt-3 text-[2rem] font-semibold leading-tight tracking-tight text-[var(--property-ink)] sm:text-[2.4rem]">
          {managed}
        </p>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--property-ink-soft)]">
          {statsCopy?.managedStockBody ??
            "Listings currently running through HenryCo managed-property rails."}
        </p>
      </li>
      <li className="md:pl-8">
        <p className="property-kicker">{statsCopy?.featuredSurfaces ?? "Featured surfaces"}</p>
        <p className="mt-3 text-[2rem] font-semibold leading-tight tracking-tight text-[var(--property-ink)] sm:text-[2.4rem]">
          {featured}
        </p>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--property-ink-soft)]">
          {statsCopy?.featuredSurfacesBody ??
            "Listings currently elevated across editorial and campaign surfaces."}
        </p>
      </li>
      <li className="md:pl-8">
        <p className="property-kicker">{statsCopy?.managedValue ?? "Managed value"}</p>
        <p className="mt-3 text-[2rem] font-semibold leading-tight tracking-tight text-[var(--property-ink)] sm:text-[2.4rem]">
          {formatCompactNumber(portfolioValue)}
        </p>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--property-ink-soft)]">
          {statsCopy?.managedValueBody ??
            "Combined managed-property portfolio value under HenryCo trust operations."}
        </p>
      </li>
    </ol>
  );
}

export function PropertyTrustPill({
  icon,
  title,
  body,
}: {
  icon?: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="border-l border-[var(--property-line)] pl-5">
      <div className="text-[var(--property-accent-strong)]">
        {icon || <Sparkles className="h-4 w-4" />}
      </div>
      <h3 className="mt-3 text-[1rem] font-semibold leading-snug tracking-tight text-[var(--property-ink)]">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--property-ink-soft)]">{body}</p>
    </div>
  );
}
