"use client";

import { PODCapture } from "@/components/operator/PODCapture";

/**
 * V3 PASS 21 — client wrapper that supplies the uploadPhoto handler.
 *
 * The captured POD image is POSTed as `multipart/form-data` to the server
 * route /api/logistics/pod/upload, which writes it to an RLS-private storage
 * bucket (signed-read only) and returns a backend-neutral `media://` reference.
 * The binary never touches a public CDN — sensitive proof-of-delivery media is
 * no longer dereferenceable by raw URL. The returned reference is persisted by
 * the POD route in the same `photo_url` slot the public URL previously used.
 *
 * The `{ secure_url, public_id }` shape is preserved so the <PODCapture/>
 * contract is unchanged; `secure_url` now carries the `media://` reference and
 * `public_id` is unused.
 */

function makeUploadPhoto(shipmentId: string) {
  return async function uploadPhoto(
    file: Blob,
  ): Promise<{ secure_url: string; public_id: string } | null> {
    try {
      const form = new FormData();
      const named =
        file instanceof File ? file : new File([file], "pod.jpg", { type: file.type || "image/jpeg" });
      form.append("file", named);
      form.append("shipment_id", shipmentId);
      const response = await fetch("/api/logistics/pod/upload", {
        method: "POST",
        body: form,
      });
      if (!response.ok) {
        console.warn("[pod-capture] upload route returned", response.status);
        return null;
      }
      const data = (await response.json()) as { ok?: boolean; ref?: string };
      if (!data.ok || !data.ref) return null;
      return { secure_url: data.ref, public_id: "" };
    } catch (err) {
      console.warn("[pod-capture] upload failed", err);
      return null;
    }
  };
}

export type PODCaptureClientProps = {
  shipmentId: string;
  legId?: string | null;
};

export function PODCaptureClient({ shipmentId, legId }: PODCaptureClientProps) {
  return (
    <PODCapture
      shipmentId={shipmentId}
      legId={legId}
      uploadPhoto={makeUploadPhoto(shipmentId)}
    />
  );
}
