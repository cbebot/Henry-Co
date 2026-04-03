import { Truck } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getDivisionActivity, getDivisionInvoices, getDivisionNotifications, getDivisionSupportThreads } from "@/lib/division-data";
import DivisionModulePage from "@/components/divisions/DivisionModulePage";

export const dynamic = "force-dynamic";

export default async function LogisticsPage() {
  const user = await requireAccountUser();
  const [activity, notifications, supportThreads, invoices] = await Promise.all([
    getDivisionActivity(user.id, "logistics"),
    getDivisionNotifications(user.id, "logistics"),
    getDivisionSupportThreads(user.id, "logistics"),
    getDivisionInvoices(user.id, "logistics"),
  ]);

  return (
    <DivisionModulePage
      divisionKey="logistics"
      icon={Truck}
      description="Deliveries, shipments, and logistics services — tracked from pickup to doorstep."
      externalUrl={`https://logistics.${process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com"}`}
      activity={activity}
      notifications={notifications}
      supportThreads={supportThreads}
      invoices={invoices}
      features={[
        { label: "Shipments", description: "Active and past shipments" },
        { label: "Tracking", description: "Real-time delivery tracking" },
        { label: "Receipts", description: "Delivery receipts and proof" },
        { label: "Addresses", description: "Saved pickup and delivery addresses" },
        { label: "Pricing", description: "Delivery rate estimates" },
        { label: "Support", description: "Report issues with deliveries" },
      ]}
    />
  );
}
