import { Suspense } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isRecoverableSupabaseAuthError } from "@henryco/config";
import { getAuthCopy } from "@henryco/i18n";
import LoginForm from "@/components/auth/LoginForm";
import LoginLanguageAccess from "@/components/auth/LoginLanguageAccess";
import Logo from "@/components/brand/Logo";
import { getAccountAppLocale } from "@/lib/locale-server";
import { DASHBOARD_PREFERENCE_COOKIE, resolveUserDashboard } from "@/lib/post-auth-routing";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function generateMetadata() {
  const locale = await getAccountAppLocale();
  const copy = getAuthCopy(locale);
  return { title: `${copy.login.submitButton} — Henry & Co.` };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServer();
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] | null = null;

  try {
    const auth = await supabase.auth.getUser();
    user = auth.data.user;
  } catch (error) {
    if (!isRecoverableSupabaseAuthError(error)) {
      throw error;
    }
  }

  if (user) {
    const headerStore = await headers();
    const cookieStore = await cookies();
    const forwardedHost = headerStore.get("x-forwarded-host") || headerStore.get("host");
    const forwardedProto = headerStore.get("x-forwarded-proto") || "https";
    const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : "https://account.henrycogroup.com";
    const preferredDashboardKey = cookieStore.get(DASHBOARD_PREFERENCE_COOKIE)?.value || null;

    const resolution = await resolveUserDashboard({
      user,
      next: params.next,
      origin,
      preferredDashboardKey,
    });

    redirect(resolution.kind === "redirect" ? resolution.redirectUrl : resolution.chooserUrl);
  }

  const signupHref = params.next ? `/signup?next=${encodeURIComponent(params.next)}` : "/signup";
  const locale = await getAccountAppLocale();
  const copy = getAuthCopy(locale);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--acct-bg)] px-4">
      <div className="w-full max-w-md acct-fade-in">
        <LoginLanguageAccess initialLocale={locale} />

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center">
            <Logo size={48} />
          </div>
          <h1 className="acct-display text-2xl">{copy.login.heading}</h1>
          <p className="mt-1.5 text-sm text-[var(--acct-muted)]">
            {copy.login.subheading}
          </p>
        </div>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-xs text-[var(--acct-muted)]">
          {copy.login.signupPrompt}{" "}
          <a href={signupHref} className="font-medium text-[var(--acct-gold)] hover:underline">
            {copy.login.signupCta}
          </a>
        </p>
      </div>
    </div>
  );
}
