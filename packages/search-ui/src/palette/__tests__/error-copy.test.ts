/**
 * humaniseError() probes — DASH-5 elevation.
 *
 * The error banner copy is the only piece of the palette's V10 error
 * path that's testable without React. Pinning these strings here
 * means a refactor can't accidentally leak raw status codes to the
 * user.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { humaniseError } from "../error-copy";

describe("humaniseError", () => {
  it("returns the calm fallback for empty/unknown input", () => {
    assert.equal(humaniseError(""), "Try again in a moment.");
    assert.equal(humaniseError("Something weird"), "Try again in a moment.");
  });

  it("classifies a network/fetch failure", () => {
    assert.equal(
      humaniseError("Failed to fetch"),
      "Check your connection, then retry.",
    );
    assert.equal(
      humaniseError("NetworkError when attempting to fetch resource."),
      "Check your connection, then retry.",
    );
  });

  it("classifies an aborted request", () => {
    assert.equal(humaniseError("AbortError: The operation was aborted."), "Cancelled. Try again.");
  });

  it("translates 401 / 403 into a session-expired hint", () => {
    assert.equal(humaniseError("commands: 401"), "Your session expired. Refresh the page.");
    assert.equal(humaniseError("commands: 403"), "Your session expired. Refresh the page.");
  });

  it("translates 429 into a rate-limit hint", () => {
    assert.equal(
      humaniseError("Search failed: 429"),
      "Too many searches — slow down a moment.",
    );
  });

  it("translates 5xx into a service-reconnecting hint", () => {
    assert.equal(humaniseError("suggestions: 500"), "Our search service is reconnecting.");
    assert.equal(humaniseError("suggestions: 503"), "Our search service is reconnecting.");
    assert.equal(humaniseError("Search failed: 504"), "Our search service is reconnecting.");
  });

  it("never leaks raw status codes back to the user", () => {
    const cases = [
      "commands: 401",
      "suggestions: 500",
      "Search failed: 429",
      "Failed to fetch",
      "AbortError",
      "Random nonsense",
    ];
    for (const c of cases) {
      const out = humaniseError(c);
      assert.ok(
        !/\d{3}/.test(out),
        `humaniseError("${c}") leaked a raw status code: ${out}`,
      );
    }
  });

  it("returns a single sentence — no exclamation marks (no shouty UI)", () => {
    const samples = [
      humaniseError(""),
      humaniseError("commands: 401"),
      humaniseError("Search failed: 429"),
      humaniseError("Failed to fetch"),
      humaniseError("AbortError"),
      humaniseError("commands: 503"),
    ];
    for (const s of samples) {
      assert.ok(!s.includes("!"), `expected no '!' in: "${s}"`);
    }
  });
});
