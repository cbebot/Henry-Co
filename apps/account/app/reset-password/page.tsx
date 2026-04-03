import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import Logo from "@/components/brand/Logo";

export const metadata = { title: "Set New Password — Henry & Co." };

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--acct-bg)] px-4">
      <div className="w-full max-w-md acct-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center">
            <Logo size={48} />
          </div>
          <h1 className="acct-display text-2xl">Set new password</h1>
          <p className="mt-1.5 text-sm text-[var(--acct-muted)]">
            Choose a new password for your account
          </p>
        </div>

        <ResetPasswordForm />
      </div>
    </div>
  );
}
