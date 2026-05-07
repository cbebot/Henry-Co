import "server-only";

import { cookies } from "next/headers";
import { COMPANY } from "@henryco/config";

import {
  DASHBOARD_PREFERENCE_COOKIE,
  DASHBOARD_PREFERENCE_VALUES,
  type DashboardPreference,
} from "./types";

/**
 * 90 days. Same value the chooser POST handler uses today; codified here
 * so the IdentityBar role-switcher and the chooser write identical
 * cookies.
 */
const PREFERENCE_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

/**
 * Read the remembered dashboard preference from the request cookie jar.
 * Returns null when the cookie is absent, empty, or carries an
 * unrecognised value (defence-in-depth — the writer is trusted, the
 * reader still validates).
 */
export async function readDashboardPreference(): Promise<DashboardPreference | null> {
  const jar = await cookies();
  const raw = jar.get(DASHBOARD_PREFERENCE_COOKIE)?.value;
  if (!raw) return null;
  const normalized = raw.trim().toLowerCase();
  return (DASHBOARD_PREFERENCE_VALUES as ReadonlyArray<string>).includes(normalized)
    ? (normalized as DashboardPreference)
    : null;
}

/**
 * Write the remembered dashboard preference. Used by:
 *   1. the chooser POST handler at apps/account/app/auth/choose
 *      (when the user picks a lane and ticks "remember this choice")
 *   2. the IdentityBar role-switcher (when the user toggles between
 *      customer / staff / owner from the shell chrome)
 *
 * Both call sites consume this exact helper so the cookie shape never
 * diverges between login-time and shell-time.
 *
 * Domain: `.<baseDomain>` (typically `.henrycogroup.com`) so the
 * preference is honoured when the user crosses to hq.* or staff.*.
 * SameSite=Lax + Secure for the standard cookie hardening posture.
 */
export async function setDashboardPreference(value: DashboardPreference): Promise<void> {
  const jar = await cookies();
  const baseDomain = COMPANY.group.baseDomain;
  jar.set(DASHBOARD_PREFERENCE_COOKIE, value, {
    domain: `.${baseDomain}`,
    path: "/",
    maxAge: PREFERENCE_MAX_AGE_SECONDS,
    httpOnly: false,
    sameSite: "lax",
    secure: true,
  });
}

/**
 * Clear the preference. Used on sign-out so a shared device doesn't
 * pre-resolve the next user into the prior user's preferred lane.
 */
export async function clearDashboardPreference(): Promise<void> {
  const jar = await cookies();
  const baseDomain = COMPANY.group.baseDomain;
  jar.set(DASHBOARD_PREFERENCE_COOKIE, "", {
    domain: `.${baseDomain}`,
    path: "/",
    maxAge: 0,
    httpOnly: false,
    sameSite: "lax",
    secure: true,
  });
}

export { DASHBOARD_PREFERENCE_COOKIE } from "./types";
