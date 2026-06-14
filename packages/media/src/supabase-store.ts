/**
 * @henryco/media — Supabase Storage backend (server-only).
 *
 * The caller injects a PRIVILEGED (service-role) Supabase client, so this layer
 * never reads credentials itself and always rides the app's own factory path
 * (compatible with the RLS/grant lockdown). Public objects render via the
 * deterministic public URL ({@link resolveMediaUrl}); private objects are read
 * via short-lived signed URLs, cached in-process by TTL.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { buildObjectKey } from "./key";
import { buildMediaRef, parseMediaRef } from "./ref";
import type { MediaRef, MediaStore, MediaUploadInput } from "./types";
import { validateUpload } from "./validate";

type CacheEntry = { url: string; expiresAt: number };

export type SupabaseMediaStoreOptions = {
  /**
   * A privileged (service-role) Supabase client. The caller owns its lifecycle;
   * we only use its `.storage` namespace.
   */
  client: Pick<SupabaseClient, "storage">;
};

export function createSupabaseMediaStore(options: SupabaseMediaStoreOptions): MediaStore {
  const { client } = options;
  const signedCache = new Map<string, CacheEntry>();

  return {
    async upload(input: MediaUploadInput): Promise<MediaRef> {
      validateUpload(input.file, input.rule);

      const key = buildObjectKey({
        pathPrefix: input.pathPrefix,
        fileName: input.file.name,
        // Web Crypto global (NOT node:crypto) so this is Edge-safe.
        id: crypto.randomUUID(),
      });

      const { error } = await client.storage.from(input.bucket).upload(key, input.file, {
        contentType: input.file.type || "application/octet-stream",
        upsert: false,
      });
      if (error) {
        throw new Error(error.message || "Media upload failed. Please try again.");
      }

      return buildMediaRef({ visibility: input.visibility, bucket: input.bucket, key });
    },

    async signedUrl(ref: MediaRef, ttlSeconds = 3600): Promise<string> {
      const { bucket, key } = parseMediaRef(String(ref));
      const cacheKey = `${bucket}/${key}`;
      const now = Date.now();

      const hit = signedCache.get(cacheKey);
      if (hit && hit.expiresAt > now + 5_000) return hit.url;

      const { data, error } = await client.storage.from(bucket).createSignedUrl(key, ttlSeconds);
      if (error || !data?.signedUrl) {
        throw new Error(error?.message || "Could not generate a signed media URL.");
      }

      signedCache.set(cacheKey, { url: data.signedUrl, expiresAt: now + ttlSeconds * 1_000 });
      return data.signedUrl;
    },

    async remove(ref: MediaRef): Promise<void> {
      const { bucket, key } = parseMediaRef(String(ref));
      const { error } = await client.storage.from(bucket).remove([key]);
      if (error) {
        throw new Error(error.message || "Could not remove media object.");
      }
    },
  };
}
