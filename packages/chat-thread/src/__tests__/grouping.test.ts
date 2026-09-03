import { test } from "node:test";
import assert from "node:assert/strict";
import { buildThreadView, GROUP_WINDOW_MS } from "../grouping";
import type { ChatThreadMessage } from "../types";

const NOW = new Date("2026-07-02T12:00:00");

const msg = (
  id: string,
  author: string,
  atIso: string,
  over: Partial<ChatThreadMessage> = {},
): ChatThreadMessage => ({
  id,
  authorId: author,
  authorRole: author === "me" ? "viewer" : "other",
  body: `body-${id}`,
  createdAt: atIso,
  ...over,
});

test("five same-sender messages within the window form one group", () => {
  const base = new Date("2026-07-02T10:00:00").getTime();
  const list = [0, 30, 60, 90, 110].map((s, i) =>
    msg(`m${i}`, "me", new Date(base + s * 1000).toISOString()),
  );
  const view = buildThreadView(list, { now: NOW });
  const groups = view.filter((v) => v.kind === "group");
  assert.equal(groups.length, 1);
  assert.equal(groups[0].kind === "group" ? groups[0].messages.length : 0, 5);
});

test("sender change breaks the group", () => {
  const view = buildThreadView(
    [msg("a", "me", "2026-07-02T10:00:00"), msg("b", "you", "2026-07-02T10:00:10")],
    { now: NOW },
  );
  assert.equal(view.filter((v) => v.kind === "group").length, 2);
});

test("gap over the window breaks; at/below the window keeps grouping", () => {
  assert.equal(GROUP_WINDOW_MS, 120_000);
  const kept = buildThreadView(
    [msg("a", "me", "2026-07-02T10:00:00"), msg("b", "me", "2026-07-02T10:01:59")],
    { now: NOW },
  );
  assert.equal(kept.filter((v) => v.kind === "group").length, 1);
  const broken = buildThreadView(
    [msg("a", "me", "2026-07-02T10:00:00"), msg("b", "me", "2026-07-02T10:02:01")],
    { now: NOW },
  );
  assert.equal(broken.filter((v) => v.kind === "group").length, 2);
});

test("day rollover emits day pills and breaks the group", () => {
  const view = buildThreadView(
    [msg("a", "me", "2026-07-01T23:59:00"), msg("b", "me", "2026-07-02T00:00:30")],
    { now: NOW },
  );
  const days = view.filter((v) => v.kind === "day");
  assert.equal(days.length, 2);
  assert.deepEqual(
    days.map((d) => (d.kind === "day" ? d.label : "?")),
    ["yesterday", "today"],
  );
  assert.equal(view.filter((v) => v.kind === "group").length, 2);
});

test("older days label as earlier", () => {
  const view = buildThreadView([msg("a", "me", "2026-06-20T10:00:00")], { now: NOW });
  const day = view.find((v) => v.kind === "day");
  assert.ok(day && day.kind === "day" && day.label === "earlier");
});

test("system messages never group together", () => {
  const view = buildThreadView(
    [
      msg("a", "sys", "2026-07-02T10:00:00", { authorRole: "system", authorId: null }),
      msg("b", "sys", "2026-07-02T10:00:05", { authorRole: "system", authorId: null }),
    ],
    { now: NOW },
  );
  assert.equal(view.filter((v) => v.kind === "group").length, 2);
});

test("role change breaks the group even with the same author id", () => {
  const view = buildThreadView(
    [
      msg("a", "u1", "2026-07-02T10:00:00", { authorRole: "viewer" }),
      msg("b", "u1", "2026-07-02T10:00:05", { authorRole: "other" }),
    ],
    { now: NOW },
  );
  assert.equal(view.filter((v) => v.kind === "group").length, 2);
});

test("unsorted input is sorted ascending; empty input returns empty view", () => {
  const view = buildThreadView(
    [msg("b", "me", "2026-07-02T10:05:00"), msg("a", "me", "2026-07-02T10:00:00")],
    { now: NOW },
  );
  const group = view.find((v) => v.kind === "group");
  assert.ok(group && group.kind === "group" && group.messages[0].id === "a");
  assert.deepEqual(buildThreadView([], { now: NOW }), []);
});

test("group keys are first-message ids and day keys are date-scoped", () => {
  const view = buildThreadView(
    [msg("a", "me", "2026-07-02T10:00:00"), msg("b", "me", "2026-07-02T10:00:30")],
    { now: NOW },
  );
  const day = view.find((v) => v.kind === "day");
  const group = view.find((v) => v.kind === "group");
  assert.ok(day && day.kind === "day" && day.key === "day-2026-7-2");
  assert.ok(group && group.kind === "group" && group.key === "a");
});
