import { test } from "node:test";
import assert from "node:assert/strict";

import { supportThreadHref } from "../inbox-href";

test("support rows deep-link to the specific thread, not the division root", () => {
  assert.equal(supportThreadHref("abc-123"), "/support/abc-123");
});

test("supportThreadHref is not the bare division root", () => {
  assert.notEqual(supportThreadHref("abc-123"), "/support");
});
