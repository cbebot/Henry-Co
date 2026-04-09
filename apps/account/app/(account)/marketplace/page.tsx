import { ShoppingBag } from "lucide-react";
import { getDivisionUrl } from "@henryco/config";
import { requireAccountUser } from "@/lib/auth";
import { getDivisionActivity, getDivisionInvoices, getDivisionNotifications, getDivisionSupportThreads } from "@/lib/division-data";
import DivisionModulePage from "@/components/divisions/DivisionModulePage";

export const dynamic = "force-dynamic";
export default async function MarketplacePage() {
  const user = await requireAccountUser();
  const [activity, notifications, supportThreads, invoices] = await Promise.all([getDivisionActivity(user.id, "marketplace"), getDivisionNotifications(user.id, "marketplace"), getDivisionSupportThreads(user.id, "marketplace"), getDivisionInvoices(user.id, "marketplace")]);
  const base = getDivisionUrl("marketplace");
  return <DivisionModulePage divisionKey="marketplace" icon={ShoppingBag} description="Shop products, track orders, manage disputes, and continue seller workflows from the HenryCo marketplace." externalUrl={base} activity={activity} notifications={notifications} supportThreads={supportThreads} invoices={invoices} features={[{ label: "Orders", description: "Open your marketplace order history and order details.", href: `${base}/account/orders` }, { label: "Disputes", description: "Continue an active dispute or review past resolutions.", href: `${base}/account/disputes` }, { label: "Wishlist", description: "Review saved products you plan to buy later.", href: `${base}/account/wishlist` }, { label: "Following", description: "See stores and brands you already follow.", href: `${base}/account/following` }, { label: "Reviews", description: "Open the product reviews you have written.", href: `${base}/account/reviews` }, { label: "Seller application", description: "Continue onboarding, verification, or review for selling.", href: `${base}/account/seller-application` }]} />;
}
