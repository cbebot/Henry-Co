import "server-only";

import { headers } from "next/headers";
import { COMPANY, getAccountUrl } from "@henryco/config";

function normalizeHost(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
}

function normalizeProto(value?: string | null) {
  const proto = String(value || "").trim().toLowerCase();
  return proto === "http" || proto === "https" ? proto : null;
}

export async function getWorkspaceRuntime() {
  const headerStore = await headers();
  const host =
    normalizeHost(headerStore.get("x-henry-host")) ||
    normalizeHost(headerStore.get("x-forwarded-host")) ||
    normalizeHost(headerStore.get("host"));
  const proto =
    normalizeProto(headerStore.get("x-henry-proto")) ||
    normalizeProto(headerStore.get("x-forwarded-proto")) ||
    (process.env.VERCEL ? "https" : "http");
  const pathname = headerStore.get("x-henry-pathname") || "/workspace";
  const workspaceHost = host.startsWith("workspace.");
  const basePath = workspaceHost ? "" : "/workspace";
  const preferredWorkspaceUrl = `https://workspace.${COMPANY.group.baseDomain}`;
  const workspaceUrl = host ? `${proto}://${host}` : preferredWorkspaceUrl;

  return {
    host,
    proto,
    pathname,
    workspaceHost,
    basePath,
    workspaceUrl,
    preferredWorkspaceUrl,
  };
}

export function workspaceHref(basePath: string, path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!basePath) {
    return normalized === "/" ? "/" : normalized;
  }

  if (normalized === "/") {
    return basePath;
  }

  return `${basePath}${normalized}`;
}

export function workspaceLoginHref(nextPath: string, workspaceUrl: string) {
  const next = /^https?:\/\//i.test(nextPath)
    ? nextPath
    : `${workspaceUrl}${nextPath.startsWith("/") ? nextPath : `/${nextPath}`}`;
  return getAccountUrl(`/login?next=${encodeURIComponent(next)}`);
}
