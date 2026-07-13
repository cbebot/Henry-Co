"use client";

/**
 * FounderCommandDock — the founder's desktop command surface (OCC-2, Phase B).
 *
 * On desktop the founder assistant is a persistent right-hand dock, not a
 * corner chat bubble: a briefing card that greets the owner with the company's
 * live state, the conversation restored from the server (turns persist in the
 * deny-RLS founder_intelligence_* pair), and the F3 governed-action cards
 * inline. It reuses the ONE chat state machine (useIntelligenceChat) and the
 * shared extras block, so the mobile FAB and this dock cannot drift.
 *
 * Mount discipline: exactly ONE founder shell mounts at a time — the host
 * breakpoint-gates this dock (≥1280px) against IntelligenceLauncher (below).
 * Mounting both would run two divergent client histories against the same
 * conversation store.
 *
 * Endpoints (all owner-origin, requireOwner-gated, 404 while the flag is dark):
 *   endpoint               POST one chat turn (…/chat — confirm derives from it)
 *   briefingEndpoint       GET the live company briefing for the greeting card
 *   conversationsEndpoint  GET ?limit list · GET ?id=<uuid> full transcript
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ChevronDown, ChevronUp, PenSquare, Sparkles as Sparkle, X, ArrowUpRight } from "lucide-react";
import { getAccountUrl } from "@henryco/config";
import { ChatThread } from "@henryco/chat-thread";
import "@henryco/chat-thread/styles";
import {
  useIntelligenceChat,
  type IntelligenceDivision,
  type StoredIntelligenceMessage,
} from "./use-intelligence-chat";
import { IntelligenceExtras } from "./IntelligenceExtras";
import { IntelligenceLauncherStyles } from "./IntelligenceLauncher";

export interface FounderCommandDockProps {
  division: IntelligenceDivision;
  /** The founder chat endpoint (…/chat — quote/run/confirm siblings derive from it). */
  endpoint: string;
  /** GET — live company briefing for the greeting card. */
  briefingEndpoint: string;
  /** GET — conversation list / ?id= transcript, for desktop restore. */
  conversationsEndpoint: string;
  accent?: string;
}

type Briefing = {
  headline: string;
  focus: string;
  nextSteps: Array<{ title: string; href: string; severity?: string }>;
  generatedAt?: string;
};

type ConversationSummary = { id: string; title: string | null; updatedAt: string | null };

const OPEN_KEY = "hc-founder-dock:open";

