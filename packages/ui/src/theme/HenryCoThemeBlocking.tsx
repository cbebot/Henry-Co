import { HENRYCO_PUBLIC_THEME_STORAGE_KEY } from "./constants";

/**
 * Runs before paint: syncs `dark` class, `data-theme`, and `colorScheme` with the same
 * localStorage key next-themes uses (`henryco-public-theme`). Prevents light/dark flash.
 */
export function HenryCoThemeBlocking() {
  const key = HENRYCO_PUBLIC_THEME_STORAGE_KEY;
  const script = `
    (() => {
      var root = document.documentElement;
      var KEY = ${JSON.stringify(key)};
      function readSaved() {
        try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
      }
      function computeResolved(saved) {
        if (saved === "light" || saved === "dark") return saved;
        var m = window.matchMedia("(prefers-color-scheme: dark)");
        return m.matches ? "dark" : "light";
      }
      function applyResolved(resolved) {
        root.dataset.theme = resolved;
        root.style.colorScheme = resolved;
        // THEME-01: manage BOTH light and dark classes so apps that
        // declare a .light selector override (dark-first apps like
        // staff HQ, property, learn, studio) get the correct pre-paint
        // values before next-themes hydrates. next-themes runs with
        // attribute=[class,data-theme] post-mount; this script mirrors
        // that contract pre-paint so there is no FOUC either way.
        root.classList.toggle("dark", resolved === "dark");
        root.classList.toggle("light", resolved === "light");
      }
      var saved = readSaved();
      applyResolved(computeResolved(saved));
      if (saved === "light" || saved === "dark") return;
      var media = window.matchMedia("(prefers-color-scheme: dark)");
      function onChange() {
        var s = readSaved();
        if (s === "light" || s === "dark") return;
        applyResolved(computeResolved(s));
      }
      if (typeof media.addEventListener === "function") media.addEventListener("change", onChange);
      else if (typeof media.addListener === "function") media.addListener(onChange);
    })();
  `;

  const styles = `
    :root {
      --site-bg: #050816;
      --site-surface: rgba(255,255,255,0.05);
      --site-surface-strong: rgba(255,255,255,0.08);
      --site-border: rgba(255,255,255,0.10);
      --site-text: #F5F1E8;
      --site-text-soft: #C9C2B6;
      --site-text-muted: #8A857C;
      --site-header-bg: rgba(5,8,22,0.82);
      --site-footer-bg: rgba(0,0,0,0.20);
      --site-card-shadow: 0 24px 100px rgba(0,0,0,0.24);
      /* Slice C (2026-07-16): value-aligned to the canonical brand gold
         (--acct-gold / --hc-accent dark ramp). The legacy #b2863b painted an
         off-brand gold pre-paint wherever a --site-accent consumer rendered
         under this blocking style — same-value alignment means the pre-paint
         and hydrated accents are now identical (no flash, no drift). */
      --site-accent: #D4AF37;
      --site-radius-sm: 0.5rem;
      --site-radius-md: 0.75rem;
      --site-radius-lg: 1rem;
      --site-radius-xl: 1.5rem;
      color-scheme: dark;
    }

    html[data-theme="light"] {
      --site-bg: #f6f8fc;
      --site-surface: rgba(255,255,255,0.86);
      --site-surface-strong: rgba(255,255,255,0.96);
      --site-border: rgba(15,23,42,0.10);
      --site-text: #0f172a;
      --site-text-soft: rgba(15,23,42,0.76);
      --site-text-muted: rgba(15,23,42,0.55);
      --site-header-bg: rgba(246,248,252,0.82);
      --site-footer-bg: rgba(255,255,255,0.70);
      --site-card-shadow: 0 24px 80px rgba(15,23,42,0.08);
      /* Slice C: canonical light-theme brand gold (--acct-gold light ramp). */
      --site-accent: #C9A227;
      color-scheme: light;
    }

    html[data-theme="dark"] {
      color-scheme: dark;
    }

    @keyframes hc-dropdown-in {
      from { opacity: 0; transform: scale(0.94) translateY(-6px); filter: blur(2px); }
      to   { opacity: 1; transform: scale(1)    translateY(0);    filter: blur(0);   }
    }
  `;

  return (
    <>
      <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: script }} />
      <style dangerouslySetInnerHTML={{ __html: styles }} />
    </>
  );
}
