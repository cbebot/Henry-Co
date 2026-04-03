import { ShoppingBag } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getDivisionActivity, getDivisionInvoices, getDivisionNotifications, getDivisionSupportThreads } from "@/lib/division-data";
import DivisionModulePage from "@/components/divisions/DivisionModulePage";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const user = await requireAccountUser();
  const [activity, notifications, supportThreads, invoices] = await Promise.all([
    getDivisionActivity(user.id, "marketplace"),
    getDivisionNotifications(user.id, "marketplace"),
    getDivisionSupportThreads(user.id, "marketplace"),
    getDivisionInvoices(user.id, "marketplace"),
  ]);

  return (
    <DivisionModulePage
      divisionKey="marketplace"
      icon={ShoppingBag}
      description="Shop products, track orders, manage disputes, and sell on the HenryCo marketplace."
      externalUrl={`https://marketplace.${process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com"}`}
      activity={activity}
      notifications={notifications}
      supportThreads={supportThreads}
      invoices={invoices}
      features={[
        { label: "Orders", description: "View and track all your marketplace orders" },
        { label: "Disputes", description: "Manage order disputes and resolutions" },
        { label: "Wishlist", description: "Products you've saved for later" },
        { label: "Following", description: "Stores and brands you follow" },
        { label: "Reviews", description: "Product reviews you've submitted" },
        { label: "Seller Application", description: "Start or track your seller application" },
      ]}
    />
  );
}
