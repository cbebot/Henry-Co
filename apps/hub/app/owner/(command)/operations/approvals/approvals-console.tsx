"use client";

/**
 * V3-OWNER-CONTROL-01 — the approvals console.
 *
 * This surface exists because of a real incident: two sellers registered, HQ
 * showed the owner a COUNT of pending applications, and the only way to approve
 * them was to open the Supabase SQL editor. The count told him a decision was
 * owed; nothing on the page let him make it. So every row here carries its own
 * verdict buttons, and every button crosses one governed endpoint.
 *
 * THE CONSOLE HAS NO AUTHORITY. It renders rows and posts intents. It does not
 * decide who may act, which transitions are legal, or whether a password is
 * needed — `/api/owner/control` re-reads live state and re-checks all of it
 * server-side. Anything this file believes is a convenience for the operator,
 * never a control. The registry it imports is the SAME table the route enforces,
 * so the label on a button and the rule behind it cannot drift apart.
 *
 * IDEMPOTENCY: one key is minted per operator GESTURE and travels in the body.
 * `fetchWithSensitiveAction` replays the identical request after the password
 * modal, so the step-up round trip re-sends the same key and the server's unique
 * index collapses it to one decision. Two taps on the same button are two
 * gestures and two keys — deliberately: the second is a genuine second attempt,
 * and the server's freshly-read state check is what stops it, not a stale token.
 */

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { fetchWithSensitiveAction } from "@henryco/auth/client/sensitive-action-modal";
import DivisionBadge from "@/components/owner/DivisionBadge";
import { OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getOwnerControlAction, type OwnerControlActionKey } from "@/lib/owner-control/registry";
import type { OwnerControlQueue, OwnerControlQueueRow } from "@/lib/owner-control/queues";

type Feedback = { tone: "good" | "warning" | "critical"; message: string };

type ControlResponse = {
  outcome?: string;
  reason?: string;
  error?: string;
  currentStatus?: string;
  recordedOutcome?: string;
};

/**
 * Per-queue copy. Kept beside the console rather than in the server reader
 * because it is presentation: the reader's job is to return true rows, and how
 * a queue introduces itself to the owner is a separate decision that changes far
 * more often than the query does.
 */
const QUEUE_COPY: Record<string, { title: string; description: string; empty: string }> = {
  "seller-applications": {
    title: "Seller applications",
    description:
      "People asking to open a store. Approving one creates the storefront and grants the seller their workspace, so read the pitch before you decide.",
    empty: "No seller applications are waiting.",
  },
  "kyc-submissions": {
    title: "Identity checks",
    description:
      "Customers who submitted a verification document. The document type is shown here; the document itself stays in the verification surface where opening it is separately recorded.",
    empty: "No identity checks are waiting.",
  },
  "teacher-applications": {
    title: "Teaching applications",
    description:
      "People asking to teach on the academy. Approving one grants the instructor role and lets them publish courses.",
    empty: "No teaching applications are waiting.",
  },
  "product-reviews": {
    title: "Listings awaiting review",
    description:
      "Marketplace listings held back from the catalogue, or flagged after going live.",
    empty: "No listings are waiting for review.",
  },
  "moderation-reports": {
    title: "Reported content",
    description:
      "Reports raised across the divisions. Upholding one records the verdict and the reason against the report.",
    empty: "No reports are waiting.",
  },
  "live-sellers": {
    title: "Live sellers",
    description:
      "Every approved and suspended store. Suspending one takes the storefront and all of its listings out of the catalogue and revokes the seller's workspace access immediately. It moves no money — anything already owed to them stays where it is.",
    empty: "No stores are live yet.",
  },
};

