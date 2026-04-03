import { Sparkles } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getDivisionActivity, getDivisionInvoices, getDivisionNotifications, getDivisionSupportThreads } from "@/lib/division-data";
import DivisionModulePage from "@/components/divisions/DivisionModulePage";

export const dynamic = "force-dynamic";

export default async function CarePage() {
  const user = await requireAccountUser();
  const [activity, notifications, supportThreads, invoices] = await Promise.all([
    getDivisionActivity(user.id, "care"),
    getDivisionNotifications(user.id, "care"),
    getDivisionSupportThreads(user.id, "care"),
    getDivisionInvoices(user.id, "care"),
  ]);

  return (
    <DivisionModulePage
      divisionKey="care"
      icon={Sparkles}
      description="Fabric care, home cleaning, and workplace upkeep — tracked and managed from your account."
      externalUrl={`https://care.${process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com"}`}
      activity={activity}
      notifications={notifications}
      supportThreads={supportThreads}
      invoices={invoices}
      features={[
        { label: "Bookings", description: "View and track your care service bookings" },
        { label: "Payments", description: "Payment history for care services" },
        { label: "Reviews", description: "Reviews you've left for care services" },
        { label: "Pickup & Delivery", description: "Track pickup and delivery status" },
        { label: "Pricing", description: "View current care service pricing" },
        { label: "Support", description: "Get help with care service issues" },
      ]}
    />
  );
}
