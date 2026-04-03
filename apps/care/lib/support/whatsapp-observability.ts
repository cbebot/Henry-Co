import "server-only";

import { createAdminSupabase } from "@/lib/supabase";

export type WhatsAppDeliverySnapshot =
  | "accepted"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "skipped"
  | "unknown";

export type WhatsAppTraceContext = {
  sourceKind?: string | null;
  sourceId?: string | null;
  sourceLabel?: string | null;
  actorRole?: string | null;
  conversationPolicy?: "business_initiated" | "customer_window" | "unknown" | null;
};

export type WhatsAppTemplateTrace = {
  name: string;
  language?: string | null;
  category?: string | null;
};

export type WhatsAppOutboundTraceInput = {
  normalizedPhone?: string | null;
  resolvedWaId?: string | null;
  contactStatus?: string | null;
  messageId?: string | null;
  messageType?: "text" | "template";
  conversationType?: "freeform" | "template";
  template?: WhatsAppTemplateTrace | null;
  provider?: string | null;
  status?: string | null;
  deliveryStage?: string | null;
  reason?: string | null;
  responseSummary?: string | null;
  statusCode?: number | null;
  graphErrorCode?: number | null;
  context?: WhatsAppTraceContext | null;
};

type SecurityRow = {
  id: string;
  event_type: string;
  success: boolean;
  details: Record<string, unknown> | null;
  created_at: string;
};

export type WhatsAppDiagnosticRow = {
  id: string;
  messageId: string | null;
  targetNumber: string | null;
  resolvedWaId: string | null;
  provider: string | null;
  messageType: string | null;
  conversationType: string | null;
  templateName: string | null;
  templateLanguage: string | null;
  sourceKind: string | null;
  sourceLabel: string | null;
  sourceId: string | null;
  conversationPolicy: string | null;
  sendTime: string | null;
  latestStatus: WhatsAppDeliverySnapshot;
  initialStatus: WhatsAppDeliverySnapshot;
  statusUpdatedAt: string | null;
  failureCode: number | null;
  failureReason: string | null;
  responseSummary: string | null;
  webhookSummary: string | null;
  webhookPayloadSummary: string | null;
  contactSummary: string | null;
  receiptsObserved: number;
};

type WhatsAppStatusUpdate = {
  id?: string;
  status?: string;
  timestamp?: string;
  recipient_id?: string;
  conversation?: {
    id?: string;
    expiration_timestamp?: string;
    origin?: { type?: string };
  };
  pricing?: {
    billable?: boolean;
    category?: string;
    pricing_model?: string;
  };
  errors?: Array<{
    code?: number;
    title?: string;
    message?: string;
    error_data?: { details?: string };
  }>;
};

function cleanText(value?: unknown) {
  return String(value || "").trim();
}

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function outboundStatusFromStage(input: {
  status?: string | null;
  deliveryStage?: string | null;
}) {
  const stage = cleanText(input.deliveryStage).toLowerCase();
  const status = cleanText(input.status).toLowerCase();

  if (stage === "api_accepted") return "accepted" satisfies WhatsAppDeliverySnapshot;
  if (stage === "sent_to_provider") return "sent" satisfies WhatsAppDeliverySnapshot;
  if (stage === "delivered") return "delivered" satisfies WhatsAppDeliverySnapshot;
  if (stage === "read") return "read" satisfies WhatsAppDeliverySnapshot;
  if (stage === "failed" || status === "failed") return "failed" satisfies WhatsAppDeliverySnapshot;
  if (stage === "skipped" || status === "skipped") return "skipped" satisfies WhatsAppDeliverySnapshot;
  if (status === "sent") return "sent" satisfies WhatsAppDeliverySnapshot;
  return "unknown" satisfies WhatsAppDeliverySnapshot;
}

function normalizeTraceStatus(value: unknown): WhatsAppDeliverySnapshot | null {
  const normalized = cleanText(value).toLowerCase();
  if (normalized === "accepted") return "accepted";
  if (normalized === "sent") return "sent";
  if (normalized === "delivered") return "delivered";
  if (normalized === "read") return "read";
  if (normalized === "failed") return "failed";
  if (normalized === "skipped") return "skipped";
  if (normalized === "unknown") return "unknown";
  return null;
}

