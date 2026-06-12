/**
 * V3-ACTIONS-01 — client-side submission for /api/property intents.
 *
 * The route is dual-mode: a native <form> post (no JS) gets the legacy
 * 303-redirect acknowledgment, while a fetch carrying `x-henryco-async: 1`
 * gets JSON. This helper is the fetch half — every in-place property action
 * (save, inquiry, viewing, saved search) submits through it so scroll,
 * focus, and typed state survive the round trip.
 */

export type PropertyActionResult =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; error: string | null; code: string | null; loginUrl: string | null };

export async function postPropertyAction(formData: FormData): Promise<PropertyActionResult> {
  try {
    const response = await fetch("/api/property", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "x-henryco-async": "1",
      },
      body: formData,
    });

    const payload = (await response.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    if (!response.ok || !payload || payload.ok !== true) {
      return {
        ok: false,
        error: typeof payload?.error === "string" ? payload.error : null,
        code: typeof payload?.code === "string" ? payload.code : null,
        loginUrl: typeof payload?.loginUrl === "string" ? payload.loginUrl : null,
      };
    }

    return { ok: true, payload };
  } catch {
    return { ok: false, error: null, code: "network", loginUrl: null };
  }
}
