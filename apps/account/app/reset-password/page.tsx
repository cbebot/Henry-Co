import { COMPANY } from "@henryco/config";
import { getAuthCopy, translateSurfaceLabel } from "@henryco/i18n";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import AuthShell from "@/components/auth/AuthShell";
import { getAccountAppLocale } from "@/lib/locale-server";

export async function generateMetadata() {
  const locale = await getAccountAppLocale();
  return { title: `${translateSurfaceLabel(locale, "Set new password")} — Henry Onyx` };
}

export default async function ResetPasswordPage() {
  const locale = await getAccountAppLocale();
  const copy = getAuthCopy(locale);

  return (
    <AuthShell
      wordmark={COMPANY.group.name}
      brandEyebrow={copy.scene.eyebrow}
      brandLine={copy.scene.line}
      title={translateSurfaceLabel(locale, "Set new password")}
      subtitle={translateSurfaceLabel(locale, "Choose a new password for your account")}
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
