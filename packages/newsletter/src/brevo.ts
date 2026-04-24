export type BrevoClientConfig = {
  apiKey: string | null;
  senderEmail: string;
  senderName: string;
};

export type BrevoSendInput = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  headers?: Record<string, string>;
  tags?: string[];
};

export type BrevoSendResult =
  | { ok: true; messageId: string; provider: "brevo" }
  | { ok: false; error: string; status: number | null; provider: "brevo" | "disabled" };

export type BrevoContactSyncInput = {
  email: string;
  listIds?: number[];
  attributes?: Record<string, string | number | boolean | null>;
  updateEnabled?: boolean;
};

export type BrevoContactSyncResult =
  | { ok: true; action: "created" | "updated" }
  | { ok: false; error: string; status: number | null };

export type BrevoUnsubscribeSyncInput = {
  email: string;
  listIds?: number[];
};

export function resolveBrevoConfig(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>
): BrevoClientConfig {
  return {
    apiKey: env.BREVO_API_KEY?.trim() || null,
    senderEmail: env.BREVO_SENDER_EMAIL?.trim() || "noreply@henrycogroup.com",
    senderName: env.BREVO_SENDER_NAME?.trim() || "HenryCo",
  };
}

export function isBrevoEnabled(config: BrevoClientConfig): boolean {
  return Boolean(config.apiKey);
}

async function brevoFetch(
  path: string,
  config: BrevoClientConfig,
  init: RequestInit
): Promise<Response> {
  if (!config.apiKey) {
    throw new Error("BREVO_API_KEY not configured");
  }
  const headers = new Headers(init.headers);
  headers.set("api-key", config.apiKey);
  headers.set("content-type", "application/json");
  headers.set("accept", "application/json");
  return fetch(`https://api.brevo.com${path}`, { ...init, headers });
}

export async function brevoSendTransactional(
  config: BrevoClientConfig,
  input: BrevoSendInput
): Promise<BrevoSendResult> {
  if (!isBrevoEnabled(config)) {
    return { ok: false, error: "BREVO_API_KEY not configured", status: null, provider: "disabled" };
  }
  try {
    const response = await brevoFetch("/v3/smtp/email", config, {
      method: "POST",
      body: JSON.stringify({
        sender: { email: config.senderEmail, name: config.senderName },
        to: [{ email: input.to }],
        subject: input.subject,
        htmlContent: input.html,
        replyTo: input.replyTo ? { email: input.replyTo } : undefined,
        headers: input.headers,
        tags: input.tags,
      }),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return {
        ok: false,
        error: body ? body.slice(0, 400) : `brevo_http_${response.status}`,
        status: response.status,
        provider: "brevo",
      };
    }
    const payload = (await response.json().catch(() => null)) as { messageId?: string } | null;
    return {
      ok: true,
      messageId: payload?.messageId ?? `brevo_${Date.now()}`,
      provider: "brevo",
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown_error",
      status: null,
      provider: "brevo",
    };
  }
}

export async function brevoSyncContact(
  config: BrevoClientConfig,
  input: BrevoContactSyncInput
): Promise<BrevoContactSyncResult> {
  if (!isBrevoEnabled(config)) {
    return { ok: false, error: "BREVO_API_KEY not configured", status: null };
  }
  try {
    const response = await brevoFetch("/v3/contacts", config, {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        listIds: input.listIds,
        attributes: input.attributes,
        updateEnabled: input.updateEnabled ?? true,
      }),
    });
    if (response.status === 201) return { ok: true, action: "created" };
    if (response.status === 204) return { ok: true, action: "updated" };
    if (response.status === 400) {
      const body = (await response.json().catch(() => null)) as { code?: string } | null;
      if (body?.code === "duplicate_parameter") {
        return { ok: true, action: "updated" };
      }
    }
    const text = await response.text().catch(() => "");
    return {
      ok: false,
      error: text ? text.slice(0, 400) : `brevo_http_${response.status}`,
      status: response.status,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown_error",
      status: null,
    };
  }
}

export async function brevoRemoveContactFromLists(
  config: BrevoClientConfig,
  input: BrevoUnsubscribeSyncInput
): Promise<{ ok: boolean; error?: string }> {
  if (!isBrevoEnabled(config)) {
    return { ok: false, error: "BREVO_API_KEY not configured" };
  }
  if (!input.listIds || input.listIds.length === 0) {
    return { ok: true };
  }
  let hadError = false;
  let lastError = "";
  for (const listId of input.listIds) {
    try {
      const response = await brevoFetch(`/v3/contacts/lists/${listId}/contacts/remove`, config, {
        method: "POST",
        body: JSON.stringify({ emails: [input.email] }),
      });
      if (!response.ok && response.status !== 400 && response.status !== 404) {
        hadError = true;
        lastError = `list_${listId}_http_${response.status}`;
      }
    } catch (err) {
      hadError = true;
      lastError = err instanceof Error ? err.message : "unknown_error";
    }
  }
  return hadError ? { ok: false, error: lastError } : { ok: true };
}

export async function brevoBlocklistContact(
  config: BrevoClientConfig,
  email: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isBrevoEnabled(config)) {
    return { ok: false, error: "BREVO_API_KEY not configured" };
  }
  try {
    const response = await brevoFetch(`/v3/contacts/${encodeURIComponent(email)}`, config, {
      method: "PUT",
      body: JSON.stringify({ emailBlacklisted: true }),
    });
    if (!response.ok && response.status !== 400 && response.status !== 404) {
      return { ok: false, error: `brevo_http_${response.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown_error" };
  }
}
