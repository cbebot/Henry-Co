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
import {
  defaultStudioRequestConfig,
  findModifierOptionByLabel,
  findPricedOptionByLabel,
  type StudioModifierOption,
  type StudioRequestConfig,
} from "@/lib/studio/request-config";

export type StudioPriceLine = {
  label: string;
  amount: number;
  detail?: string | null;
};

export type StudioPricingSummary = {
  /** ISO 4217 currency code. Amounts are in minor units of this currency. */
  currency: string;
  /** Total project investment in minor units. */
  total: number;
  depositAmount: number;
  depositRate: number;
  lines: StudioPriceLine[];
};

type EstimateInput = {
  service: StudioService;
  package?: StudioPackage | null;
  brief?: Pick<StudioBrief, "requiredFeatures" | "urgency" | "timeline"> | null;
  customRequest?: Pick<
    StudioCustomRequest,
    "projectType" | "platformPreference" | "pageRequirements" | "addonServices"
  > | null;
};

function roundAmount(value: number) {
  return Math.max(0, Math.round(value));
}

export function depositRateForTotal(total: number) {
  if (total >= 15000000) return 0.45;
  if (total >= 6000000) return 0.4;
  return 0.35;
}

function applyModifier(base: number, option: StudioModifierOption | null) {
  if (!option || option.value <= 0) return 0;
  if (option.modifierType === "percent") {
    return roundAmount(base * option.value);
  }
  return roundAmount(option.value);
}

function sumOptionCosts(
  values: string[] | undefined,
  options: StudioRequestConfig["pageOptions"],
  serviceKind?: StudioService["kind"]
) {
  return (values ?? []).reduce((sum, value) => {
    const option = findPricedOptionByLabel(options, value, serviceKind);
    return sum + (option?.amount ?? 0);
  }, 0);
}

export function estimateStudioPricing(
  input: EstimateInput,
  config: StudioRequestConfig = defaultStudioRequestConfig()
): StudioPricingSummary {
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

    const projectTypeOption = findPricedOptionByLabel(
      config.projectTypes,
      customRequest?.projectType || null,
      service.kind
    );
    if ((projectTypeOption?.amount ?? 0) > 0) {
      lines.push({
        label: "Project category",
        amount: roundAmount(projectTypeOption?.amount ?? 0),
        detail: projectTypeOption?.label || null,
      });
    }

    const platformAmount =
      findPricedOptionByLabel(
        config.platformOptions,
        customRequest?.platformPreference || null,
        service.kind
      )?.amount ?? 0;
    if (platformAmount > 0) {
      lines.push({
        label: "Platform architecture",
        amount: platformAmount,
        detail: customRequest?.platformPreference || null,
      });
    }

    const pageAmount = sumOptionCosts(customRequest?.pageRequirements, config.pageOptions, service.kind);
    if (pageAmount > 0) {
      lines.push({
        label: "Interfaces and page systems",
        amount: pageAmount,
        detail: `${customRequest?.pageRequirements?.length || 0} scoped surface(s)`,
      });
    }
  }

  const featureAmount = sumOptionCosts(brief?.requiredFeatures, config.moduleOptions, service.kind);
  if (featureAmount > 0) {
    lines.push({
      label: "Functional modules",
      amount: featureAmount,
      detail: `${brief?.requiredFeatures?.length || 0} premium module(s)`,
    });
  }

  const addonAmount = sumOptionCosts(customRequest?.addonServices, config.addOnOptions, service.kind);
  if (addonAmount > 0) {
    lines.push({
      label: "Growth add-ons",
      amount: addonAmount,
      detail: `${customRequest?.addonServices?.length || 0} selected add-on(s)`,
    });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const timelineModifier = applyModifier(
    subtotal,
    findModifierOptionByLabel(config.timelineOptions, brief?.timeline || null, service.kind)
  );
  if (timelineModifier > 0) {
    lines.push({
      label: "Timeline compression premium",
      amount: timelineModifier,
      detail: brief?.timeline || null,
    });
  }

  const urgencyModifier = applyModifier(
    subtotal,
    findModifierOptionByLabel(config.urgencyOptions, brief?.urgency || null, service.kind)
  );
  if (urgencyModifier > 0) {
    lines.push({
      label: "Priority delivery premium",
      amount: urgencyModifier,
      detail: brief?.urgency || null,
    });
  }

  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  const depositRate = pkg?.depositRate ?? depositRateForTotal(total);
  const depositAmount = roundAmount(total * depositRate);

  return {
    currency: "NGN",
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
  requestConfig?: StudioRequestConfig | null;
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
  }, input.requestConfig ?? defaultStudioRequestConfig());

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
