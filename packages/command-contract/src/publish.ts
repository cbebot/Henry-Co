import {
  ALL_DIVISIONS,
  ALL_ATTENTION_TYPES,
  ALL_PRIORITIES,
  ALL_SURFACES,
  ALL_STAFF_DIVISIONS,
  type AttentionItem,
  type AttentionItemInput,
  type Result,
  type StaffDivision,
} from "./types";
import { ValidationError } from "./errors";

const DIVISIONS = new Set<string>(ALL_DIVISIONS);
const TYPES = new Set<string>(ALL_ATTENTION_TYPES);
const PRIORITIES = new Set<string>(ALL_PRIORITIES);
const SURFACES = new Set<string>(ALL_SURFACES);
const STAFF_DIVISIONS = new Set<string>(ALL_STAFF_DIVISIONS);

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validate a division's draft and normalise it into a publishable
 * {@link AttentionItem}. Pure — returns a `Result` so a rejection is never
 * coerced into a published item. Normalises currency to upper-case, defaults
 * `staffScope` to `[division]`, and stamps `status: "open"` (a division can
 * never publish a pre-resolved item).
 */
export function validateAttentionInput(
  input: AttentionItemInput,
): Result<AttentionItem, ValidationError> {
  const err = (field: string, message: string): Result<AttentionItem, ValidationError> => ({
    ok: false,
    error: new ValidationError(field, message),
  });

  if (!nonEmpty(input.id)) return err("id", "must be a non-empty id");
  if (!DIVISIONS.has(input.division)) return err("division", `unknown division: ${input.division}`);
  if (!TYPES.has(input.type)) return err("type", `unknown attention type: ${input.type}`);
  if (!PRIORITIES.has(input.priority)) return err("priority", `unknown priority: ${input.priority}`);
  if (!SURFACES.has(input.surface)) return err("surface", `unknown surface: ${input.surface}`);
  if (!nonEmpty(input.title)) return err("title", "must be a non-empty title");
  if (!nonEmpty(input.summary)) return err("summary", "must be a non-empty summary");
  if (!nonEmpty(input.actionLabel)) return err("actionLabel", "must be a non-empty action label");
  if (!nonEmpty(input.deepLink)) return err("deepLink", "must be a non-empty deep link");
  if (!nonEmpty(input.createdAt) || Number.isNaN(Date.parse(input.createdAt))) {
    return err("createdAt", "must be an ISO-8601 timestamp");
  }

  // Money pair: amount and currency are all-or-nothing, and the amount is
  // money — a positive safe integer in minor units, never a float.
  const amount = input.amountMinor ?? null;
  let currency = input.currency ?? null;
  if (amount !== null) {
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return err("amountMinor", `must be a positive safe integer in minor units, got ${amount}`);
    }
    if (!nonEmpty(currency)) return err("currency", "required when amountMinor is present");
    const upper = currency.toUpperCase();
    if (!/^[A-Z]{3}$/.test(upper)) {
      return err("currency", `must be a 3-letter ISO-4217 code, got ${currency}`);
    }
    currency = upper;
  } else if (currency !== null) {
    return err("amountMinor", "required when a currency is present");
  }

  // Staff scope: validate any explicit scope; otherwise default to the source
  // division when it is itself a staff division (else empty — owner-only).
  let staffScope: readonly StaffDivision[];
  if (input.staffScope && input.staffScope.length > 0) {
    for (const division of input.staffScope) {
      if (!STAFF_DIVISIONS.has(division)) {
        return err("staffScope", `unknown staff division: ${division}`);
      }
    }
    staffScope = input.staffScope;
  } else {
    staffScope = STAFF_DIVISIONS.has(input.division) ? [input.division as StaffDivision] : [];
  }

  const item: AttentionItem = {
    ...input,
    amountMinor: amount,
    currency,
    staffScope,
    status: "open",
  };
  return { ok: true, value: item };
}

/**
 * The publish-to-command sink. Divisions report up through this interface; the
 * surfaces read it back. The staging impl is in-memory; live wiring
 * (V3-COMMAND-03) implements the same interface over a Supabase table + RLS,
 * with no change to publishers or surfaces.
 */
export interface AttentionSink {
  publish(item: AttentionItem): void;
  list(): readonly AttentionItem[];
}

/** In-memory sink — proves the publish→store→read flow with zero live data. */
export class InMemoryAttentionStore implements AttentionSink {
  private items: AttentionItem[] = [];

  publish(item: AttentionItem): void {
    this.items.push(item);
  }

  list(): readonly AttentionItem[] {
    return this.items;
  }

  /** Convenience for staging: seed an already-validated feed in one call. */
  seed(items: readonly AttentionItem[]): void {
    this.items.push(...items);
  }

  clear(): void {
    this.items = [];
  }
}

/**
 * Validate `input` and, only if valid, publish it to `sink`. Returns the same
 * `Result` either way — an invalid item is rejected and never reaches the sink.
 */
export function publishAttentionItem(
  sink: AttentionSink,
  input: AttentionItemInput,
): Result<AttentionItem, ValidationError> {
  const validated = validateAttentionInput(input);
  if (!validated.ok) return validated;
  sink.publish(validated.value);
  return validated;
}
