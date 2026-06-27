import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import Logo from "@/components/brand/Logo";
import { getAccountMiscExtraCopy } from "@henryco/i18n";
import { getAccountAppLocale } from "@/lib/locale-server";

export async function generateMetadata() {
  const locale = await getAccountAppLocale();
  const copy = getAccountMiscExtraCopy(locale);
  return { title: copy.resetPassword.metadataTitle };
}

export default async function ResetPasswordPage() {
  const locale = await getAccountAppLocale();
  const copy = getAccountMiscExtraCopy(locale);
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--acct-bg)] px-4">
      <div className="w-full max-w-md acct-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center">
            <Logo size={48} />
          </div>
          <h1 className="acct-display text-2xl">{copy.resetPassword.heading}</h1>
          <p className="mt-1.5 text-sm text-[var(--acct-muted)]">
            {copy.resetPassword.subtitle}
          </p>
        </div>

        <ResetPasswordForm />
      </div>
    </div>
  );
}
