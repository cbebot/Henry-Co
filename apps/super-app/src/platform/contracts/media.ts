export type CloudinaryTransform = {
  width?: number;
  height?: number;
  crop?: "fill" | "fit" | "thumb" | "scale";
  quality?: "auto" | number;
  format?: "auto" | "webp" | "jpg" | "png";
};

export type UploadResult = { ok: true; publicId: string } | { ok: false; error: string };

export type MediaAdapter = {
  buildPublicUrl(publicId: string, transforms?: CloudinaryTransform): string;
  /** No-op / mock in local when uploads disabled. */
  uploadLocalFile(_uri: string, _folder?: string): Promise<UploadResult>;
};
