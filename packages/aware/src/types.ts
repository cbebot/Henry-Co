/**
 * @henryco/aware — the ecosystem's viewer-relationship engine (SP1).
 *
 * One question, answered the same way on every surface: WHAT IS THIS VIEWER TO
 * THIS DIVISION — and therefore what belongs in the chrome? The package owns
 * only the POLICY (a tested who-sees-what matrix); apps keep owning identity
 * I/O (they already fetch their viewer) and localization (labels returned here
 * are EN source strings the app runs through its `translateSurfaceLabel` path).
 *
 * Spec: docs/superpowers/specs/2026-07-09-aware-layer-sp1-design.md
 */

/** Divisions the plan tables cover. Extend as division PRs adopt the layer. */
export type AwareDivision =
  | "marketplace"
  | "jobs"
  | "learn"
  | "property"
  | "studio"
  | "logistics";

/** Supply-side tracks a person can hold within a division. `care` + `hub` are
 *  intentionally absent from AwareDivision: their public chrome is not
 *  role-differentiated (everyone books / explores) and their operators use
 *  cross-domain staff/owner surfaces, so an in-chrome operator flip would be
 *  dishonest. */
export type AwareOperatorTrack =
  | "vendor"
  | "employer"
  | "instructor"
  | "agent"
  | "team"
  | "ops";

/**
 * The standing lattice. Precedence (enforced by `standingFromRoles` and
 * assumed by every plan table): staff > operator > applicant > customer >
 * visitor. `applicant` is an operator application in review — those viewers
 * are pointed at their application STATUS, never back at the form.
 */
export type AwareStanding =
  | { kind: "visitor" }
  | { kind: "customer" }
  | { kind: "applicant"; track: AwareOperatorTrack }
  | { kind: "operator"; track: AwareOperatorTrack }
  | { kind: "staff" };

export type AwareStandingKind = AwareStanding["kind"];

/**
 * A chrome action: EN source label + DIVISION-LOCAL href ("/vendor").
 * Cross-app URLs (auth, shared account) are deliberately out of scope — the
 * chrome identity cluster already owns Sign in / Get started, and apps build
 * shared-account URLs with return paths the policy layer cannot know.
 */
export type AwareAction = {
  label: string;
  href: string;
};

/** The resolved chrome plan for one viewer on one division. */
export type AwareChromePlan = {
  standing: AwareStanding;
  /** The one main chrome action (PublicChrome `primaryCta`). */
  primaryCta: AwareAction;
  /** Secondary/ghost chrome action (PublicChrome `auxLink`); null = none. */
  aside: AwareAction | null;
  /**
   * Account-dropdown workspace destination + label ("Your vendor workspace").
   * null = keep the dropdown's cross-division default (account dashboard).
   */
  workspace: AwareAction | null;
  /**
   * The division's recruit surface CTA (marketplace /sell hero, jobs /hire).
   * For operators this MUST point at their workspace — never back at the
   * application funnel (invariant #1, tested).
   */
  recruit: AwareAction;
};

/** A division's who-sees-what matrix. `applicant`/`staff` may be omitted —
 *  the resolver falls back to `customer` (never to `operator`). */
export type DivisionPlanTable = {
  visitor: Omit<AwareChromePlan, "standing">;
  customer: Omit<AwareChromePlan, "standing">;
  operator: Omit<AwareChromePlan, "standing">;
  applicant?: Omit<AwareChromePlan, "standing">;
  staff?: Omit<AwareChromePlan, "standing">;
};

/**
 * A division's role vocabulary — how its existing viewer roles map onto the
 * standing lattice. Declared per division as a typed constant so the mapping
 * is data, reviewable and testable, not scattered conditionals.
 */
export type AwareRoleVocab = {
  track: AwareOperatorTrack;
  /** Roles that mean approved supply-side standing (e.g. ["vendor"]). */
  operatorRoles: readonly string[];
  /** Roles that mean an operator application in review. */
  applicantRoles?: readonly string[];
  /** Roles that mean division staff/admin (internal chrome, not recruited). */
  staffRoles?: readonly string[];
};
