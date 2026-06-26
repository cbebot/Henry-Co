"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { useHenryCoLocale } from "@henryco/i18n/react";
import { getDashboardShellCopy } from "@henryco/i18n";
import { typeStyle } from "../tokens/type";
import { CSS_VARS, STATUS_VARS } from "../tokens/color";
import { RADIUS } from "../tokens/spacing";

/**
 * BulkActionBar — selection toolbar for staff queue tables.
 *
 * Floats above the queue when one or more rows are selected. Shows
 * selected-count + action stack + clear-selection. Per Track C
 * power requirement: "Bulk operations: select multiple queue rows,
 * apply action (assign, escalate, close, defer, batch-reply,
 * bulk-approve, bulk-decline). Confirmation modal cites count + sample."
 *
 * The bar OWNS the confirm-modal state for its action stack — the
 * caller passes `onActionConfirm(actionId, reason?)` and the bar
 * handles the modal flow including reason capture for actions
 * marked `requiresReason`.
 *
 * Anti-pattern compliance:
 *   - #19 (Role-agnostic UI) — Track C-only primitive; not exported
 *     to Track A consumer surfaces.
 *   - #18 (Bare metrics) — count is always paired with the SLA-bucket
 *     summary if the caller passes one.
 *   - V10 (Empty/loading/error/success) — successful action triggers
 *     a per-row success-lock animation via the onSuccess callback.
 */

export type BulkAction = {
  /** Stable id passed back to onActionConfirm. */
  id: string;
  /** Display label. */
  label: string;
  /** Variant — drives accent color. */
  variant: "primary" | "secondary" | "destructive";
  /** Optional icon ReactNode. */
  icon?: ReactNode;
  /** Whether this action requires a reason capture before execution. */
  requiresReason?: boolean;
  /** Confirmation copy generator — receives selected count. */
  confirmCopy?: (selectedCount: number) => string;
  /** Optional sample-row generator — shown in the confirm modal under the copy. */
  sampleCopy?: (selectedCount: number) => string;
};

export type BulkActionBarProps = {
  /** Selected row ids — drives count + action enable state. */
  selectedIds: ReadonlyArray<string>;
  /** Callback to clear the selection. */
  onClear: () => void;
  /** Action stack. Order is preserved; destructive actions render at the right edge. */
  actions: ReadonlyArray<BulkAction>;
  /**
   * Called when the user confirms a bulk action. Receives the action id,
   * the reason (if requiresReason is set on the action), and the
   * selectedIds at confirm time. Should return a Promise; the bar shows
   * an in-flight state until it resolves.
   */
  onActionConfirm: (
    actionId: string,
    selectedIds: ReadonlyArray<string>,
    reason: string | null,
  ) => Promise<void>;
  /**
   * Optional summary chip — e.g. "3 SLA-breach · 5 warning". Anti-#18:
   * count alone is bare; pair with SLA context when available.
   */
  summary?: ReactNode;
  /** Optional position — default fixed at bottom of viewport. */
  position?: "fixed" | "sticky";
  /** Optional z-index. */
  zIndex?: number;
};

export type BulkActionBarHandle = {
  /** Imperative API for keyboard hotkeys: open the action confirm modal. */
  triggerAction: (actionId: string) => void;
};

