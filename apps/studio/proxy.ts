import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  buildSharedCookieWriteOptions,
  filterValidSupabaseSessionCookies,
  findMalformedSupabaseSessionCookieNames,
  getAccountUrl,
  getDivisionUrl,
  getSharedCookieDomain,
  isRecoverableSupabaseAuthError,
  isSupabaseAuthTokenCookie,
} from "@henryco/config";

/**
 * Auth-gated path prefixes. A request to any of these paths must carry a
 * valid Supabase session — if it doesn't, we issue an HTTP 307 to the
 * shared account login here in the middleware, BEFORE any RSC streaming
 * starts.
 *
 * Why middleware and not the page-level `requireStudioUser`/
 * `requireClientPortalViewer`? The page-level guards live inside server
 * components that are wrapped in Suspense by `loading.tsx`. Once Next
 * has begun streaming the loading shell, throwing `redirect()` from the
 * inner page is too late — Next serialises the redirect digest into the
 * RSC payload but the wire response stays HTTP 200, so the browser sits
 * on the skeleton forever. Gating in middleware sidesteps that by
 * returning a real 307 before any bytes are written.
 *
 * Page-level guards are kept as defence-in-depth (e.g. for direct API
 * calls or a future relax of the matcher).
 */
const AUTH_GATED_PREFIXES = [
  "/client",
  "/sales",
  "/pm",
  "/finance",
  "/delivery",
  "/owner",
  "/support",
] as const;

function isAuthGatedPath(pathname: string): boolean {
  return AUTH_GATED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function buildLoginRedirect(request: NextRequest): URL {
  const returnTo = `${getDivisionUrl("studio")}${request.nextUrl.pathname}${request.nextUrl.search}`;
  const loginPath = `/login?next=${encodeURIComponent(returnTo)}`;
  return new URL(getAccountUrl(loginPath));
}

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

export async function proxy(request: NextRequest) {
  const reqHeaders = new Headers(request.headers);
  reqHeaders.set("x-studio-return-path", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  const malformedCookieNames = new Set(findMalformedSupabaseSessionCookieNames(request.cookies.getAll()));

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

  if (malformedCookieNames.size > 0) {
    clearSupabaseAuthCookies(request, response, malformedCookieNames);
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
        return filterValidSupabaseSessionCookies(request.cookies.getAll());
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, buildSharedCookieWriteOptions(options, cookieDomain));
        });
      },
    },
  });

  let userId: string | null = null;
  try {
    const auth = await supabase.auth.getUser();
    userId = auth.data.user?.id ?? null;
  } catch (error) {
    if (!isRecoverableSupabaseAuthError(error)) {
      throw error;
    }
    clearSupabaseAuthCookies(request, response);
  }

  if (!userId && isAuthGatedPath(request.nextUrl.pathname)) {
    return NextResponse.redirect(buildLoginRedirect(request), 307);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
