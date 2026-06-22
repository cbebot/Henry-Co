// V3-INNER-L-ELEVATE-JOBS — the candidate-home editorial masthead model ("The
// Candidate Ledger").
//
// Pure derivation of the candidate dashboard's above-the-fold answer:
//   Q1 "what's happening with my search?" -> the HeroCard tiles + pipeline side
//   Q2 "what should I do next?"           -> the hero CTA + one NextStepRow
//
// Keeping this logic out of the page body means the state->copy contract is
// testable (see __tests__/candidate-home.test.ts) and the page stays a thin
// compose. All user-visible copy flows through an injected translator `t` (the
// page passes `(s) => translateSurfaceLabel(locale, s)`), so this module holds
// zero JSX and zero hardcoded surface strings — the strict i18n gate never sees
// a literal here, and no shared @henryco/i18n key is added. The module imports
// ONLY types, so it runs under bare `tsx --test` (no server-only / auth / DB).

import type {
  ApplicationJourney,
  CandidateProfile,
  JobRecommendation,
  ProfileChecklistItem,
  RecruiterActivity,
  SavedJob,
} from "./types";

export type CandidateHomeInput = {
  profile: CandidateProfile | null;
  applicationJourneys: ApplicationJourney[];
  savedJobs: SavedJob[];
  recommendedJobs: JobRecommendation[];
  recruiterFeed: RecruiterActivity[];
  profileChecklist: ProfileChecklistItem[];
};

export type CandidateHomeState = "empty" | "calm" | "active" | "attention";
export type Translate = (value: string) => string;

export type CandidateStats = {
  totalApplications: number;
  /** In-flight applications (anything not closed out: rejected / hired / declined). */
  activeApplications: number;
  /** Early lane — applied / new / reviewing / screening / in_review. */
  appliedLane: number;
  shortlisted: number;
  interviews: number;
  offers: number;
  /** The "you're being considered" lane: shortlisted + interview + offer. */
  inTheRoom: number;
  savedRoles: number;
  recommended: number;
  recruiterSignals: number;
  /** Profile readiness (trustScore), 0-100. */
  readiness: number;
  /** Readiness below the "competitive" floor. */
  profileGap: boolean;
  incompleteChecklist: number;
  /** Roles in the hiring room — drives the attention headline count. */
  needsAction: number;
};

// ── Stage sets ────────────────────────────────────────────────────────────
const APPLIED_LANE = new Set(["applied", "new", "reviewing", "screening", "in_review"]);
const CLOSED = new Set(["rejected", "hired", "declined", "withdrawn"]);
const READINESS_FLOOR = 45;

function stageOf(journey: ApplicationJourney): string {
  return journey.application?.stage ?? "";
}

export function candidateDashboardStats(input: CandidateHomeInput): CandidateStats {
  const journeys = input.applicationJourneys ?? [];
  const countStage = (predicate: (stage: string) => boolean) =>
    journeys.reduce((n, j) => (predicate(stageOf(j)) ? n + 1 : n), 0);

  const shortlisted = countStage((s) => s === "shortlisted");
  const interviews = countStage((s) => s === "interview");
  const offers = countStage((s) => s === "offer");
  const inTheRoom = shortlisted + interviews + offers;
  const readiness = input.profile?.trustScore ?? 0;

  return {
    totalApplications: journeys.length,
    activeApplications: countStage((s) => !CLOSED.has(s)),
    appliedLane: countStage((s) => APPLIED_LANE.has(s)),
    shortlisted,
    interviews,
    offers,
    inTheRoom,
    savedRoles: (input.savedJobs ?? []).length,
    recommended: (input.recommendedJobs ?? []).length,
    recruiterSignals: (input.recruiterFeed ?? []).length,
    readiness,
    profileGap: readiness < READINESS_FLOOR,
    incompleteChecklist: (input.profileChecklist ?? []).filter((c) => !c.complete).length,
    needsAction: inTheRoom,
  };
}

export function candidateHomeState(stats: CandidateStats): CandidateHomeState {
  if (stats.totalApplications === 0 && stats.savedRoles === 0) return "empty";
  if (stats.inTheRoom > 0 || (stats.profileGap && stats.totalApplications > 0)) return "attention";
  if (stats.activeApplications > 0) return "active";
  return "calm";
}

// ── Hero model ────────────────────────────────────────────────────────────
export type CandidateHeroTile = {
  label: string;
  value: string | number;
  foot?: string | null;
  tone?: "default" | "accent" | "active" | "warning";
};

export type CandidateHeroBreakdownRow = { label: string; count: number; color: string };

