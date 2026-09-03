/**
 * Persisted shape of a single draft. Each form that calls
 * `useFormDraft(key, ...)` gets its own envelope keyed under
 * `henryco.draft.<key>` in localStorage and mirrored to
 * `henryco.draft-mirror.<key>` in sessionStorage (the mirror is what
 * survives a reauth round-trip on edge browsers that clear
 * localStorage cross-origin).
 */
export type DraftEnvelope<T = unknown> = {
  /** Stable identifier for the draft — same as the URL `drafts=…` param. */
  key: string;
  /** The persisted form state. JSON-serialisable. */
  value: T;
  /** Wall-clock ms when this version was saved (Addendum A8: drives staleness UI). */
  savedAt: number;
  /** Schema version — bump to invalidate older drafts after a breaking shape change. */
  version: number;
};

/** Row shape consumed by the `DraftPanel` "continue where you left off" UI. */
export type DraftListEntry = {
  /** Stable draft key (same as DraftEnvelope.key). */
  key: string;
  /** Title to display ("Support thread — Order delay", "Marketplace checkout", etc). */
  title: string;
  /** Where to land the user when they click "Continue". */
  href: string;
  /** ms timestamp the draft was last saved. */
  savedAt: number;
};
