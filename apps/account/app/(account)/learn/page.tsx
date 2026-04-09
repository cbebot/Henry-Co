import { GraduationCap } from "lucide-react";
import { getDivisionUrl } from "@henryco/config";
import { requireAccountUser } from "@/lib/auth";
import { getDivisionActivity, getDivisionInvoices, getDivisionNotifications, getDivisionSupportThreads } from "@/lib/division-data";
import DivisionModulePage from "@/components/divisions/DivisionModulePage";

export const dynamic = "force-dynamic";
export default async function LearnPage() {
  const user = await requireAccountUser();
  const [activity, notifications, supportThreads, invoices] = await Promise.all([getDivisionActivity(user.id, "learn"), getDivisionNotifications(user.id, "learn"), getDivisionSupportThreads(user.id, "learn"), getDivisionInvoices(user.id, "learn")]);
  const base = getDivisionUrl("learn");
  return <DivisionModulePage divisionKey="learn" icon={GraduationCap} description="Courses, certifications, and learner progress through HenryCo Learn." externalUrl={base} activity={activity} notifications={notifications} supportThreads={supportThreads} invoices={invoices} features={[{ label: "Courses", description: "Open your learner course list and continue studying.", href: `${base}/learner/courses` }, { label: "Progress", description: "Review current course completion and assessment status.", href: `${base}/learner/progress` }, { label: "Certificates", description: "Access issued certificates and completion records.", href: `${base}/learner/certificates` }, { label: "Assessments", description: "Return to quiz and performance progress views.", href: `${base}/learner/progress` }, { label: "Payments", description: "Open learner payment history and course billing.", href: `${base}/learner/payments` }, { label: "Saved courses", description: "Continue from the courses you saved for later.", href: `${base}/learner/saved` }]} />;
}
