import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  getSharedCookieDomain,
  isRecoverableSupabaseAuthError,
  isSupabaseAuthTokenCookie,
} from "@henryco/config";

function clearSupabaseAuthCookies(request: NextRequest, response: NextResponse) {
  const cookieDomain = getSharedCookieDomain(request.nextUrl.hostname);
  for (const cookie of request.cookies.getAll()) {
    if (!isSupabaseAuthTokenCookie(cookie.name)) {
      continue;
    }

    request.cookies.set(cookie.name, "");
    response.cookies.set(cookie.name, "", {
      domain: cookieDomain,
      expires: new Date(0),
      path: "/",
      sameSite: "lax",
      secure: true,
    });
  }
}

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
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

  try {
    await supabase.auth.getUser();
  } catch (error) {
    if (!isRecoverableSupabaseAuthError(error)) {
      throw error;
    }

    clearSupabaseAuthCookies(request, response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
