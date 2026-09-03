import {
  getRecoveryCopy,
  type RecoveryCopy,
  type RecoveryTaskTypeKey,
} from "@henryco/i18n/server";
import { formatAccountTemplate } from "@henryco/i18n";
import { createDataAdminClient } from "@henryco/data";
import {
  listUserAbandonedTasks,
  type AbandonedTask,
} from "@henryco/data/abandoned-tasks";

import { requireAccountUser } from "@/lib/auth";
import { getAccountAppLocale } from "@/lib/locale-server";

import { ContinueList, type ContinueItem } from "./ContinueList";
import "./continue.css";

export const dynamic = "force-dynamic";

function titleFor(task: AbandonedTask, copy: RecoveryCopy): string {
  const stateTitle = task.state?.title;
  if (typeof stateTitle === "string" && stateTitle.trim()) return stateTitle.trim();
  return copy.taskTypes[task.taskType as RecoveryTaskTypeKey].label;
}

function toItem(task: AbandonedTask, copy: RecoveryCopy): ContinueItem {
  return {
    id: task.id,
    title: titleFor(task, copy),
    label: copy.taskTypes[task.taskType as RecoveryTaskTypeKey].label,
    href: task.continueUrl,
    savedAt: new Date(task.lastProgressAt).getTime(),
  };
}

export default async function ContinuePage() {
  const [locale, user] = await Promise.all([
    getAccountAppLocale(),
    requireAccountUser(),
  ]);
  const copy = getRecoveryCopy(locale);

  const admin = createDataAdminClient();
  const tasks = await listUserAbandonedTasks(admin, user.id, {
    statuses: ["pending"],
    limit: 50,
  });
  const items = tasks.map((task) => toItem(task, copy));

  return (
    <main className="acct-continue" aria-label={copy.page.title}>
      <header className="acct-continue__head">
        <p className="acct-continue__kicker">{copy.home.panelTitle}</p>
        <h1 className="acct-continue__title">{copy.page.title}</h1>
        <p className="acct-continue__sub">{copy.page.subtitle}</p>
        {items.length > 0 ? (
          <p className="acct-continue__count">
            {items.length === 1
              ? copy.page.countOne
              : formatAccountTemplate(copy.page.countMany, { n: items.length })}
          </p>
        ) : null}
      </header>

      {items.length === 0 ? (
        <p className="acct-continue__empty">{copy.page.empty}</p>
      ) : (
        <ContinueList
          items={items}
          copy={{
            continueButton: copy.page.continueButton,
            dismissAria: copy.page.dismissAria,
            ago: copy.ago,
          }}
        />
      )}
    </main>
  );
}
