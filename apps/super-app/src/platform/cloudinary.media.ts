import { buildCloudinaryUrl } from "@/core/cloudinary";
import type { CloudinaryTransform, MediaAdapter, UploadResult } from "@/platform/contracts/media";

/** Read-only delivery URLs via shared helper. */
export class CloudinaryMediaAdapter implements MediaAdapter {
  buildPublicUrl(publicId: string, transforms?: CloudinaryTransform): string {
    return buildCloudinaryUrl(publicId, transforms ?? {});
  }

  async uploadLocalFile(_uri: string, _folder?: string): Promise<UploadResult> {
    return {
      ok: false,
      error: "Upload requires signed API. Enable media upload feature and implement upload adapter.",
    };
  }
}

export class MockUploadMediaAdapter extends CloudinaryMediaAdapter {
  async uploadLocalFile(uri: string, folder?: string): Promise<UploadResult> {
    if (!uri) return { ok: false, error: "Missing file" };
    const fakeId = `${folder ?? "demo"}/mock-${Date.now()}`;
    return { ok: true, publicId: fakeId };
  }
}
