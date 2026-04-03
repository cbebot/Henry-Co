import "server-only";

import { createAdminSupabase } from "@/lib/supabase";

type OptionalString = string | null | undefined;

function cleanText(value?: OptionalString) {
  return String(value || "").trim();
}

function createId() {
  return crypto.randomUUID();
}

function normalizeEmail(value?: OptionalString) {
  const email = cleanText(value).toLowerCase();
  return email || null;
}

async function recordPendingSharedSync(input: {
  kind: string;
  userId?: string | null;
  email?: string | null;
  reason?: string | null;
  payload: Record<string, unknown>;
}) {
  try {
    const admin = createAdminSupabase();
    await admin.from("care_security_logs").insert({
      event_type: "studio_shared_sync_pending",
      route: "/studio/shared-account",
      user_id: cleanText(input.userId) || null,
      email: normalizeEmail(input.email),
      role: "studio_system",
      success: false,
      details: {
        kind: cleanText(input.kind),
        reason: cleanText(input.reason) || null,
        payload: input.payload,
      },
    } as never);
  } catch (error) {
    console.error("[studio][shared-account] failed to record pending sync", error);
  }
}

async function findAuthUserIdByEmail(email: string) {
  const admin = createAdminSupabase();

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;

    const match = (data.users ?? []).find((user) => normalizeEmail(user.email) === email);
    if (match?.id) {
      return match.id;
    }

    if ((data.users ?? []).length < 100) {
      break;
    }
  }

  return null;
}

function isMissingAuthUserError(error: unknown) {
  const message =
    typeof error === "object" && error && "message" in error ? String(error.message) : String(error || "");
  return message.includes("violates foreign key constraint") && message.includes("users");
}

async function performSharedWrite(
  kind: string,
  identity: { userId?: string | null; email?: string | null },
  payload: Record<string, unknown>,
  writer: (resolvedUserId: string) => Promise<void>
) {
  const resolvedUserId = await resolveUserId(identity);
  if (!resolvedUserId) {
    await recordPendingSharedSync({
      kind,
      userId: identity.userId,
      email: identity.email,
      reason: "No authenticated user exists yet for this email.",
      payload,
    });
    return null;
  }

  try {
    await writer(resolvedUserId);
    return resolvedUserId;
  } catch (error) {
    if (isMissingAuthUserError(error)) {
      await recordPendingSharedSync({
        kind,
        userId: resolvedUserId,
        email: identity.email,
        reason: typeof error === "object" && error && "message" in error ? String(error.message) : "User identity is not yet available in shared auth.",
        payload,
      });
      return null;
    }

    console.error(`[studio][shared-account] ${kind} failed`, error);
    await recordPendingSharedSync({
      kind,
      userId: resolvedUserId,
      email: identity.email,
      reason: typeof error === "object" && error && "message" in error ? String(error.message) : "Shared account write failed.",
      payload,
    });
    return null;
  }
}

async function resolveUserId(input: {
  userId?: string | null;
  email?: string | null;
}) {
  const direct = cleanText(input.userId);
  if (direct) return direct;

  const email = normalizeEmail(input.email);
  if (!email) return null;

  const admin = createAdminSupabase();
  const [{ data: customerProfile }, { data: sharedProfile }] = await Promise.all([
    admin.from("customer_profiles").select("id").eq("email", email).maybeSingle(),
    admin.from("profiles").select("id").eq("email", email).maybeSingle(),
  ]);

  const knownId = cleanText(customerProfile?.id || sharedProfile?.id);
  if (knownId) return knownId;

  try {
    return await findAuthUserIdByEmail(email);
  } catch (error) {
    console.error("[studio][shared-account] failed to resolve auth user by email", error);
    return null;
  }
}

function toKobo(amount: number) {
  return Math.max(0, Math.round(Number(amount || 0) * 100));
}

export async function ensureCustomerProfile(input: {
  userId?: string | null;
  email?: string | null;
  fullName?: string | null;
  phone?: string | null;
}) {
  const email = normalizeEmail(input.email);
  if (!email) return;

  await performSharedWrite(
    "customer_profile",
    input,
    {
      email,
      full_name: cleanText(input.fullName) || null,
      phone: cleanText(input.phone) || null,
      is_active: true,
    },
    async (userId) => {
      const admin = createAdminSupabase();
      const { error } = await admin.from("customer_profiles").upsert(
        {
          id: userId,
          email,
          full_name: cleanText(input.fullName) || null,
          phone: cleanText(input.phone) || null,
          is_active: true,
        } as never,
        { onConflict: "id" }
      );

      if (error) throw error;
    }
  );
}

