export const STAFF_LOGIN_ROUTE = "/workspace/access";
export const STAFF_RECOVERY_ROUTE = "/workspace/access/recovery";
export const STAFF_CALLBACK_ROUTE = "/workspace/access/callback";

export function buildStaffLoginUrl(next?: string | null, extras?: Record<string, string | null | undefined>) {
  const params = new URLSearchParams();

  if (next && next.startsWith("/")) {
    params.set("next", next);
  }

  for (const [key, value] of Object.entries(extras ?? {})) {
    if (typeof value === "string" && value.trim()) {
      params.set(key, value);
    }
  }

  return params.size ? `${STAFF_LOGIN_ROUTE}?${params.toString()}` : STAFF_LOGIN_ROUTE;
}
