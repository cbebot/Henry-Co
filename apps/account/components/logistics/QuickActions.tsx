import Link from "next/link";
import { ArrowUpRight, BookOpen, FileText, Headphones, MapPin, Package, Receipt } from "lucide-react";
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

export function QuickActions() {
  const logisticsBase = getDivisionUrl("logistics").replace(/\/$/, "");
  const actions: Action[] = [
    {
      href: logisticsBookUrl(),
      label: "Book a delivery",
      desc: "Pickup & drop-off in a single guided flow.",
      icon: Package,
      external: true,
    },
    {
      href: `${logisticsBase}/track`,
      label: "Track by code",
      desc: "Live status, ETA and rider context.",
      icon: MapPin,
      external: true,
    },
    {
      href: logisticsQuoteUrl(),
      label: "Quote first",
      desc: "Indicative pricing before you commit.",
      icon: FileText,
      external: true,
    },
    {
      href: "/addresses",
      label: "Saved addresses",
      desc: "Pickup and drop-off contacts.",
      icon: BookOpen,
      external: false,
    },
    {
      href: "/invoices",
      label: "Receipts & invoices",
      desc: "Branded PDFs for every shipment.",
      icon: Receipt,
      external: false,
    },
    {
      href: "/support",
      label: "Logistics support",
      desc: "Open a thread tagged to your account.",
      icon: Headphones,
      external: false,
    },
  ];
  return (
    <div className="acct-log__actions" role="list" aria-label="Logistics quick actions">
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
