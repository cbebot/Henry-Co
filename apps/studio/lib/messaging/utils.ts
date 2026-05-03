/**
 * Studio messaging — pure formatting / grouping utilities.
 *
 * Everything here is deterministic and timezone-naive (uses the
 * runtime locale). UI components import these as-is — no React or
 * Supabase dependencies live in this module.
 */

import { SEQUENCE_WINDOW_MS } from "./constants";
import type { MessageAttachment, StudioMessage } from "./types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function daysBetween(a: Date, b: Date): number {
  const diff = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(diff / MS_PER_DAY);
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatHourMinute(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/**
 * Spec timestamp display:
 *   Today: "09:41"
 *   Yesterday: "Yesterday, 09:41"
 *   This week: "Tuesday, 09:41"
 *   Older: "14 Apr, 09:41"
 */
export function formatMessageTimestamp(
  iso: string,
  now: Date = new Date(),
): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  if (isSameDay(date, now)) {
    return formatHourMinute(date);
  }

  const days = daysBetween(date, now);
  if (days === 1) {
    return `Yesterday, ${formatHourMinute(date)}`;
  }
  if (days > 1 && days < 7) {
    return `${WEEKDAY_NAMES[date.getDay()]}, ${formatHourMinute(date)}`;
  }

  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]}, ${formatHourMinute(date)}`;
}

/**
 * Date separator label rendered between days in the conversation.
 * "Today", "Yesterday", "Tuesday 14 April", or "14 April 2026".
 */
export function formatDateSeparator(
  iso: string,
  now: Date = new Date(),
): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  if (isSameDay(date, now)) return "Today";
  if (daysBetween(date, now) === 1) return "Yesterday";

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const sameYear = date.getFullYear() === now.getFullYear();
  const datePart = `${date.getDate()} ${monthNames[date.getMonth()]}`;
  if (sameYear) {
    return `${WEEKDAY_NAMES[date.getDay()]} ${datePart}`;
  }
  return `${datePart} ${date.getFullYear()}`;
}

/**
 * Reduces a flat list of messages to a grouping structure where each
 * group is a sequence from a single sender within SEQUENCE_WINDOW_MS.
 * Non-text system messages always break a sequence — they render as
 * standalone separators regardless of who sent them.
 */
export type MessageSequence = {
  senderId: string | null;
  senderName: string;
  senderRole: StudioMessage["senderRole"];
  messages: StudioMessage[];
};

export function groupIntoSequences(
  messages: StudioMessage[],
): MessageSequence[] {
  const sequences: MessageSequence[] = [];

  for (const msg of messages) {
    const last = sequences[sequences.length - 1];
    const isSystem = msg.messageType !== "text" && msg.messageType !== "file";
    const lastIsSystem =
      last &&
      last.messages[last.messages.length - 1].messageType !== "text" &&
      last.messages[last.messages.length - 1].messageType !== "file";

    if (
      last &&
      !isSystem &&
      !lastIsSystem &&
      last.senderId === msg.senderId &&
      last.senderName === msg.senderName &&
      withinWindow(
        last.messages[last.messages.length - 1].createdAt,
        msg.createdAt,
      )
    ) {
      last.messages.push(msg);
    } else {
      sequences.push({
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderRole: msg.senderRole,
        messages: [msg],
      });
    }
  }

  return sequences;
}

function withinWindow(earlier: string, later: string): boolean {
  const a = new Date(earlier).getTime();
  const b = new Date(later).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  return Math.abs(b - a) <= SEQUENCE_WINDOW_MS;
}

/**
 * Inserts day-boundary separator markers between messages. The result
 * is intended for direct rendering by the message list.
 */
export type ThreadEntry =
  | { kind: "date"; id: string; iso: string }
  | { kind: "message"; message: StudioMessage };

export function withDateSeparators(messages: StudioMessage[]): ThreadEntry[] {
  const out: ThreadEntry[] = [];
  let lastDate: Date | null = null;

  for (const msg of messages) {
    const date = new Date(msg.createdAt);
    if (Number.isNaN(date.getTime())) continue;
    if (!lastDate || !isSameDay(lastDate, date)) {
      out.push({
        kind: "date",
        id: `date-${startOfDay(date).getTime()}`,
        iso: msg.createdAt,
      });
      lastDate = date;
    }
    out.push({ kind: "message", message: msg });
  }

  return out;
}

export function isMessageEdited(msg: StudioMessage): boolean {
  return Boolean(msg.editedAt);
}

export function isMessageDeleted(msg: StudioMessage): boolean {
  return Boolean(msg.deletedAt);
}

/** Truncate body for previews / reply quotes / notifications. */
export function excerpt(body: string, maxLength = 80): string {
  const clean = (body || "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).trimEnd()}…`;
}

/**
 * Classifies an attachment by mime type / extension into the coarse
 * categories the renderer cares about.
 */
export function classifyAttachment(
  mimeType: string | null | undefined,
  filename: string | null | undefined,
): MessageAttachment["kind"] {
  const mime = (mimeType || "").toLowerCase();
  const name = (filename || "").toLowerCase();

  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (
    mime.includes("msword") ||
    mime.includes("officedocument") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx") ||
    name.endsWith(".xls") ||
    name.endsWith(".xlsx")
  ) {
    return "doc";
  }
  return "other";
}

export function formatAttachmentSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Build a stable client ID for offline-queued messages. */
export function generateClientMessageId(): string {
  if (
    typeof globalThis !== "undefined" &&
    "crypto" in globalThis &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return `client-${globalThis.crypto.randomUUID()}`;
  }
  return `client-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/**
 * Aggregates raw reaction rows into the per-emoji summary the bubble
 * renders. Keeps order matching the curated list (so the UI is
 * predictable regardless of click order).
 */
export function summariseReactions(
  rows: Array<{ emoji: string; userId: string }>,
  viewerId: string | null,
  ordering: readonly string[],
): StudioMessage["reactions"] {
  const counts = new Map<string, { count: number; appliedByViewer: boolean }>();
  for (const row of rows) {
    const slot = counts.get(row.emoji) ?? {
      count: 0,
      appliedByViewer: false,
    };
    slot.count += 1;
    if (viewerId && row.userId === viewerId) {
      slot.appliedByViewer = true;
    }
    counts.set(row.emoji, slot);
  }

  return ordering
    .filter((emoji) => counts.has(emoji))
    .map((emoji) => {
      const slot = counts.get(emoji)!;
      return {
        emoji: emoji as StudioMessage["reactions"][number]["emoji"],
        count: slot.count,
        appliedByViewer: slot.appliedByViewer,
      };
    });
}
