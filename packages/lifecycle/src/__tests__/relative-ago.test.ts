/**
 * formatRelativeAgo — bucket-by-bucket coverage for the i18n-driven
 * relative-time helper.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  formatRelativeAgo,
  type RelativeAgoCopy,
} from "../drafts/relative-ago";

const COPY: RelativeAgoCopy = {
  agoMinutes: "{n} min ago",
  agoHours: "{n} hr ago",
  agoDays: "{n} day ago",
};

const NOW = 1_700_000_000_000;

test("formatRelativeAgo: under 1 minute clamps to '1 min ago'", () => {
  assert.equal(formatRelativeAgo(NOW - 30_000, COPY, NOW), "1 min ago");
});

test("formatRelativeAgo: 1 minute exactly", () => {
  assert.equal(formatRelativeAgo(NOW - 60_000, COPY, NOW), "1 min ago");
});

test("formatRelativeAgo: 30 minutes", () => {
  assert.equal(formatRelativeAgo(NOW - 30 * 60_000, COPY, NOW), "30 min ago");
});

test("formatRelativeAgo: 59 minutes still uses minutes", () => {
  assert.equal(formatRelativeAgo(NOW - 59 * 60_000, COPY, NOW), "59 min ago");
});

test("formatRelativeAgo: 60 minutes flips to hours", () => {
  assert.equal(formatRelativeAgo(NOW - 60 * 60_000, COPY, NOW), "1 hr ago");
});

test("formatRelativeAgo: 5 hours", () => {
  assert.equal(formatRelativeAgo(NOW - 5 * 60 * 60_000, COPY, NOW), "5 hr ago");
});

test("formatRelativeAgo: 23 hours still uses hours", () => {
  assert.equal(formatRelativeAgo(NOW - 23 * 60 * 60_000, COPY, NOW), "23 hr ago");
});

test("formatRelativeAgo: 24 hours flips to days", () => {
  assert.equal(formatRelativeAgo(NOW - 24 * 60 * 60_000, COPY, NOW), "1 day ago");
});

test("formatRelativeAgo: 7 days", () => {
  assert.equal(formatRelativeAgo(NOW - 7 * 24 * 60 * 60_000, COPY, NOW), "7 day ago");
});

test("formatRelativeAgo: future timestamp clamps to 1 min ago", () => {
  assert.equal(formatRelativeAgo(NOW + 60_000, COPY, NOW), "1 min ago");
});

test("formatRelativeAgo: respects custom locale templates", () => {
  const fr: RelativeAgoCopy = {
    agoMinutes: "il y a {n} min",
    agoHours: "il y a {n} h",
    agoDays: "il y a {n} j",
  };
  assert.equal(formatRelativeAgo(NOW - 5 * 60_000, fr, NOW), "il y a 5 min");
  assert.equal(formatRelativeAgo(NOW - 3 * 60 * 60_000, fr, NOW), "il y a 3 h");
  assert.equal(formatRelativeAgo(NOW - 2 * 24 * 60 * 60_000, fr, NOW), "il y a 2 j");
});
