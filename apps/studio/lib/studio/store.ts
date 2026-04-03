import "server-only";

import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { formatCurrency, getOptionalEnv, normalizeEmail, normalizePhone } from "@/lib/env";
import { createAdminSupabase, hasAdminSupabaseEnv } from "@/lib/supabase";
import {
  appendCustomerActivity,
  appendCustomerDocument,
  appendCustomerNotification,
  ensureCustomerProfile,
  upsertCustomerInvoice,
} from "@/lib/studio/shared-account";
import type {
  StudioBrief,
  StudioCustomRequest,
  StudioDeliverable,
  StudioLead,
  StudioNotification,
  StudioPayment,
  StudioProject,
  StudioProjectFile,
  StudioProjectMessage,
  StudioProjectMilestone,
  StudioProjectUpdate,
  StudioProposal,
  StudioReview,
  StudioRevision,
  StudioSnapshot,
  StudioSupportMessage,
  StudioSupportThread,
} from "@/lib/studio/types";

export type UpsertMeta = {
  userId?: string | null;
  email?: string | null;
  role?: string | null;
};

type StudioUpsertEvent =
  | "studio_lead_upsert"
  | "studio_brief_upsert"
  | "studio_proposal_upsert"
  | "studio_project_upsert"
  | "studio_payment_upsert"
  | "studio_file_upsert"
  | "studio_message_append"
  | "studio_deliverable_upsert"
  | "studio_revision_upsert"
  | "studio_review_upsert"
  | "studio_notification_append";

const STUDIO_BUCKET = "studio-assets";
const FALLBACK_SECRET = "henryco-studio-secret";
const STUDIO_STORE_ROUTE = "/studio/store";

let studioBucketEnsured = false;
const tablePresenceCache = new Map<string, boolean>();

function stableSecret() {
  return (
    getOptionalEnv("STUDIO_PORTAL_SECRET") ||
    getOptionalEnv("CRON_SECRET") ||
    getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY") ||
    FALLBACK_SECRET
  );
}

function safeRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function arrayOfText(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanText(item))
    .filter(Boolean);
}

function sanitizeFileSegment(value: string) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "file";
}

async function ensureStudioBucket() {
  if (!hasAdminSupabaseEnv()) return;
  if (studioBucketEnsured) return;

  try {
    const admin = createAdminSupabase();
    const { data: buckets } = await admin.storage.listBuckets();
    const exists = (buckets ?? []).some((bucket) => bucket.name === STUDIO_BUCKET);

    if (!exists) {
      await admin.storage.createBucket(STUDIO_BUCKET, {
        public: false,
        fileSizeLimit: "50MB",
      });
    }

    studioBucketEnsured = true;
  } catch {
    // Keep runtime resilient during first boot or local verification.
  }
}

function accessSeed(namespace: "proposal" | "project", id: string) {
  return `${namespace}:${cleanText(id)}`;
}

export function cleanText(value?: unknown) {
  return String(value ?? "").trim();
}

export function asNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function createId() {
  return randomUUID();
}

export function createAccessKey(seed?: string | null) {
  if (!seed) {
    return randomBytes(24).toString("base64url");
  }

  return createHmac("sha256", stableSecret())
    .update(seed)
    .digest("base64url")
    .slice(0, 32);
}

export function hashAccessKey(accessKey?: string | null) {
  return createHash("sha256").update(cleanText(accessKey)).digest("hex");
}

export function plusDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function safePhone(value?: string | null) {
  return normalizePhone(value);
}

export function paymentDisplay(amount: number, currency = "NGN") {
  return formatCurrency(Math.max(0, Math.round(asNumber(amount))), currency);
}

export async function uploadStudioFile(
  entityId: string,
  kind: StudioProjectFile["kind"],
  file: File
): Promise<StudioProjectFile | null> {
  const filename = sanitizeFileSegment(file.name);
  const objectPath = `${kind}/${cleanText(entityId)}/${Date.now()}-${filename}`;

  try {
    await ensureStudioBucket();

    const admin = createAdminSupabase();
    const bytes = await file.arrayBuffer();
    const { error } = await admin.storage.from(STUDIO_BUCKET).upload(objectPath, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

    if (error) throw error;

    return {
      id: createId(),
      projectId: entityId,
      leadId: kind === "reference" ? entityId : null,
      briefId: null,
      createdAt: new Date().toISOString(),
      kind,
      label: cleanText(file.name),
      path: objectPath,
      bucket: STUDIO_BUCKET,
      size: file.size,
      mimeType: file.type || null,
    };
  } catch {
    return null;
  }
}

export async function writeStudioLog(input: {
  eventType: string;
  route?: string | null;
  success?: boolean;
  meta?: UpsertMeta;
  details?: Record<string, unknown>;
}) {
  if (!hasAdminSupabaseEnv()) return;
  try {
    const admin = createAdminSupabase();
    const { error } = await admin.from("care_security_logs").insert({
      event_type: input.eventType,
      route: input.route ?? "/studio",
      email: normalizeEmail(input.meta?.email),
      user_id: input.meta?.userId ?? null,
      role: cleanText(input.meta?.role) || null,
      success: input.success ?? true,
      details: input.details ?? {},
    } as never);
    if (error) throw error;
  } catch {
    // Preserve app flow even when the shared security table is unavailable.
  }
}

function studioFallbackEventType(table: string) {
  return `studio_store_${table}`;
}

async function hasStudioTable(table: string) {
  if (tablePresenceCache.has(table)) {
    return tablePresenceCache.get(table) ?? false;
  }

  try {
    const admin = createAdminSupabase();
    const { error } = await admin.from(table).select("id").limit(1);
    const exists = !error || !cleanText(error.message).includes("Could not find the table");
    tablePresenceCache.set(table, exists);
    return exists;
  } catch {
    tablePresenceCache.set(table, false);
    return false;
  }
}

async function readFallbackRows<T extends Record<string, unknown>>(table: string) {
  if (!hasAdminSupabaseEnv()) return [] as T[];
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("care_security_logs")
    .select("details, created_at")
    .eq("route", STUDIO_STORE_ROUTE)
    .eq("event_type", studioFallbackEventType(table))
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) throw error;

  const merged = new Map<string, T>();
  for (const row of data ?? []) {
    const details = safeRecord(row.details);
    const payload = safeRecord(details?.payload) as T | null;
    const recordId =
      cleanText(details?.record_id) ||
      cleanText(payload?.id) ||
      cleanText(payload?.key);

    if (!payload || !recordId || merged.has(recordId)) continue;
    merged.set(recordId, payload);
  }

  return [...merged.values()];
}

