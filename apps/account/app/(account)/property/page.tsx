import { Building2 } from "lucide-react";
import { getDivisionUrl } from "@henryco/config";
import { requireAccountUser } from "@/lib/auth";
import { getDivisionActivity, getDivisionInvoices, getDivisionNotifications, getDivisionSupportThreads } from "@/lib/division-data";
import DivisionModulePage from "@/components/divisions/DivisionModulePage";

export const dynamic = "force-dynamic";

type PropertyPageProps = {
  searchParams: Promise<{ panel?: string }>;
};

const panelCopy = {
  overview:
    "Saved properties, inquiries, viewing schedules, and listing submission status all roll into your shared HenryCo account here.",
  saved:
    "Your shortlist history syncs into the shared account layer so property discovery does not disappear when you leave the public listing pages.",
  inquiries:
    "Property inquiries stay visible in the shared account module with the latest support and follow-up context.",
  viewings:
    "Viewing requests and schedules stay attached to your HenryCo account for cleaner coordination across devices and teams.",
  listings:
    "Listing submissions and moderation outcomes stay visible here, while deeper editing continues inside the dedicated Property owner workspace.",
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
  const activePanel =
    params.panel && params.panel in panelCopy
      ? (params.panel as keyof typeof panelCopy)
      : "overview";
  const [activity, notifications, supportThreads, invoices] = await Promise.all([
    getDivisionActivity(user.id, "property"),
    getDivisionNotifications(user.id, "property"),
    getDivisionSupportThreads(user.id, "property"),
    getDivisionInvoices(user.id, "property"),
  ]);

  const savedCount = countByActivity(activity, ["property_saved"]);
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
          description: "Shortlist activity captured from HenryCo Property discovery.",
          href: "/property?panel=saved",
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
          description: "Submission and moderation history for owner or agent activity.",
          href: "/property?panel=listings",
        },
        {
          label: `Support threads · ${supportThreads.length}`,
          description: "Property-related conversations currently tracked in shared support.",
          href: "/support",
        },
        {
          label: "Owner workspace",
          description: "Open the dedicated Property workspace to submit or update listings.",
          href: `${propertyOrigin}/owner`,
        },
      ]}
    />
  );
}
