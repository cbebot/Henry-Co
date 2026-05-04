"use client";

/**
 * SupportDock — HenryCo's premium concierge surface.
 *
 * Replaces the previous AssistDock pill. The goals here are not
 * incremental improvements over a chat-bubble — this is the
 * customer-facing "help is here" mark that has to feel as confident
 * as the rest of the brand.
 *
 * Core engineering:
 *   - HenryCoMonogram in the trigger (no generic question-mark icon)
 *   - Brand-accent gradient header keyed to the current division
 *   - Smart contextual top action derived from the current URL
 *     (e.g. on /store/[slug], the first row becomes "Contact this store")
 *   - Always-visible search field that filters the action list inline
 *   - Operator availability footer with a live pulse dot (purely
 *     decorative; the actual SLA lives in the link target)
 *   - Focus trap, ESC, click-outside, route-change autoclose
 *   - prefers-reduced-motion: all transforms degrade to opacity fades
 *   - Mobile: full-screen sheet pinned to bottom with safe-area inset
 *   - Desktop: floating panel anchored to the trigger, top-stacked
 *
 * The entry is lazy: the panel content tree is only mounted after the
 * first interaction so the initial bundle doesn't carry it for the
 * 95%+ of pageviews where the user never opens the dock.
 */

import { useState, useEffect, useRef, useMemo, useId, useCallback, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { getAccountUrl, getDivisionUrl, getHubUrl } from "@henryco/config";
import { useOptionalHenryCoLocale } from "@henryco/i18n/react";
import { HenryCoMonogram } from "../brand";
import { useFocusTrap } from "../a11y/use-focus-trap";
import { useReducedMotion } from "../a11y/use-reduced-motion";

// ─── Public types (preserve AssistDock's external surface) ────────────────

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
  /** Lucide-equivalent inline icon node — kept inline to avoid pulling lucide weight. */
  icon?: React.ReactNode;
  /** Marks the contextual top action so it can render with extra prominence. */
  contextual?: boolean;
};

export type SupportDockProps = {
  division: AssistDivision;
  accent?: string;
};

// Backwards-compatible alias kept for existing consumers.
export type AssistDockProps = SupportDockProps;

// ─── URL helpers ──────────────────────────────────────────────────────────

function acct(path: string) {
  return getAccountUrl(path);
}

function hub(path: string) {
  return getHubUrl(path);
}

