import Link from "next/link";
import { COMPANY } from "@henryco/config";
import { getAuthCopy } from "@henryco/i18n";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import AuthShell from "@/components/auth/AuthShell";
import { getAccountAppLocale } from "@/lib/locale-server";

export async function generateMetadata() {
  const locale = await getAccountAppLocale();
  const copy = getAuthCopy(locale);
  return { title: `${copy.reset.heading} — Henry Onyx` };
}

export default async function ForgotPasswordPage() {
  const locale = await getAccountAppLocale();
  const copy = getAuthCopy(locale);

  return (
    <AuthShell
      wordmark={COMPANY.group.name}
      brandEyebrow={copy.scene.eyebrow}
      brandLine={copy.scene.line}
      title={copy.reset.heading}
      subtitle={copy.reset.subheading}
      altAction={
        <>
          {copy.signup.loginPrompt}{" "}
          <Link href="/login">{copy.signup.loginCta}</Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
