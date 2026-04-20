"use client";

import { useState, useEffect, useRef } from "react";
import { useOptionalHenryCoLocale } from "@henryco/i18n/react";

// ─── Types ─────────────────────────────────────────────────────────────────

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

type DockAction = {
  label: string;
  description: string;
  href: string;
  external: boolean;
};

export type AssistDockProps = {
  division: AssistDivision;
  accent?: string;
};

// ─── Account URL helper ─────────────────────────────────────────────────────
// NEXT_PUBLIC_BASE_DOMAIN is inlined at build time by Next.js for client components.

const BASE_DOMAIN =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "henrycogroup.com"
    : "henrycogroup.com";

function acct(path: string) {
  return `https://account.${BASE_DOMAIN}${path}`;
}

function hub(path: string) {
  return `https://${BASE_DOMAIN}${path}`;
}

function divisionUrl(division: Exclude<AssistDivision, "account" | "hub">, path: string) {
  return `https://${division}.${BASE_DOMAIN}${path}`;
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

// ─── Action definitions ─────────────────────────────────────────────────────

type ActionsByLocale = (locale: string) => DockAction[];

const DIVISION_ACTIONS: Record<AssistDivision, ActionsByLocale> = {
  marketplace: () => [
    {
      label: "Track your order",
      description: "Check order status and delivery updates",
      href: divisionUrl("marketplace", "/account/orders"),
      external: false,
    },
    {
      label: "Order support",
      description: "Get help with seller communication, delivery, or fulfillment issues",
      href: accountSupportHref({
        division: "marketplace",
        subject: "Marketplace order support",
        context: "order-support",
      }),
      external: false,
    },
    {
      label: "Buyer protection",
      description: "Dispute resolution and purchase safety",
      href: accountSupportHref({
        division: "marketplace",
        subject: "Marketplace buyer protection issue",
        context: "buyer-protection",
      }),
      external: false,
    },
    {
      label: "Open support ticket",
      description: "Get help from the HenryCo team",
      href: accountSupportHref({
        division: "marketplace",
        subject: "Marketplace support request",
        context: "general-support",
      }),
      external: false,
    },
    {
      label: "Your notifications",
      description: "Inbox, updates, and alerts",
      href: acct("/notifications"),
      external: false,
    },
  ],
  care: () => [
    {
      label: "Track your booking",
      description: "Check booking status and pickup updates",
      href: "/track",
      external: false,
    },
    {
      label: "Open care bookings",
      description: "View linked bookings, receipts, and booking follow-up",
      href: acct("/care"),
      external: false,
    },
    {
      label: "Payment and receipt help",
      description: "Get help with payment proof, receipts, or booking billing",
      href: accountSupportHref({
        division: "care",
        subject: "Care payment or receipt issue",
        context: "payment-receipt",
      }),
      external: false,
    },
    {
      label: "Care support",
      description: "Speak to the HenryCo Care team",
      href: accountSupportHref({
        division: "care",
        subject: "Care booking support",
        context: "booking-support",
      }),
      external: false,
    },
  ],
  jobs: () => [
    {
      label: "Your applications",
      description: "Track applications and recruiter updates",
      href: divisionUrl("jobs", "/candidate/applications"),
      external: false,
    },
    {
      label: "Interview status",
      description: "View scheduled interviews and details",
      href: divisionUrl("jobs", "/candidate/interviews"),
      external: false,
    },
    {
      label: "Report suspicious employer",
      description: "Flag an employer for review",
      href: accountSupportHref({
        division: "jobs",
        subject: "Report suspicious employer",
        context: "employer-report",
      }),
      external: false,
    },
    {
      label: "Jobs help",
      description: "Get help from the HenryCo Jobs team",
      href: divisionUrl("jobs", "/help"),
      external: false,
    },
  ],
  learn: () => [
    {
      label: "Continue learning",
      description: "Pick up where you left off",
      href: acct("/learn?panel=active"),
      external: false,
    },
    {
      label: "Open certificates",
      description: "See issued certificates and completion records in your account",
      href: acct("/learn?panel=certificates"),
      external: false,
    },
    {
      label: "Report a course issue",
      description: "Flag content, access, or billing problems",
      href: accountSupportHref({
        division: "learn",
        subject: "Learn course issue",
        context: "course-issue",
      }),
      external: false,
    },
    {
      label: "Learning help",
      description: "Get help from the HenryCo Learn team",
      href: divisionUrl("learn", "/help"),
      external: false,
    },
  ],
  logistics: () => [
    {
      label: "Track your shipment",
      description: "Real-time location and delivery ETA",
      href: "/track",
      external: false,
    },
    {
      label: "Open logistics hub",
      description: "View logistics activity, pricing, and shared account history",
      href: acct("/logistics"),
      external: false,
    },
    {
      label: "Report delivery issue",
      description: "Missing, damaged, or late shipment",
      href: accountSupportHref({
        division: "logistics",
        subject: "Logistics delivery issue",
        context: "delivery-issue",
      }),
      external: false,
    },
    {
      label: "Logistics support",
      description: "Get help from the HenryCo Logistics team",
      href: "/support",
      external: false,
    },
  ],
  property: () => [
    {
      label: "Track listing review",
      description: "Check your listing status and feedback",
      href: acct("/property?panel=listings"),
      external: false,
    },
    {
      label: "Find properties to view",
      description: "Browse live listings and shortlist places for a viewing",
      href: "/search",
      external: false,
    },
    {
      label: "Report a listing",
      description: "Flag inaccurate or suspicious listing",
      href: accountSupportHref({
        division: "property",
        subject: "Report property listing",
        context: "listing-report",
      }),
      external: false,
    },
    {
      label: "Property support",
      description: "Get help from the HenryCo Property team",
      href: accountSupportHref({
        division: "property",
        subject: "Property support request",
        context: "general-support",
      }),
      external: false,
    },
  ],
  studio: () => [
    {
      label: "View your projects",
      description: "Open your active Studio project workspace",
      href: divisionUrl("studio", "/client/projects"),
      external: false,
    },
    {
      label: "Start a project request",
      description: "Open the real Studio request flow for a new brief",
      href: "/request",
      external: false,
    },
    {
      label: "Payment and invoice help",
      description: "Questions about studio payments",
      href: accountSupportHref({
        division: "studio",
        subject: "Studio payment or invoice help",
        context: "invoice-help",
      }),
      external: false,
    },
    {
      label: "Contact Studio",
      description: "Reach the Studio team through the real contact route",
      href: "/contact",
      external: false,
    },
  ],
  account: () => [
    {
      label: "Open inbox",
      description: "Notifications across all HenryCo divisions",
      href: "/notifications",
      external: false,
    },
    {
      label: "Support center",
      description: "Create or view support tickets",
      href: "/support",
      external: false,
    },
    {
      label: "Wallet and payments",
      description: "Funding, withdrawals, and transaction help",
      href: "/wallet",
      external: false,
    },
    {
      label: "Manage preferences",
      description: "Notifications, privacy, and display settings",
      href: "/settings",
      external: false,
    },
  ],
  hub: () => [
    {
      label: "Explore divisions",
      description: "Jump to the live divisions directory on the hub homepage",
      href: "/#divisions",
      external: false,
    },
    {
      label: "Open your account",
      description: "Wallet, inbox, and cross-division dashboard",
      href: acct("/"),
      external: false,
    },
    {
      label: "Contact HenryCo",
      description: "General support and enquiries",
      href: hub("/contact"),
      external: false,
    },
    {
      label: "View ecosystem map",
      description: "See how the HenryCo divisions connect across the platform",
      href: "/#ecosystem",
      external: false,
    },
  ],
};

// ─── Label copy (minimal locale support — EN primary, RTL safe) ────────────

function getDockCopy(locale: string) {
  if (locale === "fr") {
    return { trigger: "Aide", title: "Assistance HenryCo", subtitle: "Comment pouvons-nous vous aider\u00a0?", close: "Fermer" };
  }
  if (locale === "ar") {
    return { trigger: "مساعدة", title: "دعم هنري كو", subtitle: "كيف يمكننا مساعدتك؟", close: "إغلاق" };
  }
  if (locale === "es") {
    return { trigger: "Ayuda", title: "Asistencia HenryCo", subtitle: "\u00bfC\u00f3mo podemos ayudarte?", close: "Cerrar" };
  }
  if (locale === "pt") {
    return { trigger: "Ajuda", title: "Suporte HenryCo", subtitle: "Como podemos ajudar?", close: "Fechar" };
  }
  if (locale === "de") {
    return { trigger: "Hilfe", title: "HenryCo Support", subtitle: "Wie k\u00f6nnen wir helfen?", close: "Schlie\u00dfen" };
  }
  if (locale === "it") {
    return { trigger: "Aiuto", title: "Supporto HenryCo", subtitle: "Come possiamo aiutarti?", close: "Chiudi" };
  }
  return { trigger: "Help", title: "HenryCo Support", subtitle: "How can we help?", close: "Close" };
}

// ─── Icons (inline SVG — no extra icon import weight) ──────────────────────

function HelpIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.75" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function ChevronRightIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ─── AssistDock ─────────────────────────────────────────────────────────────

export function AssistDock({ division, accent = "#C9A227" }: AssistDockProps) {
  const locale = useOptionalHenryCoLocale() ?? "en";
  const copy = getDockCopy(locale);
  const actions = DIVISION_ACTIONS[division](locale);

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Click-outside to close
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

  // Focus first action when panel opens
  useEffect(() => {
    if (open && panelRef.current) {
      const firstLink = panelRef.current.querySelector("a");
      firstLink?.focus();
    }
  }, [open]);

  return (
    <div
      className="fixed bottom-0 end-0 z-40 flex flex-col items-end gap-2 p-4"
      style={{
        paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))",
        paddingRight: "max(1rem, env(safe-area-inset-right, 1rem))",
      }}
    >
      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={copy.title}
          className="w-72 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.14)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 dark:border-zinc-700/60 dark:bg-zinc-900"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ backgroundColor: accent }}
          >
            <div>
              <p className="text-[0.8rem] font-bold tracking-wide text-white">{copy.title}</p>
              <p className="text-[0.7rem] text-white/75">{copy.subtitle}</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label={copy.close}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/20 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              <CloseIcon size={14} />
            </button>
          </div>

          {/* Actions */}
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {actions.map((action) => (
              <a
                key={action.href + action.label}
                href={action.href}
                target={action.external ? "_blank" : undefined}
                rel={action.external ? "noreferrer" : undefined}
                className="group flex items-center gap-3 px-4 py-3 text-start transition hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:outline-none dark:hover:bg-zinc-800/60 dark:focus-visible:bg-zinc-800/60"
                onClick={() => setOpen(false)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[0.82rem] font-semibold text-zinc-800 dark:text-zinc-100 group-hover:text-zinc-900 dark:group-hover:text-white">
                    {action.label}
                  </p>
                  <p className="mt-0.5 truncate text-[0.72rem] text-zinc-500 dark:text-zinc-400">
                    {action.description}
                  </p>
                </div>
                <span className="shrink-0 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
                  <ChevronRightIcon size={13} />
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Trigger pill */}
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? copy.close : `${copy.title} — ${copy.subtitle}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-white shadow-[0_4px_20px_rgba(0,0,0,0.18)] transition hover:scale-[1.03] hover:shadow-[0_6px_24px_rgba(0,0,0,0.22)] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        style={{ backgroundColor: accent }}
      >
        <HelpIcon size={15} />
        <span className="text-[0.78rem] font-semibold tracking-wide">{copy.trigger}</span>
      </button>
    </div>
  );
}
