"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavActive, portalNavItems } from "@/lib/portal/navigation";

export function PortalBottomNav({
  unreadCount,
  outstandingInvoices,
}: {
  unreadCount: number;
  outstandingInvoices: number;
}) {
  const pathname = usePathname() || "";

  return (
    <nav className="portal-bottom-nav" aria-label="Portal navigation">
      {portalNavItems.map((item) => {
        const Icon = item.icon;
        const active = isNavActive(pathname, item);
        const badge =
          item.href === "/client/messages"
            ? unreadCount
            : item.href === "/client/payments"
            ? outstandingInvoices
            : 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="portal-bottom-nav-item relative"
            data-active={active ? "true" : "false"}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-4 w-4" aria-hidden />
            <span>{item.label}</span>
            {badge > 0 ? (
              <span className="absolute right-1 top-1 grid h-4 min-w-[1rem] place-items-center rounded-full bg-[#ff8f8f] px-1 text-[9px] font-bold text-[#02060a]">
                {badge > 9 ? "9+" : badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
