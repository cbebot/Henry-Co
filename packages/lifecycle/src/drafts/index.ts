/**
 * `@henryco/lifecycle/drafts` — V3-01 S2 form persistence surface.
 *
 * Public surface:
 *   - `useFormDraft` — React hook for any form that needs draft
 *     preservation across refresh + reauth.
 *   - `DraftPanel` — UI panel for "continue where you left off".
 *   - `listDrafts` + storage primitives — read / write / clear
 *     envelopes directly (e.g., from server actions, slice 5 owner-
 *     workspace tile, slice 6 e2e tests).
 *   - `formatRelativeAgo` — i18n-template-driven relative-time helper.
 *   - `DraftEnvelope` / `DraftListEntry` types.
 */

export type { DraftEnvelope, DraftListEntry } from "./types";

export {
  STALE_THRESHOLD_MS,
  clearDraft,
  isStale,
  listDrafts,
  loadDraft,
  readSessionMirror,
  saveDraft,
} from "./draft-storage";

export { formatRelativeAgo, type RelativeAgoCopy } from "./relative-ago";

export {
  useFormDraft,
  type UseFormDraftOptions,
  type UseFormDraftResult,
} from "./use-form-draft";

export {
  DraftPanel,
  type DraftPanelCopy,
  type DraftPanelProps,
} from "./draft-panel";
