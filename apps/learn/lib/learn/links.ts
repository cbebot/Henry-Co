import {
  getAccountUrl,
  getDivisionUrl,
  isAbsoluteHttpUrl,
  normalizeTrustedRedirect,
} from "@henryco/config";

function normalizePath(path = "/") {
  return path.startsWith("/") ? path : `/${path}`;
}

export function getLearnUrl(path = "/") {
  return `${getDivisionUrl("learn")}${normalizePath(path)}`;
}

export function getLearnCourseRoomUrl(courseId: string) {
  return getLearnUrl(`/learner/courses/${courseId}`);
}

export function getAccountLearnUrl(panel?: string | null) {
  const params = new URLSearchParams();
  if (panel) params.set("panel", panel);

  const base = getAccountUrl("/learn");
  return params.size ? `${base}?${params.toString()}` : base;
}

export function getSharedAuthUrl(mode: "login" | "signup", nextPath?: string | null) {
  const base = getAccountUrl(mode === "login" ? "/login" : "/signup");
  const normalizedNext = normalizeTrustedRedirect(nextPath);
  const next = isAbsoluteHttpUrl(normalizedNext)
    ? normalizedNext
    : normalizedNext !== "/"
      ? getLearnUrl(normalizedNext)
      : getAccountLearnUrl();

  const params = new URLSearchParams();
  if (next) params.set("next", next);
  return params.size ? `${base}?${params.toString()}` : base;
}
