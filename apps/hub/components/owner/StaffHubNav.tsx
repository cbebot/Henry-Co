"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/owner/staff", label: "Overview", match: (p: string) => p === "/owner/staff" },
  {
    href: "/owner/staff/directory",
    label: "Directory",
    match: (p: string) => p.startsWith("/owner/staff/directory") || p.startsWith("/owner/staff/users"),
  },
  { href: "/owner/staff/tree", label: "Org tree", match: (p: string) => p.startsWith("/owner/staff/tree") },
  { href: "/owner/staff/invite", label: "Invite", match: (p: string) => p.startsWith("/owner/staff/invite") },
  { href: "/owner/staff/roles", label: "Roles", match: (p: string) => p.startsWith("/owner/staff/roles") },
] as const;

export function StaffHubNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap gap-2 rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-2"
      aria-label="Staff intelligence sections"
    >
      {LINKS.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              active
                ? "bg-[var(--acct-gold-soft)] text-[var(--acct-ink)] ring-1 ring-[var(--acct-gold)]/35"
                : "text-[var(--acct-muted)] hover:bg-[var(--acct-surface)] hover:text-[var(--acct-ink)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
