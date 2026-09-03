import type {
  AwareChromePlan,
  AwareDivision,
  AwareStanding,
  AwareStandingKind,
  DivisionPlanTable,
} from "./types";

/**
 * The who-sees-what matrix, per division. Labels are EN source strings (apps
 * localize via translateSurfaceLabel); hrefs are division-local paths.
 *
 * Reading a row: what does a viewer of this standing get as (1) the one main
 * chrome action, (2) the ghost aside, (3) the account-dropdown workspace item,
 * (4) the recruit-surface CTA (/sell, /hire)?
 *
 * The matrix encodes the doctrine, so the doctrine is testable:
 *   - operators are never re-recruited (their recruit action IS their
 *     workspace);
 *   - applicants are pointed at status, never back at the form;
 *   - staff fall back to consumer chrome (internal tools are not chrome's
 *     job), never to operator chrome.
 */
const PLANS: Record<AwareDivision, DivisionPlanTable> = {
  marketplace: {
    visitor: {
      primaryCta: { label: "Start shopping", href: "/search" },
      aside: { label: "Sell on Henry Onyx", href: "/sell" },
      workspace: null,
      recruit: { label: "Open seller application", href: "/account/seller-application" },
    },
    customer: {
      primaryCta: { label: "Start shopping", href: "/search" },
      aside: { label: "Sell on Henry Onyx", href: "/sell" },
      workspace: null,
      recruit: { label: "Open seller application", href: "/account/seller-application" },
    },
    applicant: {
      primaryCta: { label: "Start shopping", href: "/search" },
      aside: { label: "Track your seller application", href: "/account/seller-application" },
      workspace: null,
      recruit: { label: "Track your seller application", href: "/account/seller-application" },
    },
    operator: {
      primaryCta: { label: "Your vendor workspace", href: "/vendor" },
      aside: { label: "Start shopping", href: "/search" },
      workspace: { label: "Your vendor workspace", href: "/vendor" },
      recruit: { label: "View your vendor workspace", href: "/vendor" },
    },
  },
  jobs: {
    visitor: {
      primaryCta: { label: "Browse open jobs", href: "/jobs" },
      aside: { label: "I'm hiring", href: "/hire" },
      workspace: null,
      recruit: { label: "Set up your employer profile", href: "/employer/company" },
    },
    customer: {
      primaryCta: { label: "Candidate hub", href: "/candidate" },
      aside: { label: "Saved jobs", href: "/candidate/saved-jobs" },
      workspace: { label: "Your candidate hub", href: "/candidate" },
      recruit: { label: "Set up your employer profile", href: "/employer/company" },
    },
    operator: {
      primaryCta: { label: "Your employer workspace", href: "/employer" },
      aside: { label: "Browse open jobs", href: "/jobs" },
      workspace: { label: "Your employer workspace", href: "/employer" },
      recruit: { label: "Open your employer workspace", href: "/employer" },
    },
  },
  learn: {
    visitor: {
      primaryCta: { label: "Explore courses", href: "/courses" },
      aside: { label: "Teach with Henry Onyx", href: "/teach" },
      workspace: null,
      recruit: { label: "Start application", href: "/teach" },
    },
    customer: {
      primaryCta: { label: "Explore courses", href: "/courses" },
      aside: { label: "Teach with Henry Onyx", href: "/teach" },
      workspace: null,
      recruit: { label: "Start application", href: "/teach" },
    },
    operator: {
      primaryCta: { label: "Your instructor console", href: "/instructor" },
      aside: { label: "Explore courses", href: "/courses" },
      workspace: { label: "Your instructor console", href: "/instructor" },
      recruit: { label: "Open your instructor console", href: "/instructor" },
    },
  },
  property: {
    visitor: {
      primaryCta: { label: "Browse listings", href: "/search" },
      aside: { label: "Submit a property", href: "/submit" },
      workspace: null,
      recruit: { label: "Submit a property", href: "/submit" },
    },
    customer: {
      primaryCta: { label: "Browse listings", href: "/search" },
      aside: { label: "Submit a property", href: "/submit" },
      workspace: null,
      recruit: { label: "Submit a property", href: "/submit" },
    },
    operator: {
      primaryCta: { label: "Your agent workspace", href: "/agent" },
      aside: { label: "Browse listings", href: "/search" },
      workspace: { label: "Your agent workspace", href: "/agent" },
      recruit: { label: "Open your agent workspace", href: "/agent" },
    },
  },
  studio: {
    visitor: {
      primaryCta: { label: "Start a project", href: "/request" },
      aside: { label: "Speak to Studio", href: "/contact" },
      workspace: null,
      recruit: { label: "Start a project", href: "/request" },
    },
    customer: {
      primaryCta: { label: "Start a project", href: "/request" },
      aside: { label: "Speak to Studio", href: "/contact" },
      workspace: null,
      recruit: { label: "Start a project", href: "/request" },
    },
    operator: {
      primaryCta: { label: "Your project console", href: "/pm" },
      aside: { label: "Start a project", href: "/request" },
      workspace: { label: "Your project console", href: "/pm" },
      recruit: { label: "Open your project console", href: "/pm" },
    },
  },
  logistics: {
    visitor: {
      primaryCta: { label: "Book a pickup", href: "/book" },
      aside: { label: "Get a quote", href: "/quote" },
      workspace: null,
      recruit: { label: "Book a pickup", href: "/book" },
    },
    customer: {
      primaryCta: { label: "Book a pickup", href: "/book" },
      aside: { label: "Get a quote", href: "/quote" },
      workspace: null,
      recruit: { label: "Book a pickup", href: "/book" },
    },
    operator: {
      primaryCta: { label: "Your dispatch console", href: "/dispatcher" },
      aside: { label: "Book a pickup", href: "/book" },
      workspace: { label: "Your dispatch console", href: "/dispatcher" },
      recruit: { label: "Open your dispatch console", href: "/dispatcher" },
    },
  },
};

/** Fallback chain for standings a division's table omits. Deliberately never
 *  falls back to `operator` — a missing row must degrade to consumer chrome,
 *  not to supply-side chrome. */
const FALLBACK: Record<AwareStandingKind, AwareStandingKind[]> = {
  visitor: ["visitor"],
  customer: ["customer"],
  applicant: ["applicant", "customer"],
  operator: ["operator"],
  staff: ["staff", "customer"],
};

/**
 * Resolve the chrome plan for one viewer on one division. Total: every
 * (division × standing) returns a plan (tested), so call sites never branch on
 * "no plan".
 */
export function resolveChromePlan(
  division: AwareDivision,
  standing: AwareStanding,
): AwareChromePlan {
  const table = PLANS[division];
  for (const kind of FALLBACK[standing.kind]) {
    const row = table[kind];
    if (row) return { standing, ...row };
  }
  // Unreachable by construction (visitor/customer/operator are required rows);
  // keep a hard consumer default so the type system never lies to callers.
  return { standing, ...table.customer };
}

/** The divisions the plan matrix currently covers. */
export const AWARE_DIVISIONS = Object.keys(PLANS) as AwareDivision[];

/** Internal — exposed for exhaustive table tests only. */
export const __PLAN_TABLES = PLANS;
