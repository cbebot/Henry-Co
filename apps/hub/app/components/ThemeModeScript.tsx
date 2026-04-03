export default function ThemeModeScript() {
  const script = `
    (() => {
      const root = document.documentElement;

      const applyTheme = (mode) => {
        root.dataset.theme = mode;
        root.style.colorScheme = mode;
      };

      let saved = null;

      try {
        saved = window.localStorage.getItem("henryco-public-theme");
      } catch {}

      if (saved === "light" || saved === "dark") {
        applyTheme(saved);
      } else {
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        applyTheme(media.matches ? "dark" : "light");

        const sync = (event) => applyTheme(event.matches ? "dark" : "light");

        if (typeof media.addEventListener === "function") {
          media.addEventListener("change", sync);
        } else if (typeof media.addListener === "function") {
          media.addListener(sync);
        }
      }
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
      color-scheme: light;
    }

    html[data-theme="dark"] {
      color-scheme: dark;
    }
  `;

  return (
    <>
      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: script }}
      />
      <style dangerouslySetInnerHTML={{ __html: styles }} />
    </>
  );
}