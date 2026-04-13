import type {
  CandidateDocument,
  CandidateProfile,
  EmployerProfile,
  JobPost,
  TrustPassport,
  TrustRiskBand,
  TrustSignal,
} from "@/lib/jobs/types";

type TrustTone = TrustSignal["tone"];

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function list(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => text(item)).filter(Boolean)
    : [];
}

function dedupe(values: Array<string | null | undefined>) {
  return [...new Set(values.map((item) => text(item)).filter(Boolean))];
}

function riskBand(score: number, severeFlags: number): TrustRiskBand {
  if (severeFlags >= 2 || score < 55) return "elevated";
  if (severeFlags >= 1 || score < 75) return "moderate";
  return "low";
}

function passportLabel(input: {
  score: number;
  riskBand: TrustRiskBand;
  verified?: boolean;
  approved?: boolean;
}) {
  if (input.riskBand === "elevated") return "High-review lane";
  if (input.verified && input.score >= 85) return "High-confidence";
  if (input.approved && input.score >= 80) return "Production-ready";
  if (input.score >= 72) return "Operationally strong";
  return "Needs proof";
}

function signal(
  id: string,
  label: string,
  value: string,
  detail: string,
  tone: TrustTone,
  ownerImpact: string
): TrustSignal {
  return { id, label, value, detail, tone, ownerImpact };
}

function ratioLabel(value: number, suffix = "%") {
  return `${clamp(value)}${suffix}`;
}

function buildSummary(label: string, subject: string, strengths: string[], warnings: string[]) {
  const strength = strengths[0];
  const warning = warnings[0];

  if (strength && warning) {
    return `${subject} is ${label.toLowerCase()}: ${strength.toLowerCase()}, but ${warning.toLowerCase()}.`;
  }

  if (strength) {
    return `${subject} is ${label.toLowerCase()} because ${strength.toLowerCase()}.`;
  }

  if (warning) {
    return `${subject} needs review because ${warning.toLowerCase()}.`;
  }

  return `${subject} has limited trust evidence and should stay in a reviewed lane.`;
}

function buildNextSteps(strategies: Array<[boolean, string]>, fallback: string) {
  const next = strategies.filter(([enabled]) => enabled).map(([, body]) => body);
  return next.length > 0 ? next.slice(0, 4) : [fallback];
}