async function writeFallbackRow(
  table: string,
  payload: Record<string, unknown>,
  meta?: UpsertMeta,
  idKey = "id"
) {
  if (!hasAdminSupabaseEnv()) return;
  const admin = createAdminSupabase();
  const recordId = cleanText(payload[idKey] ?? payload.id ?? payload.key);
  const { error } = await admin.from("care_security_logs").insert({
    event_type: studioFallbackEventType(table),
    route: STUDIO_STORE_ROUTE,
    user_id: meta?.userId ?? null,
    role: cleanText(meta?.role) || "studio_system",
    email: normalizeEmail(meta?.email),
    success: true,
    details: {
      record_id: recordId,
      payload,
      table,
    },
  } as never);
  if (error) throw error;
}

async function upsertTableRecord(
  table: string,
  payload: Record<string, unknown>,
  meta?: UpsertMeta,
  options?: { onConflict?: string; idKey?: string }
) {
  if (await hasStudioTable(table)) {
    const admin = createAdminSupabase();
    const { error } = await admin.from(table).upsert(payload as never, {
      onConflict: options?.onConflict || "id",
    });
    if (error) throw error;
    return;
  }

  await writeFallbackRow(table, payload, meta, options?.idKey || "id");
}

async function insertTableRecord(
  table: string,
  payload: Record<string, unknown>,
  meta?: UpsertMeta,
  options?: { idKey?: string }
) {
  if (await hasStudioTable(table)) {
    const admin = createAdminSupabase();
    const { error } = await admin.from(table).insert(payload as never);
    if (error) throw error;
    return;
  }

  await writeFallbackRow(table, payload, meta, options?.idKey || "id");
}

async function selectRows<T extends Record<string, unknown>>(table: string, select: string, orderBy?: string) {
  try {
    if (await hasStudioTable(table)) {
      const admin = createAdminSupabase();
      let query = admin.from(table).select(select);
      if (orderBy) {
        query = query.order(orderBy, { ascending: true });
      }

      const { data, error } = await query;
      if (error) throw error;
      return ((data ?? []) as unknown) as T[];
    }

    return await readFallbackRows<T>(table);
  } catch {
    return [] as T[];
  }
}

export async function readStudioCollection<T extends Record<string, unknown>>(table: string) {
  return selectRows<T>(table, "*", "created_at");
}

export async function upsertStudioCollectionRecord(
  table: string,
  payload: Record<string, unknown>,
  meta?: UpsertMeta,
  options?: { onConflict?: string; idKey?: string }
) {
  return upsertTableRecord(table, payload, meta, options);
}

function mapLead(row: Record<string, unknown>): StudioLead {
  return {
    id: cleanText(row.id),
    createdAt: cleanText(row.created_at),
    updatedAt: cleanText(row.updated_at),
    userId: cleanText(row.user_id) || null,
    normalizedEmail: normalizeEmail(row.normalized_email as string | null),
    customerName: cleanText(row.customer_name),
    companyName: cleanText(row.company_name) || null,
    phone: cleanText(row.phone) || null,
    serviceKind: cleanText(row.service_kind) as StudioLead["serviceKind"],
    status: cleanText(row.status) as StudioLead["status"],
    readinessScore: asNumber(row.readiness_score),
    businessType: cleanText(row.business_type),
    budgetBand: cleanText(row.budget_band),
    urgency: cleanText(row.urgency),
    requestedPackageId: cleanText(row.requested_package_id) || null,
    preferredTeamId: cleanText(row.preferred_team_id) || null,
    matchedTeamId: cleanText(row.matched_team_id) || null,
  };
}

function mapBrief(row: Record<string, unknown>): StudioBrief {
  return {
    id: cleanText(row.id),
    leadId: cleanText(row.lead_id),
    createdAt: cleanText(row.created_at),
    goals: cleanText(row.goals),
    scopeNotes: cleanText(row.scope_notes),
    businessType: cleanText(row.business_type),
    budgetBand: cleanText(row.budget_band),
    urgency: cleanText(row.urgency),
    timeline: cleanText(row.timeline),
    packageIntent: cleanText(row.package_intent) === "package" ? "package" : "custom",
    techPreferences: arrayOfText(row.tech_preferences),
    requiredFeatures: arrayOfText(row.required_features),
    referenceFiles: [],
    referenceLinks: arrayOfText(row.reference_links),
  };
}

