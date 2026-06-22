// V3-INNER-L-ELEVATE-JOBS — proof for the candidate-home editorial masthead model.
//
// The candidate dashboard's above-the-fold answer (Q1 "what's happening with my
// search?" + Q2 "what next?") is derived from pure functions so the page body
// stays a thin compose and the state->copy contract is testable. Copy flows
// through an injected translator (the page passes translateSurfaceLabel) so
// these tests run with an identity translator and assert structure, not prose.
// The module imports ONLY types, so it runs under bare `tsx --test` with no
// server-only / auth / Supabase.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type {
  ApplicationJourney,
  CandidateProfile,
  JobApplication,
  JobRecommendation,
  ProfileChecklistItem,
  RecruiterActivity,
  SavedJob,
} from "../types";
import {
  candidateDashboardStats,
  candidateHomeState,
  buildCandidateHero,
  buildCandidateNextStep,
  type CandidateHomeInput,
} from "../candidate-home";

const identity = (s: string) => s;
let seq = 0;

function journey(stage: string, extra: Partial<JobApplication> = {}): ApplicationJourney {
  return {
    application: {
      applicationId: `app-${stage}-${seq++}`,
      jobTitle: "Senior Engineer",
      employerName: "Acme Studios",
      jobSlug: "senior-engineer",
      stage,
      ...extra,
    } as JobApplication,
  } as unknown as ApplicationJourney;
}

function profile(trustScore: number, extra: Partial<CandidateProfile> = {}): CandidateProfile {
  return {
    trustScore,
    completionScore: trustScore,
    verificationStatus: "verified",
    readinessLabel: "Interview-ready",
    ...extra,
  } as CandidateProfile;
}

function savedJob(title: string, slug: string): SavedJob {
  return { id: `s-${seq++}`, createdAt: "", job: { title, slug, employerName: "Acme" } } as unknown as SavedJob;
}

function checklistItem(complete: boolean, extra: Partial<ProfileChecklistItem> = {}): ProfileChecklistItem {
  return { id: `c-${seq++}`, label: "Add work history", detail: "", complete, href: "/candidate/profile", ...extra };
}

function recruiter(): RecruiterActivity {
  return {
    id: `r-${seq++}`,
    title: "An employer viewed your profile",
    body: "",
    createdAt: "",
    href: "/candidate/applications",
    tone: "good",
    source: "notification",
  };
}

function recommendation(): JobRecommendation {
  return { job: { slug: "role", title: "Role" } as JobRecommendation["job"], score: 80, reason: "" };
}

function input(partial: Partial<CandidateHomeInput> = {}): CandidateHomeInput {
  return {
    profile: profile(72),
    applicationJourneys: [],
    savedJobs: [],
    recommendedJobs: [],
    recruiterFeed: [],
    profileChecklist: [],
    ...partial,
  };
}

describe("candidateDashboardStats", () => {
  it("counts the applied lane, the in-room lane, active applications, saved, recruiter signals, and readiness", () => {
    const stats = candidateDashboardStats(
      input({
        applicationJourneys: [
          journey("applied"),
          journey("reviewing"),
          journey("shortlisted"),
          journey("interview"),
          journey("offer"),
          journey("hired"),
          journey("rejected"),
        ],
        savedJobs: [savedJob("Designer", "designer"), savedJob("PM", "pm")],
        recommendedJobs: [recommendation()],
        recruiterFeed: [recruiter(), recruiter(), recruiter()],
        profileChecklist: [checklistItem(true), checklistItem(false)],
        profile: profile(72),
      }),
    );

    assert.equal(stats.totalApplications, 7);
    assert.equal(stats.appliedLane, 2); // applied + reviewing
    assert.equal(stats.shortlisted, 1);
    assert.equal(stats.interviews, 1);
    assert.equal(stats.offers, 1);
    assert.equal(stats.inTheRoom, 3); // shortlisted + interview + offer
    assert.equal(stats.activeApplications, 5); // 7 - hired - rejected
    assert.equal(stats.savedRoles, 2);
    assert.equal(stats.recruiterSignals, 3);
    assert.equal(stats.readiness, 72);
    assert.equal(stats.profileGap, false);
    assert.equal(stats.incompleteChecklist, 1);
    assert.equal(stats.needsAction, 3);
  });

  it("flags a profile gap when readiness is under 45", () => {
    const stats = candidateDashboardStats(input({ profile: profile(30), applicationJourneys: [journey("applied")] }));
    assert.equal(stats.profileGap, true);
  });
});

describe("candidateHomeState", () => {
  it("is empty only when there are no applications and nothing saved", () => {
    assert.equal(candidateHomeState(candidateDashboardStats(input({ profile: null }))), "empty");
    assert.equal(
      candidateHomeState(candidateDashboardStats(input({ savedJobs: [savedJob("X", "x")] }))),
      "calm",
    );
  });

  it("is attention when a role is in the room (shortlist / interview / offer)", () => {
    assert.equal(
      candidateHomeState(candidateDashboardStats(input({ applicationJourneys: [journey("offer")] }))),
      "attention",
    );
  });

  it("is attention when the profile is weak and there are live applications", () => {
    const stats = candidateDashboardStats(input({ profile: profile(30), applicationJourneys: [journey("applied")] }));
    assert.equal(candidateHomeState(stats), "attention");
  });

  it("is active when applications are in motion with a strong profile and nothing in the room", () => {
    const stats = candidateDashboardStats(input({ profile: profile(80), applicationJourneys: [journey("applied")] }));
    assert.equal(candidateHomeState(stats), "active");
  });

  it("attention outranks active", () => {
    const stats = candidateDashboardStats(
      input({ profile: profile(80), applicationJourneys: [journey("applied"), journey("interview")] }),
    );
    assert.equal(candidateHomeState(stats), "attention");
  });
});

