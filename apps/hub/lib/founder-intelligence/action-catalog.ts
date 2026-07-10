import "server-only";

import type { ZodType } from "zod";
import { createAdminSupabase } from "@/lib/supabase";
import {
  applyCompanySettingsWrite,
  readCompanySettingsRow,
} from "@/lib/company-settings-write";
import { applyStaffStatusToggle, readStaffStatus } from "@/lib/staff-status-write";
import {
  brandSettingsGovernance,
  staffStatusGovernance,
  type FounderActionGovernance,
} from "./action-governance";

/**
 * Founder Intelligence F3 — THE closed write-action catalog.
 *
 * The F3 analogue of the F2 navigation catalog: the ONLY way the founder's
 * assistant can affect state. The AI names a `key` and fills the declared
 * params; the server does everything else. Adding an action = adding one entry
 * here, which keeps the write surface closed and greppable.
 *
 * Governance baked into the shape (the adversarial-audit fixes, 2026-07-10):
 *  - paramsSchema is `.strict()` — unknown keys are REJECTED, and no money
 *    entry may declare a free amount field (asserted by a test gate).
 *  - ownerPermission is "founder-only": every entry re-checks that the caller
 *    is the owner (is_owner), NEVER inherits a division-role union — an AI is
 *    in the loop, so the gate is founder-only by construction.
 *  - moneyAdjacent forces requiresReauth (asserted): "reversible" never
 *    substitutes for "no cash effect".
 *  - trueStateReader is a SERVER read of the record; driftKeys are re-read at
 *    confirm and any change aborts to a fresh card.
 *  - executionBinding calls the EXACT existing guarded write path (the shared
 *    core the human console also calls), with a server-derived idempotency key.
 */

export type FounderActionTrueState = Record<string, unknown>;

export type FounderActionResolveContext = {
  /** The validated params (post-strict-parse). */
  params: Record<string, unknown>;
};

export type FounderActionExecuteContext = {
  params: Record<string, unknown>;
  trueState: FounderActionTrueState;
  ownerId: string;
  ownerRole: string;
  /** Deterministic per-proposal token — the idempotency anchor. */
  token: string;
};

export type FounderActionEntry = FounderActionGovernance & {
  /** Owner-facing action name (company voice, no exclamation). */
  title: string;
  /** Whitelists + coerces the AI-fillable params. MUST be `.strict()`. */
  paramsSchema: ZodType;
  /** Server read of the record; null = missing/ineligible → no card. */
  trueStateReader: (ctx: FounderActionResolveContext) => Promise<FounderActionTrueState | null>;
  /** Card copy, rendered against the true state. */
  confirmationCopy: (trueState: FounderActionTrueState, params: Record<string, unknown>) => {
    title: string;
    body: string;
    confirmLabel: string;
  };
  /** Executes THROUGH the existing guarded path; returns an execution ref. */
  executionBinding: (ctx: FounderActionExecuteContext) => Promise<
    { ok: true; executionRef: string } | { ok: false; error: string }
  >;
  auditAction: string;
  entityType: string;
};

// ── Entry 1: brand settings text update (content, reversible, no money) ──────
//
// The AI may propose changing ONE branding text field to a new value. The value
// is caller-authored (allowed: it is content, never money), and the owner sees
// the exact old→new on the card before confirming. Deliberately EXCLUDES
// support_phone (trust invariant: the number lives at exactly one line and is
// never surfaced), media, and socials.

