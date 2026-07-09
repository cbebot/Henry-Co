import { redirect } from "next/navigation";
import { getDivisionUrl } from "@henryco/config";
import { getAccountCopy } from "@henryco/i18n/server";
import { formatAccountTemplate } from "@henryco/i18n";
import {
  HeroCard,
  EmptyStateCard,
  NextStepRow,
  DivisionLanding,
  type HeroCardTile,
  type HeroCardBreakdownRow,
} from "@henryco/dashboard-shell/surfaces";

import { requireAccountUser } from "@/lib/auth";
import { DivisionResumeChip } from "@/components/recovery/DivisionResumeChip";
import { getDivisionActivity } from "@/lib/division-data";
import { getAccountAppLocale } from "@/lib/locale-server";
import { getSavedPropertiesForUser } from "@/lib/property-module";

import "@/components/property/styles.css";
import { PropertyActivity, type PropertyActivityRow } from "@/components/property/PropertyActivity";
import {
  SavedPropertiesGallery,
  type SavedPropertyCard as SavedPropertyCardView,
} from "@/components/property/SavedPropertiesGallery";
import {
  activityBreakdown,
  countByActivity,
  heroState,
  propertyStats,
} from "@/components/property/helpers";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getAccountAppLocale();
  const copy = getAccountCopy(locale).divisionProperty;
  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
  };
}

type PropertyPageProps = {
  searchParams: Promise<{ panel?: string }>;
};

/**
 * Property landing.
 *
 * ACCOUNT-PREMIUM-01 (session 2, Phase 2B). Lifts PropertyHero into HeroCard,
 * preserves SavedPropertiesGallery (first-class image rendering), adds a
 * NextStepRow for follow-up on saved property when an inquiry is in flight.
 */
