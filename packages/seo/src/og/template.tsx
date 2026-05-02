import { getDivisionConfig, type DivisionKey } from "@henryco/config";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png" as const;

export type DefaultOgTemplateProps = {
  divisionKey: DivisionKey;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
};

export function DefaultOgTemplate({
  divisionKey,
  title,
  subtitle,
  eyebrow,
}: DefaultOgTemplateProps) {
  const division = getDivisionConfig(divisionKey);
  const accent = division.accent;
  const accentStrong = division.accentStrong;
  const dark = division.dark;
  const headline = title ?? division.name;
  const tagline = subtitle ?? division.tagline;
  const topLabel = eyebrow ?? division.sub;

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        background: `linear-gradient(135deg, ${dark} 0%, ${dark} 55%, ${accent} 100%)`,
        padding: "72px 88px",
        position: "relative",
        color: "white",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 540,
          height: 540,
          background: `radial-gradient(circle at top right, ${accentStrong} 0%, transparent 70%)`,
          opacity: 0.45,
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 24,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: accentStrong,
          fontWeight: 600,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 36,
            height: 4,
            background: accent,
            borderRadius: 2,
          }}
        />
        <span>HENRY &amp; CO.</span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: "auto",
          gap: 16,
          maxWidth: 920,
        }}
      >
        <span
          style={{
            fontSize: 22,
            color: accentStrong,
            opacity: 0.85,
            fontWeight: 500,
          }}
        >
          {topLabel}
        </span>
        <span
          style={{
            fontSize: 84,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          {headline}
        </span>
        <span
          style={{
            fontSize: 30,
            color: "white",
            opacity: 0.85,
            lineHeight: 1.35,
            fontWeight: 400,
          }}
        >
          {tagline}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 48,
          fontSize: 22,
          color: "white",
          opacity: 0.7,
        }}
      >
        <span>{division.name.toLowerCase().replace(/\s+/g, "")}.henrycogroup.com</span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 14,
            height: 14,
            borderRadius: 999,
            background: accent,
          }}
        />
      </div>
    </div>
  );
}
