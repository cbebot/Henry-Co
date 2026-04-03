"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { requireStudioRoles } from "@/lib/studio/auth";
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

export async function submitStudioBriefAction(formData: FormData) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    designDirection: String(formData.get("designDirection") || "") || null,
    pageRequirements: asList(formData, "pageRequirements"),
    addonServices: asList(formData, "addonServices"),
    inspirationSummary: String(formData.get("inspirationSummary") || "") || null,
    depositNow: String(formData.get("depositNow") || "") === "on",
    files,
  });

  if (result.project) {
    redirect(`/project/${result.project.id}?access=${result.project.accessKey}`);
  }

  redirect(`/proposals/${result.proposal.id}?access=${result.proposal.accessKey}`);
}

export async function uploadPaymentProofAction(formData: FormData) {
  const paymentId = String(formData.get("paymentId") || "");
  const redirectPath = String(formData.get("redirectPath") || "/client");
  const proof = formData.get("proof");

  if (!paymentId || !(proof instanceof File) || proof.size === 0) {
    redirect(redirectPath);
  }

  await attachPaymentProof(paymentId, proof);
  redirect(redirectPath);
}

export async function createProjectFromProposalAction(formData: FormData) {
  const proposalId = String(formData.get("proposalId") || "");
  if (!proposalId) redirect("/sales");

  const project = await createProjectFromProposal(proposalId);
  redirect(`/project/${project.id}?access=${project.accessKey}`);
}

export async function appendProjectMessageAction(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const redirectPath = String(formData.get("redirectPath") || "/client");
  if (!projectId) redirect(redirectPath);

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await appendProjectMessage({
    projectId,
    sender:
      (typeof user?.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
      user?.email ||
      String(formData.get("sender") || "Studio client"),
    senderRole: String(formData.get("senderRole") || "client"),
    body: String(formData.get("body") || ""),
    isInternal: String(formData.get("isInternal") || "") === "on",
  });

  redirect(redirectPath);
}

export async function createRevisionAction(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const redirectPath = String(formData.get("redirectPath") || "/client");
  if (!projectId) redirect(redirectPath);

  await createRevision({
    projectId,
    summary: String(formData.get("summary") || ""),
    requestedBy: String(formData.get("requestedBy") || "client") as "client" | "team",
  });

  redirect(redirectPath);
}

export async function completeRevisionAction(formData: FormData) {
  const revisionId = String(formData.get("revisionId") || "");
  const redirectPath = String(formData.get("redirectPath") || "/pm");
  if (!revisionId) redirect(redirectPath);
  await completeRevision(revisionId);
  redirect(redirectPath);
}

export async function setMilestoneStatusAction(formData: FormData) {
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
  redirect(redirectPath);
}

export async function setPaymentStatusAction(formData: FormData) {
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
  redirect(redirectPath);
}

export async function addDeliverableAction(formData: FormData) {
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

  redirect(redirectPath);
}

export async function publishReviewAction(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const redirectPath = String(formData.get("redirectPath") || "/client");
  if (!projectId) redirect(redirectPath);

  await publishReview({
    projectId,
    customerName: String(formData.get("customerName") || ""),
    rating: Number(formData.get("rating") || 5),
    quote: String(formData.get("quote") || ""),
    company: String(formData.get("company") || ""),
  });

  redirect(redirectPath);
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

  await createProjectUpdate({
    projectId,
    kind: String(formData.get("kind") || "manual_update"),
    title: String(formData.get("title") || ""),
    summary: String(formData.get("summary") || ""),
    notifyClient: asBoolean(formData, "notifyClient"),
  });
  redirect(redirectPath);
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
    trustSignals: asCsvList(formData, "trustSignals"),
    process: asCsvList(formData, "process"),
  });
  redirect(String(formData.get("redirectPath") || "/owner"));
}
