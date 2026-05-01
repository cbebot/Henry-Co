/**
 * Hiring rules — server-side guards and signal detectors that protect
 * both candidates and employers from common abuse patterns. Centralised
 * here so every entry point (job-create, application submit, message
 * send) calls into the same logic.
 */

const SCAM_KEYWORDS: ReadonlyArray<{ pattern: RegExp; flag: string }> = [
  { pattern: /\bmlm\b/i, flag: "mlm" },
  { pattern: /\bmulti[-\s]?level\s*marketing\b/i, flag: "mlm" },
  { pattern: /\bget[-\s]?rich[-\s]?quick\b/i, flag: "get_rich_quick" },
  { pattern: /\bguaranteed?\s+(income|return|profit)\b/i, flag: "guaranteed_income" },
  { pattern: /\bno\s+experience\s+needed\s+(very\s+)?high\s+pay\b/i, flag: "too_good_to_be_true" },
  { pattern: /\bpay\s+(a\s+)?fee\s+to\s+(apply|start|join)\b/i, flag: "pay_to_apply" },
  { pattern: /\bregistration\s+fee\b/i, flag: "registration_fee" },
  { pattern: /\bsend\s+\$?\d+\s+to\s+(start|apply|begin)\b/i, flag: "pay_to_start" },
  { pattern: /\binvest\s+\$?\d+/i, flag: "invest_to_earn" },
  { pattern: /\bcrypto\s+(opportunity|recruiter|trader)\b/i, flag: "crypto_recruit" },
  { pattern: /\bwork[-\s]?from[-\s]?home\b.*\$\d{3,}\s*(per\s+)?day/i, flag: "wfh_huge_pay" },
  { pattern: /\bclick\s+the\s+link\s+in\s+(my\s+)?bio\b/i, flag: "social_redirect" },
];

export type ScamSignal = {
  flag: string;
  excerpt: string;
};

/** Returns the list of scam signals found in a job's title + description. */
export function detectJobPostScamSignals(input: {
  title?: string | null;
  description?: string | null;
  responsibilities?: string | null;
  benefits?: string | null;
}): ScamSignal[] {
  const haystack = [
    input.title,
    input.description,
    input.responsibilities,
    input.benefits,
  ]
    .filter(Boolean)
    .join("\n");
  const found: ScamSignal[] = [];
  for (const rule of SCAM_KEYWORDS) {
    const match = haystack.match(rule.pattern);
    if (match && match[0]) {
      found.push({ flag: rule.flag, excerpt: match[0].slice(0, 80) });
    }
  }
  return found;
}

/** True when the candidate is the owner / a member of the employer that
 * posted the role. Blocks the trivial "self-apply" conflict of interest. */
export function isApplicantEmployerConflict(input: {
  candidateUserId: string;
  employerOwnerUserId?: string | null;
  employerTeamMemberUserIds?: string[];
}): boolean {
  if (!input.candidateUserId) return false;
  if (input.employerOwnerUserId && input.candidateUserId === input.employerOwnerUserId) {
    return true;
  }
  if (input.employerTeamMemberUserIds?.includes(input.candidateUserId)) {
    return true;
  }
  return false;
}

/** Per-day application cap to discourage spam-applying behaviour. The
 * candidate sees a friendly toast; recruiters see no signal. */
export const DAILY_APPLICATION_CAP = 25;

/** True when the candidate's application count for the given day exceeds
 * the cap. The caller passes `appliedTodayCount` from a count query. */
export function exceedsDailyApplicationCap(appliedTodayCount: number): boolean {
  return appliedTodayCount >= DAILY_APPLICATION_CAP;
}

/** Per-applicant-per-job — already enforced via duplicate-check in
 * write.ts but exposed here for client-side hints too. */
export function alreadyAppliedReason(): string {
  return "You've already applied to this role. Open Applications to track its progress.";
}

/** Friendly conflict-of-interest reason. Intentionally neutral — we
 * don't want to imply wrongdoing. */
export function conflictOfInterestReason(): string {
  return "This role belongs to a team you're a member of. Internal moves go through your HenryCo account, not the public application flow.";
}

/** Friendly daily-cap reason. */
export function dailyCapReason(): string {
  return `Applications are limited to ${DAILY_APPLICATION_CAP} per day to keep delivery quality high. Your remaining slots reset at midnight.`;
}