const brandSettingsUpdate: FounderActionEntry = {
  ...brandSettingsGovernance,
  title: "Update a brand text field",
  trueStateReader: async ({ params }) => {
    const row = await readCompanySettingsRow();
    const field = params.field as string;
    return {
      settingsId: row?.id ?? null,
      field,
      currentValue: (row?.[field] as string | null) ?? null,
      newValue: params.text as string,
      // Full current row snapshot so the binding can merge onto it (avoids the
      // normalizeCompanySettings defaults-fill trap on a single-field patch).
      currentRow: row,
    };
  },
  driftKeys: ["currentValue"],
  confirmationCopy: (trueState) => ({
    title: "Update brand text",
    body: `Change ${String(trueState.field)} from "${trueState.currentValue ?? "(empty)"}" to "${trueState.newValue}". This updates the public site.`,
    confirmLabel: "Update text",
  }),
  executionBinding: async ({ trueState }) => {
    const currentRow = (trueState.currentRow as Record<string, unknown> | null) ?? {};
    const field = String(trueState.field);
    const merged = { ...currentRow, [field]: trueState.newValue };
    const result = await applyCompanySettingsWrite(merged);
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true, executionRef: `company_settings:${field}` };
  },
  auditAction: "founder.owner.brand.settings.update",
  entityType: "company_settings",
};

// ── Entry 2: staff suspend / reactivate (identity, reversible, no money) ─────

const staffStatusToggle: FounderActionEntry = {
  ...staffStatusGovernance,
  title: "Suspend or reactivate a staff account",
  trueStateReader: async ({ params }) => {
    const status = await readStaffStatus(params.userId as string);
    if (!status) return null;
    const intent = params.intent as "suspend" | "reactivate";
    // No-op guard: proposing the state the account is already in.
    if ((intent === "suspend") === status.suspended) {
      return { ...status, intent, alreadyInTargetState: true };
    }
    return { ...status, intent, alreadyInTargetState: false };
  },
  driftKeys: ["suspended"],
  confirmationCopy: (trueState) => {
    const intent = String(trueState.intent);
    const email = String(trueState.email ?? "this account");
    return {
      title: intent === "suspend" ? "Suspend staff access" : "Reactivate staff access",
      body:
        intent === "suspend"
          ? `Suspend access for ${email}. They lose sign-in until reactivated.`
          : `Reactivate access for ${email}. They can sign in again.`,
      confirmLabel: intent === "suspend" ? "Suspend access" : "Reactivate access",
    };
  },
  executionBinding: async ({ trueState, ownerId, ownerRole }) => {
    if (trueState.alreadyInTargetState === true) {
      return { ok: false, error: "This account is already in that state." };
    }
    const applied = await applyStaffStatusToggle({
      userId: String(trueState.userId),
      intent: trueState.intent as "suspend" | "reactivate",
      actorId: ownerId,
      actorRole: ownerRole,
    });
    if (!applied.ok) return { ok: false, error: applied.error };
    return { ok: true, executionRef: `staff:${String(trueState.userId)}:${String(trueState.intent)}` };
  },
  auditAction: "founder.owner.staff.status.toggle",
  entityType: "staff",
};

export const FOUNDER_ACTION_CATALOG: Record<string, FounderActionEntry> = {
  [brandSettingsUpdate.key]: brandSettingsUpdate,
  [staffStatusToggle.key]: staffStatusToggle,
};

/** Own-property lookup (prototype-key probes resolve to undefined). */
export function getFounderAction(key: string): FounderActionEntry | undefined {
  if (!Object.prototype.hasOwnProperty.call(FOUNDER_ACTION_CATALOG, key)) return undefined;
  return FOUNDER_ACTION_CATALOG[key];
}

/**
 * The catalog rendered for the system prompt — key, title, and the exact param
 * names + allowed values each action accepts. Only entries at or below the
 * live tranche are shown, so a dark tranche is invisible to the model.
 */
export function listFounderActionsForPrompt(maxTranche: number): string {
  return Object.values(FOUNDER_ACTION_CATALOG)
    .filter((entry) => entry.tranche <= maxTranche)
    .map((entry) => {
      const shape = (entry.paramsSchema as unknown as { shape?: Record<string, unknown> }).shape;
      const params = shape ? Object.keys(shape).join(", ") : "(see schema)";
      return `${entry.key} — ${entry.title}. params: ${params}`;
    })
    .join("\n");
}

/** For the tests + the CI no-money-field gate. */
export function paramsSchemaKeys(entry: FounderActionEntry): string[] {
  const shape = (entry.paramsSchema as unknown as { shape?: Record<string, unknown> }).shape;
  return shape ? Object.keys(shape) : [];
}

export { createAdminSupabase };
