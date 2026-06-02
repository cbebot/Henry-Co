"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  HelpCircle,
  Home,
  Layers,
  Lock,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { ThemeToggle } from "@henryco/ui/public-shell";
import { createCmsSupabaseBrowser } from "@/lib/supabase/browser";

const NAV = [
  { label: "Overview", icon: ShieldCheck, href: "/dashboard", ready: true },
  { label: "Security", icon: Lock, href: "/settings", ready: true },
  { label: "Company Pages", icon: FileText, href: "/dashboard", ready: false },
  { label: "Brand & Settings", icon: Settings, href: "/dashboard", ready: false },
  { label: "Divisions", icon: Layers, href: "/dashboard", ready: false },
  { label: "People", icon: Users, href: "/dashboard", ready: false },
  { label: "Homepage", icon: Home, href: "/dashboard", ready: false },
  { label: "FAQs", icon: HelpCircle, href: "/dashboard", ready: false },
] as const;

export function AppShell({
  ownerEmail,
  children,
}: {
  ownerEmail: string | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      await createCmsSupabaseBrowser().auth.signOut();
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen bg-[var(--hc-bg)] text-[var(--hc-ink)]">
      <aside className="sticky top-0 hidden h-screen w-[var(--owner-sidebar-width)] shrink-0 flex-col border-r border-[var(--hc-line)] bg-[var(--hc-surface)] px-5 py-6 lg:flex">
        <div className="px-2">
          <p
            style={{ fontFamily: "var(--owner-font-display)" }}
            className="text-2xl tracking-tight"
          >
            Henry &amp; Co.
          </p>
          <p className="mt-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[var(--hc-accent-text)]">
            Owner CMS
          </p>
        </div>
        <nav className="mt-8 flex-1 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                aria-disabled={!item.ready || undefined}
                className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--hc-ink-soft)] transition-colors hover:bg-[var(--hc-accent-soft)] hover:text-[var(--hc-ink)]"
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" aria-hidden />
                  {item.label}
                </span>
                {!item.ready ? (
                  <span className="rounded-full bg-[var(--owner-accent-soft)] px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-[var(--hc-accent-text)]">
                    Soon
                  </span>
                ) : null}
              </a>
            );
          })}
        </nav>
        <div className="mt-4 space-y-3 border-t border-[var(--hc-line)] pt-4">
          <div className="flex items-center justify-between gap-2 px-2">
            <span
              className="min-w-0 truncate text-xs text-[var(--hc-ink-muted)]"
              title={ownerEmail ?? undefined}
            >
              {ownerEmail ?? "Owner"}
            </span>
            <ThemeToggle />
          </div>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--hc-ink-soft)] transition-colors hover:bg-[var(--hc-accent-soft)] hover:text-[var(--hc-ink)] disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[var(--hc-line)] px-6 py-4 lg:hidden">
          <p style={{ fontFamily: "var(--owner-font-display)" }} className="text-xl">
            Henry &amp; Co.
          </p>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={signOut}
              aria-label="Sign out"
              className="text-[var(--hc-ink-soft)]"
            >
              <LogOut className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
