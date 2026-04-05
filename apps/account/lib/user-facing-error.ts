import "server-only";

/** Never return raw DB/provider errors to browser clients. */
export const USER_FACING_GENERIC = "Something went wrong. Please try again in a moment.";
export const USER_FACING_SAVE = "We couldn’t save your changes. Please try again.";
export const USER_FACING_LOAD = "We couldn’t load that right now. Please refresh.";

export function logApiError(scope: string, error: unknown) {
  console.error(`[henryco/account-api] ${scope}:`, error);
}
