import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { getDivisionUrl } from "@henryco/config";
import { requireAccountUser } from "@/lib/auth";
import { getDivisionActivity, getDivisionInvoices, getDivisionNotifications, getDivisionSupportThreads } from "@/lib/division-data";
import { getSavedPropertiesForUser } from "@/lib/property-module";
import DivisionModulePage from "@/components/divisions/DivisionModulePage";

export const dynamic = "force-dynamic";

type PropertyPageProps = {
  searchParams: Promise<{ panel?: string }>;
};

const panelCopy = {
  overview:
    "Saved properties, inquiries, viewing schedules, and listing submissions — all in your account.",
  saved:
    "Properties you've saved stay here so you can pick up where you left off.",
  inquiries:
    "Property inquiries and any follow-up conversations are tracked here.",
  viewings:
    "Viewing requests and schedules are stored in your account for easy access across devices.",
  listings:
    "Listing submissions and review outcomes stay visible here, with follow-up coordinated by the HenryCo Property team.",
} as const;

function countByActivity(
  activity: Array<Record<string, string | number | null>>,
  activityTypes: string[]
) {
  return activity.filter((item) => activityTypes.includes(String(item.activity_type || ""))).length;
}

export default async function PropertyPage({ searchParams }: PropertyPageProps) {
  const user = await requireAccountUser();
  const params = await searchParams;
  if (params.panel === "saved") {
    redirect("/property/saved");
  }
  const activePanel =
    params.panel && params.panel in panelCopy
      ? (params.panel as keyof typeof panelCopy)
      : "overview";
  const [activity, notifications, supportThreads, invoices, savedProperties] = await Promise.all([
    getDivisionActivity(user.id, "property"),
    getDivisionNotifications(user.id, "property"),
    getDivisionSupportThreads(user.id, "property"),
    getDivisionInvoices(user.id, "property"),
    getSavedPropertiesForUser(user.id),
  ]);

  const savedCount = savedProperties.length;
  const inquiryCount = countByActivity(activity, ["property_inquiry"]);
  const viewingCount = countByActivity(activity, ["property_viewing_requested"]);
  const listingCount = countByActivity(activity, [
    "property_listing_submitted",
    "property_listing_updated",
    "property_listing_reviewed",
  ]);
  const propertyOrigin = getDivisionUrl("property");

  return (
    <DivisionModulePage
      divisionKey="property"
      icon={Building2}
      title={
        activePanel === "overview"
          ? "Property"
          : activePanel === "saved"
            ? "Saved Properties"
            : activePanel === "inquiries"
              ? "Property Inquiries"
              : activePanel === "viewings"
                ? "Viewing Requests"
                : "Listing Status"
      }
      description={panelCopy[activePanel]}
      externalUrl={propertyOrigin}
      activity={activity}
      notifications={notifications}
      supportThreads={supportThreads}
      invoices={invoices}
      features={[
        {
          label: `Saved properties · ${savedCount}`,
          description: "Real saved listings synced from HenryCo Property, with compare and inquiry actions.",
          href: "/property/saved",
        },
        {
          label: `Inquiries · ${inquiryCount}`,
          description: "Inquiry records and support follow-up tied to your account.",
          href: "/property?panel=inquiries",
        },
        {
          label: `Viewings · ${viewingCount}`,
          description: "Viewing requests, schedules, and reminders.",
          href: "/property?panel=viewings",
        },
        {
          label: `Listing status · ${listingCount}`,
          description: "Submission and moderation history for your property listing activity.",
          href: "/property?panel=listings",
        },
        {
          label: `Support threads · ${supportThreads.length}`,
          description: "Property-related conversations currently tracked in shared support.",
          href: "/support",
        },
        {
          label: "Open Property site",
          description: "Continue discovery, inquiries, and listing activity on the public Property experience.",
          href: propertyOrigin,
        },
      ]}
    />
  );
}
