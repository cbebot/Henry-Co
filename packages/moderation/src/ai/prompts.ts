// ---------------------------------------------------------------------------
// ai/prompts.ts — per-domain system prompts for AI-assisted moderation
//
// These prompts are handed to the INJECTED governed AI router (V3-26). The
// provider is never named and never reached directly. Each domain has its own
// risk profile: marketplace = scam/fraud/banned goods; jobs = recruitment
// scams + discrimination; studio = legal/IP/abuse; profile = impersonation.
// ---------------------------------------------------------------------------

import type { ContentType } from "../types";

const SHARED_RUBRIC = [
  "You are a content-safety classifier for a multi-division marketplace.",
  "Return one of: approve | hold | reject.",
  "approve = clearly safe. hold = needs human review. reject = clearly violating.",
  "Be conservative: when uncertain, choose hold, never approve.",
  "Never include the user's raw text in your rationale; cite categories only.",
].join(" ");

const DOMAIN_PROMPTS: Record<ContentType, string> = {
  marketplace_listing:
    "Assess this marketplace listing for: scams/fraud, payment diversion, counterfeit goods, " +
    "prohibited/regulated items, and deceptive claims. Flag listings that pressure buyers off-platform.",
  job_post:
    "Assess this job post for: recruitment scams (advance-fee, fake offers, money-mule), " +
    "illegal discrimination in requirements, and bait-and-switch compensation claims.",
  studio_brief:
    "Assess this creative brief for: requests to infringe copyright/trademark, illegal deliverables, " +
    "defamation, and abusive or harassing content directed at a third party.",
  service_profile:
    "Assess this provider profile/bio for: impersonation, fabricated credentials, abusive language, " +
    "and attempts to solicit contact or payment off-platform.",
};

/** Build the system + task prompt pair for a given content domain. */
export function buildModerationPrompt(contentType: ContentType): { system: string; task: string } {
  return { system: SHARED_RUBRIC, task: DOMAIN_PROMPTS[contentType] };
}
