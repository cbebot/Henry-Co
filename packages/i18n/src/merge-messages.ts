type JsonObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * DeepPartial<T> — recursive Partial that lets any nested key be omitted.
 *
 * Locale-override modules use this so a locale can supply a subset of nested
 * keys (e.g. just `footer.exploreDivisions`) without having to redeclare the
 * entire `footer` object. Missing keys fall back to the EN baseline via
 * `deepMergeMessages` at runtime.
 *
 * Tuples / readonly arrays stay opaque (cannot partially override array
 * contents — the override must supply the full array or omit it).
 */
export type DeepPartial<T> = T extends ReadonlyArray<unknown>
  ? T
  : T extends Date
  ? T
  : T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

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
