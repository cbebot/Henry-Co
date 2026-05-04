import "server-only";

import { after } from "next/server";
import { normalizeEmail } from "@/lib/env";
import { getStudioCatalog } from "@/lib/studio/catalog";
import {
  addStudioNotificationRecord,
  sendDepositReceivedNotifications,
  sendFinalDeliveryNotifications,
  sendInquiryNotifications,
  sendMilestoneReadyNotifications,
  sendPaymentInstructionsNotifications,
  sendProjectUpdateNotifications,
  sendProjectStartedNotifications,
  sendProposalDecisionNotifications,
  sendProposalNotifications,
  sendRevisionCompletedNotifications,
  sendRevisionRequestedNotifications,
} from "@/lib/studio/email/send";
import {
  buildMilestoneAmounts,
  estimateStudioPricing,
} from "@/lib/studio/pricing";
import {
  normalizeStudioRequestConfig,
  type StudioRequestConfig,
} from "@/lib/studio/request-config";
import {
  asNumber,
  cleanText,
  createAccessKey,
  createId,
  getStudioSnapshot,
  plusDays,
  upsertStudioCollectionRecord,
  upsertStudioRecord,
  uploadStudioFile,
  type UpsertMeta,
} from "@/lib/studio/store";
import type {
  StudioAssignment,
  StudioBrief,
  StudioCustomRequest,
  StudioDomainIntent,
  StudioLead,
  StudioPackage,
  StudioPayment,
  StudioProject,
  StudioProjectFile,
  StudioProjectMilestone,
  StudioProjectUpdate,
  StudioProposal,
  StudioRevision,
  StudioReview,
  StudioServiceKind,
  StudioService,
  StudioTeamProfile,
} from "@/lib/studio/types";

export type SubmitStudioBriefInput = {
  userId?: string | null;
  customerName: string;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  serviceKind: StudioServiceKind;
  businessType: string;
  budgetBand: string;
  urgency: string;
  timeline: string;
  goals: string;
  scopeNotes: string;
  packageIntent: "package" | "custom";
  packageId?: string | null;
  preferredTeamId?: string | null;
  referenceLinks?: string[];
  techPreferences?: string[];
  requiredFeatures?: string[];
  projectType?: string | null;
  platformPreference?: string | null;
  preferredLanguage?: string | null;
  /** Programming language preferred for the build (e.g. TypeScript, Python). */
  programmingLanguage?: string | null;
  /** Frontend / app framework preference. */
  frameworkPreference?: string | null;
  /** Backend / data platform preference. */
  backendPreference?: string | null;
  /** Hosting / deployment preference. */
  hostingPreference?: string | null;
  designDirection?: string | null;
  pageRequirements?: string[];
  addonServices?: string[];
  inspirationSummary?: string | null;
  depositNow?: boolean;
  files?: File[];
  domainIntent?: StudioDomainIntent | null;
};

function serviceByKind(kind: StudioServiceKind, services: StudioService[]) {
  return services.find((service) => service.kind === kind) ?? services[0];
}

function packageById(packageId: string | null | undefined, packages: StudioPackage[]) {
  return packages.find((item) => item.id === packageId) ?? null;
}

function domainIntentBullet(intent: StudioDomainIntent | null | undefined): string | null {
  if (!intent) return null;
  if (intent.path === "have") {
    const d = cleanText(intent.desiredLabel);
    return d
      ? `Domain: connect existing ${d} at launch`
      : "Domain: client will connect an existing domain at launch";
  }
  if (intent.path === "later") {
    return "Domain: choose with HenryCo before go-live";
  }
  const label = cleanText(intent.desiredLabel) || "preferred name TBD";
  const backup = cleanText(intent.backupLabel);
  const fq = intent.checkedFqdn ? ` (${intent.checkedFqdn})` : "";
  const st = cleanText(intent.checkStatus).replace(/_/g, " ");
  const backupBit = backup ? `; backup idea: ${backup}` : "";
  return `Domain intent${fq}: ${label}${backupBit} — ${st || "advisory"}`;
}

function scoreReadiness(input: SubmitStudioBriefInput) {
  let score = 48;
  if (cleanText(input.goals).length > 80) score += 12;
  if (cleanText(input.scopeNotes).length > 40) score += 8;
  if ((input.requiredFeatures ?? []).length >= 3) score += 8;
  if ((input.referenceLinks ?? []).length > 0 || (input.files ?? []).length > 0) score += 10;
  if (cleanText(input.timeline)) score += 4;
  if (cleanText(input.budgetBand)) score += 6;
  if (cleanText(input.companyName)) score += 4;
  const di = input.domainIntent;
  if (di?.path === "new" && cleanText(di.desiredLabel).length > 2) score += 4;
  if (di?.path === "have") score += 3;
  if (di?.path === "later") score += 2;
  return Math.min(score, 100);
}

