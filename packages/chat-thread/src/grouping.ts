import type { ChatAuthorRole, ChatThreadMessage } from "./types";

/** Consecutive messages from one sender within this window collapse into one group. */
export const GROUP_WINDOW_MS = 120_000;

export type DayLabel = "today" | "yesterday" | "earlier";

export type ThreadViewItem =
  | { kind: "day"; key: string; label: DayLabel; date: Date }
  | {
      kind: "group";
      key: string;
      authorId: string | null;
      authorName?: string;
      authorRole: ChatAuthorRole;
      messages: ChatThreadMessage[];
    };

const localDayKey = (date: Date): string =>
  `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

const dayLabelFor = (date: Date, now: Date): DayLabel => {
  const key = localDayKey(date);
  if (key === localDayKey(now)) return "today";
  if (key === localDayKey(new Date(now.getTime() - 86_400_000))) return "yesterday";
  return "earlier";
};

export type BuildThreadViewOptions = {
  groupWindowMs?: number;
  /** Reference time for today/yesterday labels. Defaults to the current time. */
  now?: Date;
};

/**
 * Pure view-model builder: sorts ascending (stable), inserts a day pill before
 * the first message of each local calendar day, and groups consecutive
 * messages from the same author within the window. System messages are always
 * single-message groups. Group key = first message id (stable for React keys).
 */
export function buildThreadView(
  messages: ChatThreadMessage[],
  options: BuildThreadViewOptions = {},
): ThreadViewItem[] {
  const windowMs = options.groupWindowMs ?? GROUP_WINDOW_MS;
  const now = options.now ?? new Date();

  const sorted = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const view: ThreadViewItem[] = [];
  let dayKey: string | null = null;
  let group: Extract<ThreadViewItem, { kind: "group" }> | null = null;
  let previousAt = 0;

  for (const message of sorted) {
    const at = new Date(message.createdAt);
    const messageDayKey = localDayKey(at);

    if (messageDayKey !== dayKey) {
      dayKey = messageDayKey;
      group = null;
      view.push({
        kind: "day",
        key: `day-${messageDayKey}`,
        label: dayLabelFor(at, now),
        date: at,
      });
    }

    const startsNewGroup =
      group === null ||
      message.authorRole === "system" ||
      group.authorRole !== message.authorRole ||
      group.authorId !== message.authorId ||
      at.getTime() - previousAt > windowMs;

    if (startsNewGroup) {
      group = {
        kind: "group",
        key: message.id,
        authorId: message.authorId,
        authorName: message.authorName,
        authorRole: message.authorRole,
        messages: [message],
      };
      view.push(group);
    } else if (group) {
      group.messages.push(message);
    }

    previousAt = at.getTime();
  }

  return view;
}
