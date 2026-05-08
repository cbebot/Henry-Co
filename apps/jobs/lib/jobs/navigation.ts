import {
  Activity,
  Bell,
  BookmarkPlus,
  Briefcase,
  Building2,
  CalendarDays,
  ChartColumnBig,
  ClipboardList,
  FileText,
  History,
  Home,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Plus,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

export type WorkspaceNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const candidateNav: WorkspaceNavItem[] = [
  { href: "/candidate", label: "Home", icon: Home },
  { href: "/candidate/profile", label: "Profile", icon: UserRound },
  { href: "/candidate/applications", label: "Applications", icon: ClipboardList },
  { href: "/candidate/conversations", label: "Messages", icon: MessageSquare },
  { href: "/candidate/interviews", label: "Interviews", icon: CalendarDays },
  { href: "/candidate/saved-jobs", label: "Saved Jobs", icon: BookmarkPlus },
  { href: "/candidate/alerts", label: "Alerts", icon: Bell },
  { href: "/candidate/files", label: "Files", icon: FileText },
  { href: "/candidate/settings", label: "Settings", icon: Settings },
];

export const employerNav: WorkspaceNavItem[] = [
  { href: "/employer", label: "Console", icon: LayoutDashboard },
  { href: "/employer/company", label: "Company", icon: Building2 },
  { href: "/employer/jobs", label: "Jobs", icon: Briefcase },
  { href: "/employer/jobs/new", label: "Post Role", icon: Plus },
  { href: "/employer/applicants", label: "Applicants", icon: Users },
  { href: "/employer/hiring", label: "Hiring", icon: ListChecks },
  { href: "/employer/analytics", label: "Analytics", icon: ChartColumnBig },
  { href: "/employer/settings", label: "Settings", icon: Settings },
];

export const recruiterNav: WorkspaceNavItem[] = [
  { href: "/recruiter", label: "Console", icon: LayoutDashboard },
  { href: "/recruiter/pipeline", label: "Pipeline", icon: Activity },
  { href: "/recruiter/jobs", label: "Jobs", icon: Briefcase },
  { href: "/recruiter/employers", label: "Employers", icon: Building2 },
  { href: "/recruiter/verification", label: "Verification", icon: ShieldCheck },
  { href: "/recruiter/history", label: "History", icon: History },
];
