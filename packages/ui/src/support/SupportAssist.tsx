"use client";

/**
 * SupportAssist — Henry & Co.'s chrome-integrated help surface.
 *
 * The cross-division replacement for the old `SupportDock` / `AssistDock`
 * floating concierge. Two non-negotiables drove this redesign:
 *
 *   1. Zero closed-state footprint. The previous dock sat as a 60×60
 *      gradient capsule pinned bottom-right and "blocked views a lot"
 *      (the verbatim feedback from owner). This one renders a 36×36
 *      icon-only chip with a hairline border and no gradient. Closed,
 *      it's effectively invisible against the chrome — present when
 *      you go looking, calm when you don't.
 *
 *   2. Surface quality matches the dashboard search palette. Same
 *      motion language (EASE_OUT cubic, FADE_MS = 200), same primitive
 *      pattern (BottomSheet on mobile, hairline-bordered popover on
 *      desktop), same combobox/listbox a11y contract. The dock should
 *      read as a sibling of `<DashboardCommandPalette>`, not a chatbot
 *      bolted onto the side of every page.
 *
 * Data layers carried over from the previous dock (durable findings):
 *   - `DIVISION_ACTIONS` — the per-division action tables.
 *   - `detectContextualAction` — pathname-driven smart top action.
 *   - `getAssistCopy` — locale copy across 7 languages.
 *   - `HIDDEN_ROUTE_REGEXPS` — chat-first / auth / legal route exclusions.
 *
 * Positioning:
 *   - Default: anchored to the bottom-right with a small safe-area-aware
 *     gutter. ~40px footprint vs the old 60px+ floating capsule. Lifted
 *     above the mobile bottom-nav so it never collides with primary
 *     navigation buttons.
 *   - Scroll-aware: on mobile, the trigger softly fades out while the
 *     user is scrolling content downward (intent = read) and fades back
 *     in when they stop or scroll up (intent = look around). Calm, not
 *     bouncy. Reduced-motion users get the steady-state trigger.
 *   - Auto-hidden on chat-first surfaces (existing rule), auth routes
 *     (/signin, /signup, /reset, /verify), and legal pages (/legal/*,
 *     /terms, /privacy) — those surfaces have their own primary
 *     affordances and the dock would only add noise.
 *
 * Bundle: the panel content tree is only mounted after the first
 * interaction so the initial bundle doesn't carry it for the 95%+ of
 * pageviews where the user never opens the dock.
 */

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useId,
  useCallback,
  type CSSProperties,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { getAccountUrl, getDivisionUrl, getHubUrl } from "@henryco/config";
import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";
import { useOptionalHenryCoLocale } from "@henryco/i18n/react";
import { useFocusTrap } from "../a11y/use-focus-trap";
import { useReducedMotion } from "../a11y/use-reduced-motion";

// ─── Public types ─────────────────────────────────────────────────────────

export type AssistDivision =
  | "marketplace"
  | "care"
  | "jobs"
  | "learn"
  | "logistics"
  | "property"
  | "studio"
  | "account"
  | "hub";

type AssistAction = {
  label: string;
  description: string;
  href: string;
  external: boolean;
  icon?: ReactNode;
  contextual?: boolean;
};

export type SupportAssistProps = {
  division: AssistDivision;
  /**
   * Optional accent for the trigger ring + contextual-row highlight.
   * Defaults to the Henry & Co. gold (#C9A227). The dock no longer paints a
   * gradient header — the accent only tints small focused surfaces.
   */
  accent?: string;
  /**
   * Position the floating trigger. `auto` (default) lifts above any
   * mobile bottom-nav and pins to bottom-right on desktop. Hosts that
   * want the trigger inline (e.g. inside an IdentityBar slot) can pass
   * `inline` — the component then renders only the panel + a tiny
   * imperative API the caller wires to its own button.
   */
  placement?: "auto" | "inline";
};

// Back-compat aliases — keeps every existing `<AssistDock ... />` and
// `<SupportDock ... />` call site working until the migration completes.
export type AssistDockProps = SupportAssistProps;
export type SupportDockProps = SupportAssistProps;

// ─── Motion + radius tokens (inlined to avoid ui → dashboard-shell dep) ──
//
// These are the canonical dashboard-shell values; mirroring them here
// keeps `@henryco/ui/support` standalone (the shell pulls from `ui` in
// the public-shell tree, so a reverse import would create a cycle).
// Drift is governed by code review — change here and in
// `packages/dashboard-shell/src/tokens/motion.ts` together.

const FADE_MS = 200;
const SURFACE_OPEN_MS = 220;
const SURFACE_CLOSE_MS = 160;
const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";

// ─── URL helpers ──────────────────────────────────────────────────────────

function acct(path: string) {
  return getAccountUrl(path);
}
function hub(path: string) {
  return getHubUrl(path);
}
function divisionUrl(
  division: Exclude<AssistDivision, "account" | "hub">,
  path: string,
) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, `${getDivisionUrl(division)}/`).toString();
}
function accountSupportHref({
  division,
  subject,
  context,
}: {
  division: Exclude<AssistDivision, "account" | "hub">;
  subject: string;
  context: string;
}) {
  const params = new URLSearchParams();
  params.set("category", division);
  params.set("division", division);
  params.set("subject", subject);
  params.set("context", context);
  return acct(`/support/new?${params.toString()}`);
}

// ─── Inline icons (zero external icon-pack weight) ────────────────────────

