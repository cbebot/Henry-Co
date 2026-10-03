import { test } from "node:test";
import assert from "node:assert/strict";

import { sanitizeFileName, buildObjectKey } from "../src/key.ts";

test("sanitizeFileName lowercases and path-safes, keeps extension", () => {
  assert.equal(sanitizeFileName("My Photo (1).JPG"), "my-photo-1.jpg");
  assert.equal(sanitizeFileName("..weird..name..png"), "weird-name.png");
  assert.equal(sanitizeFileName(""), "asset");
  assert.equal(sanitizeFileName("noext"), "noext");
});

test("buildObjectKey joins prefix + id + sanitized name", () => {
  assert.equal(
    buildObjectKey({ pathPrefix: "listings/abc", fileName: "Hero.png", id: "abcd1234efgh" }),
    "listings/abc/abcd1234efgh-hero.png",
  );
  assert.equal(buildObjectKey({ fileName: "x.jpg", id: "id1" }), "id1-x.jpg");
});

test("buildObjectKey trims stray slashes in prefix", () => {
  assert.equal(
    buildObjectKey({ pathPrefix: "/listings/abc/", fileName: "p.webp", id: "zz" }),
    "listings/abc/zz-p.webp",
  );
});

// The storage client puts the key into its request URL as-is
// (`${url}/object/${bucket}/${key}`), so the URL parser decides where the
// object lands. These cases pin that a prefix can never move it.

const ID = "abcd1234efgh";
const LEAF = `${ID}-receipt.pdf`;
const UUID = "11111111-1111-4111-8111-111111111111";
const BASE = "http://storage.test/storage/v1/object/care-documents/";

const keyFor = (pathPrefix) => buildObjectKey({ pathPrefix, fileName: "receipt.pdf", id: ID });
const segmentsOf = (key) => key.split("/").slice(0, -1);

const HOSTILE_PREFIXES = [
  "payment-receipts/../../X",
  "payment-receipts/../../%63%61%72%65%2D%6D%65%64%69%61/EVIL.PDF?",
  "payment-receipts/A/../../../B",
  "payment-receipts/../../%63%61%72%65%2D%6D%65%64%69%61/EVIL.PDF#FRAG",
  "payment-receipts/%2E%2E/%2E%2E/%63%61%72%65%2D%6D%65%64%69%61/EVIL.PDF?",
  "payment-receipts/%2e%2e/%2e%2e/X",
  "payment-receipts/.%2e/%2e./X",
  "payment-receipts/%2e/%2E/X",
  "payment-receipts/..\\..\\X",
  "payment-receipts/\\..\\../X",
  "payment-receipts/.\t./.\n./.\r./X",
  "payment-receipts/./././X",
  "payment-receipts/.../..../X",
  "payment-receipts/ .. / . /X",
  "payment-receipts/x?y=1",
  "payment-receipts/x#y",
  "payment-receipts/%00/%2F/X",
  "payment-receipts/\u0000/\u007f/X",
  "payment-receipts/ТРК/．．/日本/é",
  "../../../../etc",
  "..",
  "/../",
  "?",
  "#",
  "%2e%2e",
];

test("buildObjectKey leaves legitimate prefixes unchanged", () => {
  for (const prefix of [
    "listings/abc",
    "payment-receipts/TRK-ABC123",
    `claims/${UUID}`,
    "expenses/fuel-TRK-12AB",
    `candidates/${UUID}/cv`,
    "claims/claim-11111111",
    `support/${UUID}`,
    `seller-cac/${UUID}`,
    "documents/listing-1",
  ]) {
    assert.equal(keyFor(prefix), `${prefix}/${LEAF}`);
  }
});

test("buildObjectKey keeps the case of prefix segments", () => {
  assert.equal(keyFor("payment-receipts/TRK-ABC123"), `payment-receipts/TRK-ABC123/${LEAF}`);
  assert.equal(keyFor("Mixed/Case.Name"), `Mixed/Case.Name/${LEAF}`);
});

test("buildObjectKey drops empty and whitespace-only prefix segments", () => {
  assert.equal(keyFor("listings//abc"), `listings/abc/${LEAF}`);
  assert.equal(keyFor(" listings / abc "), `listings/abc/${LEAF}`);
  assert.equal(keyFor("/"), LEAF);
  assert.equal(keyFor("  /  / "), LEAF);
  assert.equal(keyFor(""), LEAF);
  assert.equal(keyFor(undefined), LEAF);
});

test("buildObjectKey neutralises `..` traversal in a prefix", () => {
  const key = keyFor("payment-receipts/../../X");
  assert.equal(key, `payment-receipts/-/-/X/${LEAF}`);
  assert.ok(key.startsWith("payment-receipts/"));
  assert.ok(!key.split("/").includes(".."));
  assert.equal(keyFor("payment-receipts/A/../../../B"), `payment-receipts/A/-/-/-/B/${LEAF}`);
});

