import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import { normalizeEmail, normalizePhone } from "@/lib/env";
import { createAdminSupabase, hasAdminSupabaseEnv } from "@/lib/supabase";
import { getStudioCatalog } from "@/lib/studio/catalog";
import { sendInquiryNotifications, sendProposalNotifications, sendPaymentInstructionsNotifications } from "@/lib/studio/email/send";
import { getStudioTemplateBySlug } from "@/lib/studio/templates";
import {
  cleanText,
  createAccessKey,
  createId,
  hashAccessKey,
  plusDays,
  upsertStudioRecord,
  type UpsertMeta,
} from "@/lib/studio/store";
import type {
  StudioBrief,
  StudioCustomRequest,
  StudioLead,
  StudioPayment,
  StudioProject,
  StudioProjectMilestone,
  StudioProposal,
  StudioTemplate,
} from "@/lib/studio/types";

export type TemplateReservationInput = {
  templateSlug: string;
  customerName: string;
  email: string;
  phone?: string | null;
  companyName?: string | null;
  brandVibe?: string | null;
  domainStatus?: "have" | "new" | "later";
  domainPreference?: string | null;
  notes?: string | null;
  userId?: string | null;
};

export type TemplateReservationResult = {
  template: StudioTemplate;
  invoiceId: string;
  invoiceToken: string;
  invoiceNumber: string;
  amountKobo: number;
  projectId: string;
  proposalId: string;
  leadId: string;
};

const BRAND_VIBE_OPTIONS = new Set([
  "Quiet luxury and high-trust",
  "Bold and editorial",
  "Warm and human",
  "Confident and corporate",
  "Modern and minimal",
]);

function safeBrandVibe(value: string | null | undefined): string {
  const trimmed = cleanText(value);
  return BRAND_VIBE_OPTIONS.has(trimmed) ? trimmed : "Quiet luxury and high-trust";
}

function buildTemplateMilestones(
  projectId: string,
  template: StudioTemplate
): StudioProjectMilestone[] {
  const totalKobo = Math.round(template.price * 100);
  const depositKobo = Math.round(totalKobo * template.depositRate);
  const remainingKobo = totalKobo - depositKobo;

  // Two milestones for a template build: kickoff & customisation (deposit-funded)
  // and launch & handover (balance).
  const kickoffNaira = Math.round(depositKobo / 100);
  const launchNaira = Math.round(remainingKobo / 100);

  return [
    {
      id: createId(),
      projectId,
      name: "Kickoff and customisation",
      description: `Brand assets, content load, and ${template.name} customisation against your brief.`,
      dueLabel: `Days 1–${Math.max(1, Math.round(template.readyInDays / 2))}`,
      amount: kickoffNaira,
      status: "in_progress",
    },
    {
      id: createId(),
      projectId,
      name: "Launch and handover",
      description: "QA, performance pass, accessibility check, launch, and knowledge transfer.",
      dueLabel: `Days ${Math.max(2, Math.round(template.readyInDays / 2))}–${template.readyInDays}`,
      amount: launchNaira,
      status: "planned",
    },
  ];
}

function buildAssignmentsForTemplate(projectId: string, teamId: string) {
  return [
    {
      id: createId(),
      projectId,
      teamId,
      role: "delivery_team",
      label: "Delivery team",
    },
    {
      id: createId(),
      projectId,
      teamId,
      role: "client_success",
      label: "Client success lead",
    },
  ];
}

/**
 * Reserve a Studio template — the fast-track path. Creates real records
 * (lead, brief, proposal, project, milestones, invoice) using the
 * template's actual price, deposit rate, and timeline. The returned
 * invoice carries a token so the customer can pay immediately at
 * /payment?invoice=TOKEN without authenticating.
 *
 * No "depositNow" branching — this path always creates the project and
 * the deposit invoice because the customer has explicitly chosen a
 * ready-made site at a real price.
 */
