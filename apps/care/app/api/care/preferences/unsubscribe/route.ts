import { NextResponse } from "next/server";
import { applyMarketingPreferenceToken } from "@/lib/messaging/preferences";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = String(url.searchParams.get("token") || "").trim();
  const mode =
    String(url.searchParams.get("mode") || "").trim().toLowerCase() === "resubscribe"
      ? "resubscribe"
      : "unsubscribe";

  const result = await applyMarketingPreferenceToken({
    token,
    mode,
    route: "/api/care/preferences/unsubscribe",
  });

  // V3-ACTIONS-01 — dual-mode: the email unsubscribe link stays a document
  // navigation (redirect), while the in-page "Undo" action fetches with
  // `x-henryco-async: 1` and acknowledges in place.
  const wantsJson =
    request.headers.get("x-henryco-async") === "1" ||
    (request.headers.get("accept") || "").includes("application/json");
  if (wantsJson) {
    return NextResponse.json(
      {
        ok: result.ok,
        mode,
        email: result.email || null,
        phone: result.phone || null,
      },
      { status: result.ok ? 200 : 400 }
    );
  }

  const destination = new URL("/unsubscribe", url.origin);
  destination.searchParams.set("mode", mode);
  destination.searchParams.set("status", result.ok ? "success" : "error");

  if (result.email) {
    destination.searchParams.set("email", result.email);
  }

  if (result.phone) {
    destination.searchParams.set("phone", result.phone);
  }

  if (token) {
    destination.searchParams.set("token", token);
  }

  return NextResponse.redirect(destination);
}
