"use client";

import { useEffect, useRef } from "react";
import { shellToast } from "@henryco/dashboard-shell";

/**
 * First-login recovery nudge. When the user lands on the dashboard with pending
 * unfinished journeys, surface ONE calm toast pointing at /continue — once per
 * browser session. It rides the shared toast viewport, so it's paced by the same
 * drip regulation (never stacks on top of other toasts).
 */
const SESSION_KEY = "hc_recovery_nudge_v1";

export type RecoveryNudgeProps = {
  count: number;
  href: string;
  /** "You have 1 thing to continue" */
  titleOne: string;
  /** "You have {n} things to continue" */
  titleMany: string;
  body: string;
};

export function RecoveryNudge({ count, href, titleOne, titleMany, body }: RecoveryNudgeProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current || count <= 0) return;
    try {
      if (window.sessionStorage.getItem(SESSION_KEY)) return;
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // private mode / storage disabled — the ref guard still prevents repeats
      // within this mount.
    }
    firedRef.current = true;
    const title = count === 1 ? titleOne : titleMany.replace("{n}", String(count));
    shellToast.info(title, { body, href, id: "recovery-nudge" });
  }, [count, href, titleOne, titleMany, body]);

  return null;
}
