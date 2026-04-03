import type { LearnRole } from "@/lib/learn/types";
import { getAccountLearnUrl } from "@/lib/learn/links";

export type LearnNavItem = {
  href: string;
  label: string;
  active?: boolean;
};

export function learnerNav(active: string): LearnNavItem[] {
  return [
    { href: "/learner", label: "Overview", active: active === "/learner" },
    { href: "/learner/courses", label: "My Courses", active: active === "/learner/courses" },
    { href: "/learner/saved", label: "Saved", active: active === "/learner/saved" },
    { href: "/learner/certificates", label: "Certificates", active: active === "/learner/certificates" },
    { href: "/learner/progress", label: "Progress", active: active === "/learner/progress" },
    { href: "/learner/payments", label: "Payments", active: active === "/learner/payments" },
    { href: "/learner/notifications", label: "Notifications", active: active === "/learner/notifications" },
    { href: "/learner/settings", label: "Settings", active: active === "/learner/settings" },
  ];
}

export function courseRoomNav(courseHref: string): LearnNavItem[] {
  return [
    { href: getAccountLearnUrl(), label: "Account overview" },
    { href: getAccountLearnUrl("active"), label: "Active learning" },
    { href: courseHref, label: "Course room", active: true },
    { href: getAccountLearnUrl("certificates"), label: "Certificates" },
    { href: "/teach", label: "Teach with HenryCo" },
  ];
}

export function ownerNav(active: string): LearnNavItem[] {
  return [
    { href: "/owner", label: "Overview", active: active === "/owner" },
    { href: "/owner/courses", label: "Courses", active: active === "/owner/courses" },
    { href: "/owner/paths", label: "Paths", active: active === "/owner/paths" },
    { href: "/owner/instructors", label: "Instructors", active: active === "/owner/instructors" },
    { href: "/owner/learners", label: "Learners", active: active === "/owner/learners" },
    { href: "/owner/certificates", label: "Certificates", active: active === "/owner/certificates" },
    { href: "/owner/assignments", label: "Assignments", active: active === "/owner/assignments" },
    { href: "/owner/analytics", label: "Analytics", active: active === "/owner/analytics" },
    { href: "/owner/settings", label: "Settings", active: active === "/owner/settings" },
  ];
}

export function adminNav(active: string): LearnNavItem[] {
  return [
    { href: "/admin", label: "Overview", active: active === "/admin" },
    { href: "/owner/courses", label: "Courses", active: active === "/owner/courses" },
    { href: "/owner/paths", label: "Paths", active: active === "/owner/paths" },
    { href: "/owner/instructors", label: "Instructors", active: active === "/owner/instructors" },
    { href: "/owner/learners", label: "Learners", active: active === "/owner/learners" },
    { href: "/owner/assignments", label: "Assignments", active: active === "/owner/assignments" },
  ];
}

export function instructorNav(active: string): LearnNavItem[] {
  return [
    { href: "/instructor", label: "Overview", active: active === "/instructor" },
    { href: "/owner/courses", label: "Courses", active: active === "/owner/courses" },
    { href: "/owner/learners", label: "Learners", active: active === "/owner/learners" },
    { href: "/owner/certificates", label: "Certificates", active: active === "/owner/certificates" },
  ];
}

export function contentNav(active: string): LearnNavItem[] {
  return [
    { href: "/content", label: "Builder", active: active === "/content" },
    { href: "/owner/courses", label: "Courses", active: active === "/owner/courses" },
    { href: "/owner/paths", label: "Paths", active: active === "/owner/paths" },
    { href: "/owner/settings", label: "Publishing", active: active === "/owner/settings" },
  ];
}

export function analyticsNav(active: string): LearnNavItem[] {
  return [
    { href: "/analytics", label: "Overview", active: active === "/analytics" },
    { href: "/owner/analytics", label: "Owner Analytics", active: active === "/owner/analytics" },
    { href: "/owner/learners", label: "Learner Signals", active: active === "/owner/learners" },
  ];
}

export function supportNav(active: string): LearnNavItem[] {
  return [
    { href: "/support", label: "Inbox", active: active === "/support" },
    { href: "/owner/settings", label: "Announcements", active: active === "/owner/settings" },
    { href: "/learner/notifications", label: "Learner Notifications", active: active === "/learner/notifications" },
  ];
}

export function navForPrimaryRole(role: LearnRole, active: string) {
  switch (role) {
    case "academy_owner":
      return ownerNav(active);
    case "academy_admin":
      return adminNav(active);
    case "instructor":
      return instructorNav(active);
    case "content_manager":
      return contentNav(active);
    case "support":
      return supportNav(active);
    case "finance":
    case "internal_manager":
      return analyticsNav(active);
    default:
      return learnerNav(active);
  }
}
