import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in — Henry & Co. Owner CMS",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const initialError =
    sp.error === "auth"
      ? "That sign-in link was invalid or expired. Request a new one."
      : null;
  const next = typeof sp.next === "string" ? sp.next : undefined;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--hc-bg)] px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 120% at 50% -10%, var(--hc-accent-soft), transparent 60%)",
        }}
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <p
            style={{ fontFamily: "var(--owner-font-display)" }}
            className="text-3xl tracking-tight text-[var(--hc-ink)]"
          >
            Henry &amp; Co.
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--hc-accent-text)]">
            Owner CMS
          </p>
        </div>
        <div className="rounded-3xl border border-[var(--hc-line)] bg-[var(--hc-surface)] p-7 shadow-sm">
          <h1 className="text-lg font-semibold text-[var(--hc-ink)]">Sign in</h1>
          <p className="mt-1 text-sm leading-6 text-[var(--hc-ink-muted)]">
            Enter your owner email. We&apos;ll send a secure sign-in link — no password.
          </p>
          <div className="mt-5">
            <LoginForm initialError={initialError} next={next} />
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-[var(--hc-ink-muted)]">
          Access is restricted to the Henry &amp; Co. owner.
        </p>
      </div>
    </main>
  );
}
