// Intelligence Live L1 — the support.message.assist ACTION ENVELOPE + the navigation
// catalog. Pure + client-safe (no provider/model name, no secrets).
//
// The envelope gives the free support chat hands without giving the model the keys:
// it may only *name* a destination from the catalog below; the server resolves the
// href through @henryco/config's canonical URL helpers and silently drops anything
// unknown. A model can therefore never link a person off-platform or to an invented
// route — the catalog IS the boundary.

import { getAccountUrl, getDivisionUrl } from "@henryco/config";
import { humanizeAssistantText } from "./doctrine";

/** One navigation button the assistant offers: a catalog target + a label in the person's language. */
export interface SupportAssistAction {
  target: string;
  label: string;
}

/** The `{reply, navigate, handoff}` output envelope of `support.message.assist`. */
export interface SupportAssistEnvelope {
  reply: string;
  navigate: SupportAssistAction[];
  /** True when the person asked for a human or the AI cannot resolve it — the Onyx Line takes over. */
  handoff: boolean;
}

const MAX_ACTIONS = 2;
const MAX_LABEL_CHARS = 60;
const MAX_TARGET_CHARS = 64;

/**
 * Parse the assistant's `{reply, navigate, handoff}` envelope. Tolerates a stray code
 * fence or surrounding prose by extracting the first balanced object; returns null when
 * nothing usable is found. Registered as the orchestrator's `validateOutput` for
 * `support.message.assist`, so a malformed envelope triggers ONE automatic model retry
 * (then a typed refusal) instead of ever showing a person raw JSON.
 */
export function parseSupportAssistEnvelope(text: string): SupportAssistEnvelope | null {
  const trimmed = String(text ?? "").trim();
  const fenced = trimmed.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

  const attempt = (candidate: string): SupportAssistEnvelope | null => {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
      const record = parsed as Record<string, unknown>;
      const reply = humanizeAssistantText(String(record.reply ?? ""));
      if (!reply) return null;

      const navigate: SupportAssistAction[] = [];
      if (Array.isArray(record.navigate)) {
        for (const entry of record.navigate) {
          if (navigate.length >= MAX_ACTIONS) break;
          if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
          const row = entry as Record<string, unknown>;
          const target = String(row.target ?? "").trim().slice(0, MAX_TARGET_CHARS);
          const label = String(row.label ?? "").trim().slice(0, MAX_LABEL_CHARS);
          if (!target || !label) continue;
          navigate.push({ target, label });
        }
      }

      return { reply, navigate, handoff: record.handoff === true };
    } catch {
      return null;
    }
  };

  const direct = attempt(fenced);
  if (direct) return direct;

  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  return attempt(fenced.slice(start, end + 1));
}

// ─── The navigation catalog ────────────────────────────────────────────────
//
// Every target maps to a route that already exists and is already deep-linked by the
// shared support launcher (packages/ui/src/support/SupportAssist.tsx action tables) —
// nothing here is invented. `description` is what the model reads; `href` is what the
// person gets. Extend by adding entries; the parser and resolver need no change.

type NonAccountDivision = "marketplace" | "care" | "jobs" | "learn" | "logistics" | "property" | "studio";

function divisionHref(division: NonAccountDivision, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, `${getDivisionUrl(division)}/`).toString();
}

const DESTINATIONS: Record<string, { description: string; href: () => string }> = {
  "account.workspace": {
    description: "The person's Henry Onyx account home — every division's activity in one place",
    href: () => getAccountUrl("/"),
  },
  "account.wallet": {
    description: "Their wallet — balance, funding, and transaction history",
    href: () => getAccountUrl("/wallet"),
  },
  "account.notifications": {
    description: "Their notifications inbox",
    href: () => getAccountUrl("/notifications"),
  },
  "account.settings": {
    description: "Account settings — profile, security, preferences",
    href: () => getAccountUrl("/settings"),
  },
  "account.support": {
    description: "Their Onyx Line support inbox — existing conversations with the team",
    href: () => getAccountUrl("/support"),
  },
  "account.support.new": {
    description: "Start a new message to the human support team (the Onyx Line)",
    href: () => getAccountUrl("/support/new"),
  },
  "marketplace.orders": {
    description: "Their marketplace orders and tracking",
    href: () => divisionHref("marketplace", "/account/orders"),
  },
  "studio.request": {
    description: "Start a studio project brief — websites, brands, and builds",
    href: () => divisionHref("studio", "/request"),
  },
  "studio.client": {
    description: "Their studio client workspace — project progress and files",
    href: () => divisionHref("studio", "/client"),
  },
  "studio.payments": {
    description: "Their studio payments — invoices and receipts",
    href: () => divisionHref("studio", "/client/payments"),
  },
  "jobs.applications": {
    description: "Their job applications and interview schedule",
    href: () => divisionHref("jobs", "/candidate/applications"),
  },
  "learn.workspace": {
    description: "Their active courses and lessons",
    href: () => getAccountUrl("/learn?panel=active"),
  },
  "care.bookings": {
    description: "Their care bookings — garment, home, and office services",
    href: () => getAccountUrl("/care"),
  },
  "property.workspace": {
    description: "Their property activity — saved listings and viewings",
    href: () => getAccountUrl("/property?panel=listings"),
  },
  "logistics.workspace": {
    description: "Their logistics shipments and tracking",
    href: () => getAccountUrl("/logistics"),
  },
};

/** A resolved, render-ready navigation button. */
export interface ResolvedAssistAction {
  label: string;
  href: string;
}

/**
 * Resolve envelope actions to real hrefs through the catalog. Unknown targets are
 * dropped silently — the person never sees a dead or invented link.
 */
export function resolveSupportAssistActions(actions: SupportAssistAction[]): ResolvedAssistAction[] {
  const resolved: ResolvedAssistAction[] = [];
  for (const action of actions) {
    const destination = DESTINATIONS[action.target];
    if (!destination) continue;
    resolved.push({ label: action.label, href: destination.href() });
  }
  return resolved;
}

/** A fully interpreted support turn: the reply, the render-ready buttons, the escalation flag. */
export interface SupportAssistTurn {
  reply: string;
  navigate: ResolvedAssistAction[];
  handoff: boolean;
}

/**
 * The one call an app route makes on the raw model output: parse the envelope and resolve
 * its navigation against the catalog in a single step. Returns null only when the output is
 * unparseable — which the orchestrator's `validateOutput` already prevents by retrying — so
 * a route can treat null as a rare hard failure, never as a normal turn.
 */
export function interpretSupportAssistOutput(rawText: string): SupportAssistTurn | null {
  const envelope = parseSupportAssistEnvelope(rawText);
  if (!envelope) return null;
  return {
    reply: envelope.reply,
    navigate: resolveSupportAssistActions(envelope.navigate),
    handoff: envelope.handoff,
  };
}

/** The catalog as prompt lines — `target — description`, one per line. */
export function listSupportAssistDestinations(): string {
  return Object.entries(DESTINATIONS)
    .map(([target, d]) => `${target} — ${d.description}`)
    .join("\n");
}

/** True when `target` names a catalog destination (exposed for tests/UI checks). */
export function isSupportAssistDestination(target: string): boolean {
  return Object.prototype.hasOwnProperty.call(DESTINATIONS, target);
}
