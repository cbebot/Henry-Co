import Link from "next/link";
import { EmptyState, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import { accountWorkspaceNav } from "@/lib/marketplace/navigation";
import { formatDate } from "@/lib/utils";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { getMarketplaceSellerApplicationCopy } from "@henryco/i18n";

export const dynamic = "force-dynamic";

export default async function SellerApplicationPage() {
  const locale = await getMarketplacePublicLocale();
  const copy = getMarketplaceSellerApplicationCopy(locale);
  await requireMarketplaceUser("/account/seller-application");
  const data = await getBuyerDashboardData();
  const application = data.application;

  return (
    <WorkspaceShell
      title={copy.overview.shellTitle}
      description={copy.overview.shellDescription}
      {...accountWorkspaceNav("/account/seller-application", locale)}
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
            ? copy.overview.actions.continueOnboarding
            : application
              ? copy.overview.actions.continueApplication
              : copy.overview.actions.startApplication}
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
              {copy.overview.statusCard.submittedPrefix} {formatDate(application.submittedAt)} · {application.categoryFocus}
            </p>
            <p className="market-soft mt-4 rounded-[1.5rem] px-4 py-4 text-sm leading-7 text-[var(--market-ink)]">
              {application.reviewNote ||
                copy.overview.statusCard.defaultReviewNote}
            </p>
          </article>

          <div className="grid gap-5 lg:grid-cols-3">
            {[
              {
                title: copy.overview.cards.protectedDraft.title,
                body: copy.overview.cards.protectedDraft.body,
              },
              {
                title: copy.overview.cards.ownerVisibility.title,
                body: copy.overview.cards.ownerVisibility.body,
              },
              {
                title: copy.overview.cards.vendorHandoff.title,
                body: copy.overview.cards.vendorHandoff.body,
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
          title={copy.overview.empty.title}
          body={copy.overview.empty.body}
          ctaHref="/account/seller-application/start"
          ctaLabel={copy.overview.empty.ctaLabel}
        />
      )}
    </WorkspaceShell>
  );
}
