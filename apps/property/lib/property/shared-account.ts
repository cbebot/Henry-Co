import "server-only";

import { createAdminSupabase } from "@/lib/supabase";

type OptionalString = string | null | undefined;

function cleanText(value?: OptionalString) {
  return String(value || "").trim();
}

function createId() {
  return crypto.randomUUID();
}

function logSharedAccountError(
  operation: string,
  error: { message?: string | null; code?: string | null; details?: string | null; hint?: string | null },
  context: Record<string, unknown> = {}
) {
  console.error("[property][shared-account]", {
    operation,
    code: error.code || null,
    message: error.message || "Unknown shared-account error.",
    details: error.details || null,
    hint: error.hint || null,
    ...context,
  });
}

async function findAuthUserIdByEmail(email: string) {
  const normalizedEmail = cleanText(email).toLowerCase();
  if (!normalizedEmail) return null;

  const admin = createAdminSupabase();
  let page = 1;

  while (page <= 10) {
    const result = await admin.auth.admin.listUsers({ page, perPage: 200 });
    const users = result.data?.users ?? [];
    const match = users.find(
      (user) => cleanText(user.email).toLowerCase() === normalizedEmail
    );

    if (match?.id) return match.id;
    if (users.length < 200) break;

    page += 1;
  }

  return null;
}

async function resolveUserId(input: { userId?: string | null; email?: string | null }) {
  const direct = cleanText(input.userId);
  if (direct) return direct;

  const email = cleanText(input.email).toLowerCase();
  if (!email) return null;

  const admin = createAdminSupabase();
  const { data: customerProfile, error } = await admin
    .from("customer_profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    logSharedAccountError("resolve_customer_profile", error, { email });
  }

  if (cleanText(customerProfile?.id)) {
    return cleanText(customerProfile?.id);
  }

  return findAuthUserIdByEmail(email);
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
  const userId = await resolveUserId(input);
  const email = cleanText(input.email).toLowerCase();
  if (!userId || !email) return null;

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

  if (error) {
    logSharedAccountError("ensure_customer_profile", error, { userId, email });
    return null;
  }

  return userId;
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
  const userId = await resolveUserId(input);
  if (!userId) return null;

  const admin = createAdminSupabase();
  const { error } = await admin.from("customer_activity").insert({
    id: createId(),
    user_id: userId,
    division: "property",
    activity_type: input.activityType,
    title: input.title,
    description: cleanText(input.description) || null,
    status: cleanText(input.status) || null,
    reference_type: cleanText(input.referenceType) || null,
    reference_id: cleanText(input.referenceId) || null,
    amount_kobo: input.amount == null ? null : toKobo(input.amount),
    action_url: cleanText(input.actionUrl) || null,
    metadata: input.metadata ?? {},
  } as never);

  if (error) {
    logSharedAccountError("append_customer_activity", error, {
      userId,
      activityType: input.activityType,
      referenceId: input.referenceId,
    });
    return null;
  }

  return userId;
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
  const userId = await resolveUserId(input);
  if (!userId) return null;

  const admin = createAdminSupabase();
  const { error } = await admin.from("customer_notifications").insert({
    id: createId(),
    user_id: userId,
    title: input.title,
    body: input.body,
    category: cleanText(input.category) || "general",
    priority: cleanText(input.priority) || "normal",
    action_url: cleanText(input.actionUrl) || null,
    action_label: cleanText(input.actionLabel) || null,
    division: "property",
    reference_type: cleanText(input.referenceType) || null,
    reference_id: cleanText(input.referenceId) || null,
    is_read: false,
  } as never);

  if (error) {
    logSharedAccountError("append_customer_notification", error, {
      userId,
      referenceId: input.referenceId,
    });
    return null;
  }

  return userId;
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
  const userId = await resolveUserId(input);
  if (!userId) return null;

  const admin = createAdminSupabase();
  const { error } = await admin.from("customer_documents").insert({
    id: createId(),
    user_id: userId,
    name: input.name,
    type: input.type,
    division: "property",
    file_url: input.fileUrl,
    file_size: input.fileSize ?? null,
    mime_type: cleanText(input.mimeType) || null,
    reference_type: cleanText(input.referenceType) || null,
    reference_id: cleanText(input.referenceId) || null,
    metadata: input.metadata ?? {},
  } as never);

  if (error) {
    logSharedAccountError("append_customer_document", error, {
      userId,
      referenceId: input.referenceId,
      name: input.name,
    });
    return null;
  }

  return userId;
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
  const userId = await resolveUserId(input);
  if (!userId) return null;

  const admin = createAdminSupabase();
  const { data: existing } = await admin
    .from("customer_invoices")
    .select("id")
    .eq("invoice_no", input.invoiceNo)
    .eq("user_id", userId)
    .maybeSingle();

  const payload = {
    id: existing?.id || createId(),
    user_id: userId,
    invoice_no: input.invoiceNo,
    division: "property",
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

  if (existing?.id) {
    const { error } = await admin
      .from("customer_invoices")
      .update(payload as never)
      .eq("id", existing.id);

    if (error) {
      logSharedAccountError("update_customer_invoice", error, {
        userId,
        invoiceNo: input.invoiceNo,
      });
      return null;
    }

    return existing.id;
  }

  const { error } = await admin.from("customer_invoices").insert(payload as never);
  if (error) {
    logSharedAccountError("insert_customer_invoice", error, {
      userId,
      invoiceNo: input.invoiceNo,
    });
    return null;
  }

  return payload.id;
}

export async function createSupportThread(input: {
  userId?: string | null;
  email?: string | null;
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
  const userId = await resolveUserId({ userId: input.userId, email: input.email });
  if (!userId) return null;
  const threadId = createId();
  const { error } = await admin.from("support_threads").insert({
    id: threadId,
    user_id: userId,
    subject: input.subject,
    division: "property",
    category: cleanText(input.category) || "general",
    status: "open",
    priority: cleanText(input.priority) || "normal",
    reference_type: cleanText(input.referenceType) || null,
    reference_id: cleanText(input.referenceId) || null,
    assigned_to: cleanText(input.assignedTo) || null,
  } as never);

  if (error) {
    logSharedAccountError("create_support_thread", error, {
      userId,
      referenceId: input.referenceId,
      subject: input.subject,
    });
    return null;
  }

  if (cleanText(input.initialMessage)) {
    await appendSupportMessage({
      threadId,
      senderId: input.senderId || userId,
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
  const { error: messageError } = await admin.from("support_messages").insert({
    id: createId(),
    thread_id: input.threadId,
    sender_id: input.senderId,
    sender_type: input.senderType,
    body: input.body,
    attachments: input.attachments ?? [],
  } as never);

  if (messageError) {
    logSharedAccountError("append_support_message", messageError, {
      threadId: input.threadId,
      senderId: input.senderId,
    });
    return null;
  }

  const { error: threadError } = await admin
    .from("support_threads")
    .update({
      updated_at: new Date().toISOString(),
      status: input.senderType === "customer" ? "awaiting_reply" : "in_progress",
    } as never)
    .eq("id", input.threadId);

  if (threadError) {
    logSharedAccountError("touch_support_thread", threadError, {
      threadId: input.threadId,
    });
    return null;
  }

  return input.threadId;
}