function pickTeam(input: SubmitStudioBriefInput, teams: StudioTeamProfile[]) {
  if (input.preferredTeamId) {
    return teams.find((team) => team.id === input.preferredTeamId) ?? teams[0];
  }

  const scoreTerms = [
    input.serviceKind,
    input.businessType,
    input.scopeNotes,
    input.goals,
    ...(input.requiredFeatures ?? []),
    ...(input.techPreferences ?? []),
  ]
    .join(" ")
    .toLowerCase();

  const ranked = teams
    .map((team) => ({
      team,
      score: team.scoreBiases.reduce(
        (sum, term) => sum + (scoreTerms.includes(term.toLowerCase()) ? 3 : 0),
        0
      ),
    }))
    .sort((left, right) => right.score - left.score);

  return ranked[0]?.team ?? teams[0];
}

function buildMilestonePlan(projectId: string, investment: number, depositRate: number) {
  const { deposit, foundation, production, delivery } = buildMilestoneAmounts(
    investment,
    depositRate
  );

  const milestones: StudioProjectMilestone[] = [
    {
      id: createId(),
      projectId,
      name: "Deposit and onboarding",
      description: "Secure the slot, confirm scope, and unlock the operating workspace.",
      dueLabel: "Immediately after acceptance",
      amount: deposit,
      status: "planned",
    },
    {
      id: createId(),
      projectId,
      name: "Design and system foundation",
      description: "Direction, architecture, interface systems, and sign-off on the build lane.",
      dueLabel: "Week 2 to 3",
      amount: foundation,
      status: "planned",
    },
    {
      id: createId(),
      projectId,
      name: "Build and integration sprint",
      description: "Production build, integrations, quality pass, and milestone review.",
      dueLabel: "Week 4 to 6",
      amount: production,
      status: "planned",
    },
    {
      id: createId(),
      projectId,
      name: "Delivery and launch handoff",
      description: "Final adjustments, deployment, handoff assets, and approval closeout.",
      dueLabel: "Final review",
      amount: delivery,
      status: "planned",
    },
  ];

  return {
    proposalMilestones: milestones.map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      description: item.description,
      dueLabel: item.dueLabel,
    })),
    projectMilestones: milestones,
  };
}

function buildAssignments(projectId: string, teamId: string): StudioAssignment[] {
  return [
    {
      id: createId(),
      projectId,
      teamId,
      role: "lead",
      label: "Lead delivery team",
    },
  ];
}

function slugifyText(value: string) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function appendProjectUpdate(projectId: string, kind: string, title: string, summary: string) {
  const update: StudioProjectUpdate = {
    id: createId(),
    projectId,
    createdAt: new Date().toISOString(),
    kind,
    title: cleanText(title),
    summary: cleanText(summary),
  };

  await upsertStudioCollectionRecord("studio_project_updates", {
    id: update.id,
    project_id: update.projectId,
    created_at: update.createdAt,
    kind: update.kind,
    title: update.title,
    summary: update.summary,
    description: update.summary,
    metadata: {
      kind: update.kind,
      summary: update.summary,
    },
  });

  return update;
}

async function writeUploadRecords(
  projectId: string,
  files: File[],
  kind: StudioProjectFile["kind"],
  meta?: UpsertMeta
) {
  const uploadedPaths: string[] = [];

  for (const file of files) {
    const uploaded = await uploadStudioFile(projectId, kind, file);
    if (!uploaded) continue;
    uploadedPaths.push(uploaded.path);
    await upsertStudioRecord("studio_file_upsert", uploaded, meta);
  }

  return uploadedPaths;
}

