import Link from "next/link";
import { COMPANY } from "@henryco/config";
import { getAuthCopy } from "@henryco/i18n";
import SignupForm from "@/components/auth/SignupForm";
import AuthShell from "@/components/auth/AuthShell";
import { getAccountAppLocale } from "@/lib/locale-server";

export async function generateMetadata() {
  const locale = await getAccountAppLocale();
  const copy = getAuthCopy(locale);
  return { title: `${copy.signup.submitButton} — Henry Onyx` };
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const loginHref = params.next ? `/login?next=${encodeURIComponent(params.next)}` : "/login";
  const locale = await getAccountAppLocale();
  const copy = getAuthCopy(locale);

  return (
    <AuthShell
      wordmark={COMPANY.group.name}
      brandEyebrow={copy.scene.eyebrow}
      brandLine={copy.scene.line}
      title={copy.signup.heading}
      subtitle={copy.signup.subheading}
      altAction={
        <>
          {copy.signup.loginPrompt}{" "}
          <Link href={loginHref}>{copy.signup.loginCta}</Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
