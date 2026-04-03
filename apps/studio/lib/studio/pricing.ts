import type {
  StudioBrief,
  StudioCustomRequest,
  StudioPackage,
  StudioPayment,
  StudioProject,
  StudioProjectMilestone,
  StudioProposal,
  StudioService,
} from "@/lib/studio/types";

export type StudioPriceLine = {
  label: string;
  amount: number;
  detail?: string | null;
};

export type StudioPricingSummary = {
  total: number;
  depositAmount: number;
  depositRate: number;
  lines: StudioPriceLine[];
};

type EstimateInput = {
  service: StudioService;
  package?: StudioPackage | null;
  brief?: Pick<StudioBrief, "requiredFeatures" | "urgency"> | null;
  customRequest?: Pick<
    StudioCustomRequest,
    "projectType" | "platformPreference" | "pageRequirements" | "addonServices"
  > | null;
};

const pageRequirementCosts = new Map<string, number>([
  ["Homepage and offer pages", 240000],
  ["Services or solution pages", 180000],
  ["About, team, and trust pages", 160000],
  ["Case studies or proof pages", 220000],
  ["Pricing, proposal, or quote surfaces", 180000],
  ["Client account or portal views", 620000],
  ["Admin dashboard or internal control room", 780000],
  ["Checkout, payment, or invoice views", 280000],
]);

const featureCosts = new Map<string, number>([
  ["CMS or structured content management", 320000],
  ["Admin dashboard", 760000],
  ["Role-based permissions", 280000],
  ["Payments and invoicing", 460000],
  ["Bookings, scheduling, or calendar logic", 420000],
  ["Client account area", 620000],
  ["Automation and notifications", 540000],
  ["Analytics and reporting", 380000],
  ["CRM, ERP, or third-party integrations", 680000],
  ["File vault or delivery library", 340000],
]);

const addonCosts = new Map<string, number>([
  ["Brand identity", 650000],
  ["Copywriting and messaging", 380000],
  ["SEO foundation", 320000],
  ["Launch campaign or sales pages", 540000],
  ["Email lifecycle automation", 450000],
  ["WhatsApp customer workflow", 420000],
  ["Maintenance or retained support", 600000],
  ["Launch support and training", 300000],
]);

const platformCosts = new Map<string, number>([
  ["Website only", 0],
  ["Web app / SaaS product", 1050000],
  ["Mobile app", 1450000],
  ["Website plus admin dashboard", 900000],
  ["Client portal plus internal operations layer", 1750000],
  ["Commerce storefront plus backend operations layer", 1550000],
  ["Best-fit recommendation", 0],
]);

function roundAmount(value: number) {
  return Math.max(0, Math.round(value));
}

function urgencyRate(urgency?: string | null) {
  const normalized = String(urgency || "").trim().toLowerCase();
  if (normalized.includes("urgent")) return 0.18;
  if (normalized.includes("priority")) return 0.08;
  return 0;
}

export function depositRateForTotal(total: number) {
  if (total >= 15000000) return 0.45;
  if (total >= 6000000) return 0.4;
  return 0.35;
}

function sumMappedCosts(values: string[] | undefined, costs: Map<string, number>) {
  return (values ?? []).reduce((sum, value) => sum + (costs.get(value) ?? 0), 0);
}

