import { test } from "node:test";
import assert from "node:assert/strict";

import type { AbandonedTask } from "@henryco/data/abandoned-tasks-core";
import { buildDivisionResumeModel, buildResumeModel, withResumeSource } from "./resume";

function task(over: Partial<AbandonedTask>): AbandonedTask {
  return {
    id: over.id ?? "t1",
    userId: "u1",
    taskType: over.taskType ?? "booking",
    taskRef: over.taskRef ?? "care:b1",
    division: over.division ?? "care",
    continueUrl: over.continueUrl ?? "/care/bookings/b1",
    state: over.state ?? {},
    lastProgressAt: over.lastProgressAt ?? "2026-07-08T10:00:00Z",
    reminderCount: 0,
    lastReminderAt: null,
    status: over.status ?? "pending",
    createdAt: "2026-07-08T09:00:00Z",
    updatedAt: "2026-07-08T10:00:00Z",
  };
}

test("no pending tasks → null (the widget stays honestly calm)", () => {
  assert.equal(buildResumeModel([]), null);
  assert.equal(buildResumeModel([task({ status: "recovered" })]), null);
  assert.equal(buildResumeModel([task({ continueUrl: "" })]), null);
});

test("one task deep-links straight into the journey with attribution", () => {
  const m = buildResumeModel([task({ state: { title: "Care booking #B12" } })]);
  assert.ok(m);
  assert.equal(m.count, 1);
  assert.equal(m.headline, "Pick up Care booking #B12");
  assert.equal(m.href, "/care/bookings/b1?utm_source=henryco_resume&utm_campaign=dashboard_widget");
});

test("untitled tasks fall back to a calm task-type headline", () => {
  const m = buildResumeModel([task({ taskType: "kyc", state: {} })]);
  assert.ok(m);
  assert.equal(m.headline, "Finish your verification");
});

test("several tasks carry the real count and route to /continue", () => {
  const m = buildResumeModel([
    task({ id: "a", lastProgressAt: "2026-07-08T10:00:00Z" }),
    task({ id: "b", taskRef: "care:b2", lastProgressAt: "2026-07-09T10:00:00Z" }),
    task({ id: "c", taskRef: "care:b3", lastProgressAt: "2026-07-07T10:00:00Z" }),
  ]);
  assert.ok(m);
  assert.equal(m.count, 3);
  assert.equal(m.headline, "You have 3 things to finish");
  assert.ok(m.href.startsWith("/continue?utm_source=henryco_resume"));
  assert.equal(m.task.id, "b"); // freshest leads
});

test("division model scopes to the division only", () => {
  const tasks = [
    task({ id: "a", division: "care" }),
    task({ id: "b", division: "marketplace", taskRef: "m:1" }),
  ];
  const care = buildDivisionResumeModel(tasks, "care");
  assert.ok(care);
  assert.equal(care.count, 1);
  assert.ok(care.href.includes("utm_campaign=division_care"));
  assert.equal(buildDivisionResumeModel(tasks, "jobs"), null);
});

test("withResumeSource respects existing query strings", () => {
  assert.equal(
    withResumeSource("/x?a=1", "s"),
    "/x?a=1&utm_source=henryco_resume&utm_campaign=s",
  );
});
