"use client";

import { Circle, CircleDot, CircleSlash, Clock } from "lucide-react";
import { Chip } from "@henryco/dashboard-shell/components";

import type { RoomStatus } from "../types";

/**
 * RoomBadge — small chip indicating room status.
 *
 * Wraps the shell's `<Chip>` primitive to map a `RoomStatus` onto the
 * right tone + icon. Used by:
 *   - The room route header (live / ended)
 *   - The dashboard widget (upcoming rooms list)
 *   - The notifications inbox (recording finished)
 *
 * No new tokens — composes shell `<Chip>` tones.
 */
export type RoomBadgeProps = {
  status: RoomStatus;
  /** Override the label. Defaults to a title-cased status string. */
  label?: string;
};

const STATUS_TO_TONE: Record<
  RoomStatus,
  "success" | "warning" | "urgent" | "neutral"
> = {
  scheduled: "neutral",
  live: "success",
  ended: "neutral",
  cancelled: "urgent",
};

const STATUS_TO_LABEL: Record<RoomStatus, string> = {
  scheduled: "Scheduled",
  live: "Live",
  ended: "Ended",
  cancelled: "Cancelled",
};

const STATUS_TO_ICON = {
  scheduled: Clock,
  live: CircleDot,
  ended: Circle,
  cancelled: CircleSlash,
} as const;

export function RoomBadge({ status, label }: RoomBadgeProps) {
  const tone = STATUS_TO_TONE[status];
  const Icon = STATUS_TO_ICON[status];
  return (
    <Chip tone={tone} leading={<Icon size={12} aria-hidden />}>
      {label ?? STATUS_TO_LABEL[status]}
    </Chip>
  );
}