function divisionUrl(division: Exclude<AssistDivision, "account" | "hub">, path: string) {
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

// ─── Inline icons (zero dep weight) ───────────────────────────────────────
//
// Kept here so the dock can ship without dragging in lucide on routes that
// don't need it. Each icon is a single tightly-scoped path.

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

function IconSearch({ size = 16 }: { size?: number }) {
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

// ─── Action definitions ────────────────────────────────────────────────────

type ActionsByLocale = (locale: string) => DockAction[];

const DIVISION_ACTIONS: Record<AssistDivision, ActionsByLocale> = {
  marketplace: () => [
    {
      label: "Track your order",
      description: "Live status, fulfillment, and delivery updates",
      href: divisionUrl("marketplace", "/account/orders"),
      external: false,
      icon: <IconTruck />,
    },
    {
      label: "Order support",
      description: "Help with seller communication, delivery, fulfillment",
      href: accountSupportHref({
        division: "marketplace",
        subject: "Marketplace order support",
        context: "order-support",
      }),
      external: false,
      icon: <IconLifebuoy />,
    },
    {
      label: "Buyer protection",
      description: "Disputes, refunds, and HenryCo escrow review",
      href: accountSupportHref({
        division: "marketplace",
        subject: "Marketplace buyer protection issue",
        context: "buyer-protection",
      }),
      external: false,
      icon: <IconShield />,
    },
    {
      label: "Open a support thread",
      description: "Reach the HenryCo support team directly",
      href: accountSupportHref({
        division: "marketplace",
        subject: "Marketplace support request",
        context: "general-support",
      }),
      external: false,
      icon: <IconMessage />,
    },
    {
      label: "Your notifications",
      description: "Inbox, account updates, and alerts",
      href: acct("/notifications"),
      external: false,
      icon: <IconBell />,
    },
  ],
  care: () => [
    {
      label: "Track your booking",
      description: "Pickup, technician ETA, and care updates",
      href: "/track",
      external: false,
      icon: <IconTruck />,
    },
    {
      label: "Open care bookings",
      description: "Linked bookings, receipts, and follow-up",
      href: acct("/care"),
      external: false,
      icon: <IconLifebuoy />,
    },
    {
      label: "Payment and receipt help",
      description: "Receipts, billing, and payment proof issues",
      href: accountSupportHref({
        division: "care",
        subject: "Care payment or receipt issue",
        context: "payment-receipt",
      }),
      external: false,
      icon: <IconShield />,
    },
    {
      label: "Care support",
      description: "Speak directly to the HenryCo Care team",
      href: accountSupportHref({
        division: "care",
        subject: "Care booking support",
        context: "booking-support",
      }),
      external: false,
      icon: <IconMessage />,
    },
  ],
  jobs: () => [
    {
      label: "Your applications",
      description: "Track applications and recruiter activity",
      href: divisionUrl("jobs", "/candidate/applications"),
      external: false,
      icon: <IconUser />,
    },
    {
      label: "Interview status",
      description: "Scheduled interviews and recruiter notes",
      href: divisionUrl("jobs", "/candidate/interviews"),
      external: false,
      icon: <IconCompass />,
    },
    {
      label: "Report suspicious employer",
      description: "Flag a hiring company for review",
      href: accountSupportHref({
        division: "jobs",
        subject: "Report suspicious employer",
        context: "employer-report",
      }),
      external: false,
      icon: <IconShield />,
    },
    {
      label: "Jobs help",
      description: "Reach the HenryCo Jobs support team",
      href: divisionUrl("jobs", "/help"),
      external: false,
      icon: <IconMessage />,
    },
  ],
  learn: () => [
    {
      label: "Continue learning",
      description: "Pick up where you left off",
      href: acct("/learn?panel=active"),
      external: false,
      icon: <IconCompass />,
    },
    {
      label: "Open certificates",
      description: "Issued certificates and completion records",
      href: acct("/learn?panel=certificates"),
      external: false,
      icon: <IconShield />,
    },
    {
      label: "Report a course issue",
      description: "Content, access, or billing problems",
      href: accountSupportHref({
        division: "learn",
        subject: "Learn course issue",
        context: "course-issue",
      }),
      external: false,
      icon: <IconLifebuoy />,
    },
    {
      label: "Learning help",
      description: "Reach the HenryCo Learn team",
      href: divisionUrl("learn", "/help"),
      external: false,
      icon: <IconMessage />,
    },
  ],
  logistics: () => [
    {
      label: "Track your shipment",
      description: "Live location and delivery ETA",
      href: "/track",
      external: false,
      icon: <IconTruck />,
    },
    {
      label: "Open logistics hub",
      description: "Activity, pricing, and shared account history",
      href: acct("/logistics"),
      external: false,
      icon: <IconCompass />,
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
      icon: <IconShield />,
    },
    {
      label: "Logistics support",
      description: "Reach the HenryCo Logistics team",
      href: "/support",
      external: false,
      icon: <IconMessage />,
    },
  ],
  property: () => [
    {
      label: "Track listing review",
      description: "Listing status and editor feedback",
      href: acct("/property?panel=listings"),
      external: false,
      icon: <IconCompass />,
    },
    {
      label: "Find properties to view",
      description: "Browse and shortlist viewings",
      href: "/search",
      external: false,
      icon: <IconStore />,
    },
    {
      label: "Report a listing",
      description: "Inaccurate or suspicious listing",
      href: accountSupportHref({
        division: "property",
        subject: "Report property listing",
        context: "listing-report",
      }),
      external: false,
      icon: <IconShield />,
    },
    {
      label: "Property support",
      description: "Reach the HenryCo Property team",
      href: accountSupportHref({
        division: "property",
        subject: "Property support request",
        context: "general-support",
      }),
      external: false,
      icon: <IconMessage />,
    },
  ],
  studio: () => [
    {
      label: "Open your workspace",
      description: "Projects, files, payments, messages",
      href: divisionUrl("studio", "/client"),
      external: false,
      icon: <IconCompass />,
    },
    {
      label: "Draft a brief with the co-pilot",
      description: "Describe it in a paragraph — we structure it",
      href: divisionUrl("studio", "/request"),
      external: false,
      icon: <IconStore />,
    },
    {
      label: "Project messages",
      description: "Active threads with your Studio team",
      href: divisionUrl("studio", "/client/messages"),
      external: false,
      icon: <IconMessage />,
    },
    {
      label: "Files and deliverables",
      description: "Approved assets and shared work",
      href: divisionUrl("studio", "/client/files"),
      external: false,
      icon: <IconShield />,
    },
    {
      label: "Payments and invoices",
      description: "Outstanding balance, history, receipts",
      href: divisionUrl("studio", "/client/payments"),
      external: false,
      icon: <IconShield />,
    },
    {
      label: "Browse ready-to-start templates",
      description: "Prefilled briefs you can launch in minutes",
      href: divisionUrl("studio", "/pick"),
      external: false,
      icon: <IconStore />,
    },
    {
      label: "Payment and invoice help",
      description: "Open a support thread with finance",
      href: accountSupportHref({
        division: "studio",
        subject: "Studio payment or invoice help",
        context: "invoice-help",
      }),
      external: false,
      icon: <IconLifebuoy />,
    },
    {
      label: "Contact Studio",
      description: "Reach the Studio team directly",
      href: divisionUrl("studio", "/contact"),
      external: false,
      icon: <IconUser />,
    },
  ],
  account: () => [
    {
      label: "Open inbox",
      description: "Notifications across HenryCo divisions",
      href: "/notifications",
      external: false,
      icon: <IconBell />,
    },
    {
      label: "Support center",
      description: "Create or view support tickets",
      href: "/support",
      external: false,
      icon: <IconLifebuoy />,
    },
    {
      label: "Wallet and payments",
      description: "Funding, withdrawals, and transactions",
      href: "/wallet",
      external: false,
      icon: <IconShield />,
    },
    {
      label: "Manage preferences",
      description: "Notifications, privacy, and display",
      href: "/settings",
      external: false,
      icon: <IconCompass />,
    },
  ],
  hub: () => [
    {
      label: "Explore divisions",
      description: "All Henry & Co. divisions on one page",
      href: "/#divisions",
      external: false,
      icon: <IconCompass />,
    },
    {
      label: "Open your account",
      description: "Wallet, inbox, and dashboard",
      href: acct("/"),
      external: false,
      icon: <IconUser />,
    },
    {
      label: "Contact HenryCo",
      description: "General support and enquiries",
      href: hub("/contact"),
      external: false,
      icon: <IconMessage />,
    },
    {
      label: "View ecosystem map",
      description: "How the divisions connect across the platform",
      href: "/#ecosystem",
      external: false,
      icon: <IconStore />,
    },
  ],
};

// ─── Smart context detection ──────────────────────────────────────────────
//
// Reads the current pathname (client-only) and surfaces a single
// "right now" action at the top of the dock. Pure-string matching to
// keep this dependency-free.

function detectContextualAction(division: AssistDivision, pathname: string): DockAction | null {
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
        label: "Contact this store",
        description: "Open a support thread tied to this storefront",
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
        label: "Question about this product",
        description: "Send a support thread linked to this listing",
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
        label: "Checkout help",
        description: "Get help finishing this order",
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
        label: "Help with this shipment",
        description: "Open a thread tied to this tracking code",
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
        label: "Help with this booking",
        description: "Reach the Care team about your active booking",
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
        label: "Help finding a property",
        description: "Tell our team what you're looking for",
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

type DockCopy = {
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

function getDockCopy(locale: string): DockCopy {
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

// ─── Component ────────────────────────────────────────────────────────────

export function SupportDock({ division, accent = "#C9A227" }: SupportDockProps) {
  const locale = useOptionalHenryCoLocale() ?? "en";
  const copy = getDockCopy(locale);
  const reduceMotion = useReducedMotion();
  const headingId = useId();
  const searchId = useId();

  const baseActions = useMemo(() => DIVISION_ACTIONS[division](locale), [division, locale]);

  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [query, setQuery] = useState("");
  const pathname = usePathname() ?? "";

  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const contextualAction = useMemo(
    () => detectContextualAction(division, pathname),
    [division, pathname],
  );

  // Auto-close when route changes (defensive — popstate covers most cases).
  useEffect(() => {
    if (open) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // ESC handled inside focus trap. Click-outside for desktop.
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

  // Lock body scroll on mobile when sheet is open (≤640px).
  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const isSmall = window.matchMedia("(max-width: 640px)").matches;
    if (!isSmall) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
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

  // ─── Filtering ─────────────────────────────────────────────────────────

  const filteredActions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return baseActions;
    return baseActions.filter((action) =>
      [action.label, action.description].some((field) => field.toLowerCase().includes(q)),
    );
  }, [baseActions, query]);

  const showEmptyState = open && query.trim().length > 0 && filteredActions.length === 0;

  // Assist target — where to send a "quick question" when search misses.
  // Uses the existing /help flow for divisions that ship one, falls back
  // to the shared account support intake otherwise.
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
      // Divisions with their own /help intake form — keep the user in-app.
      const params = new URLSearchParams({
        subject,
        return_to: pathname || "/",
      });
      return `/help?${params.toString()}`;
    }
    // account / hub → shared account support intake.
    return acct(`/support/new?subject=${encodeURIComponent(subject)}`);
  }, [division, pathname, query]);

  // ─── Handlers ──────────────────────────────────────────────────────────

  const toggleOpen = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (next && !hasOpened) setHasOpened(true);
      return next;
    });
  }, [hasOpened]);

  const onSelect = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const accentText = useMemo(() => {
    // For copper-amber accent the sheet text on the gradient should be a warm cream.
    return "#FFF6DE";
  }, []);

  const triggerStyle: CSSProperties = {
    background: `linear-gradient(135deg, ${accent} 0%, ${shiftHexLightness(accent, -16)} 100%)`,
    color: accentText,
    boxShadow: `0 18px 44px ${withAlpha(accent, 0.32)}, 0 4px 12px rgba(0,0,0,0.16)`,
  };

  const headerStyle: CSSProperties = {
    background: `linear-gradient(135deg, ${accent} 0%, ${shiftHexLightness(accent, -22)} 65%, ${shiftHexLightness(accent, -34)} 100%)`,
    color: accentText,
  };

  return (
    <div
      // Right-anchored, narrow column. Was previously `inset-x-0` (full
      // viewport width) which made the wrapper span the whole bottom row
      // and could intercept scroll/tap events on touch devices. Now the
      // dock only occupies the area it needs and the rest of the bottom
      // strip stays free for page content + system safe-area gestures.
      className="fixed bottom-0 right-0 z-[60] pointer-events-none flex flex-col items-end gap-3"
      style={{
        paddingBottom: "max(0.85rem, env(safe-area-inset-bottom, 0.85rem))",
        paddingRight: "max(1rem, env(safe-area-inset-right, 1rem))",
        paddingLeft: "1rem",
      }}
    >
      {/* Mobile dim backdrop — only shown when sheet is open on small screens */}
      {open ? (
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={copy.close}
          className={[
            "fixed inset-0 z-[55] bg-black/60 backdrop-blur-[2px] sm:hidden pointer-events-auto",
            reduceMotion ? "" : "transition-opacity duration-200",
          ].join(" ")}
        />
      ) : null}

      {/* Panel — only mounted after first interaction.
          Mobile: bottom sheet with safe-area inset, drag-handle, and a
          slight inset from the screen edges so the rounded top corners
          read as a deliberate sheet (not a full-bleed slab).
          Desktop: a narrow floating panel anchored above the trigger. */}
      {hasOpened ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          aria-hidden={!open}
          className={[
            "pointer-events-auto",
            "ml-auto",
            // Mobile: inset 0.5rem from edges, fill remaining width.
            // Desktop: fixed-width floating panel.
            "w-[calc(100vw-1rem)] sm:w-[23rem]",
            "max-w-[28rem] sm:max-w-[23rem]",
            "max-h-[min(85dvh,640px)]",
            "rounded-[1.6rem] sm:rounded-[1.4rem]",
            "border border-zinc-200/85 dark:border-zinc-700/65",
            "bg-white dark:bg-zinc-950",
            "shadow-[0_30px_90px_rgba(8,12,28,0.4)]",
            "overflow-hidden",
            "fixed sm:static",
            // Mobile: anchor with safe-area aware inset; centered horizontally.
            "left-1/2 -translate-x-1/2 sm:left-auto sm:right-auto sm:translate-x-0",
            "z-[58]",
            // motion
            reduceMotion
              ? open
                ? "opacity-100"
                : "opacity-0 pointer-events-none"
              : open
                ? "translate-y-0 opacity-100 transition-[transform,opacity] duration-280 ease-[cubic-bezier(0.22,1,0.36,1)]"
                : "translate-y-3 opacity-0 pointer-events-none transition-[transform,opacity] duration-180 ease-out",
          ].join(" ")}
          style={{
            // Mobile vertical anchor: hover just above the safe-area + a
            // little breathing space; on desktop, this is overridden by
            // the static positioning of the parent flex container.
            bottom: "max(0.75rem, env(safe-area-inset-bottom, 0.75rem))",
          }}
          tabIndex={-1}
        >
          {/* Header */}
          <div
            className="relative flex items-start gap-3 px-5 py-4 sm:px-5 sm:py-4"
            style={headerStyle}
          >
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/[0.12] backdrop-blur-sm"
              style={{ color: accentText }}
            >
              <HenryCoMonogram size={28} accent={accentText} />
            </span>
            <div className="min-w-0 flex-1">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.26em]"
                style={{ color: withAlpha(accentText, 0.74) }}
              >
                {copy.divisionLabel} · {copy.divisions[division]}
              </p>
              <h2
                id={headingId}
                className="mt-0.5 text-[1.05rem] font-semibold leading-snug tracking-[-0.01em]"
                style={{ color: accentText, fontFamily: '"Newsreader","Iowan Old Style","Palatino Linotype",serif' }}
              >
                {copy.title}
              </h2>
              <p
                className="mt-0.5 text-[12px] leading-snug"
                style={{ color: withAlpha(accentText, 0.78) }}
              >
                {copy.subtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={copy.close}
              className="shrink-0 grid h-9 w-9 place-items-center rounded-xl text-white/85 transition hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <IconClose size={15} />
            </button>
          </div>

          {/* Search.
              The input font-size MUST be >= 16px on mobile or iOS Safari
              auto-zooms the viewport when the field receives focus. We
              render at 16px on touch devices and let the desktop `sm:`
              breakpoint shrink to a more proportionate 14px. The visual
              chrome stays the same — only the typed text size changes
              by 2px at the breakpoint. */}
          <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <label htmlFor={searchId} className="sr-only">
              {copy.searchLabel}
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-zinc-700 focus-within:border-zinc-400 focus-within:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:focus-within:border-zinc-500 dark:focus-within:bg-zinc-950">
              <span className="text-zinc-400 dark:text-zinc-500">
                <IconSearch size={15} />
              </span>
              <input
                id={searchId}
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={copy.searchPlaceholder}
                className="w-full bg-transparent text-[16px] text-zinc-800 outline-none placeholder:text-zinc-400 sm:text-[14px] dark:text-zinc-100 dark:placeholder:text-zinc-500"
                autoComplete="off"
                spellCheck={false}
                inputMode="search"
                enterKeyHint="search"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    searchRef.current?.focus();
                  }}
                  aria-label={copy.close}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  <IconClose size={13} />
                </button>
              ) : null}
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto" style={{ maxHeight: "calc(min(82vh, 640px) - 11rem)" }}>
            {/* Contextual top action — only when no search query */}
            {!query && contextualAction ? (
              <ContextualRow
                action={contextualAction}
                accent={accent}
                badgeLabel={copy.contextualBadge}
                onSelect={onSelect}
                reduceMotion={reduceMotion}
              />
            ) : null}

            {/* Filtered actions */}
            {filteredActions.length > 0 ? (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredActions.map((action, index) => (
                  <ActionRow
                    key={`${action.href}-${action.label}`}
                    action={action}
                    index={index}
                    onSelect={onSelect}
                    reduceMotion={reduceMotion}
                    accent={accent}
                  />
                ))}
              </ul>
            ) : null}

            {showEmptyState ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                  {copy.emptyTitle}
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {copy.emptyBody}
                </p>
                {assistHref ? (
                  <a
                    href={assistHref}
                    onClick={onSelect}
                    className={[
                      "mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.82rem] font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/10",
                      reduceMotion
                        ? "transition-colors"
                        : "transition-[transform,box-shadow] duration-220 ease-out hover:-translate-y-[1px]",
                    ].join(" ")}
                    style={{
                      background: `linear-gradient(135deg, ${accent}, ${shiftHexLightness(accent, -22)})`,
                      boxShadow: `0 14px 32px ${withAlpha(accent, 0.32)}`,
                    }}
                    aria-label={`${copy.assistTitle}: ${copy.assistCta}`}
                  >
                    <IconMessage size={14} />
                    {copy.assistCta}
                  </a>
                ) : null}
              </div>
            ) : null}

            {/* Always-on assist hint at bottom — appears when there's a query but matches are present too */}
            {open && query.trim().length > 0 && filteredActions.length > 0 && assistHref ? (
              <a
                href={assistHref}
                onClick={onSelect}
                className={[
                  "flex items-center gap-3 border-t border-zinc-100 px-4 py-3 text-left outline-none transition focus-visible:bg-zinc-50 dark:border-zinc-800 dark:focus-visible:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-900/60",
                ].join(" ")}
                style={{ color: accent }}
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border"
                  style={{
                    background: withAlpha(accent, 0.14),
                    borderColor: withAlpha(accent, 0.32),
                    color: accent,
                  }}
                  aria-hidden="true"
                >
                  <IconMessage size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.82rem] font-semibold leading-snug text-zinc-900 dark:text-white">
                    {copy.assistTitle}
                  </p>
                  <p className="mt-0.5 truncate text-[11.5px] leading-snug text-zinc-500 dark:text-zinc-400">
                    {copy.assistBody(query.trim())}
                  </p>
                </div>
                <span aria-hidden="true">
                  <IconChevron size={13} />
                </span>
              </a>
            ) : null}
          </div>

          {/* Footer status */}
          <div className="flex items-center gap-3 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
            <span className="relative grid h-2 w-2 place-items-center" aria-hidden="true">
              <span
                className={[
                  "absolute inset-0 rounded-full",
                  reduceMotion ? "" : "animate-ping",
                ].join(" ")}
                style={{ background: "rgba(34,197,94,0.55)" }}
              />
              <span className="h-2 w-2 rounded-full" style={{ background: "#22c55e" }} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                {copy.statusOnline}
              </p>
              <p className="text-[11.5px] text-zinc-500 dark:text-zinc-400">
                {copy.statusReply}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Trigger — premium capsule, always pointer-events-auto.
          On mobile we render a tighter monogram-only pill (44x44 thumb
          target, no stacked text — keeps the chrome quiet so it doesn't
          fight page content). The full label expands at sm: where the
          dock has more breathing room. The trigger is hidden when the
          panel is open on mobile so it doesn't compete with the close
          button at the top of the sheet. */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={open ? copy.close : `${copy.title} — ${copy.triggerHint}`}
        className={[
          "pointer-events-auto",
          "ml-auto",
          // Hide trigger on mobile when panel is open — close button
          // inside the panel takes over. On desktop it stays visible.
          open ? "hidden sm:inline-flex" : "inline-flex",
          "group items-center gap-2.5 rounded-full font-semibold",
          // Mobile: square-ish, monogram only.
          "h-12 w-12 justify-center p-0 sm:h-auto sm:w-auto sm:justify-start sm:py-2 sm:pl-2 sm:pr-4",
          "outline-none focus-visible:ring-2 focus-visible:ring-white/85 focus-visible:ring-offset-2 focus-visible:ring-offset-black/10",
          reduceMotion
            ? "transition-colors"
            : "transition-[transform,box-shadow] duration-220 ease-out hover:-translate-y-[1.5px] active:translate-y-0",
        ].join(" ")}
        style={triggerStyle}
        data-open={open ? "true" : "false"}
      >
        <span
          className={[
            "grid place-items-center rounded-full bg-white/15 backdrop-blur-sm",
            // Slightly larger monogram chip on mobile (no text alongside)
            "h-9 w-9 sm:h-8 sm:w-8",
            reduceMotion ? "" : "transition group-hover:scale-[1.04]",
          ].join(" ")}
          aria-hidden="true"
        >
          <HenryCoMonogram size={22} accent={accentText} />
        </span>
        <span className="hidden flex-col items-start leading-none sm:flex">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] opacity-80">
            {copy.triggerHint}
          </span>
          <span className="text-[0.84rem] font-semibold tracking-[0.01em]">{copy.trigger}</span>
        </span>
      </button>
    </div>
  );
}