export async function submitStudioBrief(input: SubmitStudioBriefInput) {
  const now = new Date();
  const catalog = await getStudioCatalog({ includeUnpublished: true });
  const services = catalog.services.length > 0 ? catalog.services : [];
  const packages = catalog.packages.length > 0 ? catalog.packages : [];
  const teams = catalog.teams.length > 0 ? catalog.teams : [];
  const service = serviceByKind(input.serviceKind, services);
  const pkg = packageById(input.packageId, packages);
  if (input.packageIntent === "package" && !pkg) {
    throw new Error("Selected package is no longer available for this service.");
  }
  const team = pickTeam(input, teams);
  const leadId = createId();
  const briefId = createId();
  const customRequestId = createId();
  const proposalId = createId();
  const projectId = createId();
  const draftCustomRequest =
    input.packageIntent === "custom"
      ? {
          projectType: cleanText(input.projectType) || service.name,
          platformPreference:
            cleanText(input.platformPreference) || "Best-fit recommendation",
          designDirection: cleanText(input.designDirection) || "Premium modern",
          pageRequirements: input.pageRequirements ?? [],
          addonServices: input.addonServices ?? [],
          inspirationSummary: cleanText(input.inspirationSummary),
        }
      : null;
  const readinessScore = scoreReadiness(input);
  const pricing = estimateStudioPricing({
    service,
    package: input.packageIntent === "package" ? pkg : null,
    brief: {
      requiredFeatures: input.requiredFeatures ?? [],
      urgency: input.urgency,
      timeline: input.timeline,
    },
    customRequest: draftCustomRequest,
    techStack: {
      framework: input.frameworkPreference ?? null,
      backend: input.backendPreference ?? null,
    },
  }, catalog.requestConfig);
  const investment = pricing.total;
  const { proposalMilestones, projectMilestones } = buildMilestonePlan(
    projectId,
    investment,
    pricing.depositRate
  );
  const meta: UpsertMeta = {
    userId: input.userId,
    email: input.email,
    role: "client",
  };

  const referenceFiles = await writeUploadRecords(leadId, input.files ?? [], "reference", meta);

  const lead: StudioLead = {
    id: leadId,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    userId: input.userId ?? null,
    normalizedEmail: normalizeEmail(input.email),
    customerName: cleanText(input.customerName),
    companyName: cleanText(input.companyName) || null,
    phone: cleanText(input.phone) || null,
    serviceKind: input.serviceKind,
    status: input.depositNow ? "won" : "proposal_sent",
    readinessScore,
    businessType: cleanText(input.businessType),
    budgetBand: cleanText(input.budgetBand),
    urgency: cleanText(input.urgency),
    requestedPackageId: pkg?.id ?? null,
    preferredTeamId: input.preferredTeamId ?? null,
    matchedTeamId: team.id,
  };

  const brief: StudioBrief = {
    id: briefId,
    leadId,
    createdAt: now.toISOString(),
    goals: cleanText(input.goals),
    scopeNotes: cleanText(input.scopeNotes),
    businessType: cleanText(input.businessType),
    budgetBand: cleanText(input.budgetBand),
    urgency: cleanText(input.urgency),
    timeline: cleanText(input.timeline),
    packageIntent: input.packageIntent,
    techPreferences: input.techPreferences ?? [],
    requiredFeatures: input.requiredFeatures ?? [],
    referenceFiles,
    referenceLinks: input.referenceLinks ?? [],
    domainIntent: input.domainIntent ?? null,
  };

  const customRequest: StudioCustomRequest | null =
    input.packageIntent === "custom"
      ? {
          id: customRequestId,
          leadId,
          createdAt: now.toISOString(),
          projectType: draftCustomRequest?.projectType || service.name,
          platformPreference:
            draftCustomRequest?.platformPreference || "Best-fit recommendation",
          designDirection: draftCustomRequest?.designDirection || "Premium modern",
          pageRequirements: draftCustomRequest?.pageRequirements ?? [],
          addonServices: draftCustomRequest?.addonServices ?? [],
          inspirationSummary: draftCustomRequest?.inspirationSummary || "",
        }
      : null;

  const domainLine = domainIntentBullet(input.domainIntent);

  const proposal: StudioProposal = {
    id: proposalId,
    leadId,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    accessKey: createAccessKey(`proposal:${proposalId}`),
    status: input.depositNow ? "accepted" : "sent",
    title: `${service.name} scope for ${lead.companyName || lead.customerName}`,
    summary:
      pkg?.summary ||
      `${service.name} scoped around ${lead.businessType.toLowerCase()}, ${lead.urgency.toLowerCase()} urgency, and a ${lead.budgetBand.toLowerCase()} budget lane.`,
    investment,
    depositAmount: pricing.depositAmount,
    currency: "NGN",
    validUntil: plusDays(now, 7),
    teamId: team.id,
    serviceId: service.id,
    packageId: pkg?.id ?? null,
    scopeBullets: [
      `Primary goal: ${brief.goals}`,
      `Recommended team: ${team.name}`,
      `Delivery lane: ${service.deliveryWindow}`,
      `Required features: ${(brief.requiredFeatures.length > 0 ? brief.requiredFeatures : ["Tailored scope refinement"]).join(", ")}`,
      ...(domainLine ? [domainLine] : []),
      ...(customRequest
        ? [
            `Project type: ${customRequest.projectType}`,
            `Platform preference: ${customRequest.platformPreference}`,
            ...(cleanText(input.preferredLanguage)
              ? [`Content language: ${cleanText(input.preferredLanguage)}`]
              : []),
            ...(cleanText(input.programmingLanguage)
              ? [`Programming language: ${cleanText(input.programmingLanguage)}`]
              : []),
            ...(cleanText(input.frameworkPreference)
              ? [`Framework: ${cleanText(input.frameworkPreference)}`]
              : []),
            ...(cleanText(input.backendPreference)
              ? [`Backend: ${cleanText(input.backendPreference)}`]
              : []),
            ...(cleanText(input.hostingPreference)
              ? [`Hosting: ${cleanText(input.hostingPreference)}`]
              : []),
            `Design direction: ${customRequest.designDirection}`,
          ]
        : []),
    ],
    milestones: proposalMilestones,
    comparisonNotes: [
      "The price is built from scope, platform complexity, and timing instead of a vague lump sum.",
      "The first payment matches the deposit checkpoint shown in the milestone rail.",
      "The same commercial record continues into finance, delivery, files, revisions, and support.",
    ],
  };

  await upsertStudioRecord("studio_lead_upsert", lead, meta);
  await upsertStudioRecord("studio_brief_upsert", brief, meta);
  if (customRequest) {
    await upsertStudioCollectionRecord("studio_custom_requests", {
      id: customRequest.id,
      lead_id: customRequest.leadId,
      created_at: customRequest.createdAt,
      project_type: customRequest.projectType,
      platform_preference: customRequest.platformPreference,
      design_direction: customRequest.designDirection,
      page_requirements: customRequest.pageRequirements,
      addon_services: customRequest.addonServices,
      inspiration_summary: customRequest.inspirationSummary,
      brief_id: brief.id,
      user_id: input.userId ?? null,
      status: "pending",
      title: customRequest.projectType,
      description: customRequest.designDirection,
      priority: "normal",
      updated_at: customRequest.createdAt,
      metadata: {
        lead_id: customRequest.leadId,
        created_at: customRequest.createdAt,
        project_type: customRequest.projectType,
        platform_preference: customRequest.platformPreference,
        design_direction: customRequest.designDirection,
        page_requirements: customRequest.pageRequirements,
        addon_services: customRequest.addonServices,
        inspiration_summary: customRequest.inspirationSummary,
      },
    });
  }
  await upsertStudioRecord("studio_proposal_upsert", proposal, meta);

  let project: StudioProject | null = null;
  let payment: StudioPayment | null = null;

  if (input.depositNow) {
    project = {
      id: projectId,
      proposalId,
      leadId,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      accessKey: createAccessKey(`project:${projectId}`),
      clientUserId: lead.userId,
      normalizedEmail: lead.normalizedEmail,
      status: "pending_deposit",
      title: proposal.title,
      summary: proposal.summary,
      nextAction: "Upload deposit proof or confirm transfer so onboarding can begin.",
      serviceId: proposal.serviceId,
      packageId: proposal.packageId,
      teamId: proposal.teamId,
      confidence: lead.readinessScore,
      assignments: buildAssignments(projectId, team.id),
      milestones: projectMilestones,
    };

    payment = {
      id: createId(),
      projectId,
      milestoneId: projectMilestones[0]?.id ?? null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      label: "Deposit",
      amount: proposal.depositAmount,
      currency: proposal.currency,
      status: "requested",
      dueDate: plusDays(now, 3),
      method: "bank_transfer",
      proofUrl: null,
      proofName: null,
    };

    await upsertStudioRecord("studio_project_upsert", project, meta);
    await upsertStudioRecord("studio_payment_upsert", payment, {
      ...meta,
      role: "finance",
    });
    await appendProjectUpdate(
      project.id,
      "project_created",
      "Project workspace opened",
      "Studio opened the project workspace and requested the deposit needed to begin onboarding."
    );
  }

  // Notifications are side effects — don't block the user's redirect on
  // them. Three sequential awaits used to add 3-9s to the perceived
  // submit time. With `after()` they run after the response is flushed,
  // so the brief author lands on their project/proposal page in <1s.
  // Errors here are logged but not surfaced — the brief is already
  // safely persisted by the upserts above.
  after(async () => {
    try {
      await Promise.all([
        sendInquiryNotifications({ lead, proposal, project }),
        sendProposalNotifications({ lead, proposal, project, teamName: team.name }),
        project && payment
          ? sendPaymentInstructionsNotifications({ lead, proposal, project, payment })
          : Promise.resolve(),
      ]);
    } catch {
      // notifications fail-safe — user already submitted successfully.
    }
  });

  return { lead, brief, proposal, project, payment };
}

