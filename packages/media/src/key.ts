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
 * One prefix segment as a plain storage name: every character outside
 * `[A-Za-z0-9._-]` becomes `-`, and a segment made only of dots becomes `-`.
 * Case is kept (existing keys carry codes such as `TRK-ABC123`).
 */
function sanitizePrefixSegment(segment: string): string {
  const safe = segment.replace(/[^A-Za-z0-9._-]/g, "-");
  return /^\.+$/.test(safe) ? "-" : safe;
}

/**
 * Build a storage object key: `<pathPrefix>/<id>-<safeFileName>`.
 * The caller supplies the (already-random) `id` so this stays pure/testable.
 *
 * The prefix is rebuilt segment by segment because the storage client puts the
 * key into its request URL as-is, and URL parsing resolves `.` and `..` (also
 * written as `%2e`), reads `\` as `/`, and ends the path at `?` or `#`. With
 * every segment reduced to a plain name, a prefix can never climb out of its
 * bucket, cut the key short, or carry an escape, whatever string a caller
 * passes.
 */
export function buildObjectKey(input: {
  pathPrefix?: string;
  fileName: string;
  id: string;
}): string {
  const prefix = String(input.pathPrefix ?? "")
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map(sanitizePrefixSegment)
    .join("/");
  const id =
    String(input.id ?? "")
      .replace(/[^a-z0-9-]/gi, "")
      .slice(0, 12) || "0";
  const leaf = `${id}-${sanitizeFileName(input.fileName)}`;
  return prefix ? `${prefix}/${leaf}` : leaf;
}
