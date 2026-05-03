import "server-only";

import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase, hasAdminSupabaseEnv } from "@/lib/supabase";
import {
  clean,
  mapDeliverableRow,
  mapInvoiceRow,
  mapMessageRow,
  mapMilestoneRow,
  mapPaymentRow,
  mapProjectRow,
  mapProjectUpdateRow,
} from "@/lib/portal/helpers";
import type {
  AttentionItem,
  ClientDeliverable,
  ClientMessage,
  ClientMilestone,
  ClientPaymentSummary,
  ClientPortalViewer,
  ClientProject,
  ClientProjectUpdate,
  StudioInvoice,
  StudioPaymentSubmission,
} from "@/types/portal";

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServer>>;

async function tryFetch<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

async function fetchProjectsForViewer(
  supabase: SupabaseClient,
  viewer: ClientPortalViewer
): Promise<ClientProject[]> {
  return tryFetch(async () => {
    const orFilter = viewer.normalizedEmail
      ? `client_user_id.eq.${viewer.userId},normalized_email.eq.${viewer.normalizedEmail}`
      : `client_user_id.eq.${viewer.userId}`;

    const { data, error } = await supabase
      .from("studio_projects")
      .select(
        "id,title,brief,summary,next_action,project_type,status,start_date,estimated_completion,actual_completion,client_user_id,team_lead_id,access_token_hint,created_at,updated_at"
      )
      .or(orFilter)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return ((data ?? []) as Array<Record<string, unknown>>).map(mapProjectRow);
  }, []);
}

async function fetchMilestonesForProjects(
  supabase: SupabaseClient,
  projectIds: string[],
  viewerId: string
): Promise<ClientMilestone[]> {
  if (projectIds.length === 0) return [];

  return tryFetch(async () => {
    const { data, error } = await supabase
      .from("studio_project_milestones")
      .select(
        "id,project_id,name,description,due_label,due_date,amount,amount_kobo,currency,status,sort_order,order_index"
      )
      .in("project_id", projectIds)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return ((data ?? []) as Array<Record<string, unknown>>).map((row) =>
      mapMilestoneRow(row, "NGN", viewerId)
    );
  }, []);
}

async function fetchDeliverablesForProjects(
  supabase: SupabaseClient,
  projectIds: string[]
): Promise<ClientDeliverable[]> {
  if (projectIds.length === 0) return [];

  return tryFetch(async () => {
    const { data, error } = await supabase
      .from("studio_deliverables")
      .select(
        "id,project_id,milestone_id,label,summary,file_url,file_public_id,file_type,thumbnail_url,version,status,shared_at,approved_at,approved_by,uploaded_by,created_at"
      )
      .in("project_id", projectIds)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return ((data ?? []) as Array<Record<string, unknown>>).map(mapDeliverableRow);
  }, []);
}

async function fetchInvoicesForViewer(
  supabase: SupabaseClient,
  viewer: ClientPortalViewer,
  projectIds?: string[]
): Promise<StudioInvoice[]> {
  return tryFetch(async () => {
    let query = supabase
      .from("studio_client_invoices_v")
      .select(
        "id,project_id,milestone_id,client_user_id,normalized_email,invoice_number,amount_kobo,currency,description,due_date,status,invoice_token,issued_at,paid_at,created_at,updated_at,payment_count,last_submitted_at,last_payment_status,last_payment_id"
      );

    if (projectIds && projectIds.length > 0) {
      query = query.in("project_id", projectIds);
    } else {
      const orFilter = viewer.normalizedEmail
        ? `client_user_id.eq.${viewer.userId},normalized_email.eq.${viewer.normalizedEmail}`
        : `client_user_id.eq.${viewer.userId}`;
      query = query.or(orFilter);
    }

    const { data, error } = await query.order("issued_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as Array<Record<string, unknown>>).map(mapInvoiceRow);
  }, []);
}

async function fetchMessagesForProjects(
  supabase: SupabaseClient,
  projectIds: string[],
  viewerId: string
): Promise<ClientMessage[]> {
  if (projectIds.length === 0) return [];

  return tryFetch(async () => {
    const { data, error } = await supabase
      .from("studio_project_messages")
      .select(
        "id,project_id,sender_id,sender,sender_role,body,attachments,read_by,created_at,edited_at,is_internal"
      )
      .in("project_id", projectIds)
      .eq("is_internal", false)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return ((data ?? []) as Array<Record<string, unknown>>).map((row) => mapMessageRow(row, viewerId));
  }, []);
}

async function fetchUpdatesForProjects(
  supabase: SupabaseClient,
  projectIds: string[]
): Promise<ClientProjectUpdate[]> {
  if (projectIds.length === 0) return [];

  return tryFetch(async () => {
    const { data, error } = await supabase
      .from("studio_project_updates")
      .select("id,project_id,author_id,update_type,kind,title,summary,body,metadata,created_at")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false })
      .limit(60);

    if (error) throw error;
    return ((data ?? []) as Array<Record<string, unknown>>).map(mapProjectUpdateRow);
  }, []);
}

