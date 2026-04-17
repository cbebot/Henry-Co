export function cleanEnv(value?: string | null) {
  return String(value || "")
    .replace(/\r\n|\r|\n/g, "")
    .trim();
}

export function normalizeEmailAddress(value?: string | null) {
  const clean = cleanEnv(value).toLowerCase();
  if (!clean) return null;

  const angleMatch = clean.match(/<([^<>]+)>/);
  const candidate = angleMatch ? angleMatch[1] : clean;
  const emailMatch = candidate.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return emailMatch ? emailMatch[0].trim().toLowerCase() : null;
}

export function parseNamedEmail(value?: string | null) {
  const clean = cleanEnv(value);
  if (!clean) {
    return {
      email: null as string | null,
      name: null as string | null,
    };
  }

  const angleMatch = clean.match(/^(.*?)(?:<([^<>]+)>)?$/);
  const name = cleanEnv(angleMatch?.[1]?.replace(/^["']|["']$/g, ""));
  const email = normalizeEmailAddress(angleMatch?.[2] || clean);

  return {
    email,
    name: name || null,
  };
}

export function splitCsv(value?: string | null) {
  return cleanEnv(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

