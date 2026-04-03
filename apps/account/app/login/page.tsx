import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";
import Logo from "@/components/brand/Logo";

export const metadata = { title: "Sign In — Henry & Co." };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const signupHref = params.next ? `/signup?next=${encodeURIComponent(params.next)}` : "/signup";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--acct-bg)] px-4">
      <div className="w-full max-w-md acct-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center">
            <Logo size={48} />
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
          <a href={signupHref} className="font-medium text-[var(--acct-gold)] hover:underline">
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}
