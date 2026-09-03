/**
 * @henryco/media — upload validation (pure, client-safe).
 *
 * Throws {@link MediaValidationError} with a user-facing message so callers can
 * surface honest upload-error states without re-deriving copy.
 */

import type { MediaValidationRule } from "./types";

export class MediaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaValidationError";
  }
}

export function validateUpload(file: File, rule: MediaValidationRule = {}): void {
  if (!(file instanceof File) || file.size <= 0) {
    throw new MediaValidationError("No file provided.");
  }
  if (rule.maxBytes && file.size > rule.maxBytes) {
    throw new MediaValidationError(
      `Please upload a file under ${Math.round(rule.maxBytes / 1024 / 1024)} MB.`,
    );
  }
  if (rule.allowedTypes && rule.allowedTypes.length > 0) {
    const type = String(file.type ?? "").toLowerCase();
    if (!rule.allowedTypes.includes(type)) {
      throw new MediaValidationError(rule.invalidTypeMessage || "Unsupported file type.");
    }
  }
}
