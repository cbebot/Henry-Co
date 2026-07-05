"use client";

/**
 * IntelligenceLauncher — Henry Onyx Intelligence on every division page. The floating
 * launcher (replacing the static "?" concierge) opens a premium chat panel backed by the
 * FREE support brain (gateway surface support.message.assist). Each turn POSTs the running
 * history to the app's own same-origin /api/intelligence/chat; the reply, its catalog-bound
 * navigation buttons, and the human-handoff signal come back opaque (no provider/model ever
 * named). The panel embeds @henryco/chat-thread (fillViewport off — the panel owns the
 * height), and renders navigation + the Onyx Line handoff through the composer's extras slot.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { MessageCircle, X, ArrowUpRight, LifeBuoy } from "lucide-react";
import { getAccountUrl } from "@henryco/config";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useOptionalHenryCoLocale } from "@henryco/i18n/react";
import type { AppLocale } from "@henryco/i18n";
import { ChatThread } from "@henryco/chat-thread";
import type { ChatSendPayload, ChatSendResult, ChatThreadMessage } from "@henryco/chat-thread";

export type IntelligenceDivision =
  | "marketplace"
  | "care"
  | "jobs"
  | "learn"
  | "logistics"
  | "property"
  | "studio"
  | "account"
  | "hub";

export interface IntelligenceLauncherProps {
  division: IntelligenceDivision;
  /** Division accent for the launcher + own-bubble tint. Defaults to the house gold. */
  accent?: string;
  /** Same-origin endpoint. Defaults to "/api/intelligence/chat". */
  endpoint?: string;
}

type ChatTurn = { role: "user" | "assistant"; content: string };
type NavAction = { label: string; href: string };

type ChatApiResponse = {
  reply?: string;
  navigate?: NavAction[];
  handoff?: boolean;
  conversationId?: string | null;
  messageId?: string | null;
  error?: string;
};

const nowIso = () => new Date().toISOString();
const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `id-${Date.now()}-${Math.round(Math.random() * 1e9)}`;

/** A stable per-division session id (groups anonymous turns + rate-limits per visitor). */
function useSessionId(division: string): string {
  return useMemo(() => {
    const key = `hc-intelligence-session:${division}`;
    if (typeof window === "undefined") return newId();
    try {
      const existing = window.sessionStorage.getItem(key);
      if (existing) return existing;
      const fresh = newId();
      window.sessionStorage.setItem(key, fresh);
      return fresh;
    } catch {
      return newId();
    }
  }, [division]);
}

export function IntelligenceLauncher({ division, accent = "#C9A227", endpoint = "/api/intelligence/chat" }: IntelligenceLauncherProps) {
  const locale = useOptionalHenryCoLocale() ?? "en";
  const t = useCallback((text: string) => translateSurfaceLabel(locale as AppLocale, text), [locale]);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatThreadMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [actions, setActions] = useState<NavAction[]>([]);
  const [handoff, setHandoff] = useState(false);

  const sessionId = useSessionId(division);
  // The conversation of record for building each request + the server's returned id.
  const historyRef = useRef<ChatTurn[]>([]);
  const conversationRef = useRef<string | null>(null);

  const supportHref = getAccountUrl("/support");

  const send = useCallback(
    async (payload: ChatSendPayload): Promise<ChatSendResult> => {
      const body = payload.body.trim();
      if (!body) return { ok: false, reason: t("Type a message first.") };

      const outbound = [...historyRef.current, { role: "user" as const, content: body }];
      setTyping(true);
      // A new turn supersedes the previous turn's buttons.
      setActions([]);
      setHandoff(false);
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          // Cross-subdomain to the account endpoint — send the platform session cookie so a
          // signed-in person is recognised (the server still derives identity from the cookie).
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: outbound,
            division,
            page: typeof window !== "undefined" ? window.location.pathname : undefined,
            sessionId,
            conversationId: conversationRef.current,
          }),
        });
        const data = (await res.json().catch(() => null)) as ChatApiResponse | null;
        if (!res.ok || !data?.reply) {
          setTyping(false);
          return { ok: false, reason: data?.error || t("We couldn't reach Henry Onyx Intelligence. Please try again.") };
        }

        // Commit to the conversation of record only on success (retry-safe).
        historyRef.current = [...outbound, { role: "assistant", content: data.reply }];
        conversationRef.current = data.conversationId ?? conversationRef.current;

        const assistantMessage: ChatThreadMessage = {
          id: data.messageId || newId(),
          authorId: null,
          authorRole: "other",
          body: data.reply,
          createdAt: nowIso(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setActions(Array.isArray(data.navigate) ? data.navigate.slice(0, 2) : []);
        setHandoff(Boolean(data.handoff));
        setTyping(false);

        // Reconcile the composer's optimistic user bubble by returning the sent message.
        return {
          ok: true,
          message: {
            id: newId(),
            authorId: "you",
            authorRole: "viewer",
            body,
            createdAt: nowIso(),
          },
        };
      } catch {
        setTyping(false);
        return { ok: false, reason: t("We couldn't reach the service. Check your connection and try again.") };
      }
    },
    [division, endpoint, sessionId, t],
  );

  const extras = useCallback(() => {
    if (actions.length === 0 && !handoff) return null;
    return (
      <div className="hc-il-actions">
        {actions.map((action) => (
          <a key={action.href} href={action.href} className="hc-il-chip">
            {action.label}
            <ArrowUpRight className="hc-il-chip-icon" aria-hidden />
          </a>
        ))}
        {handoff ? (
          <a href={supportHref} className="hc-il-chip hc-il-chip-human">
            <LifeBuoy className="hc-il-chip-icon" aria-hidden />
            {t("Talk to the team")}
          </a>
        ) : null}
      </div>
    );
  }, [actions, handoff, supportHref, t]);

  const panelStyle = useMemo(
    () =>
      ({
        ["--ct-accent" as string]: accent,
        ["--hc-il-accent" as string]: accent,
      }) as CSSProperties,
    [accent],
  );

  return (
    <>
      <IntelligenceLauncherStyles />
      <div className="hc-il-root" style={panelStyle}>
        {open ? (
          <section className="hc-il-panel" role="dialog" aria-label={t("Henry Onyx Intelligence")}>
            <div className="hc-il-thread">
              <ChatThread
                variant="assistant"
                threadId={`intelligence:${division}:${sessionId}`}
                viewer={{ id: "you" }}
                messages={messages}
                onSendMessage={send}
                typing={typing}
                showDaySeparators={false}
                showTimestamps={false}
                header={{
                  title: t("Henry Onyx Intelligence"),
                  status: t("Here to help — free"),
                  actions: (
                    <button type="button" className="hc-il-close" aria-label={t("Close")} onClick={() => setOpen(false)}>
                      <X aria-hidden />
                    </button>
                  ),
                }}
                composer={{
                  placeholder: t("Ask Henry Onyx Intelligence…"),
                  busy: typing,
                  autoFocus: true,
                  enterKeyBehavior: "send",
                  extras,
                }}
                emptyState={
                  <div className="hc-il-empty">
                    <p className="hc-il-empty-title">{t("How can we help?")}</p>
                    <p className="hc-il-empty-body">
                      {t("Ask about your account, orders, or anything on Henry Onyx. A person is one tap away whenever you need them.")}
                    </p>
                  </div>
                }
              />
            </div>
          </section>
        ) : null}

        <button
          type="button"
          className="hc-il-fab"
          aria-expanded={open}
          aria-label={open ? t("Close Henry Onyx Intelligence") : t("Open Henry Onyx Intelligence")}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X aria-hidden /> : <MessageCircle aria-hidden />}
        </button>
      </div>
    </>
  );
}