export type CandidateHeroModel = {
  tone: CandidateHomeState;
  eyebrow: string;
  headline: string;
  blurb: string;
  ariaLabel: string;
  ariaTilesLabel: string;
  ctaPrimary: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
  tiles: CandidateHeroTile[];
  progress?: { percent: number; label: string };
  side: {
    kicker: string;
    title: string;
    body: string;
    breakdown?: { label: string; ariaLabel: string; rows: CandidateHeroBreakdownRow[] };
  };
};

const PROFILE_HREF = "/candidate/profile";
const APPLICATIONS_HREF = "/candidate/applications";
const BOARD_HREF = "/jobs";

export function buildCandidateHero(stats: CandidateStats, t: Translate): CandidateHeroModel {
  const tone = candidateHomeState(stats);

  let eyebrowState: string;
  let headline: string;
  let blurb: string;
  let ctaPrimary: { label: string; href: string };

  if (tone === "empty") {
    eyebrowState = t("start here");
    headline = t("Your next role starts here");
    blurb = t("Track every role you apply to, see who's reviewing you, and keep your profile ready for what's next — on one record.");
    ctaPrimary = { label: t("Browse open roles"), href: BOARD_HREF };
  } else if (tone === "attention") {
    if (stats.inTheRoom > 0) {
      eyebrowState = t("needs you");
      headline = `${stats.inTheRoom} ${t(stats.inTheRoom === 1 ? "role in the room" : "roles in the room")}`;
      blurb = t("Employers are considering you. Stay ready and keep the conversation moving.");
      ctaPrimary = { label: t("See where you stand"), href: APPLICATIONS_HREF };
    } else {
      eyebrowState = t("needs you");
      headline = t("Lift your profile to compete");
      blurb = t("A stronger profile gets you in front of more employers. A few additions go a long way.");
      ctaPrimary = { label: t("Strengthen your profile"), href: PROFILE_HREF };
    }
  } else if (tone === "active") {
    eyebrowState = t("in motion");
    headline = `${stats.activeApplications} ${t(stats.activeApplications === 1 ? "application in motion" : "applications in motion")}`;
    blurb = t("Your applications are live. We're tracking every one from review to decision.");
    ctaPrimary = { label: t("Track your applications"), href: APPLICATIONS_HREF };
  } else {
    eyebrowState = t("your search");
    if (stats.totalApplications > 0) {
      headline = `${stats.totalApplications} ${t(stats.totalApplications === 1 ? "application on record" : "applications on record")}`;
      blurb = t("Your whole search on one record. Pick up where you left off.");
      ctaPrimary = { label: t("Track your applications"), href: APPLICATIONS_HREF };
    } else {
      headline = t("Your shortlist is ready when you are");
      blurb = t("You've saved roles worth a closer look. Turn one into an application.");
      ctaPrimary = { label: t("Browse open roles"), href: BOARD_HREF };
    }
  }

  const ctaSecondary =
    ctaPrimary.href === PROFILE_HREF
      ? { label: t("Track applications"), href: APPLICATIONS_HREF }
      : { label: t("Improve your profile"), href: PROFILE_HREF };

  const tiles: CandidateHeroTile[] = [
    {
      label: t("Live applications"),
      value: stats.activeApplications,
      foot: stats.activeApplications > 0 ? t("In play right now") : t("Apply to get started"),
      tone: stats.activeApplications > 0 ? "active" : "default",
    },
    {
      label: t("In the room"),
      value: stats.inTheRoom,
      foot:
        stats.offers > 0
          ? t("An offer is waiting")
          : stats.inTheRoom > 0
            ? t("Shortlists & interviews")
            : t("Shortlists land here"),
      tone: stats.offers > 0 ? "warning" : stats.inTheRoom > 0 ? "accent" : "default",
    },
    {
      label: t("Saved roles"),
      value: stats.savedRoles,
      foot: stats.savedRoles > 0 ? t("Ready when you are") : t("Bookmark roles to compare"),
    },
    {
      label: t("Recruiter signals"),
      value: stats.recruiterSignals,
      foot: stats.recruiterSignals > 0 ? t("Employers engaging with you") : t("None yet — keep applying"),
      tone: stats.recruiterSignals > 0 ? "active" : "default",
    },
  ];

  const breakdownRows: CandidateHeroBreakdownRow[] = [
    { label: t("Applied"), count: stats.appliedLane, color: "var(--acct-blue)" },
    { label: t("Shortlisted"), count: stats.shortlisted, color: "var(--acct-orange)" },
    { label: t("Interviewing"), count: stats.interviews, color: "var(--acct-gold-strong)" },
    { label: t("Offers"), count: stats.offers, color: "var(--acct-green)" },
    { label: t("Saved"), count: stats.savedRoles, color: "var(--acct-gold)" },
  ].filter((row) => row.count > 0);

  return {
    tone,
    eyebrow: `${t("Jobs")} · ${eyebrowState}`,
    headline,
    blurb,
    ariaLabel: t("Candidate overview"),
    ariaTilesLabel: t("Search snapshot"),
    ctaPrimary,
    ctaSecondary,
    tiles,
    progress: { percent: stats.readiness, label: `${t("Profile readiness")} · ${stats.readiness}%` },
    side: {
      kicker: t("Your pipeline"),
      title: t("From applied to offer"),
      body: t("Every role you're in, tracked from application to offer on one record."),
      breakdown:
        breakdownRows.length > 0
          ? { label: t("Right now"), ariaLabel: t("Pipeline breakdown"), rows: breakdownRows }
          : undefined,
    },
  };
}

