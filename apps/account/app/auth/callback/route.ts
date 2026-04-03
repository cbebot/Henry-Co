import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSharedCookieDomain } from "@henryco/config";

function resolveNext(origin: string, next: string | null) {
  if (next && /^https?:\/\//i.test(next)) {
    return next;
  }

  const safeNext = next && next.startsWith("/") ? next : "/";
  return `${origin}${safeNext}`;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: (() => {
          const cookieDomain = getSharedCookieDomain(new URL(origin).hostname);
          return cookieDomain
            ? {
                domain: cookieDomain,
                path: "/",
                sameSite: "lax",
                secure: true,
              }
            : undefined;
        })(),
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(tokens) {
            for (const { name, value, options } of tokens) {
              cookieStore.set(name, value, options);
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(resolveNext(origin, next));
    }
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", "auth");
  if (next) {
    loginUrl.searchParams.set("next", next);
  }
  return NextResponse.redirect(loginUrl);
}
