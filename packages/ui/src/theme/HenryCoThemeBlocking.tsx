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
        root.classList.toggle("dark", resolved === "dark");
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
      --site-text: rgba(255,255,255,0.96);
      --site-text-soft: rgba(255,255,255,0.70);
      --site-text-muted: rgba(255,255,255,0.52);
      --site-header-bg: rgba(5,8,22,0.82);
      --site-footer-bg: rgba(0,0,0,0.20);
      --site-card-shadow: 0 24px 100px rgba(0,0,0,0.24);
      --site-accent: #b2863b;
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
      --site-accent: #9a6f2e;
      color-scheme: light;
    }

    html[data-theme="dark"] {
      color-scheme: dark;
    }

    @keyframes hc-dropdown-in {
      from { opacity: 0; transform: scale(0.96) translateY(-4px); }
      to   { opacity: 1; transform: scale(1)    translateY(0);    }
    }
  `;

  return (
    <>
      <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: script }} />
      <style dangerouslySetInnerHTML={{ __html: styles }} />
    </>
  );
}
