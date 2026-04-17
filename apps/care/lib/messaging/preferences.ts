import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { buildCarePublicUrl } from "@/lib/care-links";
import { createAdminSupabase } from "@/lib/supabase";

const MARKETING_SCOPE = "marketing";
const PREFERENCE_EVENT_TYPE = "marketing_subscription_updated";

type PreferencePayload = {
  scope: typeof MARKETING_SCOPE;
  email: string | null;
  phone: string | null;
};

type PreferenceTokenEnvelope = {
  payload: string;
  signature: string;
};

function cleanText(value?: string | null) {
  return String(value || "").trim();
}

function cleanEmail(value?: string | null) {
  const match = cleanText(value).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0].trim().toLowerCase() : null;
}

function normalizePhone(value?: string | null) {
  const raw = cleanText(value);
  if (!raw) return null;

  if (raw.startsWith("+")) {
    const digits = raw.replace(/[^\d+]/g, "");
    return digits.length > 8 ? digits : null;
  }

  const digits = raw.replace(/\D+/g, "");
  if (!digits) return null;

  if (digits.startsWith("234") && digits.length >= 13) {
    return `+${digits}`;
  }

  if (digits.startsWith("0") && digits.length === 11) {
    return `+234${digits.slice(1)}`;
  }

  if (digits.length >= 10) {
    return `+${digits}`;
  }

  return null;
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function getPreferenceSecret() {
  return (
    cleanText(process.env.MARKETING_PREFERENCES_SECRET) ||
    cleanText(process.env.CRON_SECRET) ||
    cleanText(process.env.INBOUND_EMAIL_WEBHOOK_SECRET) ||
    cleanText(process.env.RESEND_WEBHOOK_SECRET) ||
    cleanText(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
    "local-care-preferences-secret"
  );
}

function signPayload(payload: string) {
  return createHmac("sha256", getPreferenceSecret()).update(payload).digest("hex");
}

function buildEnvelope(input: PreferencePayload): PreferenceTokenEnvelope {
  const payload = toBase64Url(JSON.stringify(input));
  return {
    payload,
    signature: signPayload(payload),
  };
}

function parseEnvelope(token: string): PreferencePayload | null {
  const [payload, signature] = cleanText(token).split(".");
  if (!payload || !signature) return null;

  const expected = Buffer.from(signPayload(payload));
  const actual = Buffer.from(signature);

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64Url(payload)) as Partial<PreferencePayload>;
    if (parsed.scope !== MARKETING_SCOPE) return null;

    const email = cleanEmail(parsed.email);
    const phone = normalizePhone(parsed.phone);

    if (!email && !phone) {
      return null;
    }

    return {
      scope: MARKETING_SCOPE,
      email,
      phone,
    };
  } catch {
    return null;
  }
}

export function createMarketingPreferenceToken(input: {
  email?: string | null;
  phone?: string | null;
}) {
  const payload: PreferencePayload = {
    scope: MARKETING_SCOPE,
    email: cleanEmail(input.email),
    phone: normalizePhone(input.phone),
  };

  const envelope = buildEnvelope(payload);
  return `${envelope.payload}.${envelope.signature}`;
}

export async function buildMarketingUnsubscribeUrl(input: {
  email?: string | null;
  phone?: string | null;
}) {
  const token = createMarketingPreferenceToken(input);
  return buildCarePublicUrl("/api/care/preferences/unsubscribe", {
    token,
    mode: "unsubscribe",
  });
}

export async function buildMarketingResubscribeUrl(input: {
  email?: string | null;
  phone?: string | null;
}) {
  const token = createMarketingPreferenceToken(input);
  return buildCarePublicUrl("/api/care/preferences/unsubscribe", {
    token,
    mode: "resubscribe",
  });
}

export async function applyMarketingPreferenceToken(input: {
  token: string;
  mode: "unsubscribe" | "resubscribe";
  route?: string | null;
}) {
  const payload = parseEnvelope(input.token);

  if (!payload) {
    return {
      ok: false,
      email: null,
      phone: null,
      subscribed: null,
    };
  }

  const subscribed = input.mode === "resubscribe";
  const supabase = createAdminSupabase();

  await supabase.from("care_security_logs").insert({
    event_type: PREFERENCE_EVENT_TYPE,
    route: input.route || "/api/care/preferences/unsubscribe",
    email: payload.email,
    success: true,
    details: {
      scope: MARKETING_SCOPE,
      subscribed,
      email: payload.email,
      phone: payload.phone,
      mode: input.mode,
    },
  } as never);

  return {
    ok: true,
    email: payload.email,
    phone: payload.phone,
    subscribed,
  };
}

export async function getMarketingSuppressionIndex() {
  const supabase = createAdminSupabase();
  const { data } = await supabase
    .from("care_security_logs")
    .select("email, details, created_at")
    .eq("event_type", PREFERENCE_EVENT_TYPE)
    .order("created_at", { ascending: false })
    .limit(5000);

  const emailStates = new Map<string, boolean>();
  const phoneStates = new Map<string, boolean>();

  for (const row of data ?? []) {
    const details =
      row.details && typeof row.details === "object" && !Array.isArray(row.details)
        ? (row.details as Record<string, unknown>)
        : null;

    if (String(details?.scope || "") !== MARKETING_SCOPE) {
      continue;
    }

    const subscribed = Boolean(details?.subscribed);
    const email = cleanEmail(String(details?.email || row.email || ""));
    const phone = normalizePhone(String(details?.phone || ""));

    if (email && !emailStates.has(email)) {
      emailStates.set(email, subscribed);
    }

    if (phone && !phoneStates.has(phone)) {
      phoneStates.set(phone, subscribed);
    }
  }

  return {
    unsubscribedEmails: new Set(
      [...emailStates.entries()].filter(([, subscribed]) => !subscribed).map(([email]) => email)
    ),
    unsubscribedPhones: new Set(
      [...phoneStates.entries()].filter(([, subscribed]) => !subscribed).map(([phone]) => phone)
    ),
  };
}

export function isMarketingAllowed(
  index: {
    unsubscribedEmails: Set<string>;
    unsubscribedPhones: Set<string>;
  },
  input: {
    email?: string | null;
    phone?: string | null;
  }
) {
  const email = cleanEmail(input.email);
  const phone = normalizePhone(input.phone);

  if (email && index.unsubscribedEmails.has(email)) {
    return false;
  }

  if (phone && index.unsubscribedPhones.has(phone)) {
    return false;
  }

  return true;
}
