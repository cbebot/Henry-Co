import { createHash } from "node:crypto";
import { createAdminSupabase } from "@/lib/supabase";

type OptionalString = string | null | undefined;

function cleanText(value?: OptionalString) {
  return String(value || "").trim();
}

function createId() {
  return crypto.randomUUID();
}

function shadowUserIdFromEmail(email: string) {
  const digest = createHash("sha256").update(`henryco-learn:${email}`).digest("hex");
  return `${digest.slice(0, 8)}-${digest.slice(8, 12)}-4${digest.slice(13, 16)}-a${digest.slice(17, 20)}-${digest.slice(20, 32)}`;
}

async function resolveUserId(input: {
  userId?: string | null;
  email?: string | null;
}) {
  const direct = cleanText(input.userId);
  if (direct) return direct;

  const email = cleanText(input.email).toLowerCase();
  if (!email) return null;

  const admin = createAdminSupabase();
  const [{ data: customerProfile }, { data: sharedProfile }] = await Promise.all([
    admin.from("customer_profiles").select("id").eq("email", email).maybeSingle(),
    admin.from("profiles").select("id").eq("email", email).maybeSingle(),
  ]);

  return cleanText(customerProfile?.id || sharedProfile?.id) || shadowUserIdFromEmail(email);
}

function toKobo(amount: number) {
  return Math.max(0, Math.round(Number(amount || 0) * 100));
}

function sharedNotificationCategory(value?: string | null) {
  const category = cleanText(value).toLowerCase();
  if (["general", "billing", "order", "support", "studio"].includes(category)) {
    return category;
  }

  return "general";
}

function throwIfError(
  result: { error?: { message?: string } | null },
  context: string
) {
  if (result.error) {
    throw new Error(result.error.message || `${context} failed.`);
  }
}

export async function ensureCustomerProfile(input: {
  userId?: string | null;
  email?: string | null;
  fullName?: string | null;
  phone?: string | null;
}) {
  const userId = await resolveUserId(input);
  const email = cleanText(input.email).toLowerCase();
  if (!userId || !email) return;

  const admin = createAdminSupabase();
  const result = await admin.from("customer_profiles").upsert(
    {
      id: userId,
      email,
      full_name: cleanText(input.fullName) || null,
      phone: cleanText(input.phone) || null,
      is_active: true,
    } as never,
    { onConflict: "id" }
  );
  throwIfError(result, "Upserting customer profile");
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
  if (!userId) return;

  const admin = createAdminSupabase();
  const result = await admin.from("customer_activity").insert({
    id: createId(),
    user_id: userId,
    division: "learn",
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
  throwIfError(result, "Appending customer activity");
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
  if (!userId) return;

  const admin = createAdminSupabase();
  const result = await admin.from("customer_notifications").insert({
    id: createId(),
    user_id: userId,
    title: input.title,
    body: input.body,
    category: sharedNotificationCategory(input.category),
    priority: cleanText(input.priority) || "normal",
    action_url: cleanText(input.actionUrl) || null,
    action_label: cleanText(input.actionLabel) || null,
    division: "learn",
    reference_type: cleanText(input.referenceType) || null,
    reference_id: cleanText(input.referenceId) || null,
    is_read: false,
  } as never);
  throwIfError(result, "Appending customer notification");
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
  if (!userId) return;

  const admin = createAdminSupabase();
  const existingResult = await admin
    .from("customer_invoices")
    .select("id")
    .eq("invoice_no", input.invoiceNo)
    .eq("user_id", userId)
    .maybeSingle();
  throwIfError(existingResult, "Loading existing invoice");
  const existing = existingResult.data;

  const payload = {
    id: existing?.id || createId(),
    user_id: userId,
    invoice_no: input.invoiceNo,
    division: "learn",
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
    const updateResult = await admin.from("customer_invoices").update(payload as never).eq("id", existing.id);
    throwIfError(updateResult, "Updating invoice");
    return;
  }

  const insertResult = await admin.from("customer_invoices").insert(payload as never);
  throwIfError(insertResult, "Creating invoice");
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
  if (!userId) return;

  const admin = createAdminSupabase();
  const result = await admin.from("customer_documents").insert({
    id: createId(),
    user_id: userId,
    name: input.name,
    type: input.type,
    division: "learn",
    file_url: input.fileUrl,
    file_size: input.fileSize ?? null,
    mime_type: cleanText(input.mimeType) || null,
    reference_type: cleanText(input.referenceType) || null,
    reference_id: cleanText(input.referenceId) || null,
    metadata: input.metadata ?? {},
  } as never);
  throwIfError(result, "Appending customer document");
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
  const result = await admin.from("support_threads").insert({
    id: threadId,
    user_id: input.userId,
    subject: input.subject,
    division: "learn",
    category: cleanText(input.category) || "general",
    status: "open",
    priority: cleanText(input.priority) || "normal",
    reference_type: cleanText(input.referenceType) || null,
    reference_id: cleanText(input.referenceId) || null,
    assigned_to: cleanText(input.assignedTo) || null,
  } as never);
  throwIfError(result, "Creating support thread");

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
  const insertResult = await admin.from("support_messages").insert({
    id: createId(),
    thread_id: input.threadId,
    sender_id: input.senderId,
    sender_type: input.senderType,
    body: input.body,
    attachments: input.attachments ?? [],
  } as never);
  throwIfError(insertResult, "Appending support message");

  const updateResult = await admin
    .from("support_threads")
    .update({
      updated_at: new Date().toISOString(),
      status: input.senderType === "customer" ? "awaiting_reply" : "in_progress",
    } as never)
    .eq("id", input.threadId);
  throwIfError(updateResult, "Updating support thread");
}
