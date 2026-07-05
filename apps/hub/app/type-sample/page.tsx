// Onyx Type — unlinked dev SPECIMEN. Forces the owned faces live via a local
// `data-onyx-type="live"` wrapper (independent of the global flag) so the whole
// pipeline — next/font Latin faces + role/scale tokens + Arabic/CJK companions +
// premium features (tabular figures) — is provable in both themes before any
// app flips. Not in nav; not a product surface. Interim faces are placeholders
// (Fraunces/Manrope/JetBrains) until the bespoke superfamily lands at reveal.
export const dynamic = "force-static";

export default function TypeSamplePage() {
  return (
    <main
      data-onyx-type="live"
      style={{
        maxWidth: "72ch",
        margin: "0 auto",
        padding: "clamp(2rem, 6vw, 5rem) 1.5rem",
        color: "var(--hc-text-primary)",
        background: "var(--hc-bg)",
      }}
    >
      <p
        style={{
          fontFamily: "var(--hc-font-sans)",
          fontSize: "var(--hc-text-caption)",
          letterSpacing: "var(--hc-track-caps)",
          textTransform: "uppercase",
          opacity: 0.7,
          margin: 0,
        }}
      >
        Henry Onyx — owned type specimen
      </p>

      <h1
        style={{
          fontFamily: "var(--hc-font-serif)",
          fontSize: "var(--hc-text-display)",
          letterSpacing: "var(--hc-track-display)",
          lineHeight: 1.05,
          margin: "0.5rem 0 0",
        }}
      >
        The type that reads as ours
      </h1>

      <div className="hc-prose" style={{ marginTop: "1.5rem" }}>
        <p>
          This paragraph renders the editorial serif reading face at a calm
          measure — the long-form voice for ledes, section intros, and legal
          prose. Colour is inherited, so it is safe on any surface.
        </p>
        <p style={{ fontFamily: "var(--hc-font-sans)", fontSize: "var(--hc-text-body)" }}>
          Structure and interface render the brand sans: navigation, labels,
          buttons, cards, and body copy. Reading is serif; the product is sans.
        </p>
      </div>

      <table
        style={{
          fontFamily: "var(--hc-font-sans)",
          fontSize: "var(--hc-text-ui)",
          marginTop: "2rem",
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <tbody>
          <tr>
            <td style={{ padding: "0.35rem 0" }}>Invoice HO-1001</td>
            <td className="hc-numeric" style={{ textAlign: "right" }}>&#8358;1,240.00</td>
          </tr>
          <tr>
            <td style={{ padding: "0.35rem 0" }}>Invoice HO-1002</td>
            <td className="hc-numeric" style={{ textAlign: "right" }}>&#8358;19.99</td>
          </tr>
          <tr>
            <td style={{ padding: "0.35rem 0" }}>Invoice HO-1003</td>
            <td className="hc-numeric" style={{ textAlign: "right" }}>&#8358;105,000.00</td>
          </tr>
        </tbody>
      </table>

      <p
        lang="ar"
        dir="rtl"
        style={{ fontFamily: "var(--hc-font-serif)", fontSize: "var(--hc-text-h3)", marginTop: "2rem" }}
      >
        &#1575;&#1604;&#1606;&#1589; &#1575;&#1604;&#1593;&#1585;&#1576;&#1610; &#1610;&#1592;&#1607;&#1585; &#1576;&#1575;&#1604;&#1582;&#1591; &#1575;&#1604;&#1605;&#1605;&#1604;&#1608;&#1603;
      </p>

      <p
        lang="zh"
        style={{ fontFamily: "var(--hc-font-serif)", fontSize: "var(--hc-text-h3)", marginTop: "0.75rem" }}
      >
        &#20013;&#25991;&#25991;&#26412;&#20063;&#20197;&#33258;&#26377;&#23383;&#20307;&#21576;&#29616;
      </p>

      <p
        className="hc-numeric"
        style={{ fontFamily: "var(--hc-font-mono)", fontSize: "var(--hc-text-ui)", marginTop: "2rem", opacity: 0.85 }}
      >
        const total = 105_000.00; // 0123456789
      </p>
    </main>
  );
}
