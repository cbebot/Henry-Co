"use client";

/**
 * FounderCommandPortal — the founder's full-screen command cockpit (the "portal").
 *
 * A real software cockpit for the owner of Henry Onyx, in the HUD language of a
 * command reactor (onyx + gold, not a chat bubble): the living IntelligenceCore
 * framed by targeting brackets, a live clock, a SYS activity log, voice in
 * (SpeechRecognition) and out (SpeechSynthesis), the live company briefing, and
 * the F3 governed-action cards (the owner's real ecosystem actions) inline. It
 * reuses the ONE chat engine (useIntelligenceChat) and the shared F3 extras — so
 * the brain + action flow are identical to the dock/launcher; only the shell is
 * bespoke.
 *
 * Endpoints (owner-origin, requireOwner-gated, 404 while the flag is dark):
 *   endpoint / briefingEndpoint / conversationsEndpoint — as the dock.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { ChatThreadMessage } from "@henryco/chat-thread";
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  Type,
  X,
  PenLine,
  ArrowUpRight,
  Radio,
  History,
  Trash2,
  Navigation,
} from "lucide-react";
import { HenryCoLockup } from "../brand";
import {
  useIntelligenceChat,
  type IntelligenceDivision,
  type StoredIntelligenceMessage,
} from "./use-intelligence-chat";
import { useFounderVoice } from "./use-founder-voice";
import { IntelligenceCore, type CoreMode } from "./IntelligenceCore";
import { IntelligenceExtras } from "./IntelligenceExtras";
import { IntelligenceLauncherStyles } from "./IntelligenceLauncher";
import { getAccountUrl } from "@henryco/config";
import { FounderCommandPortalStyles } from "./FounderCommandPortalStyles";

export interface FounderCommandPortalProps {
  division: IntelligenceDivision;
  endpoint: string;
  briefingEndpoint: string;
  conversationsEndpoint: string;
  accent?: string;
}

type Briefing = {
  headline: string;
  focus: string;
  nextSteps: Array<{ title: string; href: string; severity?: string }>;
  /** Live company pulse — pre-formatted metric chips rendered under the reactor. */
  pulse?: Array<{ label: string; value: string }>;
  generatedAt?: string;
};
type ConversationSummary = { id: string; title: string | null; updatedAt: string | null };

const OPEN_KEY = "hc-founder-portal:open";
const LOG_MAX = 7;

/**
 * Idle-state command seeds — the "what can I ask?" surface. These are
 * conversation starters (they call doSend), distinct from the briefing's
 * next-steps (which navigate). Kept short and owner-real; each is run through
 * t() so it stays inside the localized copy world.
 */
const COMMAND_SEEDS = [
  "Brief me on the company right now",
  "What needs my attention today?",
  "How is revenue tracking this period?",
  "Show me any critical signals",
] as const;

