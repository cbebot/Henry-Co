/**
 * HQ internal comms — detect missing storage / schema cache issues without leaking raw DB text to browsers.
 */
export function isInternalCommsStorageError(error: { message?: string; code?: string } | null | undefined) {
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "");
  return (
    message.includes("could not find the table") ||
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    (message.includes("relation") && message.includes("not exist")) ||
    code === "PGRST116" ||
    code === "42P01"
  );
}

export const INTERNAL_COMMS_UNAVAILABLE =
  "Internal messaging is not set up yet. Apply the outstanding Henry Onyx Hub database migrations, wait a moment, then reload this page.";

export function logInternalCommsError(scope: string, error: unknown) {
  console.error(`[internal-comms:${scope}]`, error);
}
