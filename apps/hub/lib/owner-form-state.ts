export type OwnerFormState = {
  ok: boolean | null;
  message: string;
};

export const initialOwnerFormState: OwnerFormState = { ok: null, message: "" };

/** Preserves Next.js `redirect()` from being swallowed by server-action try/catch. */
export function rethrowIfRedirect(error: unknown): void {
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: string }).digest === "string" &&
    String((error as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  ) {
    throw error;
  }
}

/** Safe owner-visible message; never forwards stack traces or provider internals. */
export function toOwnerFacingError(error: unknown): string {
  if (error instanceof Error) {
    const text = error.message.trim();
    if (
      text.includes("Supabase") ||
      text.includes("fetch") ||
      text.includes("ECONNREFUSED") ||
      text.includes("JWT")
    ) {
      return "We could not complete that action because a backend service failed. Try again shortly; if it persists, check Supabase and auth configuration.";
    }
    if (text.length > 200) {
      return "Something went wrong while saving. Check required fields and try again.";
    }
    return text || "Something went wrong. Try again.";
  }
  return "Something went wrong. Try again.";
}