// Backwards-compatible alias — every existing AssistDock import keeps working.
export const AssistDock = SupportDock;

// ─── Sub-components ────────────────────────────────────────────────────────

function ContextualRow({
  action,
  accent,
  badgeLabel,
  onSelect,
  reduceMotion,
}: {
  action: DockAction;
  accent: string;
  badgeLabel: string;
  onSelect: () => void;
  reduceMotion: boolean;
}) {
  const style: CSSProperties = {
    background: `linear-gradient(135deg, ${withAlpha(accent, 0.16)} 0%, ${withAlpha(accent, 0.05)} 100%)`,
    borderColor: withAlpha(accent, 0.35),
  };
  return (
    <a
      href={action.href}
      onClick={onSelect}
      className={[
        "flex items-center gap-3 border-b px-4 py-3.5 outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40",
        reduceMotion ? "transition-colors" : "transition-[background,transform] duration-200",
      ].join(" ")}
      style={style}
    >
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border text-zinc-700 dark:text-zinc-100"
        style={{
          background: withAlpha(accent, 0.18),
          borderColor: withAlpha(accent, 0.36),
          color: accent,
        }}
        aria-hidden="true"
      >
        {action.icon ?? <IconLifebuoy size={16} />}
      </span>
      <div className="min-w-0 flex-1">
        <span
          className="inline-block rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.2em]"
          style={{ background: withAlpha(accent, 0.18), color: accent }}
        >
          {badgeLabel}
        </span>
        <p className="mt-1.5 text-[0.88rem] font-semibold leading-snug text-zinc-900 dark:text-white">
          {action.label}
        </p>
        <p className="mt-0.5 truncate text-[12px] leading-snug text-zinc-500 dark:text-zinc-400">
          {action.description}
        </p>
      </div>
      <span
        className={[
          "shrink-0 text-zinc-400",
          reduceMotion ? "" : "transition group-hover:translate-x-0.5",
        ].join(" ")}
        aria-hidden="true"
      >
        <IconChevron size={14} />
      </span>
    </a>
  );
}

