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

export function getSharedAccountLoginUrl(options: {
  nextPath?: string | null;
  propertyOrigin: string;
}) {
  const url = new URL("/login", getAccountUrl("/"));
  url.searchParams.set(
    "next",
    new URL(sanitizePropertyPath(options.nextPath, "/"), options.propertyOrigin).toString()
  );
  url.searchParams.set("division", "property");
  return url.toString();
}

export function getSharedAccountSignupUrl(options: {
  nextPath?: string | null;
  propertyOrigin: string;
}) {
  const url = new URL("/signup", getAccountUrl("/"));
  url.searchParams.set(
    "next",
    new URL(sanitizePropertyPath(options.nextPath, "/"), options.propertyOrigin).toString()
  );
  url.searchParams.set("division", "property");
  return url.toString();
}
