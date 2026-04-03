import { NextResponse } from "next/server";
import { getAuthenticatedProfile } from "@/lib/auth/server";
import { normalizeRole } from "@/lib/auth/roles";
import { uploadCareImage, uploadCareVideo } from "@/lib/cloudinary";

export const runtime = "nodejs";

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function sanitizeFolder(value: string) {
  return cleanText(value)
    .replace(/[^a-z0-9/_-]+/gi, "-")
    .replace(/\/{2,}/g, "/")
    .replace(/^\/|\/$/g, "");
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedProfile();
  if (!auth?.user || normalizeRole(auth.profile.role) !== "owner") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = sanitizeFolder(cleanText(formData.get("folder")) || "brand");
    const publicIdPrefix = cleanText(formData.get("public_id_prefix")) || "care";
    const assetKind = cleanText(formData.get("asset_kind")).toLowerCase() || "image";

    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json(
        { ok: false, error: "Please choose a media file before uploading." },
        { status: 400 }
      );
    }

    const uploaded =
      assetKind === "video"
        ? await uploadCareVideo(file, {
            folderSuffix: folder,
            publicIdPrefix,
          })
        : await uploadCareImage(file, {
            folderSuffix: folder,
            publicIdPrefix,
          });

    return NextResponse.json({
      ok: true,
      secureUrl: uploaded.secureUrl,
      publicId: uploaded.publicId,
      assetKind,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Media upload failed.",
      },
      { status: 400 }
    );
  }
}
