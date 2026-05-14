"use client";

import { PODCapture } from "@/components/operator/PODCapture";

/**
 * V3 PASS 21 — client wrapper that supplies the uploadPhoto handler.
 *
 * For now we POST the file as `multipart/form-data` to the Cloudinary
 * direct-upload endpoint via a signed payload from
 * /api/cloudinary/sign — that endpoint is part of the shared
 * cloudinary integration. If the endpoint is missing (preview env or
 * misconfigured), we fall back to a data-URL upload which the POD
 * route still records as evidence; not ideal but safer than blocking
 * the rider's flow.
 */

async function uploadPhoto(
  file: Blob,
): Promise<{ secure_url: string; public_id: string } | null> {
  try {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", "logistics-pod");
    const signResponse = await fetch("/api/cloudinary/sign?preset=logistics-pod", {
      method: "POST",
    });
    if (!signResponse.ok) {
      console.warn(
        "[pod-capture] sign endpoint missing — falling back to data URL",
      );
      return null;
    }
    const signed = (await signResponse.json()) as {
      signature?: string;
      timestamp?: string;
      api_key?: string;
      cloud_name?: string;
    };
    if (!signed.signature || !signed.api_key || !signed.cloud_name) {
      return null;
    }
    form.append("signature", signed.signature);
    form.append("timestamp", signed.timestamp ?? "");
    form.append("api_key", signed.api_key);
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${signed.cloud_name}/image/upload`,
      { method: "POST", body: form },
    );
    if (!uploadResponse.ok) return null;
    const data = (await uploadResponse.json()) as {
      secure_url?: string;
      public_id?: string;
    };
    if (!data.secure_url || !data.public_id) return null;
    return { secure_url: data.secure_url, public_id: data.public_id };
  } catch (err) {
    console.warn("[pod-capture] upload failed", err);
    return null;
  }
}

export type PODCaptureClientProps = {
  shipmentId: string;
  legId?: string | null;
};

export function PODCaptureClient({ shipmentId, legId }: PODCaptureClientProps) {
  return <PODCapture shipmentId={shipmentId} legId={legId} uploadPhoto={uploadPhoto} />;
}
