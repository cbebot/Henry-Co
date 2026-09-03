import { isFlagEnabled, parseHenryFeatureFlags } from "@henryco/intelligence";

/**
 * V3-39 — the `personalization_next_action` kill switch (governed flag family).
 * Default OFF (dark launch): with the flag unset the dock renders nothing, the
 * settings toggle stays hidden, and the server actions refuse — nothing mounts,
 * nothing reads, nothing emits.
 */
export function nextActionEnabled(): boolean {
  return isFlagEnabled(
    parseHenryFeatureFlags(process.env as Record<string, string | undefined>),
    "personalization_next_action",
  );
}
