import { getDivisionUrl } from "@henryco/config";
import { cleanEnv } from "@/lib/env";

const DEFAULT_ACCOUNT_SUBDOMAIN = "account";
const DEFAULT_JOBS_PATH = "/candidate";

export function getJobsOrigin() {
  return getDivisionUrl("jobs").replace(/\/+$/, "");
}

export function getSharedAccountOrigin() {
  const explicit = cleanEnv(process.env.NEXT_PUBLIC_ACCOUNT_ORIGIN);
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  const baseDomain = cleanEnv(process.env.NEXT_PUBLIC_BASE_DOMAIN) || "henrycogroup.com";
  return `https://${DEFAULT_ACCOUNT_SUBDOMAIN}.${baseDomain}`;
}

export function normalizeJobsPath(pathname?: string | null, fallback = DEFAULT_JOBS_PATH) {
  const next = cleanEnv(pathname);
  if (!next.startsWith("/")) {
    return fallback;
  }

  return next;
}

export function toJobsAbsoluteUrl(pathname?: string | null, fallback = DEFAULT_JOBS_PATH) {
  const next = cleanEnv(pathname);
  if (/^https?:\/\//i.test(next)) {
    return next;
  }

  return `${getJobsOrigin()}${normalizeJobsPath(next, fallback)}`;
}

export function getSharedAccountUrl(pathname = "/", next?: string | null) {
  const url = new URL(pathname, `${getSharedAccountOrigin()}/`);
  if (next) {
    url.searchParams.set("next", toJobsAbsoluteUrl(next));
  }
  return url.toString();
}

export function getSharedAccountLoginUrl(next?: string | null) {
  return getSharedAccountUrl("/login", next);
}

export function getSharedAccountSignupUrl(next?: string | null) {
  return getSharedAccountUrl("/signup", next);
}

export function getSharedAccountJobsUrl() {
  return getSharedAccountUrl("/jobs");
}
