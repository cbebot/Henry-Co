import Link from "next/link";
import { henrySubdomain } from "@henryco/config";
import { WorkspaceShell } from "@/components/marketplace/shell";
import { AccountAddressesClient } from "@/components/marketplace/account-addresses-client";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import { accountWorkspaceNav } from "@/lib/marketplace/navigation";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

// V3-07(S2): NEXT_PUBLIC_ACCOUNT_HOST override is still honoured; fallback
// resolves the account subdomain via the COMPANY registry so preview/staging
// builds stop pointing at production henrycogroup.com.
const ACCOUNT_HOST =
  process.env.NEXT_PUBLIC_ACCOUNT_HOST || henrySubdomain("account");

export default async function AccountAddressesPage() {
  const locale = await getMarketplacePublicLocale();
  await requireMarketplaceUser("/account/addresses");
  const data = await getBuyerDashboardData();

  return (
    <WorkspaceShell
      title="Addresses"
      description="Saved addresses stay tied to the shared account so future HenryCo services can reuse the same customer context."
      {...accountWorkspaceNav("/account/addresses", locale)}
    >
      {/* V2-ADDR-01 — canonical address book moved to the central account app. */}
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-100">
        <strong>The address book moved.</strong> To add or edit an address with
        Google Places verification + KYC alignment, please use{" "}
        <Link
          href={`${ACCOUNT_HOST}/settings/addresses`}
          className="font-semibold underline underline-offset-2"
        >
          your account settings
        </Link>
        . Existing marketplace addresses stay readable here for legacy orders.
      </div>
      <AccountAddressesClient initialAddresses={data.addresses} />
    </WorkspaceShell>
  );
}
