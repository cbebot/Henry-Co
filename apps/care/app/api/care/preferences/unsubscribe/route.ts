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
