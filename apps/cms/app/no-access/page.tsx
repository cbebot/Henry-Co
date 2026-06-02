import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "No access — Henry Onyx Owner CMS",
  robots: { index: false, follow: false },
};

export default function NoAccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--hc-bg)] px-6">
      <div className="w-full max-w-md rounded-3xl border border-[var(--hc-line)] bg-[var(--hc-surface)] p-8 text-center shadow-sm">
        <p
          style={{ fontFamily: "var(--owner-font-display)" }}
          className="text-2xl tracking-tight text-[var(--hc-ink)]"
        >
          Henry Onyx
        </p>
        <h1 className="mt-4 text-lg font-semibold text-[var(--hc-ink)]">Owner access only</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--hc-ink-muted)]">
          You&apos;re signed in, but this account isn&apos;t an active owner of the Henry Onyx
          CMS. If you believe this is a mistake, contact the platform owner.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--hc-line)] px-5 text-sm font-medium text-[var(--hc-ink)] transition-colors hover:border-[var(--hc-accent)]"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
