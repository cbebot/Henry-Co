import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = { title: "Sign In — Henry & Co." };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--acct-bg)] px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--acct-gold)] text-xl font-bold text-white shadow-lg">
            H
          </div>
          <h1 className="acct-display text-2xl">Welcome back</h1>
          <p className="mt-1.5 text-sm text-[var(--acct-muted)]">
            Sign in to your HenryCo account
          </p>
        </div>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-xs text-[var(--acct-muted)]">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="font-medium text-[var(--acct-gold)] hover:underline">
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}
