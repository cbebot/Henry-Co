/**
 * V3-56 Learn-to-Earn — pure logic for the Jobs side of the bridge.
 *
 * No IO: course-gate evaluation, opt-in visibility, and invite selection are
 * pure so they can be unit-tested without a DB. The impure reads/writes live in
 * `learn-to-earn-data.ts`.
 */

export const LEARN_COMPLETION_SOURCE = "learn_completion" as const;

export type CourseGate = {
  course_id: string;
  course_slug?: string | null;
  course_label?: string | null;
  required: boolean;
};

export type CourseGateVerdict = {
  /** A required gate the candidate has NOT satisfied — blocks the application. */
  blockingGate: CourseGate | null;
  /** The candidate completed at least one preferred (soft) gate course. */
  preferred: boolean;
  /** Every required gate the candidate has not satisfied (for messaging). */
  unmetRequired: CourseGate[];
};

/**
 * Decide whether a candidate may apply to a gated job.
 *
 * - A `required` gate the candidate has NOT completed → hard block (the first
 *   such gate is the one surfaced in the "take this course" CTA).
 * - A `required` gate the candidate HAS completed → satisfied.
 * - A non-required (preferred) gate the candidate HAS completed → preferred.
 */
export function evaluateCourseGate(input: {
  gates: ReadonlyArray<CourseGate>;
  verifiedCourseIds: ReadonlySet<string>;
}): CourseGateVerdict {
  const unmetRequired: CourseGate[] = [];
  let preferred = false;

  for (const gate of input.gates) {
    const completed = input.verifiedCourseIds.has(gate.course_id);
    if (gate.required) {
      if (!completed) unmetRequired.push(gate);
    } else if (completed) {
      preferred = true;
    }
  }

  return {
    blockingGate: unmetRequired[0] ?? null,
    preferred,
    unmetRequired,
  };
}

export type OptinRecord = {
  user_id: string;
  course_id: string;
  visibility?: string | null;
  revoked_at?: string | null;
};

/** Consent rule: an opt-in exposes a completer to employers only when active. */
export function isOptinActive(optin: OptinRecord | null | undefined): boolean {
  if (!optin) return false;
  if (optin.revoked_at) return false;
  return (optin.visibility ?? "employers") === "employers";
}

/**
 * Choose which candidates a bulk-invite should actually write.
 *
 * Skips anyone already invited (idempotency) and anyone whose opt-in is not
 * active (never re-invite past an opt-out — NDPR/GDPR). Returns the user ids to
 * write plus the ones skipped, with the reason.
 */
export function selectInvitableCandidates(input: {
  candidateUserIds: ReadonlyArray<string>;
  alreadyInvited: ReadonlySet<string>;
  activeOptinUserIds: ReadonlySet<string>;
}): { invite: string[]; skippedInvited: string[]; skippedNoConsent: string[] } {
  const invite: string[] = [];
  const skippedInvited: string[] = [];
  const skippedNoConsent: string[] = [];
  const seen = new Set<string>();

  for (const userId of input.candidateUserIds) {
    if (seen.has(userId)) continue;
    seen.add(userId);
    if (!input.activeOptinUserIds.has(userId)) {
      skippedNoConsent.push(userId);
      continue;
    }
    if (input.alreadyInvited.has(userId)) {
      skippedInvited.push(userId);
      continue;
    }
    invite.push(userId);
  }

  return { invite, skippedInvited, skippedNoConsent };
}
