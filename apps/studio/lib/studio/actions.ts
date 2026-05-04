"use server";

import { redirect } from "next/navigation";
import { getStudioAccountUrl, getStudioLoginUrl } from "@/lib/studio/links";
import { withStudioToast } from "@/lib/studio/redirect-with-toast";
import { hasPublicSupabaseEnv } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  getStudioViewer,
  requireStudioRoles,
  viewerHasRole,
} from "@/lib/studio/auth";
import { getProjectWorkspace } from "@/lib/studio/data";
import { getStudioSnapshot } from "@/lib/studio/store";
import { normalizeStudioRequestConfig } from "@/lib/studio/request-config";
import type { StudioDomainIntent, StudioRole } from "@/lib/studio/types";
import {
  addDeliverable,
  appendProjectMessage,
  completeRevision,
  createRevision,
  createProjectUpdate,
  attachPaymentProof,
  createProjectFromProposal,
  publishReview,
  saveStudioPackage,
  saveStudioPlatformSettings,
  saveStudioRequestConfig,
  saveStudioService,
  saveStudioTeam,
  setLeadStatus,
  setMilestoneStatus,
  setPaymentStatus,
  setProposalStatus,
  submitStudioBrief,
} from "@/lib/studio/workflows";

function asList(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

function asCsvList(formData: FormData, key: string) {
  return String(formData.get(key) || "")
    .split(/\r?\n|,/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function asBoolean(formData: FormData, key: string) {
  const value = String(formData.get(key) || "");
  return value === "on" || value === "true";
}

function parseDomainIntentFromForm(raw: string | null | undefined): StudioDomainIntent | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const path = o.path;
    if (path !== "new" && path !== "have" && path !== "later") return null;
    return {
      path,
      desiredLabel: String(o.desiredLabel ?? ""),
      backupLabel: o.backupLabel != null ? String(o.backupLabel) : undefined,
      checkedFqdn: o.checkedFqdn ? String(o.checkedFqdn) : null,
      checkStatus: String(o.checkStatus ?? ""),
      suggestionsShown: Array.isArray(o.suggestionsShown)
        ? (o.suggestionsShown as unknown[]).map((x) => String(x))
        : [],
      lookupMode: String(o.lookupMode ?? "off"),
      lastMessage: o.lastMessage != null ? String(o.lastMessage) : null,
    };
  } catch {
    return null;
  }
}

const studioStaffRoles: StudioRole[] = [
  "studio_owner",
  "sales_consultation",
  "project_manager",
  "developer_designer",
  "client_success",
  "finance",
];

async function requireProjectWorkspaceAccess(
  projectId: string,
  accessKey: string | null,
  nextPath: string
) {
  const viewer = await getStudioViewer();
  const workspace = await getProjectWorkspace({
    projectId,
    accessKey,
    viewer,
  });

  if (workspace) {
    return { viewer, workspace };
  }

  if (!viewer.user) {
    redirect(getStudioLoginUrl(nextPath));
  }

  redirect(getStudioAccountUrl());
}

async function requirePaymentWorkspaceAccess(
  paymentId: string,
  accessKey: string | null,
  nextPath: string
) {
  const snapshot = await getStudioSnapshot();
  const payment = snapshot.payments.find((item) => item.id === paymentId);
  if (!payment) {
    redirect(withStudioToast(nextPath, "payment_not_found"));
  }

  const access = await requireProjectWorkspaceAccess(payment.projectId, accessKey, nextPath);
  return { payment, ...access };
}

export async function submitStudioBriefAction(formData: FormData) {
  let user: { id: string; email?: string | null } | null = null;

  if (hasPublicSupabaseEnv()) {
    try {
      const supabase = await createSupabaseServer();
      const auth = await supabase.auth.getUser();
      user = auth.data.user;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Studio auth lookup failed";
      console.error("[studio][brief-submit] auth lookup skipped", {
        reason: message.slice(0, 180),
      });
    }
  }

  const files = formData
    .getAll("referenceFiles")
    .filter((item): item is File => item instanceof File && item.size > 0);

  const result = await submitStudioBrief({
    userId: user?.id ?? null,
    customerName: String(formData.get("customerName") || ""),
    companyName: String(formData.get("companyName") || ""),
    email: user?.email || String(formData.get("email") || ""),
    phone: String(formData.get("phone") || ""),
    serviceKind: String(formData.get("serviceKind") || "website") as never,
    businessType: String(formData.get("businessType") || ""),
    budgetBand: String(formData.get("budgetBand") || ""),
    urgency: String(formData.get("urgency") || ""),
    timeline: String(formData.get("timeline") || ""),
    goals: String(formData.get("goals") || ""),
    scopeNotes: String(formData.get("scopeNotes") || ""),
    packageIntent: String(formData.get("packageIntent") || "custom") as "package" | "custom",
    packageId: String(formData.get("packageId") || "") || null,
    preferredTeamId: String(formData.get("preferredTeamId") || "") || null,
    referenceLinks: asList(formData, "referenceLinks"),
    techPreferences: asList(formData, "techPreferences"),
    requiredFeatures: asList(formData, "requiredFeatures"),
    projectType: String(formData.get("projectType") || "") || null,
    platformPreference: String(formData.get("platformPreference") || "") || null,
    preferredLanguage: String(formData.get("preferredLanguage") || "") || null,
    programmingLanguage: String(formData.get("programmingLanguage") || "") || null,
    frameworkPreference: String(formData.get("frameworkPreference") || "") || null,
    backendPreference: String(formData.get("backendPreference") || "") || null,
    hostingPreference: String(formData.get("hostingPreference") || "") || null,
    designDirection: String(formData.get("designDirection") || "") || null,
    pageRequirements: asList(formData, "pageRequirements"),
    addonServices: asList(formData, "addonServices"),
    inspirationSummary: String(formData.get("inspirationSummary") || "") || null,
    depositNow: String(formData.get("depositNow") || "") === "on",
    files,
    domainIntent: parseDomainIntentFromForm(String(formData.get("domainIntentJson") || "")),
  });

  if (result.project) {
    redirect(
      withStudioToast(`/project/${result.project.id}?access=${result.project.accessKey}`, "brief_submitted")
    );
  }

  redirect(
    withStudioToast(`/proposals/${result.proposal.id}?access=${result.proposal.accessKey}`, "brief_submitted")
  );
}

export async function uploadPaymentProofAction(formData: FormData) {
  const paymentId = String(formData.get("paymentId") || "");
  const redirectPath = String(formData.get("redirectPath") || getStudioAccountUrl());
  const accessKey = String(formData.get("accessKey") || "") || null;
  const proof = formData.get("proof");
  /** Always land on shared account Studio hub after a successful proof upload (cross-domain). */
  const accountStudioAfterProof = getStudioAccountUrl();

  if (!paymentId || !(proof instanceof File) || proof.size === 0) {
    redirect(withStudioToast(redirectPath, "proof_required"));
  }

  await requirePaymentWorkspaceAccess(paymentId, accessKey, redirectPath);
  try {
    await attachPaymentProof(paymentId, proof);
  } catch {
    redirect(withStudioToast(redirectPath, "proof_upload_failed"));
  }
  redirect(withStudioToast(accountStudioAfterProof, "proof_uploaded"));
}

export async function createProjectFromProposalAction(formData: FormData) {
  await requireStudioRoles(["studio_owner", "sales_consultation"], "/sales/proposals");
  const proposalId = String(formData.get("proposalId") || "");
  if (!proposalId) redirect("/sales");

  const project = await createProjectFromProposal(proposalId);
  redirect(withStudioToast(`/project/${project.id}?access=${project.accessKey}`, "brief_submitted"));
}

export async function appendProjectMessageAction(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const redirectPath = String(formData.get("redirectPath") || getStudioAccountUrl());
  const accessKey = String(formData.get("accessKey") || "") || null;
  if (!projectId) redirect(redirectPath);

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { viewer } = await requireProjectWorkspaceAccess(projectId, accessKey, redirectPath);
  const isStaffSender = viewerHasRole(viewer, studioStaffRoles);

  await appendProjectMessage({
    projectId,
    sender:
      (typeof user?.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
      user?.email ||
      String(formData.get("sender") || "Studio client"),
    senderRole: isStaffSender ? "team" : "client",
    body: String(formData.get("body") || ""),
    isInternal: isStaffSender && String(formData.get("isInternal") || "") === "on",
  });

  redirect(withStudioToast(redirectPath, "message_sent"));
}

export async function createRevisionAction(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const redirectPath = String(formData.get("redirectPath") || getStudioAccountUrl());
  const accessKey = String(formData.get("accessKey") || "") || null;
  if (!projectId) redirect(redirectPath);

  const { viewer } = await requireProjectWorkspaceAccess(projectId, accessKey, redirectPath);
  await createRevision({
    projectId,
    summary: String(formData.get("summary") || ""),
    requestedBy: viewerHasRole(viewer, studioStaffRoles) ? "team" : "client",
  });

  redirect(withStudioToast(redirectPath, "revision_logged"));
}

export async function completeRevisionAction(formData: FormData) {
  await requireStudioRoles(["studio_owner", "project_manager", "developer_designer"], "/pm");
  const revisionId = String(formData.get("revisionId") || "");
  const redirectPath = String(formData.get("redirectPath") || "/pm");
  if (!revisionId) redirect(redirectPath);
  await completeRevision(revisionId);
  redirect(redirectPath);
}

export async function setMilestoneStatusAction(formData: FormData) {
  await requireStudioRoles(["studio_owner", "project_manager"], "/pm");
  const projectId = String(formData.get("projectId") || "");
  const milestoneId = String(formData.get("milestoneId") || "");
  const status = String(formData.get("status") || "planned") as
    | "planned"
    | "in_progress"
    | "ready_for_review"
    | "approved";
  const redirectPath = String(formData.get("redirectPath") || "/pm");
  if (!projectId || !milestoneId) redirect(redirectPath);

  await setMilestoneStatus({ projectId, milestoneId, status });
  redirect(withStudioToast(redirectPath, "milestone_advanced"));
}

export async function setPaymentStatusAction(formData: FormData) {
  await requireStudioRoles(["studio_owner", "finance"], "/finance");
  const paymentId = String(formData.get("paymentId") || "");
  const status = String(formData.get("status") || "requested") as
    | "requested"
    | "processing"
    | "paid"
    | "overdue"
    | "cancelled";
  const redirectPath = String(formData.get("redirectPath") || "/finance");
  if (!paymentId) redirect(redirectPath);

  await setPaymentStatus({ paymentId, status });
  redirect(withStudioToast(redirectPath, "payment_marked"));
}

export async function addDeliverableAction(formData: FormData) {
  await requireStudioRoles(["studio_owner", "developer_designer"], "/delivery");
  const projectId = String(formData.get("projectId") || "");
  const redirectPath = String(formData.get("redirectPath") || "/delivery");
  if (!projectId) redirect(redirectPath);

  const files = formData
    .getAll("deliverableFiles")
    .filter((item): item is File => item instanceof File && item.size > 0);

  await addDeliverable({
    projectId,
    label: String(formData.get("label") || ""),
    summary: String(formData.get("summary") || ""),
    files,
  });

  redirect(withStudioToast(redirectPath, "deliverable_shared"));
}

export async function publishReviewAction(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const redirectPath = String(formData.get("redirectPath") || getStudioAccountUrl());
  const accessKey = String(formData.get("accessKey") || "") || null;
  if (!projectId) redirect(redirectPath);

  await requireProjectWorkspaceAccess(projectId, accessKey, redirectPath);
  await publishReview({
    projectId,
    customerName: String(formData.get("customerName") || ""),
    rating: Number(formData.get("rating") || 5),
    quote: String(formData.get("quote") || ""),
    company: String(formData.get("company") || ""),
  });

  redirect(withStudioToast(redirectPath, "review_published"));
}

export async function setLeadStatusAction(formData: FormData) {
  await requireStudioRoles(["studio_owner", "sales_consultation"], "/sales/leads");
  const leadId = String(formData.get("leadId") || "");
  const redirectPath = String(formData.get("redirectPath") || "/sales/leads");
  if (!leadId) redirect(redirectPath);

  await setLeadStatus(
    leadId,
    String(formData.get("status") || "new") as
      | "new"
      | "qualified"
      | "proposal_ready"
      | "proposal_sent"
      | "won"
      | "lost"
  );
  redirect(redirectPath);
}

export async function setProposalStatusAction(formData: FormData) {
  await requireStudioRoles(["studio_owner", "sales_consultation"], "/sales/proposals");
  const proposalId = String(formData.get("proposalId") || "");
  const redirectPath = String(formData.get("redirectPath") || "/sales/proposals");
  if (!proposalId) redirect(redirectPath);

  await setProposalStatus(
    proposalId,
    String(formData.get("status") || "sent") as
      | "draft"
      | "sent"
      | "accepted"
      | "rejected"
      | "expired"
  );
  redirect(redirectPath);
}

export async function createProjectUpdateAction(formData: FormData) {
  await requireStudioRoles(
    ["studio_owner", "project_manager", "developer_designer", "client_success"],
    "/pm"
  );
  const projectId = String(formData.get("projectId") || "");
  const redirectPath = String(formData.get("redirectPath") || "/pm");
  if (!projectId) redirect(redirectPath);

  try {
    await createProjectUpdate({
      projectId,
      kind: String(formData.get("kind") || "manual_update"),
      title: String(formData.get("title") || ""),
      summary: String(formData.get("summary") || ""),
      notifyClient: asBoolean(formData, "notifyClient"),
    });
  } catch {
    redirect(withStudioToast(redirectPath, "project_not_found"));
  }
  redirect(withStudioToast(redirectPath, "update_logged"));
}

export async function saveStudioServiceAction(formData: FormData) {
  await requireStudioRoles(["studio_owner"], "/owner");
  await saveStudioService({
    id: String(formData.get("id") || ""),
    kind: String(formData.get("kind") || "website") as never,
    name: String(formData.get("name") || ""),
    headline: String(formData.get("headline") || ""),
    summary: String(formData.get("summary") || ""),
    startingPrice: Number(formData.get("startingPrice") || 0),
    deliveryWindow: String(formData.get("deliveryWindow") || ""),
    stack: asCsvList(formData, "stack"),
    outcomes: asCsvList(formData, "outcomes"),
    scoreBoosts: asCsvList(formData, "scoreBoosts"),
    isPublished: asBoolean(formData, "isPublished"),
  });
  redirect(String(formData.get("redirectPath") || "/owner"));
}

export async function saveStudioPackageAction(formData: FormData) {
  await requireStudioRoles(["studio_owner"], "/owner");
  await saveStudioPackage({
    id: String(formData.get("id") || ""),
    serviceId: String(formData.get("serviceId") || ""),
    name: String(formData.get("name") || ""),
    summary: String(formData.get("summary") || ""),
    price: Number(formData.get("price") || 0),
    depositRate: Number(formData.get("depositRate") || 0.4),
    timelineWeeks: Number(formData.get("timelineWeeks") || 1),
    bestFor: String(formData.get("bestFor") || ""),
    includes: asCsvList(formData, "includes"),
    isPublished: asBoolean(formData, "isPublished"),
  });
  redirect(String(formData.get("redirectPath") || "/owner"));
}

export async function saveStudioTeamAction(formData: FormData) {
  await requireStudioRoles(["studio_owner"], "/owner");
  await saveStudioTeam({
    id: String(formData.get("id") || ""),
    name: String(formData.get("name") || ""),
    label: String(formData.get("label") || ""),
    summary: String(formData.get("summary") || ""),
    availability: String(formData.get("availability") || "open") as "open" | "limited" | "waitlist",
    focus: asCsvList(formData, "focus"),
    industries: asCsvList(formData, "industries"),
    stack: asCsvList(formData, "stack"),
    highlights: asCsvList(formData, "highlights"),
    scoreBiases: asCsvList(formData, "scoreBiases"),
    isPublished: asBoolean(formData, "isPublished"),
  });
  redirect(String(formData.get("redirectPath") || "/owner"));
}

export async function saveStudioPlatformSettingsAction(formData: FormData) {
  await requireStudioRoles(["studio_owner"], "/owner");
  await saveStudioPlatformSettings({
    supportEmail: String(formData.get("supportEmail") || ""),
    supportPhone: String(formData.get("supportPhone") || ""),
    primaryCta: String(formData.get("primaryCta") || ""),
    paymentBankName: String(formData.get("paymentBankName") || ""),
    paymentAccountName: String(formData.get("paymentAccountName") || ""),
    paymentAccountNumber: String(formData.get("paymentAccountNumber") || ""),
    paymentCurrency: String(formData.get("paymentCurrency") || "NGN"),
    paymentInstructions: String(formData.get("paymentInstructions") || ""),
    paymentSupportEmail: String(formData.get("paymentSupportEmail") || ""),
    paymentSupportWhatsApp: String(formData.get("paymentSupportWhatsApp") || ""),
    companyAccountName: String(formData.get("companyAccountName") || ""),
    companyAccountNumber: String(formData.get("companyAccountNumber") || ""),
    companyBankName: String(formData.get("companyBankName") || ""),
    trustSignals: asCsvList(formData, "trustSignals"),
    process: asCsvList(formData, "process"),
  });
  redirect(String(formData.get("redirectPath") || "/owner"));
}

export async function saveStudioRequestConfigAction(formData: FormData) {
  await requireStudioRoles(["studio_owner"], "/owner");
  const redirectPath = String(formData.get("redirectPath") || "/owner");
  const payload = String(formData.get("payload") || "").trim();

  if (!payload) {
    redirect(redirectPath);
  }

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(payload);
  } catch {
    redirect(redirectPath);
  }

  await saveStudioRequestConfig(normalizeStudioRequestConfig(parsed));
  redirect(redirectPath);
}
