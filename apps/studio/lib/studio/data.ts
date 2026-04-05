import "server-only";

import { getStudioCatalog } from "@/lib/studio/catalog";
import { getStudioSnapshot, getStudioProjectById, getStudioProposalById } from "@/lib/studio/store";
import type {
  StudioLead,
  StudioProject,
  StudioSnapshot,
  StudioViewer,
} from "@/lib/studio/types";

function matchesViewerEmail(viewer: StudioViewer | null | undefined, email?: string | null) {
  return Boolean(viewer?.normalizedEmail && email && viewer.normalizedEmail === email);
}

function viewerOwnsLead(viewer: StudioViewer | null | undefined, lead: StudioLead | null | undefined) {
  if (!viewer || !lead) return false;
  return Boolean(
    (viewer.user?.id && lead.userId === viewer.user.id) ||
      matchesViewerEmail(viewer, lead.normalizedEmail)
  );
}

export function studioClientSnapshot(viewer: StudioViewer, snapshot: StudioSnapshot) {
  const leads = snapshot.leads.filter((lead) => viewerOwnsLead(viewer, lead));
  const leadIds = new Set(leads.map((lead) => lead.id));
  const proposals = snapshot.proposals.filter((proposal) => leadIds.has(proposal.leadId));
  const proposalIds = new Set(proposals.map((proposal) => proposal.id));
  const projects = snapshot.projects.filter(
    (project) =>
      proposalIds.has(project.proposalId) ||
      (viewer.user?.id && project.clientUserId === viewer.user.id) ||
      matchesViewerEmail(viewer, project.normalizedEmail)
  );
  const projectIds = new Set(projects.map((project) => project.id));

  return {
    leads,
    proposals,
    projects,
    payments: snapshot.payments.filter((payment) => projectIds.has(payment.projectId)),
    files: snapshot.files.filter((file) => projectIds.has(file.projectId) || leadIds.has(file.leadId || "")),
    deliverables: snapshot.deliverables.filter((item) => projectIds.has(item.projectId)),
    revisions: snapshot.revisions.filter((item) => projectIds.has(item.projectId)),
    messages: snapshot.messages.filter((item) => projectIds.has(item.projectId)),
    notifications: snapshot.notifications,
    reviews: snapshot.reviews.filter((item) => projectIds.has(item.projectId)),
    supportThreads: (snapshot.supportThreads ?? []).filter((thread) => viewer.user?.id === thread.userId),
    supportMessages: (snapshot.supportMessages ?? []).filter((message) =>
      (snapshot.supportThreads ?? []).some(
        (thread) => thread.id === message.threadId && viewer.user?.id === thread.userId
      )
    ),
  };
}

function isStaff(viewer: StudioViewer | null | undefined) {
  return Boolean(
    viewer?.roles.some((role) =>
      [
        "studio_owner",
        "sales_consultation",
        "project_manager",
        "developer_designer",
        "client_success",
        "finance",
      ].includes(role)
    )
  );
}

export async function getProposalWorkspace(input: {
  proposalId: string;
  accessKey?: string | null;
  viewer?: StudioViewer | null;
  snapshot?: StudioSnapshot;
}) {
  const snapshot = input.snapshot ?? (await getStudioSnapshot());
  const catalog = await getStudioCatalog({ includeUnpublished: true });
  const direct = await getStudioProposalById(input.proposalId, input.accessKey);
  const proposal =
    direct ?? snapshot.proposals.find((item) => item.id === input.proposalId) ?? null;

  if (!proposal) return null;

  const lead = snapshot.leads.find((item) => item.id === proposal.leadId) ?? null;
  const hasVerifiedAccess = Boolean(direct && input.accessKey);
  const viewerAllowed =
    hasVerifiedAccess ||
    isStaff(input.viewer) ||
    viewerOwnsLead(input.viewer, lead);

  if (!viewerAllowed) return null;

  return {
    proposal,
    lead,
    brief: snapshot.briefs.find((item) => item.leadId === proposal.leadId) ?? null,
    customRequest:
      (snapshot.customRequests ?? []).find((item) => item.leadId === proposal.leadId) ?? null,
    service: catalog.services.find((item) => item.id === proposal.serviceId) ?? null,
    package: catalog.packages.find((item) => item.id === proposal.packageId) ?? null,
    team: catalog.teams.find((item) => item.id === proposal.teamId) ?? null,
    project: snapshot.projects.find((item) => item.proposalId === proposal.id) ?? null,
    platform: catalog.platform,
    requestConfig: catalog.requestConfig,
  };
}

export async function getProjectWorkspace(input: {
  projectId: string;
  accessKey?: string | null;
  viewer?: StudioViewer | null;
  snapshot?: StudioSnapshot;
}) {
  const snapshot = input.snapshot ?? (await getStudioSnapshot());
  const catalog = await getStudioCatalog({ includeUnpublished: true });
  const direct = await getStudioProjectById(input.projectId, input.accessKey);
  const project =
    direct ?? snapshot.projects.find((item) => item.id === input.projectId) ?? null;

  if (!project) return null;

  const lead = snapshot.leads.find((item) => item.id === project.leadId) ?? null;
  const hasVerifiedAccess = Boolean(direct && input.accessKey);
  const viewerAllowed =
    hasVerifiedAccess ||
    isStaff(input.viewer) ||
    Boolean(
      (input.viewer?.user?.id && project.clientUserId === input.viewer.user.id) ||
        matchesViewerEmail(input.viewer, project.normalizedEmail) ||
        viewerOwnsLead(input.viewer, lead)
    );

  if (!viewerAllowed) return null;

  const payments = snapshot.payments.filter((item) => item.projectId === project.id);

  return {
    project,
    lead,
    proposal: snapshot.proposals.find((item) => item.id === project.proposalId) ?? null,
    brief: snapshot.briefs.find((item) => item.leadId === project.leadId) ?? null,
    customRequest:
      (snapshot.customRequests ?? []).find((item) => item.leadId === project.leadId) ?? null,
    service: catalog.services.find((item) => item.id === project.serviceId) ?? null,
    package: catalog.packages.find((item) => item.id === project.packageId) ?? null,
    team: catalog.teams.find((item) => item.id === project.teamId) ?? null,
    payments,
    files: snapshot.files.filter((item) => item.projectId === project.id),
    deliverables: snapshot.deliverables.filter((item) => item.projectId === project.id),
    revisions: snapshot.revisions.filter((item) => item.projectId === project.id),
    messages: snapshot.messages.filter((item) => item.projectId === project.id),
    updates: (snapshot.projectUpdates ?? []).filter((item) => item.projectId === project.id),
    reviews: snapshot.reviews.filter((item) => item.projectId === project.id),
    platform: catalog.platform,
    requestConfig: catalog.requestConfig,
  };
}

export function getProjectHealth(project: StudioProject, payments: StudioSnapshot["payments"]) {
  const projectPayments = payments.filter((item) => item.projectId === project.id);
  const paidCount = projectPayments.filter((item) => item.status === "paid").length;
  const reviewCount = project.milestones.filter((item) => item.status === "ready_for_review").length;
  const total = project.milestones.length || 1;

  return {
    milestoneCompletion: Math.round(
      (project.milestones.filter((item) => item.status === "approved").length / total) * 100
    ),
    paidCount,
    paymentCount: projectPayments.length,
    reviewCount,
  };
}
