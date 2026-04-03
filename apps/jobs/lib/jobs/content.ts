import type { Differentiator } from "@/lib/jobs/types";

export const JOBS_STAGE_ORDER = [
  "applied",
  "reviewing",
  "shortlisted",
  "interview",
  "offer",
  "hired",
  "rejected",
] as const;

export const DEFAULT_PIPELINE = [...JOBS_STAGE_ORDER];

export const JOBS_DIFFERENTIATORS: Differentiator[] = [
  {
    id: "verified-talent-layer",
    title: "Verified Talent Layer",
    summary:
      "Candidate profiles gain visible trust signals only after readiness, identity, and work proof checks line up.",
    pros: [
      "Cuts resume noise before recruiters spend time",
      "Creates a premium badge candidates can actually earn",
    ],
    cons: [
      "Needs deliberate verification ops",
      "Adds friction for candidates with incomplete records",
    ],
    difficulty: "high",
    innovationScore: 9,
  },
  {
    id: "employer-trust-badges",
    title: "Employer Trust Badges",
    summary:
      "Company pages show verification maturity, response discipline, and posting quality instead of generic logos alone.",
    pros: [
      "Reduces fake-job anxiety for candidates",
      "Rewards employers that behave well over time",
    ],
    cons: [
      "Requires moderation follow-through",
      "Can surface unflattering gaps to weak employers",
    ],
    difficulty: "medium",
    innovationScore: 8,
  },
  {
    id: "candidate-readiness-score",
    title: "Candidate Readiness Score",
    summary:
      "Profiles translate messy completeness into a recruiter-readable readiness score with actionable gaps.",
    pros: [
      "Improves application quality before submission",
      "Gives candidates clear next steps instead of vague advice",
    ],
    cons: [
      "Scoring must stay interpretable",
      "Can be gamed if signals are too shallow",
    ],
    difficulty: "medium",
    innovationScore: 8,
  },
  {
    id: "recruiter-confidence-surface",
    title: "Recruiter Confidence Surface",
    summary:
      "Application cards surface confidence, verification, and moderation context in one calm triage layer.",
    pros: [
      "Speeds up shortlist decisions",
      "Keeps pipeline review from becoming stacked-card chaos",
    ],
    cons: [
      "Needs careful weighting",
      "Bad defaults can create false certainty",
    ],
    difficulty: "high",
    innovationScore: 9,
  },
  {
    id: "internal-external-dual-mode",
    title: "Internal and External Dual Mode",
    summary:
      "HenryCo internal hiring and external employer hiring coexist without forcing one compromise model onto both.",
    pros: [
      "Lets HenryCo recruit itself inside the same operating surface",
      "Avoids duplicating pipeline tooling",
    ],
    cons: [
      "Role boundaries need discipline",
      "Analytics segmentation matters more",
    ],
    difficulty: "high",
    innovationScore: 9,
  },
  {
    id: "application-quality-guidance",
    title: "Application Quality Guidance",
    summary:
      "The apply flow points out missing proof, weak summaries, and profile gaps before a candidate wastes a submission.",
    pros: [
      "Raises signal quality for employers",
      "Feels respectful rather than punitive",
    ],
    cons: [
      "Requires good copy",
      "Can feel slow if overdone",
    ],
    difficulty: "medium",
    innovationScore: 7,
  },
  {
    id: "curated-talent-spotlights",
    title: "Curated Talent Spotlights",
    summary:
      "High-readiness candidates can appear in curated discovery rails rather than being buried in search alone.",
    pros: [
      "Gives verified talent real upside",
      "Improves employer discovery quality",
    ],
    cons: [
      "Needs moderation to stay credible",
      "Can create fairness debates if rules are opaque",
    ],
    difficulty: "medium",
    innovationScore: 8,
  },
  {
    id: "anti-noise-moderation-intelligence",
    title: "Anti-Noise Moderation Intelligence",
    summary:
      "Post quality flags, trust events, and moderation history are visible to ops before low-signal listings spread.",
    pros: [
      "Stops clutter early",
      "Protects candidate trust",
    ],
    cons: [
      "Needs ops time",
      "False positives can slow legitimate employers",
    ],
    difficulty: "high",
    innovationScore: 8,
  },
  {
    id: "premium-employer-showcases",
    title: "Premium Employer Showcases",
    summary:
      "Employer pages sell culture, discipline, verification, and hiring intent instead of generic corporate filler.",
    pros: [
      "Improves conversion on strong employers",
      "Supports high-trust public SEO surfaces",
    ],
    cons: [
      "Needs good employer content",
      "Weak profiles become obvious",
    ],
    difficulty: "medium",
    innovationScore: 7,
  },
  {
    id: "message-and-audit-spine",
    title: "Message and Audit Spine",
    summary:
      "Applications, notifications, recruiter notes, trust events, and support context stay reconstructable for future account integration.",
    pros: [
      "Avoids backfill archaeology later",
      "Makes moderation and support defensible",
    ],
    cons: [
      "Needs disciplined metadata structure",
      "Can create verbose event trails",
    ],
    difficulty: "high",
    innovationScore: 9,
  },
];