export function buildCandidateTrustPassport(input: {
  completionScore: number;
  verificationStatus: CandidateProfile["verificationStatus"];
  documents: CandidateDocument[];
  profile: Record<string, unknown>;
  securityEvents?: Array<Record<string, unknown>>;
  applications?: Array<Record<string, unknown>>;
}): TrustPassport {
  const documents = input.documents ?? [];
  const securityEvents = input.securityEvents ?? [];
  const applications = input.applications ?? [];
  const hasResume = documents.some((document) => document.kind === "resume");
  const hasPortfolio =
    documents.some((document) => document.kind === "portfolio") ||
    list(input.profile.portfolioLinks).length > 0;
  const hasCertification = documents.some((document) => document.kind === "certification");
  const workHistoryCount = Array.isArray(input.profile.workHistory) ? input.profile.workHistory.length : 0;
  const skillCount = list(input.profile.skills).length;
  const seriousRiskEvents = securityEvents.filter((event) => {
    const riskLevel = text(event.risk_level).toLowerCase();
    const eventType = text(event.event_type).toLowerCase();
    return riskLevel === "high" || riskLevel === "medium" || eventType.includes("off_platform");
  });
  const shortlistCount = applications.filter((row) => {
    const metadata = row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : {};
    const stage = text(metadata.stage || row.status).toLowerCase();
    return ["shortlisted", "interview", "offer", "hired"].includes(stage);
  }).length;

  const identityScore =
    input.verificationStatus === "verified"
      ? 100
      : input.verificationStatus === "ready"
        ? 74
        : 38;
  const proofScore =
    (hasResume ? 34 : 0) +
    (hasPortfolio ? 24 : 0) +
    (hasCertification ? 16 : 0) +
    Math.min(26, workHistoryCount * 13);
  const processScore =
    shortlistCount > 0 ? 80 : applications.length > 0 ? 64 : 50;
  const riskPenalty = seriousRiskEvents.length * 12;
  const score = clamp(
    input.completionScore * 0.38 +
      identityScore * 0.22 +
      proofScore * 0.22 +
      processScore * 0.18 -
      riskPenalty
  );
  const severeFlags = seriousRiskEvents.filter((event) => text(event.risk_level).toLowerCase() === "high").length;
  const band = riskBand(score, severeFlags);

  const strengths = dedupe([
    hasResume ? "Resume proof is on file" : null,
    hasPortfolio ? "Portfolio proof is linked" : null,
    input.verificationStatus === "verified" ? "Identity and account signals are verified" : null,
    skillCount >= 6 ? "Skill coverage is specific enough for recruiter routing" : null,
    shortlistCount > 0 ? "Prior hiring cycles progressed beyond initial review" : null,
  ]);
  const warnings = dedupe([
    !hasResume ? "Resume proof is still missing" : null,
    !hasPortfolio ? "Portfolio or work proof is still thin" : null,
    workHistoryCount === 0 ? "Work history is empty" : null,
    skillCount < 4 ? "Skills are too sparse for confident matching" : null,
    seriousRiskEvents.length > 0 ? "Risk events are attached to this profile" : null,
  ]);
  const suspiciousFlags = dedupe(
    seriousRiskEvents.map((event) => text(event.event_type) || "Security event under review")
  );

  const signals: TrustSignal[] = [
    signal(
      "identity",
      "Identity",
      input.verificationStatus === "verified" ? "Verified" : input.verificationStatus === "ready" ? "Ready" : "Unverified",
      "Identity does not come from client claims alone; shared-account verification and profile state drive this signal.",
      input.verificationStatus === "verified" ? "good" : input.verificationStatus === "ready" ? "warn" : "danger",
      "Verification gates the level of recruiter trust and the speed of escalation review."
    ),
    signal(
      "completion",
      "Profile completeness",
      ratioLabel(input.completionScore),
      "Headline, summary, location, skills, work history, and resume all contribute to profile seriousness.",
      input.completionScore >= 80 ? "good" : input.completionScore >= 60 ? "warn" : "danger",
      "Thin profiles stay in slower recruiter review lanes because they are easier to game."
    ),
    signal(
      "proof",
      "Proof package",
      `${[hasResume, hasPortfolio, hasCertification].filter(Boolean).length}/3`,
      "Resume, portfolio proof, and certifications help recruiters validate that the story matches the claim.",
      hasResume && hasPortfolio ? "good" : hasResume || hasPortfolio ? "warn" : "danger",
      "Proof reduces manual skepticism and improves shortlist confidence."
    ),
    signal(
      "process",
      "Hiring process reliability",
      shortlistCount > 0 ? `${shortlistCount} advanced cycle${shortlistCount === 1 ? "" : "s"}` : applications.length > 0 ? `${applications.length} application${applications.length === 1 ? "" : "s"}` : "New profile",
      "This reflects process participation already visible inside HenryCo Jobs rather than self-reported reputation.",
      shortlistCount > 0 ? "good" : applications.length > 0 ? "neutral" : "warn",
      "Advanced cycles indicate the profile has held up under real hiring review."
    ),
    signal(
      "risk",
      "Risk posture",
      seriousRiskEvents.length > 0 ? `${seriousRiskEvents.length} event${seriousRiskEvents.length === 1 ? "" : "s"}` : "Clean",
      "Security and anti-bypass signals lower trust because they indicate behavior that requires manual checking.",
      seriousRiskEvents.length === 0 ? "good" : severeFlags > 0 ? "danger" : "warn",
      "High-risk events should be visible to moderators and owner summaries immediately."
    ),
  ];

  const nextSteps = buildNextSteps(
    [
      [!hasResume, "Upload a current resume so recruiters are not forced to infer your background from free text."],
      [!hasPortfolio, "Add portfolio proof or concrete work samples before high-trust roles route you into shortlist lanes."],
      [workHistoryCount === 0, "Add work history or education so the platform can distinguish a real operator from an empty shell."],
      [skillCount < 4, "Expand your skill list with actual tools and functions you can defend in interviews."],
      [input.verificationStatus !== "verified", "Complete verification so identity trust stops holding the profile back."],
    ],
    "Keep the profile current and respond from the same HenryCo account whenever recruiters reach out."
  );

  const label = passportLabel({
    score,
    riskBand: band,
    verified: input.verificationStatus === "verified",
  });

  return {
    score,
    label,
    riskBand: band,
    summary: buildSummary(label, "This candidate", strengths, warnings),
    strengths,
    warnings,
    nextSteps,
    suspiciousFlags,
    signals,
  };
}

