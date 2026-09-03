import { test } from "node:test";
import assert from "node:assert/strict";

import { resolveMediaUrl, MediaResolveError } from "../src/resolve.ts";

const BASE = "https://proj.supabase.co";

test("absolute URLs pass through unchanged", () => {
  const u = "https://images.unsplash.com/photo-1.jpg?auto=format&w=1600";
  assert.equal(resolveMediaUrl(u, { publicBaseUrl: BASE }), u);
});

test("empty resolves to empty", () => {
  assert.equal(resolveMediaUrl("", { publicBaseUrl: BASE }), "");
  assert.equal(resolveMediaUrl("   ", { publicBaseUrl: BASE }), "");
});

test("public ref resolves to the public object URL", () => {
  const ref = "media://public/property-media/listings/abc/uuid-photo.jpg";
  assert.equal(
    resolveMediaUrl(ref, { publicBaseUrl: BASE }),
    "https://proj.supabase.co/storage/v1/object/public/property-media/listings/abc/uuid-photo.jpg",
  );
});

test("trailing slash in base is normalized", () => {
  const ref = "media://public/property-media/a.jpg";
  assert.equal(
    resolveMediaUrl(ref, { publicBaseUrl: "https://proj.supabase.co/" }),
    "https://proj.supabase.co/storage/v1/object/public/property-media/a.jpg",
  );
});

test("key segments are URL-encoded but slashes preserved", () => {
  const ref = "media://public/property-media/listings/a b/c d.jpg";
  assert.equal(
    resolveMediaUrl(ref, { publicBaseUrl: BASE }),
    "https://proj.supabase.co/storage/v1/object/public/property-media/listings/a%20b/c%20d.jpg",
  );
});

test("private ref throws (must be signed)", () => {
  assert.throws(
    () => resolveMediaUrl("media://private/property-documents/x/y.pdf", { publicBaseUrl: BASE }),
    MediaResolveError,
  );
});

test("unrecognized bare value throws (no silent host invention)", () => {
  assert.throws(() => resolveMediaUrl("listings/x.jpg", { publicBaseUrl: BASE }), MediaResolveError);
});

test("missing base throws", () => {
  assert.throws(
    () => resolveMediaUrl("media://public/property-media/a.jpg", { publicBaseUrl: "" }),
    MediaResolveError,
  );
});
