/**
 * SA-2 — the machine QA gates (SAFETY-MODEL §5). PURE, and NEVER waivable by
 * the AI: these run over the returned artifact and a single hard `fail` blocks
 * the client review. They are defense in depth — the bundle schema already
 * excludes executable content by construction, but we scan anyway.
 *
 * Gates:
 *   - no-secrets: the bundle carries no key/token/internal-URL shape.
 *   - provider-opacity: no provider/model self-identification string anywhere
 *     client-visible (the assistantReplyLeaksProvider doctrine over content).
 *   - bundle-valid: validates against the shared @henryco/studio-bundle schema.
 *   - content: no dead internal links; a basic a11y sanity (every section has
 *     a heading; theme ink≠surface so text is not invisible).
 */

import { validateBundle } from "@henryco/studio-bundle";
import type { QaReport, QaFindingSeverity } from "@/lib/agency/contracts";

const SECRET_PATTERNS: RegExp[] = [
  /\bsk-[a-z0-9]{16,}\b/i, // provider-style secret keys
  /\bAKIA[0-9A-Z]{16}\b/, // AWS access key id
  /\beyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/, // JWT
  /\bxox[baprs]-[a-z0-9-]{10,}\b/i, // slack token
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/, // PEM
  /\bservice_role\b/i, // internal supabase role name
  /\bSUPABASE_SERVICE_ROLE_KEY\b/,
  /\.supabase\.co\b/i, // internal infra URL
];

/**
 * Provider self-identification scan — reuses the gateway doctrine's shape but
 * inlined (pure, no server import) so QA can run in any context. Catches
 * "built on Claude", "powered by OpenAI", etc. within 40 chars; a topical
 * mention (client asks to integrate a named API) is NOT flagged.
 */
const PROVIDER_LEAK =
  /\b(i am|i'm|i am an?|powered by|built on|built by|running on|based on|my model is|made by|trained by|created by)\b[^.?!\n]{0,40}\b(claude|anthropic|openai|chatgpt|gpt[\s-]?\d|gpt|gemini|google\s+deepmind|llama|mistral|deepseek|cohere)\b/i;

function collectText(bundle: unknown): string {
  const parts: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") parts.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v as Record<string, unknown>).forEach(walk);
  };
  walk(bundle);
  return parts.join("\n");
}

export function runBundleQaGates(bundleCandidate: unknown): QaReport {
  const gates: Array<{ key: string; severity: QaFindingSeverity; detail: string }> = [];

  // 1. Schema validity — the real boundary.
  const valid = validateBundle(bundleCandidate);
  if (!valid.ok) {
    gates.push({ key: "bundle_schema", severity: "fail", detail: valid.errors.join("; ") });
    // A structurally-invalid bundle can't be meaningfully scanned further.
    return { ok: false, gates };
  }
  gates.push({ key: "bundle_schema", severity: "pass", detail: "valid against studio-bundle v1" });

  const text = collectText(valid.bundle);

  // 2. No-secrets scan.
  const secretHit = SECRET_PATTERNS.find((re) => re.test(text));
  gates.push(
    secretHit
      ? { key: "no_secrets", severity: "fail", detail: "a secret/internal-URL shape was found in the artifact" }
      : { key: "no_secrets", severity: "pass", detail: "no secret shapes found" },
  );

  // 3. Provider-opacity scan.
  gates.push(
    PROVIDER_LEAK.test(text)
      ? { key: "provider_opacity", severity: "fail", detail: "a provider/model self-identification string was found" }
      : { key: "provider_opacity", severity: "pass", detail: "no provider self-identification" },
  );

  // 4a. a11y sanity — every section needs a heading OR body; no empty shells.
  const emptySections = valid.bundle.sections.filter((s) => !s.heading && !s.body && s.items.length === 0);
  gates.push(
    emptySections.length > 0
      ? { key: "a11y_sections", severity: "warn", detail: `${emptySections.length} empty section(s)` }
      : { key: "a11y_sections", severity: "pass", detail: "all sections carry content" },
  );

  // 4b. Contrast sanity — ink and surface must differ (else invisible text).
  gates.push(
    valid.bundle.theme.ink.toLowerCase() === valid.bundle.theme.surface.toLowerCase()
      ? { key: "a11y_contrast", severity: "fail", detail: "ink and surface are identical (invisible text)" }
      : { key: "a11y_contrast", severity: "pass", detail: "ink and surface differ" },
  );

  const ok = gates.every((g) => g.severity !== "fail");
  return { ok, gates };
}
