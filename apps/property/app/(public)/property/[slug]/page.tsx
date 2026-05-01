import { PropertyImageGallery } from "@/components/property/PropertyImageGallery";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarRange,
  FileCheck2,
  Heart,
  ShieldCheck,
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

type SearchParams = {
  inquiry?: string;
  viewing?: string;
  saved?: string;
  removed?: string;
};

function getTrustCopy(
  listing: NonNullable<Awaited<ReturnType<typeof getPropertyBySlug>>>["listing"],
) {
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
      title: "Request is logged",
      body: `Your request for ${listingTitle} is written into HenryCo Property's viewing queue instead of being left in a chat thread.`,
    },
    {
      title: "Access and location are confirmed",
      body:
        "A HenryCo agent may confirm the property location, access conditions, or calendar before your appointment is finalised.",
    },
    {
      title: "Post-viewing checks stay clear",
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
    accountData?.savedListings.some((item) => item.id === data.listing.id),
  );
  const propertyOrigin = getPropertyOrigin();
  const returnPath = `/property/${data.listing.slug}`;
  const loginHref = getSharedAccountLoginUrl({ nextPath: returnPath, propertyOrigin });
  const signupHref = getSharedAccountSignupUrl({ nextPath: returnPath, propertyOrigin });
  const trustCopy = getTrustCopy(data.listing);
  const viewingFlow = getViewingFlow(data.listing.title);

  return (
    <main className="mx-auto max-w-[92rem] px-5 py-12 sm:px-8 lg:px-10">
      <PropertySectionIntro
        kicker={data.listing.locationLabel}
        title={data.listing.title}
        description={data.listing.description}
      />

      {/* Notification rail — editorial left-rule ribbons, no panels */}
      <div className="mt-6 space-y-3">
        {messages.inquiry === "sent" ? (
          <p className="border-l-2 border-[var(--property-sage-soft)]/55 pl-4 text-sm leading-7 text-[var(--property-sage-soft)]">
            Inquiry submitted. HenryCo Property has placed it in the follow-up queue and the next
            response will stay tied to your account.
          </p>
        ) : null}
        {messages.viewing === "requested" ? (
          <p className="border-l-2 border-[var(--property-sage-soft)]/55 pl-4 text-sm leading-7 text-[var(--property-sage-soft)]">
            Viewing request submitted. Scheduling, reminders, and any verification follow-up are
            now attached to a recorded workflow.
          </p>
        ) : null}
        {messages.saved === "1" || messages.removed === "1" ? (
          <p className="border-l-2 border-[var(--property-line)] pl-4 text-sm leading-7 text-[var(--property-ink-soft)]">
            {messages.saved === "1"
              ? "Property saved to your HenryCo account history."
              : "Property removed from saved listings."}
          </p>
        ) : null}
      </div>

      <section className="mt-10 grid gap-12 xl:grid-cols-[1.04fr_0.96fr]">
        <div className="space-y-12">
          {/* Gallery — clickable lightbox viewer with prev/next + thumb strip */}
          <PropertyImageGallery
            title={data.listing.title}
            hero={data.listing.heroImage}
            gallery={data.listing.gallery}
          />

          <PropertyQuickFacts listing={data.listing} />

          {/* Highlights + Verification + Amenities — editorial 2-col, no panel */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <PropertyStatusBadge status={data.listing.status} />
              {data.listing.trustBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-[var(--property-line)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--property-ink-soft)]"
                >
                  {badge}
                </span>
              ))}
            </div>

            <div className="mt-7 grid gap-10 md:grid-cols-2">
              <div>
                <p className="property-kicker">Highlights</p>
                <ul className="mt-4 divide-y divide-[var(--property-line)] border-y border-[var(--property-line)]">
                  {data.listing.headlineMetrics.map((item) => (
                    <li
                      key={item}
                      className="py-2.5 text-sm leading-7 text-[var(--property-ink-soft)]"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="property-kicker">Verification notes</p>
                <ul className="mt-4 divide-y divide-[var(--property-line)] border-y border-[var(--property-line)]">
                  {data.listing.verificationNotes.map((item) => (
                    <li
                      key={item}
                      className="py-2.5 text-sm leading-7 text-[var(--property-ink-soft)]"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {data.listing.amenities.length > 0 ? (
              <div className="mt-10">
                <p className="property-kicker">Amenities</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {data.listing.amenities.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[var(--property-line)] px-2.5 py-1 text-[11px] font-medium text-[var(--property-ink-soft)]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Listing trust — editorial split with left-rule */}
          <section>
            <div className="flex items-baseline gap-4">
              <p className="property-kicker">Listing trust</p>
              <span className="h-px flex-1 bg-[var(--property-line)]" />
            </div>
            <div className="mt-6 grid gap-8 md:grid-cols-[0.85fr,1.15fr]">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--property-line)] bg-[rgba(191,122,71,0.1)] text-[var(--property-accent-strong)]">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <h2 className="text-[1.45rem] font-semibold leading-tight tracking-[-0.015em] text-[var(--property-ink)] sm:text-[1.7rem]">
                  {trustCopy.title}
                </h2>
              </div>
              <div>
                <p className="text-sm leading-7 text-[var(--property-ink-soft)]">
                  {trustCopy.body}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {trustCopy.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex gap-2.5 text-sm leading-7 text-[var(--property-ink-soft)]"
                    >
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--property-accent-strong)]" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {data.agent ? <PropertyAgentCard agent={data.agent} /> : null}
        </div>

        <div className="space-y-12">
          {/* Pricing aside — editorial, no panel */}
          <aside className="lg:pt-2">
            <p className="property-kicker">Summary</p>
            <p className="mt-4 text-[2.4rem] font-semibold leading-tight tracking-[-0.025em] text-[var(--property-ink)] sm:text-[2.7rem]">
              {formatCurrency(data.listing.price, data.listing.currency)}
            </p>
            <p className="mt-2 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
              {data.listing.priceInterval}
            </p>

            <dl className="mt-7 divide-y divide-[var(--property-line)] border-y border-[var(--property-line)]">
              <div className="flex items-baseline gap-3 py-3">
                <ShieldCheck className="h-3.5 w-3.5 text-[var(--property-accent-strong)]" />
                <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
                  Location
                </dt>
                <dd className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--property-ink)]">
                  {data.listing.locationLabel}
                </dd>
              </div>
              <div className="flex items-baseline gap-3 py-3">
                <CalendarRange className="h-3.5 w-3.5 text-[var(--property-accent-strong)]" />
                <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
                  Availability
                </dt>
                <dd className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--property-ink)]">
                  {data.listing.availableNow
                    ? "Available now"
                    : `From ${formatDate(data.listing.availableFrom)}`}
                </dd>
              </div>
            </dl>

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
                  href={getSharedAccountLoginUrl({
                    nextPath: `/property/${data.listing.slug}`,
                    propertyOrigin: getPropertyOrigin(),
                  })}
                  className="property-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                >
                  <Heart className="h-4 w-4" />
                  Sign in to save
                </Link>
              )}
            </div>
          </aside>

          {/* Your progress — editorial, divided rows */}
          {viewer.user && (myInquiry || myViewing) ? (
            <section>
              <p className="property-kicker">Your progress on this property</p>
              <ul className="mt-5 divide-y divide-[var(--property-line)] border-y border-[var(--property-line)]">
                {myInquiry ? (
                  <li className="flex items-start justify-between gap-4 py-4">
                    <div>
                      <h3 className="text-[1rem] font-semibold tracking-tight text-[var(--property-ink)]">
                        Inquiry status
                      </h3>
                      <p className="mt-1 text-sm leading-7 text-[var(--property-ink-soft)]">
                        Tracked in the HenryCo account timeline.
                      </p>
                    </div>
                    <PropertyStatusBadge status={myInquiry.status} />
                  </li>
                ) : null}
                {myViewing ? (
                  <li className="flex items-start justify-between gap-4 py-4">
                    <div>
                      <h3 className="text-[1rem] font-semibold tracking-tight text-[var(--property-ink)]">
                        Viewing status
                      </h3>
                      <p className="mt-1 text-sm leading-7 text-[var(--property-ink-soft)]">
                        Preferred: {formatDate(myViewing.preferredDate)}
                        {myViewing.scheduledFor
                          ? ` · Scheduled: ${formatDate(myViewing.scheduledFor)}`
                          : ""}
                      </p>
                    </div>
                    <PropertyStatusBadge status={myViewing.status} />
                  </li>
                ) : null}
              </ul>
              <Link
                href={getSharedAccountPropertyUrl(myViewing ? "viewings" : "inquiries")}
                className="property-button-secondary mt-5 inline-flex rounded-full px-5 py-3 text-sm font-semibold"
              >
                Open full account timeline
              </Link>
            </section>
          ) : null}

          {/* Viewing flow — horizontal numbered timeline */}
          <section>
            <p className="property-kicker">What happens after you request a viewing</p>
            <ol className="mt-5 grid gap-6 md:grid-cols-3">
              {viewingFlow.map((step, i) => (
                <li
                  key={step.title}
                  className={`border-t border-[var(--property-line)] pt-5 ${
                    i > 0 ? "md:border-l md:border-t-0 md:pl-5 md:pt-0" : ""
                  }`}
                >
                  <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-accent-strong)]">
                    Step {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-3 text-[1rem] font-semibold leading-snug tracking-tight text-[var(--property-ink)]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--property-ink-soft)]">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          {/* Inquiry form — editorial, no panel */}
          <section>
            <p className="property-kicker">Inquiry</p>
            <h2 className="mt-4 max-w-md text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--property-ink)] sm:text-[1.85rem]">
              Ask about this property
            </h2>
            {viewer.user ? (
              <form action="/api/property" method="POST" className="mt-6 space-y-4">
                <input type="hidden" name="intent" value="inquiry_submit" />
                <input type="hidden" name="listing_id" value={data.listing.id} />
                <input type="hidden" name="return_to" value={`/property/${data.listing.slug}`} />

                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
                    Name
                  </span>
                  <input
                    name="name"
                    required
                    defaultValue={viewer.user.fullName || ""}
                    className="property-input mt-2 rounded-2xl px-4 py-3"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
                    Email
                  </span>
                  <input
                    name="email"
                    type="email"
                    required
                    defaultValue={viewer.user.email || ""}
                    className="property-input mt-2 rounded-2xl px-4 py-3"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
                    Phone
                  </span>
                  <input
                    name="phone"
                    className="property-input mt-2 rounded-2xl px-4 py-3"
                    placeholder="+234..."
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
                    Message
                  </span>
                  <textarea
                    name="message"
                    required
                    rows={4}
                    className="property-textarea mt-2 rounded-2xl px-4 py-3"
                    placeholder="What would you like HenryCo Property to clarify for you?"
                  />
                </label>

                <p className="text-xs leading-6 text-[var(--property-ink-muted)]">
                  HenryCo uses your account so replies, clarifications, and the next trust checks
                  stay in one place.
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

          {/* Viewing request form — editorial, no panel */}
          <section>
            <p className="property-kicker">Viewing request</p>
            <h2 className="mt-4 max-w-md text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--property-ink)] sm:text-[1.85rem]">
              Request a viewing
            </h2>
            {viewer.user ? (
              <form action="/api/property" method="POST" className="mt-6 space-y-4">
                <input type="hidden" name="intent" value="viewing_request" />
                <input type="hidden" name="listing_id" value={data.listing.id} />
                <input type="hidden" name="return_to" value={`/property/${data.listing.slug}`} />

                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
                    Attendee name
                  </span>
                  <input
                    name="attendee_name"
                    required
                    defaultValue={viewer.user.fullName || ""}
                    className="property-input mt-2 rounded-2xl px-4 py-3"
                  />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
                      Email
                    </span>
                    <input
                      name="attendee_email"
                      type="email"
                      required
                      defaultValue={viewer.user.email || ""}
                      className="property-input mt-2 rounded-2xl px-4 py-3"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
                      Phone
                    </span>
                    <input
                      name="attendee_phone"
                      className="property-input mt-2 rounded-2xl px-4 py-3"
                    />
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
                      Preferred time
                    </span>
                    <input
                      name="preferred_date"
                      type="datetime-local"
                      required
                      className="property-input mt-2 rounded-2xl px-4 py-3"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
                      Backup time
                    </span>
                    <input
                      name="backup_date"
                      type="datetime-local"
                      className="property-input mt-2 rounded-2xl px-4 py-3"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink-soft)]">
                    Notes
                  </span>
                  <textarea
                    name="notes"
                    rows={3}
                    className="property-textarea mt-2 rounded-2xl px-4 py-3"
                    placeholder="Access, household schedule, or questions for the viewing team."
                  />
                </label>

                <div className="border-l-2 border-[var(--property-accent-strong)]/55 pl-4 py-2">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="h-3.5 w-3.5 text-[var(--property-accent-strong)]" />
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--property-ink)]">
                      What to expect
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-6 text-[var(--property-ink-muted)]">
                    HenryCo may confirm access, location, or listing readiness before the
                    appointment is fixed. If you want to move forward after the viewing, extra
                    documents can still be requested depending on the property and next step.
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
        <section className="mt-16">
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