export async function setProposalStatus(proposalId: string, status: StudioProposal["status"]) {
  const snapshot = await getStudioSnapshot();
  const proposal = snapshot.proposals.find((item) => item.id === proposalId);
  if (!proposal) throw new Error("Proposal not found.");

  const updated: StudioProposal = {
    ...proposal,
    status,
    updatedAt: new Date().toISOString(),
  };

  await upsertStudioRecord("studio_proposal_upsert", updated, {
    email: snapshot.leads.find((lead) => lead.id === proposal.leadId)?.normalizedEmail,
    role: "sales_consultation",
  });

  const lead = snapshot.leads.find((item) => item.id === proposal.leadId);
  if (lead && (status === "accepted" || status === "rejected")) {
    await sendProposalDecisionNotifications({
      lead,
      proposal: updated,
      decision: status,
    });
  }

  return updated;
}

export async function setLeadStatus(leadId: string, status: StudioLead["status"]) {
  const snapshot = await getStudioSnapshot();
  const lead = snapshot.leads.find((item) => item.id === leadId);
  if (!lead) throw new Error("Lead not found.");

  const updated: StudioLead = {
    ...lead,
    status,
    updatedAt: new Date().toISOString(),
  };

  await upsertStudioRecord("studio_lead_upsert", updated, {
    userId: updated.userId,
    email: updated.normalizedEmail,
    role: "sales_consultation",
  });

  return updated;
}

