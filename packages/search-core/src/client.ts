/**
 * Thin Typesense REST client.
 *
 * We do not depend on the official typesense-js client because:
 *   - It pulls a heavy axios stack and forces CommonJS interop quirks.
 *   - We only need three operations: ensure-collection, upsert/delete
 *     documents, and multi_search.
 *   - Our admin-key surface stays tiny (one fetch wrapper) and easy to
 *     audit for accidental client exposure.
 *
 * Two key separations:
 *   - `getAdminClient()`         — server-only. Reads TYPESENSE_ADMIN_API_KEY.
 *                                  Never exposed to the browser.
 *   - `issueScopedSearchKey()`   — server mints a per-user, per-request
 *                                  search-only key with embedded filters
 *                                  (Typesense's signed key feature). The
 *                                  client receives the scoped key, not the
 *                                  base TYPESENSE_SEARCH_API_KEY directly.
 */

import { createHmac } from "node:crypto";

export interface TypesenseEnv {
  /** Full host URL e.g. https://search.henrycogroup.com */
  host: string;
  /** Admin API key — server-only. Required for indexing & key issuance. */
  adminApiKey?: string;
  /**
   * Public search-only key. NOT used by client directly; we use it as the
   * SEED for `issueScopedSearchKey()` so per-user keys inherit its
   * collection-restricted scope.
   */
  searchApiKey?: string;
}

export function readTypesenseEnv(env: NodeJS.ProcessEnv = process.env): TypesenseEnv {
  return {
    host: cleanText(env.TYPESENSE_HOST) || cleanText(env.NEXT_PUBLIC_TYPESENSE_HOST),
    adminApiKey: cleanText(env.TYPESENSE_ADMIN_API_KEY) || undefined,
    searchApiKey:
      cleanText(env.TYPESENSE_SEARCH_API_KEY) ||
      cleanText(env.NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY) ||
      undefined,
  };
}

function cleanText(value: unknown): string {
  return String(value ?? "").trim();
}

function assertHost(env: TypesenseEnv): string {
  if (!env.host) {
    throw new Error("TYPESENSE_HOST is not configured.");
  }
  return env.host.replace(/\/+$/, "");
}

async function tsFetch(
  env: TypesenseEnv,
  path: string,
  init: { method: string; body?: unknown; apiKey: string },
): Promise<unknown> {
  const host = assertHost(env);
  const url = `${host}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    "X-TYPESENSE-API-KEY": init.apiKey,
    "Content-Type": "application/json",
  };

  const body = init.body === undefined ? undefined : JSON.stringify(init.body);
  const response = await fetch(url, { method: init.method, headers, body });

  if (response.status === 404) {
    return { __not_found: true };
  }
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Typesense ${init.method} ${path} failed: ${response.status} ${text}`);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export interface TypesenseAdminClient {
  ensureCollection: (schema: { name: string; fields: unknown[]; default_sorting_field?: string }) => Promise<void>;
  upsertDocument: (collection: string, document: Record<string, unknown>) => Promise<void>;
  upsertDocumentsBulk: (collection: string, documents: Record<string, unknown>[]) => Promise<{ success: number; failed: number }>;
  deleteDocument: (collection: string, documentId: string) => Promise<void>;
  multiSearch: (body: { searches: unknown[] }) => Promise<unknown>;
}

export function getAdminClient(env: TypesenseEnv = readTypesenseEnv()): TypesenseAdminClient {
  if (!env.adminApiKey) {
    throw new Error("TYPESENSE_ADMIN_API_KEY is not configured.");
  }

  const adminKey = env.adminApiKey;

  return {
    ensureCollection: async (schema) => {
      const existing = await tsFetch(env, `/collections/${schema.name}`, {
        method: "GET",
        apiKey: adminKey,
      });
      if (existing && (existing as { __not_found?: boolean }).__not_found) {
        await tsFetch(env, `/collections`, {
          method: "POST",
          apiKey: adminKey,
          body: schema,
        });
      }
    },
    upsertDocument: async (collection, document) => {
      await tsFetch(env, `/collections/${collection}/documents?action=upsert`, {
        method: "POST",
        apiKey: adminKey,
        body: document,
      });
    },
    upsertDocumentsBulk: async (collection, documents) => {
      if (documents.length === 0) return { success: 0, failed: 0 };
      const ndjson = documents.map((d) => JSON.stringify(d)).join("\n");
      const host = assertHost(env);
      const response = await fetch(
        `${host}/collections/${collection}/documents/import?action=upsert`,
        {
          method: "POST",
          headers: {
            "X-TYPESENSE-API-KEY": adminKey,
            "Content-Type": "text/plain",
          },
          body: ndjson,
        },
      );
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`Typesense bulk import failed: ${response.status} ${text}`);
      }
      const text = await response.text();
      let success = 0;
      let failed = 0;
      for (const line of text.split("\n")) {
        if (!line) continue;
        try {
          const parsed = JSON.parse(line) as { success?: boolean };
          if (parsed.success) success += 1;
          else failed += 1;
        } catch {
          failed += 1;
        }
      }
      return { success, failed };
    },
    deleteDocument: async (collection, documentId) => {
      await tsFetch(env, `/collections/${collection}/documents/${encodeURIComponent(documentId)}`, {
        method: "DELETE",
        apiKey: adminKey,
      });
    },
    multiSearch: async (body) => {
      return tsFetch(env, `/multi_search`, {
        method: "POST",
        apiKey: adminKey,
        body,
      });
    },
  };
}

/**
 * Mints a Typesense scoped search key per request.
 *
 * Scoped keys embed:
 *   - filter_by    — server-resolved role/owner filters
 *   - expires_at   — short TTL (default 5 min)
 * The client uses the scoped key for `multi_search`. If the client tries
 * to alter the embedded filter, Typesense rejects the request because the
 * HMAC no longer matches.
 *
 * IMPORTANT: this requires the SEARCH (not admin) key as the seed. The
 * scoped key inherits its collection scope from the seed key, so the
 * search-only key MUST be configured in Typesense as restricted to
 * public collections. Our worker will configure that via
 * `ensureSearchOnlyKey()` at provisioning.
 */
export function issueScopedSearchKey(input: {
  baseSearchApiKey: string;
  filterBy: string;
  expiresAtSeconds?: number;
  embedded?: Record<string, unknown>;
}): string {
  const ttlSeconds = input.expiresAtSeconds ?? 300;
  const embedded = {
    filter_by: input.filterBy,
    expires_at: Math.floor(Date.now() / 1000) + ttlSeconds,
    ...(input.embedded ?? {}),
  };

  const embeddedJson = JSON.stringify(embedded);
  const hmac = createHmac("sha256", input.baseSearchApiKey).update(embeddedJson).digest("base64");
  const keyPrefix = input.baseSearchApiKey.slice(0, 4);
  return Buffer.from(`${hmac}${keyPrefix}${embeddedJson}`).toString("base64");
}
