import { NextResponse, type NextRequest } from "next/server";
import { isFirstPartyOrigin } from "@henryco/config";

/**
 * The Intelligence endpoints are centralised in the account app (it owns the Onyx Line spine
 * and the wallet). The shared launcher, mounted on every division page, POSTs to them
 * cross-subdomain, so we allow-list first-party origins for credentialed requests. Only
 * henryonyx.com and its subdomains (and local dev) are ever reflected, never an arbitrary origin.
 */
export function intelligenceCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin");
  if (!isFirstPartyOrigin(origin) || !origin) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/** The shared CORS preflight for the cross-subdomain launcher endpoints. */
export function intelligencePreflight(request: NextRequest): NextResponse {
  return new NextResponse(null, { status: 204, headers: intelligenceCorsHeaders(request) });
}
