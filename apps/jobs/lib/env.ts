export function cleanEnv(value?: string | null) {
  return String(value || "")
    .replace(/\r\n|\r|\n/g, "")
    .replace(/\\r\\n|\\r|\\n/g, "")
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

export function slugify(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 72);
}
