"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareQuote, ShieldCheck, Star } from "lucide-react";
import { HenryCoActivityIndicator } from "@henryco/ui";
import { useMarketplaceRuntime } from "@/components/marketplace/runtime-provider";
import type { MarketplaceReview } from "@/lib/marketplace/types";

type ReviewProductOption = {
  slug: string;
  title: string;
};

type AccountReviewsClientProps = {
  products: ReviewProductOption[];
  initialReviews: MarketplaceReview[];
};

const emptyForm = {
  product_slug: "",
  rating: "5",
  title: "",
  body: "",
};

export function AccountReviewsClient({ products, initialReviews }: AccountReviewsClientProps) {
  const router = useRouter();
  const { pushToast } = useMarketplaceRuntime();
  const [form, setForm] = useState(emptyForm);
  const [reviews, setReviews] = useState(initialReviews);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = new FormData();
      payload.set("intent", "review_submit");
      payload.set("response_mode", "json");
      payload.set("product_slug", form.product_slug);
      payload.set("rating", form.rating);
      payload.set("title", form.title);
      payload.set("body", form.body);

      const response = await fetch("/api/marketplace", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: payload,
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string; review?: MarketplaceReview; mode?: "published" | "pending" }
        | null;

      if (!response.ok || !result?.review) {
        throw new Error(result?.error || "Review submission failed.");
      }

      setReviews((current) => [result.review!, ...current.filter((item) => item.id !== result.review!.id)]);
      setForm((current) => ({
        ...emptyForm,
        product_slug: current.product_slug,
        rating: current.rating,
      }));
      pushToast(
        result.mode === "published" ? "Review published" : "Review submitted",
        "success",
        result.mode === "published"
          ? "Your verified review is now contributing to product and seller trust."
          : "Your review is in moderation because we could not verify the purchase automatically."
      );
      startTransition(() => router.refresh());
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Review submission failed.";
      setError(message);
      pushToast("Review submission failed", "error", message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="market-paper rounded-[1.75rem] p-5">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--market-line)] bg-[var(--market-bg-elevated)] text-[var(--market-brass)]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--market-paper-white)]">Review policy</p>
            <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">
              Verified purchases publish immediately and feed product plus seller trust. Unverified reviews still count
              as evidence, but they enter moderation first instead of inflating trust instantly.
            </p>
          </div>
        </div>
      </section>

      <form onSubmit={(event) => void submitReview(event)} className="market-paper rounded-[1.75rem] p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <select
            value={form.product_slug}
            onChange={(event) => setForm((current) => ({ ...current, product_slug: event.target.value }))}
            className="market-select rounded-2xl px-4 py-3"
            required
          >
            <option value="">Select product</option>
            {products.map((product) => (
              <option key={product.slug} value={product.slug}>
                {product.title}
              </option>
            ))}
          </select>
          <select
            value={form.rating}
            onChange={(event) => setForm((current) => ({ ...current, rating: event.target.value }))}
            className="market-select rounded-2xl px-4 py-3"
            required
          >
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {rating} star{rating === 1 ? "" : "s"}
              </option>
            ))}
          </select>
          <input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            className="market-input rounded-2xl px-4 py-3 md:col-span-2"
            placeholder="Review title"
            required
          />
          <textarea
            value={form.body}
            onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
            rows={4}
            className="market-textarea rounded-[1.5rem] px-4 py-3 md:col-span-2"
            placeholder="Share what the product and delivery experience felt like."
            required
          />
        </div>
        {error ? (
          <p className="mt-4 rounded-[1.2rem] bg-[rgba(126,33,18,0.08)] px-4 py-3 text-sm font-medium text-[var(--market-alert)]">
            {error}
          </p>
        ) : null}
        <button className="market-button-primary mt-4 inline-flex min-h-[46px] items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold">
          {submitting ? (
            <>
              <HenryCoActivityIndicator size="sm" className="text-[var(--market-noir)]" label="Submitting review" />
              Submitting...
            </>
          ) : (
            "Submit review"
          )}
        </button>
      </form>

      {!reviews.length ? (
        <section className="market-soft rounded-[1.7rem] p-6 text-center">
          <p className="text-xl font-semibold text-[var(--market-paper-white)]">No reviews yet.</p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[var(--market-muted)]">
            Verified purchase reviews will appear here once you start submitting feedback through the protected account flow.
          </p>
        </section>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <article key={review.id} className="market-paper rounded-[1.75rem] p-5">
              <div className="flex flex-wrap items-center gap-3">
                <p className="market-kicker">{review.productSlug}</p>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                    review.status === "published"
                      ? "bg-[rgba(144,215,186,0.12)] text-[var(--market-success)]"
                      : "bg-[rgba(117,209,255,0.12)] text-[var(--market-sky)]"
                  }`}
                >
                  {review.status.replace(/_/g, " ")}
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--market-brass)]">
                  <Star className="h-4 w-4 fill-current" />
                  {review.rating}
                </span>
              </div>
              <h2 className="mt-3 text-xl font-semibold text-[var(--market-ink)]">{review.title}</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">{review.body}</p>
              <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[var(--market-muted)]">
                <MessageSquareQuote className="h-3.5 w-3.5" />
                {review.verifiedPurchase ? "Verified purchase" : "Awaiting moderation confirmation"}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