export const BulkActionBar = forwardRef<BulkActionBarHandle, BulkActionBarProps>(
  function BulkActionBar(
    {
      selectedIds,
      onClear,
      actions,
      onActionConfirm,
      summary,
      position = "fixed",
      zIndex = 50,
    },
    ref,
  ) {
    const [activeAction, setActiveAction] = useState<BulkAction | null>(null);
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const reasonInputRef = useRef<HTMLTextAreaElement | null>(null);
    const dialogId = useId();
    const copy = getDashboardShellCopy(useHenryCoLocale());

    const selectedCount = selectedIds.length;
    const hasSelection = selectedCount > 0;

    useImperativeHandle(ref, () => ({
      triggerAction: (actionId: string) => {
        const action = actions.find((a) => a.id === actionId);
        if (!action || !hasSelection) return;
        setActiveAction(action);
        setReason("");
        setError(null);
      },
    }));

    useEffect(() => {
      if (activeAction && activeAction.requiresReason) {
        reasonInputRef.current?.focus();
      }
    }, [activeAction]);

    if (!hasSelection && !activeAction) return null;

    async function handleConfirm() {
      if (!activeAction) return;
      if (activeAction.requiresReason && reason.trim().length < 3) {
        setError(copy.bulkActionBar.reasonRequired);
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        await onActionConfirm(
          activeAction.id,
          selectedIds,
          activeAction.requiresReason ? reason.trim() : null,
        );
        setActiveAction(null);
        setReason("");
      } catch (e) {
        setError(e instanceof Error ? e.message : copy.bulkActionBar.actionFailed);
      } finally {
        setSubmitting(false);
      }
    }

    function variantStyle(variant: BulkAction["variant"]): CSSProperties {
      switch (variant) {
        case "primary":
          return {
            background: `var(${CSS_VARS.accent})`,
            color: `var(${CSS_VARS.textOnAccent})`,
            boxShadow: `inset 0 0 0 1px var(${CSS_VARS.accentStrong})`,
          };
        case "destructive":
          return {
            background: `var(${STATUS_VARS.danger.bg})`,
            color: `var(${STATUS_VARS.danger.text})`,
            boxShadow: `inset 0 0 0 1px var(${STATUS_VARS.danger.border})`,
          };
        default:
          return {
            background: `var(${CSS_VARS.surfaceElevated})`,
            color: `var(${CSS_VARS.ink})`,
            boxShadow: `inset 0 0 0 1px var(${CSS_VARS.hairline})`,
          };
      }
    }

    return (
      <>
        {hasSelection ? (
          <div
            role="toolbar"
            aria-label={copy.bulkActionBar.selectedCount(selectedCount)}
            style={{
              position,
              left: 0,
              right: 0,
              bottom: position === "fixed" ? "1rem" : 0,
              display: "flex",
              justifyContent: "center",
              padding: "0 1rem",
              zIndex,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.625rem 0.875rem",
                background: `var(${CSS_VARS.surface})`,
                borderRadius: RADIUS.lg,
                boxShadow: `0 12px 40px rgba(0,0,0,0.18), inset 0 0 0 1px var(${CSS_VARS.hairline})`,
                pointerEvents: "auto",
                maxWidth: "min(100%, 920px)",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  ...typeStyle("kicker"),
                  color: `var(${CSS_VARS.inkMuted})`,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {copy.bulkActionBar.selectedCount(selectedCount)}
              </span>
              {summary ? (
                <>
                  <span
                    aria-hidden
                    style={{
                      width: 1,
                      height: "1rem",
                      background: `var(${CSS_VARS.hairline})`,
                    }}
                  />
                  <span style={{ ...typeStyle("body"), color: `var(${CSS_VARS.ink})` }}>
                    {summary}
                  </span>
                </>
              ) : null}
              <span style={{ flex: 1 }} />
              {actions.map((action) => {
                const styles: CSSProperties = {
                  ...typeStyle("bodyStrong"),
                  ...variantStyle(action.variant),
                  border: "none",
                  borderRadius: RADIUS.md,
                  padding: "0.5rem 0.75rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  minHeight: "2.25rem",
                };
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => {
                      setActiveAction(action);
                      setReason("");
                      setError(null);
                    }}
                    style={styles}
                    data-action={action.id}
                    className="hc-staff-bulk-action"
                  >
                    {action.icon}
                    {action.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={onClear}
                aria-label={copy.bulkActionBar.clearSelection}
                style={{
                  ...typeStyle("kicker"),
                  background: "transparent",
                  border: "none",
                  color: `var(${CSS_VARS.inkMuted})`,
                  cursor: "pointer",
                  padding: "0.5rem",
                }}
                className="hc-staff-bulk-action"
              >
                {copy.bulkActionBar.clear}
              </button>
            </div>
          </div>
        ) : null}

        {activeAction ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${dialogId}-title`}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(5, 8, 22, 0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
              zIndex: zIndex + 1,
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !submitting) {
                setActiveAction(null);
              }
            }}
          >
            <div
              style={{
                background: `var(${CSS_VARS.surface})`,
                color: `var(${CSS_VARS.ink})`,
                borderRadius: RADIUS.lg,
                boxShadow: `0 24px 60px rgba(0,0,0,0.30), inset 0 0 0 1px var(${CSS_VARS.hairline})`,
                width: "min(100%, 480px)",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <p
                id={`${dialogId}-title`}
                style={{
                  ...typeStyle("headline"),
                  margin: 0,
                  color: `var(${CSS_VARS.ink})`,
                }}
              >
                {activeAction.label}
              </p>
              <p
                style={{
                  ...typeStyle("body"),
                  margin: 0,
                  color: `var(${CSS_VARS.inkSoft})`,
                }}
              >
                {activeAction.confirmCopy
                  ? activeAction.confirmCopy(selectedCount)
                  : copy.bulkActionBar.applyToSelected(activeAction.label, selectedCount)}
              </p>
              {activeAction.sampleCopy ? (
                <p
                  style={{
                    ...typeStyle("small"),
                    margin: 0,
                    color: `var(${CSS_VARS.inkMuted})`,
                  }}
                >
                  {activeAction.sampleCopy(selectedCount)}
                </p>
              ) : null}
              {activeAction.requiresReason ? (
                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.375rem",
                  }}
                >
                  <span
                    style={{
                      ...typeStyle("kicker"),
                      color: `var(${CSS_VARS.inkMuted})`,
                    }}
                  >
                    {copy.bulkActionBar.reasonLabel}
                  </span>
                  <textarea
                    ref={reasonInputRef}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    disabled={submitting}
                    style={{
                      ...typeStyle("body"),
                      width: "100%",
                      borderRadius: RADIUS.md,
                      border: `1px solid var(${CSS_VARS.hairline})`,
                      background: `var(${CSS_VARS.surfaceElevated})`,
                      color: `var(${CSS_VARS.ink})`,
                      padding: "0.5rem 0.625rem",
                      resize: "vertical",
                    }}
                    placeholder={copy.bulkActionBar.reasonPlaceholder}
                    aria-required="true"
                  />
                </label>
              ) : null}
              {error ? (
                <p
                  style={{
                    ...typeStyle("small"),
                    margin: 0,
                    color: `var(${STATUS_VARS.danger.text})`,
                  }}
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.5rem",
                  marginTop: "0.25rem",
                }}
              >
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setActiveAction(null)}
                  className="hc-staff-bulk-action"
                  style={{
                    ...typeStyle("bodyStrong"),
                    background: "transparent",
                    color: `var(${CSS_VARS.inkSoft})`,
                    border: "none",
                    padding: "0.5rem 0.75rem",
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {copy.bulkActionBar.cancel}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleConfirm}
                  className="hc-staff-bulk-action"
                  style={{
                    ...typeStyle("bodyStrong"),
                    ...variantStyle(activeAction.variant),
                    border: "none",
                    borderRadius: RADIUS.md,
                    padding: "0.5rem 0.875rem",
                    cursor: submitting ? "wait" : "pointer",
                    minHeight: "2.25rem",
                  }}
                >
                  {submitting ? copy.bulkActionBar.working : copy.bulkActionBar.confirmCount(selectedCount)}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </>
    );
  },
);