export async function createProjectFromProposal(proposalId: string) {
  const snapshot = await getStudioSnapshot();
  const catalog = await getStudioCatalog({ includeUnpublished: true });
  const proposal = snapshot.proposals.find((item) => item.id === proposalId);
  if (!proposal) throw new Error("Proposal not found.");

  const lead = snapshot.leads.find((item) => item.id === proposal.leadId);
  if (!lead) throw new Error("Lead not found.");

  const existing = snapshot.projects.find((item) => item.proposalId === proposal.id);
  if (existing) return existing;

  const projectId = createId();
  const teamId = proposal.teamId || catalog.teams[0]?.id || null;
  if (!teamId) throw new Error("Studio team catalog is not available.");
  const milestones = proposal.milestones.map((milestone) => ({
    id: milestone.id,
    projectId,
    name: milestone.name,
    description: milestone.description,
    dueLabel: milestone.dueLabel,
    amount: milestone.amount,
    status: "planned" as const,
  }));

  const project: StudioProject = {
    id: projectId,
    proposalId: proposal.id,
    leadId: proposal.leadId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    accessKey: createAccessKey(`project:${projectId}`),
    clientUserId: lead.userId,
    normalizedEmail: lead.normalizedEmail,
    status: "pending_deposit",
    title: proposal.title,
    summary: proposal.summary,
    nextAction: "Deposit confirmation is required before active delivery starts.",
    serviceId: proposal.serviceId,
    packageId: proposal.packageId,
    teamId,
    confidence: lead.readinessScore,
    assignments: buildAssignments(projectId, teamId),
    milestones,
  };

  const payment: StudioPayment = {
    id: createId(),
    projectId,
    milestoneId: milestones[0]?.id ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    label: "Deposit",
    amount: proposal.depositAmount,
    currency: proposal.currency,
    status: "requested",
    dueDate: plusDays(new Date(), 3),
    method: "bank_transfer",
    proofUrl: null,
    proofName: null,
  };

  await upsertStudioRecord("studio_project_upsert", project, {
    userId: lead.userId,
    email: lead.normalizedEmail,
    role: "sales_consultation",
  });
  await upsertStudioRecord("studio_payment_upsert", payment, {
    userId: lead.userId,
    email: lead.normalizedEmail,
    role: "finance",
  });

  const acceptedProposal: StudioProposal = {
    ...proposal,
    status: "accepted",
    updatedAt: new Date().toISOString(),
  };
  await upsertStudioRecord("studio_proposal_upsert", acceptedProposal, {
    userId: lead.userId,
    email: lead.normalizedEmail,
    role: "sales_consultation",
  });

  await sendPaymentInstructionsNotifications({
    lead,
    proposal: acceptedProposal,
    project,
    payment,
  });
  await appendProjectUpdate(
    project.id,
    "project_created",
    "Project created from proposal",
    "Sales converted the accepted proposal into a pending-deposit Studio workspace."
  );
  return project;
}

export async function setPaymentStatus(input: {
  paymentId: string;
  status: StudioPayment["status"];
  proofUrl?: string | null;
  proofName?: string | null;
}) {
  const snapshot = await getStudioSnapshot();
  const payment = snapshot.payments.find((item) => item.id === input.paymentId);
  if (!payment) throw new Error("Payment record not found.");

  const updatedPayment: StudioPayment = {
    ...payment,
    status: input.status,
    proofUrl: input.proofUrl ?? payment.proofUrl,
    proofName: input.proofName ?? payment.proofName,
    updatedAt: new Date().toISOString(),
  };
  await upsertStudioRecord("studio_payment_upsert", updatedPayment, { role: "finance" });

  const project = snapshot.projects.find((item) => item.id === payment.projectId);
  if (!project) return updatedPayment;

  if (input.status === "paid" && project.status === "pending_deposit") {
    const milestones = project.milestones.map((milestone, index) =>
      index === 0 ? { ...milestone, status: "approved" as const } : milestone
    );
    const nextIndex = milestones.findIndex((milestone) => milestone.status === "planned");
    if (nextIndex >= 0) {
      milestones[nextIndex] = { ...milestones[nextIndex], status: "in_progress" };
    }

    const updatedProject: StudioProject = {
      ...project,
      status: "active",
      nextAction: "HenryCo Studio has moved the project into active delivery.",
      milestones,
      updatedAt: new Date().toISOString(),
    };

    await upsertStudioRecord("studio_project_upsert", updatedProject, {
      userId: project.clientUserId,
      email: project.normalizedEmail,
      role: "finance",
    });
    await appendProjectUpdate(
      updatedProject.id,
      "payment_confirmed",
      "Deposit confirmed",
      "Finance confirmed the deposit and Studio moved the project into active delivery."
    );

    const lead = snapshot.leads.find((item) => item.id === project.leadId);
    const proposal = snapshot.proposals.find((item) => item.id === project.proposalId);

    if (lead && proposal) {
      await sendDepositReceivedNotifications({
        lead,
        proposal,
        project: updatedProject,
        payment: updatedPayment,
      });
      await sendProjectStartedNotifications({
        lead,
        proposal,
        project: updatedProject,
        payment: updatedPayment,
      });
    }
  }

  return updatedPayment;
}

