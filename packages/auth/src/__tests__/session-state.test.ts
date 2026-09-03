/**
 * readSessionStateCookie — defense-in-depth cookie reader.
 *
 * Tests the parser against typical document.cookie shapes:
 *   - empty
 *   - single value
 *   - mixed with other cookies
 *   - URL-encoded value (defensive — the writer doesn't encode but
 *     other actors might)
 *   - unknown value (defense-in-depth)
 */

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { readSessionStateCookie } from "../client/session-state";

declare const __resetAuthTestState: () => void;

beforeEach(() => {
  __resetAuthTestState();
});

test("readSessionStateCookie: empty cookie → null", () => {
  (globalThis as { document: { cookie: string } }).document.cookie = "";
  assert.equal(readSessionStateCookie(), null);
});

test("readSessionStateCookie: reads signed-in", () => {
  (globalThis as { document: { cookie: string } }).document.cookie =
    "hc_session_state=signed-in";
  assert.equal(readSessionStateCookie(), "signed-in");
});

test("readSessionStateCookie: reads signed-in-stale", () => {
  (globalThis as { document: { cookie: string } }).document.cookie =
    "hc_session_state=signed-in-stale";
  assert.equal(readSessionStateCookie(), "signed-in-stale");
});

test("readSessionStateCookie: reads signed-out", () => {
  (globalThis as { document: { cookie: string } }).document.cookie =
    "hc_session_state=signed-out";
  assert.equal(readSessionStateCookie(), "signed-out");
});

test("readSessionStateCookie: reads reauth-required", () => {
  (globalThis as { document: { cookie: string } }).document.cookie =
    "hc_session_state=reauth-required";
  assert.equal(readSessionStateCookie(), "reauth-required");
});

test("readSessionStateCookie: ignores unknown value (defense-in-depth)", () => {
  (globalThis as { document: { cookie: string } }).document.cookie =
    "hc_session_state=evil-value";
  assert.equal(readSessionStateCookie(), null);
});

test("readSessionStateCookie: parses among multiple cookies", () => {
  (globalThis as { document: { cookie: string } }).document.cookie =
    "foo=bar; hc_session_state=reauth-required; baz=qux";
  assert.equal(readSessionStateCookie(), "reauth-required");
});

test("readSessionStateCookie: ignores cookies with the wrong name", () => {
  (globalThis as { document: { cookie: string } }).document.cookie =
    "hc_session_state_other=signed-in";
  assert.equal(readSessionStateCookie(), null);
});

test("readSessionStateCookie: trims surrounding whitespace", () => {
  (globalThis as { document: { cookie: string } }).document.cookie =
    "  hc_session_state=signed-in  ;  other=x";
  assert.equal(readSessionStateCookie(), "signed-in");
});