export function FounderCommandDock({
  division,
  endpoint,
  briefingEndpoint,
  conversationsEndpoint,
  accent = "#C9A227",
}: FounderCommandDockProps) {
  const chat = useIntelligenceChat({ division, endpoint });
  const { t, sessionId, messages, typing, send, hydrate, reset } = chat;

  const [open, setOpen] = useState(false);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [briefingBusy, setBriefingBusy] = useState(false);
  const [briefingOpen, setBriefingOpen] = useState(true);
  const [restored, setRestored] = useState(false);
  const loadedRef = useRef(false);
  const fabRef = useRef<HTMLButtonElement | null>(null);

  // Reopen where the owner left it (per device).
  useEffect(() => {
    try {
      if (window.localStorage.getItem(OPEN_KEY) === "1") setOpen(true);
    } catch {
      /* storage unavailable — stay closed */
    }
  }, []);
  const setOpenPersisted = useCallback((next: boolean) => {
    setOpen(next);
    try {
      window.localStorage.setItem(OPEN_KEY, next ? "1" : "0");
    } catch {
      /* best-effort */
    }
  }, []);

  // Ctrl+Shift+A (owner-chosen, Windows-first; Cmd+Shift+A on Mac) summons the
  // dock from anywhere in the console; Escape closes. Inside an editable field
  // the combo is left alone — never hijacked while the owner is typing.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const isToggle =
        (event.ctrlKey || event.metaKey) && event.shiftKey && (event.key === "a" || event.key === "A");
      if (isToggle) {
        const target = event.target as HTMLElement | null;
        const editable =
          target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
        if (editable) return;
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

  // First open: load the briefing + restore the most recent conversation.
  useEffect(() => {
    if (!open || loadedRef.current) return;
    loadedRef.current = true;
    let cancelled = false;

    setBriefingBusy(true);
    void fetch(briefingEndpoint, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Briefing | null) => {
        if (!cancelled && data && typeof data.headline === "string") setBriefing(data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setBriefingBusy(false);
      });

    void fetch(conversationsEndpoint, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then(async (data: { conversations?: ConversationSummary[] } | null) => {
        const latest = data?.conversations?.[0];
        if (cancelled || !latest?.id) return;
        const res = await fetch(`${conversationsEndpoint}?id=${encodeURIComponent(latest.id)}`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const detail = (await res.json().catch(() => null)) as {
          messages?: StoredIntelligenceMessage[];
        } | null;
        if (cancelled || !detail?.messages?.length) return;
        hydrate(latest.id, detail.messages);
        setRestored(true);
        // A restored thread keeps the briefing to a headline; expanding is one click.
        setBriefingOpen(false);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [open, briefingEndpoint, conversationsEndpoint, hydrate]);

  const supportHref = getAccountUrl("/support");
  const extras = useCallback(
    () => <IntelligenceExtras chat={chat} supportHref={supportHref} />,
    [chat, supportHref],
  );

  const newConversation = useCallback(() => {
    reset();
    setRestored(false);
    setBriefingOpen(true);
  }, [reset]);

  const dockStyle = useMemo(
    () =>
      ({
        ["--ct-accent" as string]: accent,
        ["--hc-il-accent" as string]: accent,
      }) as CSSProperties,
    [accent],
  );

  const severityDot = (severity?: string) =>
    severity === "critical" ? "hc-fcd-dot--critical" : severity === "warning" ? "hc-fcd-dot--warning" : "hc-fcd-dot--calm";

  return (
    <>
      <IntelligenceLauncherStyles />
      <FounderCommandDockStyles />
      {open ? (
        <aside className="hc-il-panel hc-fcd-dock" style={dockStyle} role="complementary" aria-label={t("Founder Intelligence")}>
          <section className="hc-fcd-briefing" aria-label={t("Company briefing")}>
            <button
              type="button"
              className="hc-fcd-briefing-head"
              aria-expanded={briefingOpen}
              onClick={() => setBriefingOpen((v) => !v)}
            >
              <span className="hc-fcd-kicker">
                <Sparkle aria-hidden className="hc-fcd-kicker-icon" />
                {t("The company right now")}
              </span>
              {briefingOpen ? <ChevronUp aria-hidden className="hc-fcd-chev" /> : <ChevronDown aria-hidden className="hc-fcd-chev" />}
            </button>
            {briefingBusy && !briefing ? (
              <p className="hc-fcd-briefing-line">{t("Reading the live dataset…")}</p>
            ) : briefing ? (
              <>
                <p className="hc-fcd-briefing-line">{briefing.headline}</p>
                {briefingOpen ? (
                  <div className="hc-fcd-briefing-body">
                    <p className="hc-fcd-briefing-focus">{briefing.focus}</p>
                    {briefing.nextSteps.length ? (
                      <div className="hc-fcd-steps">
                        {briefing.nextSteps.slice(0, 4).map((step) => (
                          <a key={`${step.href}:${step.title}`} href={step.href} className="hc-fcd-step">
                            <span aria-hidden className={`hc-fcd-dot ${severityDot(step.severity)}`} />
                            <span className="hc-fcd-step-label">{step.title}</span>
                            <ArrowUpRight aria-hidden className="hc-fcd-step-icon" />
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : (
              <p className="hc-fcd-briefing-line">{t("The briefing could not load this time. The conversation still works.")}</p>
            )}
          </section>

          <div className="hc-il-thread hc-fcd-thread">
            <ChatThread
              variant="assistant"
              threadId={`founder:${division}:${sessionId}`}
              viewer={{ id: "you" }}
              messages={messages}
              onSendMessage={send}
              typing={typing}
              showDaySeparators={false}
              showTimestamps={false}
              otherAvatar={<Sparkle aria-hidden />}
              renderBody={(message) => <div className="hc-il-prose hc-prose">{message.body}</div>}
              header={{
                title: t("Founder Intelligence"),
                status: restored ? t("Continuing your last conversation") : t("Grounded in live company data"),
                actions: (
                  <span className="hc-fcd-header-actions">
                    <button
                      type="button"
                      className="hc-il-close"
                      aria-label={t("New conversation")}
                      title={t("New conversation")}
                      onClick={newConversation}
                    >
                      <PenSquare aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="hc-il-close"
                      aria-label={t("Close")}
                      onClick={() => {
                        setOpenPersisted(false);
                        fabRef.current?.focus();
                      }}
                    >
                      <X aria-hidden />
                    </button>
                  </span>
                ),
              }}
              composer={{
                placeholder: t("Ask about any division, number, or decision…"),
                busy: typing,
                autoFocus: true,
                enterKeyBehavior: "send",
                accent,
                extras,
              }}
              emptyState={
                <div className="hc-il-empty">
                  <p className="hc-il-empty-title">{t("What needs your attention?")}</p>
                  <p className="hc-il-empty-body">
                    {t("Ask about revenue, a division, a signal, or a decision. Answers are grounded in the live company dataset, and proposed actions always wait for your confirmation.")}
                  </p>
                </div>
              }
            />
          </div>
        </aside>
      ) : (
        <div className="hc-il-root" style={dockStyle}>
          <button
            ref={fabRef}
            type="button"
            className="hc-il-fab"
            aria-expanded={false}
            aria-haspopup="dialog"
            aria-label={t("Open Founder Intelligence")}
            title={`${t("Founder Intelligence")} (Ctrl+Shift+A)`}
            onClick={() => setOpenPersisted(true)}
          >
            <Sparkle aria-hidden />
          </button>
        </div>
      )}
    </>
  );
}

function FounderCommandDockStyles() {
  return (
    <style>{`
/* Founder command dock — a full-height desktop rail on the right edge. It reuses the
   .hc-il-panel seam-token bridge (light/dark correct by construction) and overrides only
   the geometry: docked, edge-to-edge vertical, squared inner corner. */
.hc-fcd-dock{position:fixed;top:0;right:0;bottom:0;z-index:55;display:flex;flex-direction:column;
  width:min(27rem,calc(100vw - 4rem));height:100dvh;border-radius:0;border-width:0 0 0 1px;
  animation:hc-fcd-slide .26s cubic-bezier(.22,1,.36,1)}
@keyframes hc-fcd-slide{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
.hc-fcd-thread{flex:1 1 auto;min-height:0}
.hc-fcd-header-actions{display:inline-flex;align-items:center;gap:.25rem}
/* Briefing card — the assistant greets with state, not an empty box. */
.hc-fcd-briefing{flex:none;border-bottom:1px solid var(--hc-il-line);background:color-mix(in srgb,var(--hc-il-accent,#C9A227) 5%,var(--hc-il-surface));padding:.85rem 1rem .8rem}
.hc-fcd-briefing-head{display:flex;width:100%;align-items:center;justify-content:space-between;gap:.5rem;border:none;background:transparent;padding:0;cursor:pointer}
.hc-fcd-kicker{display:inline-flex;align-items:center;gap:.4rem;font-size:.68rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--hc-il-ink-soft)}
.hc-fcd-kicker-icon{width:.85rem;height:.85rem;color:var(--hc-il-accent,#C9A227)}
.hc-fcd-chev{width:.9rem;height:.9rem;color:var(--hc-il-ink-soft)}
.hc-fcd-briefing-line{margin:.45rem 0 0;font-size:.86rem;font-weight:600;line-height:1.45;color:var(--hc-il-ink)}
.hc-fcd-briefing-body{margin-top:.35rem}
.hc-fcd-briefing-focus{margin:0 0 .55rem;font-size:.8rem;line-height:1.5;color:var(--hc-il-ink-soft)}
.hc-fcd-steps{display:flex;flex-direction:column;gap:.35rem}
.hc-fcd-step{display:flex;align-items:center;gap:.5rem;border:1px solid var(--hc-il-line);border-radius:.75rem;padding:.42rem .6rem;font-size:.78rem;font-weight:600;text-decoration:none;color:var(--hc-il-ink);background:var(--hc-il-surface);transition:border-color .15s,transform .15s}
.hc-fcd-step:hover{border-color:color-mix(in srgb,var(--hc-il-accent,#C9A227) 45%,transparent);transform:translateY(-1px)}
.hc-fcd-step:focus-visible{outline:2px solid var(--hc-il-accent,#C9A227);outline-offset:2px}
.hc-fcd-step-label{flex:1 1 auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hc-fcd-step-icon{width:.8rem;height:.8rem;color:var(--hc-il-ink-soft);flex:none}
.hc-fcd-dot{width:.45rem;height:.45rem;border-radius:999px;flex:none}
.hc-fcd-dot--critical{background:var(--hc-il-danger,#b3261e)}
.hc-fcd-dot--warning{background:var(--hc-il-accent,#C9A227)}
.hc-fcd-dot--calm{background:var(--hc-il-ink-soft)}
.hc-fcd-briefing-head:focus-visible{outline:2px solid var(--hc-il-accent,#C9A227);outline-offset:2px;border-radius:.4rem}
@media (prefers-reduced-motion:reduce){.hc-fcd-dock{animation:none}}
`}</style>
  );
}
