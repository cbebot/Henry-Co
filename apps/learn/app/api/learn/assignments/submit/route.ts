/**
 * POST /api/learn/assignments/submit
 *
 * Persist a learner's assignment submission (file URL + free-text).
 * Accepts JSON with an optional Cloudinary file URL (uploaded client-side
 * via the unsigned-upload widget). Multipart form-data with a `file` field
 * is also supported and uploaded via the @/lib/learn/uploads helper.
 */

import { NextResponse } from "next/server";
import { createId, upsertLearnRecord } from "@/lib/learn/store";
import { getLearnViewer } from "@/lib/learn/auth";
import { getLearnSnapshot } from "@/lib/learn/data";
import { uploadAssignmentSubmissionFile } from "@/lib/learn/uploads";

export const runtime = "nodejs";
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function POST(request: Request) {
  const viewer = await getLearnViewer();
  if (!viewer.user) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  const contentType = String(request.headers.get("content-type") || "").toLowerCase();
  let assignmentId = "";
  let courseId = "";
  let submissionText = "";
  let fileUrl: string | null = null;
  let fileLabel: string | null = null;
  let fileSize: number | null = null;
  let fileMimeType: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    assignmentId = String(formData.get("assignmentId") || "");
    courseId = String(formData.get("courseId") || "");
    submissionText = String(formData.get("submissionText") || "");
    const file = formData.get("file");
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ ok: false, error: "file_too_large" }, { status: 413 });
      }
      try {
        const uploaded = await uploadAssignmentSubmissionFile(file, {
          folderSuffix: `assignments/${assignmentId}`,
          publicIdPrefix: "assignment",
        });
        fileUrl = uploaded.secureUrl;
        fileLabel = uploaded.name;
        fileSize = uploaded.size;
        fileMimeType = uploaded.mimeType;
      } catch (error) {
        return NextResponse.json(
          { ok: false, error: "upload_failed", detail: String(error) },
          { status: 502 },
        );
      }
    }
  } else {
    let payload: {
      assignmentId?: string;
      courseId?: string;
      submissionText?: string;
      fileUrl?: string;
      fileLabel?: string;
      fileSizeBytes?: number;
      fileMimeType?: string;
    };
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
    }
    assignmentId = String(payload?.assignmentId || "");
    courseId = String(payload?.courseId || "");
    submissionText = String(payload?.submissionText || "");
    fileUrl = payload?.fileUrl || null;
    fileLabel = payload?.fileLabel || null;
    fileSize = payload?.fileSizeBytes ?? null;
    fileMimeType = payload?.fileMimeType ?? null;
  }

  if (!assignmentId) {
    return NextResponse.json({ ok: false, error: "missing_assignment" }, { status: 400 });
  }
  if (!submissionText.trim() && !fileUrl) {
    return NextResponse.json({ ok: false, error: "empty_submission" }, { status: 400 });
  }

  const snapshot = await getLearnSnapshot();
  const enrollment = courseId
    ? snapshot.enrollments.find(
        (item) =>
          item.courseId === courseId &&
          ((viewer.user?.id && item.userId === viewer.user.id) ||
            (viewer.normalizedEmail && item.normalizedEmail === viewer.normalizedEmail)),
      )
    : null;

  const id = createId();
  await upsertLearnRecord(
    "learn_assignment_submissions",
    {
      id,
      assignment_id: assignmentId,
      enrollment_id: enrollment?.id ?? null,
      user_id: viewer.user.id,
      normalized_email: viewer.normalizedEmail,
      submission_text: submissionText,
      file_url: fileUrl,
      file_label: fileLabel,
      file_size_bytes: fileSize,
      file_mime_type: fileMimeType,
      status: "submitted",
    },
    {
      userId: viewer.user.id,
      email: viewer.normalizedEmail,
      role: "learner",
    },
  );

  return NextResponse.json({ ok: true, id });
}
