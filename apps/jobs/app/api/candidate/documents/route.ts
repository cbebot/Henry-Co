import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getJobsViewer } from "@/lib/auth";
import { uploadCandidateAsset } from "@/lib/jobs/write";
import type { CandidateDocument } from "@/lib/jobs/types";

const VALID_KINDS = new Set(["resume", "portfolio", "certification"]);

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeCandidateDocument(
  row: Record<string, unknown>,
  fallbackKind: string
): CandidateDocument {
  const metadata = asObject(row.metadata);

  return {
    id: String(row.id || ""),
    name: String(row.name || "Candidate document"),
    kind: String(metadata.documentKind || fallbackKind || "document"),
    fileUrl: String(row.file_url || ""),
    mimeType: typeof row.mime_type === "string" ? row.mime_type : null,
    fileSize: typeof row.file_size === "number" ? row.file_size : null,
    createdAt:
      typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    metadata,
  };
}

export async function POST(request: Request) {
  try {
    const viewer = await getJobsViewer();

    if (!viewer.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const requestedKind = String(formData.get("kind") || "").trim().toLowerCase();
    const kind = VALID_KINDS.has(requestedKind) ? requestedKind : "resume";

    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json({ error: "A file is required." }, { status: 400 });
    }

    const documentRow = (await uploadCandidateAsset({
      actor: {
        userId: viewer.user.id,
        email: viewer.user.email,
        fullName: viewer.user.fullName,
        role: viewer.internalRole,
      },
      kind,
      file,
    })) as Record<string, unknown> | null;

    revalidatePath("/candidate");
    revalidatePath("/candidate/files");
    revalidatePath("/candidate/profile");

    return NextResponse.json({
      ok: true,
      message: `${file.name} uploaded successfully.`,
      document: normalizeCandidateDocument(documentRow || {}, kind),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Candidate document upload failed.",
      },
      { status: 500 }
    );
  }
}
