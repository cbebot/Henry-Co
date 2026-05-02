export type JsonLdNode = Record<string, unknown>;

function dropUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .map((item) => dropUndefined(item))
      .filter((item) => item !== undefined);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
      if (raw === undefined) continue;
      const cleaned = dropUndefined(raw);
      if (cleaned === undefined) continue;
      if (Array.isArray(cleaned) && cleaned.length === 0) continue;
      if (
        cleaned &&
        typeof cleaned === "object" &&
        !Array.isArray(cleaned) &&
        Object.keys(cleaned as Record<string, unknown>).length === 0
      ) {
        continue;
      }
      out[key] = cleaned;
    }
    return out;
  }
  return value;
}

export function renderJsonLd(node: JsonLdNode | JsonLdNode[]): string {
  const cleaned = dropUndefined(node);
  return JSON.stringify(cleaned)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
