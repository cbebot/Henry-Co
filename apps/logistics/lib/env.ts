export function cleanEnv(value?: string | null) {
  return String(value || "")
    .replace(/\r\n|\r|\n/g, "")
    .trim();
}

export function getOptionalEnv(name: string) {
  const value = cleanEnv(process.env[name]);
  return value || null;
}

export function getRequiredEnv(name: string, message: string) {
  const value = getOptionalEnv(name);
  if (!value) {
    throw new Error(message);
  }

  return value;
}

export function normalizeEmail(value?: string | null) {
  const email = cleanEnv(value).toLowerCase();
  return email || null;
}

export function sanitizeHeaderValue(value?: string | null) {
  return cleanEnv(value)
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ");
}

export function extractEmailAddress(value?: string | null) {
  const clean = sanitizeHeaderValue(value);
  if (!clean) return null;

  const angleMatch = clean.match(/<([^<>]+)>/);
  const candidate = angleMatch ? angleMatch[1] : clean;
  const match = candidate.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0].trim().toLowerCase() : null;
}

export function normalizePhone(value?: string | null) {
  const raw = cleanEnv(value);
  if (!raw) return null;

  if (raw.startsWith("+")) {
    const digits = raw.replace(/[^\d+]/g, "");
    return digits.length > 8 ? digits : null;
  }

  const digits = raw.replace(/\D+/g, "");
  if (!digits) return null;

  if (digits.startsWith("0") && digits.length === 11) {
    return `+234${digits.slice(1)}`;
  }

  if (digits.length >= 10) {
    return `+${digits}`;
  }

  return null;
}

export function formatCurrency(value: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
