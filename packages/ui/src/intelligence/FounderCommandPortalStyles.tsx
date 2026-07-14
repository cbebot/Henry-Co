"use client";

/**
 * FounderCommandPortalStyles — the founder command cockpit, scoped.
 * Onyx stage + gold HUD; a reactor console, not a chat. Injected once.
 */
export function FounderCommandPortalStyles() {
  return (
    <style
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: `
.fcp-fab {
  position: fixed; z-index: 60; bottom: 1.5rem; right: 1.5rem;
  width: 3.5rem; height: 3.5rem; border: 0; border-radius: 999px; cursor: pointer;
  background: radial-gradient(circle at 32% 28%, #f6e4a6, var(--fcp-accent, #c9a227) 62%, #a88718);
  color: #201700; display: grid; place-items: center;
  box-shadow: 0 0 0 1px rgba(240,212,136,.4), 0 14px 40px -8px rgba(201,162,39,.6);
  transition: transform .16s ease, box-shadow .2s ease;
}
.fcp-fab:hover { transform: translateY(-2px) scale(1.03); }
.fcp-fab:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
.fcp-fab-icon { width: 1.5rem; height: 1.5rem; }
@media (min-width: 1024px) { .fcp-fab { bottom: 2rem; right: 2rem; } }

.fcp-portal {
  --fcp-mono: ui-monospace, "SF Mono", "Cascadia Code", Consolas, "Liberation Mono", monospace;
  position: fixed; inset: 0; z-index: 90; isolation: isolate;
  display: flex; flex-direction: column;
  background:
    radial-gradient(120% 80% at 50% -10%, rgba(201,162,39,.12) 0%, transparent 55%),
    linear-gradient(180deg, #0b0f16 0%, #070a10 60%, #05070b 100%);
  color: #f3ede1;
  font-family: var(--acct-font-sans, var(--hc-font-sans, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif));
  animation: fcp-in .28s cubic-bezier(.22,1,.36,1) both;
}
@keyframes fcp-in { from { opacity: 0; } to { opacity: 1; } }

.fcp-ambient {
  position: absolute; inset: -10%; z-index: 0; pointer-events: none;
  background: radial-gradient(38% 34% at 50% 42%, rgba(240,212,136,.1) 0%, transparent 70%);
  animation: fcp-breathe 16s ease-in-out infinite;
}
.fcp-grid {
  position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: .5;
  background-image:
    linear-gradient(rgba(201,162,39,.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(201,162,39,.05) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(120% 90% at 50% 30%, #000 0%, transparent 78%);
}
@keyframes fcp-breathe { 0%,100% { opacity:.7; transform:scale(1);} 50% { opacity:1; transform:scale(1.06);} }
.fcp-portal > *:not(.fcp-ambient):not(.fcp-grid) { position: relative; z-index: 1; }

.fcp-top {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  padding: .9rem clamp(1rem, 3vw, 2.25rem); border-bottom: 1px solid rgba(201,162,39,.12);
}
.fcp-brand { display: inline-flex; align-items: center; gap: .85rem; color: #f3ede1; }
.fcp-mark { font-family: var(--fcp-mono); font-size: .62rem; letter-spacing: .28em; text-transform: uppercase; color: rgba(240,212,136,.7); }
.fcp-clock { font-family: var(--fcp-mono); font-size: 1rem; letter-spacing: .18em; color: #f0d488; text-shadow: 0 0 12px rgba(201,162,39,.5); }
.fcp-top-actions { display: inline-flex; align-items: center; gap: .5rem; }

.fcp-mode { display: inline-flex; padding: 3px; border-radius: 999px; border: 1px solid rgba(201,162,39,.2); background: rgba(255,255,255,.03); }
.fcp-mode-btn {
  display: inline-flex; align-items: center; gap: .35rem; padding: .35rem .75rem; border: 0; border-radius: 999px; cursor: pointer;
  background: transparent; color: rgba(243,237,225,.6); font-size: .74rem; font-weight: 600; font-family: inherit; letter-spacing: .02em;
  transition: background .16s ease, color .16s ease;
}
.fcp-mode-btn svg { width: .95rem; height: .95rem; }
.fcp-mode-btn--on { background: radial-gradient(circle at 30% 28%, #f6e4a6, var(--fcp-accent,#c9a227) 70%, #a88718); color: #201700; box-shadow: 0 4px 14px -4px rgba(201,162,39,.6); }
.fcp-mode-btn:focus-visible { outline: 2px solid var(--fcp-accent,#c9a227); outline-offset: 2px; }

.fcp-icon-btn { width: 2.4rem; height: 2.4rem; display: grid; place-items: center; border-radius: .8rem;
  border: 1px solid rgba(255,255,255,.09); background: rgba(255,255,255,.03); color: rgba(243,237,225,.82); cursor: pointer; transition: all .16s ease; }
.fcp-icon-btn svg { width: 1.15rem; height: 1.15rem; }
.fcp-icon-btn:hover { background: rgba(255,255,255,.08); color: #fff; }
.fcp-icon-btn:disabled { opacity: .4; cursor: not-allowed; }
.fcp-icon-btn:focus-visible { outline: 2px solid var(--fcp-accent,#c9a227); outline-offset: 2px; }
.fcp-close:hover { background: rgba(239,68,68,.16); color: #ffd9d9; border-color: rgba(239,68,68,.3); }

.fcp-stage { flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; overflow-y: auto; overflow-x: hidden; padding: clamp(.5rem, 2.4vh, 1.4rem) 1rem 1.25rem; }

.fcp-reactor { position: relative; display: grid; place-items: center; padding: 1rem; flex: none; }
.fcp-reactor--compact { padding: .5rem; }
.fcp-core { filter: drop-shadow(0 0 34px rgba(201,162,39,.3)); }
.fcp-bracket { position: absolute; width: 1.5rem; height: 1.5rem; border: 1.5px solid rgba(240,212,136,.55); }
.fcp-bracket--tl { top: 0; left: 0; border-right: 0; border-bottom: 0; }
.fcp-bracket--tr { top: 0; right: 0; border-left: 0; border-bottom: 0; }
.fcp-bracket--bl { bottom: 0; left: 0; border-right: 0; border-top: 0; }
.fcp-bracket--br { bottom: 0; right: 0; border-left: 0; border-top: 0; }
.fcp-core-status { position: absolute; bottom: -.4rem; left: 50%; transform: translateX(-50%);
  display: inline-flex; align-items: center; gap: .45rem; font-family: var(--fcp-mono); font-size: .72rem; letter-spacing: .22em; text-transform: uppercase; color: rgba(240,212,136,.85); white-space: nowrap; }
.fcp-core-status-dot { width: 7px; height: 7px; border-radius: 999px; background: var(--fcp-accent,#c9a227); box-shadow: 0 0 10px 1px rgba(201,162,39,.7); }
.fcp-core-status[data-mode="listening"] .fcp-core-status-dot { background:#7fd6bf; box-shadow:0 0 12px 2px rgba(127,214,191,.85); animation: fcp-blink 1s infinite; }
.fcp-core-status[data-mode="thinking"] .fcp-core-status-dot { animation: fcp-blink .65s infinite; }
.fcp-core-status[data-mode="speaking"] .fcp-core-status-dot { background:#f6e4a6; animation: fcp-blink .5s infinite; }
@keyframes fcp-blink { 0%,100%{opacity:1;} 50%{opacity:.3;} }

.fcp-hero-copy { max-width: 42rem; text-align: center; margin-top: .9rem; padding: 0 1rem; }
.fcp-eyebrow { font-family: var(--fcp-mono); font-size: .66rem; font-weight: 600; letter-spacing: .3em; text-transform: uppercase; color: #f0d488; }
.fcp-headline { margin-top: .6rem; font-family: var(--acct-font-display, var(--hc-font-serif, Georgia, serif));
  font-size: clamp(1.6rem, 3vw, 2.35rem); line-height: 1.08; letter-spacing: -.02em; font-weight: 540; color: #f6f1e7; text-wrap: balance; }
.fcp-focus { margin-top: .7rem; font-size: .95rem; line-height: 1.55; color: rgba(243,237,225,.66); }
.fcp-pulse { margin-top: 1.1rem; display: flex; flex-wrap: wrap; gap: .5rem; justify-content: center; }
.fcp-pulse-chip { display: inline-flex; align-items: baseline; gap: .45rem; padding: .35rem .7rem; border-radius: .55rem;
  border: 1px solid rgba(240,212,136,.14); background: rgba(255,255,255,.02); font-family: var(--fcp-mono); }
.fcp-pulse-label { font-size: .58rem; letter-spacing: .18em; color: rgba(240,212,136,.55); }
.fcp-pulse-value { font-size: .82rem; font-weight: 600; color: #f0d488; font-variant-numeric: tabular-nums; }

.fcp-auto { display: inline-flex; align-items: center; gap: .35rem; padding: .35rem .7rem; border-radius: 999px; cursor: pointer;
  border: 1px solid rgba(240,212,136,.2); background: rgba(255,255,255,.03); color: rgba(243,237,225,.55);
  font-family: var(--fcp-mono); font-size: .62rem; letter-spacing: .16em; text-transform: uppercase; transition: all .16s ease; }
.fcp-auto svg { width: .85rem; height: .85rem; }
.fcp-auto--on { border-color: rgba(127,214,191,.45); background: rgba(127,214,191,.08); color: #a6e9d4; }
.fcp-auto:focus-visible { outline: 2px solid var(--fcp-accent,#c9a227); outline-offset: 2px; }
.fcp-icon-btn--on { border-color: rgba(240,212,136,.45); background: rgba(240,212,136,.1); color: #f0d488; }

.fcp-recent { position: absolute; top: 4.2rem; right: clamp(1rem, 3vw, 2.25rem); z-index: 5; width: min(22rem, calc(100vw - 2rem));
  max-height: min(24rem, 60vh); overflow-y: auto; padding: .9rem; border-radius: 1rem;
  border: 1px solid rgba(240,212,136,.2); background: rgba(10,14,21,.97); box-shadow: 0 24px 70px -18px rgba(0,0,0,.8);
  animation: fcp-rise .25s cubic-bezier(.22,1,.36,1) both; }
.fcp-recent-title { margin: 0 0 .5rem; font-family: var(--fcp-mono); font-size: .62rem; letter-spacing: .22em; text-transform: uppercase; color: rgba(240,212,136,.7); }
.fcp-recent-empty { margin: 0; font-size: .82rem; color: rgba(243,237,225,.55); }
.fcp-recent-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .3rem; }
.fcp-recent-row { display: flex; align-items: center; gap: .4rem; }
.fcp-recent-open { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: flex-start; gap: .1rem;
  padding: .5rem .65rem; border-radius: .65rem; border: 1px solid transparent; background: transparent; cursor: pointer;
  color: #f3ede1; text-align: left; transition: background .15s ease, border-color .15s ease; }
.fcp-recent-open:hover:not(:disabled) { background: rgba(240,212,136,.07); border-color: rgba(240,212,136,.18); }
.fcp-recent-open:disabled { opacity: .5; }
.fcp-recent-name { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .85rem; font-weight: 550; }
.fcp-recent-when { font-family: var(--fcp-mono); font-size: .6rem; letter-spacing: .06em; color: rgba(243,237,225,.4); }
.fcp-recent-del { flex: none; width: 2rem; height: 2rem; display: grid; place-items: center; border-radius: .55rem;
  border: 1px solid transparent; background: transparent; color: rgba(243,237,225,.4); cursor: pointer; transition: all .15s ease; }
.fcp-recent-del svg { width: .9rem; height: .9rem; }
.fcp-recent-del:hover:not(:disabled) { color: #ffc9c9; background: rgba(239,68,68,.12); border-color: rgba(239,68,68,.3); }
.fcp-recent-open:focus-visible, .fcp-recent-del:focus-visible { outline: 2px solid var(--fcp-accent,#c9a227); outline-offset: 2px; }

.fcp-cmds { margin-top: 1.4rem; display: flex; flex-wrap: wrap; gap: .55rem; justify-content: center; }
.fcp-cmd { display: inline-flex; align-items: center; gap: .5rem; padding: .58rem 1rem; border-radius: 999px; cursor: pointer;
  border: 1px solid rgba(240,212,136,.28); background: rgba(240,212,136,.05); color: #f4ecd6; font-size: .86rem; font-weight: 550; font-family: inherit;
  transition: background .16s ease, border-color .16s ease, transform .16s ease; }
.fcp-cmd:hover:not(:disabled) { background: rgba(240,212,136,.13); border-color: rgba(240,212,136,.5); transform: translateY(-1px); }
.fcp-cmd:disabled { opacity: .45; cursor: not-allowed; }
.fcp-cmd:focus-visible { outline: 2px solid var(--fcp-accent,#c9a227); outline-offset: 2px; }
.fcp-cmd-spark { width: 6px; height: 6px; border-radius: 999px; background: radial-gradient(circle at 30% 30%, #f6e4a6, var(--fcp-accent,#c9a227)); box-shadow: 0 0 8px 1px rgba(201,162,39,.7); }

.fcp-briefing-steps { margin-top: 1rem; display: flex; flex-wrap: wrap; gap: .6rem; justify-content: center; }
.fcp-briefing-steps::before { content: ""; flex-basis: 100%; height: 0; }
.fcp-step { display: inline-flex; align-items: center; gap: .5rem; padding: .55rem .95rem; border-radius: 999px;
  border: 1px solid rgba(240,212,136,.22); background: rgba(240,212,136,.06); color: #f2e6c4; font-size: .85rem; font-weight: 550; text-decoration: none; transition: all .16s ease; }
.fcp-step:hover { background: rgba(240,212,136,.13); border-color: rgba(240,212,136,.4); transform: translateY(-1px); }
.fcp-step-icon { width: .85rem; height: .85rem; }
.fcp-step--critical { border-color: rgba(248,113,113,.35); background: rgba(248,113,113,.08); color: #ffc9c9; }
.fcp-step--warning { border-color: rgba(251,191,36,.3); background: rgba(251,191,36,.08); color: #ffe6a1; }

.fcp-thread { width: 100%; max-width: 46rem; flex: 1; min-height: 0; overflow-y: auto; padding: 1.25rem clamp(1rem, 4vw, 2rem) .5rem; display: flex; flex-direction: column; gap: 1.15rem; }
.fcp-turn { display: flex; gap: .7rem; animation: fcp-rise .4s cubic-bezier(.22,1,.36,1) both; }
.fcp-turn--you { justify-content: flex-end; }
.fcp-turn--you .fcp-turn-body { background: rgba(240,212,136,.1); border: 1px solid rgba(240,212,136,.18); color: #f6efdd; border-radius: 1rem 1rem .3rem 1rem; padding: .7rem 1rem; max-width: 80%; }
.fcp-turn--ai .fcp-turn-body { color: #ece5d6; font-size: 1.02rem; line-height: 1.62; max-width: 100%; font-family: var(--acct-font-display, var(--hc-font-serif, Georgia, serif)); }
.fcp-turn-mark { flex: none; width: 8px; height: 8px; margin-top: .55rem; border-radius: 999px; background: radial-gradient(circle at 30% 30%, #f6e4a6, var(--fcp-accent,#c9a227)); box-shadow: 0 0 10px 1px rgba(201,162,39,.6); }
@keyframes fcp-rise { from { opacity:0; transform: translateY(10px);} to { opacity:1; transform:none;} }
.fcp-typing { display: inline-flex; gap: .3rem; }
.fcp-typing span { width: 6px; height: 6px; border-radius: 999px; background: var(--fcp-accent,#c9a227); animation: fcp-bob 1s infinite; }
.fcp-typing span:nth-child(2){ animation-delay:.15s;} .fcp-typing span:nth-child(3){ animation-delay:.3s;}
@keyframes fcp-bob { 0%,100%{transform:translateY(0);opacity:.5;} 50%{transform:translateY(-4px);opacity:1;} }
/* The shared F3 extras block (IntelligenceExtras) flows entirely from these
   --hc-il-* seam tokens. Retuned here for the onyx cockpit — dark surface, warm
   ink, gold accent — so the governed-action cards and nav chips read as native
   HUD, not a light chat panel. The .hc-il-* class RULES come from
   IntelligenceLauncherStyles (rendered by the portal). */
.fcp-extras {
  margin-top: .4rem; width: 100%;
  --hc-il-surface: #101825;
  --hc-il-ink: #f3ede1;
  --hc-il-ink-soft: rgba(243,237,225,.62);
  --hc-il-line: rgba(240,212,136,.16);
  --hc-il-accent: var(--fcp-accent, #c9a227);
  --hc-il-on-accent: #201700;
  --hc-il-danger: #f4a48f;
}

.fcp-syslog { width: 100%; max-width: 46rem; margin: .5rem auto 0; padding: .6rem clamp(1rem, 4vw, 1rem);
  display: flex; flex-direction: column; gap: .1rem; font-family: var(--fcp-mono); font-size: .68rem; letter-spacing: .02em;
  color: rgba(127,214,191,.72); border-top: 1px solid rgba(201,162,39,.1); max-height: 6.5rem; overflow: hidden; }
.fcp-syslog-line { opacity: .5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fcp-syslog-line:last-child { opacity: 1; color: #a6e9d4; }

.fcp-composer { padding: .9rem clamp(1rem, 4vw, 2rem) .5rem; border-top: 1px solid rgba(201,162,39,.12); }
.fcp-error { max-width: 46rem; margin: 0 auto .6rem; color: #ffc9c9; font-size: .85rem; text-align: center; }
.fcp-voice-notice { max-width: 46rem; margin: 0 auto .6rem; color: #ffe6a1; font-size: .82rem; text-align: center; }
.fcp-composer-row { max-width: 46rem; margin: 0 auto; display: flex; align-items: center; gap: .6rem; }
.fcp-live { display: inline-flex; align-items: center; gap: .4rem; padding: 0 .6rem; height: 3rem; font-family: var(--fcp-mono); font-size: .68rem; letter-spacing: .18em; color: rgba(243,237,225,.4); }
.fcp-live-dot { width: 7px; height: 7px; border-radius: 999px; background: rgba(243,237,225,.3); }
.fcp-live--on { color: #a6e9d4; }
.fcp-live--on .fcp-live-dot { background: #7fd6bf; box-shadow: 0 0 10px 1px rgba(127,214,191,.8); animation: fcp-blink 1s infinite; }
.fcp-mic { flex: none; width: 3rem; height: 3rem; display: grid; place-items: center; border-radius: 999px; cursor: pointer; border: 1px solid rgba(240,212,136,.25); background: rgba(240,212,136,.06); color: #f0d488; transition: all .16s ease; }
.fcp-mic svg { width: 1.25rem; height: 1.25rem; }
.fcp-mic:hover { background: rgba(240,212,136,.13); }
.fcp-mic--on { background: radial-gradient(circle at 32% 28%, #f6e4a6, var(--fcp-accent,#c9a227) 62%, #a88718); color:#201700; border-color: transparent; animation: fcp-mic-pulse 1.4s ease-in-out infinite; }
@keyframes fcp-mic-pulse { 0%,100%{ box-shadow: 0 0 0 0 rgba(201,162,39,.5);} 50%{ box-shadow: 0 0 0 10px rgba(201,162,39,0);} }
.fcp-mic:focus-visible { outline: 2px solid var(--fcp-accent,#c9a227); outline-offset: 2px; }
.fcp-input { flex: 1; height: 3rem; padding: 0 1.1rem; border-radius: 1rem; font-size: 1rem; font-family: inherit;
  border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.04); color: #f3ede1; outline: none; transition: border-color .16s ease, box-shadow .16s ease; }
.fcp-input::placeholder { color: rgba(243,237,225,.4); }
.fcp-input:focus { border-color: var(--fcp-accent,#c9a227); box-shadow: 0 0 0 3px rgba(201,162,39,.18); }
.fcp-send { flex: none; width: 3rem; height: 3rem; display: grid; place-items: center; border-radius: 1rem; cursor: pointer; border: 0;
  background: linear-gradient(180deg,#e0bf4e,var(--fcp-accent,#c9a227) 46%,#a88718); color:#1a1408; transition: filter .16s ease, transform .12s ease; }
.fcp-send svg { width: 1.2rem; height: 1.2rem; }
.fcp-send:hover:not(:disabled) { filter: brightness(1.05); }
.fcp-send:disabled { opacity: .45; cursor: not-allowed; }
.fcp-send:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

.fcp-footer { display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  padding: .5rem clamp(1rem, 3vw, 2.25rem) .7rem; border-top: 1px solid rgba(201,162,39,.1);
  font-family: var(--fcp-mono); font-size: .58rem; letter-spacing: .22em; color: rgba(240,212,136,.4); text-transform: uppercase; }
.fcp-footer span:nth-child(2) { color: rgba(248,113,113,.5); }

@media (max-width: 640px) {
  .fcp-mode-btn { padding: .35rem .55rem; font-size: 0; gap: 0; }
  .fcp-mode-btn svg { width: 1.05rem; height: 1.05rem; }
  .fcp-auto { padding: .35rem .55rem; font-size: 0; gap: 0; letter-spacing: 0; }
  .fcp-auto svg { width: 1rem; height: 1rem; }
  .fcp-mark, .fcp-footer span:nth-child(2) { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .fcp-portal, .fcp-ambient, .fcp-turn, .fcp-mic--on, .fcp-typing span, .fcp-core-status-dot, .fcp-live--on .fcp-live-dot { animation: none !important; }
}
`,
      }}
    />
  );
}
