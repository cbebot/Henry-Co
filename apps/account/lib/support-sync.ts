import "server-only";

import { normalizeEmail, normalizePhone } from "@henryco/config";
import {
  buildSupportThreadRef,
  mapAccountSupportCategoryToCareServiceCategory,
  mapAccountSupportStatusToCareStatus,
  mapSupportPriorityToCareUrgency,
} from "@henryco/config";
import { createAdminSupabase } from "@/lib/supabase";

type SupportCustomerSnapshot = {
  userId?: string | null;
  email?: string | null;
  fullName?: string | null;
  phone?: string | null;
};

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function cleanPreview(value: string) {
  const normalized = cleanText(value).replace(/\s+/g, " ");
  return normalized.length > 120 ? `${normalized.slice(0, 117)}...` : normalized;
}

function normalizeAttachments(value: Array<Record<string, unknown>> | undefined) {
  return (value ?? []).map((attachment) => ({
    name: cleanText(attachment.name) || null,
    url: cleanText(attachment.url) || null,
    mime_type: cleanText(attachment.mime_type) || null,
    size: Number(attachment.size) || null,
    public_id: cleanText(attachment.public_id) || null,
  }));
}

function resolveCustomerName(customer: SupportCustomerSnapshot) {
  const explicit = cleanText(customer.fullName);
  if (explicit) return explicit;

  const email = normalizeEmail(customer.email);
  if (email) {
    return email.split("@")[0]?.replace(/[._-]+/g, " ") || "Customer";
  }

  return "Customer";
}

async function insertCareSupportEvent(input: {
  eventType: "support_thread_created" | "support_customer_email_received";
  threadId: string;
  subject: string;
  category?: string | null;
  priority?: string | null;
  status?: string | null;
  message: string;
  attachments?: Array<Record<string, unknown>>;
  customer: SupportCustomerSnapshot;
  createdAt?: string | null;
}) {
  const admin = createAdminSupabase();
  const customerEmail = normalizeEmail(input.customer.email);
  const customerName = resolveCustomerName(input.customer);
  const now = cleanText(input.createdAt) || new Date().toISOString();

  const { error } = await admin.from("care_security_logs").insert({
    event_type: input.eventType,
    route: "/account/support",
    email: customerEmail,
    user_id: input.customer.userId ?? null,
    role: "customer",
    success: true,
    details: {
      thread_id: input.threadId,
      thread_ref: buildSupportThreadRef(input.threadId),
      full_name: customerName,
      customer_name: customerName,
      customer_email: customerEmail,
      email: customerEmail,
      phone: normalizePhone(input.customer.phone),
      preferred_contact_method: "email",
      service_category: mapAccountSupportCategoryToCareServiceCategory(input.category),
      urgency: mapSupportPriorityToCareUrgency(input.priority),
      subject: cleanText(input.subject) || "Support request",
      message: cleanText(input.message),
      preview: cleanPreview(input.message),
      status: mapAccountSupportStatusToCareStatus(input.status),
      received_at: now,
      origin: "account_portal",
      source: "account_portal",
      attachment_count: normalizeAttachments(input.attachments).length,
      attachments: normalizeAttachments(input.attachments),
    },
  } as never);

  if (error) {
    throw error;
  }
}

export async function mirrorCareSupportThreadOpened(input: {
  threadId: string;
  subject: string;
  category?: string | null;
  priority?: string | null;
  status?: string | null;
  message: string;
  customer: SupportCustomerSnapshot;
  createdAt?: string | null;
}) {
  await insertCareSupportEvent({
    eventType: "support_thread_created",
    ...input,
  });
}

export async function mirrorCareSupportCustomerReply(input: {
  threadId: string;
  subject: string;
  category?: string | null;
  priority?: string | null;
  status?: string | null;
  message: string;
  attachments?: Array<Record<string, unknown>>;
  customer: SupportCustomerSnapshot;
  createdAt?: string | null;
}) {
  await insertCareSupportEvent({
    eventType: "support_customer_email_received",
    ...input,
  });
}