function mapCustomRequest(row: Record<string, unknown>): StudioCustomRequest {
  return {
    id: cleanText(row.id),
    leadId: cleanText(row.lead_id),
    createdAt: cleanText(row.created_at),
    projectType: cleanText(row.project_type),
    platformPreference: cleanText(row.platform_preference),
    designDirection: cleanText(row.design_direction),
    pageRequirements: arrayOfText(row.page_requirements),
    addonServices: arrayOfText(row.addon_services),
    inspirationSummary: cleanText(row.inspiration_summary),
  };
}

function mapPayment(row: Record<string, unknown>): StudioPayment {
  return {
    id: cleanText(row.id),
    projectId: cleanText(row.project_id),
    milestoneId: cleanText(row.milestone_id) || null,
    createdAt: cleanText(row.created_at),
    updatedAt: cleanText(row.updated_at),
    label: cleanText(row.label),
    amount: asNumber(row.amount),
    currency: cleanText(row.currency) || "NGN",
    status: cleanText(row.status) as StudioPayment["status"],
    dueDate: cleanText(row.due_date) || null,
    method: cleanText(row.method),
    proofUrl: cleanText(row.proof_url) || null,
    proofName: cleanText(row.proof_name) || null,
  };
}

function mapFile(row: Record<string, unknown>): StudioProjectFile {
  return {
    id: cleanText(row.id),
    projectId: cleanText(row.project_id || row.lead_id),
    leadId: cleanText(row.lead_id) || null,
    briefId: cleanText(row.brief_id) || null,
    createdAt: cleanText(row.created_at),
    kind: cleanText(row.kind) as StudioProjectFile["kind"],
    label: cleanText(row.label),
    path: cleanText(row.path),
    bucket: cleanText(row.bucket),
    size: row.size == null ? null : asNumber(row.size),
    mimeType: cleanText(row.mime_type) || null,
  };
}

function mapDeliverable(row: Record<string, unknown>): StudioDeliverable {
  return {
    id: cleanText(row.id),
    projectId: cleanText(row.project_id),
    createdAt: cleanText(row.created_at),
    label: cleanText(row.label),
    summary: cleanText(row.summary),
    fileIds: arrayOfText(row.file_ids),
    status: cleanText(row.status) === "approved" ? "approved" : "shared",
  };
}

function mapRevision(row: Record<string, unknown>): StudioRevision {
  return {
    id: cleanText(row.id),
    projectId: cleanText(row.project_id),
    createdAt: cleanText(row.created_at),
    updatedAt: cleanText(row.updated_at),
    requestedBy: cleanText(row.requested_by) === "team" ? "team" : "client",
    summary: cleanText(row.summary),
    status:
      cleanText(row.status) === "completed"
        ? "completed"
        : cleanText(row.status) === "in_progress"
          ? "in_progress"
          : "open",
  };
}

function mapMessage(row: Record<string, unknown>): StudioProjectMessage {
  return {
    id: cleanText(row.id),
    projectId: cleanText(row.project_id),
    createdAt: cleanText(row.created_at),
    sender: cleanText(row.sender),
    senderRole: cleanText(row.sender_role),
    body: cleanText(row.body),
    isInternal: Boolean(row.is_internal),
  };
}

function mapNotification(row: Record<string, unknown>): StudioNotification {
  return {
    id: cleanText(row.id),
    createdAt: cleanText(row.created_at),
    entityId: cleanText(row.entity_id) || null,
    channel: cleanText(row.channel) === "whatsapp" ? "whatsapp" : "email",
    templateKey: cleanText(row.template_key),
    recipient: cleanText(row.recipient),
    subject: cleanText(row.subject),
    status:
      cleanText(row.status) === "sent"
        ? "sent"
        : cleanText(row.status) === "failed"
          ? "failed"
          : cleanText(row.status) === "skipped"
            ? "skipped"
            : "queued",
    reason: cleanText(row.reason) || null,
  };
}

function mapProjectUpdate(row: Record<string, unknown>): StudioProjectUpdate {
  return {
    id: cleanText(row.id),
    projectId: cleanText(row.project_id),
    createdAt: cleanText(row.created_at),
    kind: cleanText(row.kind),
    title: cleanText(row.title),
    summary: cleanText(row.summary),
  };
}

function mapReview(row: Record<string, unknown>): StudioReview {
  return {
    id: cleanText(row.id),
    projectId: cleanText(row.project_id),
    createdAt: cleanText(row.created_at),
    customerName: cleanText(row.customer_name),
    rating: Math.max(1, Math.min(5, asNumber(row.rating, 5))),
    quote: cleanText(row.quote),
    company: cleanText(row.company) || null,
    published: Boolean(row.published),
  };
}

function mapProposalMilestone(row: Record<string, unknown>) {
  return {
    id: cleanText(row.id),
    proposalId: cleanText(row.proposal_id),
    name: cleanText(row.name),
    amount: asNumber(row.amount),
    description: cleanText(row.description),
    dueLabel: cleanText(row.due_label),
    sortOrder: asNumber(row.sort_order),
  };
}

function mapProjectMilestoneRow(row: Record<string, unknown>) {
  return {
    id: cleanText(row.id),
    projectId: cleanText(row.project_id),
    name: cleanText(row.name),
    description: cleanText(row.description),
    dueLabel: cleanText(row.due_label),
    amount: asNumber(row.amount),
    status:
      cleanText(row.status) === "approved"
        ? "approved"
        : cleanText(row.status) === "ready_for_review"
          ? "ready_for_review"
          : cleanText(row.status) === "in_progress"
            ? "in_progress"
            : "planned",
    sortOrder: asNumber(row.sort_order),
  };
}

