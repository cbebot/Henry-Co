import { Truck } from "lucide-react";
import { getDivisionUrl } from "@henryco/config";
import { requireAccountUser } from "@/lib/auth";
import { getDivisionActivity, getDivisionInvoices, getDivisionNotifications, getDivisionSupportThreads } from "@/lib/division-data";
import DivisionModulePage from "@/components/divisions/DivisionModulePage";

export const dynamic = "force-dynamic";
export default async function LogisticsPage() {
  const user = await requireAccountUser();
  const [activity, notifications, supportThreads, invoices] = await Promise.all([getDivisionActivity(user.id, "logistics"), getDivisionNotifications(user.id, "logistics"), getDivisionSupportThreads(user.id, "logistics"), getDivisionInvoices(user.id, "logistics")]);
  const base = getDivisionUrl("logistics");
  return <DivisionModulePage divisionKey="logistics" icon={Truck} description="Delivery, pickup, and shipment flows with direct paths to the next useful logistics step." externalUrl={base} activity={activity} notifications={notifications} supportThreads={supportThreads} invoices={invoices} features={[{ label: "Book delivery", description: "Start a new pickup or delivery request in Logistics.", href: `${base}/book` }, { label: "Track shipment", description: "Open live shipment tracking in the logistics workspace.", href: `${base}/track` }, { label: "Pricing", description: "Review the current rate and service coverage.", href: `${base}/pricing` }, { label: "Addresses", description: "Manage saved pickup and delivery addresses in account hub.", href: "/addresses" }, { label: "Invoices", description: "Open shared logistics invoices and payment records.", href: "/invoices" }, { label: "Support", description: "Reach the logistics help path when a run needs attention.", href: `${base}/support` }]} />;
}
