"use client";

/**
 * useIntelligenceChat — the ONE Henry Onyx Intelligence client state machine.
 *
 * Extracted from IntelligenceLauncher (OCC-2) so the mobile FAB and the founder
 * desktop command dock share a single implementation of the chat/turn contract:
 * send() history discipline, the L4 offer→quote→run flow, and the F3 governed
 * action chip→review→confirm flow. Two shells, one brain seam — the alternative
 * (a forked copy per shell) is exactly how the confirm-outcome semantics would
 * drift.
 *
 * The transport contract this hook owns:
 *   • POST {endpoint} with {messages, division, page, sessionId, conversationId}
 *     (credentials included — the endpoint may sit on the account subdomain);
 *   • quote/run/confirm endpoints are DERIVED from the chat endpoint by suffix
 *     replacement (…/chat → …/quote | /run | /actions/confirm) — shells must
 *     pass a /chat-terminated endpoint or the F3 confirm silently breaks;
 *   • one buffered JSON turn per POST (no streaming in the gateway today).
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useOptionalHenryCoLocale } from "@henryco/i18n/react";
import type { AppLocale } from "@henryco/i18n";
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

export type ChatTurn = { role: "user" | "assistant"; content: string };
export type NavAction = { label: string; href: string };
/** A chargeable deep-work capability the brain proposed (L4). */
export type Offer = { key: string; title: string; blurb: string };
/** A price to show before running: the real NGN charge + a payer-currency display (approximate). */
export type Quote = {
  chargeKobo: number;
  chargeCurrency: string;
  displayAmountMinor: number;
  displayCurrency: string;
  approximate: boolean;
};

/**
 * F3 — a governed write action the founder assistant proposed. Server-built and
 * server-authored (title/body/confirmLabel are already company-voice from the
 * true state), so they render as data, not client literals. Present ONLY on the
 * owner founder surface; every customer intelligence surface omits it, so the
 * card is inert there.
 */
export type ProposedAction = {
  token: string;
  key: string;
  title: string;
  body: string;
  confirmLabel: string;
  division: string;
  reversibility: "reversible" | "hard-to-reverse" | "irreversible";
  requiresReauth: boolean;
  rationale?: string | null;
  expiresAt: string;
};

type ChatApiResponse = {
  reply?: string;
  navigate?: NavAction[];
  handoff?: boolean;
  offer?: Offer | null;
  proposedAction?: ProposedAction | null;
  conversationId?: string | null;
  messageId?: string | null;
  error?: string;
};

/** The disposition of a confirmed action, shown in place of the card. */
export type ActionOutcome = { kind: "executed" | "conflict" | "expired" | "failed"; message: string };

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

export type UseIntelligenceChatOptions = {
  division: IntelligenceDivision;
  /** Same-origin (or account-origin) chat endpoint, /chat-terminated. */
  endpoint: string;
};

/** A persisted turn as returned by an owner conversations read endpoint. */
export type StoredIntelligenceMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string | null;
};

