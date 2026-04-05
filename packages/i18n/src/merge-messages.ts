type JsonObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Deep-merge `overrides` onto `base`. Arrays and primitives from overrides replace. */
export function deepMergeMessages<T extends JsonObject>(base: T, overrides: Partial<T> | JsonObject): T {
  const out: JsonObject = { ...base };

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) continue;

    const existing = out[key];
    if (isPlainObject(existing) && isPlainObject(value)) {
      out[key] = deepMergeMessages(existing as JsonObject, value as JsonObject);
    } else {
      out[key] = value;
    }
  }

  return out as T;
}
