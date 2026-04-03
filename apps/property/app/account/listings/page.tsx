import Link from "next/link";
import {
  PropertyEmptyState,
  PropertyStatusBadge,
  PropertyWorkspaceShell,
} from "@/components/property/ui";
import { getPropertyDashboardData } from "@/lib/property/data";
import { getAccountNavigation } from "@/lib/property/navigation";
import { requirePropertyUser } from "@/lib/property/auth";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; decision?: string }>;
}) {
  await requirePropertyUser("/account/listings");
  const [data, params] = await Promise.all([getPropertyDashboardData(), searchParams]);

  return (
    <PropertyWorkspaceShell
      kicker="My listings"
      title="Owner and agent listing workspace"
      description="Review submission status, update listing details, add media, and resubmit changes without losing the underlying record history."
      nav={getAccountNavigation("/account/listings")}
      actions={
        <Link
          href="/submit"
          className="property-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
        >
          Submit another property
        </Link>
      }
    >
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

      {data.listings.length ? (
        <div className="space-y-6">
          {data.listings.map((listing) => (
            <section key={listing.id} className="property-panel rounded-[2rem] p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-2xl font-semibold tracking-[-0.04em] text-[var(--property-ink)]">
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
                <input type="hidden" name="return_to" value="/account/listings" />

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-[var(--property-ink)]">Summary</span>
                    <textarea
                      name="summary"
                      rows={3}
                      defaultValue={listing.summary}
                      className="property-textarea mt-2 rounded-2xl px-4 py-3"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-[var(--property-ink)]">Description</span>
                    <textarea
                      name="description"
                      rows={3}
                      defaultValue={listing.description}
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
                      className="property-input mt-2 rounded-2xl px-4 py-3"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-[var(--property-ink)]">Interval</span>
                    <input
                      name="price_interval"
                      defaultValue={listing.priceInterval}
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
                      className="property-textarea mt-2 rounded-2xl px-4 py-3"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-[var(--property-ink)]">Additional media URLs</span>
                    <textarea
                      name="gallery_urls"
                      rows={3}
                      className="property-textarea mt-2 rounded-2xl px-4 py-3"
                      placeholder="Paste new image URLs here, one per line."
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-[var(--property-ink)]">Upload new media</span>
                    <input name="media" type="file" multiple accept="image/*" className="property-input mt-2 rounded-2xl px-4 py-3" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-[var(--property-ink)]">Add verification docs</span>
                    <input
                      name="verification_docs"
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
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
        </div>
      ) : (
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
      )}
    </PropertyWorkspaceShell>
  );
}
