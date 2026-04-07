import "server-only";

import { normalizeEmail } from "@henryco/config";
import { createAdminSupabase } from "@/lib/supabase";
import { getSharedPaymentRail } from "@/lib/payment-settings";

type StudioTable =
  | "studio_projects"
  | "studio_project_milestones"
  | "studio_proposals"
  | "studio_proposal_milestones"
  | "studio_payments"
  | "studio_project_updates"
  | "studio_project_messages"
  | "studio_deliverables"
  | "studio_revisions"
  | "studio_project_files";

type StudioProjectSummary = {
  id: string;
  title: string;
  status: string;
  summary: string;
  nextAction: string;
  updatedAt: string;
  proposalId: string | null;
  teamId: string | null;
  serviceId: string | null;
  confidence: number;
  milestoneProgress: number;
  approvedMilestones: number;
  readyMilestones: number;
  totalMilestones: number;
  openPayments: number;
  deliverables: number;
  revisions: number;
  messages: number;
  latestUpdate: {
    title: string;
    summary: string;
    createdAt: string | null;
  } | null;
  latestPaymentStatus: string | null;
};

export type StudioProjectRoomFile = {
  id: string;
  label: string;
  kind: string;
  url: string | null;
  createdAt: string;
  size: number | null;
  mimeType: string | null;
};

export type StudioProjectRoomDeliverable = {
  id: string;
  label: string;
  summary: string;
  status: string;
  createdAt: string;
  files: StudioProjectRoomFile[];
};

export type StudioProjectRoomRevision = {
  id: string;
  requestedBy: string;
  status: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
};

export type StudioProjectRoomMessage = {
  id: string;
  sender: string;
  senderRole: string;
  body: string;
  createdAt: string;
};

