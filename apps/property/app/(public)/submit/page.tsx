import Link from "next/link";
import { PropertySectionIntro } from "@/components/property/ui";
import { PropertyPendingButton } from "@/components/property/form-status";
import { getPropertyViewer } from "@/lib/property/auth";
import { getPropertySnapshot } from "@/lib/property/data";
import { getSharedAccountPropertyUrl } from "@/lib/property/links";

export const dynamic = "force-dynamic";

export default async function SubmitListingPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const params = await searchParams;
  const snapshot = await getPropertySnapshot();
  const viewer = await getPropertyViewer();

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-10 sm:px-8 lg:px-10">
      <PropertySectionIntro
        kicker="Submit"
        title="Submit a property for editorial review, trust checks, and premium marketing."
        description="Owners and agents can submit listings with media, verification documents, and contact context. HenryCo Property reviews the submission before it becomes public."
      />

      {params.submitted === "1" ? (
        <div className="mt-6 rounded-[1.8rem] border border-[rgba(152,179,154,0.3)] bg-[rgba(152,179,154,0.12)] px-5 py-4 text-sm text-[var(--property-sage-soft)]">
          Listing submitted. HenryCo Property logged the record, queued moderation, and routed the
          follow-up notification flow.
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="property-panel rounded-[2.3rem] p-6 sm:p-8">
          <div className="property-kicker">Submission standards</div>
          <div className="mt-6 space-y-4">
            {[
              ["Editorial review", "Weak copy, weak media, and unclear pricing do not go public untouched."],
              ["Trust checks", "Owner details, verification files, and readiness notes are attached before approval."],
              ["Managed upsell path", "Relevant submissions can move into HenryCo managed-property operations after review."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-5">
                <div className="text-xl font-semibold text-[var(--property-ink)]">{title}</div>
                <p className="mt-2 text-sm leading-7 text-[var(--property-ink-soft)]">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[1.8rem] border border-[var(--property-line)] bg-black/10 p-5 text-sm leading-7 text-[var(--property-ink-soft)]">
            Signed in as:{" "}
            <span className="font-semibold text-[var(--property-ink)]">
              {viewer.user?.email || "guest submission"}
            </span>
            . Your submission will be linked to your HenryCo account.
          </div>
        </section>

        <section id="submission" className="property-panel rounded-[2.3rem] p-6 sm:p-8">
          <form action="/api/property" method="POST" encType="multipart/form-data" className="space-y-5">
            <input type="hidden" name="intent" value="listing_submit" />
            <input type="hidden" name="return_to" value="/submit" />

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-[var(--property-ink)]">Owner or agent name</span>
                <input
                  name="owner_name"
                  required
                  defaultValue={viewer.user?.fullName || ""}
                  className="property-input mt-2 rounded-2xl px-4 py-3"
                  placeholder="Adaeze Okonkwo"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[var(--property-ink)]">Email</span>
                <input
                  name="owner_email"
                  type="email"
                  required
                  defaultValue={viewer.user?.email || ""}
                  className="property-input mt-2 rounded-2xl px-4 py-3"
                  placeholder="owner@company.com"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[var(--property-ink)]">Phone</span>
                <input
                  name="owner_phone"
                  required
                  className="property-input mt-2 rounded-2xl px-4 py-3"
                  placeholder="+234..."
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[var(--property-ink)]">Listing type</span>
                <select name="kind" required className="property-select mt-2 rounded-2xl px-4 py-3">
                  <option value="rent">Residential rent</option>
                  <option value="sale">Residential sale</option>
                  <option value="commercial">Commercial</option>
                  <option value="managed">Managed</option>
                  <option value="shortlet">Short-let</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-[var(--property-ink)]">Listing title</span>
              <input
                name="title"
                required
                className="property-input mt-2 rounded-2xl px-4 py-3"
                placeholder="Harbour Crest Penthouse"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-[var(--property-ink)]">Short summary</span>
                <textarea
                  name="summary"
                  required
                  rows={4}
                  className="property-textarea mt-2 rounded-2xl px-4 py-3"
                  placeholder="One decisive paragraph that frames the property well."
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[var(--property-ink)]">Description</span>
                <textarea
                  name="description"
                  required
                  rows={4}
                  className="property-textarea mt-2 rounded-2xl px-4 py-3"
                  placeholder="Tell HenryCo what matters about the space, occupancy fit, and readiness."
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="text-sm font-medium text-[var(--property-ink)]">Area</span>
                <select name="location_slug" required className="property-select mt-2 rounded-2xl px-4 py-3">
                  {snapshot.areas.map((area) => (
                    <option key={area.id} value={area.slug}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[var(--property-ink)]">Location label</span>
                <input
                  name="location_label"
                  required
                  className="property-input mt-2 rounded-2xl px-4 py-3"
                  placeholder="Ikoyi, Lagos"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[var(--property-ink)]">District</span>
                <input
                  name="district"
                  required
                  className="property-input mt-2 rounded-2xl px-4 py-3"
                  placeholder="Bourdillon"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-[var(--property-ink)]">Address line</span>
              <input
                name="address_line"
                required
                className="property-input mt-2 rounded-2xl px-4 py-3"
                placeholder="Street name or estate"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-4">
              <label className="block">
                <span className="text-sm font-medium text-[var(--property-ink)]">Price</span>
                <input name="price" type="number" min="0" required className="property-input mt-2 rounded-2xl px-4 py-3" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[var(--property-ink)]">Interval</span>
                <input
                  name="price_interval"
                  required
                  className="property-input mt-2 rounded-2xl px-4 py-3"
                  placeholder="per year"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[var(--property-ink)]">Beds</span>
                <input name="bedrooms" type="number" min="0" className="property-input mt-2 rounded-2xl px-4 py-3" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[var(--property-ink)]">Baths</span>
                <input name="bathrooms" type="number" min="0" className="property-input mt-2 rounded-2xl px-4 py-3" />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-[var(--property-ink)]">Amenities</span>
                <textarea
                  name="amenities"
                  rows={3}
                  className="property-textarea mt-2 rounded-2xl px-4 py-3"
                  placeholder="Generator, smart security, rooftop terrace..."
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[var(--property-ink)]">Existing media URLs</span>
                <textarea
                  name="gallery_urls"
                  rows={3}
                  className="property-textarea mt-2 rounded-2xl px-4 py-3"
                  placeholder="One URL per line if assets already exist online."
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-[var(--property-ink)]">Upload media</span>
                <input name="media" type="file" multiple accept="image/*" className="property-input mt-2 rounded-2xl px-4 py-3" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[var(--property-ink)]">Verification documents</span>
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
                <input type="checkbox" name="furnished" value="1" />
                Furnished
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" name="pet_friendly" value="1" />
                Pet friendly
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" name="shortlet_ready" value="1" />
                Short-let ready
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" name="managed_by_henryco" value="1" />
                Request HenryCo management
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <PropertyPendingButton
                idleLabel="Submit listing"
                pendingLabel="Submitting listing"
              />
              <Link
                href={getSharedAccountPropertyUrl("listings")}
                className="property-button-secondary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
              >
                Open property account
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
