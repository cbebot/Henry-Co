/**
 * @henryco/media — client-safe entrypoint (no secrets, no server-only deps).
 *
 * Use this anywhere (server or client) to encode/parse `media://` references,
 * validate uploads, and resolve PUBLIC delivery URLs. For uploads and signed
 * (private) URLs, import from `@henryco/media/server`.
 */

export type {
  MediaVisibility,
  MediaRef,
  ParsedMediaRef,
  MediaStore,
  MediaUploadInput,
  MediaValidationRule,
} from "./types";

export { MEDIA_REF_SCHEME, getPublicMediaBaseUrl } from "./config";
export { isMediaRef, isAbsoluteUrl, buildMediaRef, parseMediaRef } from "./ref";
export { sanitizeFileName, buildObjectKey } from "./key";
export { validateUpload, MediaValidationError } from "./validate";
export { resolveMediaUrl, MediaResolveError, type ResolveOptions } from "./resolve";