export function buildEmployerTrustPassport(input: {
  slug: string;
  verificationStatus: EmployerProfile["verificationStatus"];
  trustScore: number;
  responseSlaHours: number;
  website: string | null;
  locations: string[];
  culturePoints: string[];
  verificationNotes: string[];
  openRoleCount: number;
  benefitsHeadline: string;
}): TrustPassport {
  const profileDepthScore =
    (input.website ? 26 : 0) +
    (input.locations.length > 0 ? 20 : 0) +
    (input.culturePoints.length >= 3 ? 22 : input.culturePoints.length > 0 ? 10 : 0) +
    (text(input.benefitsHeadline) ? 16 : 0) +
    (input.openRoleCount > 0 ? 16 : 8);
  const verificationScore =
    input.verificationStatus === "verified"
      ? 100
      : input.verificationStatus === "watch"
        ? 38
        : input.verificationStatus === "rejected"
          ? 10
          : 58;
  const responseScore =
    input.responseSlaHours <= 8
      ? 92
      : input.responseSlaHours <= 24
        ? 78
        : input.responseSlaHours <= 48
          ? 62
          : 42;
  const notesPenalty =
    input.verificationStatus === "watch"
      ? 18
      : input.verificationStatus === "rejected"
        ? 42
        : Math.min(16, input.verificationNotes.length * 4);
  const score = clamp(
    input.trustScore * 0.34 + profileDepthScore * 0.28 + verificationScore * 0.24 + responseScore * 0.14 - notesPenalty
  );
  const band = riskBand(
    score,
    input.verificationStatus === "watch" || input.verificationStatus === "rejected" ? 2 : 0
  );
  const strengths = dedupe([
    input.verificationStatus === "verified" ? "Verification standing is clear" : null,
    input.website ? "Company website is linked" : null,
    input.locations.length > 0 ? "Location footprint is published" : null,
    input.responseSlaHours <= 24 ? "Response expectation is operationally serious" : null,
    input.culturePoints.length >= 3 ? "Hiring context is explained beyond a logo and title" : null,
  ]);
  const warnings = dedupe([
    input.verificationStatus === "pending" ? "Verification is still in progress" : null,
    input.verificationStatus === "watch" ? "Verification standing is under watch" : null,
    input.verificationStatus === "rejected" ? "Verification standing blocks normal trust" : null,
    !input.website ? "Company website is missing" : null,
    input.locations.length === 0 ? "No clear hiring locations are published" : null,
    input.responseSlaHours > 24 ? "Response posture is slower than strong employers" : null,
  ]);
  const suspiciousFlags = dedupe([
    ...(input.verificationStatus === "watch" || input.verificationStatus === "rejected"
      ? [`Verification status is ${input.verificationStatus}`]
      : []),
    ...input.verificationNotes.slice(0, 3),
  ]);
  const signals: TrustSignal[] = [
    signal(
      "verification",
      "Verification",
      input.verificationStatus.replace(/_/g, " "),
      "Employer verification affects publication, escalation pressure, and how confidently candidates should engage.",
      input.verificationStatus === "verified" ? "good" : input.verificationStatus === "pending" ? "warn" : "danger",
      "Watch or rejected employers should be visible to moderators and owner oversight."
    ),
    signal(
      "profile",
      "Company clarity",
      ratioLabel(profileDepthScore),
      "Website, locations, benefits, and culture context reduce fake-employer risk.",
      profileDepthScore >= 75 ? "good" : profileDepthScore >= 52 ? "warn" : "danger",
      "Thin employer profiles should not enjoy the same trust posture as complete company records."
    ),
    signal(
      "response",
      "Response discipline",
      `~${input.responseSlaHours}h`,
      "Response speed affects candidate confidence and whether the process feels serious rather than abandoned.",
      input.responseSlaHours <= 24 ? "good" : input.responseSlaHours <= 48 ? "warn" : "danger",
      "Slow employer response times should be visible in recruiter queues and owner summaries."
    ),
    signal(
      "hiring",
      "Hiring surface",
      `${input.openRoleCount} live role${input.openRoleCount === 1 ? "" : "s"}`,
      "Live roles with structured context increase trust only when the employer profile is strong enough to support them.",
      input.openRoleCount > 0 ? "neutral" : "warn",
      "An employer with no live roles but an active trust score may need moderation review."
    ),
    signal(
      "risk",
      "Exceptions",
      suspiciousFlags.length > 0 ? `${suspiciousFlags.length} note${suspiciousFlags.length === 1 ? "" : "s"}` : "Clean",
      "Verification notes, watch decisions, and rejection history should change recruiter posture immediately.",
      suspiciousFlags.length === 0 ? "good" : input.verificationStatus === "pending" ? "warn" : "danger",
      "Serious verification exceptions belong in owner digests and moderator escalations."
    ),
  ];
  const nextSteps = buildNextSteps(
    [
      [!input.website, "Add a real company website before pushing more hiring volume through the public board."],
      [input.locations.length === 0, "Publish at least one real hiring location so candidates are not applying blind."],
      [input.verificationStatus !== "verified", "Complete employer verification before asking candidates to trust the process."],
      [input.responseSlaHours > 24, "Tighten recruiter response operations so the trust surface matches real follow-through."],
    ],
    "Keep employer verification notes and hiring posture current so trust does not drift away from reality."
  );
  const label = passportLabel({
    score,
    riskBand: band,
    verified: input.verificationStatus === "verified",
  });

  return {
    score,
    label,
    riskBand: band,
    summary: buildSummary(label, "This employer", strengths, warnings),
    strengths,
    warnings,
    nextSteps,
    suspiciousFlags,
    signals,
  };
}

