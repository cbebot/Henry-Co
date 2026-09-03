"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useOptionalHenryCoLocale } from "@henryco/i18n/react";
import { getOwnerBreadcrumbs } from "@/lib/owner-navigation";

export default function Breadcrumbs() {
  const pathname = usePathname();
  const crumbs = getOwnerBreadcrumbs(pathname);
  const locale = useOptionalHenryCoLocale() ?? "en";
  const t = (text: string) => translateSurfaceLabel(locale, text);

  if (crumbs.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs text-[var(--acct-muted)] mb-4">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={12} className="opacity-50" />}
          {i < crumbs.length - 1 ? (
            <Link
              href={crumb.href}
              className="hover:text-[var(--acct-ink)] transition-colors"
            >
              {t(crumb.label)}
            </Link>
          ) : (
            <span className="font-medium text-[var(--acct-ink)]">
              {t(crumb.label)}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
