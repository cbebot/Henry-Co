// ---------------------------------------------------------------------------
// Messaging chrome copy — the single source of truth for the localized
// "chrome" strings of the shared messaging engine (`@henryco/chat-composer`
// + `@henryco/messaging-thread`).
//
// The engine packages are deliberately i18n-agnostic: they accept label
// strings and fall back to English literals. Every division (account,
// studio, jobs, marketplace) renders the SAME composer + thread chrome, so
// rather than duplicate the translation wiring four times, this builder
// centralizes it. A division calls `buildMessagingChromeLabels(t)` with its
// own bound translator and passes the result straight onto `<MessageThread>`:
//
//   const { composerLabels, threadLabels } = buildMessagingChromeLabels(t);
//   <MessageThread composerLabels={composerLabels} {...threadLabels} … />
//
// Contract:
//   • Every value is `t("<English source>")` where the English source is
//     byte-identical to the engine's English default — so when locale = en
//     (or t is identity) the rendered chrome is unchanged from today.
//   • ig / yo / ha / hi resolve to the EN baseline via the surface-label
//     system (no machine translation) — handled by `t`, not here.
//   • Brand names are NOT used in chrome, so none appear here.
//   • This module imports NOTHING from the engine packages — it returns
//     plain objects; the division mounts pass them to the engine's typed
//     props. Keeping `@henryco/i18n` free of an engine dependency is a hard
//     boundary (the engine must never depend on i18n and vice-versa).
// ---------------------------------------------------------------------------

/** Composer chrome labels — structurally a superset-safe match for
 *  `ComposerLabels` from `@henryco/chat-composer` (all keys optional there;
 *  required here so the builder always emits a complete set). */
export type MessagingChromeComposerLabels = {
  placeholder: string;
  sendLabel: string;
  sendingLabel: string;
  attachLabel: string;
  expandLabel: string;
  collapseLabel: string;
  fullScreenTitleLabel: string;
  draftSavedLabel: string;
  discardDraftLabel: string;
  removeAttachmentLabel: string;
  retryUploadLabel: string;
  failedSendLabel: string;
  composerAriaLabel: string;
  bodyAriaLabel: string;
  dropToAttachLabel: string;
  srSendingLabel: string;
  uploadingLabel: string;
  attachmentFailedLabel: string;
  attachmentListLabel: string;
  savingLabel: string;
};

/** Thread chrome labels — structurally matches the new optional props on
 *  `MessageThreadProps` from `@henryco/messaging-thread`. Spread directly
 *  onto `<MessageThread>`. */
export type MessagingChromeThreadLabels = {
  liveLabel: string;
  realtimeAriaLabel: string;
  reconnectingLabel: string;
  failedSendLabel: string;
  editedLabel: string;
  ownNameLabel: string;
  statusLabels: {
    sending: string;
    sent: string;
    delivered: string;
    read: string;
  };
  typingLabel: (names: string[]) => string;
};

export type MessagingChromeLabels = {
  composerLabels: MessagingChromeComposerLabels;
  threadLabels: MessagingChromeThreadLabels;
};

/**
 * Build the localized chrome labels for the shared messaging engine.
 *
 * @param t A translator bound to the active locale. `t("English source")`
 *          returns the localized string, or the English source itself when
 *          locale = en (or for the no-machine-translation locales). Identity
 *          `t` therefore yields the engine's exact English defaults.
 */
export function buildMessagingChromeLabels(
  t: (s: string) => string,
): MessagingChromeLabels {
  return {
    composerLabels: {
      // existing ComposerLabels keys
      placeholder: t("Write a message…"),
      sendLabel: t("Send"),
      sendingLabel: t("Sending…"),
      attachLabel: t("Attach"),
      expandLabel: t("Expand composer"),
      collapseLabel: t("Collapse composer"),
      fullScreenTitleLabel: t("Compose"),
      draftSavedLabel: t("Draft saved"),
      discardDraftLabel: t("Discard draft"),
      removeAttachmentLabel: t("Remove attachment"),
      retryUploadLabel: t("Retry upload"),
      // composer attachment-upload failure (distinct from the thread-level
      // send failure below)
      failedSendLabel: t(
        "One or more attachments failed to upload — retry or remove them first.",
      ),
      // new ComposerLabels keys
      composerAriaLabel: t("Message composer"),
      bodyAriaLabel: t("Message body"),
      dropToAttachLabel: t("Drop to attach"),
      srSendingLabel: t("Sending message"),
      uploadingLabel: t("Uploading…"),
      attachmentFailedLabel: t("Failed"),
      attachmentListLabel: t("Attached files"),
      savingLabel: t("Saving…"),
    },
    threadLabels: {
      liveLabel: t("Live"),
      realtimeAriaLabel: t("Realtime updates are live"),
      reconnectingLabel: t("Reconnecting…"),
      // thread-level message send failure (distinct from the composer
      // attachment failure above)
      failedSendLabel: t("We couldn't send the message. Try again."),
      editedLabel: t("(edited)"),
      ownNameLabel: t("You"),
      statusLabels: {
        sending: t("Sending…"),
        sent: t("Sent"),
        delivered: t("Delivered"),
        read: t("Read"),
      },
      // Reproduces the engine's TypingIndicator output exactly for en:
      //   1  → "{name} is typing"
      //   2  → "{a} and {b} are typing"
      //   3+ → "{a} and {n} others are typing"
      // using t() only on the connectors, so identity-t is byte-identical.
      typingLabel: (names: string[]): string => {
        if (names.length === 1) {
          return `${names[0]} ${t("is typing")}`;
        }
        if (names.length === 2) {
          return `${names[0]} ${t("and")} ${names[1]} ${t("are typing")}`;
        }
        return `${names[0]} ${t("and")} ${names.length - 1} ${t(
          "others are typing",
        )}`;
      },
    },
  };
}
