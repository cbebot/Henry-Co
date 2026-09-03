/**
 * @henryco/media — server-only entrypoint.
 *
 * Exposes the storage backend (upload, signed URLs, remove). Importing this from
 * a client component is a build error (the `server-only` guard), keeping the
 * privileged Supabase client and any secrets off the client bundle.
 */

import "server-only";

export { createSupabaseMediaStore, type SupabaseMediaStoreOptions } from "./supabase-store";
export type { MediaStore, MediaUploadInput, MediaRef, MediaVisibility } from "./types";
