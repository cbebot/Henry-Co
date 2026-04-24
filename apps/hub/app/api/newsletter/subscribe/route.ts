import { NextResponse } from "next/server";
import { subscribe } from "@/lib/newsletter/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SubscribeRequestBody = {
  email?: unknown;
  topicKeys?: unknown;
  locale?: unknown;
  country?: unknown;
  sourceSurface?: unknown;
  sourceDivision?: unknown;
};

function coerceStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function coerceString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export async function POST(request: Request) {
  let body: SubscribeRequestBody;
  try {
    body = (await request.json()) as SubscribeRequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, code: "validation_failed", message: "Invalid JSON" },
      { status: 400 }
    );
  }

  const email = coerceString(body.email);
  if (!email) {
    return NextResponse.json(
      { ok: false, code: "validation_failed", message: "Email is required" },
      { status: 400 }
    );
  }

  const result = await subscribe({
    email,
    topicKeys: coerceStringArray(body.topicKeys),
    locale: coerceString(body.locale),
    country: coerceString(body.country),
    sourceSurface: coerceString(body.sourceSurface),
    sourceDivision:
      (coerceString(body.sourceDivision) as
        | "hub"
        | "account"
        | "care"
        | "jobs"
        | "learn"
        | "logistics"
        | "marketplace"
        | "property"
        | "studio"
        | null) ?? null,
  });

  if (!result.ok) {
    const status =
      result.code === "validation_failed" || result.code === "suppressed" ? 400 : 500;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(
    {
      ok: true,
      subscriberId: result.subscriber.id,
      status: result.subscriber.status,
      topicKeys: result.topicKeys,
      preferenceUrl: result.preferenceUrl,
      created: result.created,
    },
    { status: result.created ? 201 : 200 }
  );
}