function IconChevron({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconClose({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconSearch({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
      <path d="M21 21l-4.5-4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
function IconLifebuoy({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 5l3.5 3.5M19 5l-3.5 3.5M5 19l3.5-3.5M19 19l-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconTruck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 7h11v9H3z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 10h4l3 3v3h-7" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="7.5" cy="17.5" r="1.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.5" cy="17.5" r="1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function IconShield({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l8 3v6c0 4.5-3.2 8.5-8 9-4.8-.5-8-4.5-8-9V6l8-3z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconMessage({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 5h16v11H8l-4 4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function IconBell({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9a6 6 0 1 1 12 0v4l1.5 3h-15L6 13z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconStore({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 9l1-4h14l1 4-1 1a3 3 0 0 1-5 0 3 3 0 0 1-5 0 3 3 0 0 1-5 0z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M5 11v8h14v-8" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function IconUser({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconCompass({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function IconHelpCircle({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.4-1 2-2 2.5-.6.3-1 .75-1 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="17.25" r="0.9" fill="currentColor" />
    </svg>
  );
}
function IconSparkle({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ─── i18n helper ──────────────────────────────────────────────────────────

function t(locale: string, text: string): string {
  return translateSurfaceLabel(locale as AppLocale, text);
}

// ─── Division action tables ───────────────────────────────────────────────
//
// Carried verbatim from the prior dock — the audit findings on what each
// division surfaces in support are durable across the rebuild.

type ActionsByLocale = (locale: string) => AssistAction[];

const DIVISION_ACTIONS: Record<AssistDivision, ActionsByLocale> = {
  marketplace: (locale) => [
    {
      label: t(locale, "Track your order"),
      description: t(locale, "Live status, fulfillment, and delivery updates"),
      href: divisionUrl("marketplace", "/account/orders"),
      external: false,
      icon: <IconTruck />,
    },
    {
      label: t(locale, "Order support"),
      description: t(locale, "Help with seller communication, delivery, fulfillment"),
      href: accountSupportHref({
        division: "marketplace",
        subject: "Marketplace order support",
        context: "order-support",
      }),
      external: false,
      icon: <IconLifebuoy />,
    },
    {
      label: t(locale, "Buyer protection"),
      description: t(locale, "Disputes, refunds, and Henry & Co. escrow review"),
      href: accountSupportHref({
        division: "marketplace",
        subject: "Marketplace buyer protection issue",
        context: "buyer-protection",
      }),
      external: false,
      icon: <IconShield />,
    },
    {
      label: t(locale, "Open a support thread"),
      description: t(locale, "Reach the Henry & Co. support team directly"),
      href: accountSupportHref({
        division: "marketplace",
        subject: "Marketplace support request",
        context: "general-support",
      }),
      external: false,
      icon: <IconMessage />,
    },
    {
      label: t(locale, "Your notifications"),
      description: t(locale, "Inbox, account updates, and alerts"),
      href: acct("/notifications"),
      external: false,
      icon: <IconBell />,
    },
  ],
  care: (locale) => [
    {
      label: t(locale, "Track your booking"),
      description: t(locale, "Pickup, technician ETA, and care updates"),
      href: "/track",
      external: false,
      icon: <IconTruck />,
    },
    {
      label: t(locale, "Open care bookings"),
      description: t(locale, "Linked bookings, receipts, and follow-up"),
      href: acct("/care"),
      external: false,
      icon: <IconLifebuoy />,
    },
    {
      label: t(locale, "Payment and receipt help"),
      description: t(locale, "Receipts, billing, and payment proof issues"),
      href: accountSupportHref({
        division: "care",
        subject: "Care payment or receipt issue",
        context: "payment-receipt",
      }),
      external: false,
      icon: <IconShield />,
    },
    {
      label: t(locale, "Care support"),
      description: t(locale, "Speak directly to the Henry & Co. Care team"),
      href: accountSupportHref({
        division: "care",
        subject: "Care booking support",
        context: "booking-support",
      }),
      external: false,
      icon: <IconMessage />,
    },
  ],
  jobs: (locale) => [
    {
      label: t(locale, "Your applications"),
      description: t(locale, "Track applications and recruiter activity"),
      href: divisionUrl("jobs", "/candidate/applications"),
      external: false,
      icon: <IconUser />,
    },
    {
      label: t(locale, "Interview status"),
      description: t(locale, "Scheduled interviews and recruiter notes"),
      href: divisionUrl("jobs", "/candidate/interviews"),
      external: false,
      icon: <IconCompass />,
    },
    {
      label: t(locale, "Report suspicious employer"),
      description: t(locale, "Flag a hiring company for review"),
      href: accountSupportHref({
        division: "jobs",
        subject: "Report suspicious employer",
        context: "employer-report",
      }),
      external: false,
      icon: <IconShield />,
    },
    {
      label: t(locale, "Jobs help"),
      description: t(locale, "Reach the Henry & Co. Jobs support team"),
      href: divisionUrl("jobs", "/help"),
      external: false,
      icon: <IconMessage />,
    },
  ],
  learn: (locale) => [
    {
      label: t(locale, "Continue learning"),
      description: t(locale, "Pick up where you left off"),
      href: acct("/learn?panel=active"),
      external: false,
      icon: <IconCompass />,
    },
    {
      label: t(locale, "Open certificates"),
      description: t(locale, "Issued certificates and completion records"),
      href: acct("/learn?panel=certificates"),
      external: false,
      icon: <IconShield />,
    },
    {
      label: t(locale, "Report a course issue"),
      description: t(locale, "Content, access, or billing problems"),
      href: accountSupportHref({
        division: "learn",
        subject: "Learn course issue",
        context: "course-issue",
      }),
      external: false,
      icon: <IconLifebuoy />,
    },
    {
      label: t(locale, "Learning help"),
      description: t(locale, "Reach the Henry & Co. Learn team"),
      href: divisionUrl("learn", "/help"),
      external: false,
      icon: <IconMessage />,
    },
  ],
  logistics: (locale) => [
    {
      label: t(locale, "Track your shipment"),
      description: t(locale, "Live location and delivery ETA"),
      href: "/track",
      external: false,
      icon: <IconTruck />,
    },
    {
      label: t(locale, "Open logistics hub"),
      description: t(locale, "Activity, pricing, and shared account history"),
      href: acct("/logistics"),
      external: false,
      icon: <IconCompass />,
    },
    {
      label: t(locale, "Report delivery issue"),
      description: t(locale, "Missing, damaged, or late shipment"),
      href: accountSupportHref({
        division: "logistics",
        subject: "Logistics delivery issue",
        context: "delivery-issue",
      }),
      external: false,
      icon: <IconShield />,
    },
    {
      label: t(locale, "Logistics support"),
      description: t(locale, "Reach the Henry & Co. Logistics team"),
      href: "/support",
      external: false,
      icon: <IconMessage />,
    },
  ],
  property: (locale) => [
    {
      label: t(locale, "Track listing review"),
      description: t(locale, "Listing status and editor feedback"),
      href: acct("/property?panel=listings"),
      external: false,
      icon: <IconCompass />,
    },
    {
      label: t(locale, "Find properties to view"),
      description: t(locale, "Browse and shortlist viewings"),
      href: "/search",
      external: false,
      icon: <IconStore />,
    },
    {
      label: t(locale, "Report a listing"),
      description: t(locale, "Inaccurate or suspicious listing"),
      href: accountSupportHref({
        division: "property",
        subject: "Report property listing",
        context: "listing-report",
      }),
      external: false,
      icon: <IconShield />,
    },
    {
      label: t(locale, "Property support"),
      description: t(locale, "Reach the Henry & Co. Property team"),
      href: accountSupportHref({
        division: "property",
        subject: "Property support request",
        context: "general-support",
      }),
      external: false,
      icon: <IconMessage />,
    },
  ],
  studio: (locale) => [
    {
      label: t(locale, "Open your workspace"),
      description: t(locale, "Projects, files, payments, messages"),
      href: divisionUrl("studio", "/client"),
      external: false,
      icon: <IconCompass />,
    },
    {
      label: t(locale, "Draft a brief with the co-pilot"),
      description: t(locale, "Describe it in a paragraph — we structure it"),
      href: divisionUrl("studio", "/request"),
      external: false,
      icon: <IconStore />,
    },
    {
      label: t(locale, "Project messages"),
      description: t(locale, "Active threads with your Studio team"),
      href: divisionUrl("studio", "/client/messages"),
      external: false,
      icon: <IconMessage />,
    },
    {
      label: t(locale, "Files and deliverables"),
      description: t(locale, "Approved assets and shared work"),
      href: divisionUrl("studio", "/client/files"),
      external: false,
      icon: <IconShield />,
    },
    {
      label: t(locale, "Payments and invoices"),
      description: t(locale, "Outstanding balance, history, receipts"),
      href: divisionUrl("studio", "/client/payments"),
      external: false,
      icon: <IconShield />,
    },
    {
      label: t(locale, "Browse ready-to-start templates"),
      description: t(locale, "Prefilled briefs you can launch in minutes"),
      href: divisionUrl("studio", "/pick"),
      external: false,
      icon: <IconStore />,
    },
    {
      label: t(locale, "Payment and invoice help"),
      description: t(locale, "Open a support thread with finance"),
      href: accountSupportHref({
        division: "studio",
        subject: "Studio payment or invoice help",
        context: "invoice-help",
      }),
      external: false,
      icon: <IconLifebuoy />,
    },
    {
      label: t(locale, "Contact Studio"),
      description: t(locale, "Reach the Studio team directly"),
      href: divisionUrl("studio", "/contact"),
      external: false,
      icon: <IconUser />,
    },
  ],
  account: (locale) => [
    {
      label: t(locale, "Open inbox"),
      description: t(locale, "Notifications across Henry & Co. divisions"),
      href: "/notifications",
      external: false,
      icon: <IconBell />,
    },
    {
      label: t(locale, "Support center"),
      description: t(locale, "Create or view support tickets"),
      href: "/support",
      external: false,
      icon: <IconLifebuoy />,
    },
    {
      label: t(locale, "Wallet and payments"),
      description: t(locale, "Funding, withdrawals, and transactions"),
      href: "/wallet",
      external: false,
      icon: <IconShield />,
    },
    {
      label: t(locale, "Manage preferences"),
      description: t(locale, "Notifications, privacy, and display"),
      href: "/settings",
      external: false,
      icon: <IconCompass />,
    },
  ],
  hub: (locale) => [
    {
      label: t(locale, "Explore divisions"),
      description: t(locale, "All Henry & Co. divisions on one page"),
      href: "/#divisions",
      external: false,
      icon: <IconCompass />,
    },
    {
      label: t(locale, "Open your account"),
      description: t(locale, "Wallet, inbox, and dashboard"),
      href: acct("/"),
      external: false,
      icon: <IconUser />,
    },
    {
      label: t(locale, "Contact Henry & Co."),
      description: t(locale, "General support and enquiries"),
      href: hub("/contact"),
      external: false,
      icon: <IconMessage />,
    },
    {
      label: t(locale, "View ecosystem map"),
      description: t(locale, "How the divisions connect across the platform"),
      href: "/#ecosystem",
      external: false,
      icon: <IconStore />,
    },
  ],
};

// ─── Smart context detection ──────────────────────────────────────────────

function detectContextualAction(
  division: AssistDivision,
  pathname: string,
  locale: string,
): AssistAction | null {
  if (!pathname) return null;

  if (division === "marketplace") {
    const storeMatch = pathname.match(/^\/store\/([^/?#]+)/);
    if (storeMatch) {
      const slug = storeMatch[1];
      const subject = `Question for ${slug.replace(/-/g, " ")}`;
      const params = new URLSearchParams({
        vendor: slug,
        subject,
        return_to: pathname,
      });
      return {
        label: t(locale, "Contact this store"),
        description: t(locale, "Open a support thread tied to this storefront"),
        href: `/help?${params.toString()}`,
        external: false,
        icon: <IconStore />,
        contextual: true,
      };
    }
    const productMatch = pathname.match(/^\/product\/([^/?#]+)/);
    if (productMatch) {
      const slug = productMatch[1];
      const subject = `Question about ${slug.replace(/-/g, " ")}`;
      const params = new URLSearchParams({ subject, return_to: pathname });
      return {
        label: t(locale, "Question about this product"),
        description: t(locale, "Send a support thread linked to this listing"),
        href: `/help?${params.toString()}`,
        external: false,
        icon: <IconLifebuoy />,
        contextual: true,
      };
    }
    if (pathname.startsWith("/checkout")) {
      const params = new URLSearchParams({
        subject: "Checkout question",
        return_to: pathname,
      });
      return {
        label: t(locale, "Checkout help"),
        description: t(locale, "Get help finishing this order"),
        href: `/help?${params.toString()}`,
        external: false,
        icon: <IconShield />,
        contextual: true,
      };
    }
  }

  if (division === "logistics") {
    const trackMatch = pathname.match(/^\/track\/([^/?#]+)/);
    if (trackMatch) {
      return {
        label: t(locale, "Help with this shipment"),
        description: t(locale, "Open a thread tied to this tracking code"),
        href: accountSupportHref({
          division: "logistics",
          subject: `Help with shipment ${trackMatch[1]}`,
          context: "delivery-issue",
        }),
        external: false,
        icon: <IconTruck />,
        contextual: true,
      };
    }
  }

  if (division === "care") {
    if (pathname.startsWith("/track") || pathname.startsWith("/booking")) {
      return {
        label: t(locale, "Help with this booking"),
        description: t(locale, "Reach the Care team about your active booking"),
        href: accountSupportHref({
          division: "care",
          subject: "Help with active care booking",
          context: "booking-support",
        }),
        external: false,
        icon: <IconLifebuoy />,
        contextual: true,
      };
    }
  }

  if (division === "property") {
    if (pathname.startsWith("/search") || pathname.startsWith("/listing")) {
      return {
        label: t(locale, "Help finding a property"),
        description: t(locale, "Tell our team what you're looking for"),
        href: accountSupportHref({
          division: "property",
          subject: "Help finding a property",
          context: "discovery",
        }),
        external: false,
        icon: <IconStore />,
        contextual: true,
      };
    }
  }

  return null;
}

// ─── Locale copy ──────────────────────────────────────────────────────────

type AssistCopy = {
  trigger: string;
  triggerHint: string;
  title: string;
  subtitle: string;
  searchLabel: string;
  searchPlaceholder: string;
  emptyTitle: string;
  emptyBody: string;
  contextualBadge: string;
  assistTitle: string;
  assistBody: (query: string) => string;
  assistCta: string;
  statusOnline: string;
  statusReply: string;
  close: string;
  divisionLabel: string;
  divisions: Record<AssistDivision, string>;
};

function getAssistCopy(locale: string): AssistCopy {
  const divisions: Record<AssistDivision, string> = {
    marketplace: "Marketplace",
    care: "Care",
    jobs: "Jobs",
    learn: "Learn",
    logistics: "Logistics",
    property: "Property",
    studio: "Studio",
    account: "Account",
    hub: "Henry & Co.",
  };

  if (locale === "fr") {
    return {
      trigger: "Aide",
      triggerHint: "Besoin d'aide ?",
      title: "Comment pouvons-nous vous aider ?",
      subtitle: "L'équipe Henry & Co. est à votre écoute.",
      searchLabel: "Rechercher dans l'aide",
      searchPlaceholder: "Rechercher un sujet, un statut...",
      emptyTitle: "Aucun résultat",
      emptyBody: "Reformulez votre recherche ou contactez-nous directement.",
      contextualBadge: "Suggéré pour vous",
      assistTitle: "Demander à l'équipe",
      assistBody: (q) => `Envoyer « ${q} » comme question — réponse rapide.`,
      assistCta: "Envoyer la question",
      statusOnline: "Équipe disponible",
      statusReply: "Réponse en moins d'1 h en moyenne",
      close: "Fermer",
      divisionLabel: "Division",
      divisions,
    };
  }
  if (locale === "es") {
    return {
      trigger: "Ayuda",
      triggerHint: "¿Necesitas ayuda?",
      title: "¿Cómo podemos ayudarte?",
      subtitle: "El equipo de Henry & Co. está aquí para ti.",
      searchLabel: "Buscar en la ayuda",
      searchPlaceholder: "Buscar tema, estado...",
      emptyTitle: "Sin resultados",
      emptyBody: "Reformula la búsqueda o contáctanos directamente.",
      contextualBadge: "Sugerido para ti",
      assistTitle: "Preguntar al equipo",
      assistBody: (q) => `Enviar «${q}» como consulta — respuesta rápida.`,
      assistCta: "Enviar consulta",
      statusOnline: "Equipo disponible",
      statusReply: "Respuesta en menos de 1 h en promedio",
      close: "Cerrar",
      divisionLabel: "División",
      divisions,
    };
  }
  if (locale === "pt") {
    return {
      trigger: "Ajuda",
      triggerHint: "Precisa de ajuda?",
      title: "Como podemos ajudar?",
      subtitle: "A equipa Henry & Co. está aqui para si.",
      searchLabel: "Pesquisar ajuda",
      searchPlaceholder: "Pesquisar tópico, estado...",
      emptyTitle: "Sem resultados",
      emptyBody: "Reformule a pesquisa ou contacte-nos diretamente.",
      contextualBadge: "Sugerido para si",
      assistTitle: "Perguntar à equipa",
      assistBody: (q) => `Enviar «${q}» como pergunta — resposta rápida.`,
      assistCta: "Enviar pergunta",
      statusOnline: "Equipa disponível",
      statusReply: "Resposta em menos de 1 h em média",
      close: "Fechar",
      divisionLabel: "Divisão",
      divisions,
    };
  }
  if (locale === "de") {
    return {
      trigger: "Hilfe",
      triggerHint: "Brauchen Sie Hilfe?",
      title: "Wie können wir helfen?",
      subtitle: "Das Henry & Co. Team ist für Sie da.",
      searchLabel: "Hilfe durchsuchen",
      searchPlaceholder: "Thema oder Status suchen...",
      emptyTitle: "Keine Treffer",
      emptyBody: "Versuchen Sie eine andere Suche oder schreiben Sie uns direkt.",
      contextualBadge: "Für Sie empfohlen",
      assistTitle: "Team fragen",
      assistBody: (q) => `„${q}" als Frage senden — schnelle Antwort.`,
      assistCta: "Frage senden",
      statusOnline: "Team verfügbar",
      statusReply: "Antwort meist innerhalb 1 Std.",
      close: "Schließen",
      divisionLabel: "Bereich",
      divisions,
    };
  }
  if (locale === "it") {
    return {
      trigger: "Aiuto",
      triggerHint: "Hai bisogno di aiuto?",
      title: "Come possiamo aiutarti?",
      subtitle: "Il team Henry & Co. è qui per te.",
      searchLabel: "Cerca nell'aiuto",
      searchPlaceholder: "Cerca un tema, uno stato...",
      emptyTitle: "Nessun risultato",
      emptyBody: "Riformula la ricerca o contattaci direttamente.",
      contextualBadge: "Consigliato per te",
      assistTitle: "Chiedi al team",
      assistBody: (q) => `Invia «${q}» come domanda — risposta rapida.`,
      assistCta: "Invia domanda",
      statusOnline: "Team disponibile",
      statusReply: "Risposta entro 1 h in media",
      close: "Chiudi",
      divisionLabel: "Divisione",
      divisions,
    };
  }
  if (locale === "ar") {
    return {
      trigger: "مساعدة",
      triggerHint: "تحتاج مساعدة؟",
      title: "كيف يمكننا مساعدتك؟",
      subtitle: "فريق Henry & Co. في خدمتك.",
      searchLabel: "البحث في المساعدة",
      searchPlaceholder: "ابحث عن موضوع أو حالة...",
      emptyTitle: "لا توجد نتائج",
      emptyBody: "حاول صياغة البحث بشكل مختلف أو تواصل معنا مباشرة.",
      contextualBadge: "مقترح لك",
      assistTitle: "اسأل الفريق",
      assistBody: (q) => `أرسل «${q}» كسؤال — رد سريع.`,
      assistCta: "إرسال السؤال",
      statusOnline: "الفريق متاح",
      statusReply: "ردود خلال ساعة في المتوسط",
      close: "إغلاق",
      divisionLabel: "القسم",
      divisions,
    };
  }
  return {
    trigger: "Help",
    triggerHint: "Need help?",
    title: "How can we help?",
    subtitle: "The Henry & Co. concierge desk is right here.",
    searchLabel: "Search support",
    searchPlaceholder: "Search a topic or status...",
    emptyTitle: "No matching topic",
    emptyBody: "Try a different keyword or open a direct support thread.",
    contextualBadge: "Suggested for you",
    assistTitle: "Ask the team",
    assistBody: (q) => `Send "${q}" as a quick question — replies usually under an hour.`,
    assistCta: "Send the question",
    statusOnline: "Team online",
    statusReply: "Replies typically under 1 hour",
    close: "Close",
    divisionLabel: "Division",
    divisions,
  };
}

// ─── Route-level exclusions ───────────────────────────────────────────────
//
// Surfaces where a floating help dock adds noise rather than help. The
// previous dock already excluded chat-first routes; we expand the list to
// cover auth + legal pages and any route that has explicitly opted out
// via `data-hide-support-assist` on a parent element (set by NewSupportForm,
// /support/new wizard, etc.).

const HIDDEN_ROUTE_REGEXPS: RegExp[] = [
  // Chat-first surfaces — the page IS a conversation; pointing back to
  // /support reads as a circular loop.
  /^\/support\/(?!new(?:\/|$))[^/]+(?:\/|$)/i,
  /^\/messages\/[^/]+(?:\/|$)/i,
  /^\/client\/messages(?:\/|$)/i,
  /^\/client\/projects\/[^/]+\/messages(?:\/|$)/i,

  // Authentication. These surfaces have a single primary goal (sign in,
  // sign up, reset) and a help dock competes with that goal.
  /^\/signin(?:\/|$)/i,
  /^\/signup(?:\/|$)/i,
  /^\/login(?:\/|$)/i,
  /^\/register(?:\/|$)/i,
  /^\/reset(?:\/|$)/i,
  /^\/forgot(?:\/|$)/i,
  /^\/verify(?:\/|$)/i,
  /^\/confirm(?:\/|$)/i,
  /^\/auth\/(?!.*\/help)/i,
  /^\/(?:account-)?recovery(?:\/|$)/i,
  /^\/onboarding\/(?!.*\/help)/i,

  // Legal / policy. The help dock would push them into a support thread
  // about a policy that is right there to read — the contact path lives
  // in the page footer of those routes already.
  /^\/legal(?:\/|$)/i,
  /^\/terms(?:\/|$)/i,
  /^\/privacy(?:\/|$)/i,
  /^\/cookies(?:\/|$)/i,
  /^\/acceptable-use(?:\/|$)/i,
  /^\/refunds?(?:\/|$)/i,

  // Modal-only or full-screen flows that already host their own help
  // affordance (e.g. checkout completes with an order screen that uses
  // /help links inline).
  /^\/checkout\/(?:complete|confirmation|success)(?:\/|$)/i,
];

// ─── Component ────────────────────────────────────────────────────────────

export function SupportAssist({
  division,
  accent = "#C9A227",
  placement = "auto",
}: SupportAssistProps) {
  const locale = useOptionalHenryCoLocale() ?? "en";
  const copy = useMemo(() => getAssistCopy(locale), [locale]);
  const reduceMotion = useReducedMotion();
  const headingId = useId();
  const searchId = useId();
  const listboxId = useId();

  const baseActions = useMemo(
    () => DIVISION_ACTIONS[division](locale),
    [division, locale],
  );

  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(-1);
  const [scrolledAway, setScrolledAway] = useState(false);
  const pathname = usePathname() ?? "";

  const hidden = useMemo(
    () => HIDDEN_ROUTE_REGEXPS.some((re) => re.test(pathname)),
    [pathname],
  );

  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const contextualAction = useMemo(
    () => detectContextualAction(division, pathname, locale),
    [division, pathname, locale],
  );

  // Route change → close. The render shell remains for the next route
  // so the panel state can come back without remounting the tree.
  useEffect(() => {
    if (open) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Scroll-aware trigger fade. On mobile, hide when the user is in
  // "reading mode" (scrolled past 240px and scrolling further down);
  // reveal as soon as they scroll up or stop. Skipped under
  // reduced-motion preference and on desktop where there's no thumb
  // collision with bottom content.
  useEffect(() => {
    if (placement !== "auto") return;
    if (reduceMotion) return;
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 767px)").matches) return;

    let lastY = window.scrollY;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    const handle = () => {
      const y = window.scrollY;
      const goingDown = y > lastY;
      lastY = y;
      if (goingDown && y > 240) {
        setScrolledAway(true);
      } else {
        setScrolledAway(false);
      }
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setScrolledAway(false), 1200);
    };
    window.addEventListener("scroll", handle, { passive: true });
    return () => {
      window.removeEventListener("scroll", handle);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, [placement, reduceMotion]);

  // ESC + click-outside on desktop. Mobile uses backdrop-tap to close.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Body scroll lock on mobile so the page underneath doesn't drift
  // while the panel is open.
  //
  // DIAG-IOS-01 root-cause fix. The previous implementation set ONLY
  // `document.body.style.overflow = "hidden"`. On iOS Safari that:
  //   1. Breaks `position: sticky` on every descendant — the same bug
  //      class that detached the marketplace public-header from its
  //      viewport anchor (FIX-CHROME-01).
  //   2. Can throw in cross-origin iframe / sandboxed contexts when
  //      style writes are gated by ITP — the throw would propagate
  //      through `useEffect` (caught by error boundary, but at minimum
  //      surfaces as a fallback render on iOS Safari Private Browsing).
  //   3. Leaves the user at the top of the page after close because
  //      iOS Safari doesn't preserve scroll position when overflow
  //      changes mid-scroll.
  //
  // The new pattern mirrors the canonical `BottomSheet` primitive:
  // lock html (covers browsers where html is the scrolling element)
  // AND pin body via the negative-top trick so iOS Safari preserves
  // the visible content and the trigger restores `window.scrollY` on
  // close. All style writes are wrapped in try/catch so cross-origin
  // iframe contexts cannot crash the effect.
  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    if (typeof window === "undefined" || !window.matchMedia) return;
    const isSmall = window.matchMedia("(max-width: 640px)").matches;
    if (!isSmall) return;

    const html = document.documentElement;
    const body = document.body;
    const scrollY =
      window.scrollY ||
      window.pageYOffset ||
      html.scrollTop ||
      body.scrollTop ||
      0;

    const priorBody = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    const priorHtml = {
      overflow: html.style.overflow,
      scrollBehavior: html.style.scrollBehavior,
    };

    try {
      html.style.overflow = "hidden";
      html.style.scrollBehavior = "auto";
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.overflow = "hidden";
    } catch {
      // Cross-origin sandbox or ITP-restricted context — bail without
      // attempting to lock so the effect can't throw a SecurityError
      // that would surface as a V3-10 fallback.
      return;
    }

    return () => {
      try {
        html.style.overflow = priorHtml.overflow;
        body.style.position = priorBody.position;
        body.style.top = priorBody.top;
        body.style.left = priorBody.left;
        body.style.right = priorBody.right;
        body.style.width = priorBody.width;
        body.style.overflow = priorBody.overflow;
        window.scrollTo(0, scrollY);
        html.style.scrollBehavior = priorHtml.scrollBehavior;
      } catch {
        // Best-effort cleanup; a failure here only matters if every
        // descendant has already crashed for the same reason.
      }
    };
  }, [open]);

  useFocusTrap(panelRef, {
    active: open,
    onEscape: () => {
      setOpen(false);
      triggerRef.current?.focus();
    },
    initialFocus: searchRef,
  });

  // Filter + assist target.
  const filteredActions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return baseActions;
    return baseActions.filter((action) =>
      [action.label, action.description].some((field) =>
        field.toLowerCase().includes(q),
      ),
    );
  }, [baseActions, query]);

  const flat = useMemo(() => {
    const rows: AssistAction[] = [];
    if (!query && contextualAction) rows.push(contextualAction);
    rows.push(...filteredActions);
    return rows;
  }, [query, contextualAction, filteredActions]);

  const showEmptyState =
    open && query.trim().length > 0 && filteredActions.length === 0;

  const assistHref = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return null;
    const subject = trimmed.slice(0, 140);
    if (
      division === "marketplace" ||
      division === "care" ||
      division === "jobs" ||
      division === "learn" ||
      division === "logistics" ||
      division === "property" ||
      division === "studio"
    ) {
      const params = new URLSearchParams({
        subject,
        return_to: pathname || "/",
      });
      return `/help?${params.toString()}`;
    }
    return acct(`/support/new?subject=${encodeURIComponent(subject)}`);
  }, [division, pathname, query]);

  const toggleOpen = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (next && !hasOpened) setHasOpened(true);
      if (next) setHighlight(-1);
      return next;
    });
  }, [hasOpened]);

  const closePanel = useCallback(() => {
    setOpen(false);
    setQuery("");
    setHighlight(-1);
  }, []);

  // Keyboard surface — ArrowDown / ArrowUp / Enter
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlight((current) =>
          flat.length === 0 ? -1 : Math.min(flat.length - 1, current + 1),
        );
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlight((current) => Math.max(-1, current - 1));
        return;
      }
      if (event.key === "Enter") {
        const target = highlight >= 0 ? flat[highlight] : null;
        if (target) {
          event.preventDefault();
          window.location.assign(target.href);
        } else if (assistHref) {
          event.preventDefault();
          window.location.assign(assistHref);
        }
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, flat, highlight, assistHref]);

  if (hidden) return null;
  if (placement === "inline") {
    // Inline mode: hosts mount their own trigger and call into an
    // imperative open() via context (not built yet). For now, inline
    // mode renders nothing — back-compat callers stay on default.
    return null;
  }

  return (
    <div
      className="hc-assist-root"
      data-open={open ? "true" : "false"}
      data-tucked={scrolledAway && !open ? "true" : "false"}
      style={{
        position: "fixed",
        right: 0,
        bottom: 0,
        zIndex: 60,
        pointerEvents: "none",
        paddingRight: "max(1rem, env(safe-area-inset-right, 1rem))",
        paddingBottom:
          "max(1rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))",
      }}
    >
      {/* Mobile backdrop. Premium bottom-sheet uses a translucent black,
          not pure 50% so accidental visibility into the page reads as
          "paused" rather than "darkened". */}
      {open ? (
        <button
          type="button"
          onClick={closePanel}
          aria-label={copy.close}
          className="hc-assist-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 58,
            background: "rgba(5, 8, 22, 0.42)",
            backdropFilter: "blur(4px) saturate(1.05)",
            WebkitBackdropFilter: "blur(4px) saturate(1.05)",
            border: 0,
            padding: 0,
            cursor: "default",
            pointerEvents: "auto",
            animation: reduceMotion
              ? "none"
              : `hc-assist-fade-in ${FADE_MS}ms ${EASE_OUT}`,
          }}
        />
      ) : null}

      {/* Panel — render tree only after first open. Mobile = bottom
          sheet, desktop = anchored popover above the trigger. */}
      {hasOpened ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          aria-hidden={!open}
          className="hc-assist-panel"
          style={panelStyle({ open, reduceMotion })}
          tabIndex={-1}
        >
          {/* Drag-handle (mobile bottom-sheet affordance). Desktop hides
              via CSS — kept in the tree so screen-reader announce stays
              consistent. */}
          <span aria-hidden className="hc-assist-handle" />

          {/* Header. Quiet — no gradient, no monogram. Division label is
              a small uppercase kicker; title is a single sentence; the
              close button is a 36px hit target. */}
          <header className="hc-assist-header">
            <div className="hc-assist-header-text">
              <p className="hc-assist-kicker">
                {copy.divisionLabel} · {copy.divisions[division]}
              </p>
              <h2 id={headingId} className="hc-assist-title">
                {copy.title}
              </h2>
              <p className="hc-assist-subtitle">{copy.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={closePanel}
              aria-label={copy.close}
              className="hc-assist-close"
            >
              <IconClose size={15} />
            </button>
          </header>

          {/* Search */}
          <div className="hc-assist-search-wrap">
            <label htmlFor={searchId} className="sr-only">
              {copy.searchLabel}
            </label>
            <div className="hc-assist-search">
              <span className="hc-assist-search-icon" aria-hidden>
                <IconSearch size={14} />
              </span>
              <input
                id={searchId}
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlight(-1);
                }}
                placeholder={copy.searchPlaceholder}
                role="combobox"
                aria-expanded
                aria-controls={listboxId}
                aria-autocomplete="list"
                autoComplete="off"
                spellCheck={false}
                inputMode="search"
                enterKeyHint="search"
                className="hc-assist-search-input"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setHighlight(-1);
                    searchRef.current?.focus();
                  }}
                  aria-label={copy.close}
                  className="hc-assist-search-clear"
                >
                  <IconClose size={12} />
                </button>
              ) : null}
            </div>
          </div>

          {/* Result body */}
          <ul
            id={listboxId}
            role="listbox"
            aria-label={copy.searchLabel}
            className="hc-assist-list"
          >
            {!query && contextualAction ? (
              <li role="presentation">
                <a
                  href={contextualAction.href}
                  onClick={closePanel}
                  role="option"
                  aria-selected={highlight === 0}
                  className="hc-assist-row hc-assist-row--contextual"
                  data-active={highlight === 0 || undefined}
                  onPointerEnter={() => setHighlight(0)}
                  style={{
                    "--hc-assist-row-accent": accent,
                  } as CSSProperties}
                >
                  <span className="hc-assist-row-icon" aria-hidden>
                    {contextualAction.icon ?? <IconLifebuoy size={15} />}
                  </span>
                  <span className="hc-assist-row-text">
                    <span className="hc-assist-row-badge">
                      <IconSparkle size={11} />
                      {copy.contextualBadge}
                    </span>
                    <span className="hc-assist-row-label">
                      {contextualAction.label}
                    </span>
                    <span className="hc-assist-row-description">
                      {contextualAction.description}
                    </span>
                  </span>
                  <span className="hc-assist-row-chevron" aria-hidden>
                    <IconChevron size={13} />
                  </span>
                </a>
              </li>
            ) : null}

            {filteredActions.map((action, index) => {
              const rowIndex =
                !query && contextualAction ? index + 1 : index;
              return (
                <li role="presentation" key={`${action.href}-${action.label}`}>
                  <a
                    href={action.href}
                    target={action.external ? "_blank" : undefined}
                    rel={action.external ? "noreferrer" : undefined}
                    onClick={closePanel}
                    role="option"
                    aria-selected={highlight === rowIndex}
                    className="hc-assist-row"
                    data-active={highlight === rowIndex || undefined}
                    onPointerEnter={() => setHighlight(rowIndex)}
                  >
                    <span className="hc-assist-row-icon" aria-hidden>
                      {action.icon ?? <IconLifebuoy size={15} />}
                    </span>
                    <span className="hc-assist-row-text">
                      <span className="hc-assist-row-label">
                        {action.label}
                      </span>
                      <span className="hc-assist-row-description">
                        {action.description}
                      </span>
                    </span>
                    <span className="hc-assist-row-chevron" aria-hidden>
                      <IconChevron size={13} />
                    </span>
                  </a>
                </li>
              );
            })}

            {showEmptyState ? (
              <li role="presentation" className="hc-assist-empty">
                <p className="hc-assist-empty-title">{copy.emptyTitle}</p>
                <p className="hc-assist-empty-body">{copy.emptyBody}</p>
                {assistHref ? (
                  <a
                    href={assistHref}
                    onClick={closePanel}
                    className="hc-assist-empty-cta"
                    style={{
                      borderColor: accent,
                      color: accent,
                    }}
                  >
                    <IconMessage size={14} />
                    {copy.assistCta}
                  </a>
                ) : null}
              </li>
            ) : null}

            {open &&
            query.trim().length > 0 &&
            filteredActions.length > 0 &&
            assistHref ? (
              <li role="presentation" className="hc-assist-assist-cta">
                <a
                  href={assistHref}
                  onClick={closePanel}
                  className="hc-assist-row hc-assist-row--assist"
                  style={{
                    "--hc-assist-row-accent": accent,
                  } as CSSProperties}
                >
                  <span className="hc-assist-row-icon" aria-hidden>
                    <IconMessage size={15} />
                  </span>
                  <span className="hc-assist-row-text">
                    <span className="hc-assist-row-label">
                      {copy.assistTitle}
                    </span>
                    <span className="hc-assist-row-description">
                      {copy.assistBody(query.trim())}
                    </span>
                  </span>
                  <span className="hc-assist-row-chevron" aria-hidden>
                    <IconChevron size={13} />
                  </span>
                </a>
              </li>
            ) : null}
          </ul>

          {/* Footer status */}
          <footer className="hc-assist-footer">
            <span className="hc-assist-status-dot" aria-hidden />
            <span className="hc-assist-status-text">
              <span className="hc-assist-status-title">
                {copy.statusOnline}
              </span>
              <span className="hc-assist-status-reply">
                {copy.statusReply}
              </span>
            </span>
          </footer>
        </div>
      ) : null}

      {/* Trigger — slim, single icon, hairline border. Lives in the
          bottom-right gutter, lifts above any mobile bottom-nav, and
          fades when the user scrolls down to read. */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={listboxId}
        aria-label={
          open ? copy.close : `${copy.title} — ${copy.triggerHint}`
        }
        className="hc-assist-trigger"
        data-open={open ? "true" : "false"}
        style={{ "--hc-assist-accent": accent } as CSSProperties}
      >
        <span className="hc-assist-trigger-icon" aria-hidden>
          <IconHelpCircle size={18} />
        </span>
        <span className="hc-assist-trigger-label">{copy.trigger}</span>
        {contextualAction && !open ? (
          <span className="hc-assist-trigger-pulse" aria-hidden />
        ) : null}
      </button>

      <SupportAssistStyles />
    </div>
  );
}

// Back-compat aliases — every prior `<AssistDock />` and `<SupportDock />`
// call site reaches the new implementation through this re-export.
export const AssistDock = SupportAssist;
export const SupportDock = SupportAssist;

// ─── Panel positioning style helper ───────────────────────────────────────

function panelStyle({
  open,
  reduceMotion,
}: {
  open: boolean;
  reduceMotion: boolean;
}): CSSProperties {
  return {
    pointerEvents: open ? "auto" : "none",
    position: "fixed",
    zIndex: 59,
    right: "max(0.85rem, env(safe-area-inset-right, 0.85rem))",
    bottom:
      "calc(max(env(safe-area-inset-bottom, 0px), 0px) + 4.5rem)",
    width: "min(22.5rem, calc(100vw - 1.25rem))",
    maxHeight: "min(78vh, 38rem)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    opacity: open ? 1 : 0,
    transform: open ? "translateY(0) scale(1)" : "translateY(8px) scale(0.985)",
    transition: reduceMotion
      ? "opacity 80ms linear"
      : `opacity ${open ? SURFACE_OPEN_MS : SURFACE_CLOSE_MS}ms ${EASE_OUT}, transform ${open ? SURFACE_OPEN_MS : SURFACE_CLOSE_MS}ms ${EASE_OUT}`,
  };
}

// ─── Stylesheet (scoped via class prefix) ─────────────────────────────────

function SupportAssistStyles() {
  return (
    <style>{`
      .hc-assist-root {
        font-family: inherit;
      }

      /* Trigger — quiet capsule. Closed state has a single hairline
         border, surface background, and a small help-circle icon. No
         gradient, no shadow halo, no breathing animation. */
      .hc-assist-trigger {
        pointer-events: auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        height: 2.5rem;
        padding: 0 0.95rem 0 0.65rem;
        border-radius: 9999px;
        background: var(--hc-surface, #ffffff);
        color: var(--hc-ink, #0a0a0a);
        border: 1px solid color-mix(in srgb, currentColor 10%, transparent);
        cursor: pointer;
        font: inherit;
        font-size: 0.82rem;
        font-weight: 600;
        letter-spacing: -0.005em;
        box-shadow:
          0 6px 18px -12px rgba(15, 17, 24, 0.22),
          0 1px 0 color-mix(in srgb, var(--hc-bg-soft, #fafafa) 50%, transparent) inset;
        transition:
          transform 180ms ${EASE_OUT},
          box-shadow 180ms ${EASE_OUT},
          border-color 180ms ${EASE_OUT},
          opacity 200ms ${EASE_OUT};
        position: relative;
      }
      :where(.dark) .hc-assist-trigger {
        background: rgba(15, 17, 24, 0.92);
        color: #f5f1e8;
        border-color: rgba(245, 241, 232, 0.14);
        box-shadow:
          0 8px 22px -14px rgba(0, 0, 0, 0.5),
          0 1px 0 rgba(245, 241, 232, 0.06) inset;
      }
      .hc-assist-trigger:hover {
        transform: translateY(-1px);
        border-color: color-mix(in srgb, var(--hc-assist-accent, #c9a227) 38%, currentColor);
      }
      .hc-assist-trigger:active {
        transform: translateY(0);
      }
      .hc-assist-trigger:focus-visible {
        outline: none;
        box-shadow:
          0 0 0 3px color-mix(in srgb, var(--hc-assist-accent, #c9a227) 32%, transparent),
          0 6px 18px -12px rgba(15, 17, 24, 0.22);
      }
      .hc-assist-trigger[data-open="true"] {
        border-color: color-mix(in srgb, var(--hc-assist-accent, #c9a227) 48%, currentColor);
      }

      .hc-assist-trigger-icon {
        display: inline-grid;
        place-items: center;
        width: 1.5rem;
        height: 1.5rem;
        color: var(--hc-assist-accent, #c9a227);
      }
      .hc-assist-trigger-label {
        display: inline-block;
        font-size: 0.82rem;
        line-height: 1;
      }
      /* Pulse — a small contextual-action attention dot in the upper
         right corner of the trigger. Fades in on first render, decays
         quickly. Never larger than 6px. */
      .hc-assist-trigger-pulse {
        position: absolute;
        top: 6px;
        right: 8px;
        width: 6px;
        height: 6px;
        border-radius: 9999px;
        background: var(--hc-assist-accent, #c9a227);
        box-shadow: 0 0 0 0 color-mix(in srgb, var(--hc-assist-accent, #c9a227) 60%, transparent);
        animation: hc-assist-pulse 2.4s ${EASE_OUT} 3;
      }
      @keyframes hc-assist-pulse {
        0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--hc-assist-accent, #c9a227) 60%, transparent); }
        70% { box-shadow: 0 0 0 8px transparent; }
        100% { box-shadow: 0 0 0 0 transparent; }
      }

      /* Mobile: collapse the trigger label so the surface stays slim.
         Lifted by ~64px to clear any mobile bottom-nav and the safe
         area inset. */
      @media (max-width: 640px) {
        .hc-assist-root {
          padding-bottom: max(env(safe-area-inset-bottom, 0px), 0px) !important;
          right: 0 !important;
          bottom: 0 !important;
        }
        .hc-assist-trigger {
          height: 2.5rem;
          width: 2.5rem;
          padding: 0;
          margin-right: 0.85rem;
          margin-bottom: calc(env(safe-area-inset-bottom, 0px) + 4.5rem);
        }
        .hc-assist-trigger-label {
          display: none;
        }
      }

      /* Scroll-tucked state — fade out slightly while the user reads. */
      .hc-assist-root[data-tucked="true"] .hc-assist-trigger {
        opacity: 0.32;
        transform: translateY(2px);
      }
      .hc-assist-root[data-tucked="true"] .hc-assist-trigger:hover,
      .hc-assist-root[data-tucked="true"] .hc-assist-trigger:focus-visible {
        opacity: 1;
        transform: translateY(0);
      }

      /* Hide the trigger entirely when the panel is open on mobile —
         the close button inside the panel takes over. Desktop keeps it
         visible so the user can re-anchor by clicking the trigger
         again. */
      @media (max-width: 640px) {
        .hc-assist-root[data-open="true"] .hc-assist-trigger {
          opacity: 0;
          pointer-events: none;
        }
      }

      /* Panel — premium card. Hairline border, soft elevated shadow,
         no gradient header. Mobile = bottom sheet (full width, sheet
         radius at the top); desktop = floating popover anchored to the
         trigger. */
      .hc-assist-panel {
        background: var(--hc-surface, #ffffff);
        color: var(--hc-ink, #0a0a0a);
        border-radius: 1.25rem;
        border: 1px solid color-mix(in srgb, currentColor 9%, transparent);
        box-shadow:
          0 1px 0 rgba(255, 255, 255, 0.6) inset,
          0 32px 80px -28px rgba(5, 8, 22, 0.45),
          0 12px 32px -16px rgba(5, 8, 22, 0.25);
      }
      :where(.dark) .hc-assist-panel {
        background: #0a0e20;
        color: #f5f1e8;
        border-color: rgba(245, 241, 232, 0.12);
        box-shadow:
          0 1px 0 rgba(245, 241, 232, 0.04) inset,
          0 32px 80px -28px rgba(0, 0, 0, 0.65),
          0 12px 32px -16px rgba(0, 0, 0, 0.35);
      }

      .hc-assist-handle {
        display: none;
      }

      @media (max-width: 640px) {
        .hc-assist-panel {
          right: 0 !important;
          left: 0 !important;
          bottom: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          max-height: 88vh !important;
          border-radius: 1.5rem 1.5rem 0 0 !important;
          border-bottom: 0 !important;
          padding-top: 0 !important;
        }
        .hc-assist-handle {
          display: block;
          width: 2.5rem;
          height: 0.25rem;
          border-radius: 9999px;
          background: color-mix(in srgb, currentColor 18%, transparent);
          margin: 0.6rem auto 0.25rem;
        }
      }

      .hc-assist-header {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: start;
        gap: 0.75rem;
        padding: 0.95rem 1.05rem 0.55rem;
      }
      .hc-assist-header-text {
        min-width: 0;
      }
      .hc-assist-kicker {
        margin: 0;
        font-size: 0.62rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        font-weight: 700;
        color: color-mix(in srgb, currentColor 55%, transparent);
      }
      .hc-assist-title {
        margin: 0.2rem 0 0;
        font-size: 1.02rem;
        line-height: 1.25;
        font-weight: 600;
        letter-spacing: -0.01em;
        font-family: "Newsreader", "Iowan Old Style", "Palatino Linotype", serif;
      }
      .hc-assist-subtitle {
        margin: 0.2rem 0 0;
        font-size: 0.78rem;
        line-height: 1.35;
        color: color-mix(in srgb, currentColor 62%, transparent);
      }
      .hc-assist-close {
        appearance: none;
        background: transparent;
        color: inherit;
        border: 0;
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 9999px;
        display: inline-grid;
        place-items: center;
        cursor: pointer;
        transition: background 140ms ${EASE_OUT}, transform 140ms ${EASE_OUT};
      }
      .hc-assist-close:hover {
        background: color-mix(in srgb, currentColor 8%, transparent);
      }
      .hc-assist-close:focus-visible {
        outline: none;
        background: color-mix(in srgb, currentColor 10%, transparent);
      }

      .hc-assist-search-wrap {
        padding: 0.25rem 1.05rem 0.7rem;
      }
      .hc-assist-search {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        height: 2.4rem;
        padding: 0 0.7rem;
        border-radius: 0.85rem;
        border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
        background: color-mix(in srgb, var(--hc-bg-soft, #fafafa) 70%, transparent);
        transition: border-color 140ms ${EASE_OUT}, background 140ms ${EASE_OUT};
      }
      .hc-assist-search:focus-within {
        border-color: color-mix(in srgb, var(--hc-assist-accent, #c9a227) 55%, currentColor);
        background: var(--hc-surface, #ffffff);
      }
      :where(.dark) .hc-assist-search {
        background: rgba(245, 241, 232, 0.04);
      }
      :where(.dark) .hc-assist-search:focus-within {
        background: rgba(245, 241, 232, 0.08);
      }
      .hc-assist-search-icon {
        display: inline-grid;
        place-items: center;
        color: color-mix(in srgb, currentColor 55%, transparent);
      }
      .hc-assist-search-input {
        flex: 1;
        min-width: 0;
        border: 0;
        outline: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        /* >=16px on mobile so iOS doesn't auto-zoom on focus. */
        font-size: 16px;
        line-height: 1.3;
      }
      @media (min-width: 641px) {
        .hc-assist-search-input { font-size: 0.86rem; }
      }
      .hc-assist-search-clear {
        appearance: none;
        background: transparent;
        border: 0;
        color: inherit;
        opacity: 0.6;
        cursor: pointer;
        padding: 4px;
        border-radius: 9999px;
        display: inline-grid;
        place-items: center;
        transition: opacity 140ms ${EASE_OUT}, background 140ms ${EASE_OUT};
      }
      .hc-assist-search-clear:hover {
        opacity: 1;
        background: color-mix(in srgb, currentColor 8%, transparent);
      }

      .hc-assist-list {
        list-style: none;
        padding: 0;
        margin: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        scrollbar-gutter: stable;
      }
      .hc-assist-row {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 0.7rem;
        padding: 0.7rem 1.05rem;
        text-decoration: none;
        color: inherit;
        cursor: pointer;
        transition: background 140ms ${EASE_OUT}, transform 140ms ${EASE_OUT};
        outline: none;
      }
      .hc-assist-row:hover,
      .hc-assist-row[data-active] {
        background: color-mix(in srgb, currentColor 6%, transparent);
      }
      .hc-assist-row:focus-visible {
        background: color-mix(in srgb, currentColor 8%, transparent);
        box-shadow: inset 3px 0 0 var(--hc-assist-accent, #c9a227);
      }
      .hc-assist-row-icon {
        display: inline-grid;
        place-items: center;
        width: 2rem;
        height: 2rem;
        border-radius: 0.65rem;
        border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
        color: color-mix(in srgb, currentColor 70%, transparent);
        flex-shrink: 0;
      }
      .hc-assist-row-text {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .hc-assist-row-label {
        font-size: 0.86rem;
        font-weight: 600;
        line-height: 1.25;
        letter-spacing: -0.005em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .hc-assist-row-description {
        margin-top: 0.1rem;
        font-size: 0.74rem;
        line-height: 1.3;
        color: color-mix(in srgb, currentColor 55%, transparent);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .hc-assist-row-chevron {
        opacity: 0.42;
        transition: transform 140ms ${EASE_OUT}, opacity 140ms ${EASE_OUT};
      }
      .hc-assist-row:hover .hc-assist-row-chevron,
      .hc-assist-row[data-active] .hc-assist-row-chevron {
        opacity: 0.8;
        transform: translateX(2px);
      }

      .hc-assist-row--contextual {
        background: color-mix(in srgb, var(--hc-assist-row-accent, #c9a227) 8%, transparent);
        border-bottom: 1px solid color-mix(in srgb, currentColor 8%, transparent);
      }
      .hc-assist-row--contextual:hover,
      .hc-assist-row--contextual[data-active] {
        background: color-mix(in srgb, var(--hc-assist-row-accent, #c9a227) 12%, transparent);
      }
      .hc-assist-row--contextual .hc-assist-row-icon {
        background: color-mix(in srgb, var(--hc-assist-row-accent, #c9a227) 16%, transparent);
        border-color: color-mix(in srgb, var(--hc-assist-row-accent, #c9a227) 32%, transparent);
        color: var(--hc-assist-row-accent, #c9a227);
      }
      .hc-assist-row-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.32rem;
        margin-bottom: 0.22rem;
        padding: 0.06rem 0.5rem;
        border-radius: 9999px;
        background: color-mix(in srgb, var(--hc-assist-row-accent, #c9a227) 14%, transparent);
        color: var(--hc-assist-row-accent, #c9a227);
        font-size: 0.6rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        font-weight: 700;
        width: max-content;
      }
      .hc-assist-row--contextual .hc-assist-row-label {
        white-space: normal;
      }

      .hc-assist-row--assist {
        border-top: 1px solid color-mix(in srgb, currentColor 8%, transparent);
        background: color-mix(in srgb, var(--hc-assist-row-accent, #c9a227) 5%, transparent);
      }
      .hc-assist-row--assist:hover,
      .hc-assist-row--assist[data-active] {
        background: color-mix(in srgb, var(--hc-assist-row-accent, #c9a227) 10%, transparent);
      }
      .hc-assist-row--assist .hc-assist-row-icon {
        background: color-mix(in srgb, var(--hc-assist-row-accent, #c9a227) 14%, transparent);
        border-color: color-mix(in srgb, var(--hc-assist-row-accent, #c9a227) 28%, transparent);
        color: var(--hc-assist-row-accent, #c9a227);
      }

      .hc-assist-empty {
        padding: 1.4rem 1.05rem;
        text-align: center;
      }
      .hc-assist-empty-title {
        margin: 0;
        font-size: 0.88rem;
        font-weight: 600;
      }
      .hc-assist-empty-body {
        margin: 0.35rem 0 0;
        font-size: 0.78rem;
        color: color-mix(in srgb, currentColor 60%, transparent);
        line-height: 1.4;
      }
      .hc-assist-empty-cta {
        margin-top: 0.95rem;
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.45rem 0.95rem;
        border-radius: 9999px;
        border: 1px solid currentColor;
        font-size: 0.78rem;
        font-weight: 600;
        text-decoration: none;
        transition: background 140ms ${EASE_OUT}, transform 140ms ${EASE_OUT};
      }
      .hc-assist-empty-cta:hover {
        background: color-mix(in srgb, currentColor 8%, transparent);
        transform: translateY(-1px);
      }

      .hc-assist-footer {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.65rem 1.05rem;
        border-top: 1px solid color-mix(in srgb, currentColor 8%, transparent);
        background: color-mix(in srgb, var(--hc-bg-soft, #fafafa) 55%, transparent);
      }
      :where(.dark) .hc-assist-footer {
        background: rgba(245, 241, 232, 0.03);
      }
      .hc-assist-status-dot {
        position: relative;
        display: inline-block;
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 9999px;
        background: #22c55e;
        box-shadow: 0 0 0 0 color-mix(in srgb, #22c55e 60%, transparent);
        animation: hc-assist-online 2.6s ${EASE_OUT} infinite;
      }
      @keyframes hc-assist-online {
        0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, #22c55e 60%, transparent); }
        50% { box-shadow: 0 0 0 6px transparent; }
      }
      .hc-assist-status-text {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .hc-assist-status-title {
        font-size: 0.66rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        font-weight: 700;
        color: color-mix(in srgb, currentColor 55%, transparent);
      }
      .hc-assist-status-reply {
        font-size: 0.74rem;
        color: color-mix(in srgb, currentColor 70%, transparent);
      }

      @keyframes hc-assist-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @media (prefers-reduced-motion: reduce) {
        .hc-assist-trigger,
        .hc-assist-row,
        .hc-assist-row-chevron,
        .hc-assist-empty-cta {
          transition: none !important;
          animation: none !important;
          transform: none !important;
        }
        .hc-assist-trigger-pulse,
        .hc-assist-status-dot {
          animation: none !important;
        }
      }
    `}</style>
  );
}