function mapSupportThread(row: Record<string, unknown>): StudioSupportThread {
  return {
    id: cleanText(row.id),
    userId: cleanText(row.user_id),
    subject: cleanText(row.subject),
    division: cleanText(row.division) || null,
    category: cleanText(row.category),
    status: cleanText(row.status),
    priority: cleanText(row.priority),
    referenceType: cleanText(row.reference_type) || null,
    referenceId: cleanText(row.reference_id) || null,
    assignedTo: cleanText(row.assigned_to) || null,
    resolvedAt: cleanText(row.resolved_at) || null,
    closedAt: cleanText(row.closed_at) || null,
    createdAt: cleanText(row.created_at),
    updatedAt: cleanText(row.updated_at),
  };
}

function mapSupportMessage(row: Record<string, unknown>): StudioSupportMessage {
  return {
    id: cleanText(row.id),
    threadId: cleanText(row.thread_id),
    senderId: cleanText(row.sender_id),
    senderType: cleanText(row.sender_type),
    body: cleanText(row.body),
    attachments:
      Array.isArray(row.attachments) && row.attachments.every((item) => safeRecord(item))
        ? (row.attachments as Array<Record<string, unknown>>)
        : [],
    createdAt: cleanText(row.created_at),
  };
}

function proposalAccessKey(id: string) {
  return createAccessKey(accessSeed("proposal", id));
}

function projectAccessKey(id: string) {
  return createAccessKey(accessSeed("project", id));
}

function proposalMatchesAccess(row: Record<string, unknown>, accessKey?: string | null) {
  if (!accessKey) return false;
  return cleanText(row.access_token_hash) === hashAccessKey(accessKey);
}

function projectMatchesAccess(row: Record<string, unknown>, accessKey?: string | null) {
  if (!accessKey) return false;
  return cleanText(row.access_token_hash) === hashAccessKey(accessKey);
}

async function upsertLead(lead: StudioLead, meta?: UpsertMeta) {
  const payload = {
    id: lead.id,
    user_id: lead.userId,
    normalized_email: normalizeEmail(lead.normalizedEmail || meta?.email),
    customer_name: lead.customerName,
    company_name: lead.companyName,
    phone: safePhone(lead.phone),
    service_kind: lead.serviceKind,
    status: lead.status,
    readiness_score: Math.max(0, Math.min(100, Math.round(lead.readinessScore))),
    business_type: lead.businessType,
    budget_band: lead.budgetBand,
    urgency: lead.urgency,
    requested_package_id: lead.requestedPackageId,
    preferred_team_id: lead.preferredTeamId,
    matched_team_id: lead.matchedTeamId,
    deposit_requested: lead.status === "won",
    created_at: lead.createdAt,
    updated_at: lead.updatedAt,
  };

  await upsertTableRecord("studio_leads", payload, meta);
  await ensureCustomerProfile({
    userId: lead.userId,
    email: payload.normalized_email,
    fullName: lead.customerName,
    phone: payload.phone,
  });
  await appendCustomerActivity({
    userId: lead.userId,
    email: payload.normalized_email,
    activityType: "studio_lead_submitted",
    title: `Studio brief submitted for ${lead.customerName}`,
    description: `${lead.serviceKind.replaceAll("_", " ")} request in ${lead.budgetBand}.`,
    status: lead.status,
    referenceType: "studio_lead",
    referenceId: lead.id,
    metadata: {
      readiness_score: lead.readinessScore,
      matched_team_id: lead.matchedTeamId,
    },
  });
}

async function upsertBrief(brief: StudioBrief, meta?: UpsertMeta) {
  await upsertTableRecord(
    "studio_briefs",
    {
      id: brief.id,
      lead_id: brief.leadId,
      goals: brief.goals,
      scope_notes: brief.scopeNotes,
      business_type: brief.businessType,
      budget_band: brief.budgetBand,
      urgency: brief.urgency,
      timeline: brief.timeline,
      package_intent: brief.packageIntent,
      tech_preferences: brief.techPreferences,
      required_features: brief.requiredFeatures,
      reference_links: brief.referenceLinks,
      created_at: brief.createdAt,
    },
    meta
  );

  if (brief.referenceFiles.length > 0 && (await hasStudioTable("studio_project_files"))) {
    const admin = createAdminSupabase();
    await admin
      .from("studio_project_files")
      .update({ brief_id: brief.id } as never)
      .in("path", brief.referenceFiles)
      .eq("kind", "reference");
  }

  await writeStudioLog({
    eventType: "studio_brief_upsert",
    meta,
    details: { brief_id: brief.id, lead_id: brief.leadId },
  });
}