async function fetchPaymentsForProjects(
  supabase: SupabaseClient,
  projectIds: string[]
): Promise<StudioPaymentSubmission[]> {
  if (projectIds.length === 0) return [];

  return tryFetch(async () => {
    const { data, error } = await supabase
      .from("studio_payments")
      .select(
        "id,invoice_id,project_id,client_user_id,amount,amount_kobo,currency,payment_reference,reference,proof_url,proof_public_id,proof_name,submitted_at,verified_at,verified_by,status,rejection_reason,notes,created_at"
      )
      .in("project_id", projectIds)
      .order("submitted_at", { ascending: false, nullsFirst: false });

    if (error) throw error;
    return ((data ?? []) as Array<Record<string, unknown>>).map(mapPaymentRow);
  }, []);
}

export type ClientPortalSnapshot = {
  viewer: ClientPortalViewer;
  projects: ClientProject[];
  milestones: ClientMilestone[];
  invoices: StudioInvoice[];
  deliverables: ClientDeliverable[];
  messages: ClientMessage[];
  updates: ClientProjectUpdate[];
  payments: StudioPaymentSubmission[];
};

export async function getClientPortalSnapshot(
  viewer: ClientPortalViewer
): Promise<ClientPortalSnapshot> {
  const supabase = await createSupabaseServer();
  const projects = await fetchProjectsForViewer(supabase, viewer);
  const projectIds = projects.map((project) => project.id);

  const [milestones, deliverables, invoices, messages, updates, payments] = await Promise.all([
    fetchMilestonesForProjects(supabase, projectIds, viewer.userId),
    fetchDeliverablesForProjects(supabase, projectIds),
    fetchInvoicesForViewer(supabase, viewer, projectIds),
    fetchMessagesForProjects(supabase, projectIds, viewer.userId),
    fetchUpdatesForProjects(supabase, projectIds),
    fetchPaymentsForProjects(supabase, projectIds),
  ]);

  return {
    viewer,
    projects,
    milestones,
    invoices,
    deliverables,
    messages,
    updates,
    payments,
  };
}

export async function getClientProject(
  viewer: ClientPortalViewer,
  projectId: string
): Promise<ClientProject | null> {
  const snapshot = await getClientPortalSnapshot(viewer);
  return snapshot.projects.find((project) => project.id === projectId) ?? null;
}

export type ClientProjectDetail = {
  project: ClientProject;
  milestones: ClientMilestone[];
  deliverables: ClientDeliverable[];
  invoices: StudioInvoice[];
  messages: ClientMessage[];
  updates: ClientProjectUpdate[];
  payments: StudioPaymentSubmission[];
  paymentSummary: ClientPaymentSummary;
};

export async function getClientProjectDetail(
  viewer: ClientPortalViewer,
  projectId: string
): Promise<ClientProjectDetail | null> {
  const snapshot = await getClientPortalSnapshot(viewer);
  const project = snapshot.projects.find((item) => item.id === projectId);
  if (!project) return null;

  const milestones = snapshot.milestones.filter((item) => item.projectId === project.id);
  const deliverables = snapshot.deliverables.filter((item) => item.projectId === project.id);
  const invoices = snapshot.invoices.filter((item) => item.projectId === project.id);
  const messages = snapshot.messages.filter((item) => item.projectId === project.id);
  const updates = snapshot.updates.filter((item) => item.projectId === project.id);
  const payments = snapshot.payments.filter((item) => item.projectId === project.id);

  const totalKobo = invoices.reduce((sum, invoice) => sum + invoice.amountKobo, 0);
  const paidKobo = invoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.amountKobo, 0);
  const outstandingKobo = Math.max(0, totalKobo - paidKobo);

  return {
    project,
    milestones: milestones.sort((a, b) => a.orderIndex - b.orderIndex),
    deliverables,
    invoices,
    messages,
    updates,
    payments,
    paymentSummary: {
      totalKobo,
      paidKobo,
      outstandingKobo,
      currency: invoices[0]?.currency || "NGN",
    },
  };
}

const ATTENTION_PROJECT_FALLBACK = "Your project";