export type StudioProjectRoomPayment = {
  id: string;
  label: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string | null;
  method: string;
  proofUrl: string | null;
  proofName: string | null;
  milestoneId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StudioProjectRoom = {
  project: StudioProjectSummary & {
    milestones: Array<{
      id: string;
      name: string;
      description: string;
      dueLabel: string;
      amount: number;
      status: string;
    }>;
  };
  proposal: {
    id: string;
    title: string;
    status: string;
    investment: number;
    depositAmount: number;
    currency: string;
    validUntil: string | null;
    scopeBullets: string[];
    comparisonNotes: string[];
  } | null;
  updates: Array<{
    id: string;
    kind: string;
    title: string;
    summary: string;
    createdAt: string;
  }>;
  messages: StudioProjectRoomMessage[];
  payments: StudioProjectRoomPayment[];
  files: StudioProjectRoomFile[];
  deliverables: StudioProjectRoomDeliverable[];
  revisions: StudioProjectRoomRevision[];
  supportThread: {
    id: string;
    subject: string;
    status: string;
    updatedAt: string;
  } | null;
};

export type StudioPaymentRoom = {
  payment: StudioProjectRoomPayment;
  project: StudioProjectSummary | null;
  proposal: {
    id: string;
    title: string;
    currency: string;
    depositAmount: number;
  } | null;
  paymentRail: Awaited<ReturnType<typeof getSharedPaymentRail>>;
};

export type StudioDashboardData = {
  projects: StudioProjectSummary[];
  proposals: Array<{
    id: string;
    title: string;
    status: string;
    investment: number;
    depositAmount: number;
    currency: string;
    validUntil: string | null;
    projectId: string | null;
  }>;
  payments: StudioProjectRoomPayment[];
  supportThreads: Array<{
    id: string;
    subject: string;
    status: string;
    updatedAt: string;
  }>;
  metrics: {
    activeProjects: number;
    pendingPayments: number;
    proofSubmitted: number;
    deliverables: number;
  };
};

const studioTablePresence = new Map<string, boolean>();
const studioAssetUrlCache = new Map<string, string | null>();

function admin() {
  return createAdminSupabase();
}

function cleanText(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text;
}

function nullableText(value: unknown) {
  const text = cleanText(value);
  return text || null;
}

function asNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function asStringArray(value: unknown) {
  return asArray(value)
    .map((item) => cleanText(item))
    .filter(Boolean);
}

function toTimestamp(value: string | null | undefined) {
  if (!value) return 0;
  const date = new Date(value).getTime();
  return Number.isFinite(date) ? date : 0;
}

async function hasStudioTable(table: StudioTable) {
  if (studioTablePresence.has(table)) {
    return studioTablePresence.get(table) ?? false;
  }

  try {
    const { error } = await admin().from(table).select("id").limit(1);
    const exists = !error || !cleanText(error.message).includes("Could not find the table");
    studioTablePresence.set(table, exists);
    return exists;
  } catch {
    studioTablePresence.set(table, false);
    return false;
  }
}

async function readStudioFallbackRows<T extends Record<string, unknown>>(table: StudioTable) {
  const { data, error } = await admin()
    .from("care_security_logs")
    .select("details, created_at")
    .eq("route", "/studio/store")
    .eq("event_type", `studio_store_${table}`)
    .order("created_at", { ascending: false })
    .limit(2400);

  if (error) {
    return [] as T[];
  }

  const merged = new Map<string, T>();
  for (const row of data ?? []) {
    const details = asObject(row.details);
    const payload = asObject(details.payload) as T;
    const recordId = cleanText(details.record_id) || cleanText(payload.id) || cleanText(payload.key);

    if (!recordId || merged.has(recordId)) continue;
    merged.set(recordId, payload);
  }

  return [...merged.values()];
}

async function readStudioRows<T extends Record<string, unknown>>(table: StudioTable, orderBy = "created_at") {
  if (await hasStudioTable(table)) {
    const { data, error } = await admin()
      .from(table)
      .select("*")
      .order(orderBy, { ascending: orderBy === "sort_order" });

    if (!error) {
      return (data ?? []) as T[];
    }
  }

  const rows = await readStudioFallbackRows<T>(table);
  return rows.sort((left, right) => {
    const leftValue = cleanText(left[orderBy]);
    const rightValue = cleanText(right[orderBy]);
    if (orderBy === "sort_order") {
      return asNumber(leftValue) - asNumber(rightValue);
    }
    return toTimestamp(rightValue) - toTimestamp(leftValue);
  });
}

async function resolveStudioAssetUrl(path: string | null, bucket = "studio-assets") {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path.startsWith(`${bucket}/`) ? path.slice(bucket.length + 1) : path;
  const cacheKey = `${bucket}:${normalizedPath}`;
  if (studioAssetUrlCache.has(cacheKey)) {
    return studioAssetUrlCache.get(cacheKey) ?? null;
  }

  try {
    const { data, error } = await admin().storage.from(bucket).createSignedUrl(normalizedPath, 60 * 60);
    const url = error ? null : data?.signedUrl ?? null;
    studioAssetUrlCache.set(cacheKey, url);
    return url;
  } catch {
    studioAssetUrlCache.set(cacheKey, null);
    return null;
  }
}

function summarizeProject(
  row: Record<string, unknown>,
  milestoneRows: Array<Record<string, unknown>>,
  updateRows: Array<Record<string, unknown>>,
  paymentRows: Array<Record<string, unknown>>,
  deliverableRows: Array<Record<string, unknown>>,
  revisionRows: Array<Record<string, unknown>>,
  messageRows: Array<Record<string, unknown>>
): StudioProjectSummary {
  const id = cleanText(row.id);
  const milestones = milestoneRows.filter((item) => cleanText(item.project_id) === id);
  const payments = paymentRows.filter((item) => cleanText(item.project_id) === id);
  const updates = updateRows.filter((item) => cleanText(item.project_id) === id);
  const deliverables = deliverableRows.filter((item) => cleanText(item.project_id) === id);
  const revisions = revisionRows.filter((item) => cleanText(item.project_id) === id);
  const messages = messageRows.filter((item) => cleanText(item.project_id) === id && !Boolean(item.is_internal));
  const approvedMilestones = milestones.filter((item) => cleanText(item.status) === "approved").length;
  const readyMilestones = milestones.filter((item) => cleanText(item.status) === "ready_for_review").length;
  const totalMilestones = milestones.length;
  const milestoneProgress =
    totalMilestones > 0
      ? Math.round((approvedMilestones / totalMilestones) * 100)
      : cleanText(row.status) === "delivered"
        ? 100
        : cleanText(row.status) === "active"
          ? 45
          : 18;
  const latestUpdate = [...updates].sort((left, right) => toTimestamp(cleanText(right.created_at)) - toTimestamp(cleanText(left.created_at)))[0];
  const latestPayment = [...payments].sort((left, right) => toTimestamp(cleanText(right.updated_at || right.created_at)) - toTimestamp(cleanText(left.updated_at || left.created_at)))[0];

  return {
    id,
    title: cleanText(row.title) || "Studio project",
    status: cleanText(row.status) || "pending",
    summary: cleanText(row.summary) || "Studio is preparing your delivery lane.",
    nextAction: cleanText(row.next_action) || "Follow the latest checkpoint to keep the project moving.",
    updatedAt: cleanText(row.updated_at || row.created_at) || new Date().toISOString(),
    proposalId: nullableText(row.proposal_id),
    teamId: nullableText(row.team_id),
    serviceId: nullableText(row.service_id),
    confidence: asNumber(row.confidence),
    milestoneProgress,
    approvedMilestones,
    readyMilestones,
    totalMilestones,
    openPayments: payments.filter((item) => cleanText(item.status) !== "paid").length,
    deliverables: deliverables.length,
    revisions: revisions.length,
    messages: messages.length,
    latestUpdate: latestUpdate
      ? {
          title: cleanText(latestUpdate.title) || "Project update",
          summary: cleanText(latestUpdate.summary) || cleanText(latestUpdate.kind) || "Studio logged a project movement.",
          createdAt: nullableText(latestUpdate.created_at),
        }
      : null,
    latestPaymentStatus: nullableText(latestPayment?.status),
  };
}

async function loadStudioContext(userId: string, email: string | null) {
  const normalizedEmail = normalizeEmail(email);
  const [activityRows, supportThreads, projectRows, projectMilestones, proposalRows, proposalMilestones, paymentRows, updateRows, messageRows, deliverableRows, revisionRows, fileRows] =
    await Promise.all([
      admin()
        .from("customer_activity")
        .select("*")
        .eq("user_id", userId)
        .eq("division", "studio")
        .order("created_at", { ascending: false })
        .limit(160),
      admin()
        .from("support_threads")
        .select("*")
        .eq("user_id", userId)
        .eq("division", "studio")
        .order("updated_at", { ascending: false })
        .limit(20),
      readStudioRows<Record<string, unknown>>("studio_projects"),
      readStudioRows<Record<string, unknown>>("studio_project_milestones", "sort_order"),
      readStudioRows<Record<string, unknown>>("studio_proposals"),
      readStudioRows<Record<string, unknown>>("studio_proposal_milestones", "sort_order"),
      readStudioRows<Record<string, unknown>>("studio_payments"),
      readStudioRows<Record<string, unknown>>("studio_project_updates"),
      readStudioRows<Record<string, unknown>>("studio_project_messages"),
      readStudioRows<Record<string, unknown>>("studio_deliverables"),
      readStudioRows<Record<string, unknown>>("studio_revisions"),
      readStudioRows<Record<string, unknown>>("studio_project_files"),
    ]);

  const activity = (activityRows.data ?? []) as Record<string, unknown>[];
  const threads = (supportThreads.data ?? []) as Record<string, unknown>[];
  const projectIds = new Set<string>();
  const proposalIds = new Set<string>();
  const paymentIds = new Set<string>();

  for (const item of activity) {
    const referenceType = cleanText(item.reference_type);
    const referenceId = cleanText(item.reference_id);
    const metadata = asObject(item.metadata);
    if (referenceType === "studio_project" && referenceId) projectIds.add(referenceId);
    if (referenceType === "studio_proposal" && referenceId) proposalIds.add(referenceId);
    if (referenceType === "studio_payment" && referenceId) paymentIds.add(referenceId);
    if (cleanText(metadata.project_id)) projectIds.add(cleanText(metadata.project_id));
  }

  const visibleProjects = projectRows.filter((item) => {
    const projectId = cleanText(item.id);
    const projectEmail = normalizeEmail(nullableText(item.normalized_email));
    const clientUserId = nullableText(item.client_user_id);
    return projectIds.has(projectId) || clientUserId === userId || (!!normalizedEmail && projectEmail === normalizedEmail);
  });

  for (const project of visibleProjects) {
    const proposalId = cleanText(project.proposal_id);
    if (proposalId) proposalIds.add(proposalId);
    projectIds.add(cleanText(project.id));
  }

  const visibleProposals = proposalRows.filter((item) => proposalIds.has(cleanText(item.id)));
  const visiblePayments = paymentRows.filter((item) => paymentIds.has(cleanText(item.id)) || projectIds.has(cleanText(item.project_id)));
  const visibleUpdates = updateRows.filter((item) => projectIds.has(cleanText(item.project_id)));
  const visibleMessages = messageRows.filter((item) => projectIds.has(cleanText(item.project_id)) && !Boolean(item.is_internal));
  const visibleDeliverables = deliverableRows.filter((item) => projectIds.has(cleanText(item.project_id)));
  const visibleRevisions = revisionRows.filter((item) => projectIds.has(cleanText(item.project_id)));
  const visibleFiles = fileRows.filter((item) => projectIds.has(cleanText(item.project_id)) || cleanText(item.kind) === "proof");

  return {
    normalizedEmail,
    activity,
    supportThreads: threads,
    projectRows: visibleProjects,
    projectMilestones,
    proposalRows: visibleProposals,
    proposalMilestones,
    paymentRows: visiblePayments,
    updateRows: visibleUpdates,
    messageRows: visibleMessages,
    deliverableRows: visibleDeliverables,
    revisionRows: visibleRevisions,
    fileRows: visibleFiles,
  };
}

export async function getStudioDashboardData(userId: string, email: string | null): Promise<StudioDashboardData> {
  const context = await loadStudioContext(userId, email);
  const projects = context.projectRows
    .map((row) =>
      summarizeProject(
        row,
        context.projectMilestones,
        context.updateRows,
        context.paymentRows,
        context.deliverableRows,
        context.revisionRows,
        context.messageRows
      )
    )
    .sort((left, right) => toTimestamp(right.updatedAt) - toTimestamp(left.updatedAt));

  const proposals = context.proposalRows
    .map((row) => {
      const proposalId = cleanText(row.id);
      const linkedProject = context.projectRows.find((item) => cleanText(item.proposal_id) === proposalId);
      return {
        id: proposalId,
        title: cleanText(row.title) || "Studio proposal",
        status: cleanText(row.status) || "draft",
        investment: asNumber(row.investment),
        depositAmount: asNumber(row.deposit_amount),
        currency: cleanText(row.currency) || "NGN",
        validUntil: nullableText(row.valid_until),
        projectId: nullableText(linkedProject?.id),
      };
    })
    .sort((left, right) => toTimestamp(right.validUntil) - toTimestamp(left.validUntil));

  const payments = context.paymentRows
    .map((row) => ({
      id: cleanText(row.id),
      label: cleanText(row.label) || "Studio payment",
      amount: asNumber(row.amount),
      currency: cleanText(row.currency) || "NGN",
      status: cleanText(row.status) || "requested",
      dueDate: nullableText(row.due_date),
      method: cleanText(row.method) || "bank_transfer",
      proofUrl: nullableText(row.proof_url),
      proofName: nullableText(row.proof_name),
      milestoneId: nullableText(row.milestone_id),
      createdAt: cleanText(row.created_at) || new Date().toISOString(),
      updatedAt: cleanText(row.updated_at || row.created_at) || new Date().toISOString(),
      projectId: cleanText(row.project_id),
    }))
    .sort((left, right) => toTimestamp(right.updatedAt) - toTimestamp(left.updatedAt));

  return {
    projects,
    proposals,
    payments,
    supportThreads: context.supportThreads.map((thread) => ({
      id: cleanText(thread.id),
      subject: cleanText(thread.subject) || "Studio support",
      status: cleanText(thread.status) || "open",
      updatedAt: cleanText(thread.updated_at || thread.created_at) || new Date().toISOString(),
    })),
    metrics: {
      activeProjects: projects.filter((project) => !["delivered", "archived"].includes(project.status)).length,
      pendingPayments: payments.filter((payment) => !["paid", "cancelled"].includes(payment.status)).length,
      proofSubmitted: payments.filter((payment) => Boolean(payment.proofUrl)).length,
      deliverables: context.deliverableRows.length,
    },
  };
}

export async function getStudioProjectRoom(userId: string, email: string | null, projectId: string): Promise<StudioProjectRoom | null> {
  const context = await loadStudioContext(userId, email);
  const projectRow = context.projectRows.find((item) => cleanText(item.id) === projectId);

  if (!projectRow) {
    return null;
  }

  const project = summarizeProject(
    projectRow,
    context.projectMilestones,
    context.updateRows,
    context.paymentRows,
    context.deliverableRows,
    context.revisionRows,
    context.messageRows
  );
  const proposalRow = context.proposalRows.find((item) => cleanText(item.id) === cleanText(projectRow.proposal_id)) ?? null;
  const milestoneRows = context.projectMilestones
    .filter((item) => cleanText(item.project_id) === projectId)
    .sort((left, right) => asNumber(left.sort_order) - asNumber(right.sort_order));
  const payments = await Promise.all(
    context.paymentRows
      .filter((item) => cleanText(item.project_id) === projectId)
      .sort((left, right) => toTimestamp(cleanText(right.updated_at || right.created_at)) - toTimestamp(cleanText(left.updated_at || left.created_at)))
      .map(async (row) => ({
        id: cleanText(row.id),
        label: cleanText(row.label) || "Studio payment",
        amount: asNumber(row.amount),
        currency: cleanText(row.currency) || "NGN",
        status: cleanText(row.status) || "requested",
        dueDate: nullableText(row.due_date),
        method: cleanText(row.method) || "bank_transfer",
        proofUrl: await resolveStudioAssetUrl(nullableText(row.proof_url)),
        proofName: nullableText(row.proof_name),
        milestoneId: nullableText(row.milestone_id),
        createdAt: cleanText(row.created_at) || new Date().toISOString(),
        updatedAt: cleanText(row.updated_at || row.created_at) || new Date().toISOString(),
      }))
  );
  const fileMap = new Map<string, StudioProjectRoomFile>();
  for (const fileRow of context.fileRows.filter((item) => cleanText(item.project_id) === projectId)) {
    const id = cleanText(fileRow.id);
    fileMap.set(id, {
      id,
      label: cleanText(fileRow.label) || "Studio file",
      kind: cleanText(fileRow.kind) || "file",
      url: await resolveStudioAssetUrl(nullableText(fileRow.path), cleanText(fileRow.bucket) || "studio-assets"),
      createdAt: cleanText(fileRow.created_at) || new Date().toISOString(),
      size: Number.isFinite(Number(fileRow.size)) ? Number(fileRow.size) : null,
      mimeType: nullableText(fileRow.mime_type),
    });
  }

  const deliverables = context.deliverableRows
    .filter((item) => cleanText(item.project_id) === projectId)
    .map((item) => ({
      id: cleanText(item.id),
      label: cleanText(item.label) || "Deliverable",
      summary: cleanText(item.summary) || "Studio delivered a new project asset.",
      status: cleanText(item.status) || "shared",
      createdAt: cleanText(item.created_at) || new Date().toISOString(),
      files: asStringArray(item.file_ids).map((fileId) => fileMap.get(fileId)).filter(Boolean) as StudioProjectRoomFile[],
    }));

  const messages = context.messageRows
    .filter((item) => cleanText(item.project_id) === projectId && !Boolean(item.is_internal))
    .sort((left, right) => toTimestamp(cleanText(left.created_at)) - toTimestamp(cleanText(right.created_at)))
    .map((item) => ({
      id: cleanText(item.id),
      sender: cleanText(item.sender) || "Studio team",
      senderRole: cleanText(item.sender_role) || "project update",
      body: cleanText(item.body) || "Studio logged a communication update.",
      createdAt: cleanText(item.created_at) || new Date().toISOString(),
    }));

  const revisions = context.revisionRows
    .filter((item) => cleanText(item.project_id) === projectId)
    .sort((left, right) => toTimestamp(cleanText(right.updated_at || right.created_at)) - toTimestamp(cleanText(left.updated_at || left.created_at)))
    .map((item) => ({
      id: cleanText(item.id),
      requestedBy: cleanText(item.requested_by) || "team",
      status: cleanText(item.status) || "open",
      summary: cleanText(item.summary) || "Revision request",
      createdAt: cleanText(item.created_at) || new Date().toISOString(),
      updatedAt: cleanText(item.updated_at || item.created_at) || new Date().toISOString(),
    }));

  const supportThread =
    context.supportThreads.find((thread) => cleanText(thread.reference_id) === projectId) ??
    context.supportThreads.find((thread) => cleanText(thread.reference_id) === cleanText(projectRow.proposal_id)) ??
    context.supportThreads[0] ??
    null;

  return {
    project: {
      ...project,
      milestones: milestoneRows.map((row) => ({
        id: cleanText(row.id),
        name: cleanText(row.name) || "Milestone",
        description: cleanText(row.description) || "Studio milestone",
        dueLabel: cleanText(row.due_label) || "In motion",
        amount: asNumber(row.amount),
        status: cleanText(row.status) || "planned",
      })),
    },
    proposal: proposalRow
      ? {
          id: cleanText(proposalRow.id),
          title: cleanText(proposalRow.title) || "Studio proposal",
          status: cleanText(proposalRow.status) || "draft",
          investment: asNumber(proposalRow.investment),
          depositAmount: asNumber(proposalRow.deposit_amount),
          currency: cleanText(proposalRow.currency) || "NGN",
          validUntil: nullableText(proposalRow.valid_until),
          scopeBullets: asStringArray(proposalRow.scope_bullets),
          comparisonNotes: asStringArray(proposalRow.comparison_notes),
        }
      : null,
    updates: context.updateRows
      .filter((item) => cleanText(item.project_id) === projectId)
      .sort((left, right) => toTimestamp(cleanText(right.created_at)) - toTimestamp(cleanText(left.created_at)))
      .map((item) => ({
        id: cleanText(item.id),
        kind: cleanText(item.kind) || "update",
        title: cleanText(item.title) || "Project update",
        summary: cleanText(item.summary) || "Studio logged a project movement.",
        createdAt: cleanText(item.created_at) || new Date().toISOString(),
      })),
    messages,
    payments,
    files: [...fileMap.values()].sort((left, right) => toTimestamp(right.createdAt) - toTimestamp(left.createdAt)),
    deliverables,
    revisions,
    supportThread: supportThread
      ? {
          id: cleanText(supportThread.id),
          subject: cleanText(supportThread.subject) || "Studio support",
          status: cleanText(supportThread.status) || "open",
          updatedAt: cleanText(supportThread.updated_at || supportThread.created_at) || new Date().toISOString(),
        }
      : null,
  };
}

export async function getStudioPaymentRoom(userId: string, email: string | null, paymentId: string): Promise<StudioPaymentRoom | null> {
  const context = await loadStudioContext(userId, email);
  const paymentRow = context.paymentRows.find((item) => cleanText(item.id) === paymentId);
  if (!paymentRow) {
    return null;
  }

  const projectRow = context.projectRows.find((item) => cleanText(item.id) === cleanText(paymentRow.project_id)) ?? null;
  const project = projectRow
    ? summarizeProject(
        projectRow,
        context.projectMilestones,
        context.updateRows,
        context.paymentRows,
        context.deliverableRows,
        context.revisionRows,
        context.messageRows
      )
    : null;
  const proposalRow =
    projectRow
      ? context.proposalRows.find((item) => cleanText(item.id) === cleanText(projectRow.proposal_id)) ?? null
      : null;

  return {
    payment: {
      id: cleanText(paymentRow.id),
      label: cleanText(paymentRow.label) || "Studio payment",
      amount: asNumber(paymentRow.amount),
      currency: cleanText(paymentRow.currency) || "NGN",
      status: cleanText(paymentRow.status) || "requested",
      dueDate: nullableText(paymentRow.due_date),
      method: cleanText(paymentRow.method) || "bank_transfer",
      proofUrl: await resolveStudioAssetUrl(nullableText(paymentRow.proof_url)),
      proofName: nullableText(paymentRow.proof_name),
      milestoneId: nullableText(paymentRow.milestone_id),
      createdAt: cleanText(paymentRow.created_at) || new Date().toISOString(),
      updatedAt: cleanText(paymentRow.updated_at || paymentRow.created_at) || new Date().toISOString(),
    },
    project,
    proposal: proposalRow
      ? {
          id: cleanText(proposalRow.id),
          title: cleanText(proposalRow.title) || "Studio proposal",
          currency: cleanText(proposalRow.currency) || "NGN",
          depositAmount: asNumber(proposalRow.deposit_amount),
        }
      : null,
    paymentRail: await getSharedPaymentRail(),
  };
}
