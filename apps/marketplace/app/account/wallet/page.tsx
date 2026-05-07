import { redirect } from "next/navigation";
import { getAccountUrl } from "@henryco/config";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";

export const dynamic = "force-dynamic";

export default async function MarketplaceWalletRedirectPage() {
  await requireMarketplaceUser("/account/wallet");
  redirect(getAccountUrl("/wallet"));
}
