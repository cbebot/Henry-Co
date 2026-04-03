import "server-only";

import { normalizeWhatsAppPhone, sendWhatsAppText } from "@/lib/support/whatsapp";

const GRAPH_VERSION = String(process.env.WHATSAPP_GRAPH_VERSION || "v22.0").trim() || "v22.0";

type MetaGraphError = {
  message?: string;
  code?: number;
  type?: string;
  fbtrace_id?: string;
};

type MetaGraphResponse<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  error: MetaGraphError | null;
};

type MetaPhoneRecord = {
  id?: string;
  display_phone_number?: string;
  verified_name?: string;
  quality_rating?: string;
  code_verification_status?: string;
  name_status?: string;
  new_name_status?: string;
  status?: string;
  platform_type?: string;
};

type MetaBusinessRecord = {
  id?: string;
  name?: string;
  timezone_id?: string;
  account_review_status?: string;
  business_verification_status?: string;
  ownership_type?: string;
  message_template_namespace?: string;
};

type MetaTemplateRecord = {
  id?: string;
  name?: string;
  status?: string;
  language?: string;
  category?: string;
  sub_category?: string;
};

export type WhatsAppHealthStatus = {
  provider: "meta" | "twilio" | null;
  configured: boolean;
  readiness: "ready" | "action_required" | "not_configured";
  environment: {
    accessTokenConfigured: boolean;
    phoneNumberIdConfigured: boolean;
    businessAccountIdConfigured: boolean;
    registrationPinConfigured: boolean;
  };
  phone: MetaPhoneRecord | null;
  businessAccount: MetaBusinessRecord | null;
  templates: MetaTemplateRecord[];
  blockers: string[];
  notes: string[];
};

type RegistrationAttemptResult = {
  ok: boolean;
  status: number;
  message: string;
  response: Record<string, unknown> | null;
};

type ProbeAttemptResult = {
  ok: boolean;
  status: number;
  message: string;
  code: number | null;
  response: Record<string, unknown> | null;
};

function cleanText(value?: string | null) {
  return String(value || "").trim();
}

function getProbeTemplate() {
  const name =
    cleanText(process.env.WHATSAPP_PROBE_TEMPLATE_NAME) ||
    cleanText(process.env.WHATSAPP_DEFAULT_TEMPLATE_NAME);
  const language =
    cleanText(process.env.WHATSAPP_PROBE_TEMPLATE_LANGUAGE) ||
    cleanText(process.env.WHATSAPP_DEFAULT_TEMPLATE_LANGUAGE) ||
    "en_US";

  return name
    ? {
        name,
        language,
      }
    : null;
}

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function extractMetaConfig() {
  const accessToken = cleanText(process.env.WHATSAPP_ACCESS_TOKEN);
  const phoneNumberId = cleanText(process.env.WHATSAPP_PHONE_NUMBER_ID);
  const businessAccountId = cleanText(process.env.WHATSAPP_BUSINESS_ACCOUNT_ID);
  const registrationPin =
    cleanText(process.env.WHATSAPP_TWO_FACTOR_PIN) || cleanText(process.env.WHATSAPP_PIN);

  return {
    accessToken,
    phoneNumberId,
    businessAccountId,
    registrationPin,
  };
}

async function metaFetch<T>(
  path: string,
  init?: {
    method?: "GET" | "POST";
    body?: Record<string, unknown>;
  }
): Promise<MetaGraphResponse<T>> {
  const { accessToken } = extractMetaConfig();
  const method = init?.method || "GET";

  if (!accessToken) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: { message: "WHATSAPP_ACCESS_TOKEN is not configured." },
    };
  }

  const response = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });

  const json = (await response.json().catch(() => null)) as
    | { error?: MetaGraphError }
    | T
    | null;

  return {
    ok: response.ok,
    status: response.status,
    data: response.ok ? ((json as T | null) ?? null) : null,
    error: response.ok ? null : ((json as { error?: MetaGraphError } | null)?.error ?? null),
  };
}

function formatMetaError(error: MetaGraphError | null, fallback: string) {
  return cleanText(error?.message) || fallback;
}

