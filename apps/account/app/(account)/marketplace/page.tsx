import { ShoppingBag } from "lucide-react";
import { RouteLiveRefresh } from "@henryco/ui";
import { requireAccountUser } from "@/lib/auth";
import { getProfile } from "@/lib/account-data";
import {
  getDivisionActivity,
  getDivisionInvoices,
  getDivisionNotifications,
  getDivisionSupportThreads,
  getMarketplaceDivisionSummary,
} from "@/lib/division-data";
import DivisionModulePage from "@/components/divisions/DivisionModulePage";
import { resolveAccountRegionalContext } from "@/lib/regional-context";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const user = await requireAccountUser();
  const profilePromise = getProfile(user.id);
  const [activityResult, notificationsResult, supportThreadsResult, invoicesResult, summaryResult, profile] =
    await Promise.allSettled([
      getDivisionActivity(user.id, "marketplace"),
      getDivisionNotifications(user.id, "marketplace"),
      getDivisionSupportThreads(user.id, "marketplace"),
      getDivisionInvoices(user.id, "marketplace"),
      getMarketplaceDivisionSummary(user.id),
      profilePromise,
    ]);

  const activity = activityResult.status === "fulfilled" ? activityResult.value : [];
  const notifications = notificationsResult.status === "fulfilled" ? notificationsResult.value : [];
  const supportThreads = supportThreadsResult.status === "fulfilled" ? supportThreadsResult.value : [];
  const invoices = invoicesResult.status === "fulfilled" ? invoicesResult.value : [];
  const summary =
    summaryResult.status === "fulfilled"
      ? summaryResult.value
      : { orders: [], disputes: [], application: null, memberships: [], payouts: [], sellerActive: false, issue: "Marketplace module unavailable." };
  const profileData = profile.status === "fulfilled" ? profile.value : null;
  const region = resolveAccountRegionalContext({
    country: profileData?.country as string | null | undefined,
    currency: profileData?.currency as string | null | undefined,
    timezone: profileData?.timezone as string | null | undefined,
    language: profileData?.language as string | null | undefined,
  });

  return (
    <>
      <RouteLiveRefresh />
      <DivisionModulePage
        divisionKey="marketplace"
        icon={ShoppingBag}
        description="Shop products, track orders, manage disputes, and sell on the HenryCo marketplace."
        externalUrl={`https://marketplace.${process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com"}`}
        activity={activity}
        notifications={notifications}
        supportThreads={supportThreads}
        invoices={invoices}
        viewerRegion={{
          countryCode: region.countryCode,
          locale: region.locale,
          displayCurrency: region.displayCurrency,
        }}
        features={[
          {
            label: `Orders${summary.orders.length ? ` (${summary.orders.length})` : ""}`,
            description:
              summary.orders[0]
                ? `Latest: ${String((summary.orders[0] as { order_no?: string }).order_no || "order")} is ${String((summary.orders[0] as { status?: string }).status || "active").replace(/_/g, " ")}.`
                : "View and track all your marketplace orders.",
          },
          {
            label: `Disputes${summary.disputes.length ? ` (${summary.disputes.length})` : ""}`,
            description:
              summary.disputes.length
                ? "Protected dispute handling, payout freezes, and evidence-driven resolution are active."
                : "No open buyer disputes are recorded on your marketplace profile right now.",
          },
          {
            label: summary.sellerActive ? "Seller workspace active" : "Seller application",
            description: summary.sellerActive
              ? "Your HenryCo account is connected to your marketplace seller profile."
              : summary.application
                ? `Application status: ${String((summary.application as { status?: string }).status || "submitted").replace(/_/g, " ")}.`
                : "Start or track your seller application from your account.",
          },
          {
            label: `Payouts${summary.payouts.length ? ` (${summary.payouts.length})` : ""}`,
            description: summary.payouts.length
              ? "Vendor payout requests and finance review outcomes are now mirrored into the shared account surface."
              : "No seller payout requests are attached to this account yet.",
          },
          {
            label: "Trust & protection",
            description:
              summary.issue || "Marketplace account modules are isolated so one failing dependency does not crash the entire shared account dashboard.",
          },
        ]}
      />
    </>
  );
}
