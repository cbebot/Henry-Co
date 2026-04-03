import { GraduationCap } from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getDivisionActivity, getDivisionInvoices, getDivisionNotifications, getDivisionSupportThreads } from "@/lib/division-data";
import DivisionModulePage from "@/components/divisions/DivisionModulePage";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const user = await requireAccountUser();
  const [activity, notifications, supportThreads, invoices] = await Promise.all([
    getDivisionActivity(user.id, "learn"),
    getDivisionNotifications(user.id, "learn"),
    getDivisionSupportThreads(user.id, "learn"),
    getDivisionInvoices(user.id, "learn"),
  ]);

  return (
    <DivisionModulePage
      divisionKey="learn"
      icon={GraduationCap}
      description="Courses, certifications, and professional development through HenryCo Academy."
      externalUrl={`https://learn.${process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com"}`}
      activity={activity}
      notifications={notifications}
      supportThreads={supportThreads}
      invoices={invoices}
      features={[
        { label: "Enrollments", description: "Courses you're currently enrolled in" },
        { label: "Progress", description: "Track your learning progress" },
        { label: "Certificates", description: "Earned certificates and credentials" },
        { label: "Quizzes & Assessments", description: "Test results and scores" },
        { label: "Payments", description: "Course fees and payment history" },
        { label: "Saved Courses", description: "Courses bookmarked for later" },
      ]}
    />
  );
}
