import { requireStudioUser } from "@/lib/studio/auth";
import { studioClientSnapshot } from "@/lib/studio/data";
import { clientNav } from "@/lib/studio/navigation";
import { getStudioSnapshot } from "@/lib/studio/store";
import { StudioWorkspaceShell } from "@/components/studio/workspace/shell";

export default async function ClientReviewsPage() {
  const viewer = await requireStudioUser("/client/reviews");
  const snapshot = await getStudioSnapshot();
  const clientData = studioClientSnapshot(viewer, snapshot);

  return (
    <StudioWorkspaceShell
      kicker="Client reviews"
      title="Published Studio feedback tied to your projects."
      description="This keeps the final trust layer visible after delivery and makes it easy to revisit what was already published."
      nav={clientNav("/client/reviews")}
    >
      <section className="grid gap-4 lg:grid-cols-2">
        {clientData.reviews.map((review) => (
          <article key={review.id} className="studio-panel rounded-[1.75rem] p-6">
            <div className="text-sm font-semibold text-[var(--studio-ink)]">{review.customerName}</div>
            <div className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--studio-signal)]">
              Rating {review.rating}/5
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--studio-ink-soft)]">{review.quote}</p>
          </article>
        ))}
      </section>
    </StudioWorkspaceShell>
  );
}
