import { getAccountUrl, getHubUrl } from "@henryco/config";
import {
  getAuthenticatedSearchCatalog,
  getHubSearchCatalog,
} from "@henryco/intelligence";

export function getHubSearchResults(options?: { signedIn?: boolean }) {
  return getHubSearchCatalog({ signedIn: options?.signedIn });
}

export function getHubLockedSearchResults() {
  return getAuthenticatedSearchCatalog();
}

export function buildHubSearchSignInHref(query?: string | null) {
  const params = new URLSearchParams();
  const trimmed = String(query || "").trim();
  if (trimmed) {
    params.set("q", trimmed);
  }

  const next = new URL(
    params.size ? `/search?${params.toString()}` : "/search",
    `${getHubUrl().replace(/\/+$/, "")}/`
  ).toString();

  return getAccountUrl(`/login?next=${encodeURIComponent(next)}`);
}
