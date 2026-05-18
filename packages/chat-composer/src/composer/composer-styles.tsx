"use client";

let injected = false;

const STYLE_ID = "henryco-composer-styles";

/**
 * Premium chat composer motion + surface styles.
 *
 * Curve sources (see motion.ts):
 *   - henrycoSendReady   — 180ms cubic-bezier(0.22, 0.85, 0.32, 1)
 *   - henrycoSendCommit  — 280ms cubic-bezier(0.16, 0.84, 0.44, 1)
 *   - henrycoSendFail    — 360ms cubic-bezier(0.36, 0.07, 0.19, 0.97)
 *   - henrycoExpandComposer — 320ms cubic-bezier(0.18, 0.7, 0.22, 1)
 *   - henrycoDraftPulse  — 1.4s loop cubic-bezier(0.4, 0, 0.2, 1)
 */
const STYLE_BODY = `
@keyframes henryco-draft-pulse {
  0% { transform: scale(1); opacity: 0.55; }
  50% { transform: scale(1.55); opacity: 1; }
  100% { transform: scale(1); opacity: 0.55; }
}
.henryco-draft-pulse {
  animation: henryco-draft-pulse 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes henryco-draft-saved-pop {
  0% { transform: scale(0.6); opacity: 0; }
  60% { transform: scale(1.18); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.henryco-draft-saved-pop {
  animation: henryco-draft-saved-pop 0.36s cubic-bezier(0.16, 0.84, 0.44, 1) both;
}

@keyframes henryco-send-pulse {
  0% { transform: scale(1); }
  35% { transform: scale(1.04); }
  100% { transform: scale(1); }
}
.henryco-send-pulse {
  animation: henryco-send-pulse 0.28s cubic-bezier(0.16, 0.84, 0.44, 1);
}

.henryco-send-ready {
  transform: scale(1.02);
}

@keyframes henryco-send-shake {
  10%, 90% { transform: translateX(-1px); }
  20%, 80% { transform: translateX(2px); }
  30%, 50%, 70% { transform: translateX(-3px); }
  40%, 60% { transform: translateX(3px); }
}
.henryco-send-shake {
  animation: henryco-send-shake 0.36s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

@keyframes henryco-send-commit-fade {
  0% { opacity: 1; transform: translateY(0); }
  60% { opacity: 0; transform: translateY(-6px); }
  61% { opacity: 0; transform: translateY(6px); }
  100% { opacity: 1; transform: translateY(0); }
}
.henryco-send-commit-fade {
  animation: henryco-send-commit-fade 0.28s cubic-bezier(0.16, 0.84, 0.44, 1) both;
}

@keyframes henryco-fullscreen-enter {
  from { opacity: 0; transform: translateY(28px) scale(0.984); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.henryco-fullscreen-enter {
  animation: henryco-fullscreen-enter 0.32s cubic-bezier(0.18, 0.7, 0.22, 1) both;
}

@keyframes henryco-fullscreen-leave {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(32px) scale(0.984); }
}
.henryco-fullscreen-leave {
  animation: henryco-fullscreen-leave 0.26s cubic-bezier(0.18, 0.7, 0.22, 1) forwards;
}

@keyframes henryco-drop-overlay-pulse {
  0%, 100% { box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--composer-accent, #0E7C86) 60%, transparent); }
  50% { box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--composer-accent, #0E7C86) 100%, transparent); }
}
.henryco-drop-overlay-active {
  animation: henryco-drop-overlay-pulse 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.henryco-composer-shell {
  position: relative;
  background-clip: padding-box;
  background-image:
    radial-gradient(120% 120% at 100% 0%, color-mix(in srgb, var(--composer-accent, #0E7C86) 8%, transparent) 0%, transparent 55%),
    linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(252,252,253,1) 100%);
  transition:
    border-color 220ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 220ms cubic-bezier(0.22, 1, 0.36, 1),
    background-color 220ms cubic-bezier(0.22, 1, 0.36, 1);
}
.henryco-composer-shell:where(:focus-within) {
  border-color: color-mix(in srgb, var(--composer-accent, #0E7C86) 32%, rgba(15,23,42,0.10));
  box-shadow:
    0 22px 60px -34px rgba(15,23,42,0.34),
    0 6px 16px rgba(15,23,42,0.06),
    0 0 0 4px color-mix(in srgb, var(--composer-accent, #0E7C86) 14%, transparent);
}
.henryco-composer-shell[data-drag-over="true"] {
  border-color: color-mix(in srgb, var(--composer-accent, #0E7C86) 60%, transparent);
  background-image:
    radial-gradient(120% 120% at 50% 50%, color-mix(in srgb, var(--composer-accent, #0E7C86) 10%, transparent) 0%, transparent 70%),
    linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(252,252,253,1) 100%);
}
:where(.dark) .henryco-composer-shell {
  background-image:
    radial-gradient(120% 120% at 100% 0%, color-mix(in srgb, var(--composer-accent, #0E7C86) 14%, transparent) 0%, transparent 55%),
    linear-gradient(180deg, rgba(15,26,44,1) 0%, rgba(11,20,36,1) 100%);
}
:where(.dark) .henryco-composer-shell:where(:focus-within) {
  border-color: color-mix(in srgb, var(--composer-accent, #0E7C86) 50%, rgba(255,255,255,0.10));
  box-shadow:
    0 26px 80px rgba(0,0,0,0.55),
    0 0 0 4px color-mix(in srgb, var(--composer-accent, #0E7C86) 22%, transparent);
}

.henryco-attach-pill {
  background-image: linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,248,250,1) 100%);
  transition:
    transform 200ms cubic-bezier(0.22, 1, 0.36, 1),
    border-color 200ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 200ms cubic-bezier(0.22, 1, 0.36, 1);
}
.henryco-attach-pill:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--composer-accent, #0E7C86) 28%, rgba(15,23,42,0.10));
  box-shadow: 0 6px 16px rgba(15,23,42,0.06);
}
:where(.dark) .henryco-attach-pill {
  background-image: linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%);
}

.henryco-fullscreen-strip {
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--composer-accent, #0E7C86) 80%, transparent) 50%, transparent 100%);
  pointer-events: none;
}

/* ──────────────────────────────────────────────────────────────────
   Fullscreen composer — bulletproof readability.
   The FullScreenComposer renders into document.body via createPortal,
   which means it escapes any parent surface (e.g., the studio
   messaging centre's hardcoded dark surface). Without explicit rules
   the textarea inherits a light-text colour over a dark portal
   background and the user can't see what they're typing.

   Rules below cover three triggers for a dark fullscreen:
     1. html.dark / [data-theme="dark"] — class-based theme
     2. prefers-color-scheme: dark — system theme
     3. data-tone="studio"/"marketplace" — surfaces that are always
        dark regardless of the page-level theme
   ────────────────────────────────────────────────────────────────── */

[data-composer-fullscreen="true"] {
  background: #ffffff;
  color: #18181b;
}
[data-composer-fullscreen="true"] textarea {
  color: #18181b;
  caret-color: #18181b;
}
[data-composer-fullscreen="true"] textarea::placeholder {
  color: rgba(15, 23, 42, 0.45);
}

:where(html.dark, html[data-theme="dark"]) [data-composer-fullscreen="true"],
[data-composer-fullscreen="true"][data-tone="studio"],
[data-composer-fullscreen="true"][data-tone="marketplace"] {
  background: #070D18;
  color: #F5F4EE;
}
:where(html.dark, html[data-theme="dark"]) [data-composer-fullscreen="true"] textarea,
[data-composer-fullscreen="true"][data-tone="studio"] textarea,
[data-composer-fullscreen="true"][data-tone="marketplace"] textarea {
  color: #F5F4EE;
  caret-color: #F5F4EE;
}
:where(html.dark, html[data-theme="dark"]) [data-composer-fullscreen="true"] textarea::placeholder,
[data-composer-fullscreen="true"][data-tone="studio"] textarea::placeholder,
[data-composer-fullscreen="true"][data-tone="marketplace"] textarea::placeholder {
  color: rgba(245, 244, 238, 0.45);
}

@media (prefers-color-scheme: dark) {
  [data-composer-fullscreen="true"]:not([data-color-scheme="light"]) {
    background: #070D18;
    color: #F5F4EE;
  }
  [data-composer-fullscreen="true"]:not([data-color-scheme="light"]) textarea {
    color: #F5F4EE;
    caret-color: #F5F4EE;
  }
  [data-composer-fullscreen="true"]:not([data-color-scheme="light"]) textarea::placeholder {
    color: rgba(245, 244, 238, 0.45);
  }
}

/* V5-4 polish: composer text input class hook — applied to the
   textarea via .henryco-composer-input. Provides a precise caret
   accent and host-theme-aware ::selection styling that the broader
   [data-composer-fullscreen] rules above don't override. The fullscreen
   rules win on color/background; this stays narrow to caret + selection
   so the two layers compose rather than collide. */
.henryco-composer-input {
  caret-color: var(--composer-accent, #0E7C86);
}
.henryco-composer-input::selection {
  background-color: color-mix(in srgb, var(--composer-accent, #0E7C86) 18%, transparent);
}

/* iOS Safari triggers a viewport zoom whenever a focused input has a
   computed font-size below 16px. The Tailwind utilities on the inline
   textarea ship 15/15.5px — premium on desktop, but jarring on mobile
   because the page kicks into the zoom state and refuses to settle
   back when the keyboard hides. The composer marks its textarea with
   the data-hc-no-zoom attribute; this rule enforces 16px on small
   viewports so Safari leaves the viewport alone. Layout barely budges
   because the bump only kicks in under 640px where the textarea is
   full-bleed, and the line-height is generous enough to absorb 1px. */
@media (max-width: 640px) {
  [data-hc-no-zoom],
  [data-composer-input],
  .henryco-composer-input {
    font-size: 16px !important;
    line-height: 1.5 !important;
  }
}

/* ────────────────────────────────────────────────────────────────────
   Edge-to-edge composer on mobile — WhatsApp / iMessage parity.

   On phones (<= 767px) every CHAT-FIRST surface in the monorepo should
   render the composer as device chrome, not a floating card. That means:
     - No outer border-radius (rounded-[1.6rem] from the Tailwind
       utility goes to 0 so the shell touches both viewport edges).
     - No outer card border (the JSX ships a class="border" — we drop
       it to a single 1px hairline border-top that ties the bar to the
       chat above with no double-line against the bottom fade).
     - No horizontal padding on the shell itself (px-3 → 0). Inner
       padding moves onto the children so the textarea + action row
       still have breathing room without a visible side gutter.
     - Safe-area-inset-bottom on the bottom edge so iOS home indicator
       and Android gesture bar stay clear.
     - Solid frosted background (no shadow leaking sideways).
   The inner textarea keeps its own rounded pill via the
   .henryco-composer-input rules above; only the OUTER shell is
   stripped of its card chrome.

   SCOPE: this rule only fires when the composer is mounted inside a
   .mt-composer-host (the @henryco/messaging-thread host wrapper)
   OR carries data-hc-edge-to-edge="true" (host opt-in). That way
   form-embedded composers (NewSupportForm inside .acct-card, Care
   ReplyComposer inside .care-card) keep their rounded chrome — they're
   not chat surfaces and shouldn't read as device-bottom-bars. Hosts
   that want WhatsApp behaviour without MessageThread can set the
   data attribute (see ChatComposer's edgeToEdgeMobile prop).
   ──────────────────────────────────────────────────────────────────── */

@media (max-width: 767px) {
  .mt-composer-host .henryco-composer-shell,
  .henryco-composer-shell[data-hc-edge-to-edge="true"] {
    border-radius: 0 !important;
    border-left-width: 0 !important;
    border-right-width: 0 !important;
    border-bottom-width: 0 !important;
    border-top-width: 1px !important;
    border-top-color: color-mix(in srgb, currentColor 12%, transparent) !important;
    padding-left: 0.6rem !important;
    padding-right: 0.6rem !important;
    padding-top: 0.5rem !important;
    padding-bottom: max(env(safe-area-inset-bottom, 0px), 0.5rem) !important;
    /* Solid frosted background — no shadow halo on the sides since
       there's no gutter to project one into. */
    box-shadow: none !important;
    /* The shell still renders its gradient via background-image, which
       is fine — the gradient blends with the chat surface above. */
  }
  /* Tame the focus-within shadow ring on mobile — a 4px ring around an
     edge-to-edge bar reads as a double-line. The inner textarea still
     gets its own focus styling via border-color change. */
  .mt-composer-host .henryco-composer-shell:where(:focus-within),
  .henryco-composer-shell[data-hc-edge-to-edge="true"]:where(:focus-within) {
    box-shadow:
      0 -8px 24px -16px rgba(15, 17, 24, 0.18) !important;
  }
  /* Strip the fullscreen-strip 3px decorative top line on mobile only
     within chat surfaces — it stacks with the new border-top hairline. */
  .mt-composer-host .henryco-fullscreen-strip,
  .henryco-composer-shell[data-hc-edge-to-edge="true"] .henryco-fullscreen-strip {
    display: none !important;
  }
}

/* V5-4 polish: gentle "alive" expand-button breath when the composer is
   empty. Stops as soon as the user types a character so it never
   competes with active typing. Hosts can opt out by setting
   data-hc-quiet on the composer shell. */
@keyframes henryco-expand-breathe {
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 color-mix(in srgb, var(--composer-accent, #0E7C86) 0%, transparent); }
  50% { transform: scale(1.04); box-shadow: 0 0 0 6px color-mix(in srgb, var(--composer-accent, #0E7C86) 6%, transparent); }
}
.henryco-composer-shell:not([data-has-text="true"]):not([data-hc-quiet]) .henryco-composer-expand {
  animation: henryco-expand-breathe 3.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
@media (prefers-reduced-motion: reduce) {
  .henryco-composer-shell .henryco-composer-expand {
    animation: none !important;
    transform: none !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .henryco-draft-pulse,
  .henryco-draft-saved-pop,
  .henryco-send-pulse,
  .henryco-send-ready,
  .henryco-send-shake,
  .henryco-send-commit-fade,
  .henryco-fullscreen-enter,
  .henryco-fullscreen-leave,
  .henryco-drop-overlay-active {
    animation: none !important;
    transform: none !important;
  }
  .henryco-composer-shell,
  .henryco-attach-pill {
    transition: none !important;
  }
}
`;

export function ensureComposerStyles() {
  if (typeof document === "undefined") return;
  if (injected) return;
  if (document.getElementById(STYLE_ID)) {
    injected = true;
    return;
  }
  const tag = document.createElement("style");
  tag.id = STYLE_ID;
  tag.appendChild(document.createTextNode(STYLE_BODY));
  document.head.appendChild(tag);
  injected = true;
}
