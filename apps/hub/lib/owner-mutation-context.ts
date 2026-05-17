import "server-only";

import type { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { Logger } from "@henryco/observability";

/**
 * Track B / V3 PASS 21 / H4 — owner mutation observability wrapper.
 *
 * Every `/api/owner/*` mutation MUST flow through this helper so that:
 *
 *   1. A structured log line is emitted with `route`, `method`,
 *      `actor`, `outcome`, `duration_ms`, and any error metadata
 *      (redaction handled by `@henryco/observability/redaction`).
 *   2. A Sentry breadcrumb is added on entry; on error, Sentry captures
 *      the exception with route + actor context.
 *   3. The caller still writes the domain-specific audit_log row via
 *      `writeOwnerAudit()` — this wrapper handles the OBSERVABILITY
 *      half; audit-log writes remain the route handler's responsibility
 *      so the action name + entity_type + before/after payload stay
 *      local to the route.
 *
 * Why this shape: routes today are short, so wrapping the whole body
 * inside a helper keeps the diff small AND gives the V14/V19 verifier
 * a single chokepoint to grep ("does every owner mutation call
 * `withOwnerMutationContext`?").
 */

const ownerLogger = new Logger({ namespace: "hub.owner" });

export type OwnerMutationActor = {
  id?: string | null;
  email?: string | null;
  role?: string | null;
};

export type OwnerMutationContext = {
  /** Route path — e.g. "/api/owner/settings". */
  route: string;
  /** HTTP method — POST / PUT / PATCH / DELETE. */
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  /** Resolved owner viewer (may be unknown on auth failure paths). */
  actor?: OwnerMutationActor | null;
  /** Optional correlation id for bulk grouping. */
  correlationId?: string | null;
};

export type OwnerMutationOutcome = "ok" | "denied" | "validation" | "conflict" | "server_error";

export type OwnerMutationResult = {
  /** HTTP-equivalent outcome — used for log + breadcrumb tagging. */
  outcome: OwnerMutationOutcome;
  /** Value returned to the route caller (typically a NextResponse). */
  value: NextResponse;
};

/**
 * Run an owner mutation body inside the observability wrapper.
 *
 * The wrapped body should return `{ outcome, value }`; the wrapper
 * logs + breadcrumbs accordingly and returns `value`. Thrown errors
 * are captured to Sentry and re-thrown so Next can render the 500.
 */
export async function withOwnerMutationContext(
  ctx: OwnerMutationContext,
  body: (log: Logger) => Promise<OwnerMutationResult>,
): Promise<NextResponse> {
  const startedAt = Date.now();
  const log = ownerLogger.child({
    route: ctx.route,
    method: ctx.method,
    actorId: ctx.actor?.id ?? null,
    actorRole: ctx.actor?.role ?? null,
    correlationId: ctx.correlationId ?? null,
  });

  Sentry.addBreadcrumb({
    category: "owner.mutation",
    level: "info",
    message: `${ctx.method} ${ctx.route}`,
    data: {
      actorId: ctx.actor?.id ?? null,
      actorRole: ctx.actor?.role ?? null,
      correlationId: ctx.correlationId ?? null,
    },
  });

  try {
    const result = await body(log);
    const durationMs = Date.now() - startedAt;

    if (result.outcome === "ok") {
      log.info("owner.mutation.ok", { durationMs });
    } else {
      log.warn(`owner.mutation.${result.outcome}`, { durationMs });
    }

    return result.value;
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    log.error("owner.mutation.exception", {
      durationMs,
      error: error instanceof Error ? error.message : String(error),
    });
    Sentry.captureException(error, {
      tags: {
        surface: "owner.mutation",
        route: ctx.route,
        method: ctx.method,
      },
      extra: {
        actorId: ctx.actor?.id ?? null,
        correlationId: ctx.correlationId ?? null,
      },
    });
    throw error;
  }
}

/**
 * Convenience: derive an OwnerMutationActor from the existing
 * `requireOwner` result so route bodies can pass `auth.user` directly.
 */
export function actorFromOwnerAuth(auth: {
  ok: true;
  user: { id: string; email?: string | null; role?: string | null };
}): OwnerMutationActor {
  return {
    id: auth.user.id,
    email: auth.user.email ?? null,
    role: auth.user.role ?? null,
  };
}
