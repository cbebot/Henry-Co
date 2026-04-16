import { getAccountUrl, getDivisionUrl } from "@henryco/config";

export type PropertyAccountPanel =
  | "overview"
  | "saved"
  | "inquiries"
  | "viewings"
  | "listings";

function cleanPath(value?: string | null, fallback = "/") {
  if (!value || !value.startsWith("/")) return fallback;
  return value;
}

export function sanitizePropertyPath(value?: string | null, fallback = "/") {
  return cleanPath(value, fallback);
}

export function getPropertyOrigin() {
  return getDivisionUrl("property");
}

export function getPropertyUrl(path = "/") {
  return new URL(cleanPath(path), getPropertyOrigin()).toString();
}

export function getPropertyWorkspaceUrl(path = "/owner") {
  return getPropertyUrl(path);
}

export function getSharedAccountPropertyPath(panel: PropertyAccountPanel = "overview") {
  if (panel === "saved") {
    return "/property/saved";
  }

  const url = new URL(getAccountUrl("/property"));
  if (panel !== "overview") {
    url.searchParams.set("panel", panel);
  }
  return `${url.pathname}${url.search}`;
}

export function getSharedAccountPropertyUrl(panel: PropertyAccountPanel = "overview") {
  return new URL(getSharedAccountPropertyPath(panel), getAccountUrl("/")).toString();
}

export function sanitizePropertyAuthReturnTarget(
  value: string | null | undefined,
  fallback: string,
  baseOrigin: string
) {
  const raw = String(value || "").trim();
  if (!raw) return fallback;

  try {
    const target = new URL(raw, baseOrigin);
    if (target.origin !== new URL(baseOrigin).origin) return fallback;
    return target.toString();
  } catch {
    return fallback;
  }
}

type PropertySharedAccountAuthOptions = {
  nextPath?: string | null;
  nextTarget?: string | null;
  propertyOrigin?: string | null;
  error?: string | null;
};

function buildPropertySharedAccountAuthUrl(
  mode: "login" | "signup",
  options: PropertySharedAccountAuthOptions = {}
) {
  const propertyOrigin = options.propertyOrigin || getPropertyOrigin();
  const fallbackTarget = new URL(
    sanitizePropertyPath(options.nextPath, "/"),
    propertyOrigin
  ).toString();
  const nextTarget = sanitizePropertyAuthReturnTarget(
    options.nextTarget,
    fallbackTarget,
    propertyOrigin
  );
  const url = new URL(mode === "login" ? "/login" : "/signup", getAccountUrl("/"));
  url.searchParams.set("next", nextTarget);
  url.searchParams.set("division", "property");
  if (options.error) {
    url.searchParams.set("error", options.error);
  }
  return url.toString();
}

export function getSharedAccountLoginUrl(options: {
  nextPath?: string | null;
  nextTarget?: string | null;
  propertyOrigin?: string | null;
  error?: string | null;
}) {
  return buildPropertySharedAccountAuthUrl("login", options);
}

export function getSharedAccountSignupUrl(options: {
  nextPath?: string | null;
  nextTarget?: string | null;
  propertyOrigin?: string | null;
  error?: string | null;
}) {
  return buildPropertySharedAccountAuthUrl("signup", options);
}