// ── Next-step model ─────────────────────────────────────────────────────────
export type CandidateNextStepModel = {
  tone: "neutral" | "attention" | "success";
  kicker: string;
  title: string;
  detail?: string;
  cta: { label: string; href: string };
  iconKey: "offer" | "interview" | "shortlist" | "profile" | "apply" | "recruiter";
};

function firstAtStage(journeys: ApplicationJourney[], stage: string): ApplicationJourney | undefined {
  return journeys.find((j) => stageOf(j) === stage);
}

export function buildCandidateNextStep(
  input: CandidateHomeInput,
  stats: CandidateStats,
  t: Translate,
): CandidateNextStepModel | null {
  const journeys = input.applicationJourneys ?? [];

  const offer = firstAtStage(journeys, "offer");
  if (offer) {
    return {
      tone: "success",
      kicker: t("Next step · offer"),
      title: `${t("Review your offer")} · ${offer.application.jobTitle}`.trim(),
      detail: t("An employer has made you an offer. Review the details and respond."),
      cta: { label: t("Review your offer"), href: APPLICATIONS_HREF },
      iconKey: "offer",
    };
  }

  const interview = firstAtStage(journeys, "interview");
  if (interview) {
    return {
      tone: "attention",
      kicker: t("Next step · interview"),
      title: `${t("Prepare for your interview")} · ${interview.application.jobTitle}`.trim(),
      detail: t("You've reached the interview stage. Prepare, and confirm the details."),
      cta: { label: t("Prepare"), href: APPLICATIONS_HREF },
      iconKey: "interview",
    };
  }

  const shortlist = firstAtStage(journeys, "shortlisted");
  if (shortlist) {
    return {
      tone: "attention",
      kicker: t("Next step · shortlist"),
      title: `${t("You're shortlisted")} · ${shortlist.application.jobTitle}`.trim(),
      detail: t("An employer has shortlisted you. Keep your profile sharp and be ready to talk."),
      cta: { label: t("Be ready"), href: APPLICATIONS_HREF },
      iconKey: "shortlist",
    };
  }

  if (stats.profileGap && stats.totalApplications > 0) {
    const firstIncomplete = (input.profileChecklist ?? []).find((c) => !c.complete);
    return {
      tone: "attention",
      kicker: t("Next step · profile"),
      title: firstIncomplete ? `${t("Finish your profile")} · ${firstIncomplete.label}`.trim() : t("Finish your profile"),
      detail: t("A stronger profile puts you in front of more employers."),
      cta: { label: t("Strengthen profile"), href: firstIncomplete?.href || PROFILE_HREF },
      iconKey: "profile",
    };
  }

  if (stats.totalApplications === 0 && stats.savedRoles > 0) {
    const saved = input.savedJobs[0];
    return {
      tone: "neutral",
      kicker: t("Next step · apply"),
      title: `${t("Apply to a saved role")} · ${saved.job.title}`.trim(),
      detail: t("You've saved roles worth a closer look. Turn one into an application."),
      cta: { label: t("Apply now"), href: `/jobs/${saved.job.slug}` },
      iconKey: "apply",
    };
  }

  if (stats.recruiterSignals > 0) {
    return {
      tone: "neutral",
      kicker: t("Next step · activity"),
      title: t("See who's looking at you"),
      detail: t("Employers are engaging with your profile. See what they're doing."),
      cta: { label: t("View activity"), href: APPLICATIONS_HREF },
      iconKey: "recruiter",
    };
  }

  return null;
}