export function buildAttentionItems(snapshot: ClientPortalSnapshot): AttentionItem[] {
  const items: AttentionItem[] = [];
  const projectTitleById = new Map(
    snapshot.projects.map((project) => [project.id, project.title])
  );

  for (const invoice of snapshot.invoices) {
    if (
      invoice.status === "sent" ||
      invoice.status === "overdue" ||
      invoice.status === "pending_verification"
    ) {
      items.push({
        kind: "invoice",
        invoice,
        projectTitle: projectTitleById.get(invoice.projectId) || ATTENTION_PROJECT_FALLBACK,
      });
    }
  }

  for (const deliverable of snapshot.deliverables) {
    if (deliverable.status === "shared") {
      items.push({
        kind: "deliverable",
        deliverable,
        projectTitle: projectTitleById.get(deliverable.projectId) || ATTENTION_PROJECT_FALLBACK,
      });
    }
  }

  const unreadMessages = snapshot.messages.filter(
    (message) =>
      message.senderRole !== "client" &&
      !message.isOwnMessage &&
      !message.readBy.includes(snapshot.viewer.userId)
  );

  for (const message of unreadMessages.slice(0, 3)) {
    items.push({
      kind: "message",
      message,
      projectTitle: projectTitleById.get(message.projectId) || ATTENTION_PROJECT_FALLBACK,
    });
  }

  return items;
}

export function unreadMessageCount(snapshot: ClientPortalSnapshot) {
  return snapshot.messages.filter(
    (message) =>
      message.senderRole !== "client" &&
      !message.isOwnMessage &&
      !message.readBy.includes(snapshot.viewer.userId)
  ).length;
}

export function unreadCountForProject(messages: ClientMessage[], viewerId: string): number {
  return messages.filter(
    (message) =>
      message.senderRole !== "client" &&
      !message.isOwnMessage &&
      !message.readBy.includes(viewerId)
  ).length;
}

export type InvoiceLookupResult = {
  invoice: StudioInvoice;
  project: ClientProject | null;
} | null;

export async function getInvoiceByToken(token: string): Promise<InvoiceLookupResult> {
  const safeToken = clean(token);
  if (!safeToken) return null;

  if (!hasAdminSupabaseEnv()) return null;
  const admin = createAdminSupabase();

  try {
    const { data, error } = await admin
      .from("studio_invoices")
      .select("*")
      .eq("invoice_token", safeToken)
      .maybeSingle<Record<string, unknown>>();

    if (error || !data) return null;
    const invoice = mapInvoiceRow(data);

    let project: ClientProject | null = null;
    if (invoice.projectId) {
      const { data: projectRow } = await admin
        .from("studio_projects")
        .select(
          "id,title,brief,summary,next_action,project_type,status,start_date,estimated_completion,actual_completion,client_user_id,team_lead_id,access_token_hint,created_at,updated_at"
        )
        .eq("id", invoice.projectId)
        .maybeSingle<Record<string, unknown>>();
      if (projectRow) project = mapProjectRow(projectRow);
    }

    return { invoice, project };
  } catch {
    return null;
  }
}

export async function getInvoiceByIdForViewer(
  viewer: ClientPortalViewer,
  invoiceId: string
): Promise<StudioInvoice | null> {
  const supabase = await createSupabaseServer();

  try {
    const { data, error } = await supabase
      .from("studio_invoices")
      .select("*")
      .eq("id", invoiceId)
      .maybeSingle<Record<string, unknown>>();

    if (error || !data) return null;
    const invoice = mapInvoiceRow(data);
    if (
      invoice.clientUserId !== viewer.userId &&
      (!viewer.normalizedEmail || invoice.normalizedEmail !== viewer.normalizedEmail)
    ) {
      // RLS would already block this, but the dual check protects against
      // misconfigured policies in dev.
      const projectMatches = await supabase
        .from("studio_projects")
        .select("id")
        .eq("id", invoice.projectId)
        .or(
          viewer.normalizedEmail
            ? `client_user_id.eq.${viewer.userId},normalized_email.eq.${viewer.normalizedEmail}`
            : `client_user_id.eq.${viewer.userId}`
        )
        .maybeSingle();
      if (!projectMatches.data) return null;
    }
    return invoice;
  } catch {
    return null;
  }
}

export async function getOutstandingInvoicesForViewer(
  viewer: ClientPortalViewer
): Promise<StudioInvoice[]> {
  const snapshot = await getClientPortalSnapshot(viewer);
  return snapshot.invoices.filter(
    (invoice) =>
      invoice.status === "sent" ||
      invoice.status === "overdue" ||
      invoice.status === "pending_verification"
  );
}
