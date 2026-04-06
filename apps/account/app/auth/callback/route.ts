import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getSharedCookieDomain,
  normalizeEmail,
  normalizePhone,
  normalizeTrustedRedirect,
} from "@henryco/config";
import { ensureAccountProfileRecords } from "@/lib/account-profile";
import { scheduleLinkedCareBookingsSync } from "@/lib/care-sync";
import { resolveAuthenticatedDestination } from "@/lib/post-auth-routing";
import { detectSecurityRequestContext, logSecurityEvent } from "@/lib/security-events";

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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await ensureAccountProfileRecords(user);
        const fullName =
          (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ||
          (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null) ||
          null;
        const phone =
          normalizePhone(
            typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : null
          ) || null;
        scheduleLinkedCareBookingsSync({
          userId: user.id,
          email: normalizeEmail(user.email),
          fullName,
          phone,
        });
        const context = await detectSecurityRequestContext();
        await logSecurityEvent({
          userId: user.id,
          eventType: "account_sign_in",
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          locationSummary: context.locationSummary,
          metadata: {
            source: "auth_callback",
            email: user.email || null,
          },
        });
        const destination = await resolveAuthenticatedDestination({
          user,
          next,
          origin,
        });
        return NextResponse.redirect(destination);
      }
    }
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", "auth");
  const safeNext = normalizeTrustedRedirect(next);
  if (safeNext !== "/") {
    loginUrl.searchParams.set("next", safeNext);
  }
  return NextResponse.redirect(loginUrl);
}