async function upsertProposal(proposal: StudioProposal, meta?: UpsertMeta) {
  const accessKey = proposal.accessKey || proposalAccessKey(proposal.id);

  await upsertTableRecord(
    "studio_proposals",
    {
      id: proposal.id,
      lead_id: proposal.leadId,
      access_token_hash: hashAccessKey(accessKey),
      access_token_hint: accessKey.slice(-6),
      status: proposal.status,
      title: proposal.title,
      summary: proposal.summary,
      investment: Math.round(asNumber(proposal.investment)),
      deposit_amount: Math.round(asNumber(proposal.depositAmount)),
      currency: proposal.currency,
      valid_until: proposal.validUntil,
      team_id: proposal.teamId,
      service_id: proposal.serviceId,
      package_id: proposal.packageId,
      scope_bullets: proposal.scopeBullets,
      comparison_notes: proposal.comparisonNotes,
      created_at: proposal.createdAt,
      updated_at: proposal.updatedAt,
    },
    meta
  );

  if (proposal.milestones.length > 0) {
    for (const [index, milestone] of proposal.milestones.entries()) {
      await upsertTableRecord(
        "studio_proposal_milestones",
        {
          id: milestone.id,
          proposal_id: proposal.id,
          name: milestone.name,
          amount: Math.round(asNumber(milestone.amount)),
          description: milestone.description,
          due_label: milestone.dueLabel,
          sort_order: index,
          created_at: proposal.updatedAt,
        },
        meta
      );
    }
  }

  await appendCustomerActivity({
    userId: meta?.userId,
    email: meta?.email,
    activityType: "studio_proposal_ready",
    title: proposal.title,
    description: proposal.summary,
    status: proposal.status,
    referenceType: "studio_proposal",
    referenceId: proposal.id,
    amount: Math.round(asNumber(proposal.investment)),
    metadata: {
      deposit_amount: proposal.depositAmount,
      service_id: proposal.serviceId,
      team_id: proposal.teamId,
    },
    actionUrl: `/proposals/${proposal.id}`,
  });
}

async function upsertProject(project: StudioProject, meta?: UpsertMeta) {
  const accessKey = project.accessKey || projectAccessKey(project.id);

  await upsertTableRecord(
    "studio_projects",
    {
      id: project.id,
      proposal_id: project.proposalId,
      lead_id: project.leadId,
      access_token_hash: hashAccessKey(accessKey),
      access_token_hint: accessKey.slice(-6),
      client_user_id: project.clientUserId,
      normalized_email: normalizeEmail(project.normalizedEmail || meta?.email),
      status: project.status,
      title: project.title,
      summary: project.summary,
      next_action: project.nextAction,
      service_id: project.serviceId,
      package_id: project.packageId,
      team_id: project.teamId,
      confidence: Math.max(0, Math.min(100, Math.round(asNumber(project.confidence)))),
      created_at: project.createdAt,
      updated_at: project.updatedAt,
    },
    meta
  );

  if (project.assignments.length > 0) {
    for (const assignment of project.assignments) {
      await upsertTableRecord(
        "studio_project_assignments",
        {
          id: assignment.id,
          project_id: project.id,
          team_id: assignment.teamId,
          role: assignment.role,
          label: assignment.label,
          created_at: project.updatedAt,
        },
        meta
      );
    }
  }

  if (project.milestones.length > 0) {
    for (const [index, milestone] of project.milestones.entries()) {
      await upsertTableRecord(
        "studio_project_milestones",
        {
          id: milestone.id,
          project_id: project.id,
          name: milestone.name,
          description: milestone.description,
          due_label: milestone.dueLabel,
          amount: Math.round(asNumber(milestone.amount)),
          status: milestone.status,
          sort_order: index,
          created_at: project.createdAt,
          updated_at: project.updatedAt,
        },
        meta
      );
    }
  }

  await appendCustomerActivity({
    userId: project.clientUserId,
    email: project.normalizedEmail || meta?.email,
    activityType: "studio_project_updated",
    title: project.title,
    description: project.nextAction,
    status: project.status,
    referenceType: "studio_project",
    referenceId: project.id,
    metadata: {
      confidence: project.confidence,
      service_id: project.serviceId,
      team_id: project.teamId,
    },
    actionUrl: `/project/${project.id}`,
  });
}

async function upsertPayment(payment: StudioPayment, meta?: UpsertMeta) {
  await upsertTableRecord(
    "studio_payments",
    {
      id: payment.id,
      project_id: payment.projectId,
      milestone_id: payment.milestoneId,
      label: payment.label,
      amount: Math.round(asNumber(payment.amount)),
      currency: payment.currency,
      status: payment.status,
      due_date: payment.dueDate,
      method: payment.method,
      proof_url: payment.proofUrl,
      proof_name: payment.proofName,
      created_at: payment.createdAt,
      updated_at: payment.updatedAt,
    },
    meta
  );

  await upsertCustomerInvoice({
    userId: meta?.userId,
    email: meta?.email,
    invoiceNo: `STUDIO-${payment.id.slice(0, 8).toUpperCase()}`,
    status: payment.status === "paid" ? "paid" : payment.status === "cancelled" ? "cancelled" : "open",
    subtotal: Math.round(asNumber(payment.amount)),
    total: Math.round(asNumber(payment.amount)),
    currency: payment.currency,
    description: payment.label,
    lineItems: [
      {
        label: payment.label,
        amount_kobo: Math.round(asNumber(payment.amount) * 100),
      },
    ],
    paymentMethod: payment.method,
    paymentReference: payment.id,
    referenceType: "studio_payment",
    referenceId: payment.id,
    dueDate: payment.dueDate,
    paidAt: payment.status === "paid" ? payment.updatedAt : null,
  });

  await appendCustomerActivity({
    userId: meta?.userId,
    email: meta?.email,
    activityType: "studio_payment_updated",
    title: payment.label,
    description: `${payment.status} · ${paymentDisplay(payment.amount, payment.currency)}`,
    status: payment.status,
    referenceType: "studio_payment",
    referenceId: payment.id,
    amount: Math.round(asNumber(payment.amount)),
    metadata: {
      milestone_id: payment.milestoneId,
      project_id: payment.projectId,
    },
  });
}