function summarizeContact(input: {
  normalizedPhone?: string | null;
  resolvedWaId?: string | null;
  contactStatus?: string | null;
}) {
  return [
    input.normalizedPhone ? `target ${input.normalizedPhone}` : "",
    input.resolvedWaId ? `wa_id ${input.resolvedWaId}` : "",
    input.contactStatus ? `contact ${input.contactStatus}` : "",
  ]
    .filter(Boolean)
    .join(" • ");
}

function summarizeConversationRequirement(context?: WhatsAppTraceContext | null, messageType?: string | null) {
  if (context?.conversationPolicy === "business_initiated" && messageType !== "template") {
    return "Business-initiated delivery needs an approved template or an open 24-hour customer service window.";
  }

  return null;
}

export async function recordWhatsAppOutboundTrace(input: WhatsAppOutboundTraceInput) {
  try {
    const supabase = createAdminSupabase();
    const snapshot = outboundStatusFromStage(input);
    const contactSummary = summarizeContact(input);
    const conversationRequirement = summarizeConversationRequirement(
      input.context,
      input.messageType
    );

    await supabase.from("care_security_logs").insert({
      event_type: "whatsapp_message_outbound",
      success: snapshot !== "failed" && snapshot !== "skipped",
      details: {
        message_id: input.messageId || null,
        target_number: input.normalizedPhone || null,
        resolved_wa_id: input.resolvedWaId || null,
        contact_status: input.contactStatus || null,
        contact_summary: contactSummary || null,
        message_type: input.messageType || "text",
        conversation_type: input.conversationType || "freeform",
        template_name: input.template?.name || null,
        template_language: input.template?.language || null,
        template_category: input.template?.category || null,
        provider: input.provider || null,
        status: cleanText(input.status) || null,
        delivery_stage: cleanText(input.deliveryStage) || null,
        delivery_status: snapshot,
        reason: input.reason || null,
        response_summary: input.responseSummary || null,
        status_code: input.statusCode ?? null,
        graph_error_code: input.graphErrorCode ?? null,
        source_kind: input.context?.sourceKind || null,
        source_id: input.context?.sourceId || null,
        source_label: input.context?.sourceLabel || null,
        actor_role: input.context?.actorRole || null,
        conversation_policy: input.context?.conversationPolicy || null,
        conversation_requirement: conversationRequirement,
      },
    });
  } catch {
    // Intentionally silent. Delivery must not fail because observability failed.
  }
}

function summarizeWebhookPayload(status: WhatsAppStatusUpdate) {
  const error = status.errors?.[0];

  return [
    cleanText(status.status) ? `status ${cleanText(status.status)}` : "",
    cleanText(status.recipient_id) ? `recipient ${cleanText(status.recipient_id)}` : "",
    cleanText(status.conversation?.origin?.type)
      ? `origin ${cleanText(status.conversation?.origin?.type)}`
      : "",
    status.pricing?.category ? `pricing ${status.pricing.category}` : "",
    typeof status.pricing?.billable === "boolean"
      ? status.pricing.billable
        ? "billable"
        : "not billable"
      : "",
    error?.code ? `error ${error.code}` : "",
    cleanText(error?.title) ? cleanText(error?.title) : "",
  ]
    .filter(Boolean)
    .join(" • ");
}

