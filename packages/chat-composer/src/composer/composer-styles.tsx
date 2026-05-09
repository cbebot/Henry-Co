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

/* V5-4 polish: composer text input — robust contrast and "alive" focus.
   The textarea inherits color from the host theme (Tailwind dark: classes
   set zinc-900 / white), but we ALSO bind to the global --site-text token
   when present so hosts using the public theme system get the exact
   foreground that everything else on the page uses. caret-color is
   already set via Tailwind's caret-[var] but we mirror it here for safety
   in case an ancestor overrode it. */
.henryco-composer-input {
  caret-color: var(--composer-accent, #0E7C86);
  color: var(--site-text, currentColor);
  -webkit-text-fill-color: var(--site-text, currentColor);
}
:where(.dark) .henryco-composer-input {
  color: var(--site-text, #F5F1E8);
  -webkit-text-fill-color: var(--site-text, #F5F1E8);
}
.henryco-composer-input::placeholder {
  color: color-mix(in srgb, var(--site-text, currentColor) 45%, transparent);
}
:where(.dark) .henryco-composer-input::placeholder {
  color: color-mix(in srgb, var(--site-text, #F5F1E8) 35%, transparent);
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

/* V5-4 polish: full-screen overlay surface that reads from the host
   theme variables. Falls back to the white/zinc-#0b1220 Tailwind classes
   already on the element — these rules just sit above as gentle
   theme-aware overrides when the host actually defines --site-bg. */
.henryco-fullscreen-overlay {
  background-color: var(--site-bg, #ffffff);
  color: var(--site-text, #0f172a);
  -webkit-text-fill-color: var(--site-text, #0f172a);
}
:where(.dark) .henryco-fullscreen-overlay {
  background-color: var(--site-bg, #0b1220);
  color: var(--site-text, #F5F1E8);
  -webkit-text-fill-color: var(--site-text, #F5F1E8);
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
