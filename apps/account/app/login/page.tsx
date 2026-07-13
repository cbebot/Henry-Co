import { Suspense } from "react";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { COMPANY, henrySubdomain, isRecoverableSupabaseAuthError } from "@henryco/config";
import { getAuthCopy } from "@henryco/i18n";
import LoginForm from "@/components/auth/LoginForm";
import LoginLanguageAccess from "@/components/auth/LoginLanguageAccess";
import AuthShell from "@/components/auth/AuthShell";
import { getAccountAppLocale } from "@/lib/locale-server";
import { DASHBOARD_PREFERENCE_COOKIE, resolveUserDashboard } from "@/lib/post-auth-routing";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function generateMetadata() {
  const locale = await getAccountAppLocale();
  const copy = getAuthCopy(locale);
  return { title: `${copy.login.submitButton} — Henry Onyx` };
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

  // Already signed in → route through the live-access resolver (never trust the
  // requested `next` alone; resolveUserDashboard re-validates the snapshot).
  if (user) {
    const headerStore = await headers();
    const cookieStore = await cookies();
    const forwardedHost = headerStore.get("x-forwarded-host") || headerStore.get("host");
    const forwardedProto = headerStore.get("x-forwarded-proto") || "https";
    const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : henrySubdomain("account");
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
    <AuthShell
      wordmark={COMPANY.group.name}
      brandEyebrow={copy.scene.eyebrow}
      brandLine={copy.scene.line}
      title={copy.login.heading}
      subtitle={copy.login.subheading}
      headerSlot={<LoginLanguageAccess initialLocale={locale} />}
      altAction={
        <>
          {copy.login.signupPrompt}{" "}
          <Link href={signupHref}>{copy.login.signupCta}</Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
