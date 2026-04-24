import { NextResponse } from "next/server";
import { loadPreferencesByToken, updatePreferences } from "@/lib/newsletter/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getToken(request: Request): string | null {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  return token ? String(token) : null;
}

export async function GET(request: Request) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json(
      { ok: false, code: "invalid_token", message: "token query param required" },
      { status: 400 }
    );
  }
  const result = await loadPreferencesByToken(token);
  if (!result.ok) {
    return NextResponse.json(result, { status: result.code === "expired_token" ? 410 : 400 });
  }
  return NextResponse.json({
    ok: true,
    subscriber: {
      id: result.subscriber.id,
      email: result.subscriber.email,
      status: result.subscriber.status,
      locale: result.subscriber.locale,
      country: result.subscriber.country,
    },
    topicKeys: result.topicKeys,
  });
}

export async function PATCH(request: Request) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json(
      { ok: false, code: "invalid_token", message: "token query param required" },
      { status: 400 }
    );
  }
  let body: {
    topicKeys?: unknown;
    pause?: unknown;
    locale?: unknown;
    country?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, code: "validation_failed", message: "Invalid JSON" },
      { status: 400 }
    );
  }
  const topicKeys = Array.isArray(body.topicKeys)
    ? body.topicKeys.filter((v): v is string => typeof v === "string")
    : [];

  const result = await updatePreferences({
    token,
    topicKeys,
    pause: body.pause === true,
    locale: typeof body.locale === "string" ? body.locale : null,
    country: typeof body.country === "string" ? body.country : null,
  });
  if (!result.ok) {
    return NextResponse.json(result, { status: result.code === "invalid_token" ? 400 : 500 });
  }
  return NextResponse.json({
    ok: true,
    status: result.subscriber.status,
    topicKeys: result.topicKeys,
  });
}