export default async function PropertyPage({ searchParams }: PropertyPageProps) {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const copy = getAccountCopy(locale).divisionProperty;

  const params = await searchParams;
  if (params.panel === "saved") {
    redirect("/property/saved");
  }

  const [activity, savedProperties] = await Promise.all([
    getDivisionActivity(user.id, "property", 20, locale),
    getSavedPropertiesForUser(user.id),
  ]);

  const inquiryCount = countByActivity(activity, ["property_inquiry"]);
  const viewingCount = countByActivity(activity, ["property_viewing_requested"]);
  const listingCount = countByActivity(activity, [
    "property_listing_submitted",
    "property_listing_updated",
    "property_listing_reviewed",
  ]);
  const managedCount = savedProperties.filter((p) => p.managedByHenryCo).length;
  const stats = propertyStats(
    savedProperties.length,
    inquiryCount,
    viewingCount,
    listingCount,
    managedCount,
  );

  const propertyOrigin = getDivisionUrl("property");
  const state = heroState(stats);

  // ── HeroCard composition ─────────────────────────────────────────
  const headline =
    state === "empty"
      ? copy.hero.state.empty.headline
      : state === "active"
        ? stats.viewings > 0
          ? formatAccountTemplate(
              stats.viewings === 1
                ? copy.hero.state.active.viewingHeadlineTemplateSingular
                : copy.hero.state.active.viewingHeadlineTemplatePlural,
              { count: stats.viewings },
            )
          : formatAccountTemplate(
              stats.inquiries === 1
                ? copy.hero.state.active.inquiryHeadlineTemplateSingular
                : copy.hero.state.active.inquiryHeadlineTemplatePlural,
              { count: stats.inquiries },
            )
        : formatAccountTemplate(
            stats.saved === 1
              ? copy.hero.state.discover.headlineTemplateSingular
              : copy.hero.state.discover.headlineTemplatePlural,
            { count: stats.saved },
          );

  const heroBlurb =
    state === "empty"
      ? copy.hero.state.empty.blurb
      : state === "active"
        ? copy.hero.state.active.blurb
        : copy.hero.state.discover.blurb;

  const tiles: ReadonlyArray<HeroCardTile> = [
    {
      label: copy.hero.tileLabels.saved,
      value: stats.saved,
      foot:
        stats.saved === 0
          ? copy.hero.tileFoot.savedEmpty
          : managedCount > 0
            ? formatAccountTemplate(copy.hero.tileFoot.savedManagedTemplate, {
                count: managedCount,
              })
            : copy.hero.tileFoot.savedWith,
    },
    {
      label: copy.hero.tileLabels.inquiries,
      value: stats.inquiries,
      foot:
        stats.inquiries === 0
          ? copy.hero.tileFoot.inquiriesEmpty
          : copy.hero.tileFoot.inquiriesWith,
      tone: stats.inquiries > 0 ? "active" : "default",
    },
    {
      label: copy.hero.tileLabels.viewings,
      value: stats.viewings,
      foot:
        stats.viewings === 0
          ? copy.hero.tileFoot.viewingsEmpty
          : copy.hero.tileFoot.viewingsWith,
      tone: stats.viewings > 0 ? "warning" : "default",
    },
    {
      label: copy.hero.tileLabels.listings,
      value: stats.listings,
      foot:
        stats.listings === 0
          ? copy.hero.tileFoot.listingsEmpty
          : copy.hero.tileFoot.listingsWith,
    },
  ];

  const breakdownRows = activityBreakdown(stats, copy.hero.breakdownLabels);
  const breakdown: ReadonlyArray<HeroCardBreakdownRow> = breakdownRows.map((row) => ({
    label: row.label,
    count: row.count,
    color: row.color,
  }));

  // ── NextStepRow: follow-up on an inquiry against a saved property ─
  let nextStep: React.ReactNode = null;
  if (stats.inquiries > 0 && savedProperties.length > 0) {
    const top = savedProperties[0];
    nextStep = (
      <NextStepRow
        tone="attention"
        kicker={copy.hero.tileLabels.inquiries}
        title={top.title}
        detail={top.location || top.district || undefined}
        cta={{
          label: copy.hero.savedShortlistCta,
          href: "/property/saved",
        }}
      />
    );
  }

  const savedView: SavedPropertyCardView[] = savedProperties.slice(0, 8).map((p) => ({
    listingId: p.listingId,
    slug: p.slug,
    title: p.title,
    location: p.location || null,
    district: p.district || null,
    kind: p.kind || null,
    status: p.status || null,
    price: p.price ?? null,
    currency: p.currency || "NGN",
    priceInterval: p.priceInterval || null,
    heroImage: p.heroImage || null,
    managedByHenryCo: p.managedByHenryCo,
    featured: p.featured,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    sizeSqm: p.sizeSqm,
    savedAt: p.savedAt,
    detailUrl: p.detailUrl,
  }));

  const activityRows: PropertyActivityRow[] = (activity as Array<Record<string, unknown>>)
    .filter((row) => {
      const t = String(row.activity_type || "");
      return t.startsWith("property_") && t !== "property_unsaved";
    })
    .slice(0, 12)
    .map((row) => ({
      id: String(row.id || `${row.activity_type}-${row.created_at}`),
      activityType: row.activity_type ? String(row.activity_type) : null,
      title: row.title ? String(row.title) : null,
      description: row.description ? String(row.description) : null,
      status: row.status ? String(row.status) : null,
      occurredAt: String(row.created_at || ""),
      actionUrl: row.action_url ? String(row.action_url) : null,
    }));

  const savedMeta =
    stats.saved === 0
      ? copy.sections.savedMetaEmpty
      : formatAccountTemplate(copy.sections.savedMetaTemplate, {
          saved: stats.saved,
          managed: managedCount,
        });

  const activityMeta =
    activityRows.length === 0
      ? copy.sections.activityMetaEmpty
      : formatAccountTemplate(
          activityRows.length === 1
            ? copy.sections.activityMetaTemplateSingular
            : copy.sections.activityMetaTemplatePlural,
          { count: activityRows.length },
        );

  const heroTone: "calm" | "active" | "attention" | "empty" =
    state === "empty"
      ? "empty"
      : state === "active"
        ? stats.inquiries > 0
          ? "attention"
          : "active"
        : "calm";

  return (
    <DivisionLanding
      className="acct-prop acct-fade-in"
      hero={
        <HeroCard
          variant="paired"
          tone={heroTone}
          eyebrow={copy.hero.eyebrow}
          headline={headline}
          blurb={heroBlurb}
          ariaLabel={copy.hero.ariaLabel}
          ariaTilesLabel={copy.hero.tilesAriaLabel}
          ctaPrimary={{
            label: copy.hero.browseListingsCta,
            href: propertyOrigin,
            newTab: true,
          }}
          ctaSecondary={{
            label: copy.hero.savedShortlistCta,
            href: "/property/saved",
          }}
          tiles={tiles}
          side={{
            kicker: copy.hero.sideKicker,
            title: copy.hero.sideTitle,
            body: stats.total === 0 ? copy.hero.sideBodyMuted : copy.hero.sideBody,
            breakdown:
              breakdown.length > 0
                ? {
                    label: copy.hero.breakdownLabel,
                    rows: breakdown,
                    ariaLabel: copy.hero.breakdownAriaLabel,
                  }
                : undefined,
          }}
        />
      }
      nextStep={
        <>
          {/* SP6: division-scoped resume chip — renders only when a REAL pending journey exists here. */}
          <DivisionResumeChip division="property" userId={user.id} />
          {nextStep}
        </>
      }
      sections={[
        {
          id: "acct-prop-saved",
          title: copy.sections.saved,
          meta: savedMeta,
          content: (
            <SavedPropertiesGallery
              saved={savedView}
              emptyTitle={copy.empty.savedTitle}
              emptyBody={copy.empty.savedBody}
              copy={copy.gallery}
            />
          ),
        },
        {
          id: "acct-prop-activity",
          title: copy.sections.activity,
          meta: activityMeta,
          content:
            activityRows.length === 0 ? (
              <EmptyStateCard
                kicker={copy.sections.activity}
                title={copy.empty.activityTitle}
                body={copy.empty.activityBody}
              />
            ) : (
              <PropertyActivity
                activity={activityRows}
                ariaLabel={copy.activity.ariaLabel}
                titleLabels={copy.activity.titles}
              />
            ),
        },
      ]}
    />
  );
}
