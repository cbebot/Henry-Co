import "@/components/logistics/styles.css";

export default function LogisticsLoading() {
  return (
    <div className="acct-log acct-fade-in" aria-busy="true" aria-live="polite">
      <section className="acct-log__hero" aria-hidden>
        <div className="acct-log__hero-row">
          <div style={{ minWidth: 0, flex: 1 }}>
            <span
              className="acct-log__hero-eyebrow"
              style={{ visibility: "hidden" }}
              aria-hidden
            >
              placeholder
            </span>
            <div
              style={{
                height: 36,
                marginTop: 12,
                borderRadius: 12,
                background:
                  "linear-gradient(90deg, var(--acct-surface) 0%, var(--acct-bg-soft) 50%, var(--acct-surface) 100%)",
                backgroundSize: "200% 100%",
                animation: "acct-log-shimmer 1.4s ease-in-out infinite",
                maxWidth: 360,
              }}
            />
            <div
              style={{
                height: 12,
                marginTop: 12,
                borderRadius: 6,
                background:
                  "linear-gradient(90deg, var(--acct-surface) 0%, var(--acct-bg-soft) 50%, var(--acct-surface) 100%)",
                backgroundSize: "200% 100%",
                animation: "acct-log-shimmer 1.4s ease-in-out infinite",
                animationDelay: "0.1s",
                maxWidth: "60%",
              }}
            />
          </div>
        </div>
        <div className="acct-log__metrics">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="acct-log__metric" key={i}>
              <span
                style={{
                  height: 12,
                  width: "60%",
                  borderRadius: 4,
                  background: "var(--acct-surface)",
                  display: "block",
                }}
              />
              <span
                style={{
                  height: 28,
                  width: "40%",
                  marginTop: 8,
                  borderRadius: 6,
                  background: "var(--acct-surface)",
                  display: "block",
                }}
              />
              <span
                style={{
                  height: 10,
                  width: "70%",
                  marginTop: 8,
                  borderRadius: 4,
                  background: "var(--acct-surface)",
                  display: "block",
                }}
              />
            </div>
          ))}
        </div>
      </section>
      <div
        className="acct-log__map"
        aria-hidden
        style={{
          background:
            "linear-gradient(90deg, var(--acct-surface) 0%, var(--acct-bg-soft) 50%, var(--acct-surface) 100%)",
          backgroundSize: "200% 100%",
          animation: "acct-log-shimmer 1.4s ease-in-out infinite",
          aspectRatio: "24 / 10",
        }}
      />
      <style>{`
        @keyframes acct-log-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .acct-log [style*="acct-log-shimmer"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
