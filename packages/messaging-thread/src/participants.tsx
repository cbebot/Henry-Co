"use client";

import { useMemo } from "react";

export type ThreadParticipant = {
  /** Stable identifier (user ID or email) so React can key the strip. */
  id: string;
  /** Display name, eg. "Adaeze Okonkwo". */
  name: string;
  /** Localized role label, eg. "Customer", "Studio support", "Operations". */
  role?: string;
  /** Optional remote avatar URL. Falls back to initials when missing. */
  avatarUrl?: string | null;
  /** Mark one participant as the current viewer for subtle styling. */
  isSelf?: boolean;
  /** Optional presence indicator. */
  presence?: "online" | "offline" | null;
};

const MAX_DISPLAYED = 5;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (
    (parts[0]?.[0] || "") + (parts[1]?.[0] || "")
  ).toUpperCase() || (name[0] || "?").toUpperCase();
}

/**
 * Compact horizontal row of avatar pills representing the people in a
 * support thread — customer + assigned staff + division team members.
 *
 * Hosts pass a small list (1–5 participants is typical); overflow
 * collapses into a "+N more" caption so the strip stays one row even
 * on long-running threads.
 *
 * Lives in the engine package so account + studio share one implementation.
 */
export function ThreadParticipantsStrip({
  participants,
  ariaLabel = "Thread participants",
  className,
}: {
  participants: ThreadParticipant[];
  ariaLabel?: string;
  className?: string;
}) {
  const visible = useMemo(
    () => participants.slice(0, MAX_DISPLAYED),
    [participants],
  );
  const overflow = participants.length - visible.length;
  if (participants.length === 0) return null;
  return (
    <div
      className={[
        "mt-participants",
        ...(className ? [className] : []),
      ].join(" ")}
      role="list"
      aria-label={ariaLabel}
    >
      {visible.map((participant) => (
        <span
          key={participant.id}
          className="mt-participant"
          role="listitem"
          data-self={participant.isSelf ? "true" : undefined}
          data-presence={participant.presence || undefined}
        >
          <span className="mt-participant__avatar" aria-hidden>
            {participant.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={participant.avatarUrl}
                alt=""
                width={22}
                height={22}
                loading="lazy"
              />
            ) : (
              getInitials(participant.name)
            )}
          </span>
          <span className="mt-participant__name">{participant.name}</span>
          {participant.role ? (
            <span className="mt-participant__role">{participant.role}</span>
          ) : null}
        </span>
      ))}
      {overflow > 0 ? (
        <span className="mt-participants__overflow" aria-label={`${overflow} more`}>
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}
