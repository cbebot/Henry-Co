import { Building2 } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getDivisionActivity, getDivisionInvoices, getDivisionNotifications, getDivisionSupportThreads } from "@/lib/division-data";
import DivisionModulePage from "@/components/divisions/DivisionModulePage";

export const dynamic = "force-dynamic";

export default async function PropertyPage() {
  const user = await requireAccountUser();
  const [activity, notifications, supportThreads, invoices] = await Promise.all([
    getDivisionActivity(user.id, "property"),
    getDivisionNotifications(user.id, "property"),
    getDivisionSupportThreads(user.id, "property"),
    getDivisionInvoices(user.id, "property"),
  ]);

  return (
    <DivisionModulePage
      divisionKey="property"
      icon={Building2}
      description="Property listings, viewings, inquiries, and real estate services."
      externalUrl={`https://property.${process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com"}`}
      activity={activity}
      notifications={notifications}
      supportThreads={supportThreads}
      invoices={invoices}
      features={[
        { label: "Saved Listings", description: "Properties you've bookmarked" },
        { label: "Inquiries", description: "Your property inquiries and responses" },
        { label: "Viewings", description: "Scheduled and past property viewings" },
        { label: "Documents", description: "Property documents and contracts" },
        { label: "Payments", description: "Rental or purchase payment history" },
        { label: "Agent Messages", description: "Communication with agents" },
      ]}
    />
  );
}
