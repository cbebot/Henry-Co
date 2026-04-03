import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Star, ThumbsUp } from "lucide-react";
import ReviewModerationControls from "@/components/support/ReviewModerationControls";
import {
  WorkspaceEmptyState,
  WorkspaceHero,
  WorkspaceInfoTile,
  WorkspaceMetricCard,
  WorkspacePanel,
  tonePillClasses,
} from "@/components/dashboard/WorkspacePrimitives";
import { getAdminReviews } from "@/lib/admin/care-admin";
import { getPermissions } from "@/lib/auth/permissions";
import { requireRoles } from "@/lib/auth/server";
import { logProtectedPageAccess } from "@/lib/security/logger";
import { getReviewSupportContext } from "@/lib/support/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Support Reviews | Henry & Co. Fabric Care",
  description:
    "Review moderation workspace for customer trust content and public approval decisions.",
};

type PageSearchParams = {
  q?: string | string[];
  status?: string | string[];
  review?: string | string[];
};

function readParam(value?: string | string[]) {
  return Array.isArray(value) ? String(value[0] || "").trim() : String(value || "").trim();
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function matchesQuery(review: Awaited<ReturnType<typeof getAdminReviews>>[number], query: string) {
  return JSON.stringify(review).toLowerCase().includes(query.toLowerCase());
}

function ratingLabel(value?: number | null) {
  const rating = Number(value || 0);
  if (rating >= 5) return "Exceptional";
  if (rating >= 4) return "Strong";
  if (rating >= 3) return "Mixed";
  return "Needs care";
}

export default async function SupportReviewsPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  const auth = await requireRoles(["owner", "manager", "support"]);
  const permissions = getPermissions(auth.profile.role);
  const params = (await searchParams) ?? {};
  const q = readParam(params.q);
  const status = readParam(params.status) || "pending";
  const selectedReviewId = readParam(params.review);

  await logProtectedPageAccess("/support/reviews", {
    q: q || null,
    status,
    selected_review: selectedReviewId || null,
  });

  const reviews = await getAdminReviews(220);
  const filtered = reviews
    .filter((review) => {
      if (status === "all") return true;
      if (status === "approved") return review.is_approved;
      return !review.is_approved;
    })
    .filter((review) => (q ? matchesQuery(review, q) : true));

  const selectedReview =
    filtered.find((review) => review.id === selectedReviewId) ?? filtered[0] ?? null;
  const contextMap = await getReviewSupportContext(
    selectedReview ? [selectedReview.id] : filtered.slice(0, 24).map((review) => review.id)
  );
  const selectedContext = selectedReview ? contextMap.get(selectedReview.id) : null;
  const pendingCount = reviews.filter((review) => !review.is_approved).length;
  const approvedCount = reviews.filter((review) => review.is_approved).length;
  const photoCount = reviews.filter((review) => Boolean(review.photo_url)).length;
  const lowRatingCount = reviews.filter((review) => Number(review.rating || 0) <= 3).length;

  return (
    <div className="space-y-8">
      <WorkspaceHero
        eyebrow="Review moderation"
        title="Protect the public trust surface with cleaner moderation."
        description="Support review handling now has a dedicated moderation desk. Review submissions stay easy to scan, image-backed entries are easier to inspect, and every approval decision preserves context from the booking record."
        actions={
          <>
            <Link
              href="/review"
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
            >
              Open public review page
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/support/notifications"
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
            >
              View support alerts
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        }
      />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <WorkspaceMetricCard
          icon={Star}
          label="Pending reviews"
          value={String(pendingCount)}
          note="Submissions waiting for moderation or follow-up."
        />
        <WorkspaceMetricCard
          icon={ThumbsUp}
          label="Approved reviews"
          value={String(approvedCount)}
          note="Customer voice already cleared for public display."
        />
        <WorkspaceMetricCard
          icon={ShieldCheck}
          label="Photo-backed entries"
          value={String(photoCount)}
          note="Visual proof helps the public trust surface feel more credible."
        />
        <WorkspaceMetricCard
          icon={Star}
          label="Low-rating watch"
          value={String(lowRatingCount)}
          note="Reviews at three stars or lower deserve extra attention."
        />
      </section>

      <WorkspacePanel
        eyebrow="Moderation queue"
        title="Review list and detail"
        subtitle="Search the queue, open a review, inspect the media and booking context, then make the next moderation decision."
      >
        <div className="grid gap-6 2xl:grid-cols-[320px_minmax(0,0.78fr)_minmax(0,1.22fr)]">
          <section className="rounded-[1.9rem] border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
              Queue filters
            </div>
            <form className="mt-5 grid gap-4" method="get">
              <label className="grid gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
                  Search
                </span>
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Customer name, review text, service type"
                  className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 outline-none transition focus:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
                  Review state
                </span>
                <select
                  name="status"
                  defaultValue={status}
                  className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 outline-none transition focus:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
                >
                  <option value="pending">Pending only</option>
                  <option value="approved">Approved only</option>
                  <option value="all">All reviews</option>
                </select>
              </label>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-[#07111F]"
                >
                  Apply filters
                </button>
                <Link
                  href="/support/reviews"
                  className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                >
                  Clear
                </Link>
              </div>
            </form>
          </section>

          <section className="rounded-[1.9rem] border border-black/10 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center justify-between gap-3 px-2 pb-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                  Queue rail
                </div>
                <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white">
                  Customer reviews
                </h3>
              </div>
              <div className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                {filtered.length} visible
              </div>
            </div>

            <div className="max-h-[66rem] space-y-3 overflow-y-auto pr-1">
              {filtered.length > 0 ? (
                filtered.map((review) => {
                  const active = selectedReview?.id === review.id;
                  const href = `/support/reviews?review=${encodeURIComponent(review.id)}${
                    q ? `&q=${encodeURIComponent(q)}` : ""
                  }&status=${encodeURIComponent(status)}`;

                  return (
                    <Link
                      key={review.id}
                      href={href}
                      className={`block rounded-[1.5rem] border p-4 transition ${
                        active
                          ? "border-[color:var(--accent)]/28 bg-[color:var(--accent)]/10 shadow-[0_18px_48px_rgba(56,72,184,0.12)]"
                          : "border-black/10 bg-black/[0.03] hover:border-black/15 hover:bg-black/[0.04] dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                            {ratingLabel(review.rating)} • {review.rating}/5
                          </div>
                          <div className="mt-1 truncate text-lg font-semibold text-zinc-950 dark:text-white">
                            {review.customer_name}
                          </div>
                          <div className="mt-1 text-sm text-zinc-500 dark:text-white/48">
                            {formatDateTime(review.created_at)}
                          </div>
                        </div>

                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${tonePillClasses(
                            review.is_approved ? "success" : "warning"
                          )}`}
                        >
                          {review.is_approved ? "approved" : "pending"}
                        </span>
                      </div>

                      <p className="mt-3 line-clamp-4 text-sm leading-7 text-zinc-600 dark:text-white/64">
                        {review.review_text}
                      </p>

                      {review.photo_url ? (
                        <div className="mt-4 overflow-hidden rounded-[1.1rem] border border-black/10 bg-white/75 dark:border-white/10 dark:bg-white/[0.05]">
                          <Image
                            src={review.photo_url}
                            alt={`Review photo from ${review.customer_name}`}
                            width={960}
                            height={640}
                            unoptimized
                            className="h-32 w-full object-cover"
                          />
                        </div>
                      ) : null}
                    </Link>
                  );
                })
              ) : (
                <WorkspaceEmptyState
                  title="No reviews matched this filter"
                  text="Try switching the moderation state or broadening the search."
                />
              )}
            </div>
          </section>

          <section className="rounded-[1.9rem] border border-black/10 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            {selectedReview ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                      Selected review
                    </div>
                    <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white">
                      {selectedReview.customer_name}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/64">
                      {selectedReview.review_text}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${tonePillClasses(
                      selectedReview.is_approved ? "success" : "warning"
                    )}`}
                  >
                    {selectedReview.is_approved ? "approved" : "pending"}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-lg text-[color:var(--accent)]">
                  {Array.from({
                    length: Math.max(0, Math.min(5, Number(selectedReview.rating || 0))),
                  }).map((_, index) => (
                    <span key={index}>★</span>
                  ))}
                </div>

                {selectedReview.photo_url ? (
                  <div className="overflow-hidden rounded-[1.6rem] border border-black/10 bg-white/75 dark:border-white/10 dark:bg-white/[0.05]">
                    <Image
                      src={selectedReview.photo_url}
                      alt={`Review photo from ${selectedReview.customer_name}`}
                      width={1200}
                      height={900}
                      unoptimized
                      className="h-72 w-full object-cover"
                    />
                  </div>
                ) : null}

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <WorkspaceInfoTile label="Submitted" value={formatDateTime(selectedReview.created_at)} />
                  <WorkspaceInfoTile
                    label="Tracking code"
                    value={selectedContext?.trackingCode || "Not captured"}
                  />
                  <WorkspaceInfoTile
                    label="Service family"
                    value={selectedContext?.serviceFamily || "Not captured"}
                  />
                  <WorkspaceInfoTile
                    label="Last moderation status"
                    value={selectedContext?.latestModerationStatus || "pending"}
                  />
                  <WorkspaceInfoTile
                    label="Moderator"
                    value={selectedContext?.latestModeratorName || "No moderator recorded yet"}
                    note={selectedContext?.latestModeratorRole || undefined}
                  />
                  <WorkspaceInfoTile
                    label="Last moderation note"
                    value={selectedContext?.latestModerationNote || "No moderation note recorded yet"}
                  />
                </div>

                {permissions.canApproveReviews ? (
                  <div className="rounded-[1.6rem] border border-black/10 bg-white/75 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                      Moderation controls
                    </div>
                    <div className="mt-4">
                      <ReviewModerationControls
                        reviewId={selectedReview.id}
                        initialNote={selectedContext?.latestModerationNote}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[1.6rem] border border-amber-300/30 bg-amber-500/10 p-4 text-sm leading-7 text-amber-700 dark:text-amber-100">
                    Your current role can inspect the moderation queue, but only owner and support roles can change approval state.
                  </div>
                )}
              </div>
            ) : (
              <WorkspaceEmptyState
                title="Choose a review"
                text="Select a review from the rail to inspect the media, booking context, and moderation history."
              />
            )}
          </section>
        </div>
      </WorkspacePanel>
    </div>
  );
}