function IntelligenceLauncherStyles() {
  return (
    <style>{`
.hc-il-root{position:fixed;right:max(1rem,env(safe-area-inset-right));bottom:max(1rem,env(safe-area-inset-bottom));z-index:60;display:flex;flex-direction:column;align-items:flex-end;gap:.75rem;font-family:inherit}
.hc-il-fab{display:inline-flex;align-items:center;justify-content:center;width:3.25rem;height:3.25rem;border-radius:999px;border:none;cursor:pointer;background:var(--hc-il-accent,#C9A227);color:#0b1220;box-shadow:0 10px 30px rgba(11,18,32,.22);transition:transform .18s cubic-bezier(.22,1,.36,1),filter .18s}
.hc-il-fab:hover{filter:brightness(1.06)}
.hc-il-fab:active{transform:scale(.96)}
.hc-il-fab svg{width:1.4rem;height:1.4rem}
.hc-il-panel{width:min(24rem,calc(100vw - 2rem));height:min(34rem,calc(100dvh - 7rem));background:#fff;border-radius:1.25rem;overflow:hidden;box-shadow:0 24px 60px rgba(11,18,32,.28);border:1px solid rgba(11,18,32,.08);
  --ct-bg:#fff;--ct-surface:#fff;--ct-surface-own:color-mix(in srgb,var(--hc-il-accent,#C9A227) 16%,#fff);--ct-header-bg:#fff;--ct-composer-bg:#fff;
  --ct-ink:#0b1220;--ct-ink-soft:rgba(11,18,32,.6);--ct-line:rgba(11,18,32,.1);--ct-accent:var(--hc-il-accent,#C9A227);--ct-accent-ink:#0b1220;--ct-accent-contrast:#0b1220}
.hc-il-thread{display:flex;flex-direction:column;height:100%;min-height:0}
.hc-il-thread > *{flex:1;min-height:0}
.hc-il-close{display:inline-flex;align-items:center;justify-content:center;width:2rem;height:2rem;border-radius:999px;border:none;background:transparent;color:var(--ct-ink-soft,#57606a);cursor:pointer}
.hc-il-close:hover{background:rgba(11,18,32,.06);color:var(--ct-ink,#0b1220)}
.hc-il-close svg{width:1.1rem;height:1.1rem}
.hc-il-actions{display:flex;flex-wrap:wrap;gap:.5rem;padding:.5rem 0 .25rem}
.hc-il-chip{display:inline-flex;align-items:center;gap:.35rem;padding:.4rem .7rem;border-radius:999px;font-size:.8125rem;font-weight:600;text-decoration:none;border:1px solid color-mix(in srgb,var(--hc-il-accent,#C9A227) 45%,transparent);color:#0b1220;background:color-mix(in srgb,var(--hc-il-accent,#C9A227) 12%,#fff);transition:filter .15s}
.hc-il-chip:hover{filter:brightness(.97)}
.hc-il-chip-human{border-color:rgba(11,18,32,.16);background:rgba(11,18,32,.04)}
.hc-il-chip-icon{width:.85rem;height:.85rem}
.hc-il-empty{display:flex;flex-direction:column;gap:.4rem;padding:1.25rem;text-align:left}
.hc-il-empty-title{font-size:1rem;font-weight:700;color:#0b1220;margin:0}
.hc-il-empty-body{font-size:.875rem;line-height:1.5;color:rgba(11,18,32,.62);margin:0}
@media (max-width:480px){.hc-il-panel{width:calc(100vw - 1.5rem);height:min(30rem,calc(100dvh - 6rem))}}
`}</style>
  );
}