async function upsertFile(file: StudioProjectFile, meta?: UpsertMeta) {
  const leadId = file.leadId || (file.kind === "reference" ? file.projectId : null);
  const projectId = file.kind === "reference" ? null : file.projectId;

  await upsertTableRecord(
    "studio_project_files",
    {
      id: file.id,
      project_id: projectId,
      lead_id: leadId,
      brief_id: file.briefId,
      kind: file.kind,
      label: file.label,
      path: file.path,
      bucket: file.bucket,
      size: file.size,
      mime_type: file.mimeType,
      created_at: file.createdAt,
    },
    meta
  );

  if (file.kind !== "reference") {
    await appendCustomerDocument({
      userId: meta?.userId,
      email: meta?.email,
      name: file.label,
      type: file.kind === "proof" ? "payment-proof" : "deliverable",
      fileUrl: `storage://${file.bucket}/${file.path}`,
      fileSize: file.size,
      mimeType: file.mimeType,
      referenceType: "studio_file",
      referenceId: file.id,
      metadata: {
        bucket: file.bucket,
        path: file.path,
        project_id: file.projectId,
      },
    });
  }
}

async function appendMessage(message: StudioProjectMessage, meta?: UpsertMeta) {
  await insertTableRecord(
    "studio_project_messages",
    {
      id: message.id,
      project_id: message.projectId,
      sender: message.sender,
      sender_role: message.senderRole,
      body: message.body,
      is_internal: message.isInternal,
      created_at: message.createdAt,
    },
    meta
  );

  if (!message.isInternal) {
    await appendCustomerActivity({
      userId: meta?.userId,
      email: meta?.email,
      activityType: "studio_message_added",
      title: `New message from ${message.sender}`,
      description: message.body.slice(0, 180),
      status: "visible",
      referenceType: "studio_project_message",
      referenceId: message.id,
      metadata: {
        project_id: message.projectId,
        sender_role: message.senderRole,
      },
    });
  }
}

async function upsertDeliverable(deliverable: StudioDeliverable, meta?: UpsertMeta) {
  await upsertTableRecord(
    "studio_deliverables",
    {
      id: deliverable.id,
      project_id: deliverable.projectId,
      label: deliverable.label,
      summary: deliverable.summary,
      file_ids: deliverable.fileIds,
      status: deliverable.status,
      created_at: deliverable.createdAt,
    },
    meta
  );

  await appendCustomerActivity({
    userId: meta?.userId,
    email: meta?.email,
    activityType: "studio_deliverable_shared",
    title: deliverable.label,
    description: deliverable.summary,
    status: deliverable.status,
    referenceType: "studio_deliverable",
    referenceId: deliverable.id,
    metadata: {
      project_id: deliverable.projectId,
      file_ids: deliverable.fileIds,
    },
  });
}

async function upsertRevision(revision: StudioRevision, meta?: UpsertMeta) {
  await upsertTableRecord(
    "studio_revisions",
    {
      id: revision.id,
      project_id: revision.projectId,
      requested_by: revision.requestedBy,
      summary: revision.summary,
      status: revision.status,
      created_at: revision.createdAt,
      updated_at: revision.updatedAt,
    },
    meta
  );

  await appendCustomerActivity({
    userId: meta?.userId,
    email: meta?.email,
    activityType: "studio_revision_updated",
    title: `Revision ${revision.status}`,
    description: revision.summary,
    status: revision.status,
    referenceType: "studio_revision",
    referenceId: revision.id,
    metadata: {
      project_id: revision.projectId,
      requested_by: revision.requestedBy,
    },
  });
}

async function upsertReview(review: StudioReview, meta?: UpsertMeta) {
  await upsertTableRecord(
    "studio_reviews",
    {
      id: review.id,
      project_id: review.projectId,
      customer_name: review.customerName,
      rating: review.rating,
      quote: review.quote,
      company: review.company,
      published: review.published,
      created_at: review.createdAt,
    },
    meta
  );

  await appendCustomerActivity({
    userId: meta?.userId,
    email: meta?.email,
    activityType: "studio_review_added",
    title: `Review submitted by ${review.customerName}`,
    description: review.quote,
    status: review.published ? "published" : "draft",
    referenceType: "studio_review",
    referenceId: review.id,
    metadata: {
      rating: review.rating,
      project_id: review.projectId,
    },
  });
}

async function appendNotification(notification: StudioNotification, meta?: UpsertMeta) {
  await insertTableRecord(
    "studio_notifications",
    {
      id: notification.id,
      user_id: meta?.userId ?? null,
      normalized_email: normalizeEmail(meta?.email),
      entity_type: "record",
      entity_id: notification.entityId,
      channel: notification.channel,
      template_key: notification.templateKey,
      recipient: notification.recipient,
      subject: notification.subject,
      status: notification.status,
      reason: notification.reason,
      payload: {
        created_at: notification.createdAt,
      },
      created_at: notification.createdAt,
    },
    meta
  );

  await appendCustomerNotification({
    userId: meta?.userId,
    email: meta?.email,
    title: notification.subject,
    body: notification.reason || `Studio ${notification.channel} update`,
    category: "studio",
    priority: notification.status === "failed" ? "high" : "normal",
    referenceType: "studio_notification",
    referenceId: notification.id,
  });
}