export async function attachPaymentProof(paymentId: string, file: File) {
  const snapshot = await getStudioSnapshot();
  const payment = snapshot.payments.find((item) => item.id === paymentId);
  if (!payment) throw new Error("Payment record not found.");

  const uploaded = await uploadStudioFile(payment.projectId, "proof", file);
  if (!uploaded) throw new Error("Proof upload failed.");

  await upsertStudioRecord("studio_file_upsert", uploaded, { role: "client" });

  return setPaymentStatus({
    paymentId,
    status: "processing",
    proofUrl: `${uploaded.bucket}/${uploaded.path}`,
    proofName: uploaded.label,
  });
}

export async function setMilestoneStatus(input: {
  projectId: string;
  milestoneId: string;
  status: StudioProjectMilestone["status"];
}) {
  const snapshot = await getStudioSnapshot();
  const project = snapshot.projects.find((item) => item.id === input.projectId);
  if (!project) throw new Error("Project not found.");

  const milestones = project.milestones.map((milestone) =>
    milestone.id === input.milestoneId ? { ...milestone, status: input.status } : milestone
  );
  const allApproved = milestones.every((milestone) => milestone.status === "approved");

  const updatedProject: StudioProject = {
    ...project,
    milestones,
    status: allApproved ? "delivered" : input.status === "ready_for_review" ? "in_review" : project.status,
    nextAction: allApproved
      ? "Final delivery is ready for approval."
      : input.status === "ready_for_review"
        ? "Client review is now expected on the current milestone."
        : project.nextAction,
    updatedAt: new Date().toISOString(),
  };

  await upsertStudioRecord("studio_project_upsert", updatedProject, {
    userId: project.clientUserId,
    email: project.normalizedEmail,
    role: "project_manager",
  });

  const lead = snapshot.leads.find((item) => item.id === project.leadId);
  const proposal = snapshot.proposals.find((item) => item.id === project.proposalId);
  const milestone = milestones.find((item) => item.id === input.milestoneId) ?? null;

  if (lead && proposal && milestone && input.status === "ready_for_review") {
    await appendProjectUpdate(
      updatedProject.id,
      "milestone_ready",
      `${milestone.name} ready for review`,
      "The active milestone is now waiting for client review."
    );
    await sendMilestoneReadyNotifications({
      lead,
      proposal,
      project: updatedProject,
      milestone,
    });
  }

  if (lead && proposal && milestone && allApproved) {
    await appendProjectUpdate(
      updatedProject.id,
      "final_delivery",
      "Final delivery ready",
      "All milestones are approved and the project has entered final delivery."
    );
    await sendFinalDeliveryNotifications({
      lead,
      proposal,
      project: updatedProject,
      milestone,
    });
  }

  return updatedProject;
}

export async function appendProjectMessage(input: {
  projectId: string;
  sender: string;
  senderRole: string;
  body: string;
  isInternal?: boolean;
}) {
  const message = {
    id: createId(),
    projectId: input.projectId,
    createdAt: new Date().toISOString(),
    sender: cleanText(input.sender),
    senderRole: cleanText(input.senderRole),
    body: cleanText(input.body),
    isInternal: Boolean(input.isInternal),
  };

  await upsertStudioRecord("studio_message_append", message, {
    role: input.senderRole,
  });

  return message;
}

export async function addDeliverable(input: {
  projectId: string;
  label: string;
  summary: string;
  files: File[];
}) {
  const fileIds: string[] = [];
  for (const file of input.files) {
    const uploaded = await uploadStudioFile(input.projectId, "deliverable", file);
    if (!uploaded) continue;
    fileIds.push(uploaded.id);
    await upsertStudioRecord("studio_file_upsert", uploaded, { role: "developer_designer" });
  }

  const deliverable = {
    id: createId(),
    projectId: input.projectId,
    createdAt: new Date().toISOString(),
    label: cleanText(input.label),
    summary: cleanText(input.summary),
    fileIds,
    status: "shared" as const,
  };

  await upsertStudioRecord("studio_deliverable_upsert", deliverable, {
    role: "developer_designer",
  });

  await addStudioNotificationRecord({
    entityId: input.projectId,
    channel: "email",
    templateKey: "deliverable_shared",
    recipient: "project",
    subject: `Deliverable shared • ${deliverable.label}`,
    status: "queued",
    reason: null,
  });

  return deliverable;
}