function buildNotConfiguredStatus(): WhatsAppHealthStatus {
  const config = extractMetaConfig();

  return {
    provider: config.accessToken || config.phoneNumberId ? "meta" : null,
    configured: Boolean(config.accessToken || config.phoneNumberId || config.businessAccountId),
    readiness: "not_configured",
    environment: {
      accessTokenConfigured: Boolean(config.accessToken),
      phoneNumberIdConfigured: Boolean(config.phoneNumberId),
      businessAccountIdConfigured: Boolean(config.businessAccountId),
      registrationPinConfigured: Boolean(config.registrationPin),
    },
    phone: null,
    businessAccount: null,
    templates: [],
    blockers: [
      !config.accessToken ? "WHATSAPP_ACCESS_TOKEN is missing." : "",
      !config.phoneNumberId ? "WHATSAPP_PHONE_NUMBER_ID is missing." : "",
      !config.businessAccountId ? "WHATSAPP_BUSINESS_ACCOUNT_ID is missing." : "",
    ].filter(Boolean),
    notes: [],
  };
}

export async function getWhatsAppHealthStatus(): Promise<WhatsAppHealthStatus> {
  const config = extractMetaConfig();

  if (!config.accessToken || !config.phoneNumberId || !config.businessAccountId) {
    return buildNotConfiguredStatus();
  }

  const [phoneResponse, businessResponse, phoneListResponse, templateResponse] = await Promise.all([
    metaFetch<MetaPhoneRecord>(
      `/${config.phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating,code_verification_status,name_status,new_name_status,status,platform_type`
    ),
    metaFetch<MetaBusinessRecord>(
      `/${config.businessAccountId}?fields=id,name,timezone_id,account_review_status,business_verification_status,ownership_type,message_template_namespace`
    ),
    metaFetch<{ data?: MetaPhoneRecord[] }>(
      `/${config.businessAccountId}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating,code_verification_status,name_status,status,platform_type`
    ),
    metaFetch<{ data?: MetaTemplateRecord[] }>(
      `/${config.businessAccountId}/message_templates?fields=id,name,status,language,category,sub_category`
    ),
  ]);

  const phone = phoneResponse.data;
  const businessAccount = businessResponse.data;
  const listedPhone =
    phoneListResponse.data?.data?.find(
      (row) => cleanText(row.id) === config.phoneNumberId
    ) ?? null;
  const templates = templateResponse.data?.data || [];
  const approvedTemplates = templates.filter(
    (item) => cleanText(item.status).toUpperCase() === "APPROVED"
  );
  const customApprovedTemplates = approvedTemplates.filter(
    (item) => cleanText(item.name).toLowerCase() !== "hello_world"
  );

  const blockers: string[] = [];
  const notes: string[] = [];
  const status = cleanText(phone?.status || listedPhone?.status).toUpperCase();
  const verificationStatus = cleanText(
    phone?.code_verification_status || listedPhone?.code_verification_status
  ).toUpperCase();
  const businessVerification = cleanText(
    businessAccount?.business_verification_status
  ).toLowerCase();

  if (!phoneResponse.ok) {
    blockers.push(
      formatMetaError(
        phoneResponse.error,
        "Meta rejected the phone number lookup for the configured WHATSAPP_PHONE_NUMBER_ID."
      )
    );
  }

  if (!businessResponse.ok) {
    blockers.push(
      formatMetaError(
        businessResponse.error,
        "Meta rejected the business account lookup for the configured WHATSAPP_BUSINESS_ACCOUNT_ID."
      )
    );
  }

  if (phoneResponse.ok && businessResponse.ok && !listedPhone) {
    blockers.push(
      "The configured phone number is not present under the configured WhatsApp Business Account."
    );
  }

  if (verificationStatus && verificationStatus !== "VERIFIED") {
    blockers.push(`The phone number verification status is ${verificationStatus}.`);
  }

  if (status === "PENDING") {
    blockers.push(
      config.registrationPin
        ? "The phone number is still pending Cloud API registration."
        : "The phone number is still pending Cloud API registration, and no WhatsApp registration PIN is configured on the server."
    );
  } else if (status && !["CONNECTED", "ACTIVE"].includes(status)) {
    blockers.push(`The phone number is not active for Cloud API sending. Current status: ${status}.`);
  }

  if (cleanText(businessAccount?.account_review_status).toUpperCase() !== "APPROVED") {
    notes.push(
      `WABA account review status is ${cleanText(businessAccount?.account_review_status) || "UNKNOWN"}.`
    );
  }

  if (businessVerification && businessVerification !== "verified") {
    notes.push(
      `Business verification status is ${businessVerification}, which may limit later scaling even when registration succeeds.`
    );
  }

  if (cleanText(phone?.quality_rating).toUpperCase() === "UNKNOWN") {
    notes.push("Quality rating is still UNKNOWN because the number has not started normal message delivery yet.");
  }

  if (!templateResponse.ok) {
    notes.push(
      formatMetaError(
        templateResponse.error,
        "Message template inventory could not be resolved from Meta."
      )
    );
  } else if (approvedTemplates.length === 0) {
    notes.push(
      "No approved WhatsApp templates exist on this sender yet. Business-initiated cold-start delivery still needs a customer service window or a new template approval."
    );
  } else if (customApprovedTemplates.length === 0) {
    notes.push(
      "The only approved template is hello_world, which Meta restricts to public test numbers. This sender still needs a custom approved production template for business-initiated cold-start delivery."
    );
  }

  return {
    provider: "meta",
    configured: true,
    readiness: blockers.length > 0 ? "action_required" : "ready",
    environment: {
      accessTokenConfigured: true,
      phoneNumberIdConfigured: true,
      businessAccountIdConfigured: true,
      registrationPinConfigured: Boolean(config.registrationPin),
    },
    phone,
    businessAccount,
    templates,
    blockers,
    notes,
  };
}

