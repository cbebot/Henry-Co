import type { ReactNode } from "react";
import Link from "next/link";
import { Bot } from "lucide-react";
import { requireOwner } from "@/lib/owner-auth";
import OwnerSidebar from "@/components/owner/OwnerSidebar";
import OwnerMobileNav from "@/components/owner/OwnerMobileNav";

export default async function OwnerCommandLayout({ children }: { children: ReactNode }) {
  const user = await requireOwner();

  return (
    <div className="owner-command-root min-h-screen bg-[var(--acct-bg)] text-[var(--acct-ink)]">
      <OwnerMobileNav user={user} />
      <OwnerSidebar user={user} />
      <main className="min-h-screen pt-14 transition-[padding] duration-200 lg:pt-0 lg:pl-[var(--owner-sidebar-width)]">
        <div className="owner-command-backdrop pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(201,162,39,0.14),transparent_55%),radial-gradient(ellipse_80%_50%_at_100%_0%,rgba(59,130,246,0.06),transparent_45%)]" />
        <div className="relative mx-auto max-w-[1680px] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          {user.commandCenterProfileIncomplete ? (
            <div
              className="mb-6 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-[var(--acct-ink)]"
              role="status"
            >
              <p className="font-semibold text-amber-950/90 dark:text-amber-100/95">Limited owner profile data</p>
              <p className="mt-1 leading-relaxed text-[var(--acct-muted)]">
                We could not load your full command-center profile from the database (configuration, connectivity, or
                schema may be involved). Navigation remains available; retry after a moment or contact engineering if this
                continues. Technical details are recorded in server logs for diagnosis.
              </p>
            </div>
          ) : null}
          {children}
        </div>
      </main>
      <Link
        href="/owner/ai"
        className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--acct-gold)] text-[var(--acct-ink)] shadow-[0_12px_40px_rgba(201,162,39,0.45)] ring-2 ring-white/30 transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--acct-gold)] lg:bottom-8 lg:right-8"
        aria-label="Open owner assistant"
        title="Owner assistant — summaries, signals, and safe guidance"
      >
        <Bot className="h-6 w-6" aria-hidden />
      </Link>
    </div>
  );
}
