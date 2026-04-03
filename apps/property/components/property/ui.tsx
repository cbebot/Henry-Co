import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  Building2,
  CalendarRange,
  CarFront,
  ChevronRight,
  Heart,
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
    <section className="property-panel rounded-[2rem] p-6 sm:p-8 lg:p-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <p className="property-kicker">{kicker}</p>
          <h1 className="property-heading">{title}</h1>
          <p className="max-w-2xl text-base leading-8 text-[var(--property-ink-soft)]">
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
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <article key={item.label} className="property-paper rounded-[1.75rem] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--property-ink-muted)]">
            {item.label}
          </p>
          <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[var(--property-ink)]">
            {item.value}
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--property-ink-soft)]">{item.hint}</p>
        </article>
      ))}
    </div>
  );
}

export function PropertySearchBar({
  areas,
  defaults,
  submitLabel = "Search properties",
}: {
  areas: PropertyArea[];
  defaults?: { q?: string; kind?: string; area?: string; managed?: string; furnished?: string };
  submitLabel?: string;
}) {
  return (
    <form
      action="/search"
      method="GET"
      className="property-paper grid gap-4 rounded-[1.9rem] p-5 lg:grid-cols-[1.4fr,0.9fr,0.9fr,auto]"
    >
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-muted)]">
          Search
        </span>
        <input
          name="q"
          defaultValue={defaults?.q || ""}
          placeholder="Ikoyi penthouse, serviced residence, office suite..."
          className="property-input mt-2 rounded-2xl px-4 py-3"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-muted)]">
          Category
        </span>
        <select
          name="kind"
          defaultValue={defaults?.kind || ""}
          className="property-select mt-2 rounded-2xl px-4 py-3"
        >
          <option value="">All categories</option>
          <option value="rent">Residential rent</option>
          <option value="sale">Residential sale</option>
          <option value="commercial">Commercial</option>
          <option value="managed">Managed</option>
          <option value="shortlet">Short-let</option>
        </select>
      </label>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-muted)]">
          Area
        </span>
        <select
          name="area"
          defaultValue={defaults?.area || ""}
          className="property-select mt-2 rounded-2xl px-4 py-3"
        >
          <option value="">All areas</option>
          {areas.map((area) => (
            <option key={area.id} value={area.slug}>
              {area.name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col justify-end gap-3">
        <button
          type="submit"
          className="property-button-primary inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
        >
          {submitLabel}
          <ArrowRight className="h-4 w-4" />
        </button>
        <div className="flex flex-wrap gap-3 text-xs text-[var(--property-ink-soft)]">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" name="managed" value="1" defaultChecked={defaults?.managed === "1"} />
            Managed only
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              name="furnished"
              value="1"
              defaultChecked={defaults?.furnished === "1"}
            />
            Furnished
          </label>
        </div>
      </div>
    </form>
  );
}

export function PropertyCampaignPanel({ campaign }: { campaign: PropertyFeaturedCampaign }) {
  return (
    <article className="property-panel rounded-[2.2rem] p-6 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="property-kicker">{campaign.surface}</div>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--property-ink)]">
            {campaign.title}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--property-ink-soft)]">
            {campaign.description}
          </p>
        </div>
        <Link
          href={campaign.ctaHref}
          className="property-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
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
}: {
  listing: PropertyListing;
  href?: string;
  saved?: boolean;
}) {
  const target = href || `/property/${listing.slug}`;

  return (
    <article className="property-paper flex h-full flex-col overflow-hidden rounded-[1.9rem]">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={listing.heroImage}
          alt={listing.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover"
        />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {listing.trustBadges.slice(0, 2).map((badge) => (
            <span
              key={badge}
              className="rounded-full bg-[color:rgba(16,10,8,0.72)] px-3 py-1 text-xs font-semibold text-white"
            >
              {badge}
            </span>
          ))}
        </div>
        {saved ? (
          <div className="absolute right-4 top-4 rounded-full bg-[color:rgba(16,10,8,0.72)] px-3 py-1 text-xs font-semibold text-white">
            Saved
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-[var(--property-ink-muted)]">
            <span>{listing.kind}</span>
            <span>•</span>
            <span>{listing.locationLabel}</span>
          </div>
          <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--property-ink)]">
            {listing.title}
          </h3>
          <p className="text-sm leading-7 text-[var(--property-ink-soft)]">{listing.summary}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm text-[var(--property-ink-soft)] md:grid-cols-4">
          <Stat icon={<BedDouble className="h-4 w-4" />} value={listing.bedrooms ? `${listing.bedrooms} beds` : "Open plan"} />
          <Stat icon={<Building2 className="h-4 w-4" />} value={listing.bathrooms ? `${listing.bathrooms} baths` : listing.kind} />
          <Stat icon={<SquareStack className="h-4 w-4" />} value={listing.sizeSqm ? `${listing.sizeSqm} sqm` : "Premium fit"} />
          <Stat icon={<CarFront className="h-4 w-4" />} value={listing.parkingSpaces ? `${listing.parkingSpaces} parking` : "No parking"} />
        </div>

        <div className="mt-auto flex items-end justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-[var(--property-ink)]">
              {formatCurrency(listing.price, listing.currency)}
            </div>
            <div className="text-sm text-[var(--property-ink-soft)]">{listing.priceInterval}</div>
          </div>
          <Link
            href={target}
            className="property-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
          >
            View
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function Stat({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--property-line)] bg-[rgba(255,255,255,0.03)] px-3 py-3">
      <div className="text-[var(--property-accent-strong)]">{icon}</div>
      <div className="mt-2 text-sm font-medium">{value}</div>
    </div>
  );
}

export function PropertyAreaCard({ area, count }: { area: PropertyArea; count: number }) {
  return (
    <article className="property-paper overflow-hidden rounded-[1.9rem]">
      <div className="bg-[radial-gradient(circle_at_top_left,rgba(232,184,148,0.26),transparent_40%),linear-gradient(135deg,rgba(191,122,71,0.22),rgba(18,13,10,0.06))] px-5 py-8">
        <div className="property-kicker">{area.city}</div>
        <div className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--property-ink)]">
          {area.name}
        </div>
        <p className="mt-3 max-w-md text-sm leading-7 text-[var(--property-ink-soft)]">{area.hero}</p>
      </div>
      <div className="space-y-4 p-5">
        <div>
          <p className="text-sm leading-7 text-[var(--property-ink-soft)]">{area.marketNote}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.4rem] border border-[var(--property-line)] bg-black/10 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--property-ink-muted)]">Average rent</div>
            <div className="mt-2 text-lg font-semibold text-[var(--property-ink)]">
              {formatCurrency(area.averageRent)}
            </div>
          </div>
          <div className="rounded-[1.4rem] border border-[var(--property-line)] bg-black/10 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--property-ink-muted)]">Average sale</div>
            <div className="mt-2 text-lg font-semibold text-[var(--property-ink)]">
              {formatCurrency(area.averageSale)}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-[var(--property-ink-soft)]">{count} live listings</div>
          <Link href={`/area/${area.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--property-accent-strong)]">
            Explore area
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function PropertyAgentCard({ agent }: { agent: PropertyAgent }) {
  return (
    <article className="property-paper overflow-hidden rounded-[1.9rem]">
      <div className="relative h-72">
        <Image
          src={agent.photoUrl}
          alt={agent.name}
          fill
          sizes="(max-width: 1024px) 100vw, 25vw"
          className="object-cover"
        />
      </div>
      <div className="space-y-4 p-5">
        <div>
          <div className="property-kicker">{agent.label}</div>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--property-ink)]">
            {agent.name}
          </h3>
          <p className="mt-3 text-sm leading-7 text-[var(--property-ink-soft)]">{agent.bio}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {agent.badges.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-[var(--property-line)] px-3 py-1 text-xs text-[var(--property-ink-soft)]"
            >
              {badge}
            </span>
          ))}
        </div>
        <div className="space-y-2 text-sm text-[var(--property-ink-soft)]">
          <div>{agent.email}</div>
          <div>{agent.phone}</div>
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
    <article className={cn("property-paper rounded-[1.9rem] p-5", compact && "p-4")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="property-kicker">{record.serviceType}</div>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--property-ink)]">
            {record.title}
          </h3>
        </div>
        <PropertyStatusBadge status={record.status} />
      </div>
      <p className="mt-3 text-sm leading-7 text-[var(--property-ink-soft)]">{record.narrative}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-[1.4rem] border border-[var(--property-line)] bg-black/10 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--property-ink-muted)]">Owner</div>
          <div className="mt-2 text-sm font-semibold text-[var(--property-ink)]">{record.ownerName}</div>
        </div>
        <div className="rounded-[1.4rem] border border-[var(--property-line)] bg-black/10 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--property-ink-muted)]">Portfolio value</div>
          <div className="mt-2 text-sm font-semibold text-[var(--property-ink)]">
            {formatCurrency(record.portfolioValue)}
          </div>
        </div>
        <div className="rounded-[1.4rem] border border-[var(--property-line)] bg-black/10 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--property-ink-muted)]">Service lines</div>
          <div className="mt-2 text-sm font-semibold text-[var(--property-ink)]">
            {record.serviceLines.length}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {record.serviceLines.map((line) => (
          <span
            key={line}
            className="rounded-full border border-[var(--property-line)] px-3 py-1 text-xs text-[var(--property-ink-soft)]"
          >
            {line}
          </span>
        ))}
      </div>
    </article>
  );
}

export function PropertyDifferentiatorCard({
  item,
}: {
  item: PropertyDifferentiator;
}) {
  return (
    <article className="property-paper rounded-[1.9rem] p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xl font-semibold tracking-[-0.03em] text-[var(--property-ink)]">
          {item.name}
        </div>
        <div className="rounded-full border border-[var(--property-line)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--property-accent-strong)]">
          {item.innovationScore}/10
        </div>
      </div>
      <p className="mt-3 text-sm leading-7 text-[var(--property-ink-soft)]">{item.description}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--property-sage)]">Pros</div>
          <ul className="mt-2 space-y-2 text-sm text-[var(--property-ink-soft)]">
            {item.pros.map((value) => (
              <li key={value}>• {value}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--property-accent-strong)]">Trade-offs</div>
          <ul className="mt-2 space-y-2 text-sm text-[var(--property-ink-soft)]">
            {item.cons.map((value) => (
              <li key={value}>• {value}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-4 text-xs uppercase tracking-[0.18em] text-[var(--property-ink-muted)]">
        Difficulty: {item.difficulty.replace("_", " ")}
      </div>
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
    <div className="mx-auto grid max-w-[92rem] gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[260px,1fr] lg:px-10">
      <aside className="property-panel rounded-[2rem] p-4">
        <div className="property-kicker">{kicker}</div>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--property-ink)]">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-7 text-[var(--property-ink-soft)]">{description}</p>
        <nav className="mt-6 space-y-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-[1.4rem] px-4 py-3 text-sm font-semibold transition",
                item.active
                  ? "bg-[linear-gradient(135deg,#5b3018,#a56537)] text-white"
                  : "border border-[var(--property-line)] bg-black/10 text-[var(--property-ink)]"
              )}
            >
              <span>{item.label}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          ))}
        </nav>
      </aside>

      <main className="space-y-6">
        <section className="property-panel rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="property-kicker">{kicker}</div>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--property-ink)]">
                {title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--property-ink-soft)]">
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
    <article className="property-paper rounded-[1.75rem] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-muted)]">
        {label}
      </p>
      <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[var(--property-ink)]">
        {value}
      </p>
      <p className="mt-3 text-sm leading-7 text-[var(--property-ink-soft)]">{hint}</p>
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
    <section className="property-paper rounded-[1.8rem] p-8 text-center">
      <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--property-ink)]">
        {title}
      </h3>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[var(--property-ink-soft)]">
        {body}
      </p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  );
}

export function PropertyStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone =
    normalized === "approved" || normalized === "active" || normalized === "completed"
      ? "border-[rgba(152,179,154,0.36)] bg-[rgba(152,179,154,0.14)] text-[var(--property-sage-soft)]"
      : normalized === "rejected" || normalized === "cancelled" || normalized === "failed"
        ? "border-[rgba(191,122,71,0.36)] bg-[rgba(191,122,71,0.16)] text-[var(--property-accent-soft)]"
        : "border-[var(--property-line)] bg-[rgba(255,255,255,0.04)] text-[var(--property-ink-soft)]";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
        tone
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function PropertyQuickFacts({ listing }: { listing: PropertyListing }) {
  const facts = [
    {
      icon: <MapPin className="h-4 w-4" />,
      label: "Area",
      value: listing.locationLabel,
    },
    {
      icon: <CalendarRange className="h-4 w-4" />,
      label: "Availability",
      value: listing.availableNow ? "Available now" : "Future availability",
    },
    {
      icon: <ShieldCheck className="h-4 w-4" />,
      label: "Trust",
      value: `${listing.trustBadges.length} trust signals`,
    },
    {
      icon: <Heart className="h-4 w-4" />,
      label: "Signals",
      value: listing.headlineMetrics.join(" · "),
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {facts.map((fact) => (
        <div key={fact.label} className="rounded-[1.5rem] border border-[var(--property-line)] bg-black/10 p-4">
          <div className="flex items-center gap-2 text-[var(--property-accent-strong)]">{fact.icon}</div>
          <div className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--property-ink-muted)]">
            {fact.label}
          </div>
          <div className="mt-2 text-sm font-semibold text-[var(--property-ink)]">{fact.value}</div>
        </div>
      ))}
    </div>
  );
}

export function PropertyPortfolioStats({
  listings,
  managedRecords,
}: {
  listings: PropertyListing[];
  managedRecords: PropertyManagedRecord[];
}) {
  const managed = listings.filter((item) => item.managedByHenryCo).length;
  const featured = listings.filter((item) => item.featured).length;
  const portfolioValue = managedRecords.reduce((sum, item) => sum + item.portfolioValue, 0);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="property-paper rounded-[1.8rem] p-5">
        <div className="property-kicker">Managed stock</div>
        <div className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[var(--property-ink)]">
          {managed}
        </div>
        <p className="mt-3 text-sm leading-7 text-[var(--property-ink-soft)]">
          Listings currently running through HenryCo managed-property rails.
        </p>
      </div>
      <div className="property-paper rounded-[1.8rem] p-5">
        <div className="property-kicker">Featured surfaces</div>
        <div className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[var(--property-ink)]">
          {featured}
        </div>
        <p className="mt-3 text-sm leading-7 text-[var(--property-ink-soft)]">
          Listings currently elevated across editorial and campaign surfaces.
        </p>
      </div>
      <div className="property-paper rounded-[1.8rem] p-5">
        <div className="property-kicker">Managed value</div>
        <div className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[var(--property-ink)]">
          {formatCompactNumber(portfolioValue)}
        </div>
        <p className="mt-3 text-sm leading-7 text-[var(--property-ink-soft)]">
          Combined managed-property portfolio value under HenryCo trust operations.
        </p>
      </div>
    </div>
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
    <div className="property-paper rounded-[1.8rem] p-5">
      <div className="flex items-center gap-3 text-[var(--property-accent-strong)]">
        {icon || <Sparkles className="h-5 w-5" />}
      </div>
      <div className="mt-4 text-lg font-semibold text-[var(--property-ink)]">{title}</div>
      <p className="mt-2 text-sm leading-7 text-[var(--property-ink-soft)]">{body}</p>
    </div>
  );
}
