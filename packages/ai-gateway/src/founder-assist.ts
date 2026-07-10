// Founder Intelligence F2 — the hub.founder.assist ACTION ENVELOPE + the owner-console
// navigation catalog. Pure + client-safe (no provider/model name, no secrets).
//
// Same doctrine as support-assist: the envelope gives the founder's assistant hands
// without giving the model the keys. It may only NAME a destination from the closed
// catalog below; the server renders the href and silently drops anything unknown. The
// catalog is owner-console routes ONLY — this assistant navigates the founder around
// his own command center, never off it. Write ACTIONS are deliberately absent from
// this envelope: they arrive in F3 as a separate proposeAction catalog with server
// re-authorization and an explicit owner confirmation step.

import { humanizeAssistantText } from "./doctrine";

/** One navigation button the assistant offers: a catalog target + a label. */
export interface FounderAssistAction {
  target: string;
  label: string;
}

/** The `{reply, navigate}` output envelope of `hub.founder.assist`. */
export interface FounderAssistEnvelope {
  reply: string;
  navigate: FounderAssistAction[];
}

// 2, not 3: IntelligenceLauncher renders navigate.slice(0, 2) — a third button
// would be silently dropped (review finding, 2026-07-10).
const MAX_ACTIONS = 2;
const MAX_LABEL_CHARS = 60;
const MAX_TARGET_CHARS = 64;

/**
 * The owner-console catalog. Every href is a RELATIVE hub route that exists today
 * (apps/hub/app/owner/(command)/*) — the assistant runs on the hub origin, so no
 * cross-origin URL building is needed. Extend by adding entries; the parser and
 * resolver need no change.
 */
const DESTINATIONS: Record<string, { description: string; href: string }> = {
  "owner.overview": {
    description: "The executive overview — signals, metrics, division map, digest",
    href: "/owner",
  },
  "owner.finance": {
    description: "The money console — double-entry ledger reconciliation and review lanes",
    href: "/owner/finance",
  },
  "owner.finance.revenue": {
    description: "Recognized revenue by division",
    href: "/owner/finance/revenue",
  },
  "owner.finance.invoices": {
    description: "Pending and overdue invoices",
    href: "/owner/finance/invoices",
  },
  "owner.finance.expenses": {
    description: "Expense posture (care expenses and completed wallet payouts)",
    href: "/owner/finance/expenses",
  },
  "owner.divisions": {
    description: "Every division with stability, workload, staffing, and revenue",
    href: "/owner/divisions",
  },
  "owner.divisions.performance": {
    description: "Divisions ranked by the stability index",
    href: "/owner/divisions/performance",
  },
  "owner.operations": {
    description: "The operations center — cross-division workload and queues",
    href: "/owner/operations",
  },
  "owner.operations.alerts": {
    description: "Operational alerts needing owner attention",
    href: "/owner/operations/alerts",
  },
  "owner.messaging": {
    description: "Delivery health — email and WhatsApp queues, automation runs",
    href: "/owner/messaging",
  },
  "owner.messaging.alerts": {
    description: "Failed or skipped customer notifications",
    href: "/owner/messaging/alerts",
  },
  "owner.inbox": {
    description: "The owner email inbox — all mail to the company addresses",
    href: "/owner/inbox",
  },
  "owner.team": {
    description: "HQ internal team chat",
    href: "/owner/messaging/team",
  },
  "owner.staff": {
    description: "Staff and workforce management — people, roles, invitations",
    href: "/owner/staff",
  },
  "owner.audit": {
    description: "The audit log — every recorded staff and system action",
    href: "/owner/settings/audit",
  },
  "owner.brand": {
    description: "Brand, site settings, subdomains, and public pages",
    href: "/owner/brand",
  },
  "owner.signals": {
    description: "Live anomaly and pressure signals with evidence",
    href: "/owner/ai/signals",
  },
  "owner.insights": {
    description: "Evidence-triggered playbooks — what to do next and where",
    href: "/owner/ai/insights",
  },
  "owner.v3launch": {
    description: "The V3 launch dashboard — real adoption events over 24h and 7d",
    href: "/owner/v3-launch/dashboard",
  },
};

/**
 * Parse the assistant's `{reply, navigate}` envelope. Tolerates a stray code fence or
 * surrounding prose by extracting the first balanced object; returns null when nothing
 * usable is found. Registered as the orchestrator's `validateOutput` for
 * `hub.founder.assist`, so a malformed envelope triggers ONE automatic model retry.
 */
export function parseFounderAssistEnvelope(text: string): FounderAssistEnvelope | null {
  const trimmed = String(text ?? "").trim();
  const fenced = trimmed.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

  const attempt = (candidate: string): FounderAssistEnvelope | null => {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
      const record = parsed as Record<string, unknown>;
      const reply = humanizeAssistantText(String(record.reply ?? ""));
      if (!reply) return null;

      const navigate: FounderAssistAction[] = [];
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

      return { reply, navigate };
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

/**
 * Last-resort salvage after validateOutput failed twice: recover a plain-prose reply
 * into a minimal valid envelope, or fail closed when only raw JSON could be recovered.
 * The founder must never see raw JSON — but a formatting miss must not stonewall him
 * either.
 */
export function salvageFounderAssistEnvelope(rawText: string): string | null {
  const trimmed = String(rawText ?? "").trim();
  if (!trimmed) return null;
  const fenced = trimmed.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

  let candidate = "";
  const replyMatch = fenced.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (replyMatch) {
    try {
      candidate = JSON.parse(`"${replyMatch[1]}"`) as string;
    } catch {
      candidate = replyMatch[1];
    }
  } else if (!fenced.startsWith("{") && !fenced.startsWith("[")) {
    candidate = fenced;
  }

  const reply = humanizeAssistantText(candidate);
  if (!reply || /^[[{]/.test(reply.trim())) return null;

  return JSON.stringify({ reply, navigate: [] });
}

/** A resolved, render-ready navigation button (relative hub href). */
export interface ResolvedFounderAction {
  label: string;
  href: string;
}

/**
 * Resolve envelope actions against the catalog. Unknown targets are dropped silently;
 * prototype-key probes ("__proto__", "constructor") cannot smuggle a non-catalog entry
 * because only OWN properties resolve.
 */
export function resolveFounderAssistActions(actions: FounderAssistAction[]): ResolvedFounderAction[] {
  const resolved: ResolvedFounderAction[] = [];
  for (const action of actions) {
    if (!Object.prototype.hasOwnProperty.call(DESTINATIONS, action.target)) continue;
    const destination = DESTINATIONS[action.target];
    if (!destination) continue;
    resolved.push({ label: action.label, href: destination.href });
  }
  return resolved;
}

/** A fully interpreted founder turn: the reply and the render-ready buttons. */
export interface FounderAssistTurn {
  reply: string;
  navigate: ResolvedFounderAction[];
}

/** The one call the hub route makes on the raw model output. */
export function interpretFounderAssistOutput(rawText: string): FounderAssistTurn | null {
  const envelope = parseFounderAssistEnvelope(rawText);
  if (!envelope) return null;
  return {
    reply: envelope.reply,
    navigate: resolveFounderAssistActions(envelope.navigate),
  };
}

/** The catalog as prompt lines — `target — description`, one per line. */
export function listFounderAssistDestinations(): string {
  return Object.entries(DESTINATIONS)
    .map(([target, d]) => `${target} — ${d.description}`)
    .join("\n");
}

/** True when `target` names a catalog destination (exposed for tests). */
export function isFounderAssistDestination(target: string): boolean {
  return Object.prototype.hasOwnProperty.call(DESTINATIONS, target);
}
