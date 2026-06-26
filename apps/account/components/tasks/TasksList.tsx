import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { getAccountHeroesCopy } from "@henryco/i18n";

import { getAccountAppLocale } from "@/lib/locale-server";

import { divisionForKey, type TaskRow } from "./helpers";

type Props = {
  tasks: ReadonlyArray<TaskRow>;
  priorityLabel: (priority: TaskRow["priority"]) => string;
  blockingLabel: string;
  sourceLabel: string;
};

export async function TasksList({ tasks, priorityLabel, blockingLabel, sourceLabel }: Props) {
  const locale = await getAccountAppLocale();
  const copy = getAccountHeroesCopy(locale);
  const priorityLabelFallback: Record<TaskRow["priority"], string> = {
    urgent: copy.tasksList.priorityUrgent,
    high: copy.tasksList.priorityHigh,
    normal: copy.tasksList.priorityRoutine,
    low: copy.tasksList.priorityQuiet,
  };
  return (
    <div className="acct-tsk__list" role="list" aria-label={copy.tasksList.listLabel}>
      {tasks.map((task) => {
        const palette = divisionForKey(task.sourceDivision);
        const label = priorityLabel(task.priority) || priorityLabelFallback[task.priority];
        return (
          <Link
            key={task.id}
            href={task.deeplinkTemplate || "/"}
            className="acct-tsk__row"
            role="listitem"
            aria-label={`${task.title} · ${task.blocking ? blockingLabel : label}`}
          >
            <span
              className="acct-tsk__row-icon"
              data-priority={task.priority}
              aria-hidden
            >
              {task.blocking ? "!" : task.priority === "urgent" ? "‼" : "›"}
            </span>
            <div className="acct-tsk__row-meta">
              <span className="acct-tsk__row-title">{task.title}</span>
              {task.description ? (
                <span className="acct-tsk__row-desc">{task.description}</span>
              ) : null}
              <span className="acct-tsk__row-source">
                <span
                  className="acct-tsk__row-source-dot"
                  style={{ background: palette.color }}
                  aria-hidden
                />
                {sourceLabel}: {palette.label}
              </span>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span className="acct-tsk__chip" data-priority={task.priority}>
                {task.blocking ? blockingLabel : label}
              </span>
              <ChevronRight size={14} aria-hidden style={{ color: "var(--acct-muted)" }} />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
