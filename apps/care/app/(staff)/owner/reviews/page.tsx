import Image from "next/image";
import PendingSubmitButton from "@/components/forms/PendingSubmitButton";
import { getAdminReviews } from "@/lib/admin/care-admin";
import { deleteReviewAction, setReviewApprovalAction } from "../actions";

const SOURCE_ROUTE = "/owner/reviews";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function OwnerReviewsPage() {
  const reviews = await getAdminReviews();

  return (
    <div className="space-y-8">
      <section className="rounded-[36px] border border-white/10 bg-white/[0.04] p-8">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
          Reviews
        </div>
        <h2 className="mt-2 text-4xl font-black text-white">Approve customer stories</h2>
        <p className="mt-3 max-w-2xl text-white/65">
          Reviews only appear publicly after approval. Optional customer photos are shown here
          before you decide whether the story is ready for the brand.
        </p>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-lg font-bold text-white">{review.customer_name}</div>
                  <div className="text-sm text-white/50">
                    {review.city || "No city"} • {formatDate(review.created_at)}
                  </div>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                    review.is_approved
                      ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                      : "border border-amber-400/20 bg-amber-500/10 text-amber-100"
                  }`}
                >
                  {review.is_approved ? "Approved" : "Pending"}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-1 text-[color:var(--accent-strong)]">
                {Array.from({ length: Math.max(0, Math.min(5, review.rating || 0)) }).map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>

              <p className="mt-4 text-sm leading-relaxed text-white/75">{review.review_text}</p>

              {review.photo_url ? (
                <div className="mt-4 overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.04]">
                  <Image
                    src={review.photo_url}
                    alt={`Uploaded review photo from ${review.customer_name}`}
                    width={1200}
                    height={900}
                    unoptimized
                    className="h-60 w-full object-cover"
                  />
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                <form action={setReviewApprovalAction}>
                  <input type="hidden" name="id" value={review.id} />
                  <input type="hidden" name="approved" value="true" />
                  <input type="hidden" name="source_route" value={SOURCE_ROUTE} />
                  <PendingSubmitButton
                    label="Approve"
                    pendingLabel="Approving..."
                  />
                </form>

                <form action={setReviewApprovalAction}>
                  <input type="hidden" name="id" value={review.id} />
                  <input type="hidden" name="approved" value="false" />
                  <input type="hidden" name="source_route" value={SOURCE_ROUTE} />
                  <PendingSubmitButton
                    label="Hide from public"
                    pendingLabel="Updating..."
                    variant="secondary"
                  />
                </form>

                <form action={deleteReviewAction}>
                  <input type="hidden" name="id" value={review.id} />
                  <input type="hidden" name="source_route" value={SOURCE_ROUTE} />
                  <PendingSubmitButton
                    label="Delete review"
                    pendingLabel="Deleting..."
                    variant="danger"
                  />
                </form>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-16 text-center text-white/55 xl:col-span-2">
            No reviews yet.
          </div>
        )}
      </div>
    </div>
  );
}
