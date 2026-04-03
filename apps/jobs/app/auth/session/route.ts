import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

type SessionPayload = {
  code?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
};

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as SessionPayload | null;
  const code = payload?.code?.trim();
  const accessToken = payload?.accessToken?.trim();
  const refreshToken = payload?.refreshToken?.trim();

  if (!code && !(accessToken && refreshToken)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing callback credentials.",
      },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServer();
  const result = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.setSession({
        access_token: accessToken!,
        refresh_token: refreshToken!,
      });

  if (result.error) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error.message,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
