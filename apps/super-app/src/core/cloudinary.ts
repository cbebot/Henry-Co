import { getEnv } from "@/core/env";

export type CloudinaryTransform = {
  width?: number;
  height?: number;
  crop?: "fill" | "fit" | "thumb" | "scale";
  quality?: "auto" | number;
  format?: "auto" | "webp" | "jpg" | "png";
};

/** Build a Cloudinary fetch/delivery URL for image public IDs under the HenryCo folder. */
export function buildCloudinaryUrl(
  publicId: string,
  transforms: CloudinaryTransform = {},
): string {
  const env = getEnv();
  const cloud = env.CLOUDINARY_CLOUD_NAME;
  const basePath = env.CLOUDINARY_BASE_PATH.replace(/\/$/, "");
  const segments: string[] = [];
  if (transforms.width) segments.push(`w_${transforms.width}`);
  if (transforms.height) segments.push(`h_${transforms.height}`);
  if (transforms.crop) segments.push(`c_${transforms.crop}`);
  if (transforms.quality) {
    segments.push(typeof transforms.quality === "number" ? `q_${transforms.quality}` : "q_auto");
  }
  if (transforms.format) {
    segments.push(transforms.format === "auto" ? "f_auto" : `f_${transforms.format}`);
  }
  const transform = segments.length ? `${segments.join(",")}/` : "";
  const path = publicId.includes("/") ? publicId : `${basePath}/${publicId}`;
  return `https://res.cloudinary.com/${cloud}/image/upload/${transform}${path}`;
}
