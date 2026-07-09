import type { AwareRoleVocab, AwareStanding } from "./types";

/**
 * Adapt a division's existing role array into the standing lattice.
 *
 * Precedence is fixed and total: staff > operator > applicant > customer >
 * visitor. A viewer who is both staff and vendor gets STAFF (internal chrome
 * beats supply-side chrome); an approved vendor who still carries the stale
 * applicant role gets OPERATOR (approval wins over the funnel).
 *
 * Pure and synchronous by design — apps already fetched their viewer; this is
 * the one place the role→standing mapping lives, so it is table-testable.
 */
export function standingFromRoles(
  opts: {
    signedIn: boolean;
    roles: readonly string[];
  },
  vocab: AwareRoleVocab,
): AwareStanding {
  if (!opts.signedIn) return { kind: "visitor" };

  const has = (list: readonly string[] | undefined) =>
    Boolean(list && list.some((role) => opts.roles.includes(role)));

  if (has(vocab.staffRoles)) return { kind: "staff" };
  if (has(vocab.operatorRoles)) return { kind: "operator", track: vocab.track };
  if (has(vocab.applicantRoles)) return { kind: "applicant", track: vocab.track };
  return { kind: "customer" };
}

/**
 * Marketplace role vocabulary — mirrors MarketplaceRole in
 * apps/marketplace/lib/marketplace/types.ts. `vendor` is only granted off an
 * ACTIVE marketplace_role_memberships row (is_active = true), so operator
 * standing here inherits that liveness guarantee.
 */
export const MARKETPLACE_ROLE_VOCAB: AwareRoleVocab = {
  track: "vendor",
  operatorRoles: ["vendor"],
  applicantRoles: ["vendor_applicant"],
  staffRoles: [
    "marketplace_owner",
    "marketplace_admin",
    "moderation",
    "support",
    "finance",
    "operations",
  ],
};

/**
 * Jobs role vocabulary — mirrors JobsRole in apps/jobs/lib/auth.ts. `employer`
 * is derived from live employer memberships (status != revoked); there is no
 * applicant state in the jobs role model today.
 */
export const JOBS_ROLE_VOCAB: AwareRoleVocab = {
  track: "employer",
  operatorRoles: ["employer", "recruiter"],
  staffRoles: ["admin", "owner", "moderator"],
};
