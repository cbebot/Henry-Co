"use client";

/**
 * IntelligenceLauncher — Henry Onyx Intelligence on every division page. The floating
 * launcher (replacing the static "?" concierge) opens a premium chat panel backed by the
 * FREE support brain (gateway surface support.message.assist). Each turn POSTs the running
 * history to the app's own same-origin /api/intelligence/chat; the reply, its catalog-bound
 * navigation buttons, and the human-handoff signal come back opaque (no provider/model ever
 * named). The panel embeds @henryco/chat-thread (fillViewport off — the panel owns the
 * height), and renders navigation + the Onyx Line handoff through the composer's extras slot.
 *
 * OCC-2: the chat/turn state machine lives in useIntelligenceChat and the extras block in
 * IntelligenceExtras — shared with the founder desktop dock (FounderCommandDock) so the two
 * shells cannot drift. This file keeps ONLY the mobile-FAB shell.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { MessageCircle, X, Sparkles as Sparkle } from "lucide-react";
import { getAccountUrl } from "@henryco/config";
import { ChatThread } from "@henryco/chat-thread";
// Bundle the chat-thread layout with the launcher itself. The panel embeds <ChatThread>, whose
// styles live in this stylesheet; without it, any host app that doesn't already import it (the
// hub, marketplace, …) renders the panel UNSTYLED — oversized, a floating composer, and
// system-font bubbles. Importing it here makes the launcher self-contained on every subdomain.
import "@henryco/chat-thread/styles";
import { useIntelligenceChat, type IntelligenceDivision } from "./use-intelligence-chat";
import { IntelligenceExtras } from "./IntelligenceExtras";

export type { IntelligenceDivision };

export interface IntelligenceLauncherProps {
  division: IntelligenceDivision;
  /** Division accent for the launcher + own-bubble tint. Defaults to the house gold. */
  accent?: string;
  /** Same-origin endpoint. Defaults to "/api/intelligence/chat". */
  endpoint?: string;
  /**
   * Extra bottom clearance (any CSS length) applied ONLY at mobile widths, so the launcher
   * clears a fixed bottom navigation bar instead of hiding behind it. The account dashboard
   * has a bottom action bar (3.5rem); it passes that height + a gap. Division apps have no
   * bottom bar and omit this, so the launcher stays at the default 1rem corner offset.
   */
  bottomOffset?: string;
}