test("buildObjectKey replaces dot-only segments", () => {
  for (const dots of [".", "..", "...", "...."]) {
    assert.equal(keyFor(`payment-receipts/${dots}/X`), `payment-receipts/-/X/${LEAF}`);
  }
  assert.equal(keyFor("payment-receipts/ .. /X"), `payment-receipts/-/X/${LEAF}`);
});

test("buildObjectKey removes percent-encoded dot segments", () => {
  for (const form of ["%2e%2e", "%2E%2E", ".%2e", "%2e.", "%2e", "%2E"]) {
    const key = keyFor(`payment-receipts/${form}/${form}/X`);
    assert.ok(!key.includes("%"), `${form} -> ${key}`);
    assert.ok(key.startsWith("payment-receipts/"), `${form} -> ${key}`);
  }
  assert.equal(keyFor("payment-receipts/%2e%2e/X"), `payment-receipts/-2e-2e/X/${LEAF}`);
});

test("buildObjectKey keeps `?` and `#` out of the key", () => {
  for (const prefix of [
    "payment-receipts/../../EVIL.PDF?",
    "payment-receipts/EVIL.PDF#FRAG",
    "payment-receipts/x?y=1#z",
    "?",
    "#",
  ]) {
    const key = keyFor(prefix);
    assert.ok(!key.includes("?"), `${prefix} -> ${key}`);
    assert.ok(!key.includes("#"), `${prefix} -> ${key}`);
    assert.ok(key.endsWith(`/${LEAF}`), `${prefix} -> ${key}`);
  }
});

test("buildObjectKey replaces backslash, control, whitespace and non-ASCII characters", () => {
  assert.equal(keyFor("payment-receipts/..\\..\\X"), `payment-receipts/..-..-X/${LEAF}`);
  assert.equal(keyFor("payment-receipts/.\t./X"), `payment-receipts/.-./X/${LEAF}`);
  assert.equal(keyFor("payment-receipts/.\n./X"), `payment-receipts/.-./X/${LEAF}`);
  assert.equal(keyFor("payment-receipts/TRK ABC/X"), `payment-receipts/TRK-ABC/X/${LEAF}`);
  assert.equal(keyFor("payment-receipts/é/X"), `payment-receipts/-/X/${LEAF}`);
  const key = keyFor("payment-receipts/ТРК/．．/日本/\u0000\u007f");
  assert.match(key, /^[A-Za-z0-9._/-]+$/);
  assert.ok(key.startsWith("payment-receipts/"));
});

test("buildObjectKey prefix segments are always plain storage names", () => {
  for (const prefix of HOSTILE_PREFIXES) {
    for (const segment of segmentsOf(keyFor(prefix))) {
      assert.match(segment, /^[A-Za-z0-9._-]+$/, `${JSON.stringify(prefix)} -> ${segment}`);
      assert.doesNotMatch(segment, /^\.+$/, `${JSON.stringify(prefix)} -> ${segment}`);
    }
  }
});

test("buildObjectKey keeps the leaf exactly as before", () => {
  assert.equal(
    buildObjectKey({ pathPrefix: "../..", fileName: "../../Evil?.PDF", id: "../ab#cd?ef" }),
    "-/-/abcdef-evil.pdf",
  );
  assert.equal(buildObjectKey({ pathPrefix: "a", fileName: "x.jpg", id: "" }), "a/0-x.jpg");
  assert.equal(
    buildObjectKey({ pathPrefix: "a", fileName: "x.jpg", id: "ABCD1234-EFGH-5678" }),
    "a/ABCD1234-EFG-x.jpg",
  );
});

test("a hostile prefix survives the storage URL round-trip inside its bucket", () => {
  for (const prefix of HOSTILE_PREFIXES) {
    const key = keyFor(prefix);
    const url = new URL(BASE + key);
    const label = `${JSON.stringify(prefix)} -> ${url.href}`;
    assert.ok(url.pathname.startsWith("/storage/v1/object/care-documents/"), label);
    assert.ok(url.pathname.endsWith(`/${LEAF}`), label);
    assert.equal(url.search, "", label);
    assert.equal(url.hash, "", label);
    // The parser leaves the key untouched, so the object lands at the key the
    // `media://` ref records.
    assert.equal(url.pathname, `/storage/v1/object/care-documents/${key}`, label);
    if (prefix.startsWith("payment-receipts/")) {
      assert.ok(url.pathname.startsWith("/storage/v1/object/care-documents/payment-receipts/"), label);
    }
  }
});
