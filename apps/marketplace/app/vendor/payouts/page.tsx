import { translateSurfaceLabel } from "@henryco/i18n";
import { EmptyState, WorkspaceShell } from "@/components/marketplace/shell";
import {
  PayoutRequestForm,
  type PayoutRequestOutcome,
} from "@/components/marketplace/vendor/payout-request-form";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getVendorWorkspaceData } from "@/lib/marketplace/data";
import { vendorWorkspaceNav } from "@/lib/marketplace/navigation";
import {
  payoutRequestErrorDetail,
  payoutRequestStatusLabel,
} from "@/lib/marketplace/vendor/labels";
import { formatVendorMoney } from "@/lib/marketplace/vendor/money";
import { formatDate } from "@/lib/utils";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function VendorPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ requested?: string; error?: string }>;
}) {
  const locale = await getMarketplacePublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  await requireMarketplaceRoles(["vendor", "marketplace_owner", "marketplace_admin"], "/vendor/payouts");
  const [data, params] = await Promise.all([getVendorWorkspaceData(), searchParams]);
  // Settlement rows carry whole naira; the display seam takes kobo.
  const money = (naira: number) => formatVendorMoney(Math.round(naira * 100), locale);

  // The payout_request intent answers with a 303 back here — resolve its
  // query params into ONE outcome for the form's toast.
  const errorCode = typeof params.error === "string" ? params.error : null;
  const outcome: PayoutRequestOutcome | null =
    params.requested === "1"
      ? { kind: "success" }
      : errorCode
        ? { kind: "error", detail: payoutRequestErrorDetail(errorCode, t) }
        : null;

  const balances = [
    { label: t("Held"), value: money(data.balanceSummary.held) },
    { label: t("Awaiting auto-release"), value: money(data.balanceSummary.awaitingAutoRelease) },
    { label: t("Releasable"), value: money(data.balanceSummary.releasable) },
    { label: t("Frozen"), value: money(data.balanceSummary.frozen) },
  ];

  return (
    <WorkspaceShell
      title={t("Payouts")}
      description={t(
        "You can request a payout from your releasable balance. Funds still held for pending deliveries or open disputes stay separate until they clear.",
      )}
      {...vendorWorkspaceNav("/vendor/payouts", locale)}
    >
      <section className="grid gap-4 md:grid-cols-4">
        {balances.map((balance) => (
          <article key={balance.label} className="market-paper rounded-[1.5rem] p-5">
            <p className="market-kicker">{balance.label}</p>
            <p className="mt-3 text-2xl font-semibold text-[var(--market-ink)]">{balance.value}</p>
          </article>
        ))}
      </section>

      <PayoutRequestForm
        outcome={outcome}
        labels={{
          submit: t("Request payout"),
          pending: t("Requesting payout"),
          successTitle: t("Payout request submitted."),
          successBody: t("We received your payout request. We'll review it and pay out to your registered account."),
          errorTitle: t("Payout could not be requested."),
        }}
        className="market-paper rounded-[1.75rem] p-5"
        buttonClassName="market-button-primary mt-4 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-80"
      >
        <div className="flex flex-col gap-4 sm:flex-row">
          <input
            name="amount"
            type="number"
            min={1}
            max={Math.max(0, data.balanceSummary.releasable)}
            className="market-input rounded-full px-4 py-3"
            placeholder={t("Amount in naira")}
            aria-label={t("Amount in naira")}
            required
          />
        </div>
        <p className="mt-4 text-sm leading-7 text-[var(--market-muted)]">
          {t(
            "Your plan: {tier}. Funds settle {reserve} days after payout, and orders auto-clear {auto} days after delivery. An open dispute can pause a payout until it's resolved.",
          )
            .replace("{tier}", data.trustProfile.label)
            .replace("{reserve}", String(data.trustProfile.payoutDelayDays))
            .replace("{auto}", String(data.trustProfile.autoReleaseDays))}
        </p>
      </PayoutRequestForm>

      {data.payouts.length === 0 ? (
        <EmptyState
          title={t("No payout requests yet")}
          body={t(
            "When you request a payout from your releasable balance, its review status appears here.",
          )}
        />
      ) : (
        <div className="space-y-4">
          {data.payouts.map((payout) => (
            <article key={payout.id} className="market-paper rounded-[1.75rem] p-5">
              <p className="market-kicker">{payout.reference}</p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--market-ink)]">{money(payout.amount)}</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">
                {payoutRequestStatusLabel(payout.status, t)} · {formatDate(payout.requestedAt)}
              </p>
            </article>
          ))}
        </div>
      )}
    </WorkspaceShell>
  );
}
