import Link from "next/link";
import { ArrowUpRight, BookOpen, FileText, Headphones, MapPin, Package, Receipt } from "lucide-react";

import type { AccountCopy } from "@henryco/i18n";

import {
  logisticsBookUrl,
  logisticsQuoteUrl,
} from "@/lib/logistics-module";
import { getDivisionUrl } from "@henryco/config";

type Action = {
  href: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  external: boolean;
};

type Props = {
  copy: AccountCopy["divisionLogistics"];
};

export function QuickActions({ copy }: Props) {
  const logisticsBase = getDivisionUrl("logistics").replace(/\/$/, "");
  const qa = copy.quickActions;
  const actions: Action[] = [
    {
      href: logisticsBookUrl(),
      label: qa.bookLabel,
      desc: qa.bookDesc,
      icon: Package,
      external: true,
    },
    {
      href: `${logisticsBase}/track`,
      label: qa.trackLabel,
      desc: qa.trackDesc,
      icon: MapPin,
      external: true,
    },
    {
      href: logisticsQuoteUrl(),
      label: qa.quoteLabel,
      desc: qa.quoteDesc,
      icon: FileText,
      external: true,
    },
    {
      href: "/addresses",
      label: qa.addressesLabel,
      desc: qa.addressesDesc,
      icon: BookOpen,
      external: false,
    },
    {
      href: "/invoices",
      label: qa.invoicesLabel,
      desc: qa.invoicesDesc,
      icon: Receipt,
      external: false,
    },
    {
      href: "/support",
      label: qa.supportLabel,
      desc: qa.supportDesc,
      icon: Headphones,
      external: false,
    },
  ];
  return (
    <div className="acct-log__actions" role="list" aria-label={qa.ariaLabel}>
      {actions.map((a) => {
        const Icon = a.icon;
        const inner = (
          <>
            <span className="acct-log__action-icon" aria-hidden>
              <Icon size={18} aria-hidden />
            </span>
            <h4 className="acct-log__action-label">
              {a.label}
              {a.external ? (
                <ArrowUpRight
                  size={13}
                  aria-hidden
                  style={{ marginLeft: 6, verticalAlign: "middle", color: "var(--acct-muted)" }}
                />
              ) : null}
            </h4>
            <p className="acct-log__action-desc">{a.desc}</p>
          </>
        );
        if (a.external) {
          return (
            <a
              key={a.label}
              className="acct-log__action"
              href={a.href}
              target="_blank"
              rel="noopener noreferrer"
              role="listitem"
            >
              {inner}
            </a>
          );
        }
        return (
          <Link key={a.label} className="acct-log__action" href={a.href} role="listitem">
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