export async function registerPendingWhatsAppNumber(pin?: string | null): Promise<RegistrationAttemptResult> {
  const config = extractMetaConfig();

  if (!config.accessToken || !config.phoneNumberId || !config.businessAccountId) {
    return {
      ok: false,
      status: 0,
      message: "Meta WhatsApp Cloud API env vars are incomplete.",
      response: null,
    };
  }

  const resolvedPin = cleanText(pin) || config.registrationPin;
  if (!resolvedPin) {
    return {
      ok: false,
      status: 409,
      message: "Meta registration requires a WhatsApp PIN, but WHATSAPP_TWO_FACTOR_PIN or WHATSAPP_PIN is not configured.",
      response: null,
    };
  }

  const response = await metaFetch<Record<string, unknown>>(`/${config.phoneNumberId}/register`, {
    method: "POST",
    body: {
      messaging_product: "whatsapp",
      pin: resolvedPin,
    },
  });

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: formatMetaError(
        response.error,
        "Meta rejected the WhatsApp registration request."
      ),
      response: response.error ? { error: response.error } : null,
    };
  }

  return {
    ok: true,
    status: response.status,
    message: "The phone number registration request was accepted by Meta.",
    response: asRecord(response.data),
  };
}

export async function sendWhatsAppProbe(input: {
  to: string;
  body?: string | null;
}): Promise<ProbeAttemptResult> {
  const config = extractMetaConfig();

  if (!config.accessToken || !config.phoneNumberId || !config.businessAccountId) {
    return {
      ok: false,
      status: 0,
      message: "Meta WhatsApp Cloud API env vars are incomplete.",
      code: null,
      response: null,
    };
  }

  const to = normalizeWhatsAppPhone(input.to);
  if (!to) {
    return {
      ok: false,
      status: 400,
      message: "A valid probe destination phone number is required.",
      code: null,
      response: null,
    };
  }

  const template = getProbeTemplate();
  const result = await sendWhatsAppText({
    phone: to,
    body:
      cleanText(input.body) ||
      "HenryCo Care WhatsApp health check. If you received this message, Cloud delivery is active.",
    template,
    metadata: {
      sourceKind: "owner_probe",
      sourceLabel: "Owner health probe",
      actorRole: "owner",
      conversationPolicy: "business_initiated",
    },
  });

  if (!result.ok) {
    return {
      ok: false,
      status: result.statusCode || 0,
      message: result.reason || "Meta rejected the probe message.",
      code: result.graphErrorCode ?? null,
      response: {
        provider: result.provider,
        deliveryStage: result.deliveryStage,
        messageId: result.messageId,
        responseSummary: result.responseSummary,
        resolvedWaId: result.resolvedWaId,
        contactStatus: result.contactStatus,
        messageType: result.messageType,
        conversationType: result.conversationType,
        templateName: result.templateName,
        templateLanguage: result.templateLanguage,
      },
    };
  }

  return {
    ok: true,
    status: result.statusCode || 200,
    message:
      result.deliveryStage === "api_accepted"
        ? "Probe accepted by Meta. Handset delivery still depends on receipt callbacks or a valid template path."
        : "Probe request completed.",
    code: null,
    response: {
      provider: result.provider,
      deliveryStage: result.deliveryStage,
      messageId: result.messageId,
      responseSummary: result.responseSummary,
      resolvedWaId: result.resolvedWaId,
      contactStatus: result.contactStatus,
      messageType: result.messageType,
      conversationType: result.conversationType,
      templateName: result.templateName,
      templateLanguage: result.templateLanguage,
    },
  };
}
