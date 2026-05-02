/**
 * V2-ADDR-01 — Legacy create route — forwards to the canonical CRUD.
 *
 * Kept for one release cycle so any in-flight clients keep working. Internally
 * delegates to /api/addresses (POST). The legacy clients that posted the old
 * customer_addresses shape get a 400 with a hint to upgrade — they were never
 * geocoded, so we cannot transparently translate.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // Detect legacy shape: address_line1 / state / postal_code without place_id.
  const body = (await request.clone().json().catch(() => ({}))) as Record<string, unknown>;
  if (typeof body === "object" && body && "address_line1" in body && !("google_place_id" in body)) {
    return NextResponse.json(
      {
        error:
          "Address API has been upgraded. Please re-pick your address from the autocomplete suggestions and try again.",
        code: "legacy_shape_unsupported",
        next: "/account/settings/addresses",
      },
      { status: 410 }
    );
  }

  // Forward to canonical handler
  const url = new URL(request.url);
  const forward = new URL("/api/addresses", url.origin);
  return fetch(forward, {
    method: "POST",
    headers: request.headers,
    body: await request.text(),
  });
}
