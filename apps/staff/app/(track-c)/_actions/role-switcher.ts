"use server";

import { redirect } from "next/navigation";
import { setDashboardPreference } from "@henryco/auth/cookies";
import { getAccountUrl, getHqUrl, getStaffHqUrl } from "@henryco/config";

/**
 * Track C IdentityBar role-switcher server action.
 *
 * The IdentityBar passes the picked option key ("customer" | "staff" |
 * "owner"). This action writes the preference cookie + redirects to
 * the appropriate canonical track URL.
 */
export async function selectRoleOption(key: "customer" | "staff" | "owner") {
  await setDashboardPreference(key);
  switch (key) {
    case "customer":
      redirect(getAccountUrl("/"));
    case "owner":
      redirect(getHqUrl("/owner"));
    case "staff":
      redirect(getStaffHqUrl("/"));
    default:
      redirect(getAccountUrl("/"));
  }
}

/**
 * Track C IdentityBar sign-out action. Clears the supabase session +
 * the dashboard-preference cookie, then redirects to the unified
 * login page.
 */
export async function signOutFromTrackC() {
  // Sign-out goes via the existing /api/auth/logout endpoint which
  // clears Supabase cookies + invalidates the session. Server-side
  // this just redirects there; the API route handles the cookie clear
  // + final redirect to /login.
  redirect("/api/auth/logout");
}
