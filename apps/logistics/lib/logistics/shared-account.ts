import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import { publishNotification, severityFromPriority } from "@henryco/notifications";

type OptionalString = string | null | undefined;

function cleanText(value?: OptionalString) {
  return String(value || "").trim();
}

function createId() {
  return crypto.randomUUID();
}

async function resolveUserId(input: { userId?: string | null; email?: string | null }) {
  const direct = cleanText(input.userId);
  if (direct) return direct;

  const email = cleanText(input.email).toLowerCase();
  if (!email) return null;

  const admin = createAdminSupabase();
  const [{ data: customerProfile }, { data: sharedProfile }] = await Promise.all([
    admin.from("customer_profiles").select("id").eq("email", email).maybeSingle(),
    admin.from("profiles").select("id").eq("email", email).maybeSingle(),
  ]);

  return cleanText(customerProfile?.id || sharedProfile?.id) || null;
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
  if (!userId || !email) return;

  await createAdminSupabase().from("customer_profiles").upsert(
    {
      id: userId,
      email,
      full_name: cleanText(input.fullName) || null,
      phone: cleanText(input.phone) || null,
      is_active: true,
    } as never,
    { onConflict: "id" }
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
  const userId = await resolveUserId(input);
  if (!userId) return;

  await createAdminSupabase().from("customer_activity").insert({
    id: createId(),
    user_id: userId,
    division: "logistics",
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

  // Reference wiring: replaces the previous direct
  // `admin.from("customer_notifications").insert(...)` call. The shim
  // applies validation, rate limiting, mute-preference resolution, and
  // audit-log writing — none of which the direct insert had. The
  // remaining 16 bridge call sites follow the same pattern in B1-followup.
  const result = await publishNotification({
    userId,
    division: "logistics",
    eventType: "logistics.shipment.update",
    severity: severityFromPriority(input.priority),
    title: input.title,
    body: cleanText(input.body) || undefined,
    deepLink: cleanText(input.actionUrl) || "/logistics",
    actionLabel: cleanText(input.actionLabel) || undefined,
    relatedId: cleanText(input.referenceId) || undefined,
    relatedType: cleanText(input.referenceType) || undefined,
    publisher: "bridge:apps/logistics/lib/logistics/shared-account.ts",
  });

  if (!result.ok && process.env.NODE_ENV !== "production") {
    // Surface the failure category in non-prod so misshaped logistics
    // notifications get caught in dev/preview before they hit users.
    // Production stays silent to avoid leaking validation field names
    // through any log forwarder.
    console.warn("[logistics:appendCustomerNotification] shim rejected publish", result.error, result.detail);
  }
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
    division: "logistics",
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
    await admin.from("customer_invoices").update(payload as never).eq("id", existing.id);
    return;
  }

  await admin.from("customer_invoices").insert(payload as never);
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

  await createAdminSupabase().from("customer_documents").insert({
    id: createId(),
    user_id: userId,
    name: input.name,
    type: input.type,
    division: "logistics",
    file_url: input.fileUrl,
    file_size: input.fileSize ?? null,
    mime_type: cleanText(input.mimeType) || null,
    reference_type: cleanText(input.referenceType) || null,
    reference_id: cleanText(input.referenceId) || null,
    metadata: input.metadata ?? {},
  } as never);
}

export async function upsertCustomerAddress(input: {
  userId?: string | null;
  email?: string | null;
  label: string;
  fullName: string;
  phone?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode?: string | null;
  landmark?: string | null;
  isDefault?: boolean;
}) {
  const userId = await resolveUserId(input);
  if (!userId) return;

  if (input.isDefault) {
    await createAdminSupabase()
      .from("customer_addresses")
      .update({ is_default: false } as never)
      .eq("user_id", userId);
  }

  await createAdminSupabase().from("customer_addresses").insert({
    id: createId(),
    user_id: userId,
    label: input.label,
    full_name: input.fullName,
    phone: cleanText(input.phone) || null,
    address_line1: input.addressLine1,
    address_line2: cleanText(input.addressLine2) || null,
    city: input.city,
    state: input.state,
    postal_code: cleanText(input.postalCode) || null,
    landmark: cleanText(input.landmark) || null,
    is_default: Boolean(input.isDefault),
  } as never);
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
  const userId = await resolveUserId(input);
  if (!userId) return null;

  const admin = createAdminSupabase();
  const threadId = createId();
  await admin.from("support_threads").insert({
    id: threadId,
    user_id: userId,
    subject: input.subject,
    division: "logistics",
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
