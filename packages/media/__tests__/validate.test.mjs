import { test } from "node:test";
import assert from "node:assert/strict";

import { validateUpload, MediaValidationError } from "../src/validate.ts";

function makeFile(bytes, type, name = "x.bin") {
  return new File([new Uint8Array(bytes)], name, { type });
}

test("rejects empty / non-file", () => {
  assert.throws(() => validateUpload(makeFile(0, "image/jpeg")), MediaValidationError);
  // @ts-expect-error not a File
  assert.throws(() => validateUpload(null), MediaValidationError);
});

test("rejects oversize with a friendly MB message", () => {
  assert.throws(
    () => validateUpload(makeFile(10, "image/jpeg"), { maxBytes: 5 }),
    /under 0 MB|under 1 MB|MB/,
  );
});

test("rejects disallowed MIME type", () => {
  assert.throws(
    () =>
      validateUpload(makeFile(10, "application/x-msdownload"), {
        allowedTypes: ["image/jpeg", "image/png", "image/webp"],
        invalidTypeMessage: "Images only.",
      }),
    /Images only\./,
  );
});

test("accepts a valid file", () => {
  assert.doesNotThrow(() =>
    validateUpload(makeFile(1024, "image/jpeg"), {
      maxBytes: 5 * 1024 * 1024,
      allowedTypes: ["image/jpeg"],
    }),
  );
});