export async function recordWhatsAppDeliveryReceipt(status: WhatsAppStatusUpdate) {
  try {
    const supabase = createAdminSupabase();
    const error = status.errors?.[0];
    const deliveryStatus = normalizeTraceStatus(status.status) || "unknown";
    const providerTimestamp = cleanText(status.timestamp);

    await supabase.from("care_security_logs").insert({
      event_type: "whatsapp_delivery_status",
      success: deliveryStatus !== "failed",
      details: {
        message_id: cleanText(status.id) || null,
        status: cleanText(status.status) || null,
        delivery_status: deliveryStatus,
        recipient: cleanText(status.recipient_id) || null,
        provider_timestamp: providerTimestamp || null,
        conversation_id: cleanText(status.conversation?.id) || null,
        conversation_origin: cleanText(status.conversation?.origin?.type) || null,
        conversation_expires_at: cleanText(status.conversation?.expiration_timestamp) || null,
        pricing_category: cleanText(status.pricing?.category) || null,
        pricing_model: cleanText(status.pricing?.pricing_model) || null,
        pricing_billable:
          typeof status.pricing?.billable === "boolean" ? status.pricing.billable : null,
        error_code: error?.code ?? null,
        error_title: cleanText(error?.title) || null,
        error_message: cleanText(error?.message) || null,
        error_details: cleanText(error?.error_data?.details) || null,
        webhook_summary: summarizeWebhookPayload(status) || null,
      },
    });
  } catch {
    // Intentionally silent. Meta expects a 200 even if our tracing insert fails.
  }
}

function seedDiagnostic(id: string): WhatsAppDiagnosticRow {
  return {
    id,
    messageId: null,
    targetNumber: null,
    resolvedWaId: null,
    provider: null,
    messageType: null,
    conversationType: null,
    templateName: null,
    templateLanguage: null,
    sourceKind: null,
    sourceLabel: null,
    sourceId: null,
    conversationPolicy: null,
    sendTime: null,
    latestStatus: "unknown",
    initialStatus: "unknown",
    statusUpdatedAt: null,
    failureCode: null,
    failureReason: null,
    responseSummary: null,
    webhookSummary: null,
    webhookPayloadSummary: null,
    contactSummary: null,
    receiptsObserved: 0,
  };
}

function mergeOutbound(
  diagnostic: WhatsAppDiagnosticRow,
  row: SecurityRow,
  details: Record<string, unknown>,
  fallbackMessageId: string | null
) {
  const initialStatus =
    normalizeTraceStatus(details.delivery_status) ||
    outboundStatusFromStage({
      status: cleanText(details.status),
      deliveryStage: cleanText(details.delivery_stage),
    });

  diagnostic.messageId = fallbackMessageId;
  diagnostic.targetNumber ||= cleanText(details.target_number) || null;
  diagnostic.resolvedWaId ||= cleanText(details.resolved_wa_id) || null;
  diagnostic.provider ||= cleanText(details.provider) || null;
  diagnostic.messageType ||= cleanText(details.message_type) || null;
  diagnostic.conversationType ||= cleanText(details.conversation_type) || null;
  diagnostic.templateName ||= cleanText(details.template_name) || null;
  diagnostic.templateLanguage ||= cleanText(details.template_language) || null;
  diagnostic.sourceKind ||= cleanText(details.source_kind) || null;
  diagnostic.sourceLabel ||= cleanText(details.source_label) || null;
  diagnostic.sourceId ||= cleanText(details.source_id) || null;
  diagnostic.conversationPolicy ||= cleanText(details.conversation_policy) || null;
  diagnostic.sendTime ||= row.created_at;
  diagnostic.initialStatus = diagnostic.initialStatus === "unknown" ? initialStatus : diagnostic.initialStatus;
  diagnostic.latestStatus = diagnostic.latestStatus === "unknown" ? initialStatus : diagnostic.latestStatus;
  diagnostic.failureCode ||= asNumber(details.graph_error_code) || asNumber(details.status_code);
  diagnostic.failureReason ||= cleanText(details.reason) || null;
  diagnostic.responseSummary ||= cleanText(details.response_summary) || null;
  diagnostic.contactSummary ||= cleanText(details.contact_summary) || null;
}

