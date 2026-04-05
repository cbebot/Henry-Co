import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSharedCookieDomain } from "@henryco/config";

export async function proxy(request: NextRequest) {
  const reqHeaders = new Headers(request.headers);
  reqHeaders.set("x-learn-return-path", `${request.nextUrl.pathname}${request.nextUrl.search}`);

  const response = NextResponse.next({
    request: {
      headers: reqHeaders,
    },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    return response;
  }

  const cookieDomain = getSharedCookieDomain(request.nextUrl.hostname);

  const supabase = createServerClient(url, anon, {
    cookieOptions: cookieDomain
      ? {
          domain: cookieDomain,
          path: "/",
          sameSite: "lax",
          secure: true,
        }
      : undefined,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
