import "server-only";

import { getDivisionUrl, type DivisionKey } from "@henryco/config";

export type OwnerDivisionReviewLink = {
  label: string;
  description: string;
  href: string;
  division: string;
};

const DIVISION_KEYS = new Set<string>([
  "hub",
  "care",
  "marketplace",
  "property",
  "jobs",
  "learn",
  "studio",
  "logistics",
]);

function divisionOrigin(slug: string): string | null {
  if (!DIVISION_KEYS.has(slug)) return null;
  return getDivisionUrl(slug as DivisionKey).replace(/\/+$/, "");
}

/** True when the link leaves HQ (typically open in new tab). */
export function isOwnerDivisionExternalHref(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}

/**
 * Approval-center destinations verified against **live** henrycogroup.com (Apr 2026):
 * Subdomain `/owner`, `/moderation`, and similar staff shells currently render `StaffSurfaceRetired`.
 * HQ must not send owners there for real work. We keep one external staff path that still serves
 * a real sign-in shell: Marketplace `/admin/seller-applications`. Everything else is HQ.
 */
export const OWNER_APPROVAL_CENTER_LINKS: OwnerDivisionReviewLink[] = [
  {
    label: "Marketplace — division room (HQ)",
    description:
      "Marketplace KPIs, queues, and signals in HQ. Live Marketplace /owner and /moderation currently show the retired staff placeholder — do not use those for work.",
    href: "/owner/divisions/marketplace",
    division: "marketplace",
  },
  {
    label: "Marketplace — seller applications (staff sign-in)",
    description:
      "Protected admin URL on the Marketplace subdomain (sign-in required). Use marketplace staff/owner roles.",
    href: `${getDivisionUrl("marketplace")}/admin/seller-applications`,
    division: "marketplace",
  },
  {
    label: "Property — division room (HQ)",
    description:
      "Property subdomain moderation and operations routes show the retired placeholder. Oversee Property from HQ until the rebuilt console ships.",
    href: "/owner/divisions/property",
    division: "property",
  },
  {
    label: "Jobs — division room (HQ)",
    description:
      "Jobs subdomain moderation and legacy staff dashboards are retired placeholders. Use HQ for oversight until the rebuilt console ships.",
    href: "/owner/divisions/jobs",
    division: "jobs",
  },
  {
    label: "Learn — division room (HQ)",
    description:
      "Learn /owner/* routes on the subdomain currently show the retired placeholder. Track academy posture from HQ.",
    href: "/owner/divisions/learn",
    division: "learn",
  },
  {
    label: "Care — division room (HQ)",
    description:
      "Care subdomain owner/staff dashboards currently show the retired placeholder. Use HQ for Care telemetry until the rebuilt console ships.",
    href: "/owner/divisions/care",
    division: "care",
  },
  {
    label: "Studio — division room (HQ)",
    description:
      "Studio /owner on the subdomain is a retired placeholder. Coordinate studio work from HQ.",
    href: "/owner/divisions/studio",
    division: "studio",
  },
  {
    label: "Operational alerts (HQ)",
    description: "Cross-division signals, support pressure, and anomaly context in one board.",
    href: "/owner/operations/alerts",
    division: "company",
  },
];

export type DivisionExternalAction = {
  label: string;
  href: string;
  hint: string;
};

/**
 * Next-step links from the division drill-down. No retired subdomain staff placeholders.
 */
export function getDivisionExternalActions(slug: string): DivisionExternalAction[] {
  const origin = divisionOrigin(slug);

  switch (slug) {
    case "marketplace": {
      const sellerAdmin = `${getDivisionUrl("marketplace")}/admin/seller-applications`;
      return [
        {
          label: "Marketplace division room (HQ)",
          href: "/owner/divisions/marketplace",
          hint: "Owner-grade telemetry. Subdomain /owner and /moderation are retired on live until rebuild.",
        },
        {
          label: "Seller applications (Marketplace admin)",
          href: sellerAdmin,
          hint: "Staff sign-in on the Marketplace app — live protected route.",
        },
        {
          label: "Finance & payouts (HQ)",
          href: "/owner/finance",
          hint: "Invoice and payout pressure across divisions.",
        },
      ];
    }
    case "property":
      return [
        {
          label: "Property division room (HQ)",
          href: "/owner/divisions/property",
          hint: "HQ telemetry. Property subdomain moderation/operations are retired on live.",
        },
        {
          label: "Operational alerts (HQ)",
          href: "/owner/operations/alerts",
          hint: "Listing-related support and cross-division pressure.",
        },
        {
          label: "Approval center (HQ)",
          href: "/owner/operations/approvals",
          hint: "Governance map and external paths that are still safe on live.",
        },
      ];
    case "jobs":
      return [
        {
          label: "Jobs division room (HQ)",
          href: "/owner/divisions/jobs",
          hint: "HQ telemetry. Jobs subdomain staff surfaces are retired on live.",
        },
        {
          label: "Operational alerts (HQ)",
          href: "/owner/operations/alerts",
          hint: "Company-wide signals including Jobs-related pressure.",
        },
        {
          label: "Staff & workforce (HQ)",
          href: "/owner/staff",
          hint: "Roles and access while rebuilt Jobs consoles are staged.",
        },
      ];
    case "learn":
      return [
        {
          label: "Learn division room (HQ)",
          href: "/owner/divisions/learn",
          hint: "Academy signals in HQ. Learn /owner on the subdomain is retired on live.",
        },
        {
          label: "Finance & invoices (HQ)",
          href: "/owner/finance/invoices",
          hint: "Learn-related invoice rows flow through shared customer_invoices telemetry.",
        },
        {
          label: "Approval center (HQ)",
          href: "/owner/operations/approvals",
          hint: "Cross-division governance without retired subdomain shells.",
        },
      ];
    case "care":
      return [
        {
          label: "Care division room (HQ)",
          href: "/owner/divisions/care",
          hint: "Bookings and care signals in HQ. Care /owner on the subdomain is retired on live.",
        },
        {
          label: "Operational alerts (HQ)",
          href: "/owner/operations/alerts",
          hint: "Care overdue and support signals surface here.",
        },
        {
          label: "Messaging queues (HQ)",
          href: "/owner/messaging/queues",
          hint: "Care notification delivery diagnostics when channels fail.",
        },
      ];
    case "studio":
      return [
        {
          label: "Studio division room (HQ)",
          href: "/owner/divisions/studio",
          hint: "Studio telemetry in HQ. Studio /owner on the subdomain is retired on live.",
        },
        {
          label: "Finance & commercial (HQ)",
          href: "/owner/finance",
          hint: "Revenue and deposit signals tied to studio activity.",
        },
      ];
    case "logistics":
      if (!origin) return [];
      return [
        {
          label: "Logistics public site",
          href: `${origin}/`,
          hint: "Live marketing and lane narrative on the Logistics subdomain (not a retired staff shell).",
        },
        {
          label: "Logistics division room (HQ)",
          href: "/owner/divisions/logistics",
          hint: "Cross-division telemetry for logistics from the command center.",
        },
      ];
    default:
      if (!origin) return [];
      return [
        {
          label: "Division public site",
          href: `${origin}/`,
          hint: "Public division entry. Use HQ /owner for owner-grade oversight.",
        },
        {
          label: "Division room (HQ)",
          href: `/owner/divisions/${slug}`,
          hint: "If this division is tracked in HQ, telemetry and drill-downs live here.",
        },
      ];
  }
}
