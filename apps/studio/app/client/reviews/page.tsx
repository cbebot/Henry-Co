import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Quote, Star } from "lucide-react";
import { getStudioClientPagesCopy } from "@henryco/i18n";
import { requireStudioUser } from "@/lib/studio/auth";
import { studioClientSnapshot } from "@/lib/studio/data";
import { getStudioSnapshot } from "@/lib/studio/store";
import { getStudioPublicLocale } from "@/lib/locale-server";
import { PortalEmptyState } from "@/components/portal/empty-state";

type StudioClientPagesCopy = ReturnType<typeof getStudioClientPagesCopy>;

export const metadata: Metadata = {
  title: "Reviews",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ClientReviewsPage() {
  const viewer = await requireStudioUser("/client/reviews");
  const snapshot = await getStudioSnapshot();
  const clientData = studioClientSnapshot(viewer, snapshot);
  const locale = await getStudioPublicLocale();
  const copy = getStudioClientPagesCopy(locale);

  if (clientData.reviews.length === 0) {
    return (
      <div className="space-y-6">
        <Header copy={copy} />
        <PortalEmptyState
          icon={Star}
          title={copy.reviews.emptyTitle}
          body={copy.reviews.emptyBody}
          action={
            <Link href="/client" className="portal-button portal-button-secondary">
              {copy.reviews.openWorkspace}
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      </div>
    );
  }

  const titleByProject = new Map(clientData.projects.map((p) => [p.id, p.title]));

  return (
    <div className="space-y-7">
      <Header copy={copy} />

      <section className="grid gap-3 lg:grid-cols-2">
        {clientData.reviews.map((review) => (
          <article
            key={review.id}
            className="portal-card relative flex flex-col gap-4 px-5 py-5"
          >
            <Quote
              className="absolute right-4 top-4 h-5 w-5 text-[var(--studio-line-strong)]"
              aria-hidden
            />
            <div className="flex items-center gap-1 text-[var(--studio-signal)]">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star
                  key={idx}
                  className={`h-3.5 w-3.5 ${
                    idx < review.rating ? "fill-current" : "opacity-20"
                  }`}
                  aria-hidden
                />
              ))}
              <span className="ml-1.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
                {review.rating}/5
              </span>
            </div>

            <p className="text-[13.5px] leading-6 text-[var(--studio-ink)]">
              {review.quote}
            </p>

            <div className="mt-auto flex items-baseline justify-between gap-3 border-t border-[var(--studio-line)] pt-3">
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-[var(--studio-ink)]">
                  {review.customerName}
                </div>
                {review.company ? (
                  <div className="truncate text-[11.5px] text-[var(--studio-ink-soft)]">
                    {review.company}
                  </div>
                ) : null}
              </div>
              {titleByProject.has(review.projectId) ? (
                <Link
                  href={`/client/projects/${review.projectId}`}
                  className="text-[11.5px] font-semibold text-[var(--studio-signal)] hover:underline"
                >
                  {titleByProject.get(review.projectId)}
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function Header({ copy }: { copy: StudioClientPagesCopy }) {
  return (
    <header>
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
        {copy.reviews.kicker}
      </div>
      <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.02em] text-[var(--studio-ink)] sm:text-3xl">
        {copy.reviews.title}
      </h1>
      <p className="mt-2 max-w-2xl text-[13.5px] leading-6 text-[var(--studio-ink-soft)]">
        {copy.reviews.body}
      </p>
    </header>
  );
}