function ActionRow({
  action,
  index,
  onSelect,
  reduceMotion,
  accent,
}: {
  action: DockAction;
  index: number;
  onSelect: () => void;
  reduceMotion: boolean;
  accent: string;
}) {
  const style: CSSProperties = reduceMotion
    ? {}
    : {
        animationDelay: `${Math.min(index * 32, 240)}ms`,
      };

  return (
    <li>
      <a
        href={action.href}
        target={action.external ? "_blank" : undefined}
        rel={action.external ? "noreferrer" : undefined}
        onClick={onSelect}
        className={[
          "group flex items-center gap-3 px-4 py-3 outline-none transition focus-visible:bg-zinc-50 dark:focus-visible:bg-zinc-900/60",
          "hover:bg-zinc-50 dark:hover:bg-zinc-900/60",
          reduceMotion ? "" : "motion-safe:animate-[supportDockRowIn_0.32s_cubic-bezier(0.22,1,0.36,1)_both]",
        ].join(" ")}
        style={style}
      >
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition group-hover:border-zinc-300 group-hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:group-hover:border-zinc-500 dark:group-hover:text-white"
          style={{ color: accent }}
          aria-hidden="true"
        >
          {action.icon ?? <IconLifebuoy size={15} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.84rem] font-semibold text-zinc-800 dark:text-zinc-100">
            {action.label}
          </p>
          <p className="mt-0.5 truncate text-[11.5px] leading-snug text-zinc-500 dark:text-zinc-400">
            {action.description}
          </p>
        </div>
        <span
          className={[
            "shrink-0 text-zinc-400",
            reduceMotion ? "" : "transition group-hover:translate-x-0.5 group-hover:text-zinc-700 dark:group-hover:text-zinc-200",
          ].join(" ")}
          aria-hidden="true"
        >
          <IconChevron size={13} />
        </span>
      </a>
      {/* Per-row keyframes — scoped to the row to avoid global CSS leaks */}
      <style>{`@keyframes supportDockRowIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </li>
  );
}

// ─── Color helpers (no external dep) ───────────────────────────────────────

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function withAlpha(hex: string, alpha: number) {
  const { r, g, b } = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
}

function shiftHexLightness(hex: string, amount: number) {
  const { r, g, b } = parseHex(hex);
  const ratio = amount / 100;
  const adjust = (channel: number) => {
    if (ratio >= 0) return Math.round(channel + (255 - channel) * ratio);
    return Math.round(channel + channel * ratio);
  };
  const next = [adjust(r), adjust(g), adjust(b)].map((value) => clamp(value, 0, 255));
  return `#${next.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function parseHex(hex: string) {
  // Accepts #RGB or #RRGGBB. Falls back to copper if malformed.
  const value = hex?.startsWith("#") ? hex.slice(1) : hex || "";
  const expand = value.length === 3
    ? value.split("").map((char) => `${char}${char}`).join("")
    : value;
  if (!/^[0-9a-fA-F]{6}$/.test(expand)) {
    return { r: 201, g: 162, b: 39 };
  }
  return {
    r: parseInt(expand.slice(0, 2), 16),
    g: parseInt(expand.slice(2, 4), 16),
    b: parseInt(expand.slice(4, 6), 16),
  };
}
