// ---------------------------------------------------------------------------
// ai/ai-scan.ts — AI-assisted scan via an injected governed router (V3-26)
//
// Runs ONLY after deterministic rules did not already reject. Calls the
// injected ModerationAiRouter — NEVER a provider SDK and NEVER @henryco/ai-router
// directly (DI keeps this package free of provider deps and lets it ship today,
// before V3-26 exists). Hard rule: an AI `reject` recommendation is DOWNGRADED
// to `hold` (a human makes the final reject call). If the router is null,
// throws, or times out, the scan degrades to "no AI signal" — it NEVER fails
// open (the deterministic floor still governs the decision).
// ---------------------------------------------------------------------------

import type {
  AiScanResult,
  ModerationAiRouter,
  ModerationInput,
} from "../types";

export interface AiScanOptions {
  /** Ceiling for the router call; on timeout the scan degrades. */
  timeoutMs?: number;
}

/**
 * Returns the AI's verdict, or `null` when AI was unavailable / errored /
 * timed out. Null means "no AI signal" — callers must keep the deterministic
 * decision (degrade, never fail open).
 */
export async function runAiScan(
  router: ModerationAiRouter | null | undefined,
  input: ModerationInput,
  opts: AiScanOptions = {},
): Promise<AiScanResult | null> {
  if (!router) return null;

  const request = {
    contentType: input.contentType,
    text: input.text,
    imageUrls: input.imageUrls,
    locale: input.locale,
  };

  try {
    const raw = await withTimeout(router.scan(request), opts.timeoutMs ?? 8000);
    if (!raw) return null;
    return normalizeAiResult(raw);
  } catch {
    // Router unreachable / threw / timed out → degrade to no-signal.
    return null;
  }
}

/** Clamp confidence and DOWNGRADE an AI `reject` to `hold` (human-gated). */
export function normalizeAiResult(raw: AiScanResult): AiScanResult {
  const confidence = Number.isFinite(raw.confidence)
    ? Math.min(1, Math.max(0, raw.confidence))
    : 0;
  const recommendation = raw.recommendation === "reject" ? "hold" : raw.recommendation;
  return { recommendation, reasons: raw.reasons ?? [], confidence };
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("ai_scan_timeout")), ms);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}
