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
  const clean = cleanEnv(value).toLowerCase();
  return clean || null;
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
  if (digits.startsWith("234") && digits.length >= 13) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `+234${digits.slice(1)}`;
  if (digits.length >= 10) return `+${digits}`;
  return null;
}
