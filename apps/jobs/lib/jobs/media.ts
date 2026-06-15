import "server-only";

import {
  isAbsoluteUrl,
  isMediaRef,
  parseMediaRef,
  type MediaValidationRule,
} from "@henryco/media";
import { createSupabaseMediaStore, type MediaStore } from "@henryco/media/server";

import { createAdminSupabase } from "@/lib/supabase";

/**
 * Jobs media adapter over @henryco/media (Supabase-first, a swappable seam).
 *
 * Candidate documents (resume / portfolio / certification) are NDPA personal
 * data, so they ride the RLS-PRIVATE `jobs-documents` bucket and are read back
 * only via short-lived signed URLs — never a public CDN. Each upload persists a
 * backend-neutral `media://private/<bucket>/<key>` reference in place of a raw
 * URL, so the storage vendor stays swappable (a resolver change, not a data
 * migration).
 *
 * The privileged upload + sign path lives here (server-only); it injects the
 * jobs service-role client into the media store so the media layer never reads
 * credentials itself. This mirrors the proven property adapter.
 */

/**
 * RLS-private bucket for candidate documents. Env-overridable to match the
 * legacy `JOBS_DOCUMENTS_BUCKET` knob (default `jobs-documents`).
 */
export const JOBS_DOCUMENT_BUCKET =
  String(process.env.JOBS_DOCUMENTS_BUCKET || "jobs-documents").trim() || "jobs-documents";

/**
 * Validation for candidate documents — kept equivalent to the legacy
 * `uploadJobsDocument` config (PDF / DOC / DOCX / JPG / PNG / WebP, <= 12MB).
 */
export const JOBS_DOCUMENT_RULE: MediaValidationRule = {
  maxBytes: 12 * 1024 * 1024,
  allowedTypes: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ],
  invalidTypeMessage: "Please upload a PDF, DOC, DOCX, JPG, PNG, or WebP file.",
};

let bucketsEnsured = false;

async function ensureBucket(name: string, options: { public: boolean; fileSizeLimit?: string }) {
  const admin = createAdminSupabase();
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = (buckets ?? []).some((bucket) => bucket.name === name);

  if (!exists) {
    await admin.storage.createBucket(name, options);
  }
}

/** Provision the private documents bucket on first use (idempotent, resilient). */
export async function ensureJobsBuckets() {
  if (bucketsEnsured) return;

  try {
    await ensureBucket(JOBS_DOCUMENT_BUCKET, { public: false, fileSizeLimit: "12MB" });
    bucketsEnsured = true;
  } catch {
    // Keep runtime resilient during local setup / first deploy.
  }
}

/**
 * Fresh service-role client per call (repo convention: admin clients are not
 * module-cached), injected so the media layer never reads credentials itself.
 */
function getJobsMediaStore(): MediaStore {
  return createSupabaseMediaStore({ client: createAdminSupabase() });
}

/**
 * Upload a candidate document to the RLS-private bucket and return a
 * `media://private/jobs-documents/<key>` reference (persisted in place of the
 * old public CDN URL).
 */
export async function uploadJobsCandidateDocument(input: {
  userId: string;
  kind: string;
  file: File;
}): Promise<string> {
  await ensureJobsBuckets();
  return getJobsMediaStore().upload({
    file: input.file,
    visibility: "private",
    bucket: JOBS_DOCUMENT_BUCKET,
    pathPrefix: `candidates/${input.userId}/${input.kind}`,
    rule: JOBS_DOCUMENT_RULE,
  });
}

/**
 * Resolve a stored candidate-document value to a renderable delivery URL for the
 * client. Backward compatible:
 *  - a `media://private/...` reference  -> a short-lived signed URL (the new path)
 *  - a legacy absolute URL (Cloudinary) -> passed through unchanged
 *  - anything else                      -> "" (filtered out by callers)
 *
 * Always called server-side before the value reaches a client: `resolveMediaUrl`
 * throws on a private ref, and a raw `<a href>` on a `media://` ref would break,
 * so reads must be signed here.
 */
export async function signJobsMediaUrl(value: string): Promise<string> {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  if (isMediaRef(raw)) {
    try {
      if (parseMediaRef(raw).visibility === "private") {
        return await getJobsMediaStore().signedUrl(raw);
      }
    } catch {
      // Malformed ref or signing failure — fall through to "".
    }
    return "";
  }

  // Legacy rows hold an absolute Cloudinary URL — serve it unchanged.
  return isAbsoluteUrl(raw) ? raw : "";
}
