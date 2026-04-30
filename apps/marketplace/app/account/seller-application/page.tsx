import Link from "next/link";
import { EmptyState, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import { accountWorkspaceNav } from "@/lib/marketplace/navigation";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SellerApplicationPage() {
  await requireMarketplaceUser("/account/seller-application");
  const data = await getBuyerDashboardData();
  const application = data.application;

  return (
    <WorkspaceShell
      title="Seller application"
      description="Seller onboarding now lives in the protected account area so drafts, verification, moderation notes, and approval state stay structured instead of spilling into public clutter."
      {...accountWorkspaceNav("/account/seller-application")}
      actions={
        <Link
          href={
            application?.status === "approved"
              ? "/vendor/onboarding"
              : application?.status === "submitted" || application?.status === "under_review"
              ? "/account/seller-application/review"
              : "/account/seller-application/start"
          }
          className="market-button-primary rounded-full px-5 py-3 text-sm font-semibold"
        >
          {application?.status === "approved"
            ? "Continue vendor onboarding"
            : application
              ? "Continue application"
              : "Start application"}
        </Link>
      }
    >
      {application ? (
        <div className="space-y-5">
          <article className="market-panel rounded-[1.8rem] p-6">
            <p className="market-kicker">{application.status}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--market-paper-white)]">
              {application.storeName}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">
              Submitted {formatDate(application.submittedAt)} · {application.categoryFocus}
            </p>
            <p className="market-soft mt-4 rounded-[1.5rem] px-4 py-4 text-sm leading-7 text-[var(--market-ink)]">
              {application.reviewNote ||
                "Your application is in the workflow. Updates will appear here and in the notifications center."}
            </p>
          </article>

          <div className="grid gap-5 lg:grid-cols-3">
            {[
              {
                title: "Protected draft flow",
                body: "Store identity, verification, and review progress now live inside the account workspace instead of the public site.",
              },
              {
                title: "Owner and admin visibility",
                body: "Submission triggers the internal approval queue and the owner-alert path immediately.",
              },
              {
                title: "Vendor handoff",
                body: "Approved sellers move into vendor onboarding before product submission opens.",
              },
            ].map((item) => (
              <article
                key={item.title}
                className="market-soft rounded-[1.6rem] px-5 py-5"
              >
                <p className="text-lg font-semibold tracking-tight text-[var(--market-paper-white)]">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          title="No seller application is active yet."
          body="Start the protected onboarding flow to draft your store profile, add verification context, and move into moderation with real progress visibility."
          ctaHref="/account/seller-application/start"
          ctaLabel="Start seller application"
        />
      )}
    </WorkspaceShell>
  );
}
