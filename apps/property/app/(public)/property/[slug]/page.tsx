import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createDivisionMetadata, toSeoDescription } from "@henryco/config";
import {
  CalendarRange,
  FileCheck2,
  Heart,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PropertyPendingButton } from "@/components/property/form-status";
import {
  PropertyAgentCard,
  PropertyListingCard,
  PropertyQuickFacts,
  PropertySectionIntro,
  PropertyStatusBadge,
} from "@/components/property/ui";
import { PropertyPublicAuthGate } from "@/components/property/public-auth-gate";
import { getPropertyDashboardData, getPropertyBySlug } from "@/lib/property/data";
import { getPropertyViewer } from "@/lib/property/auth";
import {
  getPropertyOrigin,
  getSharedAccountLoginUrl,
  getSharedAccountPropertyUrl,
  getSharedAccountSignupUrl,
} from "@/lib/property/links";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPropertyBySlug(slug);

  if (!data || !["published", "approved"].includes(data.listing.status)) {
    return createDivisionMetadata("property", {
      title: "Property not found | HenryCo Property",
      description: "The requested property listing could not be found.",
      path: `/property/${slug}`,
      noIndex: true,
    });
  }

  const description = toSeoDescription(data.listing.summary, data.listing.description, 158);

  return createDivisionMetadata("property", {
    title: `${data.listing.title} | HenryCo Property`,
    description,
    openGraphTitle: data.listing.title,
    openGraphDescription: description,
    path: `/property/${data.listing.slug}`,
    images: data.listing.heroImage
      ? [{ url: data.listing.heroImage, alt: data.listing.title }]
      : undefined,
  });
}

type SearchParams = {
  inquiry?: string;
  viewing?: string;
  saved?: string;
  removed?: string;
};

function getTrustCopy(listing: NonNullable<Awaited<ReturnType<typeof getPropertyBySlug>>>["listing"]) {
  if (listing.managedByHenryCo) {
    return {
      title: "Managed by HenryCo",
      body:
        "HenryCo is involved beyond publication. That usually means clearer viewing coordination, tighter listing upkeep, and a more reliable post-inquiry path.",
      bullets: [
        "Viewing coordination can stay with HenryCo instead of being passed around informally.",
        "Listing updates and follow-through are handled with stronger operational continuity.",
        "Managed properties can still require documents or extra checks before the next step moves forward.",
      ],
    };
  }

  if (listing.trustBadges.some((badge) => badge.toLowerCase().includes("review"))) {
    return {
      title: "Reviewed before publication",
      body:
        "This listing is not appearing here as an untouched upload. HenryCo has already reviewed the record before showing it publicly.",
      bullets: [
        "Trust notes stay visible so seekers understand what has been checked.",
        "Publication does not remove the possibility of later document or access verification.",
        "If the listing changes materially, it can move back into review.",
      ],
    };
  }

  return {
    title: "Serious-listing standard",
    body:
      "HenryCo expects pricing, media, and listing identity to be strong enough for real decision-making before a property is promoted publicly.",
    bullets: [
      "If a viewing is requested, HenryCo may still confirm access, location, or readiness before the appointment.",
      "Higher-risk listings can move through extra checks even after they appear live.",
      "Managed and verified labels reflect a stronger operating path than a basic submission.",
    ],
  };
}