export function estimateStudioPricing(input: EstimateInput): StudioPricingSummary {
  const service = input.service;
  const pkg = input.package ?? null;
  const brief = input.brief ?? null;
  const customRequest = input.customRequest ?? null;

  const lines: StudioPriceLine[] = [];

  if (pkg) {
    lines.push({
      label: `${pkg.name} package`,
      amount: roundAmount(pkg.price),
      detail: `${pkg.timelineWeeks} week delivery lane`,
    });
  } else {
    lines.push({
      label: `${service.name} base scope`,
      amount: roundAmount(service.startingPrice),
      detail: customRequest?.projectType || service.headline,
    });

    const platformAmount =
      platformCosts.get(customRequest?.platformPreference || "") ?? 0;
    if (platformAmount > 0) {
      lines.push({
        label: "Platform architecture",
        amount: platformAmount,
        detail: customRequest?.platformPreference || null,
      });
    }

    const pageAmount = sumMappedCosts(customRequest?.pageRequirements, pageRequirementCosts);
    if (pageAmount > 0) {
      lines.push({
        label: "Interfaces and page systems",
        amount: pageAmount,
        detail: `${customRequest?.pageRequirements?.length || 0} scoped surface(s)`,
      });
    }

    const featureAmount = sumMappedCosts(brief?.requiredFeatures, featureCosts);
    if (featureAmount > 0) {
      lines.push({
        label: "Functional modules",
        amount: featureAmount,
        detail: `${brief?.requiredFeatures?.length || 0} premium module(s)`,
      });
    }

    const addonAmount = sumMappedCosts(customRequest?.addonServices, addonCosts);
    if (addonAmount > 0) {
      lines.push({
        label: "Growth add-ons",
        amount: addonAmount,
        detail: `${customRequest?.addonServices?.length || 0} selected add-on(s)`,
      });
    }
  }

  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const rushRate = urgencyRate(brief?.urgency);
  if (rushRate > 0) {
    lines.push({
      label: "Priority delivery premium",
      amount: roundAmount(subtotal * rushRate),
      detail: brief?.urgency || null,
    });
  }

  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  const depositRate = pkg?.depositRate ?? depositRateForTotal(total);
  const depositAmount = roundAmount(total * depositRate);

  return {
    total,
    depositAmount,
    depositRate,
    lines,
  };
}

export function buildMilestoneAmounts(total: number, depositRate: number) {
  const safeTotal = roundAmount(total);
  const safeDepositRate = Math.max(0.1, Math.min(0.9, depositRate || 0.4));
  const deposit = roundAmount(safeTotal * safeDepositRate);
  const remaining = Math.max(safeTotal - deposit, 0);
  const foundation = roundAmount(remaining * 0.45);
  const production = roundAmount(remaining * 0.35);
  const delivery = Math.max(safeTotal - deposit - foundation - production, 0);

  return {
    deposit,
    foundation,
    production,
    delivery,
  };
}

export function buildProposalPricingBreakdown(input: {
  proposal: StudioProposal;
  service: StudioService | null;
  package: StudioPackage | null;
  brief: StudioBrief | null;
  customRequest: StudioCustomRequest | null;
}) {
  if (!input.service) {
    return [
      {
        label: "Approved project scope",
        amount: input.proposal.investment,
        detail: "Commercial total recorded in the Studio proposal.",
      },
    ] satisfies StudioPriceLine[];
  }

  const estimated = estimateStudioPricing({
    service: input.service,
    package: input.package,
    brief: input.brief,
    customRequest: input.customRequest,
  });

  const delta = input.proposal.investment - estimated.total;
  const lines = [...estimated.lines];
  if (delta !== 0) {
    lines.push({
      label: delta > 0 ? "Commercial calibration" : "Scope adjustment",
      amount: Math.abs(delta),
      detail:
        delta > 0
          ? "Recorded proposal total includes calibrated delivery overhead."
          : "Recorded proposal total is lower than the current heuristic estimate.",
    });
  }

  return lines;
}

export function buildPaymentOverview(input: {
  proposal: StudioProposal | null;
  project: StudioProject;
  payments: StudioPayment[];
  milestones: StudioProjectMilestone[];
}) {
  const total = input.proposal?.investment ?? input.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const paid = input.payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const processing = input.payments
    .filter((payment) => payment.status === "processing")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const outstanding = Math.max(total - paid, 0);
  const nextPayment =
    [...input.payments]
      .filter((payment) => payment.status !== "paid" && payment.status !== "cancelled")
      .sort((left, right) => {
        const leftDate = Date.parse(left.dueDate || left.createdAt || "");
        const rightDate = Date.parse(right.dueDate || right.createdAt || "");
        if (Number.isNaN(leftDate) && Number.isNaN(rightDate)) return 0;
        if (Number.isNaN(leftDate)) return 1;
        if (Number.isNaN(rightDate)) return -1;
        return leftDate - rightDate;
      })[0] ?? null;

  return {
    total,
    paid,
    processing,
    outstanding,
    nextPayment,
    approvedMilestones: input.milestones.filter((milestone) => milestone.status === "approved").length,
    totalMilestones: input.milestones.length,
  };
}