type ProposalMilestoneRow = ReturnType<typeof mapProposalMilestone>;
type ProjectMilestoneRow = ReturnType<typeof mapProjectMilestoneRow>;

function buildProposal(
  row: Record<string, unknown>,
  milestoneRows: ProposalMilestoneRow[]
): StudioProposal {
  const id = cleanText(row.id);
  return {
    id,
    leadId: cleanText(row.lead_id),
    createdAt: cleanText(row.created_at),
    updatedAt: cleanText(row.updated_at),
    accessKey: proposalAccessKey(id),
    status: cleanText(row.status) as StudioProposal["status"],
    title: cleanText(row.title),
    summary: cleanText(row.summary),
    investment: asNumber(row.investment),
    depositAmount: asNumber(row.deposit_amount),
    currency: cleanText(row.currency) || "NGN",
    validUntil: cleanText(row.valid_until),
    teamId: cleanText(row.team_id) || null,
    serviceId: cleanText(row.service_id),
    packageId: cleanText(row.package_id) || null,
    scopeBullets: arrayOfText(row.scope_bullets),
    milestones: milestoneRows
      .filter((item) => item.proposalId === id)
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((item) => ({
        id: item.id,
        name: item.name,
        amount: item.amount,
        description: item.description,
        dueLabel: item.dueLabel,
      })),
    comparisonNotes: arrayOfText(row.comparison_notes),
  };
}

function buildProject(
  row: Record<string, unknown>,
  assignmentRows: Array<Record<string, unknown>>,
  milestoneRows: ProjectMilestoneRow[]
): StudioProject {
  const id = cleanText(row.id);
  return {
    id,
    proposalId: cleanText(row.proposal_id),
    leadId: cleanText(row.lead_id),
    createdAt: cleanText(row.created_at),
    updatedAt: cleanText(row.updated_at),
    accessKey: projectAccessKey(id),
    clientUserId: cleanText(row.client_user_id) || null,
    normalizedEmail: normalizeEmail(row.normalized_email as string | null),
    status: cleanText(row.status) as StudioProject["status"],
    title: cleanText(row.title),
    summary: cleanText(row.summary),
    nextAction: cleanText(row.next_action),
    serviceId: cleanText(row.service_id),
    packageId: cleanText(row.package_id) || null,
    teamId: cleanText(row.team_id) || null,
    confidence: asNumber(row.confidence),
    assignments: assignmentRows
      .filter((item) => cleanText(item.project_id) === id)
      .map((item) => ({
        id: cleanText(item.id),
        projectId: cleanText(item.project_id),
        teamId: cleanText(item.team_id),
        role: cleanText(item.role),
        label: cleanText(item.label),
      })),
    milestones: milestoneRows
      .filter((item) => item.projectId === id)
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((item) => ({
        id: item.id,
        projectId: item.projectId,
        name: item.name,
        description: item.description,
        dueLabel: item.dueLabel,
        amount: item.amount,
        status: item.status,
      }) as StudioProjectMilestone),
  };
}

export async function upsertStudioRecord(
  eventType: StudioUpsertEvent,
  record:
    | StudioLead
    | StudioBrief
    | StudioProposal
    | StudioProject
    | StudioPayment
    | StudioProjectFile
    | StudioProjectMessage
    | StudioDeliverable
    | StudioRevision
    | StudioReview
    | StudioNotification,
  meta?: UpsertMeta
) {
  switch (eventType) {
    case "studio_lead_upsert":
      await upsertLead(record as StudioLead, meta);
      break;
    case "studio_brief_upsert":
      await upsertBrief(record as StudioBrief, meta);
      break;
    case "studio_proposal_upsert":
      await upsertProposal(record as StudioProposal, meta);
      break;
    case "studio_project_upsert":
      await upsertProject(record as StudioProject, meta);
      break;
    case "studio_payment_upsert":
      await upsertPayment(record as StudioPayment, meta);
      break;
    case "studio_file_upsert":
      await upsertFile(record as StudioProjectFile, meta);
      break;
    case "studio_message_append":
      await appendMessage(record as StudioProjectMessage, meta);
      break;
    case "studio_deliverable_upsert":
      await upsertDeliverable(record as StudioDeliverable, meta);
      break;
    case "studio_revision_upsert":
      await upsertRevision(record as StudioRevision, meta);
      break;
    case "studio_review_upsert":
      await upsertReview(record as StudioReview, meta);
      break;
    case "studio_notification_append":
      await appendNotification(record as StudioNotification, meta);
      break;
    default:
      break;
  }

  await writeStudioLog({
    eventType,
    meta,
    details: {
      record_id: safeRecord(record)?.id ?? null,
    },
  });

  return record;
}

