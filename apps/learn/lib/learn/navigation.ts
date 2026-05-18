import type { LearnRole } from "@/lib/learn/types";
import { getAccountLearnUrl } from "@/lib/learn/links";

export type LearnNavItem = {
  href: string;
  label: string;
  active?: boolean;
};

type Translator = (text: string) => string;

const identity: Translator = (text) => text;

export function learnerNav(active: string, t: Translator = identity): LearnNavItem[] {
  return [
    { href: getAccountLearnUrl(), label: t("Overview"), active: active === "overview" || active === "/learner" },
    { href: getAccountLearnUrl("active"), label: t("My courses"), active: active === "active" || active === "/learner/courses" },
    { href: getAccountLearnUrl("progress"), label: t("Progress"), active: active === "progress" || active === "/learner/progress" },
    { href: getAccountLearnUrl("saved"), label: t("Saved"), active: active === "saved" || active === "/learner/saved" },
    { href: getAccountLearnUrl("certificates"), label: t("Certificates"), active: active === "certificates" || active === "/learner/certificates" },
    { href: getAccountLearnUrl("payments"), label: t("Payments"), active: active === "payments" || active === "/learner/payments" },
    { href: getAccountLearnUrl("notifications"), label: t("Notifications"), active: active === "notifications" || active === "/learner/notifications" },
    { href: getAccountLearnUrl("overview"), label: t("Account settings"), active: active === "settings" || active === "/learner/settings" },
  ];
}

export function courseRoomNav(courseHref: string, t: Translator = identity): LearnNavItem[] {
  return [
    { href: getAccountLearnUrl(), label: t("Learn overview") },
    { href: getAccountLearnUrl("active"), label: t("My courses") },
    { href: getAccountLearnUrl("progress"), label: t("Progress") },
    { href: courseHref, label: t("This course"), active: true },
    { href: getAccountLearnUrl("certificates"), label: t("Certificates") },
    { href: "/teach", label: t("Apply to teach") },
  ];
}

export function ownerNav(active: string, t: Translator = identity): LearnNavItem[] {
  return [
    { href: "/owner", label: t("Overview"), active: active === "/owner" },
    { href: "/owner/courses", label: t("Courses"), active: active === "/owner/courses" },
    { href: "/owner/paths", label: t("Paths"), active: active === "/owner/paths" },
    { href: "/owner/instructors", label: t("Instructors"), active: active === "/owner/instructors" },
    { href: "/owner/learners", label: t("Learners"), active: active === "/owner/learners" },
    { href: "/owner/certificates", label: t("Certificates"), active: active === "/owner/certificates" },
    { href: "/owner/assignments", label: t("Assignments"), active: active === "/owner/assignments" },
    { href: "/owner/analytics", label: t("Analytics"), active: active === "/owner/analytics" },
    { href: "/owner/settings", label: t("Settings"), active: active === "/owner/settings" },
  ];
}

export function adminNav(active: string, t: Translator = identity): LearnNavItem[] {
  return [
    { href: "/admin", label: t("Overview"), active: active === "/admin" },
    { href: "/owner/courses", label: t("Courses"), active: active === "/owner/courses" },
    { href: "/owner/paths", label: t("Paths"), active: active === "/owner/paths" },
    { href: "/owner/instructors", label: t("Instructors"), active: active === "/owner/instructors" },
    { href: "/owner/learners", label: t("Learners"), active: active === "/owner/learners" },
    { href: "/owner/assignments", label: t("Assignments"), active: active === "/owner/assignments" },
  ];
}

export function instructorNav(active: string, t: Translator = identity): LearnNavItem[] {
  return [
    { href: "/instructor", label: t("Overview"), active: active === "/instructor" },
    { href: "/instructor/courses", label: t("Courses"), active: active === "/instructor/courses" },
    { href: "/instructor/grading", label: t("Grading"), active: active === "/instructor/grading" },
    { href: "/instructor/payouts", label: t("Payouts"), active: active === "/instructor/payouts" },
    { href: "/instructor/analytics", label: t("Analytics"), active: active === "/instructor/analytics" },
  ];
}

export function contentNav(active: string, t: Translator = identity): LearnNavItem[] {
  return [
    { href: "/content", label: t("Builder"), active: active === "/content" },
    { href: "/owner/courses", label: t("Courses"), active: active === "/owner/courses" },
    { href: "/owner/paths", label: t("Paths"), active: active === "/owner/paths" },
    { href: "/owner/settings", label: t("Publishing"), active: active === "/owner/settings" },
  ];
}

export function analyticsNav(active: string, t: Translator = identity): LearnNavItem[] {
  return [
    { href: "/analytics", label: t("Overview"), active: active === "/analytics" },
    { href: "/owner/analytics", label: t("Owner Analytics"), active: active === "/owner/analytics" },
    { href: "/owner/learners", label: t("Learner Signals"), active: active === "/owner/learners" },
  ];
}

export function supportNav(active: string, t: Translator = identity): LearnNavItem[] {
  return [
    { href: "/support", label: t("Inbox"), active: active === "/support" },
    { href: "/owner/settings", label: t("Announcements"), active: active === "/owner/settings" },
    { href: getAccountLearnUrl("notifications"), label: t("Learner Notifications") },
  ];
}

export function navForPrimaryRole(role: LearnRole, active: string, t: Translator = identity) {
  switch (role) {
    case "academy_owner":
      return ownerNav(active, t);
    case "academy_admin":
      return adminNav(active, t);
    case "instructor":
      return instructorNav(active, t);
    case "content_manager":
      return contentNav(active, t);
    case "support":
      return supportNav(active, t);
    case "finance":
    case "internal_manager":
      return analyticsNav(active, t);
    default:
      return learnerNav(active, t);
  }
}
