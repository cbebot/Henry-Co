import { getAuthCopy } from "@henryco/i18n";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import Logo from "@/components/brand/Logo";
import { getAccountAppLocale } from "@/lib/locale-server";

export async function generateMetadata() {
  const locale = await getAccountAppLocale();
  const copy = getAuthCopy(locale);
  return { title: `${copy.reset.heading} — Henry & Co.` };
}

export default async function ForgotPasswordPage() {
  const locale = await getAccountAppLocale();
  const copy = getAuthCopy(locale);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--acct-bg)] px-4">
      <div className="w-full max-w-md acct-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center">
            <Logo size={48} />
          </div>
          <h1 className="acct-display text-2xl">{copy.reset.heading}</h1>
          <p className="mt-1.5 text-sm text-[var(--acct-muted)]">
            {copy.reset.subheading}
          </p>
        </div>

        <ForgotPasswordForm />

        <p className="mt-6 text-center text-xs text-[var(--acct-muted)]">
          {copy.signup.loginPrompt}{" "}
          <a href="/login" className="font-medium text-[var(--acct-gold)] hover:underline">
            {copy.signup.loginCta}
          </a>
        </p>
      </div>
    </div>
  );
}
