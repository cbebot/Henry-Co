import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { MetricCard, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getVendorWorkspaceData } from "@/lib/marketplace/data";
import { vendorWorkspaceNav } from "@/lib/marketplace/navigation";
import { formatVendorMoney } from "@/lib/marketplace/vendor/money";
import {
  buildFirstRunChecklist,
  countPendingFulfillmentOrders,
  selectVendorNextAction,
} from "@/lib/marketplace/vendor/overview";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function VendorOverviewPage() {
  const locale = await getMarketplacePublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  await requireMarketplaceRoles(["vendor", "marketplace_owner", "marketplace_admin"], "/vendor");
  const data = await getVendorWorkspaceData();
  // Settlement rows carry whole naira; the display seam takes kobo.
  const money = (naira: number) => formatVendorMoney(Math.round(naira * 100), locale);

  const nextAction = selectVendorNextAction(
    {
      releasable: data.balanceSummary.releasable,
      productCount: data.products.length,
      pendingOrderCount: countPendingFulfillmentOrders(data.orders),
    },
    t,
  );
  const firstRun = data.products.length === 0;
  const checklist = firstRun
    ? buildFirstRunChecklist(
        {
          hasStoreStory: Boolean(data.vendor.description),
          productCount: data.products.length,
          fulfillmentReady: data.payouts.length > 0 || data.orders.length > 0,
        },
        t,
      )
    : [];
  const payoutReadiness = data.payoutChecklist.slice(0, 4);
  const coaching = data.trustProfile.coaching.slice(0, 4);

  return (
    <WorkspaceShell
      title={data.vendor.name}
      description={t(
        "Your storefront at a glance — balances, trust standing, and the next action that moves the store forward.",
      )}
      {...vendorWorkspaceNav("/vendor", locale)}
      hero={
        <section className="market-panel rounded-[2.1rem] p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="market-kicker">{data.vendor.name}</p>
              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                {t("Releasable balance")}
              </p>
              <p className="mt-2 text-[2.4rem] font-semibold leading-tight tracking-tight text-[var(--market-paper-white)] sm:text-[3rem]">
                {money(data.balanceSummary.releasable)}
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--market-muted)]">
                {t("Cleared for payout requests. Held amounts release as orders are delivered and confirmed.")}
              </p>
            </div>
            <Link
              href={nextAction.href}
              className="market-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
            >
              {nextAction.label}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      }
    >
      {firstRun ? (
        <section className="market-paper rounded-[1.9rem] p-6">
          <p className="market-kicker">{t("Set up your store")}</p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--market-muted)]">
            {t("Three steps put your storefront in front of buyers. Moderation reads honest detail favourably.")}
          </p>
          <div className="mt-5 space-y-4">
            {checklist.map((item) => (
              <article
                key={item.title}
                className="rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-5 py-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold tracking-tight text-[var(--market-ink)]">{item.title}</h2>
                  <span className="rounded-full border border-[var(--market-line)] bg-[var(--market-fill-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-paper-white)]">
                    {item.done ? t("Done") : t("Next")}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{item.body}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* Balances split exactly the way /vendor/payouts derives them — never merged. */}
      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard
          label={t("Releasable")}
          value={money(data.balanceSummary.releasable)}
          hint={t("Funds already cleared for payout requests.")}
        />
        <MetricCard
          label={t("Held")}
          value={money(data.balanceSummary.held)}
          hint={t("Escrow-held funds waiting on delivery, timeout, or trust checks.")}
        />
        <MetricCard
          label={t("Awaiting auto-release")}
          value={money(data.balanceSummary.awaitingAutoRelease)}
          hint={t("Delivered orders inside the auto-release window.")}
        />
      </div>

      <section className="market-paper rounded-[1.75rem] p-6">
        <p className="market-kicker">{t("Trust standing")}</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--market-ink)]">
          {data.trustProfile.label}
        </h2>
        <dl className="mt-4 grid gap-4 border-t border-[var(--market-line)] pt-4 sm:grid-cols-3">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
              {t("Plan")}
            </dt>
            <dd className="mt-1.5 text-sm font-semibold text-[var(--market-ink)]">
              {data.trustProfile.plan.name}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
              {t("Reserve window")}
            </dt>
            <dd className="mt-1.5 text-sm font-semibold text-[var(--market-ink)]">
              {t("{count} days").replace("{count}", String(data.trustProfile.payoutDelayDays))}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
              {t("Auto-release after delivery")}
            </dt>
            <dd className="mt-1.5 text-sm font-semibold text-[var(--market-ink)]">
              {t("{count} days").replace("{count}", String(data.trustProfile.autoReleaseDays))}
            </dd>
          </div>
        </dl>
      </section>

      {payoutReadiness.length > 0 || coaching.length > 0 ? (
        <section className="market-paper rounded-[1.75rem] p-6">
          <div className="grid gap-8 md:grid-cols-2">
            {payoutReadiness.length > 0 ? (
              <div>
                <p className="market-kicker">{t("Payout readiness")}</p>
                <ul className="mt-4 space-y-3">
                  {payoutReadiness.map((item) => (
                    <li
                      key={item}
                      className="border-l-2 border-[var(--market-brass)]/55 pl-4 text-sm leading-7 text-[var(--market-ink)]"
                    >
                      {t(item)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {coaching.length > 0 ? (
              <div>
                <p className="market-kicker">{t("Coaching")}</p>
                <ul className="mt-4 space-y-3">
                  {coaching.map((item) => (
                    <li
                      key={item}
                      className="border-l-2 border-[var(--market-line-strong)] pl-4 text-sm leading-7 text-[var(--market-ink)]"
                    >
                      {t(item)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </WorkspaceShell>
  );
}