function newGestureKey(): string {
  const c = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  // Non-secure contexts and older engines. The key only needs to be unique per
  // gesture within one operator's session — the server namespaces it by actor,
  // action, and entity before it ever reaches the unique index.
  return `k-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function OwnerApprovalsConsole({ queues }: { queues: OwnerControlQueue[] }) {
  const locale = useHenryCoLocale();
  const t = useCallback((text: string) => translateSurfaceLabel(locale, text), [locale]);
  const router = useRouter();

  const [notes, setNotes] = useState<Record<string, string>>({});
  // Identifies the exact button in flight as `${queueId}:${rowId}::${actionKey}`,
  // not just the row. Keyed by row alone, every button on the row read
  // "Working…" at once, so a row mid-suspension looked identical to one mid-
  // reinstatement — the operator could not tell which verdict he had pressed
  // while it was the only moment that knowledge mattered. Every button on the
  // row is still DISABLED together (one decision at a time per record); only the
  // label moves.
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});

  const setRowFeedback = useCallback((rowKey: string, value: Feedback | null) => {
    setFeedback((prev) => {
      const next = { ...prev };
      if (value) next[rowKey] = value;
      else delete next[rowKey];
      return next;
    });
  }, []);

  const run = useCallback(
    async (queueId: string, row: OwnerControlQueueRow, actionKey: OwnerControlActionKey) => {
      const action = getOwnerControlAction(actionKey);
      if (!action) return;

      const rowKey = `${queueId}:${row.id}`;
      const note = (notes[rowKey] ?? "").trim();

      // Client-side note check is a courtesy that saves a round trip. The route
      // enforces the same rule; removing this changes the UX, not the posture.
      if (action.requiresNote && !note) {
        setRowFeedback(rowKey, {
          tone: "warning",
          message: t("Write a reason first — it is recorded against this decision."),
        });
        return;
      }

      const gestureKey = newGestureKey();
      setBusyAction(`${rowKey}::${action.key}`);
      setRowFeedback(rowKey, null);

      try {
        const res = await fetchWithSensitiveAction("/api/owner/control", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Idempotency-Key": gestureKey },
          body: JSON.stringify({
            actionKey: action.key,
            entityId: row.id,
            note,
            idempotencyKey: gestureKey,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as ControlResponse;

        if (res.ok && data.outcome === "applied") {
          setRowFeedback(rowKey, {
            tone: "good",
            message: t("Done — the decision is recorded in the audit log."),
          });
          router.refresh();
          return;
        }
        if (res.ok && data.outcome === "no_op") {
          setRowFeedback(rowKey, {
            tone: "warning",
            message: t("Nothing changed — this record had already moved."),
          });
          router.refresh();
          return;
        }
        if (res.ok && data.outcome === "replayed") {
          setRowFeedback(rowKey, {
            tone: "warning",
            message: t("Already submitted — this decision was recorded once."),
          });
          router.refresh();
          return;
        }
        if (res.status === 409) {
          setRowFeedback(rowKey, {
            tone: "warning",
            message: t("Someone decided this one already. Refreshing the queue."),
          });
          router.refresh();
          return;
        }
        setRowFeedback(rowKey, {
          tone: "critical",
          message: data.error || t("That could not be completed."),
        });
      } catch {
        // A thrown fetch means the request may or may not have reached the
        // server, so the honest message says the outcome is unknown rather than
        // implying nothing happened.
        setRowFeedback(rowKey, {
          tone: "critical",
          message: t("The connection dropped. Refresh to see whether it went through."),
        });
      } finally {
        setBusyAction(null);
      }
    },
    [notes, router, setRowFeedback, t],
  );

  return (
    <div className="space-y-6">
      {queues.map((queue) => {
        const copy = QUEUE_COPY[queue.id];
        if (!copy) return null;
        const actions = queue.actions
          .map((key) => getOwnerControlAction(key))
          .filter((action): action is NonNullable<typeof action> => action !== null);
        const needsNote = actions.some((action) => action.requiresNote);

        return (
          // The queue id doubles as the anchor target. Signals elsewhere in HQ
          // link straight to the queue that answers them (…/approvals#seller-
          // applications), so a "3 sellers waiting" card lands on the buttons
          // rather than on the top of a page the owner then has to scan.
          <div key={queue.id} id={queue.id} className="scroll-mt-24">
          <OwnerPanel
            title={t(copy.title)}
            description={t(copy.description)}
            action={<DivisionBadge division={queue.division} />}
          >
            {queue.unavailable ? (
              <p className="rounded-[1.25rem] border border-[var(--acct-orange-text)]/20 bg-[var(--acct-orange-soft)] px-4 py-3 text-sm text-[var(--acct-orange-text)]">
                {t("This queue could not be read just now, so it is showing nothing rather than pretending it is empty. Refresh to try again.")}
              </p>
            ) : queue.rows.length === 0 ? (
              <p className="text-sm text-[var(--acct-muted)]">{t(copy.empty)}</p>
            ) : (
              <ul className="space-y-3">
                {queue.rows.map((row) => {
                  const rowKey = `${queue.id}:${row.id}`;
                  const rowBusy = busyAction !== null && busyAction.startsWith(`${rowKey}::`);
                  const rowFeedback = feedback[rowKey];
                  // Only offer verdicts this record is actually eligible for —
                  // a suspended store gets "Reinstate", a live one gets
                  // "Suspend". The server re-checks; this keeps the console from
                  // showing a button that is guaranteed to be refused.
                  const rowStatus = row.status.trim().toLowerCase();
                  const rowActions = actions.filter((action) =>
                    action.fromStates.includes(rowStatus),
                  );

                  return (
                    <li
                      key={row.id}
                      className="rounded-[1.25rem] border border-[var(--acct-line)] bg-[var(--acct-bg-soft)] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--acct-ink)]">{row.title}</p>
                          <p className="mt-1 text-sm text-[var(--acct-muted)]">{row.subtitle}</p>
                        </div>
                        <span className="acct-chip acct-chip-gold shrink-0">{row.status}</span>
                      </div>

                      {row.evidence.length ? (
                        <dl className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                          {row.evidence.map((fact) => (
                            <div key={fact.label} className="min-w-0">
                              <dt className="text-[10px] font-semibold uppercase tracking-wider text-[var(--acct-muted)]">
                                {t(fact.label)}
                              </dt>
                              <dd className="break-words text-sm text-[var(--acct-ink)]">
                                {fact.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ) : null}

                      {needsNote ? (
                        <label className="mt-3 block">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--acct-muted)]">
                            {t("Reason")}
                          </span>
                          <textarea
                            className="acct-input mt-1 min-h-[4.5rem] resize-y"
                            value={notes[rowKey] ?? ""}
                            disabled={rowBusy}
                            placeholder={t("Required for anything other than a straight approval.")}
                            onChange={(event) =>
                              setNotes((prev) => ({ ...prev, [rowKey]: event.target.value }))
                            }
                          />
                        </label>
                      ) : null}

                      {rowActions.length ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {rowActions.map((action) => (
                            <button
                              key={action.key}
                              type="button"
                              disabled={rowBusy}
                              className={
                                action.tone === "danger"
                                  ? "acct-button-danger"
                                  : action.tone === "primary"
                                    ? "acct-button-primary"
                                    : "acct-button-secondary"
                              }
                              onClick={() => void run(queue.id, row, action.key)}
                            >
                              {busyAction === `${rowKey}::${action.key}`
                                ? t("Working…")
                                : t(action.label)}
                            </button>
                          ))}
                          {rowActions.some((action) => action.requiresReauth) ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--acct-muted)]">
                              <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
                              {t("Asks for your password")}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <p className="mt-3 text-xs text-[var(--acct-muted)]">
                          {t("No action is available from this state.")}
                        </p>
                      )}

                      {rowFeedback ? (
                        <p
                          role="status"
                          className={`mt-3 text-sm ${
                            rowFeedback.tone === "good"
                              ? "text-[var(--acct-green-text)]"
                              : rowFeedback.tone === "critical"
                                ? "text-[var(--acct-red-text)]"
                                : "text-[var(--acct-orange-text)]"
                          }`}
                        >
                          {rowFeedback.message}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}

            {/*
              Said HERE as well as in the page banner, and deliberately not only
              there. The banner is above the fold; a truncated queue is found by
              someone who has scrolled to the bottom of a long list, and the
              bottom of a capped list is exactly where it looks complete. The
              reader caps rows rather than counting the remainder, so this says
              "more" and not a number it would have to invent.
            */}
            {queue.truncated ? (
              <p className="mt-3 text-xs text-[var(--acct-muted)]">
                {t("Showing the oldest waiting first, and this queue is full — there are more behind these. Decide some and reload to pull in the rest.")}
              </p>
            ) : null}
          </OwnerPanel>
          </div>
        );
      })}
    </div>
  );
}
