import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  buildSharedCookieWriteOptions,
  filterValidSupabaseSessionCookies,
  findMalformedSupabaseSessionCookieNames,
  getHqUrl,
  getSharedCookieDomain,
  isRecoverableSupabaseAuthError,
  isSupabaseAuthTokenCookie,
} from "@henryco/config";

const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/auth/confirm",
  "/auth/resolve",
  "/auth/verified",
];
const REFERRAL_COOKIE_NAME = "hc_ref";
const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function clearSupabaseAuthCookies(
  request: NextRequest,
  response: NextResponse,
  cookieNames?: Set<string>,
) {
  const cookieDomain = getSharedCookieDomain(request.nextUrl.hostname);
  for (const cookie of request.cookies.getAll()) {
    if (!isSupabaseAuthTokenCookie(cookie.name)) {
      continue;
    }

    if (cookieNames && !cookieNames.has(cookie.name)) {
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

function captureReferralCode(request: NextRequest, response: NextResponse) {
  const ref = request.nextUrl.searchParams.get("ref");
  if (!ref || ref.length > 64) return;
  const cookieDomain = getSharedCookieDomain(request.nextUrl.hostname);
  response.cookies.set(REFERRAL_COOKIE_NAME, ref, {
    path: "/",
    domain: cookieDomain,
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: REFERRAL_COOKIE_MAX_AGE,
  });
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const malformedCookieNames = new Set(findMalformedSupabaseSessionCookieNames(request.cookies.getAll()));

  if (pathname.startsWith("/owner")) {
    return NextResponse.redirect(`${getHqUrl(pathname)}${search}`, 307);
  }

  if (
    PUBLIC_ROUTES.some((route) => pathname.startsWith(route)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/cron/") ||
    pathname.startsWith("/api/webhooks/account") ||
    pathname.includes(".")
  ) {
    const publicResponse = NextResponse.next();
    if (malformedCookieNames.size > 0) {
      clearSupabaseAuthCookies(request, publicResponse, malformedCookieNames);
    }
    captureReferralCode(request, publicResponse);
    return publicResponse;
  }

  if (malformedCookieNames.size > 0) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    const redirectResponse = NextResponse.redirect(loginUrl, 307);
    clearSupabaseAuthCookies(request, redirectResponse, malformedCookieNames);
    captureReferralCode(request, redirectResponse);
    return redirectResponse;
  }

  const response = NextResponse.next({ request });
  const cookieDomain = getSharedCookieDomain(request.nextUrl.hostname);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
          return filterValidSupabaseSessionCookies(request.cookies.getAll());
        },
        setAll(tokens) {
          for (const { name, value, options } of tokens) {
            request.cookies.set(name, value);
            response.cookies.set(
              name,
              value,
              buildSharedCookieWriteOptions(options, cookieDomain)
            );
          }
        },
      },
    }
  );

  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] | null = null;

  try {
    const auth = await supabase.auth.getUser();
    user = auth.data.user;
  } catch (error) {
    if (!isRecoverableSupabaseAuthError(error)) {
      throw error;
    }

    clearSupabaseAuthCookies(request, response);
  }

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  captureReferralCode(request, response);

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
