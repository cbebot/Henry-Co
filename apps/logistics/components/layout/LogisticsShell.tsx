import Link from "next/link";
import { getDivisionConfig } from "@henryco/config";
import type { ReactNode } from "react";

export default function LogisticsShell({
  children,
  kicker,
  accountSlot,
}: {
  children: ReactNode;
  kicker?: string;
  accountSlot?: ReactNode;
}) {
  const logistics = getDivisionConfig("logistics");

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-40 border-b border-[var(--logistics-line)] bg-[#09060a]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--logistics-accent-soft)]">
              {kicker || logistics.shortName}
            </span>
            <span className="text-base font-semibold tracking-tight text-white">{logistics.name}</span>
            <span className="hidden text-xs text-[var(--logistics-muted)] sm:inline">{logistics.sub}</span>
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            {accountSlot ? <div className="order-first sm:order-none">{accountSlot}</div> : null}
            <nav className="flex flex-wrap justify-end gap-1.5 sm:gap-2">
              {logistics.publicNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-transparent px-3 py-1.5 text-xs font-medium text-[var(--logistics-muted)] transition hover:border-[var(--logistics-line)] hover:bg-white/[0.04] hover:text-white sm:text-sm"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>
      {children}
      <footer className="mt-12 border-t border-[var(--logistics-line)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-white">{logistics.name}</div>
            <p className="mt-1 max-w-md text-sm text-[var(--logistics-muted)]">{logistics.tagline}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-[var(--logistics-muted)]">
            <a href={`mailto:${logistics.supportEmail}`} className="hover:text-white">
              {logistics.supportEmail}
            </a>
            <span className="text-white/20">|</span>
            <a href={`tel:${logistics.supportPhone}`} className="hover:text-white">
              {logistics.supportPhone}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
