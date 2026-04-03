import { EmptyState, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData, getMarketplaceHomeData } from "@/lib/marketplace/data";
import { accountNav } from "@/lib/marketplace/navigation";

export const dynamic = "force-dynamic";

export default async function AccountReviewsPage() {
  await requireMarketplaceUser("/account/reviews");
  const [buyer, snapshot] = await Promise.all([getBuyerDashboardData(), getMarketplaceHomeData()]);

  return (
    <WorkspaceShell
      title="Reviews"
      description="Verified purchase reviews, moderation state, and trust contribution stay visible here instead of disappearing after checkout."
      nav={accountNav("/account/reviews")}
    >
      <form action="/api/marketplace" method="POST" className="market-paper rounded-[1.75rem] p-5">
        <input type="hidden" name="intent" value="review_submit" />
        <input type="hidden" name="return_to" value="/account/reviews" />
        <div className="grid gap-4 md:grid-cols-2">
          <select name="product_slug" className="market-select rounded-2xl px-4 py-3" required>
            <option value="">Select product</option>
            {snapshot.products.map((product) => (
              <option key={product.slug} value={product.slug}>
                {product.title}
              </option>
            ))}
          </select>
          <select name="rating" className="market-select rounded-2xl px-4 py-3" required defaultValue="5">
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {rating} star{rating === 1 ? "" : "s"}
              </option>
            ))}
          </select>
          <input name="title" className="market-input rounded-2xl px-4 py-3 md:col-span-2" placeholder="Review title" required />
          <textarea name="body" rows={4} className="market-textarea rounded-[1.5rem] px-4 py-3 md:col-span-2" placeholder="Share what the product and delivery experience felt like." required />
        </div>
        <button className="market-button-primary mt-4 rounded-full px-5 py-3 text-sm font-semibold">Submit review</button>
      </form>

      {buyer.reviews.length ? (
        <div className="space-y-4">
          {buyer.reviews.map((review) => (
            <article key={review.id} className="market-paper rounded-[1.75rem] p-5">
              <p className="market-kicker">{review.productSlug} · {review.status}</p>
              <h2 className="mt-3 text-xl font-semibold text-[var(--market-ink)]">{review.title}</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">{review.body}</p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No reviews yet." body="Verified purchase reviews will land here after delivery." />
      )}
    </WorkspaceShell>
  );
}
