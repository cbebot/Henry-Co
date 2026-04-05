export function getOptionalEnv(key: string): string | undefined {
  return typeof process !== "undefined" ? process.env[key] : undefined;
}

export function getRequiredEnv(key: string): string {
  const value = getOptionalEnv(key);
  if (!value) throw new Error(`Missing required env: ${key}`);
  return value;
}

export function normalizeEmail(email?: string | null): string | null {
  if (!email) return null;
  return email.trim().toLowerCase();
}
