import type { LearnRole } from "@/lib/learn/types";
import { getAccountLearnUrl } from "@/lib/learn/links";

export type LearnNavItem = {
  href: string;
  label: string;
  active?: boolean;
};

export function learnerNav(active: string): LearnNavItem[] {
  return [
    { href: getAccountLearnUrl(), label: "Overview", active: active === "overview" || active === "/learner" },
    { href: getAccountLearnUrl("active"), label: "My courses", active: active === "active" || active === "/learner/courses" },
    { href: getAccountLearnUrl("progress"), label: "Progress", active: active === "progress" || active === "/learner/progress" },
    { href: getAccountLearnUrl("saved"), label: "Saved", active: active === "saved" || active === "/learner/saved" },
    { href: getAccountLearnUrl("certificates"), label: "Certificates", active: active === "certificates" || active === "/learner/certificates" },
    { href: getAccountLearnUrl("payments"), label: "Payments", active: active === "payments" || active === "/learner/payments" },
    { href: getAccountLearnUrl("notifications"), label: "Notifications", active: active === "notifications" || active === "/learner/notifications" },
    { href: getAccountLearnUrl("overview"), label: "Account settings", active: active === "settings" || active === "/learner/settings" },
  ];
}

export function courseRoomNav(courseHref: string): LearnNavItem[] {
  return [
    { href: getAccountLearnUrl(), label: "Learn overview" },
    { href: getAccountLearnUrl("active"), label: "My courses" },
    { href: getAccountLearnUrl("progress"), label: "Progress" },
    { href: courseHref, label: "This course", active: true },
    { href: getAccountLearnUrl("certificates"), label: "Certificates" },
    { href: "/teach", label: "Apply to teach" },
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
    { href: getAccountLearnUrl("notifications"), label: "Learner Notifications" },
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