export function FounderCommandPortal({
  division,
  endpoint,
  briefingEndpoint,
  conversationsEndpoint,
  accent = "#C9A227",
}: FounderCommandPortalProps) {
  const chat = useIntelligenceChat({ division, endpoint });
  const { t, messages, typing, send, hydrate, reset, proposedAction, actionOutcome } = chat;

  const [open, setOpen] = useState(false);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clock, setClock] = useState("");
  const [log, setLog] = useState<string[]>([]);
  // The hook's send() appends only the ASSISTANT reply to chat.messages and
  // returns the user turn for a host composer to render optimistically (that's
  // how the ChatThread-based dock shows it). The portal renders the thread
  // itself, so it owns the sent user turns here and merges them with
  // chat.messages by timestamp for display.
  const [sentTurns, setSentTurns] = useState<ChatThreadMessage[]>([]);
  const loadedRef = useRef(false);
  const turnSeqRef = useRef(0);
  const fabRef = useRef<HTMLButtonElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const spokenRef = useRef<string | null>(null);

  const pushLog = useCallback((line: string) => {
    setLog((prev) => [...prev, line].slice(-LOG_MAX));
  }, []);

  const setOpenPersisted = useCallback((next: boolean) => {
    setOpen(next);
    try {
      window.localStorage.setItem(OPEN_KEY, next ? "1" : "0");
    } catch {
      /* best-effort */
    }
  }, []);

  const doSend = useCallback(
    async (text: string) => {
      const body = text.trim();
      if (!body || sending) return;
      setSending(true);
      setError(null);
      setDraft("");
      // Optimistic user turn — shown immediately (event handler, so new Date() is
      // safe here, unlike render). Rolled back if the send fails so a failed
      // transmission never leaves a dangling question with no answer.
      const turnId = `u-${(turnSeqRef.current += 1)}`;
      const userTurn: ChatThreadMessage = {
        id: turnId,
        authorId: "you",
        authorRole: "viewer",
        body,
        createdAt: new Date().toISOString(),
      };
      setSentTurns((prev) => [...prev, userTurn]);
      pushLog("SYS: Query transmitted.");
      const result = await send({ body });
      if (!result.ok) {
        setError(result.reason || t("That didn't go through."));
        setSentTurns((prev) => prev.filter((turn) => turn.id !== turnId));
        pushLog("SYS: Transmission failed.");
      } else {
        pushLog("SYS: Response received.");
      }
      setSending(false);
    },
    [send, sending, t, pushLog],
  );

  // New conversation — the hook's reset() clears chat.messages; also drop the
  // locally-owned user turns so the thread starts truly empty.
  const activeConvIdRef = useRef<string | null>(null);
  const newConversation = useCallback(() => {
    reset();
    setSentTurns([]);
    spokenRef.current = null;
    activeConvIdRef.current = null;
    pushLog("SYS: New session.");
  }, [reset, pushLog]);

  // ── Recent conversations (history / open / delete) ────────────────────────
  const [recentOpen, setRecentOpen] = useState(false);
  const [recent, setRecent] = useState<ConversationSummary[]>([]);
  const [recentBusy, setRecentBusy] = useState<string | null>(null);

  const loadRecent = useCallback(async () => {
    try {
      const res = await fetch(conversationsEndpoint, { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json().catch(() => null)) as { conversations?: ConversationSummary[] } | null;
      setRecent(data?.conversations ?? []);
    } catch {
      /* panel simply shows what it has */
    }
  }, [conversationsEndpoint]);

  const openConversation = useCallback(
    async (id: string) => {
      setRecentBusy(id);
      try {
        const res = await fetch(`${conversationsEndpoint}?id=${encodeURIComponent(id)}`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const detail = (await res.json().catch(() => null)) as { messages?: StoredIntelligenceMessage[] } | null;
        if (!detail?.messages?.length) return;
        setSentTurns([]);
        spokenRef.current = null;
        hydrate(id, detail.messages);
        activeConvIdRef.current = id;
        setRecentOpen(false);
        pushLog("SYS: Session restored.");
      } finally {
        setRecentBusy(null);
      }
    },
    [conversationsEndpoint, hydrate, pushLog],
  );

  const deleteConversation = useCallback(
    async (id: string) => {
      setRecentBusy(id);
      try {
        const res = await fetch(`${conversationsEndpoint}?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) return;
        setRecent((prev) => prev.filter((c) => c.id !== id));
        pushLog("SYS: Conversation erased.");
        if (activeConvIdRef.current === id) newConversation();
      } finally {
        setRecentBusy(null);
      }
    },
    [conversationsEndpoint, newConversation, pushLog],
  );

  // ── Autopilot — voice-driven console control ──────────────────────────────
  // When the assistant's reply carries a navigation target and autopilot is
  // engaged, the portal flies the console there itself after speaking (voice
  // mode only — in text mode the buttons stay manual). The portal reopens on
  // the destination page and restores the conversation, so the thread follows
  // the owner across the console.
  const [autopilot, setAutopilot] = useState(true);
  const autopilotRef = useRef(true);
  useEffect(() => {
    autopilotRef.current = autopilot;
  }, [autopilot]);
  const actionsRef = useRef<typeof chat.actions>([]);
  useEffect(() => {
    actionsRef.current = chat.actions;
  }, [chat.actions]);

  // ── Voice Mark II — the conversation loop ─────────────────────────────────
  // Voice mode is a real turn loop: the owner speaks → the reply is spoken →
  // the mic re-opens by itself. Refs mirror open/voiceMode so continuations
  // that run after an await read CURRENT state, and a silent-turn counter
  // stands the loop down after repeated silence instead of holding the mic
  // open forever.
  const voiceModeRef = useRef(true);
  const openRef = useRef(false);
  const silentTurnsRef = useRef(0);
  const startListeningRef = useRef<() => void>(() => {});
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const voice = useFounderVoice({
    onFinal: (text) => {
      silentTurnsRef.current = 0;
      setVoiceNotice(null);
      if (voiceModeRef.current) {
        // Voice mode: a finished utterance IS the command — send it.
        void doSend(text);
      } else {
        // Text mode: the mic is dictation — drop the words into the composer
        // for editing, never auto-send.
        setDraft((prev) => (prev ? `${prev.trimEnd()} ${text}` : text));
      }
    },
    onError: (kind) => {
      if (kind === "mic-denied") {
        setVoiceNotice(
          t("Microphone blocked. Allow microphone access for this site in your browser, then try again."),
        );
        pushLog("SYS: Microphone access denied by the browser.");
        return;
      }
      if (kind === "unavailable") {
        setVoiceNotice(t("Voice input isn't available in this browser. You can still type."));
        pushLog("SYS: Voice input unavailable here.");
        return;
      }
      if (kind === "network") {
        pushLog("SYS: Speech service unreachable.");
        return;
      }
      // no-speech — conversation loop: one quiet retry, then stand down.
      if (voiceModeRef.current && openRef.current && silentTurnsRef.current < 1) {
        silentTurnsRef.current += 1;
        startListeningRef.current();
      } else {
        silentTurnsRef.current = 0;
        pushLog("SYS: Standing by.");
      }
    },
  });
  const { listening, speaking, transcript, muted, setMuted, canListen, canSpeak, startListening, stopListening, speak } =
    voice;
  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  // Text / voice mode. Voice mode speaks replies aloud and leads with the mic;
  // text mode is silent and keyboard-first. The mode drives the mute state,
  // and leaving voice mode releases the mic immediately.
  const [voiceMode, setVoiceMode] = useState(true);
  useEffect(() => {
    voiceModeRef.current = voiceMode;
    setMuted(!voiceMode);
    if (!voiceMode) stopListening();
  }, [voiceMode, setMuted, stopListening]);
  useEffect(() => {
    openRef.current = open;
    if (!open) stopListening();
  }, [open, stopListening]);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(OPEN_KEY) === "1") setOpen(true);
    } catch {
      /* closed */
    }
  }, []);

  // Live clock (client-only; never during render).
  useEffect(() => {
    if (!open) return;
    const tick = () => {
      const d = new Date();
      const p = (n: number) => String(n).padStart(2, "0");
      setClock(`${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [open]);

  // Ctrl+Shift+A toggles; Escape closes.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const toggle =
        (event.ctrlKey || event.metaKey) && event.shiftKey && (event.key === "a" || event.key === "A");
      if (toggle) {
        const el = event.target as HTMLElement | null;
        if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
        event.preventDefault();
        setOpenPersisted(!open);
        return;
      }
      if (event.key === "Escape" && open) {
        setOpenPersisted(false);
        fabRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpenPersisted]);

  // First open: online log + briefing + restore.
  useEffect(() => {
    if (!open || loadedRef.current) return;
    loadedRef.current = true;
    let cancelled = false;
    pushLog("SYS: Henry Onyx Intelligence online.");

    void fetch(briefingEndpoint, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Briefing | null) => {
        if (!cancelled && data && typeof data.headline === "string") {
          setBriefing(data);
          pushLog("SYS: Company briefing synced.");
        }
      })
      .catch(() => undefined);

    void fetch(conversationsEndpoint, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then(async (data: { conversations?: ConversationSummary[] } | null) => {
        const latest = data?.conversations?.[0];
        if (cancelled || !latest?.id) return;
        const res = await fetch(`${conversationsEndpoint}?id=${encodeURIComponent(latest.id)}`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const detail = (await res.json().catch(() => null)) as { messages?: StoredIntelligenceMessage[] } | null;
        if (cancelled || !detail?.messages?.length) return;
        hydrate(latest.id, detail.messages);
        activeConvIdRef.current = latest.id;
        pushLog("SYS: Prior session restored.");
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [open, briefingEndpoint, conversationsEndpoint, hydrate, pushLog]);

  // Log voice + action transitions (the "SYS:" feed).
  useEffect(() => {
    if (open) pushLog(listening ? "SYS: Microphone active." : "SYS: Microphone idle.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening]);
  useEffect(() => {
    if (open && proposedAction) pushLog(`SYS: Action ready — ${proposedAction.title}.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposedAction]);
  useEffect(() => {
    if (open && actionOutcome) {
      pushLog(actionOutcome.kind === "executed" ? "SYS: Action executed — live." : "SYS: Action not applied.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionOutcome]);

  // Speak each new assistant reply aloud, then — in voice mode — either FLY
  // the console to the reply's destination (autopilot) or reopen the mic (the
  // Jarvis turn loop: you speak, it answers, it listens again). Continuations
  // read refs, not captured state, because the owner may have closed the
  // portal or switched modes while it was talking.
  useEffect(() => {
    if (!open || muted) return;
    const last = messages[messages.length - 1];
    if (last && last.authorRole === "other" && last.id !== spokenRef.current) {
      spokenRef.current = last.id;
      void speak(last.body).then(() => {
        if (!openRef.current || typeof document === "undefined") return;
        // Autopilot: hub-relative catalog destinations only, voice mode only.
        const destination = actionsRef.current[0];
        if (
          autopilotRef.current &&
          voiceModeRef.current &&
          destination &&
          destination.href.startsWith("/") &&
          !destination.href.startsWith("//")
        ) {
          pushLog(`SYS: Autopilot — opening ${destination.label}.`);
          window.location.assign(destination.href);
          return;
        }
        if (voiceModeRef.current && document.visibilityState === "visible") {
          startListeningRef.current();
        }
      });
    }
  }, [messages, open, muted, speak, pushLog]);

  // The visible thread = the hook's messages (assistant replies + any hydrated
  // history, which already carries its own user turns) merged with the locally
  // owned live user turns, ordered by timestamp. Hydrated turns and live turns
  // never collide (distinct ids), and the user turn always predates its reply.
  const displayThread = useMemo(() => {
    if (sentTurns.length === 0) return messages;
    return [...messages, ...sentTurns].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [messages, sentTurns]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [displayThread, typing]);

  const coreMode: CoreMode = listening ? "listening" : speaking ? "speaking" : typing || sending ? "thinking" : "idle";
  const hasConversation = displayThread.length > 0;
  const supportHref = getAccountUrl("/support");
  const portalStyle = useMemo(() => ({ ["--fcp-accent" as string]: accent }) as CSSProperties, [accent]);

  const statusLabel = listening
    ? t("Listening")
    : speaking
      ? t("Speaking")
      : typing || sending
        ? t("Processing")
        : t("Ready");

  return (
    <>
      {/* The F3 extras (governed-action cards + nav chips) are the shared
          IntelligenceExtras block styled by the .hc-il-* seam-token rules; the
          portal supplies onyx-tuned token VALUES on .fcp-extras below so those
          cards read as part of the cockpit, not a light chat panel. */}
      <IntelligenceLauncherStyles />
      <FounderCommandPortalStyles />

      {!open ? (
        <button
          ref={fabRef}
          type="button"
          className="fcp-fab"
          style={portalStyle}
          onClick={() => setOpenPersisted(true)}
          aria-label={t("Open Founder Intelligence")}
          title={`${t("Founder Intelligence")} (Ctrl+Shift+A)`}
        >
          <Radio className="fcp-fab-icon" aria-hidden />
        </button>
      ) : null}

      {open ? (
        <div className="fcp-portal" style={portalStyle} role="dialog" aria-modal="true" aria-label={t("Founder Intelligence")}>
          <div className="fcp-ambient" aria-hidden />
          <div className="fcp-grid" aria-hidden />

          <header className="fcp-top">
            <span className="fcp-brand">
              <HenryCoLockup height={24} accent="var(--fcp-accent)" />
              <span className="fcp-mark">{t("Founder Intelligence")} · MARK I</span>
            </span>
            <span className="fcp-clock" aria-hidden>{clock}</span>
            <span className="fcp-top-actions">
              <span className="fcp-mode" role="group" aria-label={t("Mode")}>
                <button type="button" className={`fcp-mode-btn${voiceMode ? " fcp-mode-btn--on" : ""}`}
                  onClick={() => setVoiceMode(true)} aria-pressed={voiceMode} title={t("Voice mode")}>
                  <Volume2 aria-hidden /> {t("Voice")}
                </button>
                <button type="button" className={`fcp-mode-btn${!voiceMode ? " fcp-mode-btn--on" : ""}`}
                  onClick={() => setVoiceMode(false)} aria-pressed={!voiceMode} title={t("Text mode")}>
                  <Type aria-hidden /> {t("Text")}
                </button>
              </span>
              <button
                type="button"
                className={`fcp-auto${autopilot ? " fcp-auto--on" : ""}`}
                onClick={() => setAutopilot((v) => !v)}
                aria-pressed={autopilot}
                title={t("Autopilot — I open the right console page for you after answering")}
              >
                <Navigation aria-hidden /> {t("Auto")}
              </button>
              <button
                type="button"
                className={`fcp-icon-btn${recentOpen ? " fcp-icon-btn--on" : ""}`}
                onClick={() => {
                  setRecentOpen((v) => {
                    const next = !v;
                    if (next) void loadRecent();
                    return next;
                  });
                }}
                aria-expanded={recentOpen}
                aria-label={t("Recent conversations")}
                title={t("Recent conversations")}
              >
                <History aria-hidden />
              </button>
              <button type="button" className="fcp-icon-btn" onClick={newConversation}
                aria-label={t("New conversation")} title={t("New conversation")}>
                <PenLine aria-hidden />
              </button>
              <button type="button" className="fcp-icon-btn fcp-close" onClick={() => setOpenPersisted(false)}
                aria-label={t("Close")} title={t("Close (Esc)")}>
                <X aria-hidden />
              </button>
            </span>
          </header>

          {recentOpen ? (
            <div className="fcp-recent" role="region" aria-label={t("Recent conversations")}>
              <p className="fcp-recent-title">{t("Recent conversations")}</p>
              {recent.length === 0 ? (
                <p className="fcp-recent-empty">{t("Nothing here yet — your conversations will appear as you talk.")}</p>
              ) : (
                <ul className="fcp-recent-list">
                  {recent.map((conversation) => (
                    <li key={conversation.id} className="fcp-recent-row">
                      <button
                        type="button"
                        className="fcp-recent-open"
                        onClick={() => void openConversation(conversation.id)}
                        disabled={recentBusy === conversation.id}
                      >
                        <span className="fcp-recent-name">{conversation.title || t("Conversation")}</span>
                        {conversation.updatedAt ? (
                          <span className="fcp-recent-when">{conversation.updatedAt.slice(0, 16).replace("T", " ")}</span>
                        ) : null}
                      </button>
                      <button
                        type="button"
                        className="fcp-recent-del"
                        onClick={() => void deleteConversation(conversation.id)}
                        disabled={recentBusy === conversation.id}
                        aria-label={t("Delete conversation")}
                        title={t("Delete conversation")}
                      >
                        <Trash2 aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          <div className="fcp-stage">
            <div className={`fcp-reactor${hasConversation ? " fcp-reactor--compact" : ""}`}>
              <span className="fcp-bracket fcp-bracket--tl" aria-hidden />
              <span className="fcp-bracket fcp-bracket--tr" aria-hidden />
              <span className="fcp-bracket fcp-bracket--bl" aria-hidden />
              <span className="fcp-bracket fcp-bracket--br" aria-hidden />
              <IntelligenceCore mode={coreMode} size={hasConversation ? 150 : 232} className="fcp-core" />
              <span className="fcp-core-status" data-mode={coreMode}>
                <span className="fcp-core-status-dot" aria-hidden />
                {statusLabel}
              </span>
            </div>

            {!hasConversation ? (
              <div className="fcp-hero-copy">
                <p className="fcp-eyebrow">{t("Henry Onyx Intelligence")}</p>
                <h1 className="fcp-headline">{briefing?.headline || t("What do you want to do?")}</h1>
                {briefing?.focus ? <p className="fcp-focus">{briefing.focus}</p> : null}

                {/* Live company pulse — real numbers, straight from the same
                    dataset the console renders. The machine is alive. */}
                {briefing?.pulse?.length ? (
                  <div className="fcp-pulse" aria-label={t("Live company pulse")}>
                    {briefing.pulse.map((metric) => (
                      <span key={metric.label} className="fcp-pulse-chip">
                        <span className="fcp-pulse-label">{metric.label}</span>
                        <span className="fcp-pulse-value">{metric.value}</span>
                      </span>
                    ))}
                  </div>
                ) : null}

                {/* Command seeds — tap to ask. The active heart of the idle state:
                    this is a command surface, so it leads with what you can say. */}
                <div className="fcp-cmds" role="group" aria-label={t("Suggested commands")}>
                  {COMMAND_SEEDS.map((seed) => (
                    <button
                      key={seed}
                      type="button"
                      className="fcp-cmd"
                      onClick={() => void doSend(t(seed))}
                      disabled={sending}
                    >
                      <span className="fcp-cmd-spark" aria-hidden />
                      {t(seed)}
                    </button>
                  ))}
                </div>

                {briefing?.nextSteps?.length ? (
                  <div className="fcp-briefing-steps">
                    {briefing.nextSteps.slice(0, 4).map((s) => (
                      <a key={s.href} href={s.href} className={`fcp-step fcp-step--${s.severity || "calm"}`}>
                        {s.title}
                        <ArrowUpRight className="fcp-step-icon" aria-hidden />
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="fcp-thread" ref={scrollRef}>
                {displayThread.map((m) => (
                  <div key={m.id} className={`fcp-turn ${m.authorRole === "viewer" ? "fcp-turn--you" : "fcp-turn--ai"}`}>
                    {m.authorRole === "other" ? <span className="fcp-turn-mark" aria-hidden /> : null}
                    <p className="fcp-turn-body">{m.body}</p>
                  </div>
                ))}
                {typing ? (
                  <div className="fcp-turn fcp-turn--ai">
                    <span className="fcp-turn-mark" aria-hidden />
                    <p className="fcp-turn-body fcp-typing"><span /><span /><span /></p>
                  </div>
                ) : null}
                <div className="fcp-extras"><IntelligenceExtras chat={chat} supportHref={supportHref} /></div>
              </div>
            )}

            {/* SYS activity log — the cockpit's live feed. */}
            <div className="fcp-syslog" aria-live="polite" aria-label={t("System log")}>
              {log.length === 0 ? <span className="fcp-syslog-line">SYS: Standing by.</span> : null}
              {log.map((line, i) => (
                <span key={`${i}-${line}`} className="fcp-syslog-line">{line}</span>
              ))}
            </div>
          </div>

          <form className="fcp-composer" onSubmit={(e) => { e.preventDefault(); void doSend(draft); }}>
            {error ? <p className="fcp-error" role="alert">{error}</p> : null}
            {voiceNotice ? <p className="fcp-voice-notice" role="status">{voiceNotice}</p> : null}
            <div className="fcp-composer-row">
              <span className={`fcp-live${listening ? " fcp-live--on" : ""}`} aria-hidden>
                <span className="fcp-live-dot" /> LIVE
              </span>
              {canListen ? (
                <button type="button" className={`fcp-mic${listening ? " fcp-mic--on" : ""}`}
                  onClick={() => (listening ? stopListening() : startListening())} aria-pressed={listening}
                  aria-label={listening ? t("Stop listening") : t("Speak")} title={listening ? t("Stop listening") : t("Speak")}>
                  {listening ? <MicOff aria-hidden /> : <Mic aria-hidden />}
                </button>
              ) : null}
              <input className="fcp-input" value={listening && transcript ? transcript : draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={listening ? t("Listening…") : t("Ask, or tell me what to do…")}
                aria-label={t("Message Henry Onyx Intelligence")} readOnly={listening} autoComplete="off" />
              <button type="submit" className="fcp-send" disabled={sending || (!draft.trim() && !transcript.trim())} aria-label={t("Send")}>
                <Send aria-hidden />
              </button>
            </div>
          </form>

          <footer className="fcp-footer" aria-hidden>
            <span>HENRY ONYX INTELLIGENCE</span>
            <span>CLASSIFIED · OWNER</span>
            <span>{statusLabel.toUpperCase()} · CTRL+SHIFT+A</span>
          </footer>
        </div>
      ) : null}
    </>
  );
}