export function IntelligenceLauncher({ division, accent = "#C9A227", endpoint = "/api/intelligence/chat", bottomOffset }: IntelligenceLauncherProps) {
  const chat = useIntelligenceChat({ division, endpoint });
  const { t, sessionId, messages, typing, send } = chat;

  const [open, setOpen] = useState(false);

  // Dialog behaviour: closing returns focus to the launcher, and Escape dismisses the panel.
  const fabRef = useRef<HTMLButtonElement | null>(null);
  const closePanel = useCallback(() => {
    setOpen(false);
    fabRef.current?.focus();
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closePanel]);

  const supportHref = getAccountUrl("/support");
  const extras = useCallback(
    () => <IntelligenceExtras chat={chat} supportHref={supportHref} />,
    [chat, supportHref],
  );

  const panelStyle = useMemo(
    () =>
      ({
        ["--ct-accent" as string]: accent,
        ["--hc-il-accent" as string]: accent,
        // Mobile-only lift so the launcher clears a host bottom nav bar (account dashboard).
        ...(bottomOffset ? { ["--hc-il-lift" as string]: bottomOffset } : {}),
      }) as CSSProperties,
    [accent, bottomOffset],
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
                // A brand mark on the AI side instead of the default bullet.
                otherAvatar={<Sparkle aria-hidden />}
                // BOTH sides render in the company reading face (.hc-prose owns the face +
                // rhythm; ink is inherited from the bubble, never forced, so it stays legible on
                // either bubble tint in both host themes). Rendering the person's OWN turns in the
                // same face is deliberate: what they type in the brand serif stays the brand serif
                // once sent, instead of snapping back to the system font.
                renderBody={(message) => <div className="hc-il-prose hc-prose">{message.body}</div>}
                header={{
                  title: t("Henry Onyx Intelligence"),
                  status: t("Here to help, free"),
                  actions: (
                    <button type="button" className="hc-il-close" aria-label={t("Close")} onClick={closePanel}>
                      <X aria-hidden />
                    </button>
                  ),
                }}
                // The division accent flows into the composer too (send button, focus ring,
                // caret), so the whole panel is one accent instead of a stray teal CTA.
                composer={{
                  placeholder: t("Ask Henry Onyx Intelligence…"),
                  busy: typing,
                  autoFocus: true,
                  enterKeyBehavior: "send",
                  accent,
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
          ref={fabRef}
          type="button"
          className="hc-il-fab"
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={open ? t("Close Henry Onyx Intelligence") : t("Open Henry Onyx Intelligence")}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X aria-hidden /> : <MessageCircle aria-hidden />}
        </button>
      </div>
    </>
  );
}

export function IntelligenceLauncherStyles() {
  return (
    <style>{`
/* Henry Onyx Intelligence launcher — a premium floating chat panel that tracks the HOST
   theme in both directions. The composer (@henryco/chat-composer) paints itself dark when an
   ancestor carries .dark, so the panel MUST go dark on a dark host too, or the two clash
   (a white panel with a dark composer). Every colour flows from four --hc-il-* seam tokens
   that flip once under .dark, and the chat-thread + composer tokens are bridged from them. */
.hc-il-root{position:fixed;right:max(1rem,env(safe-area-inset-right));bottom:max(1rem,env(safe-area-inset-bottom));z-index:60;display:flex;flex-direction:column;align-items:flex-end;gap:.75rem;font-family:inherit}
/* On mobile, lift above a host bottom nav bar (account dashboard) so the launcher is never
   hidden behind it. --hc-il-lift is set by the bottomOffset prop; 0 (no lift) everywhere else. */
@media (max-width:767px){.hc-il-root{bottom:calc(max(1rem,env(safe-area-inset-bottom)) + var(--hc-il-lift,0px))}}
.hc-il-fab{display:inline-flex;align-items:center;justify-content:center;width:3.5rem;height:3.5rem;border-radius:999px;border:none;cursor:pointer;background:var(--hc-il-accent,#C9A227);color:var(--hc-il-on-accent,#0b1220);box-shadow:0 14px 34px -8px color-mix(in srgb,var(--hc-il-accent,#C9A227) 55%,transparent),0 4px 12px rgba(11,18,32,.18);transition:transform .2s cubic-bezier(.22,1,.36,1),filter .18s,box-shadow .2s}
.hc-il-fab:hover{filter:brightness(1.05);transform:translateY(-1px)}
.hc-il-fab:active{transform:scale(.95)}
/* Two-tone focus ring so the indicator holds >=3:1 on ANY host background (the FAB floats over
   arbitrary division pages, light or dark): a light gap ring then a dark outer ring. */
.hc-il-fab:focus-visible{outline:none;box-shadow:0 0 0 3px rgba(255,255,255,.92),0 0 0 6px rgba(11,18,32,.55)}
/* Branded focus ring on every in-panel control (close, offer buttons, nav chips). */
.hc-il-close:focus-visible,.hc-il-chip:focus-visible,.hc-il-offer-see:focus-visible,.hc-il-offer-run:focus-visible,.hc-il-offer-cancel:focus-visible{outline:2px solid var(--hc-il-accent,#C9A227);outline-offset:2px}
.hc-il-fab svg{width:1.5rem;height:1.5rem}
/* --- the four seam tokens (light default) + everything bridged from them --- */
.hc-il-panel{
  --hc-il-surface:#ffffff;--hc-il-ink:#0b1220;--hc-il-ink-soft:rgba(11,18,32,.62);--hc-il-line:rgba(11,18,32,.1);
  /* on-accent stays fixed dark-on-gold in BOTH themes — the accent comes from
     the accent prop and does not theme-flip, so this is the documented house
     AA pattern (never white-on-gold). If accent ever flips, add a dark override. */
  --hc-il-on-accent:#0b1220;
  /* Danger flips per theme (chat-thread's --ct-danger defaults to a LIGHT red tuned for a dark bg,
     which fails AA on the light panel): deep red on light, lighter red on dark. Drives the
     failed-send retry + the offer error copy. */
  --hc-il-danger:#b3261e;--ct-danger:#b3261e;
  width:min(24.5rem,calc(100vw - 2rem));height:min(35rem,calc(100dvh - 7rem));
  background:var(--hc-il-surface);border-radius:1.35rem;overflow:hidden;
  box-shadow:0 32px 70px -24px rgba(11,18,32,.42),0 10px 24px -16px rgba(11,18,32,.24);
  border:1px solid var(--hc-il-line);
  animation:hc-il-rise .24s cubic-bezier(.22,1,.36,1);
  --ct-bg:var(--hc-il-surface);--ct-surface:color-mix(in srgb,var(--hc-il-ink) 6%,var(--hc-il-surface));
  --ct-surface-own:color-mix(in srgb,var(--hc-il-accent,#C9A227) 16%,var(--hc-il-surface));
  --ct-header-bg:var(--hc-il-surface);--ct-composer-bg:var(--hc-il-surface);
  --ct-ink:var(--hc-il-ink);--ct-ink-soft:var(--hc-il-ink-soft);--ct-line:var(--hc-il-line);
  --ct-accent:var(--hc-il-accent,#C9A227);--ct-accent-ink:var(--hc-il-ink);--ct-accent-contrast:var(--hc-il-on-accent);
  /* The composer's Send label defaults to white (AA on its teal default) — on the
     gold Intelligence accent it must be the dark on-accent ink. */
  --composer-accent-ink:var(--hc-il-on-accent)}
:where(html.dark,html[data-theme="dark"],.dark) .hc-il-panel{
  --hc-il-surface:#0f1a2c;--hc-il-ink:#F5F1E8;--hc-il-ink-soft:rgba(245,241,232,.64);--hc-il-line:rgba(245,241,232,.14);
  --hc-il-danger:#f4a48f;--ct-danger:#f87171;
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
/* The offer card + nav chips take their OWN full-width line above Send (the composer renders
   extras in its flex-wrap action row; flex-basis:100% forces a wrap) instead of a cramped island. */
.hc-il-extras{display:flex;flex-direction:column;gap:.5rem;padding:.4rem 0 .15rem;flex-basis:100%;width:100%}
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
.hc-il-offer-error{margin:.5rem 0 0;font-size:.75rem;color:var(--hc-il-danger,#b3261e)}
/* F3 governed-action card — every colour flows from the --hc-il-* seam tokens,
   so light + dark are correct by construction (no hardcoded surface/ink). */
.hc-il-action-chip{display:flex;align-items:center;gap:.5rem;justify-content:space-between;border:1px solid color-mix(in srgb,var(--hc-il-accent,#C9A227) 42%,transparent);background:color-mix(in srgb,var(--hc-il-accent,#C9A227) 10%,var(--hc-il-surface));border-radius:999px;padding:.4rem .5rem .4rem .85rem}
.hc-il-action-chip-label{font-size:.78rem;font-weight:600;color:var(--hc-il-ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hc-il-action-review{flex:none;border:none;border-radius:999px;padding:.4rem .85rem;font-size:.76rem;font-weight:700;cursor:pointer;background:var(--hc-il-accent,#C9A227);color:var(--hc-il-on-accent)}
.hc-il-action-card{border:1px solid color-mix(in srgb,var(--hc-il-accent,#C9A227) 40%,transparent);background:color-mix(in srgb,var(--hc-il-accent,#C9A227) 8%,var(--hc-il-surface));border-radius:1rem;padding:.8rem .85rem}
.hc-il-action-card-head{display:flex;align-items:center;gap:.5rem;justify-content:space-between}
.hc-il-action-card-title{font-size:.86rem;font-weight:700;color:var(--hc-il-ink)}
.hc-il-action-tag{flex:none;font-size:.66rem;font-weight:700;letter-spacing:.02em;text-transform:uppercase;padding:.16rem .5rem;border-radius:999px;border:1px solid var(--hc-il-line);color:var(--hc-il-ink)}
.hc-il-action-card-reauth{margin:.4rem 0 0;font-size:.74rem;line-height:1.4;color:var(--hc-il-ink-soft)}
.hc-il-action-tag--irreversible{color:var(--hc-il-danger,#b3261e);border-color:color-mix(in srgb,var(--hc-il-danger,#b3261e) 45%,transparent)}
.hc-il-action-card-body{margin:.45rem 0 0;font-size:.8rem;line-height:1.5;color:var(--hc-il-ink)}
.hc-il-action-card-why{margin:.4rem 0 0;font-size:.74rem;line-height:1.45;color:var(--hc-il-ink-soft);font-style:italic}
.hc-il-action-card-buttons{display:flex;gap:.5rem;margin-top:.65rem}
/* Deep-action step-up (the owner's "print") — inline password verify on the card. */
.hc-il-reauth{margin-top:.65rem;border-top:1px solid var(--hc-il-line);padding-top:.65rem}
.hc-il-reauth-title{margin:0;font-size:.82rem;font-weight:700;color:var(--hc-il-ink)}
.hc-il-reauth-body{margin:.25rem 0 .5rem;font-size:.76rem;line-height:1.45;color:var(--hc-il-ink-soft)}
.hc-il-reauth-row{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center}
.hc-il-reauth-input{flex:1 1 10rem;min-width:0;border:1px solid var(--hc-il-line);border-radius:999px;padding:.48rem .85rem;font-size:.82rem;background:var(--hc-il-surface);color:var(--hc-il-ink);outline:none}
.hc-il-reauth-input:focus{border-color:var(--hc-il-accent,#C9A227);box-shadow:0 0 0 3px color-mix(in srgb,var(--hc-il-accent,#C9A227) 18%,transparent)}
.hc-il-reauth-error{margin:.45rem 0 0;font-size:.75rem;color:var(--hc-il-danger,#b3261e)}
.hc-il-action-confirm{border:none;border-radius:999px;padding:.5rem 1rem;font-size:.8rem;font-weight:700;cursor:pointer;background:var(--hc-il-accent,#C9A227);color:var(--hc-il-on-accent)}
.hc-il-action-confirm:disabled{opacity:.6;cursor:default}
.hc-il-action-cancel{border:1px solid var(--hc-il-line);border-radius:999px;padding:.5rem .85rem;font-size:.8rem;font-weight:600;cursor:pointer;background:transparent;color:var(--hc-il-ink-soft)}
.hc-il-action-outcome{display:flex;align-items:center;gap:.5rem;justify-content:space-between;border:1px solid var(--hc-il-line);background:color-mix(in srgb,var(--hc-il-ink) 5%,var(--hc-il-surface));border-radius:1rem;padding:.6rem .8rem;font-size:.8rem;line-height:1.4;color:var(--hc-il-ink)}
.hc-il-action-outcome--executed{border-color:color-mix(in srgb,var(--hc-il-accent,#C9A227) 42%,transparent)}
.hc-il-action-outcome--failed{border-color:color-mix(in srgb,var(--hc-il-danger,#b3261e) 45%,transparent)}
.hc-il-action-dismiss{flex:none;border:none;background:transparent;color:var(--hc-il-ink-soft);font-size:.74rem;font-weight:600;cursor:pointer;text-decoration:underline}
.hc-il-action-review:focus-visible,.hc-il-action-confirm:focus-visible,.hc-il-action-cancel:focus-visible,.hc-il-action-dismiss:focus-visible{outline:2px solid var(--hc-il-accent,#C9A227);outline-offset:2px}
.hc-il-prose{font-size:.92rem;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere}
.hc-il-prose p{margin:0 0 .55rem}
.hc-il-prose p:last-child{margin-bottom:0}
/* Fill + vertically centre the first-run welcome so it sits balanced above the composer,
   not stranded in a band at the top of the pane. */
.hc-il-empty{display:flex;flex-direction:column;justify-content:center;gap:.45rem;min-height:100%;padding:1.5rem 1.35rem;text-align:left}
/* The panel floats above the device safe area, so the composer must not ALSO inset for it
   (chat-thread + edge-to-edge each add env(safe-area-inset-bottom), stacking dead space on
   notched phones). Flatten it here. */
.hc-il-panel .ct-composer{padding-bottom:.55rem}
.hc-il-empty-title{font-size:1.05rem;font-weight:700;color:var(--hc-il-ink);margin:0;letter-spacing:-.01em}
.hc-il-empty-body{font-size:.9rem;line-height:1.55;color:var(--hc-il-ink-soft);margin:0}
@media (max-width:480px){.hc-il-panel{width:calc(100vw - 1.5rem);height:min(32rem,calc(100dvh - 6rem))}}
@media (prefers-reduced-motion:reduce){.hc-il-panel{animation:none}.hc-il-fab{transition:none}}
`}</style>
  );
}