export async function createRevision(input: {
  projectId: string;
  summary: string;
  requestedBy: StudioRevision["requestedBy"];
}) {
  const revision: StudioRevision = {
    id: createId(),
    projectId: input.projectId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    requestedBy: input.requestedBy,
    summary: cleanText(input.summary),
    status: "open",
  };

  await upsertStudioRecord("studio_revision_upsert", revision, {
    role: input.requestedBy === "client" ? "client" : "project_manager",
  });

  const snapshot = await getStudioSnapshot();
  const project = snapshot.projects.find((item) => item.id === input.projectId);
  const lead = snapshot.leads.find((item) => item.id === project?.leadId);
  const proposal = snapshot.proposals.find((item) => item.id === project?.proposalId);
  if (lead && proposal && project) {
    await sendRevisionRequestedNotifications({ lead, proposal, project, revision });
  }

  return revision;
}

export async function completeRevision(revisionId: string) {
  const snapshot = await getStudioSnapshot();
  const revision = snapshot.revisions.find((item) => item.id === revisionId);
  if (!revision) throw new Error("Revision not found.");

  const updated: StudioRevision = {
    ...revision,
    status: "completed",
    updatedAt: new Date().toISOString(),
  };

  await upsertStudioRecord("studio_revision_upsert", updated, {
    role: "project_manager",
  });

  const project = snapshot.projects.find((item) => item.id === revision.projectId);
  const lead = snapshot.leads.find((item) => item.id === project?.leadId);
  const proposal = snapshot.proposals.find((item) => item.id === project?.proposalId);
  if (lead && proposal && project) {
    await sendRevisionCompletedNotifications({ lead, proposal, project, revision: updated });
  }

  return updated;
}

export async function publishReview(input: {
  projectId: string;
  customerName: string;
  rating: number;
  quote: string;
  company?: string | null;
}) {
  const review: StudioReview = {
    id: createId(),
    projectId: input.projectId,
    createdAt: new Date().toISOString(),
    customerName: cleanText(input.customerName),
    rating: Math.max(1, Math.min(5, Math.round(asNumber(input.rating, 5)))),
    quote: cleanText(input.quote),
    company: cleanText(input.company) || null,
    published: true,
  };

  await upsertStudioRecord("studio_review_upsert", review, { role: "client" });
  return review;
}

export async function createProjectUpdate(input: {
  projectId: string;
  kind: string;
  title: string;
  summary: string;
  notifyClient?: boolean;
}) {
  const snapshot = await getStudioSnapshot();
  const project = snapshot.projects.find((item) => item.id === input.projectId);
  if (!project) throw new Error("Project not found.");

  const update = await appendProjectUpdate(
    project.id,
    slugifyText(input.kind) || "manual_update",
    input.title,
    input.summary
  );

  if (input.notifyClient) {
    const lead = snapshot.leads.find((item) => item.id === project.leadId);
    if (lead) {
      await sendProjectUpdateNotifications({
        lead,
        project,
        update,
      });
    }
  }

  return update;
}

export async function saveStudioService(input: {
  id: string;
  kind: StudioServiceKind;
  name: string;
  headline: string;
  summary: string;
  startingPrice: number;
  deliveryWindow: string;
  stack: string[];
  outcomes: string[];
  scoreBoosts: string[];
  isPublished: boolean;
}) {
  const catalog = await getStudioCatalog({ includeUnpublished: true });
  const existing = catalog.services.find((item) => item.id === input.id);
  const now = new Date().toISOString();

  await upsertStudioCollectionRecord(
    "studio_services",
    {
      id: input.id,
      slug: slugifyText(input.name || input.kind),
      kind: input.kind,
      name: cleanText(input.name),
      headline: cleanText(input.headline),
      summary: cleanText(input.summary),
      starting_price: Math.max(0, Math.round(asNumber(input.startingPrice))),
      delivery_window: cleanText(input.deliveryWindow),
      stack: input.stack,
      outcomes: input.outcomes,
      score_boosts: input.scoreBoosts,
      is_published: input.isPublished,
      created_at: existing ? now : now,
      updated_at: now,
    },
    { role: "studio_owner" },
    { onConflict: "id" }
  );
}