export function buildJobTrustPassport(input: {
  employerName: string;
  employerVerification: string;
  employerTrustScore: number;
  moderationStatus: JobPost["moderationStatus"];
  salaryMin: number | null;
  salaryMax: number | null;
  pipelineStages: string[];
  trustHighlights: string[];
  internal: boolean;
}): TrustPassport {
  const moderationScore =
    input.moderationStatus === "approved"
      ? 92
      : input.moderationStatus === "pending_review"
        ? 58
        : input.moderationStatus === "flagged"
          ? 18
          : 34;
  const compensationScore = input.salaryMin != null || input.salaryMax != null ? 84 : 48;
  const pipelineScore =
    input.pipelineStages.length >= 4
      ? 88
      : input.pipelineStages.length >= 2
        ? 68
        : 42;
  const highlightScore = Math.min(86, 45 + input.trustHighlights.length * 12);
  const score = clamp(
    input.employerTrustScore * 0.42 +
      moderationScore * 0.24 +
      compensationScore * 0.14 +
      pipelineScore * 0.12 +
      highlightScore * 0.08 +
      (input.internal ? 4 : 0)
  );
  const severeFlags = Number(input.moderationStatus === "flagged") + Number(input.employerVerification === "watch");
  const band = riskBand(score, severeFlags);
  const strengths = dedupe([
    input.moderationStatus === "approved" ? "Posting has cleared moderation" : null,
    compensationScore > 70 ? "Compensation range is visible" : null,
    input.pipelineStages.length >= 3 ? "Hiring process is structured" : null,
    input.employerVerification === "verified" ? "Employer verification is visible" : null,
    input.internal ? "Internal HenryCo role follows the governed internal lane" : null,
  ]);
  const warnings = dedupe([
    input.moderationStatus === "pending_review" ? "Posting is still waiting for moderation review" : null,
    input.moderationStatus === "flagged" ? "Posting is flagged and should not be treated as normal" : null,
    compensationScore < 70 ? "Compensation is not transparent yet" : null,
    input.pipelineStages.length < 2 ? "Hiring stages are too vague" : null,
    input.employerVerification !== "verified" ? "Employer verification is not fully clear" : null,
  ]);
  const suspiciousFlags = dedupe([
    input.moderationStatus === "flagged" ? "Posting is flagged in moderation" : null,
    input.employerVerification === "watch" ? `${input.employerName} is under verification watch` : null,
  ]);
  const signals: TrustSignal[] = [
    signal(
      "employer",
      "Employer",
      `${input.employerTrustScore}%`,
      "The job inherits most of its trust posture from the employer, not just from the copy on this page.",
      input.employerTrustScore >= 78 ? "good" : input.employerTrustScore >= 60 ? "warn" : "danger",
      "Low employer trust should materially slow publication confidence and recruiter handling."
    ),
    signal(
      "moderation",
      "Moderation",
      input.moderationStatus.replace(/_/g, " "),
      "Publication status is driven by moderation outcome, not by the client claiming a job is live.",
      input.moderationStatus === "approved" ? "good" : input.moderationStatus === "pending_review" ? "warn" : "danger",
      "Flagged roles should surface into moderator and owner queues immediately."
    ),
    signal(
      "compensation",
      "Compensation clarity",
      input.salaryMin != null || input.salaryMax != null ? "Range shown" : "Discussed later",
      "Trust improves when a role reveals whether pay is defined instead of forcing candidates to guess.",
      compensationScore > 70 ? "good" : "warn",
      "Opaque compensation lowers candidate confidence and should be visible in recruiter review."
    ),
    signal(
      "pipeline",
      "Process structure",
      `${input.pipelineStages.length} stage${input.pipelineStages.length === 1 ? "" : "s"}`,
      "Structured stages reduce ghosting risk because the platform can track progress and accountability.",
      input.pipelineStages.length >= 3 ? "good" : input.pipelineStages.length >= 2 ? "neutral" : "warn",
      "Vague hiring flows are harder to govern and easier to abuse."
    ),
    signal(
      "proof",
      "Trust cues",
      `${input.trustHighlights.length} published`,
      "Public trust cues should reflect real verification, moderation, and hiring structure instead of decorative marketing.",
      input.trustHighlights.length >= 2 ? "good" : input.trustHighlights.length === 1 ? "neutral" : "warn",
      "Thin trust cues make it harder for candidates to judge process seriousness."
    ),
  ];
  const nextSteps = buildNextSteps(
    [
      [input.moderationStatus !== "approved", "Clear moderation review before treating this role as a high-confidence public listing."],
      [input.salaryMin == null && input.salaryMax == null, "Publish a compensation range or explicit pay language to improve conversion and honesty."],
      [input.pipelineStages.length < 3, "Add a more structured hiring path so candidates know what comes after they apply."],
      [input.employerVerification !== "verified", "Resolve employer verification so the role does not inherit avoidable trust drag."],
    ],
    "Keep hiring stages, trust cues, and moderation status aligned with the real process."
  );
  const label = passportLabel({
    score,
    riskBand: band,
    approved: input.moderationStatus === "approved",
    verified: input.employerVerification === "verified",
  });

  return {
    score,
    label,
    riskBand: band,
    summary: buildSummary(label, "This role", strengths, warnings),
    strengths,
    warnings,
    nextSteps,
    suspiciousFlags,
    signals,
  };
}
