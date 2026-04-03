import Link from "next/link";
import {
  PropertyEmptyState,
  PropertyMetricCard,
  PropertyStatusBadge,
  PropertyWorkspaceShell,
} from "@/components/property/ui";
import { getOwnerWorkspaceData } from "@/lib/property/data";
import { getWorkspaceNavigation } from "@/lib/property/navigation";
import { requirePropertyUser } from "@/lib/property/auth";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OwnerWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; decision?: string }>;
}) {
  await requirePropertyUser("/owner");
  const [data, params] = await Promise.all([getOwnerWorkspaceData(), searchParams]);

  return (
    <PropertyWorkspaceShell
      kicker="Owner"
      title="Owner submission and listing visibility"
      description="This surface is for owners and relationship managers who need a cleaner record of submissions, review states, and incoming responses."
      nav={getWorkspaceNavigation("/owner")}
      actions={
        <Link
          href="/submit"
          className="property-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
        >
          Submit property
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <PropertyMetricCard
          label="Listings"
          value={String(data.listings.length)}
          hint="Properties attributed to your owner profile."
        />
        <PropertyMetricCard
          label="Applications"
          value={String(data.applications.length)}
          hint="Verification-backed submission records."
        />
        <PropertyMetricCard
          label="Inquiries"
          value={String(data.inquiries.length)}
          hint="Owner-visible lead activity mirrored into your workspace."
        />
      </div>

      {params.updated === "1" ? (
        <div className="rounded-[1.5rem] border border-[rgba(152,179,154,0.3)] bg-[rgba(152,179,154,0.12)] px-4 py-3 text-sm text-[var(--property-sage-soft)]">
          Listing updated and re-queued where required.
        </div>
      ) : null}
      {params.decision ? (
        <div className="rounded-[1.5rem] border border-[var(--property-line)] bg-black/10 px-4 py-3 text-sm text-[var(--property-ink-soft)]">
          Latest moderation outcome: {params.decision.replaceAll("_", " ")}.
        </div>
      ) : null}

      <section className="property-panel rounded-[2rem] p-6 sm:p-8">
        <div className="property-kicker">Portfolio records</div>
        {data.listings.length ? (
          <div className="mt-5 space-y-4">
            {data.listings.map((listing) => (
              <div
                key={listing.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4"
              >
                <div>
                  <div className="text-lg font-semibold text-[var(--property-ink)]">{listing.title}</div>
                  <div className="mt-1 text-sm text-[var(--property-ink-soft)]">
                    {listing.locationLabel} · {formatCurrency(listing.price, listing.currency)}
                  </div>
                </div>
                <PropertyStatusBadge status={listing.status} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <PropertyEmptyState
              title="No listings in your workspace yet."
              body="Submit your first property and HenryCo Property will open a moderation-backed listing record for you."
              action={
                <Link
                  href="/submit"
                  className="property-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
                >
                  Submit a listing
                </Link>
              }
            />
          </div>
        )}
      </section>

      {data.listings.length ? (
        <section className="space-y-6">
          {data.listings.map((listing) => (
            <section
              key={listing.id}
              data-testid={`owner-listing-workspace-${listing.id}`}
              className="property-panel rounded-[2rem] p-6 sm:p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="property-kicker">Listing workspace</div>
                  <div className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--property-ink)]">
                    {listing.title}
                  </div>
                  <div className="mt-1 text-sm text-[var(--property-ink-soft)]">
                    {formatCurrency(listing.price, listing.currency)} · {listing.locationLabel}
                  </div>
                </div>
                <PropertyStatusBadge status={listing.status} />
              </div>

              <form action="/api/property" method="POST" encType="multipart/form-data" className="mt-6 space-y-4">
                <input type="hidden" name="intent" value="listing_update" />
                <input type="hidden" name="listing_id" value={listing.id} />
                <input type="hidden" name="return_to" value="/owner" />

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-[var(--property-ink)]">Summary</span>
                    <textarea
                      name="summary"
                      rows={3}
                      defaultValue={listing.summary}
                      aria-label="Summary"
                      className="property-textarea mt-2 rounded-2xl px-4 py-3"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-[var(--property-ink)]">Description</span>
                    <textarea
                      name="description"
                      rows={3}
                      defaultValue={listing.description}
                      aria-label="Description"
                      className="property-textarea mt-2 rounded-2xl px-4 py-3"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <label className="block">
                    <span className="text-sm font-medium text-[var(--property-ink)]">Price</span>
                    <input
                      name="price"
                      type="number"
                      min="0"
                      defaultValue={listing.price}
                      aria-label="Price"
                      className="property-input mt-2 rounded-2xl px-4 py-3"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-[var(--property-ink)]">Interval</span>
                    <input
                      name="price_interval"
                      defaultValue={listing.priceInterval}
                      aria-label="Interval"
                      className="property-input mt-2 rounded-2xl px-4 py-3"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-[var(--property-ink)]">Beds</span>
                    <input
                      name="bedrooms"
                      type="number"
                      min="0"
                      defaultValue={listing.bedrooms ?? ""}
                      aria-label="Beds"
                      className="property-input mt-2 rounded-2xl px-4 py-3"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-[var(--property-ink)]">Baths</span>
                    <input
                      name="bathrooms"
                      type="number"
                      min="0"
                      defaultValue={listing.bathrooms ?? ""}
                      aria-label="Baths"
                      className="property-input mt-2 rounded-2xl px-4 py-3"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-[var(--property-ink)]">Amenities</span>
                    <textarea
                      name="amenities"
                      rows={3}
                      defaultValue={listing.amenities.join(", ")}
                      aria-label="Amenities"
                      className="property-textarea mt-2 rounded-2xl px-4 py-3"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-[var(--property-ink)]">Additional media URLs</span>
                    <textarea
                      name="gallery_urls"
                      rows={3}
                      aria-label="Additional media URLs"
                      className="property-textarea mt-2 rounded-2xl px-4 py-3"
                      placeholder="Paste new image URLs here, one per line."
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-[var(--property-ink)]">Upload new media</span>
                    <input name="media" type="file" multiple accept="image/*" aria-label="Upload new media" className="property-input mt-2 rounded-2xl px-4 py-3" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-[var(--property-ink)]">Add verification docs</span>
                    <input
                      name="verification_docs"
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      aria-label="Add verification docs"
                      className="property-input mt-2 rounded-2xl px-4 py-3"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-[var(--property-ink-soft)]">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" name="furnished" value="1" defaultChecked={listing.furnished} />
                    Furnished
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" name="pet_friendly" value="1" defaultChecked={listing.petFriendly} />
                    Pet friendly
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" name="shortlet_ready" value="1" defaultChecked={listing.shortletReady} />
                    Short-let ready
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="managed_by_henryco"
                      value="1"
                      defaultChecked={listing.managedByHenryCo}
                    />
                    HenryCo managed
                  </label>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="property-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
                  >
                    Save and resubmit
                  </button>
                  <Link
                    href={`/property/${listing.slug}`}
                    className="property-button-secondary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
                  >
                    View public page
                  </Link>
                </div>
              </form>
            </section>
          ))}
        </section>
      ) : null}
    </PropertyWorkspaceShell>
  );
}
