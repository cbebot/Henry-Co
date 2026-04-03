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
