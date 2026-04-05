import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarRange, Heart, ShieldCheck } from "lucide-react";
import { PropertyPendingButton } from "@/components/property/form-status";
import {
  PropertyAgentCard,
  PropertyListingCard,
  PropertyQuickFacts,
  PropertySectionIntro,
  PropertyStatusBadge,
} from "@/components/property/ui";
import { getPropertyDashboardData, getPropertyBySlug } from "@/lib/property/data";
import { getPropertyViewer } from "@/lib/property/auth";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = {
  inquiry?: string;
  viewing?: string;
  saved?: string;
  removed?: string;
};

export default async function PropertyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const messages = await searchParams;
  const data = await getPropertyBySlug(slug);
  const viewer = await getPropertyViewer();

  if (!data || data.listing.status !== "approved") {
    notFound();
  }

  const accountData = viewer.user ? await getPropertyDashboardData() : null;
  const isSaved = Boolean(accountData?.savedListings.some((item) => item.id === data.listing.id));

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-10 sm:px-8 lg:px-10">
      <PropertySectionIntro
        kicker={data.listing.locationLabel}
        title={data.listing.title}
        description={data.listing.description}
      />

      <div className="mt-6 space-y-3">
        {messages.inquiry === "sent" ? (
          <div className="rounded-[1.5rem] border border-[rgba(152,179,154,0.3)] bg-[rgba(152,179,154,0.12)] px-4 py-3 text-sm text-[var(--property-sage-soft)]">
            Inquiry submitted. The record is now in HenryCo Property’s follow-up queue.
          </div>
        ) : null}
        {messages.viewing === "requested" ? (
          <div className="rounded-[1.5rem] border border-[rgba(152,179,154,0.3)] bg-[rgba(152,179,154,0.12)] px-4 py-3 text-sm text-[var(--property-sage-soft)]">
            Viewing request submitted. Scheduling and reminder follow-up are now active.
          </div>
        ) : null}
        {messages.saved === "1" || messages.removed === "1" ? (
          <div className="rounded-[1.5rem] border border-[var(--property-line)] bg-black/10 px-4 py-3 text-sm text-[var(--property-ink-soft)]">
            {messages.saved === "1"
              ? "Property saved to your HenryCo account history."
              : "Property removed from saved listings."}
          </div>
        ) : null}
      </div>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <div className="space-y-6">
          <div className="property-paper overflow-hidden rounded-[2.2rem]">
            <div className="relative aspect-[16/10]">
              <Image
                src={data.listing.heroImage}
                alt={data.listing.title}
                fill
                sizes="(max-width: 1280px) 100vw, 60vw"
                className="object-cover"
              />
            </div>
            {data.listing.gallery.length > 1 ? (
              <div className="grid gap-3 p-4 md:grid-cols-3">
                {data.listing.gallery.slice(1, 4).map((image) => (
                  <div key={image} className="relative aspect-[4/3] overflow-hidden rounded-[1.4rem]">
                    <Image
                      src={image}
                      alt={data.listing.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 30vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <PropertyQuickFacts listing={data.listing} />

          <div className="property-panel rounded-[2rem] p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <PropertyStatusBadge status={data.listing.status} />
              {data.listing.trustBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-[var(--property-line)] px-3 py-1 text-xs text-[var(--property-ink-soft)]"
                >
                  {badge}
                </span>
              ))}
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <div className="property-kicker">Highlights</div>
                <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--property-ink-soft)]">
                  {data.listing.headlineMetrics.map((item) => (
                    <div key={item}>• {item}</div>
                  ))}
                </div>
              </div>
              <div>
                <div className="property-kicker">Verification notes</div>
                <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--property-ink-soft)]">
                  {data.listing.verificationNotes.map((item) => (
                    <div key={item}>• {item}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="property-kicker">Amenities</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {data.listing.amenities.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[var(--property-line)] px-3 py-1 text-xs text-[var(--property-ink-soft)]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {data.agent ? <PropertyAgentCard agent={data.agent} /> : null}
        </div>

        <div className="space-y-6">
          <aside className="property-panel rounded-[2rem] p-6 sm:p-8">
            <div className="property-kicker">Summary</div>
            <div className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--property-ink)]">
              {formatCurrency(data.listing.price, data.listing.currency)}
            </div>
            <div className="mt-2 text-sm text-[var(--property-ink-soft)]">{data.listing.priceInterval}</div>

            <div className="mt-6 space-y-3 text-sm text-[var(--property-ink-soft)]">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-[var(--property-accent-strong)]" />
                {data.listing.locationLabel}
              </div>
              <div className="flex items-center gap-3">
                <CalendarRange className="h-4 w-4 text-[var(--property-accent-strong)]" />
                {data.listing.availableNow
                  ? "Available now"
                  : `Available from ${formatDate(data.listing.availableFrom)}`}
              </div>
            </div>

            <div className="mt-6">
              {viewer.user ? (
                <form action="/api/property" method="POST">
                  <input type="hidden" name="intent" value="wishlist_toggle" />
                  <input type="hidden" name="listing_id" value={data.listing.id} />
                  <input type="hidden" name="return_to" value={`/property/${data.listing.slug}`} />
                  <PropertyPendingButton
                    idleLabel={isSaved ? "Remove from saved" : "Save property"}
                    pendingLabel={isSaved ? "Updating saved state" : "Saving property"}
                    variant="secondary"
                    idleIcon={<Heart className="h-4 w-4" />}
                    className="px-5"
                  />
                </form>
              ) : (
                <Link
                  href={`/login?next=${encodeURIComponent(`/property/${data.listing.slug}`)}`}
                  className="property-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                >
                  <Heart className="h-4 w-4" />
                  Sign in to save
                </Link>
              )}
            </div>
          </aside>

          <section className="property-panel rounded-[2rem] p-6 sm:p-8">
            <div className="property-kicker">Inquiry</div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--property-ink)]">
              Ask about this property
            </h2>
            <form action="/api/property" method="POST" className="mt-6 space-y-4">
              <input type="hidden" name="intent" value="inquiry_submit" />
              <input type="hidden" name="listing_id" value={data.listing.id} />
              <input type="hidden" name="return_to" value={`/property/${data.listing.slug}`} />

              <label className="block">
                <span className="text-sm font-medium text-[var(--property-ink)]">Name</span>
                <input
                  name="name"
                  required
                  defaultValue={viewer.user?.fullName || ""}
                  className="property-input mt-2 rounded-2xl px-4 py-3"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[var(--property-ink)]">Email</span>
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={viewer.user?.email || ""}
                  className="property-input mt-2 rounded-2xl px-4 py-3"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[var(--property-ink)]">Phone</span>
                <input
                  name="phone"
                  className="property-input mt-2 rounded-2xl px-4 py-3"
                  placeholder="+234..."
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[var(--property-ink)]">Message</span>
                <textarea
                  name="message"
                  required
                  rows={4}
                  className="property-textarea mt-2 rounded-2xl px-4 py-3"
                  placeholder="What would you like HenryCo Property to clarify for you?"
                />
              </label>

              <PropertyPendingButton
                idleLabel="Submit inquiry"
                pendingLabel="Submitting inquiry"
              />
            </form>
          </section>

          <section className="property-panel rounded-[2rem] p-6 sm:p-8">
            <div className="property-kicker">Viewing request</div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--property-ink)]">
              Request a viewing
            </h2>
            <form action="/api/property" method="POST" className="mt-6 space-y-4">
              <input type="hidden" name="intent" value="viewing_request" />
              <input type="hidden" name="listing_id" value={data.listing.id} />
              <input type="hidden" name="return_to" value={`/property/${data.listing.slug}`} />

              <label className="block">
                <span className="text-sm font-medium text-[var(--property-ink)]">Attendee name</span>
                <input
                  name="attendee_name"
                  required
                  defaultValue={viewer.user?.fullName || ""}
                  className="property-input mt-2 rounded-2xl px-4 py-3"
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-[var(--property-ink)]">Email</span>
                  <input
                    name="attendee_email"
                    type="email"
                    required
                    defaultValue={viewer.user?.email || ""}
                    className="property-input mt-2 rounded-2xl px-4 py-3"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-[var(--property-ink)]">Phone</span>
                  <input name="attendee_phone" className="property-input mt-2 rounded-2xl px-4 py-3" />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-[var(--property-ink)]">Preferred time</span>
                  <input
                    name="preferred_date"
                    type="datetime-local"
                    required
                    className="property-input mt-2 rounded-2xl px-4 py-3"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-[var(--property-ink)]">Backup time</span>
                  <input
                    name="backup_date"
                    type="datetime-local"
                    className="property-input mt-2 rounded-2xl px-4 py-3"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-[var(--property-ink)]">Notes</span>
                <textarea
                  name="notes"
                  rows={3}
                  className="property-textarea mt-2 rounded-2xl px-4 py-3"
                  placeholder="Access, household schedule, or questions for the viewing team."
                />
              </label>
              <PropertyPendingButton
                idleLabel="Request viewing"
                pendingLabel="Requesting viewing"
              />
            </form>
          </section>
        </div>
      </section>

      {data.related.length ? (
        <section className="mt-12">
          <PropertySectionIntro
            kicker="Related listings"
            title="Other homes and spaces worth shortlisting."
            description="Similar inventory in the same area or category, surfaced with the same editorial standard."
          />
          <div className="mt-8 grid gap-5 xl:grid-cols-3">
            {data.related.map((listing) => (
              <PropertyListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
