/**
 * @henryco/media — object-key construction (pure, client-safe).
 */

/** Lowercase, URL/path-safe filename, extension preserved. */
export function sanitizeFileName(name: string): string {
  const raw = String(name ?? "").trim().toLowerCase();
  const dot = raw.lastIndexOf(".");
  const base =
    (dot > 0 ? raw.slice(0, dot) : raw)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "asset";
  const ext = (dot > 0 ? raw.slice(dot + 1) : "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 8);
  return ext ? `${base}.${ext}` : base;
}

/**
 * Build a storage object key: `<pathPrefix>/<id>-<safeFileName>`.
 * The caller supplies the (already-random) `id` so this stays pure/testable.
 */
export function buildObjectKey(input: {
  pathPrefix?: string;
  fileName: string;
  id: string;
}): string {
  const prefix = String(input.pathPrefix ?? "")
    .trim()
    .replace(/^\/+|\/+$/g, "");
  const id =
    String(input.id ?? "")
      .replace(/[^a-z0-9-]/gi, "")
      .slice(0, 12) || "0";
  const leaf = `${id}-${sanitizeFileName(input.fileName)}`;
  return prefix ? `${prefix}/${leaf}` : leaf;
}
