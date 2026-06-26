// OG-SOCIAL-METADATA — behavioural guard for the shared social-metadata helper.
//
// This is the regression guard that was missing: it imports the REAL helper
// (via tsx's TS loader — see the package `test` script) and asserts the actual
// returned Metadata object carries the complete Open Graph + Twitter Card set
// that Facebook / X / LinkedIn / WhatsApp need to render a link preview:
//
//   og:title, og:description, og:url (absolute https), og:type, og:site_name,
//   twitter:card = summary_large_image, twitter:title, twitter:description.
//
// The og:image itself is emitted by each app's file-convention
// `opengraph-image` / `twitter-image` route (one shared DefaultOgTemplate), so
// the helper deliberately leaves openGraph.images undefined for the default
// site-level case (avoids a duplicate og:image tag) — what the helper MUST
// guarantee is an absolute-https metadataBase (so the file-convention relative
// image resolves to an absolute https URL) and the large Twitter card.

import { test } from "node:test";
import assert from "node:assert/strict";

import { createDivisionMetadata, createSurfaceMetadata } from "../seo.ts";
import { COMPANY } from "../company.ts";
import { getSurfaceConfig, getSurfaceUrl } from "../surfaces.ts";

const DIVISION_KEYS = Object.keys(COMPANY.divisions);

/** Assert the complete required tag set on a built metadata object. */
function assertCompleteSocialSet(md, { expectHttpsUrl = true, label = "" } = {}) {
  const og = md.openGraph;
  const tw = md.twitter;
  assert.ok(og, `${label}: openGraph block present`);
  assert.ok(tw, `${label}: twitter block present`);

  // Open Graph — the six required fields.
  assert.equal(typeof og.title, "string");
  assert.ok(og.title.length > 0, `${label}: og:title non-empty`);
  assert.ok(
    typeof og.description === "string" && og.description.length > 0,
    `${label}: og:description non-empty`,
  );
  assert.equal(og.type, "website", `${label}: og:type=website`);
  assert.ok(
    typeof og.siteName === "string" && og.siteName.length > 0,
    `${label}: og:site_name non-empty`,
  );
  assert.ok(typeof og.url === "string" && og.url.length > 0, `${label}: og:url present`);
  if (expectHttpsUrl) {
    assert.match(og.url, /^https:\/\//, `${label}: og:url absolute https`);
  }

  // metadataBase must be a real absolute URL so the file-convention
  // opengraph-image route resolves to an ABSOLUTE og:image.
  assert.ok(md.metadataBase instanceof URL, `${label}: metadataBase is a URL`);
  assert.match(md.metadataBase.protocol, /^https?:$/, `${label}: metadataBase has http(s)`);

  // Twitter Card — must be the large card with title/description.
  assert.equal(tw.card, "summary_large_image", `${label}: twitter:card=summary_large_image`);
  assert.ok(
    typeof tw.title === "string" && tw.title.length > 0,
    `${label}: twitter:title non-empty`,
  );
  assert.ok(
    typeof tw.description === "string" && tw.description.length > 0,
    `${label}: twitter:description non-empty`,
  );
}

test("every division emits the complete OG + Twitter set with a LARGE card", () => {
  for (const key of DIVISION_KEYS) {
    const md = createDivisionMetadata(key, { path: "/", locale: "en" });
    assertCompleteSocialSet(md, { label: `division:${key}`, expectHttpsUrl: true });
    // og:url must point at this division's canonical origin.
    assert.ok(
      md.openGraph.url.includes(COMPANY.group.baseDomain),
      `division:${key}: og:url on base domain`,
    );
    // Default site-level case: the helper does NOT inline openGraph.images —
    // the file-convention opengraph-image route supplies the single og:image.
    assert.equal(
      md.openGraph.images,
      undefined,
      `division:${key}: default openGraph.images undefined (image via file convention)`,
    );
  }
});

test("twitter card stays LARGE even when no image option is passed (the regression)", () => {
  // This is the exact bug: a missing `images` option used to downgrade the
  // card to `summary`. It must be `summary_large_image` regardless.
  const md = createDivisionMetadata("care", { path: "/" });
  assert.equal(md.twitter.card, "summary_large_image");
});

test("per-page image override inlines og:image + twitter:image and keeps the large card", () => {
  const img = { url: "https://care.henryonyx.com/p/123/og.png", width: 1200, height: 630 };
  const md = createDivisionMetadata("care", { path: "/p/123", images: [img] });
  assert.equal(md.twitter.card, "summary_large_image");
  assert.ok(Array.isArray(md.openGraph.images) && md.openGraph.images.length === 1);
  assert.equal(md.openGraph.images[0].url, img.url);
  assert.ok(Array.isArray(md.twitter.images) && md.twitter.images.includes(img.url));
});

test("account surface emits the complete OG + Twitter set and stays noindex", () => {
  const md = createSurfaceMetadata("account", { path: "/" });
  // In the (non-production) test env the origin is localhost, so og:url is
  // http(s) but not necessarily https — assert the full set without the https
  // gate here; the prod-https behaviour is asserted in the next test.
  assertCompleteSocialSet(md, { label: "surface:account", expectHttpsUrl: false });
  assert.equal(md.openGraph.siteName, getSurfaceConfig("account").name);
  assert.deepEqual(md.robots, { index: false, follow: false }, "account is noindex");
});

test("account surface produces an ABSOLUTE https canonical in production", () => {
  const prev = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "production";
    const md = createSurfaceMetadata("account", { path: "/" });
    const origin = getSurfaceUrl("account"); // https://account.<baseDomain>
    assert.equal(md.metadataBase.origin, origin);
    assert.equal(md.openGraph.url, `${origin}/`);
    assert.match(md.openGraph.url, /^https:\/\/account\./);
    assert.equal(md.twitter.card, "summary_large_image");
  } finally {
    process.env.NODE_ENV = prev;
  }
});
