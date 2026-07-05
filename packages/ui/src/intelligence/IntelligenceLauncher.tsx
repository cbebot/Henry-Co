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
import { MessageCircle, X, ArrowUpRight, LifeBuoy, Sparkles as Sparkle } from "lucide-react";
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
/** A chargeable deep-work capability the brain proposed (L4). */
type Offer = { key: string; title: string; blurb: string };
/** A price to show before running: the real NGN charge + a payer-currency display (approximate). */
type Quote = {
  chargeKobo: number;
  chargeCurrency: string;
  displayAmountMinor: number;
  displayCurrency: string;
  approximate: boolean;
};

type ChatApiResponse = {
  reply?: string;
  navigate?: NavAction[];
  handoff?: boolean;
  offer?: Offer | null;
  conversationId?: string | null;
  messageId?: string | null;
  error?: string;
};

const nowIso = () => new Date().toISOString();
const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `id-${Date.now()}-${Math.round(Math.random() * 1e9)}`;

/** Kobo -> a currency string. NGN today; the currency travels with the quote for the seam. */
function formatMoney(kobo: number, currency: string): string {
  const major = Math.round(kobo) / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "NGN", maximumFractionDigits: 2 }).format(major);
  } catch {
    return `${currency || "NGN"} ${major.toFixed(2)}`;
  }
}

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
  // L4 paid deep-work: the current offer, its quote once fetched, and the run state.
  const [offer, setOffer] = useState<Offer | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [deepBusy, setDeepBusy] = useState(false);
  const [deepError, setDeepError] = useState<string | null>(null);

  const sessionId = useSessionId(division);
  // The conversation of record for building each request + the server's returned id.
  const historyRef = useRef<ChatTurn[]>([]);
  const conversationRef = useRef<string | null>(null);

  const supportHref = getAccountUrl("/support");
  // The quote/run endpoints sit beside the chat endpoint (same account origin).
  const quoteEndpoint = useMemo(() => endpoint.replace(/\/chat\/?$/, "/quote"), [endpoint]);
  const runEndpoint = useMemo(() => endpoint.replace(/\/chat\/?$/, "/run"), [endpoint]);
  const lastUserText = () => [...historyRef.current].reverse().find((m) => m.role === "user")?.content ?? "";

  const send = useCallback(
    async (payload: ChatSendPayload): Promise<ChatSendResult> => {
      const body = payload.body.trim();
      if (!body) return { ok: false, reason: t("Type a message first.") };

      const outbound = [...historyRef.current, { role: "user" as const, content: body }];
      setTyping(true);
      // A new turn supersedes the previous turn's buttons + any pending offer.
      setActions([]);
      setHandoff(false);
      setOffer(null);
      setQuote(null);
      setDeepError(null);
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
        setOffer(data.offer ?? null);
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

  // L4 — fetch the price for the current offer (no wallet touch). Signed-in only.
  const getQuote = useCallback(async () => {
    if (!offer) return;
    setDeepBusy(true);
    setDeepError(null);
    try {
      const res = await fetch(quoteEndpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capabilityKey: offer.key, input: lastUserText() }),
      });
      const data = (await res.json().catch(() => null)) as {
        charge?: { amountKobo: number; currency: string };
        display?: { amountMinor: number; currency: string; approximate: boolean };
        error?: string;
        needsSignIn?: boolean;
      } | null;
      if (!res.ok || !data?.charge || !data?.display) {
        setDeepError(data?.error || t("We couldn't price that right now. Please try again."));
        setDeepBusy(false);
        return;
      }
      setQuote({
        chargeKobo: data.charge.amountKobo,
        chargeCurrency: data.charge.currency,
        displayAmountMinor: data.display.amountMinor,
        displayCurrency: data.display.currency,
        approximate: Boolean(data.display.approximate),
      });
    } catch {
      setDeepError(t("We couldn't reach the service. Please try again."));
    }
    setDeepBusy(false);
  }, [offer, quoteEndpoint, t]);

  // L4 — run the confirmed deep work. Charges the wallet through the metered rail; the result
  // lands as an assistant message rendered in the reading face.
  const runDeep = useCallback(async () => {
    if (!offer) return;
    setDeepBusy(true);
    setDeepError(null);
    try {
      const res = await fetch(runEndpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capabilityKey: offer.key,
          input: lastUserText(),
          idempotencyKey: newId(),
          conversationId: conversationRef.current,
          division,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        output?: string;
        receipt?: { totalKobo: number; vatKobo: number; billed: boolean };
        error?: string;
        code?: string;
      } | null;
      if (!res.ok || !data?.output) {
        setDeepError(
          data?.code === "insufficient_funds"
            ? t("Your wallet needs a top-up to run this.")
            : data?.error || t("We couldn't run that right now. Please try again."),
        );
        setDeepBusy(false);
        return;
      }
      historyRef.current = [...historyRef.current, { role: "assistant", content: data.output }];
      setMessages((prev) => [
        ...prev,
        { id: newId(), authorId: null, authorRole: "other", body: data.output as string, createdAt: nowIso() },
      ]);
      // Clear the offer once delivered; the receipt total is on the wallet.
      setOffer(null);
      setQuote(null);
    } catch {
      setDeepError(t("We couldn't reach the service. Please try again."));
    }
    setDeepBusy(false);
  }, [offer, runEndpoint, division, t]);

  const extras = useCallback(() => {
    const hasOffer = Boolean(offer);
    if (actions.length === 0 && !handoff && !hasOffer) return null;
    return (
      <div className="hc-il-extras">
        {offer ? (
          <div className="hc-il-offer">
            <div className="hc-il-offer-head">
              <Sparkle className="hc-il-offer-icon" aria-hidden />
              <span className="hc-il-offer-title">{offer.title}</span>
            </div>
            <p className="hc-il-offer-blurb">{offer.blurb}</p>
            {quote ? (
              <>
                <p className="hc-il-offer-price">
                  {formatMoney(quote.displayAmountMinor, quote.displayCurrency)}
                  {quote.approximate ? (
                    <span className="hc-il-offer-approx">
                      {t("approx. charged in")} {quote.chargeCurrency} {formatMoney(quote.chargeKobo, quote.chargeCurrency)}
                    </span>
                  ) : null}
                </p>
                <div className="hc-il-offer-actions">
                  <button type="button" className="hc-il-offer-run" onClick={() => void runDeep()} disabled={deepBusy}>
                    {deepBusy ? t("Running…") : t("Run it")}
                  </button>
                  <button type="button" className="hc-il-offer-cancel" onClick={() => setQuote(null)} disabled={deepBusy}>
                    {t("Not now")}
                  </button>
                </div>
              </>
            ) : (
              <button type="button" className="hc-il-offer-see" onClick={() => void getQuote()} disabled={deepBusy}>
                {deepBusy ? t("Checking the price…") : t("See the price")}
              </button>
            )}
            {deepError ? <p className="hc-il-offer-error">{deepError}</p> : null}
          </div>
        ) : null}
        {actions.length || handoff ? (
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
        ) : null}
      </div>
    );
  }, [actions, handoff, offer, quote, deepBusy, deepError, supportHref, getQuote, runDeep, t]);

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
                // Render the assistant's replies in the company reading face (.hc-prose owns
                // the face + rhythm; ink is inherited from this light panel, never forced, so
                // it stays legible in both host themes). The person's own turns stay plain.
                renderBody={(message) =>
                  message.authorRole === "other" ? (
                    <div className="hc-il-prose hc-prose">{message.body}</div>
                  ) : (
                    <span style={{ whiteSpace: "pre-wrap" }}>{message.body}</span>
                  )
                }
                header={{
                  title: t("Henry Onyx Intelligence"),
                  status: t("Here to help, free"),
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
/* Henry Onyx Intelligence launcher — a premium floating chat panel that tracks the HOST
   theme in both directions. The composer (@henryco/chat-composer) paints itself dark when an
   ancestor carries .dark, so the panel MUST go dark on a dark host too, or the two clash
   (a white panel with a dark composer). Every colour flows from four --hc-il-* seam tokens
   that flip once under .dark, and the chat-thread + composer tokens are bridged from them. */
.hc-il-root{position:fixed;right:max(1rem,env(safe-area-inset-right));bottom:max(1rem,env(safe-area-inset-bottom));z-index:60;display:flex;flex-direction:column;align-items:flex-end;gap:.75rem;font-family:inherit}
.hc-il-fab{display:inline-flex;align-items:center;justify-content:center;width:3.5rem;height:3.5rem;border-radius:999px;border:none;cursor:pointer;background:var(--hc-il-accent,#C9A227);color:var(--hc-il-on-accent,#0b1220);box-shadow:0 14px 34px -8px color-mix(in srgb,var(--hc-il-accent,#C9A227) 55%,transparent),0 4px 12px rgba(11,18,32,.18);transition:transform .2s cubic-bezier(.22,1,.36,1),filter .18s,box-shadow .2s}
.hc-il-fab:hover{filter:brightness(1.05);transform:translateY(-1px)}
.hc-il-fab:active{transform:scale(.95)}
.hc-il-fab:focus-visible{outline:2px solid var(--hc-il-accent,#C9A227);outline-offset:3px}
.hc-il-fab svg{width:1.5rem;height:1.5rem}
/* --- the four seam tokens (light default) + everything bridged from them --- */
.hc-il-panel{
  --hc-il-surface:#ffffff;--hc-il-ink:#0b1220;--hc-il-ink-soft:rgba(11,18,32,.62);--hc-il-line:rgba(11,18,32,.1);
  --hc-il-on-accent:#0b1220;
  width:min(24.5rem,calc(100vw - 2rem));height:min(35rem,calc(100dvh - 7rem));
  background:var(--hc-il-surface);border-radius:1.35rem;overflow:hidden;
  box-shadow:0 32px 70px -24px rgba(11,18,32,.42),0 10px 24px -16px rgba(11,18,32,.24);
  border:1px solid var(--hc-il-line);
  animation:hc-il-rise .24s cubic-bezier(.22,1,.36,1);
  --ct-bg:var(--hc-il-surface);--ct-surface:color-mix(in srgb,var(--hc-il-ink) 6%,var(--hc-il-surface));
  --ct-surface-own:color-mix(in srgb,var(--hc-il-accent,#C9A227) 16%,var(--hc-il-surface));
  --ct-header-bg:var(--hc-il-surface);--ct-composer-bg:var(--hc-il-surface);
  --ct-ink:var(--hc-il-ink);--ct-ink-soft:var(--hc-il-ink-soft);--ct-line:var(--hc-il-line);
  --ct-accent:var(--hc-il-accent,#C9A227);--ct-accent-ink:var(--hc-il-ink);--ct-accent-contrast:var(--hc-il-on-accent)}
:where(html.dark,html[data-theme="dark"],.dark) .hc-il-panel{
  --hc-il-surface:#0f1a2c;--hc-il-ink:#F5F1E8;--hc-il-ink-soft:rgba(245,241,232,.64);--hc-il-line:rgba(245,241,232,.14);
  box-shadow:0 34px 80px -24px rgba(0,0,0,.6),0 10px 24px -14px rgba(0,0,0,.5)}
@keyframes hc-il-rise{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
.hc-il-thread{display:flex;flex-direction:column;height:100%;min-height:0}
.hc-il-thread > *{flex:1 1 auto;min-height:0}
.hc-il-close{display:inline-flex;align-items:center;justify-content:center;width:2rem;height:2rem;border-radius:999px;border:none;background:transparent;color:var(--hc-il-ink-soft);cursor:pointer;transition:background .15s,color .15s}
.hc-il-close:hover{background:color-mix(in srgb,var(--hc-il-ink) 8%,transparent);color:var(--hc-il-ink)}
.hc-il-close svg{width:1.15rem;height:1.15rem}
.hc-il-actions{display:flex;flex-wrap:wrap;gap:.5rem;padding:.5rem 0 .25rem}
.hc-il-chip{display:inline-flex;align-items:center;gap:.35rem;padding:.42rem .75rem;border-radius:999px;font-size:.8125rem;font-weight:600;text-decoration:none;border:1px solid color-mix(in srgb,var(--hc-il-accent,#C9A227) 45%,transparent);color:var(--hc-il-ink);background:color-mix(in srgb,var(--hc-il-accent,#C9A227) 12%,var(--hc-il-surface));transition:filter .15s,transform .15s}
.hc-il-chip:hover{filter:brightness(1.04);transform:translateY(-1px)}
.hc-il-chip-human{border-color:var(--hc-il-line);background:color-mix(in srgb,var(--hc-il-ink) 5%,transparent)}
.hc-il-chip-icon{width:.85rem;height:.85rem}
.hc-il-extras{display:flex;flex-direction:column;gap:.5rem;padding:.4rem 0 .15rem}
.hc-il-offer{border:1px solid color-mix(in srgb,var(--hc-il-accent,#C9A227) 38%,transparent);background:color-mix(in srgb,var(--hc-il-accent,#C9A227) 9%,var(--hc-il-surface));border-radius:1rem;padding:.75rem .85rem}
.hc-il-offer-head{display:flex;align-items:center;gap:.4rem}
.hc-il-offer-icon{width:1rem;height:1rem;color:var(--hc-il-accent,#C9A227)}
.hc-il-offer-title{font-size:.85rem;font-weight:700;color:var(--hc-il-ink)}
.hc-il-offer-blurb{margin:.3rem 0 .55rem;font-size:.8rem;line-height:1.45;color:var(--hc-il-ink-soft)}
.hc-il-offer-price{display:flex;flex-direction:column;gap:.1rem;margin:0 0 .55rem;font-size:1.05rem;font-weight:700;color:var(--hc-il-ink);font-variant-numeric:tabular-nums}
.hc-il-offer-approx{font-size:.7rem;font-weight:600;color:var(--hc-il-ink-soft)}
.hc-il-offer-actions{display:flex;gap:.5rem}
.hc-il-offer-see,.hc-il-offer-run{border:none;border-radius:999px;padding:.48rem .95rem;font-size:.8rem;font-weight:700;cursor:pointer;background:var(--hc-il-accent,#C9A227);color:var(--hc-il-on-accent)}
.hc-il-offer-see:disabled,.hc-il-offer-run:disabled{opacity:.6;cursor:default}
.hc-il-offer-cancel{border:1px solid var(--hc-il-line);border-radius:999px;padding:.48rem .85rem;font-size:.8rem;font-weight:600;cursor:pointer;background:transparent;color:var(--hc-il-ink-soft)}
.hc-il-offer-error{margin:.5rem 0 0;font-size:.75rem;color:#e0894b}
.hc-il-prose{font-size:.92rem;line-height:1.6}
.hc-il-prose p{margin:0 0 .55rem}
.hc-il-prose p:last-child{margin-bottom:0}
.hc-il-empty{display:flex;flex-direction:column;gap:.45rem;padding:1.5rem 1.35rem;text-align:left}
.hc-il-empty-title{font-size:1.05rem;font-weight:700;color:var(--hc-il-ink);margin:0;letter-spacing:-.01em}
.hc-il-empty-body{font-size:.9rem;line-height:1.55;color:var(--hc-il-ink-soft);margin:0}
@media (max-width:480px){.hc-il-panel{width:calc(100vw - 1.5rem);height:min(32rem,calc(100dvh - 6rem))}}
@media (prefers-reduced-motion:reduce){.hc-il-panel{animation:none}.hc-il-fab{transition:none}}
`}</style>
  );
}
