import { EmptyState, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData, getMarketplaceHomeData } from "@/lib/marketplace/data";
import type { MarketplaceReview } from "@/lib/marketplace/types";
import { accountNav } from "@/lib/marketplace/navigation";

export const dynamic = "force-dynamic";

type SearchParams = {
  submitted?: string;
  error?: string;
};

const STATUS_COPY: Record<string, { label: string; tone: "pending" | "ok" | "hidden" }> = {
  pending: { label: "Awaiting moderation", tone: "pending" },
  published: { label: "Published", tone: "ok" },
  hidden: { label: "Hidden", tone: "hidden" },
};

export default async function AccountReviewsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireMarketplaceUser("/account/reviews");
  const [buyer, snapshot, params] = await Promise.all([
    getBuyerDashboardData(),
    getMarketplaceHomeData(),
    searchParams,
  ]);

  const toast = params.submitted
    ? { tone: "success" as const, label: "Review submitted. Verified reviews publish instantly; unverified ones wait for moderation." }
    : params.error
      ? { tone: "error" as const, label: "We could not save that review. Check the form and try again." }
      : null;

  return (
    <WorkspaceShell
      title="Reviews"
      description="Verified purchase reviews, moderation state, and trust contribution stay visible here instead of disappearing after checkout."
      nav={accountNav("/account/reviews")}
    >
      {toast ? (
        <div
          className={`rounded-[1.25rem] border px-4 py-3 text-sm font-medium ${
            toast.tone === "success"
              ? "border-[rgba(76,201,160,0.35)] bg-[rgba(76,201,160,0.12)] text-[var(--market-success,#4CC9A0)]"
              : "border-[rgba(232,88,88,0.35)] bg-[rgba(232,88,88,0.12)] text-[var(--market-alert,#F87171)]"
          }`}
        >
          {toast.label}
        </div>
      ) : null}

      <form
        action="/api/marketplace"
        method="POST"
        className="market-paper rounded-[1.75rem] p-5"
      >
        <input type="hidden" name="intent" value="review_submit" />
        <input type="hidden" name="return_to" value="/account/reviews" />
        <div className="grid gap-4 md:grid-cols-2">
          <select
            name="product_slug"
            className="market-select rounded-2xl px-4 py-3"
            required
          >
            <option value="">Select product</option>
            {snapshot.products.map((product) => (
              <option key={product.slug} value={product.slug}>
                {product.title}
              </option>
            ))}
          </select>
          <select
            name="rating"
            className="market-select rounded-2xl px-4 py-3"
            required
            defaultValue="5"
          >
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {"★".repeat(rating)}
                {"☆".repeat(5 - rating)} · {rating} star{rating === 1 ? "" : "s"}
              </option>
            ))}
          </select>
          <input
            name="title"
            className="market-input rounded-2xl px-4 py-3 md:col-span-2"
            placeholder="Review title"
            required
            maxLength={120}
          />
          <textarea
            name="body"
            rows={4}
            className="market-textarea rounded-[1.5rem] px-4 py-3 md:col-span-2"
            placeholder="Share what the product and delivery experience felt like. Verified purchase reviews publish immediately."
            required
            minLength={20}
            maxLength={2000}
          />
        </div>
        <p className="mt-3 text-xs text-[var(--market-muted)]">
          Reviews from verified orders publish instantly. Reviews without a matching order go to moderation to protect seller reputation.
        </p>
        <button className="market-button-primary mt-4 rounded-full px-5 py-3 text-sm font-semibold">
          Submit review
        </button>
      </form>

      {buyer.reviews.length ? (
        <div className="space-y-4">
          {buyer.reviews.map((review: MarketplaceReview) => {
            const statusMeta = STATUS_COPY[review.status] || STATUS_COPY.pending;
            return (
              <article
                key={review.id}
                className="market-paper rounded-[1.75rem] p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="market-kicker">{review.productSlug}</p>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                      statusMeta.tone === "ok"
                        ? "bg-[rgba(76,201,160,0.15)] text-[var(--market-success,#4CC9A0)]"
                        : statusMeta.tone === "pending"
                          ? "bg-[rgba(246,240,222,0.14)] text-[var(--market-paper-white)]"
                          : "bg-[rgba(232,88,88,0.15)] text-[var(--market-alert,#F87171)]"
                    }`}
                  >
                    {statusMeta.label}
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-semibold text-[var(--market-ink)]">
                  {review.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">
                  {review.body}
                </p>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No reviews yet."
          body="Verified purchase reviews will land here after delivery."
        />
      )}
    </WorkspaceShell>
  );
}