function mergeLegacyOutbound(
  diagnostic: WhatsAppDiagnosticRow,
  row: SecurityRow,
  details: Record<string, unknown>,
  messageId: string
) {
  diagnostic.messageId = messageId;
  diagnostic.provider ||= cleanText(details.whatsapp_provider) || null;
  diagnostic.sourceLabel ||=
    cleanText(details.thread_ref) ||
    cleanText(details.signal_title) ||
    cleanText(details.tracking_code) ||
    null;
  diagnostic.sourceId ||= cleanText(details.thread_id) || cleanText(details.booking_id) || null;
  diagnostic.sendTime ||= row.created_at;
  diagnostic.initialStatus =
    diagnostic.initialStatus === "unknown"
      ? outboundStatusFromStage({
          status: cleanText(details.whatsapp_status),
          deliveryStage: cleanText(details.whatsapp_delivery_stage),
        })
      : diagnostic.initialStatus;
  diagnostic.latestStatus =
    diagnostic.latestStatus === "unknown"
      ? diagnostic.initialStatus
      : diagnostic.latestStatus;
  diagnostic.failureCode ||= asNumber(details.whatsapp_graph_error_code) || asNumber(details.whatsapp_status_code);
  diagnostic.failureReason ||= cleanText(details.whatsapp_reason) || null;
  diagnostic.responseSummary ||= cleanText(details.whatsapp_response_summary) || null;
  diagnostic.messageType ||= cleanText(details.whatsapp_message_type) || null;
  diagnostic.conversationType ||= cleanText(details.whatsapp_conversation_type) || null;
  diagnostic.targetNumber ||= cleanText(details.whatsapp_target_number) || null;
}

function mergeReceipt(
  diagnostic: WhatsAppDiagnosticRow,
  row: SecurityRow,
  details: Record<string, unknown>
) {
  const status = normalizeTraceStatus(details.delivery_status || details.status) || "unknown";
  const effectiveTimestamp = cleanText(details.provider_timestamp) || row.created_at;
  const currentTimestamp = diagnostic.statusUpdatedAt || diagnostic.sendTime || "";

  diagnostic.receiptsObserved += 1;
  if (!currentTimestamp || new Date(effectiveTimestamp).getTime() >= new Date(currentTimestamp).getTime()) {
    diagnostic.latestStatus = status;
    diagnostic.statusUpdatedAt = effectiveTimestamp;
    diagnostic.failureCode ||= asNumber(details.error_code);
    diagnostic.failureReason ||=
      cleanText(details.error_message) || cleanText(details.error_title) || cleanText(details.error_details) || null;
    diagnostic.webhookSummary ||= cleanText(details.webhook_summary) || null;
    diagnostic.webhookPayloadSummary ||= cleanText(details.webhook_summary) || null;
  }
}

export async function getWhatsAppDiagnostics(limit = 80): Promise<WhatsAppDiagnosticRow[]> {
  try {
    const supabase = createAdminSupabase();
    const sampleSize = Math.min(Math.max(limit * 12, 120), 1200);
    const { data } = await supabase
      .from("care_security_logs")
      .select("id, event_type, success, details, created_at")
      .order("created_at", { ascending: false })
      .limit(sampleSize);

    const rows = ((data || []) as SecurityRow[]).filter((row) => {
      const details = asRecord(row.details);
      return (
        row.event_type === "whatsapp_message_outbound" ||
        row.event_type === "whatsapp_delivery_status" ||
        Boolean(cleanText(details?.whatsapp_message_id))
      );
    });

    const mapped = new Map<string, WhatsAppDiagnosticRow>();

    for (const row of rows) {
      const details = asRecord(row.details) || {};
      const directMessageId = cleanText(details.message_id) || null;
      const legacyMessageId = cleanText(details.whatsapp_message_id) || null;
      const key = directMessageId || legacyMessageId || `attempt:${row.id}`;
      const current = mapped.get(key) || seedDiagnostic(key);

      if (row.event_type === "whatsapp_message_outbound") {
        mergeOutbound(current, row, details, directMessageId);
      } else if (row.event_type === "whatsapp_delivery_status" && directMessageId) {
        mergeReceipt(current, row, details);
      } else if (legacyMessageId) {
        mergeLegacyOutbound(current, row, details, legacyMessageId);
      }

      mapped.set(key, current);
    }

    return Array.from(mapped.values())
      .sort((a, b) => {
        const left = new Date(b.statusUpdatedAt || b.sendTime || 0).getTime();
        const right = new Date(a.statusUpdatedAt || a.sendTime || 0).getTime();
        return left - right;
      })
      .slice(0, limit);
  } catch {
    return [];
  }
}
