import { Briefcase } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getDivisionActivity, getDivisionInvoices, getDivisionNotifications, getDivisionSupportThreads } from "@/lib/division-data";
import DivisionModulePage from "@/components/divisions/DivisionModulePage";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const user = await requireAccountUser();
  const [activity, notifications, supportThreads, invoices] = await Promise.all([
    getDivisionActivity(user.id, "jobs"),
    getDivisionNotifications(user.id, "jobs"),
    getDivisionSupportThreads(user.id, "jobs"),
    getDivisionInvoices(user.id, "jobs"),
  ]);

  return (
    <DivisionModulePage
      divisionKey="jobs"
      icon={Briefcase}
      description="Job applications, saved positions, recruiter messages, and career profile."
      externalUrl={`https://jobs.${process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com"}`}
      activity={activity}
      notifications={notifications}
      supportThreads={supportThreads}
      invoices={invoices}
      features={[
        { label: "Applications", description: "Jobs you've applied to" },
        { label: "Saved Jobs", description: "Positions bookmarked for later" },
        { label: "Profile", description: "Your candidate profile and resume" },
        { label: "Messages", description: "Recruiter and employer messages" },
        { label: "Interviews", description: "Scheduled interview sessions" },
        { label: "Alerts", description: "Job match and application alerts" },
      ]}
    />
  );
}
