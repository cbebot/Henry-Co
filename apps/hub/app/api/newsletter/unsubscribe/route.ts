import { NextResponse } from "next/server";
import { unsubscribeByToken } from "@/lib/newsletter/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handle(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json(
      { ok: false, code: "invalid_token", message: "token query param required" },
      { status: 400 }
    );
  }
  const result = await unsubscribeByToken(token);
  if (!result.ok) {
    return NextResponse.json(result, { status: result.code === "invalid_token" ? 400 : 500 });
  }
  return NextResponse.json({ ok: true, email: result.email });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
