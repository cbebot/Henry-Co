import "server-only";

/**
 * Learn media adapter over @henryco/media.
 *
 * SENSITIVE learn uploads (teacher-application supporting files + student
 * assignment submissions) ride the swappable @henryco/media seam instead of a
 * public CDN. Each upload returns a backend-neutral `media://<vis>/<bucket>/<key>`
 * reference that is persisted in place of a raw URL, so the storage vendor stays
 * swappable (Supabase today) and the bytes never land on a public delivery type.
 *
 * Both flows write to RLS-PRIVATE buckets and are read back through short-lived
 * SIGNED URLs (never a public link):
 *   - TEACHER PROOF DOCS  -> `learn-teaching-files` (the already-defined private
 *     bucket; reused so we don't create redundant infra)
 *   - ASSIGNMENT SUBMISSIONS -> `learn-documents` (private; 50MB, broad mimes)
 *
 * Backward compatibility: rows written before this migration hold absolute
 * (legacy public CDN) URLs. `signLearnMediaUrl` passes those through unchanged
 * while signing the new `media://` private refs — so old and new rows both
 * render correctly through the same read path.
 */

import {
  isAbsoluteUrl,
  isMediaRef,
  parseMediaRef,
  resolveMediaUrl,
  type MediaValidationRule,
} from "@henryco/media";
import { createSupabaseMediaStore, type MediaStore } from "@henryco/media/server";

import { createAdminSupabase } from "@/lib/supabase";

/**
 * RLS-PRIVATE bucket for teacher-application supporting files (credentials /
 * business-registration / ID proof). Reuses the bucket already declared in
 * migration 20260403120000_learn_teacher_applications.sql (public=false, 12MB).
 */
export const LEARN_TEACHING_FILES_BUCKET = "learn-teaching-files";

/**
 * RLS-PRIVATE bucket for student assignment submissions (course deliverables).
 * Broader mime allowlist and a larger 50MB cap, gated to learner + grading
 * instructor via signed-URL reads only.
 */
export const LEARN_DOCUMENT_BUCKET = "learn-documents";

const TWELVE_MB = 12 * 1024 * 1024;
const FIFTY_MB = 50 * 1024 * 1024;

/**
 * Validation for teacher-application proof docs (mirrors the legacy
 * uploadTeacherApplicationFile allowlist + 12MB cap exactly).
 */
export const LEARN_TEACHER_FILE_RULE: MediaValidationRule = {
  maxBytes: TWELVE_MB,
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

/**
 * Validation for assignment submissions (mirrors the legacy
 * uploadAssignmentSubmissionFile allowlist + 50MB cap exactly).
 */
export const LEARN_ASSIGNMENT_FILE_RULE: MediaValidationRule = {
  maxBytes: FIFTY_MB,
  allowedTypes: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/quicktime",
    "video/webm",
    "audio/mpeg",
    "audio/mp4",
    "audio/wav",
    "text/plain",
    "text/csv",
    "application/zip",
  ],
  invalidTypeMessage: "Please upload a PDF, DOC/X, image, video, audio, or zip file.",
};

let bucketsEnsured = false;

async function ensureBucket(
  name: string,
  options: { public: boolean; fileSizeLimit?: string }
) {
  const admin = createAdminSupabase();
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = (buckets ?? []).some((bucket) => bucket.name === name);

  if (!exists) {
    await admin.storage.createBucket(name, options);
  }
}

/**
 * Ensure both private buckets exist before an upload. Idempotent and resilient:
 * swallows failures so a misconfigured local/staging environment never 500s the
 * upload path before the privileged write is attempted.
 */
export async function ensureLearnMediaBuckets() {
  if (bucketsEnsured) return;

  try {
    await ensureBucket(LEARN_TEACHING_FILES_BUCKET, { public: false, fileSizeLimit: "12MB" });
    await ensureBucket(LEARN_DOCUMENT_BUCKET, { public: false, fileSizeLimit: "50MB" });
    bucketsEnsured = true;
  } catch {
    // Keep runtime resilient during local setup.
  }
}

/**
 * Server media store, backed by the learn service-role client (the correct
 * factory path under the RLS/grant lockdown). Fresh per call — repo convention
 * does not module-cache admin clients — and the client is injected so the media
 * layer never reads credentials itself.
 */
function getLearnMediaStore(): MediaStore {
  return createSupabaseMediaStore({ client: createAdminSupabase() });
}

/**
 * Upload a teacher-application supporting file to the PRIVATE
 * `learn-teaching-files` bucket. Returns a persisted `media://` reference.
 */
export async function uploadTeacherApplicationMedia(
  file: File,
  pathPrefix: string
): Promise<string> {
  await ensureLearnMediaBuckets();
  return getLearnMediaStore().upload({
    file,
    visibility: "private",
    bucket: LEARN_TEACHING_FILES_BUCKET,
    pathPrefix,
    rule: LEARN_TEACHER_FILE_RULE,
  });
}

/**
 * Upload a student assignment submission to the PRIVATE `learn-documents`
 * bucket. Returns a persisted `media://` reference.
 */
export async function uploadAssignmentSubmissionMedia(
  file: File,
  pathPrefix: string
): Promise<string> {
  await ensureLearnMediaBuckets();
  return getLearnMediaStore().upload({
    file,
    visibility: "private",
    bucket: LEARN_DOCUMENT_BUCKET,
    pathPrefix,
    rule: LEARN_ASSIGNMENT_FILE_RULE,
  });
}

/**
 * Resolve a stored sensitive-media value to a renderable delivery URL, SERVER-SIDE
 * ONLY. This MUST be awaited at every read site before the value reaches a client
 * (server component, server action, or API GET response):
 *   - a `media://` PRIVATE ref -> a short-lived SIGNED URL (the only way to read
 *     a private object; `resolveMediaUrl` THROWS on a private ref by design)
 *   - a legacy absolute URL -> passthrough unchanged (existing public-CDN rows)
 *   - anything else (empty/malformed) -> "" so a stray value never strands a render
 *
 * Never resolve a private ref on the client: a raw `<a href={ref}>` over a
 * `media://` value would be a broken link.
 */
export async function signLearnMediaUrl(value: string, ttlSeconds = 3600): Promise<string> {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  if (isMediaRef(raw)) {
    try {
      if (parseMediaRef(raw).visibility === "private") {
        return await getLearnMediaStore().signedUrl(raw, ttlSeconds);
      }
      // Defensive: a (currently unused) public ref resolves to its delivery URL.
      return resolveMediaUrl(raw);
    } catch {
      return "";
    }
  }

  // Legacy rows: absolute public URLs pass through unchanged.
  return isAbsoluteUrl(raw) ? raw : "";
}
