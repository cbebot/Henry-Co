import "server-only";

import { createSupabaseMediaStore, type MediaStore } from "@henryco/media/server";
import {
  isAbsoluteUrl,
  isMediaRef,
  parseMediaRef,
  resolveMediaUrl,
} from "@henryco/media";

import { createStaffAdminSupabase } from "@/lib/supabase/admin";

/**
 * Staff media adapter over @henryco/media (Supabase-first, vendor-swappable).
 *
 * Staff is a READ-ONLY consumer of sensitive customer documents — it never
 * uploads. The KYC review queue reads `customer_documents.file_url` (written by
 * the account-side KYC upload) and renders it to a reviewer. Once that producer
 * persists a backend-neutral `media://private/<bucket>/<key>` reference instead
 * of a raw public URL, the stored value is NOT directly renderable client-side
 * (`resolveMediaUrl` throws on a private ref by design). So every staff read
 * site that hands the value to the browser MUST first resolve it to a
 * short-lived SIGNED URL here, server-only.
 *
 * This is backward-compatible: legacy absolute URLs already in the table pass
 * through untouched, public `media://` refs resolve to their deterministic
 * delivery URL, and only the new RLS-private refs are signed. No data shape, no
 * review-decision / status / money logic is changed — storage resolution only.
 */

/** RLS-PRIVATE bucket name for this app's documents (signed-URL only). */
export const STAFF_DOCUMENT_BUCKET = "staff-documents";

function getStaffMediaStore(): MediaStore {
  // Fresh service-role client per call (repo convention: admin clients are not
  // module-cached), injected so the media layer never reads credentials itself.
  return createSupabaseMediaStore({ client: createStaffAdminSupabase() });
}

/**
 * Resolve a stored media value to a URL safe to hand to a client.
 *
 * - `media://private/...` → a short-lived SIGNED URL (server-only).
 * - `media://public/...`  → the deterministic public delivery URL.
 * - a legacy absolute URL (existing Cloudinary/Supabase rows) → passed through.
 * - anything malformed/empty → "" (callers filter/guard).
 *
 * Server-only: signing requires the privileged client. Never expose a private
 * `media://` ref directly to a browser — `resolveMediaUrl` throws on it by
 * design, so an un-signed private ref would break the "View document" link.
 */
export async function signStaffMediaUrl(value: string, ttlSeconds = 3600): Promise<string> {
  if (!value) return "";
  if (isMediaRef(value)) {
    try {
      if (parseMediaRef(value).visibility === "private") {
        return await getStaffMediaStore().signedUrl(value, ttlSeconds);
      }
      return resolveMediaUrl(value);
    } catch {
      return "";
    }
  }
  return isAbsoluteUrl(value) ? value : "";
}

/** True when the stored value is a private `media://` reference (needs signing). */
export function isPrivateMediaRef(value: string): boolean {
  return (
    isMediaRef(value) &&
    (() => {
      try {
        return parseMediaRef(value).visibility === "private";
      } catch {
        return false;
      }
    })()
  );
}