export async function reserveStudioTemplate(
  input: TemplateReservationInput
): Promise<TemplateReservationResult> {
  const template = getStudioTemplateBySlug(input.templateSlug);
  if (!template) {
    throw new Error("Template not found.");
  }

  if (!hasAdminSupabaseEnv()) {
    throw new Error("Reservation backend is not configured. Contact support.");
  }

  const catalog = await getStudioCatalog({ includeUnpublished: true });
  const services = catalog.services;
  const packages = catalog.packages;
  const teams = catalog.teams;

  const service =
    services.find((item) => item.kind === template.serviceKind) ?? services[0];
  if (!service) {
    throw new Error("Studio service catalog is unavailable.");
  }

  const pkg = template.packageId
    ? packages.find((item) => item.id === template.packageId) ?? null
    : null;

  // Pick a delivery team that flags `website` in its focus, otherwise the
  // first available. We do not surface team selection to the customer at
  // this stage — the studio can rebalance internally.
  const team =
    teams.find((item) =>
      item.focus.some((focus) => focus.toLowerCase().includes("website"))
    ) ?? teams[0];

  if (!team) {
    throw new Error("No delivery team is currently available for this template.");
  }

  const now = new Date();
  const customerName = cleanText(input.customerName) || "Studio customer";
  const normalizedEmail = normalizeEmail(input.email);
  if (!normalizedEmail) {
    throw new Error("A valid email is required to reserve this template.");
  }
  const phone = normalizePhone(input.phone) || null;
  const companyName = cleanText(input.companyName) || null;
  const brandVibe = safeBrandVibe(input.brandVibe);
  const domainStatus = input.domainStatus ?? "later";
  const domainPreference = cleanText(input.domainPreference) || null;
  const notes = cleanText(input.notes) || null;

  const meta: UpsertMeta = {
    userId: input.userId ?? null,
    email: normalizedEmail,
    role: "client",
  };

  const leadId = createId();
  const briefId = createId();
  const customRequestId = createId();
  const proposalId = createId();
  const projectId = createId();

  const totalKobo = Math.round(template.price * 100);
  const depositKobo = Math.round(totalKobo * template.depositRate);

  const lead: StudioLead = {
    id: leadId,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    userId: input.userId ?? null,
    normalizedEmail,
    customerName,
    companyName,
    phone,
    serviceKind: template.serviceKind,
    status: "won",
    readinessScore: 92,
    businessType: "Template reservation",
    budgetBand: "Template-fixed",
    urgency: "Ready-to-launch",
    requestedPackageId: pkg?.id ?? null,
    preferredTeamId: team.id,
    matchedTeamId: team.id,
  };

  const brief: StudioBrief = {
    id: briefId,
    leadId,
    createdAt: now.toISOString(),
    goals: notes
      ? `Launch the ${template.name} site for ${companyName || customerName}. ${notes}`
      : `Launch the ${template.name} site for ${companyName || customerName}.`,
    scopeNotes: `Customer reserved the ${template.name} template. Audience: ${template.audience}.`,
    businessType: "Template reservation",
    budgetBand: "Template-fixed",
    urgency: "Ready-to-launch",
    timeline: `${template.readyInDays} days from kickoff`,
    packageIntent: pkg ? "package" : "custom",
    techPreferences: template.stack,
    requiredFeatures: template.features.slice(0, 6),
    referenceFiles: [],
    referenceLinks: template.demoUrl ? [template.demoUrl] : [],
    domainIntent: {
      path: domainStatus,
      desiredLabel: domainPreference || "",
      checkedFqdn: null,
      checkStatus: "not_answered",
      suggestionsShown: [],
      lookupMode: "off",
      lastMessage: null,
    },
  };

  const customRequest: StudioCustomRequest = {
    id: customRequestId,
    leadId,
    createdAt: now.toISOString(),
    projectType: template.projectTypeLabel,
    platformPreference: "Best-fit recommendation",
    designDirection: brandVibe,
    pageRequirements: template.pages,
    addonServices: [],
    inspirationSummary: notes || "",
  };

  const proposal: StudioProposal = {
    id: proposalId,
    leadId,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    accessKey: createAccessKey(`proposal:${proposalId}`),
    status: "accepted",
    title: `${template.name} for ${companyName || customerName}`,
    summary:
      template.summary ||
      `${template.name} customised for ${companyName || customerName}, launching in ${template.readyInDays} days.`,
    investment: template.price,
    depositAmount: Math.round(template.price * template.depositRate),
    currency: "NGN",
    validUntil: plusDays(now, 14),
    teamId: team.id,
    serviceId: service.id,
    packageId: pkg?.id ?? null,
    scopeBullets: [
      `Template: ${template.name} (${template.readyInDays}-day launch window)`,
      `Brand direction: ${brandVibe}`,
      `Pages included: ${template.pages.length}`,
      `Features built in: ${template.features.length}`,
      domainStatus === "have"
        ? `Domain: customer connecting existing domain${domainPreference ? ` (${domainPreference})` : ""}`
        : domainStatus === "new"
          ? `Domain: HenryCo to source new domain${domainPreference ? ` (preferred: ${domainPreference})` : ""}`
          : "Domain: decide before launch",
    ],
    milestones: [
      {
        id: createId(),
        name: "Kickoff and customisation",
        amount: Math.round(template.price * template.depositRate),
        description: "Brand assets, content load, customisation against the chosen template.",
        dueLabel: `Days 1–${Math.max(1, Math.round(template.readyInDays / 2))}`,
      },
      {
        id: createId(),
        name: "Launch and handover",
        amount: template.price - Math.round(template.price * template.depositRate),
        description: "QA, performance, accessibility, launch, knowledge transfer.",
        dueLabel: `Days ${Math.max(2, Math.round(template.readyInDays / 2))}–${template.readyInDays}`,
      },
    ],
    comparisonNotes: [
      "Template-anchored pricing — no surprises, no scope drift.",
      "Deposit reserves the build slot and unlocks kickoff.",
      "Balance is due at launch, before final handover.",
    ],
  };

  const projectMilestones = buildTemplateMilestones(projectId, template);
  const assignments = buildAssignmentsForTemplate(projectId, team.id);

  const project: StudioProject = {
    id: projectId,
    proposalId,
    leadId,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    accessKey: createAccessKey(`project:${projectId}`),
    clientUserId: input.userId ?? null,
    normalizedEmail,
    status: "pending_deposit",
    title: proposal.title,
    summary: proposal.summary,
    nextAction: "Pay the deposit to confirm the slot and unlock kickoff.",
    serviceId: service.id,
    packageId: pkg?.id ?? null,
    teamId: team.id,
    confidence: lead.readinessScore,
    assignments,
    milestones: projectMilestones,
  };

  const legacyPayment: StudioPayment = {
    id: createId(),
    projectId,
    milestoneId: projectMilestones[0]?.id ?? null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    label: "Deposit — kickoff",
    amount: proposal.depositAmount,
    currency: proposal.currency,
    status: "requested",
    dueDate: plusDays(now, 3),
    method: "bank_transfer",
    proofUrl: null,
    proofName: null,
  };

  await upsertStudioRecord("studio_lead_upsert", lead, meta);
  await upsertStudioRecord("studio_brief_upsert", brief, meta);

  // Persist the custom request so staff workspace sees the same shape it
  // sees for full briefs.
  const admin = createAdminSupabase();
  await admin.from("studio_custom_requests").insert({
    id: customRequest.id,
    lead_id: customRequest.leadId,
    created_at: customRequest.createdAt,
    project_type: customRequest.projectType,
    platform_preference: customRequest.platformPreference,
    design_direction: customRequest.designDirection,
    page_requirements: customRequest.pageRequirements,
    addon_services: customRequest.addonServices,
    inspiration_summary: customRequest.inspirationSummary,
  } as never);

  await upsertStudioRecord("studio_proposal_upsert", proposal, meta);
  await upsertStudioRecord("studio_project_upsert", project, meta);
  await upsertStudioRecord("studio_payment_upsert", legacyPayment, {
    ...meta,
    role: "finance",
  });

  // Insert the portal invoice (with a token) into studio_invoices. This is
  // the row /payment?invoice=TOKEN looks up.
  const invoiceId = randomUUID();
  const invoiceToken = randomBytes(24).toString("base64url");
  const invoiceNumber = `STUDIO-${now.getFullYear()}-${customerName
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 3) || "RES"}-${invoiceId.slice(0, 6).toUpperCase()}`;

  await admin.from("studio_invoices").insert({
    id: invoiceId,
    project_id: projectId,
    milestone_id: projectMilestones[0]?.id ?? null,
    client_user_id: input.userId ?? null,
    normalized_email: normalizedEmail,
    invoice_number: invoiceNumber,
    amount_kobo: depositKobo,
    currency: "NGN",
    description: `Deposit for ${template.name} (${template.readyInDays}-day launch)`,
    due_date: plusDays(now, 3),
    status: "sent",
    invoice_token: invoiceToken,
    issued_at: now.toISOString(),
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  } as never);

  // Append a project_updates row so the activity feed lights up immediately.
  await admin.from("studio_project_updates").insert({
    id: randomUUID(),
    project_id: projectId,
    kind: "project_created",
    update_type: "status_changed",
    author_id: input.userId ?? null,
    title: `${template.name} reserved`,
    summary: `Deposit invoice ${invoiceNumber} issued. Pay to start kickoff.`,
    body: notes,
    metadata: {
      template_id: template.id,
      invoice_id: invoiceId,
      brand_vibe: brandVibe,
      domain_status: domainStatus,
    },
    created_at: now.toISOString(),
  } as never);

  // Also fire the existing notification pipeline so the team is alerted
  // through the same channels they already monitor.
  await sendInquiryNotifications({ lead, proposal, project }).catch(() => null);
  await sendProposalNotifications({ lead, proposal, project, teamName: team.name }).catch(() => null);
  await sendPaymentInstructionsNotifications({
    lead,
    proposal,
    project,
    payment: legacyPayment,
  }).catch(() => null);

  return {
    template,
    invoiceId,
    invoiceToken,
    invoiceNumber,
    amountKobo: depositKobo,
    projectId,
    proposalId,
    leadId,
  };
}

export function safeReservationToken(value: string | null | undefined): string | null {
  const candidate = String(value ?? "").trim();
  if (!candidate) return null;
  if (candidate.length < 16 || candidate.length > 64) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(candidate)) return null;
  return candidate;
}

// Re-exports used by adjacent modules
export { hashAccessKey };
