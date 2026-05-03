"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { type LucideIcon } from "lucide-react";

export type PortalTabDefinition = {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: number;
};

export function PortalTabBar({ tabs }: { tabs: PortalTabDefinition[] }) {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get("tab") || tabs[0]?.id;

  return (
    <div
      className="flex w-full gap-1 overflow-x-auto rounded-2xl border border-[var(--studio-line)] bg-[rgba(255,255,255,0.03)] p-1"
      role="tablist"
      aria-label="Project sections"
    >
      {tabs.map((tab) => {
        const params = new URLSearchParams(searchParams?.toString() || "");
        params.set("tab", tab.id);
        const Icon = tab.icon;
        const active = currentTab === tab.id;

        return (
          <Link
            key={tab.id}
            href={`${pathname}?${params.toString()}`}
            className="portal-tab-button"
            data-active={active ? "true" : "false"}
            role="tab"
            aria-selected={active}
            scroll={false}
          >
            {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
            <span>{tab.label}</span>
            {tab.badge && tab.badge > 0 ? (
              <span
                className={`grid h-4 min-w-[1rem] place-items-center rounded-full px-1 text-[10px] font-bold ${
                  active
                    ? "bg-[rgba(2,16,22,0.4)] text-[var(--studio-signal)]"
                    : "bg-[rgba(151,244,243,0.18)] text-[var(--studio-signal)]"
                }`}
              >
                {tab.badge > 99 ? "99+" : tab.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
