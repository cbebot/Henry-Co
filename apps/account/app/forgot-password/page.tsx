import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import Logo from "@/components/brand/Logo";

export const metadata = { title: "Reset Password — Henry & Co." };

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--acct-bg)] px-4">
      <div className="w-full max-w-md acct-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center">
            <Logo size={48} />
          </div>
          <h1 className="acct-display text-2xl">Reset your password</h1>
          <p className="mt-1.5 text-sm text-[var(--acct-muted)]">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <ForgotPasswordForm />

        <p className="mt-6 text-center text-xs text-[var(--acct-muted)]">
          Remember your password?{" "}
          <a href="/login" className="font-medium text-[var(--acct-gold)] hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