export async function getStudioSnapshot(): Promise<StudioSnapshot> {
  const [
    leadRows,
    briefRows,
    customRequestRows,
    proposalRows,
    proposalMilestoneRows,
    projectRows,
    assignmentRows,
    projectMilestoneRows,
    projectUpdateRows,
    paymentRows,
    fileRows,
    deliverableRows,
    revisionRows,
    messageRows,
    notificationRows,
    reviewRows,
    supportThreadRows,
    supportMessageRows,
  ] = await Promise.all([
    selectRows<Record<string, unknown>>("studio_leads", "*", "created_at"),
    selectRows<Record<string, unknown>>("studio_briefs", "*", "created_at"),
    selectRows<Record<string, unknown>>("studio_custom_requests", "*", "created_at"),
    selectRows<Record<string, unknown>>("studio_proposals", "*", "created_at"),
    selectRows<Record<string, unknown>>("studio_proposal_milestones", "*", "sort_order"),
    selectRows<Record<string, unknown>>("studio_projects", "*", "created_at"),
    selectRows<Record<string, unknown>>("studio_project_assignments", "*", "created_at"),
    selectRows<Record<string, unknown>>("studio_project_milestones", "*", "sort_order"),
    selectRows<Record<string, unknown>>("studio_project_updates", "*", "created_at"),
    selectRows<Record<string, unknown>>("studio_payments", "*", "created_at"),
    selectRows<Record<string, unknown>>("studio_project_files", "*", "created_at"),
    selectRows<Record<string, unknown>>("studio_deliverables", "*", "created_at"),
    selectRows<Record<string, unknown>>("studio_revisions", "*", "created_at"),
    selectRows<Record<string, unknown>>("studio_project_messages", "*", "created_at"),
    selectRows<Record<string, unknown>>("studio_notifications", "*", "created_at"),
    selectRows<Record<string, unknown>>("studio_reviews", "*", "created_at"),
    selectRows<Record<string, unknown>>("support_threads", "*", "created_at"),
    selectRows<Record<string, unknown>>("support_messages", "*", "created_at"),
  ]);

  const files = fileRows.map(mapFile);
  const briefs = briefRows.map(mapBrief).map((brief) => ({
    ...brief,
    referenceFiles: files
      .filter((file) => file.briefId === brief.id || (file.leadId === brief.leadId && file.kind === "reference"))
      .map((file) => file.path),
  }));
  const proposalMilestones = proposalMilestoneRows.map(mapProposalMilestone);
  const projectMilestones = projectMilestoneRows.map(mapProjectMilestoneRow);

  return {
    leads: leadRows.map(mapLead),
    briefs,
    customRequests: customRequestRows.map(mapCustomRequest),
    proposals: proposalRows.map((row) => buildProposal(row, proposalMilestones)),
    projects: projectRows.map((row) => buildProject(row, assignmentRows, projectMilestones)),
    projectUpdates: projectUpdateRows.map(mapProjectUpdate),
    payments: paymentRows.map(mapPayment),
    files,
    deliverables: deliverableRows.map(mapDeliverable),
    revisions: revisionRows.map(mapRevision),
    messages: messageRows.map(mapMessage),
    notifications: notificationRows.map(mapNotification),
    reviews: reviewRows.map(mapReview),
    supportThreads: supportThreadRows
      .filter((row) => cleanText(row.division).toLowerCase() === "studio")
      .map(mapSupportThread),
    supportMessages: supportMessageRows.map(mapSupportMessage),
  };
}

export async function getStudioProposalById(proposalId: string, accessKey?: string | null) {
  try {
    if (!(await hasStudioTable("studio_proposals"))) {
      const [proposalRows, milestoneRows] = await Promise.all([
        readFallbackRows<Record<string, unknown>>("studio_proposals"),
        readFallbackRows<Record<string, unknown>>("studio_proposal_milestones"),
      ]);
      const row = proposalRows.find((item) => cleanText(item.id) === proposalId) ?? null;
      if (!row) return null;
      if (accessKey && !proposalMatchesAccess(row, accessKey)) return null;
      return buildProposal(row, milestoneRows.map(mapProposalMilestone));
    }

    const admin = createAdminSupabase();
    const { data: row, error } = await admin
      .from("studio_proposals")
      .select("*")
      .eq("id", proposalId)
      .maybeSingle<Record<string, unknown>>();

    if (error || !row) return null;
    if (accessKey && !proposalMatchesAccess(row, accessKey)) return null;

    const { data: milestoneRows } = await admin
      .from("studio_proposal_milestones")
      .select("*")
      .eq("proposal_id", proposalId)
      .order("sort_order", { ascending: true });

    return buildProposal(row, (milestoneRows ?? []).map(mapProposalMilestone));
  } catch {
    return null;
  }
}

export async function getStudioProjectById(projectId: string, accessKey?: string | null) {
  try {
    if (!(await hasStudioTable("studio_projects"))) {
      const [projectRows, assignmentRows, milestoneRows] = await Promise.all([
        readFallbackRows<Record<string, unknown>>("studio_projects"),
        readFallbackRows<Record<string, unknown>>("studio_project_assignments"),
        readFallbackRows<Record<string, unknown>>("studio_project_milestones"),
      ]);
      const row = projectRows.find((item) => cleanText(item.id) === projectId) ?? null;
      if (!row) return null;
      if (accessKey && !projectMatchesAccess(row, accessKey)) return null;
      return buildProject(row, assignmentRows, milestoneRows.map(mapProjectMilestoneRow));
    }

    const admin = createAdminSupabase();
    const { data: row, error } = await admin
      .from("studio_projects")
      .select("*")
      .eq("id", projectId)
      .maybeSingle<Record<string, unknown>>();

    if (error || !row) return null;
    if (accessKey && !projectMatchesAccess(row, accessKey)) return null;

    const [{ data: assignmentRows }, { data: milestoneRows }] = await Promise.all([
      admin.from("studio_project_assignments").select("*").eq("project_id", projectId),
      admin
        .from("studio_project_milestones")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true }),
    ]);

    return buildProject(
      row,
      (assignmentRows ?? []) as Array<Record<string, unknown>>,
      (milestoneRows ?? []).map(mapProjectMilestoneRow)
    );
  } catch {
    return null;
  }
}
