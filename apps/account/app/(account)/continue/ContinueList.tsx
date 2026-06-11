"use client";

import { useState, useTransition } from "react";
import { ArrowUpRight, Trash2 } from "lucide-react";

import { dismissRecoveryTaskAction } from "./actions";

export type ContinueItem = {
  id: string;
  /** Human title (state.title if present, else the task-type label). */
  title: string;
  /** Short kind chip, e.g. "Incomplete booking". */
  label: string;
  /** Deep link to the exact next step. */
  href: string;
  /** ms epoch of last progress. */
  savedAt: number;
};

export type ContinueListCopy = {
  continueButton: string;
  dismissAria: string; // "Dismiss {title}"
  ago: { minutes: string; hours: string; days: string }; // "{n} min ago" etc.
};

function formatAgo(savedAt: number, copy: ContinueListCopy["ago"]): string {
  const diff = Math.max(0, Date.now() - savedAt);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return copy.minutes.replace("{n}", String(Math.max(1, minutes)));
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return copy.hours.replace("{n}", String(hours));
  const days = Math.floor(hours / 24);
  return copy.days.replace("{n}", String(days));
}

export function ContinueList({
  items,
  copy,
}: {
  items: ContinueItem[];
  copy: ContinueListCopy;
}) {
  const [list, setList] = useState(items);
  const [, startTransition] = useTransition();

  function dismiss(id: string) {
    setList((prev) => prev.filter((item) => item.id !== id)); // optimistic
    startTransition(async () => {
      await dismissRecoveryTaskAction(id);
    });
  }

  if (list.length === 0) return null;

  return (
    <ul className="acct-continue__list">
      {list.map((item) => {
        const external = /^https?:\/\//i.test(item.href);
        return (
          <li key={item.id} className="acct-continue__card">
            <div className="acct-continue__card-body">
              <span className="acct-continue__chip">{item.label}</span>
              <span className="acct-continue__card-title">{item.title}</span>
              <span className="acct-continue__meta">{formatAgo(item.savedAt, copy.ago)}</span>
            </div>
            <div className="acct-continue__card-actions">
              <button
                type="button"
                className="acct-continue__dismiss"
                onClick={() => dismiss(item.id)}
                aria-label={copy.dismissAria.replace("{title}", item.title)}
              >
                <Trash2 size={15} aria-hidden />
              </button>
              <a
                className="acct-continue__cta"
                href={item.href}
                {...(external ? { rel: "noopener" } : {})}
              >
                {copy.continueButton}
                <ArrowUpRight size={14} aria-hidden />
              </a>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
