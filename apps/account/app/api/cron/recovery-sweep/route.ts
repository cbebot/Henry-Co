/**
 * V3-37 — Abandoned-journey recovery cadence sweep.
 *
 * Walks pending `abandoned_tasks` and applies the day-1/3/7/14 cadence
 * (planRecoveryDispatch): expire idle-past-window tasks, then dispatch the next
 * reminder for each due task. The IN-APP channel is self-contained
 * (publishNotification — which enforces the user's per-event mute/opt-out). The
 * EMAIL + PUSH channels are emitted as dispatch INTENTS (telemetry) behind a
 * flag — V3-45/V3-48 implement the real multi-channel send.
 *
 * Idempotent within a day: the planner's min-gap guard prevents a second
 * reminder landing in the same window, so re-running is safe.
 *
 * Kill switch: RECOVERY_CADENCE_ENABLED="false" disables the sweep entirely.
 */
import { NextResponse } from "next/server";
import { planRecoveryDispatch } from "@henryco/lifecycle/recovery";
import {
  bumpAbandonedTaskReminder,
  expireStaleAbandonedTasks,
  listPendingAbandonedTasks,
} from "@henryco/data/abandoned-tasks";
import { publishNotification } from "@henryco/notifications";
import { emitEvent } from "@henryco/observability/events";
import {
  getRecoveryCopy,
  type RecoveryTaskTypeKey,
} from "@henryco/i18n/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;
const EXPIRE_IDLE_MS = 14 * DAY;

function isAuthorized(request: Request) {
  const expected = String(process.env.CRON_SECRET || "").trim();
  if (!expected) return false;
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (String(process.env.RECOVERY_CADENCE_ENABLED || "").trim() === "false") {
    return NextResponse.json({ ok: true, skipped: "cadence disabled" });
  }

  const emailEnabled = String(process.env.RECOVERY_EMAIL_ENABLED || "").trim() === "true";
  const copy = getRecoveryCopy("en");
  const summary = {
    expired: 0,
    in_app_sent: 0,
    email_intents: 0,
    push_intents: 0,
    errors: [] as string[],
  };

  // 1) Expire idle-past-window tasks (bulk).
  try {
    summary.expired = await expireStaleAbandonedTasks(EXPIRE_IDLE_MS);
    if (summary.expired > 0) {
      emitEvent({
        name: "henry.task.expired",
        classification: "system_state",
        outcome: "completed",
        payload: { count: summary.expired },
      });
    }
  } catch (error) {
    summary.errors.push(`expire: ${error instanceof Error ? error.message : "unknown"}`);
  }

  // 2) Dispatch the next reminder for each due pending task.
  let pending: Awaited<ReturnType<typeof listPendingAbandonedTasks>> = [];
  try {
    pending = await listPendingAbandonedTasks({ idleMs: 1 * DAY, limit: 300 });
  } catch (error) {
    summary.errors.push(`list: ${error instanceof Error ? error.message : "unknown"}`);
  }

  const now = Date.now();
  for (const task of pending) {
    if (!task.userId) continue;
    const plan = planRecoveryDispatch({
      now,
      lastProgressAt: new Date(task.lastProgressAt).getTime(),
      reminderCount: task.reminderCount,
      lastReminderAt: task.lastReminderAt ? new Date(task.lastReminderAt).getTime() : null,
      // In-app + email are non-intrusive/async; push is intent-only this pass.
      prefs: { quietHours: false },
    });
    if (plan.action !== "dispatch") continue;

    const kind = copy.taskTypes[task.taskType as RecoveryTaskTypeKey];
    try {
      if (plan.channels.includes("in_app")) {
        // publishNotification enforces the user's per-event mute/opt-out.
        await publishNotification({
          userId: task.userId,
          division: "account",
          eventType: "account.recovery.reminder",
          severity: "info",
          title: kind.reminderTitle,
          body: kind.reminderBody,
          deepLink: "/continue",
          actionLabel: copy.nudge.action,
          relatedType: "abandoned_task",
          relatedId: task.id,
          publisher: "cron:apps/account/app/api/cron/recovery-sweep",
        });
        summary.in_app_sent += 1;
      }
      // EMAIL + PUSH: dispatch intents only (real multi-channel send → V3-45/48).
      if (plan.channels.includes("email")) {
        summary.email_intents += 1;
        // TODO(V3-48): when emailEnabled, send the branded localized recovery
        // email via @henryco/email. Until then this is a dispatch intent only.
        void emailEnabled;
      }
      if (plan.channels.includes("push")) {
        summary.push_intents += 1;
      }

      await bumpAbandonedTaskReminder(task.id, task.reminderCount);
      emitEvent({
        name: "henry.task.recovery_sent",
        classification: "system_state",
        outcome: "completed",
        actorId: task.userId,
        payload: {
          task_type: task.taskType,
          channels: plan.channels,
          reminder_step: task.reminderCount,
          with_offer: plan.withOffer,
        },
      });
    } catch (error) {
      summary.errors.push(
        `dispatch ${task.id}: ${error instanceof Error ? error.message : "unknown"}`,
      );
    }
  }

  return NextResponse.json({
    ok: summary.errors.length === 0,
    summary,
    executedAt: new Date().toISOString(),
  });
}
