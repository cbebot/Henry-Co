import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { getAccountUrl } from "@henryco/config";

export const dynamic = "force-dynamic";

export default function OwnerNoAccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--acct-bg)] px-4 py-16">
      <div className="acct-card w-full max-w-lg p-8 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--acct-red-soft)] text-[var(--acct-red)]">
          <ShieldOff size={28} strokeWidth={1.75} />
        </div>
        <p className="acct-kicker mb-2">Owner HQ</p>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--acct-ink)]">
          This account does not have owner access
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--acct-muted)]">
          You&apos;re signed in, but this HenryCo account is not active in the owner access list.
          If you expected owner access, ask an existing owner or administrator to verify your
          `owner_profiles` record.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={getAccountUrl("/")}
            className="acct-button-primary rounded-xl px-5 py-2.5 text-sm"
          >
            Go to account home
          </Link>
          <Link
            href={getAccountUrl("/support")}
            className="acct-button-secondary rounded-xl px-5 py-2.5 text-sm"
          >
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}