describe("buildCandidateHero", () => {
  it("makes every tile an interactive deep-link to its pre-filtered destination", () => {
    const stats = candidateDashboardStats(input({ applicationJourneys: [journey("applied")] }));
    const hero = buildCandidateHero(stats, identity);
    assert.ok(hero.tiles.every((tile) => typeof tile.href === "string" && tile.href!.length > 0));
    const [live, room, saved, recruiter] = hero.tiles;
    assert.match(live.href!, /\/candidate\/applications\?lane=active/);
    assert.match(room.href!, /\/candidate\/applications\?lane=room/);
    assert.match(saved.href!, /\/candidate\/saved-jobs/);
    assert.match(recruiter.href!, /\/candidate\/applications/);
  });

  it("mirrors the page state as tone, renders four tiles + a readiness progress strip + a primary CTA", () => {
    const stats = candidateDashboardStats(input({ profile: profile(64), applicationJourneys: [journey("applied")] }));
    const hero = buildCandidateHero(stats, identity);
    assert.equal(hero.tone, "active");
    assert.equal(hero.tiles.length, 4);
    assert.ok(hero.ctaPrimary && typeof hero.ctaPrimary.href === "string");
    assert.ok(hero.progress);
    assert.equal(hero.progress!.percent, 64);
  });

  it("counts the in-room roles into the attention headline", () => {
    const stats = candidateDashboardStats(
      input({ applicationJourneys: [journey("interview"), journey("offer")] }),
    );
    const hero = buildCandidateHero(stats, identity);
    assert.equal(hero.tone, "attention");
    assert.match(hero.headline, /2/);
  });

  it("points the empty-state primary CTA at the job board", () => {
    const hero = buildCandidateHero(candidateDashboardStats(input({ profile: null })), identity);
    assert.equal(hero.tone, "empty");
    assert.match(hero.ctaPrimary!.href, /jobs/);
  });

  it("renders a paired pipeline side breakdown, filtered to count>0 with CSS-variable dot colors", () => {
    const stats = candidateDashboardStats(
      input({ applicationJourneys: [journey("applied"), journey("interview"), journey("offer")] }),
    );
    const hero = buildCandidateHero(stats, identity);
    const rows = hero.side.breakdown?.rows ?? [];
    assert.ok(rows.length > 0);
    assert.ok(rows.every((r) => r.count > 0));
    for (const row of rows) assert.match(row.color, /^var\(--/);
  });
});

describe("buildCandidateNextStep", () => {
  it("returns null when there is nothing pending (calm/empty carry Q2 via the hero CTA)", () => {
    assert.equal(buildCandidateNextStep(input({ profile: null }), candidateDashboardStats(input({ profile: null })), identity), null);
    const active = input({ profile: profile(80), applicationJourneys: [journey("applied")] });
    assert.equal(buildCandidateNextStep(active, candidateDashboardStats(active), identity), null);
  });

  it("surfaces an offer first, as a success tone, naming the role", () => {
    const data = input({ applicationJourneys: [journey("offer", { jobTitle: "Staff Designer" })] });
    const step = buildCandidateNextStep(data, candidateDashboardStats(data), identity);
    assert.ok(step);
    assert.equal(step!.tone, "success");
    assert.equal(step!.iconKey, "offer");
    assert.match(step!.title, /Staff Designer/);
    assert.match(step!.cta.href, /applications/);
  });

  it("ranks offer > interview > shortlist > profile-gap > saved-apply", () => {
    const all = input({
      applicationJourneys: [journey("offer"), journey("interview"), journey("shortlisted")],
    });
    assert.equal(buildCandidateNextStep(all, candidateDashboardStats(all), identity)!.iconKey, "offer");

    const interview = input({ applicationJourneys: [journey("interview"), journey("shortlisted")] });
    assert.equal(buildCandidateNextStep(interview, candidateDashboardStats(interview), identity)!.iconKey, "interview");

    const short = input({ applicationJourneys: [journey("shortlisted")] });
    assert.equal(buildCandidateNextStep(short, candidateDashboardStats(short), identity)!.iconKey, "shortlist");

    const gap = input({ profile: profile(30), applicationJourneys: [journey("applied")], profileChecklist: [checklistItem(false)] });
    assert.equal(buildCandidateNextStep(gap, candidateDashboardStats(gap), identity)!.iconKey, "profile");

    const saved = input({ savedJobs: [savedJob("Brand Lead", "brand-lead")] });
    const savedStep = buildCandidateNextStep(saved, candidateDashboardStats(saved), identity);
    assert.equal(savedStep!.iconKey, "apply");
    assert.match(savedStep!.title, /Brand Lead/);
  });
});
