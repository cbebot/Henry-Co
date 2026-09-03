"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Code2, Save } from "lucide-react";
import {
  ActionButton,
  EmptyState,
  Panel,
  Section,
} from "@henryco/dashboard-shell/components";
import { CSS_VARS } from "@henryco/dashboard-shell/tokens";

/**
 * CollabEditorPane — Yjs-backed shared code editor for technical interviews.
 *
 * Wave A2 ships a SCAFFOLD: the editor is a controlled `<textarea>` with
 * a language + linter selection, persisted via a host-supplied `onSave`
 * callback. The full Yjs CRDT layer requires either:
 *
 *   1. A `room_documents` schema extension (one row per editor doc per
 *      session, jsonb body + Yjs vector clock columns), OR
 *   2. A separate Yjs-over-WebSocket service (e.g. y-websocket).
 *
 * Both are out of Wave A2 scope per audit §4.3 (the pane is shipped
 * scaffolded; Yjs persistence is a follow-up coordinated with the
 * conductor). The interface accepts a `useCollabSource` hook prop so a
 * subsequent pass can plug in a real CRDT source without consumer
 * rewrites.
 *
 * This is intentional and surfaced in the README + report as a PARTIAL
 * deliverable.
 *
 * Wave C (Jobs interview) consumes this; for the interview happy-path
 * the scaffolded controlled-textarea is functionally sufficient (one
 * candidate types, the interviewer watches via screen share OR a
 * synchronized poll-and-save cycle).
 *
 * `// TODO Wave-A2-FOLLOWUP: Yjs binding`.
 */

export type CollabEditorSource = {
  /** Read the current editor body. */
  read: () => string;
  /** Apply a local edit. */
  write: (value: string) => void;
  /** Subscribe to remote edits. Returns an unsubscribe fn. */
  subscribe: (handler: (value: string) => void) => () => void;
};

export type CollabEditorPaneProps = {
  sessionId: string;
  /**
   * Optional collaborative source. When omitted, the pane operates in
   * single-author scaffold mode: edits are local until `onSave` is called.
   */
  source?: CollabEditorSource;
  /**
   * Persist callback — fires on Save button click. Returns a promise so
   * the button can show a spinner.
   */
  onSave?: (body: string, meta: { language: string }) => Promise<void>;
  /** Initial body if no source. */
  initial?: string;
  /** Supported languages — used to render the select. */
  languages?: ReadonlyArray<{ value: string; label: string }>;
  /** Initial language. */
  initialLanguage?: string;
  /** Optional kicker. */
  kicker?: string;
  /** Title. */
  title?: string;
};

const DEFAULT_LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "rust", label: "Rust" },
  { value: "go", label: "Go" },
  { value: "java", label: "Java" },
  { value: "sql", label: "SQL" },
  { value: "shell", label: "Shell" },
  { value: "markdown", label: "Markdown" },
  { value: "plaintext", label: "Plain text" },
] as const;

export function CollabEditorPane({
  sessionId,
  source,
  onSave,
  initial = "",
  languages = DEFAULT_LANGUAGES,
  initialLanguage = "javascript",
  kicker = "Live editor",
  title = "Collab editor",
}: CollabEditorPaneProps) {
  const [body, setBody] = useState<string>(() => source?.read() ?? initial);
  const [language, setLanguage] = useState(initialLanguage);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const lastRemoteRef = useRef<string>(body);

  // Subscribe to remote edits — debounced so the host textarea doesn't
  // fight the user mid-typing. If the local body matches the last remote
  // we saw, accept remote as authoritative; otherwise stash the remote
  // for the next idle moment.
  useEffect(() => {
    if (!source) return;
    const unsubscribe = source.subscribe((remote) => {
      if (remote === lastRemoteRef.current) return;
      lastRemoteRef.current = remote;
      setBody((current) => {
        if (current === lastRemoteRef.current) return current;
        // Accept remote when local equals the previous remote (user
        // hasn't typed since). Otherwise leave local untouched — the
        // next local edit will overwrite remote.
        return remote;
      });
    });
    return unsubscribe;
  }, [source]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const next = e.target.value;
      setBody(next);
      source?.write(next);
    },
    [source],
  );

  const handleSave = useCallback(async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(body, { language });
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    } finally {
      setSaving(false);
    }
  }, [body, language, onSave]);

  const placeholder = useMemo(
    () =>
      language === "javascript"
        ? "// Start typing — your collaborator sees your edits."
        : language === "typescript"
          ? "// Start typing — your collaborator sees your edits."
          : language === "python"
            ? "# Start typing — your collaborator sees your edits."
            : "Start typing — your collaborator sees your edits.",
    [language],
  );

  if (!sessionId) {
    return (
      <Panel tone="flat" padding="lg">
        <EmptyState
          kicker={kicker}
          headline="No session bound"
          body="The collab editor requires a session id to persist edits."
        />
      </Panel>
    );
  }

  return (
    <Panel tone="flat" padding="lg" aria-label={title}>
      <Section
        kicker={kicker}
        headline={title}
        action={
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="Editor language"
            style={{
              padding: "0.35rem 0.65rem",
              borderRadius: "0.5rem",
              border: `1px solid var(${CSS_VARS.hairline})`,
              backgroundColor: `var(${CSS_VARS.surface})`,
              color: `var(${CSS_VARS.ink})`,
              fontSize: "0.85rem",
            }}
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        }
      >
        <p
          style={{
            margin: 0,
            fontSize: "0.85rem",
            color: `var(${CSS_VARS.inkMuted})`,
          }}
        >
          {source
            ? "Real-time edits are synced with everyone in the room."
            : "Edits are local until you save."}
        </p>
      </Section>
      <textarea
        value={body}
        onChange={handleChange}
        placeholder={placeholder}
        spellCheck={false}
        rows={16}
        aria-label={`Editor for ${language}`}
        style={{
          width: "100%",
          minHeight: "20rem",
          resize: "vertical",
          padding: "0.85rem 1rem",
          borderRadius: "0.75rem",
          border: `1px solid var(${CSS_VARS.hairline})`,
          backgroundColor: `var(${CSS_VARS.surfaceElevated})`,
          color: `var(${CSS_VARS.ink})`,
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          fontSize: "0.9rem",
          lineHeight: 1.55,
          tabSize: 2,
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          marginTop: "0.75rem",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            fontSize: "0.85rem",
            color: `var(${CSS_VARS.inkMuted})`,
          }}
        >
          <Code2 size={14} aria-hidden />
          {body.length.toLocaleString()} chars
        </span>
        {onSave ? (
          <ActionButton
            tone="secondary"
            onClick={handleSave}
            spinner={saving}
            success={saved}
            icon={<Save size={16} aria-hidden />}
          >
            {saved ? "Saved" : "Save"}
          </ActionButton>
        ) : null}
      </div>
    </Panel>
  );
}
