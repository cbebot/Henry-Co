import { redirect } from "next/navigation";
import { getDivisionUrl } from "@henryco/config";

import { requireAccountUser } from "@/lib/auth";
import { getDivisionActivity } from "@/lib/division-data";
import { getSavedPropertiesForUser } from "@/lib/property-module";

import "@/components/property/styles.css";
import { PropertyHero } from "@/components/property/PropertyHero";
import { PropertyActivity, type PropertyActivityRow } from "@/components/property/PropertyActivity";
import {
  SavedPropertiesGallery,
  type SavedPropertyCard as SavedPropertyCardView,
} from "@/components/property/SavedPropertiesGallery";
import { countByActivity, propertyStats } from "@/components/property/helpers";

export const dynamic = "force-dynamic";

type PropertyPageProps = {
  searchParams: Promise<{ panel?: string }>;
};

export default async function PropertyPage({ searchParams }: PropertyPageProps) {
  const user = await requireAccountUser();
  const params = await searchParams;
  if (params.panel === "saved") {
    redirect("/property/saved");
  }

  const [activity, savedProperties] = await Promise.all([
    getDivisionActivity(user.id, "property"),
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

  return (
    <div className="acct-prop acct-fade-in">
      <PropertyHero stats={stats} propertyOrigin={propertyOrigin} />

      <section aria-labelledby="acct-prop-saved">
        <div className="acct-prop__section-head">
          <h2 id="acct-prop-saved" className="acct-prop__section-title">
            Saved shortlist
          </h2>
          <span className="acct-prop__section-meta">
            {stats.saved === 0
              ? "Save listings on HenryCo Property to build your shortlist."
              : `${stats.saved} saved · ${managedCount} managed by HenryCo`}
          </span>
        </div>
        <SavedPropertiesGallery
          saved={savedView}
          emptyTitle="No saved properties yet"
          emptyBody="Discover residential rentals, sale listings, and HenryCo-managed homes on Property. Anything you save lands here automatically."
        />
      </section>

      <section aria-labelledby="acct-prop-activity">
        <div className="acct-prop__section-head">
          <h2 id="acct-prop-activity" className="acct-prop__section-title">
            Recent activity
          </h2>
          <span className="acct-prop__section-meta">
            {activityRows.length === 0
              ? "Inquiries, viewings, and listing reviews mirror here as they happen."
              : `${activityRows.length} update${activityRows.length === 1 ? "" : "s"} · most recent first`}
          </span>
        </div>
        {activityRows.length === 0 ? (
          <div className="acct-prop__empty">
            <strong>No property activity yet</strong>
            Open a listing on HenryCo Property to request a viewing or send an inquiry — every step from your first message through review will appear here.
          </div>
        ) : (
          <PropertyActivity activity={activityRows} />
        )}
      </section>
    </div>
  );
}
