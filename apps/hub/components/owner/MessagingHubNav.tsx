"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/owner/messaging", label: "Overview", match: (p: string) => p === "/owner/messaging" },
  {
    href: "/owner/messaging/inbox",
    label: "Incoming email",
    match: (p: string) => p.startsWith("/owner/messaging/inbox"),
  },
  {
    href: "/owner/messaging/team",
    label: "Team chat",
    match: (p: string) => p.startsWith("/owner/messaging/team"),
  },
  {
    href: "/owner/messaging/queues",
    label: "Delivery queues",
    match: (p: string) => p.startsWith("/owner/messaging/queues"),
  },
  {
    href: "/owner/messaging/alerts",
    label: "Owner alerts",
    match: (p: string) => p.startsWith("/owner/messaging/alerts"),
  },
] as const;

export function MessagingHubNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap gap-2 rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-2"
      aria-label="Messaging center sections"
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