export async function appendCustomerActivity(input: {
  userId?: string | null;
  email?: string | null;
  activityType: string;
  title: string;
  description?: string | null;
  status?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  amount?: number | null;
  actionUrl?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const payload = {
    id: createId(),
    division: "studio",
    activity_type: input.activityType,
    title: input.title,
    description: cleanText(input.description) || null,
    status: cleanText(input.status) || null,
    reference_type: cleanText(input.referenceType) || null,
    reference_id: cleanText(input.referenceId) || null,
    amount_kobo: input.amount == null ? null : toKobo(input.amount),
    action_url: cleanText(input.actionUrl) || null,
    metadata: input.metadata ?? {},
  };

  await performSharedWrite("customer_activity", input, payload, async (userId) => {
    const admin = createAdminSupabase();
    const { error } = await admin.from("customer_activity").insert({
      ...payload,
      user_id: userId,
    } as never);

    if (error) throw error;
  });
}

export async function appendCustomerNotification(input: {
  userId?: string | null;
  email?: string | null;
  title: string;
  body: string;
  category?: string | null;
  priority?: string | null;
  actionUrl?: string | null;
  actionLabel?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
}) {
  const payload = {
    id: createId(),
    title: input.title,
    body: input.body,
    category: cleanText(input.category) || "studio",
    priority: cleanText(input.priority) || "normal",
    action_url: cleanText(input.actionUrl) || null,
    action_label: cleanText(input.actionLabel) || null,
    division: "studio",
    reference_type: cleanText(input.referenceType) || null,
    reference_id: cleanText(input.referenceId) || null,
    is_read: false,
  };

  await performSharedWrite("customer_notification", input, payload, async (userId) => {
    const admin = createAdminSupabase();
    const { error } = await admin.from("customer_notifications").insert({
      ...payload,
      user_id: userId,
    } as never);

    if (error) throw error;
  });
}

export async function upsertCustomerInvoice(input: {
  invoiceNo: string;
  userId?: string | null;
  email?: string | null;
  subtotal: number;
  total: number;
  description: string;
  status: string;
  currency?: string | null;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  dueDate?: string | null;
  paidAt?: string | null;
  lineItems?: Array<Record<string, unknown>>;
}) {
  const payload = {
    invoice_no: input.invoiceNo,
    division: "studio",
    status: input.status,
    subtotal_kobo: toKobo(input.subtotal),
    total_kobo: toKobo(input.total),
    currency: cleanText(input.currency) || "NGN",
    description: input.description,
    line_items: input.lineItems ?? [],
    payment_method: cleanText(input.paymentMethod) || null,
    payment_reference: cleanText(input.paymentReference) || null,
    reference_type: cleanText(input.referenceType) || null,
    reference_id: cleanText(input.referenceId) || null,
    due_date: cleanText(input.dueDate) || null,
    paid_at: cleanText(input.paidAt) || null,
  };

  await performSharedWrite("customer_invoice", input, payload, async (userId) => {
    const admin = createAdminSupabase();
    const { data: existing, error: existingError } = await admin
      .from("customer_invoices")
      .select("id")
      .eq("invoice_no", input.invoiceNo)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingError) throw existingError;

    const row = {
      id: existing?.id || createId(),
      user_id: userId,
      ...payload,
    };

    if (existing?.id) {
      const { error } = await admin.from("customer_invoices").update(row as never).eq("id", existing.id);
      if (error) throw error;
      return;
    }

    const { error } = await admin.from("customer_invoices").insert(row as never);
    if (error) throw error;
  });
}

export async function appendCustomerDocument(input: {
  userId?: string | null;
  email?: string | null;
  name: string;
  type: string;
  fileUrl: string;
  fileSize?: number | null;
  mimeType?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const payload = {
    id: createId(),
    name: input.name,
    type: input.type,
    division: "studio",
    file_url: input.fileUrl,
    file_size: input.fileSize ?? null,
    mime_type: cleanText(input.mimeType) || null,
    reference_type: cleanText(input.referenceType) || null,
    reference_id: cleanText(input.referenceId) || null,
    metadata: input.metadata ?? {},
  };

  await performSharedWrite("customer_document", input, payload, async (userId) => {
    const admin = createAdminSupabase();
    const { error } = await admin.from("customer_documents").insert({
      ...payload,
      user_id: userId,
    } as never);

    if (error) throw error;
  });
}

export async function createSupportThread(input: {
  userId: string;
  subject: string;
  category?: string | null;
  priority?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  assignedTo?: string | null;
  initialMessage?: string | null;
  senderId?: string | null;
  senderType?: string | null;
}) {
  const admin = createAdminSupabase();
  const threadId = createId();
  await admin.from("support_threads").insert({
    id: threadId,
    user_id: input.userId,
    subject: input.subject,
    division: "studio",
    category: cleanText(input.category) || "general",
    status: "open",
    priority: cleanText(input.priority) || "normal",
    reference_type: cleanText(input.referenceType) || null,
    reference_id: cleanText(input.referenceId) || null,
    assigned_to: cleanText(input.assignedTo) || null,
  } as never);

  if (cleanText(input.initialMessage)) {
    await appendSupportMessage({
      threadId,
      senderId: input.senderId || input.userId,
      senderType: input.senderType || "customer",
      body: cleanText(input.initialMessage),
    });
  }

  return threadId;
}

export async function appendSupportMessage(input: {
  threadId: string;
  senderId: string;
  senderType: string;
  body: string;
  attachments?: Array<Record<string, unknown>>;
}) {
  const admin = createAdminSupabase();
  await admin.from("support_messages").insert({
    id: createId(),
    thread_id: input.threadId,
    sender_id: input.senderId,
    sender_type: input.senderType,
    body: input.body,
    attachments: input.attachments ?? [],
  } as never);

  await admin
    .from("support_threads")
    .update({
      updated_at: new Date().toISOString(),
      status: input.senderType === "customer" ? "awaiting_reply" : "in_progress",
    } as never)
    .eq("id", input.threadId);
}
