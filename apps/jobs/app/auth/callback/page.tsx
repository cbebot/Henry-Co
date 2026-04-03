import { Suspense } from "react";
import AuthCallbackClient from "@/components/auth/AuthCallbackClient";

export default function AuthCallbackPage() {
  return (
    <main className="relative overflow-hidden bg-[var(--jobs-cream)] text-[var(--jobs-ink)]">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="jobs-panel w-full rounded-[2rem] p-8 text-center sm:p-10">
              <div className="mx-auto h-11 w-11 animate-spin rounded-full border-2 border-[var(--jobs-line)] border-t-[var(--jobs-accent)]" />
              <h1 className="mt-5 text-2xl font-semibold tracking-[-0.02em]">Securing your HenryCo Jobs session</h1>
              <p className="mt-3 text-sm leading-7 text-[var(--jobs-muted)]">
                We are validating your sign-in and restoring your workspace.
              </p>
            </div>
          }
        >
          <AuthCallbackClient />
        </Suspense>
      </div>
    </main>
  );
}
