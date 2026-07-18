/**
 * SA-1 — the review card behind the SA-D5 one-tap release. PURE composition
 * (no React, no server imports, no model call): every line is derived from
 * the brief/lead/proposal the client actually submitted, so the reviewer
 * reads honest signals, not generated prose. SA-4 replaces this surface
 * with the operator's AI-prepared proposal; the card model stays.
 */

import type {
  StudioBrief,
  StudioCustomRequest,
  StudioLead,
  StudioProposal,
} from "@/lib/studio/types";

export type ProposalReviewCard = {
  /** One-line frame for the queue row. */
  headline: string;
  clientName: string;
  companyName: string | null;
  submittedAt: string;
  readinessScore: number;
  /** Deterministic judgment aids — the things a senior lead checks first. */
  signals: string[];
  /** The client's own asks, verbatim (truncated for the card). */
  goals: string;
  scopeNotes: string;
  requiredFeatures: string[];
  investment: number;
  depositAmount: number;
  currency: string;
};

function truncate(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

/**
 * Best-effort read of a stated budget band into major-unit naira. Handles
 * the fixed-input format ("₦1,500,000") and the band format ("₦8M – ₦20M",
 * "Below ₦1M", "₦20M+") by taking the LARGEST stated figure — the most
 * generous reading, so the over-budget signal only fires when the estimate
 * exceeds even the top of the client's range. Returns null when no figure
 * can be read (e.g. "Not sure yet").
 */
export function parseStatedBudgetCeiling(budgetBand: string): number | null {
  const text = String(budgetBand ?? "");
  const millions = [...text.matchAll(/(\d+(?:\.\d+)?)\s*M\b/gi)].map(
    (match) => Number(match[1]) * 1_000_000,
  );
  const plain = [...text.matchAll(/(\d{1,3}(?:,\d{3})+|\d{7,})/g)].map((match) =>
    Number(match[1].replaceAll(",", "")),
  );
  const candidates = [...millions, ...plain].filter(
    (value) => Number.isFinite(value) && value > 0,
  );
  if (candidates.length === 0) return null;
  return Math.max(...candidates);
}

export function composeProposalReviewCard(input: {
  proposal: StudioProposal;
  lead: StudioLead | null;
  brief: StudioBrief | null;
  customRequest: StudioCustomRequest | null;
}): ProposalReviewCard {
  const { proposal, lead, brief, customRequest } = input;
  const signals: string[] = [];

  const statedCeiling = parseStatedBudgetCeiling(lead?.budgetBand ?? brief?.budgetBand ?? "");
  if (statedCeiling != null && proposal.investment > statedCeiling) {
    signals.push(
      `Estimate sits above the stated budget (${lead?.budgetBand || brief?.budgetBand}) — expect a scope conversation before release.`,
    );
  }
  if (statedCeiling == null) {
    signals.push("No usable budget figure was stated — the price lands cold; consider framing it against outcomes.");
  }

  const featureCount = brief?.requiredFeatures.length ?? 0;
  if (featureCount >= 6) {
    signals.push(`Feature-heavy scope — ${featureCount} modules requested.`);
  }

  const urgency = (lead?.urgency || brief?.urgency || "").toLowerCase();
  if (urgency.includes("asap") || urgency.includes("priority")) {
    signals.push("Compressed timeline — the estimate carries a priority premium the client should see explained.");
  }

  const readiness = lead?.readinessScore ?? 0;
  if (readiness > 0 && readiness < 60) {
    signals.push("Thin brief — a short follow-up call before release may save a revision round later.");
  }

  if ((brief?.scopeNotes.trim().length ?? 0) < 40) {
    signals.push("Scope notes are light — confirm what must exist at handover before locking the number.");
  }

  const domain = brief?.domainIntent;
  if (domain?.path === "new" && domain.desiredLabel) {
    signals.push(`Wants a new domain (“${domain.desiredLabel}”) — availability is unverified; onboarding confirms it.`);
  }

  if (customRequest?.pageRequirements.length) {
    signals.push(`${customRequest.pageRequirements.length} scoped surfaces on the custom profile.`);
  }

  if (signals.length === 0) {
    signals.push("Nothing unusual flagged — scope, budget, and timing read consistent.");
  }

  const projectType = customRequest?.projectType || proposal.title;

  return {
    headline: truncate(projectType, 90),
    clientName: lead?.customerName || "Studio client",
    companyName: lead?.companyName ?? null,
    submittedAt: proposal.createdAt,
    readinessScore: readiness,
    signals,
    goals: truncate(brief?.goals ?? "", 220),
    scopeNotes: truncate(brief?.scopeNotes ?? "", 220),
    requiredFeatures: (brief?.requiredFeatures ?? []).slice(0, 8),
    investment: proposal.investment,
    depositAmount: proposal.depositAmount,
    currency: proposal.currency,
  };
}