export function useIntelligenceChat({ division, endpoint }: UseIntelligenceChatOptions) {
  const locale = useOptionalHenryCoLocale() ?? "en";
  const t = useCallback((text: string) => translateSurfaceLabel(locale as AppLocale, text), [locale]);

  const [messages, setMessages] = useState<ChatThreadMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [actions, setActions] = useState<NavAction[]>([]);
  const [handoff, setHandoff] = useState(false);
  // L4 paid deep-work: the current offer, its quote once fetched, and the run state.
  const [offer, setOffer] = useState<Offer | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [deepBusy, setDeepBusy] = useState(false);
  const [deepError, setDeepError] = useState<string | null>(null);
  // F3 governed actions: the proposed action, whether the owner expanded it to
  // review (fix #7 — viewing is a deliberate click, never auto-opened), the
  // confirm-in-flight flag, and the disposition once resolved.
  const [proposedAction, setProposedAction] = useState<ProposedAction | null>(null);
  const [actionExpanded, setActionExpanded] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionOutcome, setActionOutcome] = useState<ActionOutcome | null>(null);
  // Deep-action step-up (the founder's "print"): the confirm route answered
  // with the sensitive-action challenge — the owner must re-enter their
  // password (verified server-side, which writes the signed hc_last_reauth
  // marker) before this confirm can execute. The proposal card stays visible.
  const [reauthNeeded, setReauthNeeded] = useState(false);
  const [reauthBusy, setReauthBusy] = useState(false);
  const [reauthError, setReauthError] = useState<string | null>(null);

  const sessionId = useSessionId(division);
  // The conversation of record for building each request + the server's returned id.
  const historyRef = useRef<ChatTurn[]>([]);
  const conversationRef = useRef<string | null>(null);

  // The quote/run endpoints sit beside the chat endpoint (same account origin).
  const quoteEndpoint = useMemo(() => endpoint.replace(/\/chat\/?$/, "/quote"), [endpoint]);
  const runEndpoint = useMemo(() => endpoint.replace(/\/chat\/?$/, "/run"), [endpoint]);
  // F3 — the governed-action confirm endpoint sits beside the founder chat
  // endpoint (same owner origin): /api/owner/intelligence/chat → /actions/confirm.
  const confirmEndpoint = useMemo(() => endpoint.replace(/\/chat\/?$/, "/actions/confirm"), [endpoint]);
  // The reauth completion route lives at the chat endpoint's ORIGIN root
  // (/api/auth/reauth exists on hub, account, learn, and jobs) — origin-derived
  // so a cross-origin chat endpoint reauths against its own origin.
  const reauthEndpoint = useMemo(() => {
    if (/^https?:\/\//i.test(endpoint)) {
      try {
        return new URL("/api/auth/reauth", endpoint).toString();
      } catch {
        /* fall through to same-origin */
      }
    }
    return "/api/auth/reauth";
  }, [endpoint]);

  // The SECOND deliberate click (the first being "Review"): confirm the action.
  // The AI is entirely absent here — this posts only the opaque token; the server
  // re-authorizes, re-reads true state, and executes through the guarded path.
  const confirmAction = useCallback(async () => {
    if (!proposedAction || actionBusy) return;
    setActionBusy(true);
    try {
      const res = await fetch(confirmEndpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: proposedAction.token }),
      });
      const data = (await res.json().catch(() => null)) as
        | { outcome?: string; reason?: string; error?: string; code?: string }
        | null;
      // Deep-action step-up challenge: keep the card, ask for the password.
      if (res.status === 401 && data?.code === "sensitive_action_reauth_required") {
        setReauthNeeded(true);
        setReauthError(null);
        return;
      }
      const outcome = data?.outcome;
      if (res.ok && outcome === "executed") {
        setReauthNeeded(false);
        setActionOutcome({ kind: "executed", message: t("Done. The change is live.") });
      } else if (outcome === "conflict" || outcome === "already_resolved") {
        setActionOutcome({
          kind: "conflict",
          message: t("The details changed since I prepared this. Ask me again for a fresh version."),
        });
      } else if (outcome === "expired") {
        setActionOutcome({
          kind: "expired",
          message: t("This action expired. Ask me again and I'll prepare a fresh one."),
        });
      } else {
        setActionOutcome({
          kind: "failed",
          message: data?.error || t("That didn't go through. Nothing was changed."),
        });
      }
      setProposedAction(null);
      setActionExpanded(false);
    } catch {
      setActionOutcome({ kind: "failed", message: t("That didn't go through. Nothing was changed.") });
      setProposedAction(null);
      setActionExpanded(false);
    } finally {
      setActionBusy(false);
    }
  }, [proposedAction, actionBusy, confirmEndpoint, t]);

  /**
   * Complete the deep-action step-up: verify the owner's password against the
   * origin's /api/auth/reauth (which writes the signed hc_last_reauth marker
   * on success) and immediately retry the confirm — one seamless "verify &
   * execute" for the owner. The password travels ONLY to this origin's
   * verified reauth route, never through the AI or the chat pipeline.
   */
  const submitReauth = useCallback(
    async (password: string) => {
      if (reauthBusy) return;
      const secret = password.trim();
      if (!secret) {
        setReauthError(t("Enter your password."));
        return;
      }
      setReauthBusy(true);
      setReauthError(null);
      try {
        const res = await fetch(reauthEndpoint, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method: "password", password: secret }),
        });
        const data = (await res.json().catch(() => null)) as { ok?: boolean; reason?: string } | null;
        if (data?.ok) {
          setReauthNeeded(false);
          setReauthBusy(false);
          await confirmAction();
          return;
        }
        setReauthError(
          data?.reason === "rate_limited"
            ? t("Too many attempts. Wait a few minutes and try again.")
            : t("That password didn't match. Try again."),
        );
      } catch {
        setReauthError(t("We couldn't verify right now. Try again."));
      } finally {
        setReauthBusy(false);
      }
    },
    [reauthBusy, reauthEndpoint, confirmAction, t],
  );

  const dismissAction = useCallback(() => {
    setProposedAction(null);
    setActionExpanded(false);
    setReauthNeeded(false);
    setReauthError(null);
  }, []);
  const lastUserText = useCallback(
    () => [...historyRef.current].reverse().find((m) => m.role === "user")?.content ?? "",
    [],
  );

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
      // A new turn also supersedes an un-acted proposed action + its outcome.
      setProposedAction(null);
      setActionExpanded(false);
      setActionOutcome(null);
      setReauthNeeded(false);
      setReauthError(null);
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
          // 429 is the daily allowance, not an outage — say so instead of "try again".
          const reason =
            res.status === 429
              ? data?.error || t("Today's assistant allowance is used up. It resets tomorrow.")
              : data?.error || t("We couldn't reach Henry Onyx Intelligence. Please try again.");
          return { ok: false, reason };
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
        // F3 — surface the proposed action as a compact chip; the owner reviews
        // and confirms with deliberate clicks. Inert on every non-founder surface
        // (those responses never carry proposedAction).
        setProposedAction(data.proposedAction ?? null);
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
  }, [offer, quoteEndpoint, lastUserText, t]);

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
  }, [offer, runEndpoint, division, lastUserText, t]);

  /**
   * Hydrate the thread from a PERSISTED conversation (desktop restore). Replaces
   * the client history wholesale — turn buttons/offers/actions are turn-scoped
   * server state and do not survive a reload, so they reset.
   */
  const hydrate = useCallback(
    (conversationId: string, stored: StoredIntelligenceMessage[]) => {
      conversationRef.current = conversationId;
      historyRef.current = stored.map((m) => ({ role: m.role, content: m.content }));
      setMessages(
        stored.map((m) => ({
          id: m.id,
          authorId: m.role === "user" ? "you" : null,
          authorRole: m.role === "user" ? "viewer" : "other",
          body: m.content,
          createdAt: m.createdAt || nowIso(),
        })),
      );
      setActions([]);
      setHandoff(false);
      setOffer(null);
      setQuote(null);
      setDeepError(null);
      setProposedAction(null);
      setActionExpanded(false);
      setActionOutcome(null);
      setReauthNeeded(false);
      setReauthError(null);
    },
    [],
  );

  /** Start a fresh conversation (keeps the session id — rate limits are per visitor). */
  const reset = useCallback(() => {
    conversationRef.current = null;
    historyRef.current = [];
    setMessages([]);
    setActions([]);
    setHandoff(false);
    setOffer(null);
    setQuote(null);
    setDeepError(null);
    setProposedAction(null);
    setActionExpanded(false);
    setActionOutcome(null);
  }, []);

  return {
    t,
    locale: locale as AppLocale,
    division,
    sessionId,
    messages,
    typing,
    actions,
    handoff,
    offer,
    quote,
    deepBusy,
    deepError,
    proposedAction,
    actionExpanded,
    setActionExpanded,
    actionBusy,
    actionOutcome,
    setActionOutcome,
    setQuote,
    send,
    getQuote,
    runDeep,
    confirmAction,
    dismissAction,
    reauthNeeded,
    reauthBusy,
    reauthError,
    submitReauth,
    hydrate,
    reset,
  };
}

export type IntelligenceChat = ReturnType<typeof useIntelligenceChat>;