function getViewingFlow(listingTitle: string) {
  return [
    {
      title: "1. Request is logged",
      body: `Your request for ${listingTitle} is written into HenryCo Property's viewing queue instead of being left in a chat thread.`,
    },
    {
      title: "2. Access and location are confirmed",
      body:
        "A HenryCo agent may confirm the property location, access conditions, or calendar before your appointment is finalised.",
    },
    {
      title: "3. Post-viewing checks stay clear",
      body:
        "If you want to move forward, HenryCo may request identity, affordability, or company documents before the next approval step.",
    },
  ];
}

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

  if (!data || !["published", "approved"].includes(data.listing.status)) {
    notFound();
  }

  const accountData = viewer.user ? await getPropertyDashboardData() : null;
  const myInquiry =
    accountData?.inquiries
      .filter((item) => item.listingId === data.listing.id)
      .sort((left, right) => (left.updatedAt < right.updatedAt ? 1 : -1))[0] || null;
  const myViewing =
    accountData?.viewings
      .filter((item) => item.listingId === data.listing.id)
      .sort((left, right) => (left.updatedAt < right.updatedAt ? 1 : -1))[0] || null;
  const isSaved = Boolean(
    accountData?.savedListings.some((item) => item.id === data.listing.id)
  );
  const propertyOrigin = getPropertyOrigin();
  const returnPath = `/property/${data.listing.slug}`;
  const loginHref = getSharedAccountLoginUrl({ nextPath: returnPath, propertyOrigin });
  const signupHref = getSharedAccountSignupUrl({ nextPath: returnPath, propertyOrigin });
  const trustCopy = getTrustCopy(data.listing);
  const viewingFlow = getViewingFlow(data.listing.title);

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
            Inquiry submitted. HenryCo Property has placed it in the follow-up queue and the next response will stay tied to your account.
          </div>
        ) : null}
        {messages.viewing === "requested" ? (
          <div className="rounded-[1.5rem] border border-[rgba(152,179,154,0.3)] bg-[rgba(152,179,154,0.12)] px-4 py-3 text-sm text-[var(--property-sage-soft)]">
            Viewing request submitted. Scheduling, reminders, and any verification follow-up are now attached to a recorded workflow.
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

          <section className="property-panel rounded-[2rem] p-6 sm:p-8">
            <div className="property-kicker">Listing trust</div>
            <div className="mt-4 flex items-start gap-3">
              <div className="rounded-full bg-[rgba(191,122,71,0.12)] p-3 text-[var(--property-accent-strong)]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--property-ink)]">
                  {trustCopy.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--property-ink-soft)]">
                  {trustCopy.body}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm leading-7 text-[var(--property-ink-soft)]">
              {trustCopy.bullets.map((bullet) => (
                <p key={bullet}>• {bullet}</p>
              ))}
            </div>
          </section>

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

          {viewer.user && (myInquiry || myViewing) ? (
            <section className="property-panel rounded-[2rem] p-6 sm:p-8">
              <div className="property-kicker">Your progress on this property</div>
              <div className="mt-5 space-y-4">
                {myInquiry ? (
                  <div className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-[var(--property-ink)]">
                          Inquiry status
                        </div>
                        <p className="mt-1 text-sm text-[var(--property-ink-soft)]">
                          Your last inquiry is being tracked in the HenryCo account timeline.
                        </p>
                      </div>
                      <PropertyStatusBadge status={myInquiry.status} />
                    </div>
                  </div>
                ) : null}
                {myViewing ? (
                  <div className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-[var(--property-ink)]">
                          Viewing status
                        </div>
                        <p className="mt-1 text-sm text-[var(--property-ink-soft)]">
                          Preferred: {formatDate(myViewing.preferredDate)}
                          {myViewing.scheduledFor ? ` · Scheduled: ${formatDate(myViewing.scheduledFor)}` : ""}
                        </p>
                      </div>
                      <PropertyStatusBadge status={myViewing.status} />
                    </div>
                  </div>
                ) : null}
                <Link
                  href={getSharedAccountPropertyUrl(myViewing ? "viewings" : "inquiries")}
                  className="property-button-secondary inline-flex rounded-full px-5 py-3 text-sm font-semibold"
                >
                  Open full account timeline
                </Link>
              </div>
            </section>
          ) : null}

          <section className="property-panel rounded-[2rem] p-6 sm:p-8">
            <div className="property-kicker">What happens after you request a viewing</div>
            <div className="mt-5 grid gap-4">
              {viewingFlow.map((step) => (
                <div
                  key={step.title}
                  className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-[rgba(152,179,154,0.12)] p-2 text-[var(--property-sage-soft)]">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <h2 className="text-lg font-semibold text-[var(--property-ink)]">{step.title}</h2>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--property-ink-soft)]">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="property-panel rounded-[2rem] p-6 sm:p-8">
            <div className="property-kicker">Inquiry</div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--property-ink)]">
              Ask about this property
            </h2>
            {viewer.user ? (
              <form action="/api/property" method="POST" className="mt-6 space-y-4">
                <input type="hidden" name="intent" value="inquiry_submit" />
                <input type="hidden" name="listing_id" value={data.listing.id} />
                <input type="hidden" name="return_to" value={`/property/${data.listing.slug}`} />

                <label className="block">
                  <span className="text-sm font-medium text-[var(--property-ink)]">Name</span>
                  <input
                    name="name"
                    required
                    defaultValue={viewer.user.fullName || ""}
                    className="property-input mt-2 rounded-2xl px-4 py-3"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-[var(--property-ink)]">Email</span>
                  <input
                    name="email"
                    type="email"
                    required
                    defaultValue={viewer.user.email || ""}
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

                <p className="text-xs leading-6 text-[var(--property-ink-muted)]">
                  HenryCo uses your account so replies, clarifications, and the next trust checks stay in one place.
                </p>

                <PropertyPendingButton
                  idleLabel="Submit inquiry"
                  pendingLabel="Submitting inquiry"
                />
              </form>
            ) : (
              <div className="mt-6">
                <PropertyPublicAuthGate
                  title="Sign in to send an inquiry"
                  description="Inquiries are tied to your HenryCo account so agents can respond securely and you can track follow-up in one place."
                  loginHref={loginHref}
                  signupHref={signupHref}
                />
              </div>
            )}
          </section>

          <section className="property-panel rounded-[2rem] p-6 sm:p-8">
            <div className="property-kicker">Viewing request</div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[var(--property-ink)]">
              Request a viewing
            </h2>
            {viewer.user ? (
              <form action="/api/property" method="POST" className="mt-6 space-y-4">
                <input type="hidden" name="intent" value="viewing_request" />
                <input type="hidden" name="listing_id" value={data.listing.id} />
                <input type="hidden" name="return_to" value={`/property/${data.listing.slug}`} />

                <label className="block">
                  <span className="text-sm font-medium text-[var(--property-ink)]">Attendee name</span>
                  <input
                    name="attendee_name"
                    required
                    defaultValue={viewer.user.fullName || ""}
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
                      defaultValue={viewer.user.email || ""}
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

                <div className="rounded-[1.6rem] border border-[var(--property-line)] bg-black/10 p-4 text-xs leading-6 text-[var(--property-ink-muted)]">
                  <div className="flex items-center gap-2 text-[var(--property-ink)]">
                    <FileCheck2 className="h-4 w-4 text-[var(--property-accent-strong)]" />
                    What to expect
                  </div>
                  <p className="mt-2">
                    HenryCo may confirm access, location, or listing readiness before the appointment is fixed. If you want to move forward after the viewing, extra documents can still be requested depending on the property and next step.
                  </p>
                </div>

                <PropertyPendingButton
                  idleLabel="Request viewing"
                  pendingLabel="Requesting viewing"
                />
              </form>
            ) : (
              <div className="mt-6">
                <PropertyPublicAuthGate
                  title="Sign in to request a viewing"
                  description="Viewings are scheduled through your HenryCo account so confirmations, reminders, and updates stay in one secure timeline."
                  loginHref={loginHref}
                  signupHref={signupHref}
                />
              </div>
            )}
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
