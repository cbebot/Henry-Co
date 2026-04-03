import { Palette } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getDivisionActivity, getDivisionInvoices, getDivisionNotifications, getDivisionSupportThreads } from "@/lib/division-data";
import DivisionModulePage from "@/components/divisions/DivisionModulePage";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const user = await requireAccountUser();
  const [activity, notifications, supportThreads, invoices] = await Promise.all([
    getDivisionActivity(user.id, "studio"),
    getDivisionNotifications(user.id, "studio"),
    getDivisionSupportThreads(user.id, "studio"),
    getDivisionInvoices(user.id, "studio"),
  ]);

  return (
    <DivisionModulePage
      divisionKey="studio"
      icon={Palette}
      description="Creative and design services — inquiries, projects, milestones, deliverables, and payments."
      externalUrl={`https://studio.${process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com"}`}
      activity={activity}
      notifications={notifications}
      supportThreads={supportThreads}
      invoices={invoices}
      features={[
        { label: "Projects", description: "Active and past creative projects" },
        { label: "Proposals", description: "Design proposals and quotes" },
        { label: "Milestones", description: "Project milestones and deliverables" },
        { label: "Files", description: "Delivered assets and design files" },
        { label: "Payments", description: "Studio project payments and invoices" },
        { label: "Reviews", description: "Feedback on completed projects" },
      ]}
    />
  );
}