export async function saveStudioPackage(input: {
  id: string;
  serviceId: string;
  name: string;
  summary: string;
  price: number;
  depositRate: number;
  timelineWeeks: number;
  bestFor: string;
  includes: string[];
  isPublished: boolean;
}) {
  const catalog = await getStudioCatalog({ includeUnpublished: true });
  const existing = catalog.packages.find((item) => item.id === input.id);
  const now = new Date().toISOString();

  await upsertStudioCollectionRecord(
    "studio_packages",
    {
      id: input.id,
      service_id: input.serviceId,
      slug: slugifyText(input.name || input.id),
      name: cleanText(input.name),
      summary: cleanText(input.summary),
      price: Math.max(0, Math.round(asNumber(input.price))),
      deposit_rate: Math.max(0.1, Math.min(0.9, Number(input.depositRate || 0.4))),
      timeline_weeks: Math.max(1, Math.round(asNumber(input.timelineWeeks, 1))),
      best_for: cleanText(input.bestFor),
      includes: input.includes,
      is_published: input.isPublished,
      created_at: existing ? now : now,
      updated_at: now,
    },
    { role: "studio_owner" },
    { onConflict: "id" }
  );
}

export async function saveStudioTeam(input: {
  id: string;
  name: string;
  label: string;
  summary: string;
  availability: StudioTeamProfile["availability"];
  focus: string[];
  industries: string[];
  stack: string[];
  highlights: string[];
  scoreBiases: string[];
  isPublished: boolean;
}) {
  const catalog = await getStudioCatalog({ includeUnpublished: true });
  const existing = catalog.teams.find((item) => item.id === input.id);
  const now = new Date().toISOString();

  await upsertStudioCollectionRecord(
    "studio_team_profiles",
    {
      id: input.id,
      slug: slugifyText(input.name || input.id),
      name: cleanText(input.name),
      label: cleanText(input.label),
      summary: cleanText(input.summary),
      availability: input.availability,
      focus: input.focus,
      industries: input.industries,
      stack: input.stack,
      highlights: input.highlights,
      score_biases: input.scoreBiases,
      is_published: input.isPublished,
      created_at: existing ? now : now,
      updated_at: now,
    },
    { role: "studio_owner" },
    { onConflict: "id" }
  );
}

export async function saveStudioPlatformSettings(input: {
  supportEmail: string;
  supportPhone: string;
  primaryCta: string;
  paymentBankName: string;
  paymentAccountName: string;
  paymentAccountNumber: string;
  paymentCurrency: string;
  paymentInstructions: string;
  paymentSupportEmail: string;
  paymentSupportWhatsApp: string;
  companyAccountName: string;
  companyAccountNumber: string;
  companyBankName: string;
  trustSignals: string[];
  process: string[];
}) {
  const catalog = await getStudioCatalog({ includeUnpublished: true });
  const now = new Date().toISOString();

  await upsertStudioCollectionRecord(
    "studio_settings",
    {
      key: "platform",
      value: {
        currency: cleanText(input.paymentCurrency) || catalog.platform.currency || "NGN",
        support_email: cleanText(input.supportEmail),
        support_phone: cleanText(input.supportPhone),
        primary_cta: cleanText(input.primaryCta),
        payment_bank_name: cleanText(input.paymentBankName) || null,
        payment_account_name: cleanText(input.paymentAccountName) || null,
        payment_account_number: cleanText(input.paymentAccountNumber) || null,
        payment_currency: cleanText(input.paymentCurrency) || "NGN",
        payment_instructions: cleanText(input.paymentInstructions) || null,
        payment_support_email: cleanText(input.paymentSupportEmail) || null,
        payment_support_whatsapp: cleanText(input.paymentSupportWhatsApp) || null,
        company_account_name: cleanText(input.companyAccountName) || null,
        company_account_number: cleanText(input.companyAccountNumber) || null,
        company_bank_name: cleanText(input.companyBankName) || null,
      },
      created_at: now,
      updated_at: now,
    },
    { role: "studio_owner" },
    { onConflict: "key", idKey: "key" }
  );

  await upsertStudioCollectionRecord(
    "studio_settings",
    {
      key: "public_trust_signals",
      value: input.trustSignals,
      created_at: now,
      updated_at: now,
    },
    { role: "studio_owner" },
    { onConflict: "key", idKey: "key" }
  );

  await upsertStudioCollectionRecord(
    "studio_settings",
    {
      key: "public_process",
      value: input.process,
      created_at: now,
      updated_at: now,
    },
    { role: "studio_owner" },
    { onConflict: "key", idKey: "key" }
  );
}

export async function saveStudioRequestConfig(input: StudioRequestConfig) {
  const now = new Date().toISOString();
  await upsertStudioCollectionRecord(
    "studio_settings",
    {
      key: "request_config",
      value: normalizeStudioRequestConfig(input),
      created_at: now,
      updated_at: now,
    },
    { role: "studio_owner" },
    { onConflict: "key", idKey: "key" }
  );
}
