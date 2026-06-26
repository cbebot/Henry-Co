import {
  getDivisionConfig,
  getSurfaceConfig,
  getSurfaceHost,
  henryDomainHost,
  type DivisionKey,
  type SurfaceKey,
} from "@henryco/config";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png" as const;

/**
 * One shared 1200x630 OG card for the whole ecosystem. Render it for a public
 * division (`divisionKey`) OR a non-division customer surface (`surfaceKey`,
 * e.g. `account`) — both pull brand tokens + host label from the same config
 * registries, so there is exactly one image design across every site.
 */
type OgTemplateContent = {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
};

/**
 * Exactly one of `divisionKey` / `surfaceKey` is required — the discriminated
 * union makes "neither" and "both" compile errors, so the invariant is enforced
 * by the type system rather than only at runtime.
 */
export type DefaultOgTemplateProps =
  | ({ divisionKey: DivisionKey; surfaceKey?: never } & OgTemplateContent)
  | ({ surfaceKey: SurfaceKey; divisionKey?: never } & OgTemplateContent);

type OgBrand = {
  name: string;
  tagline: string;
  sub: string;
  host: string;
  accent: string;
  accentStrong: string;
  dark: string;
};

function resolveOgBrand(props: DefaultOgTemplateProps): OgBrand {
  if (props.surfaceKey) {
    const s = getSurfaceConfig(props.surfaceKey);
    return {
      name: s.name,
      tagline: s.tagline,
      sub: s.sub,
      host: getSurfaceHost(props.surfaceKey),
      accent: s.accent,
      accentStrong: s.accentStrong,
      dark: s.dark,
    };
  }
  if (props.divisionKey) {
    const d = getDivisionConfig(props.divisionKey);
    return {
      name: d.name,
      tagline: d.tagline,
      sub: d.sub,
      host: henryDomainHost(props.divisionKey),
      accent: d.accent,
      accentStrong: d.accentStrong,
      dark: d.dark,
    };
  }
  throw new Error("DefaultOgTemplate requires either `divisionKey` or `surfaceKey`.");
}

export function DefaultOgTemplate(props: DefaultOgTemplateProps) {
  const { title, subtitle, eyebrow } = props;
  const brand = resolveOgBrand(props);
  const accent = brand.accent;
  const accentStrong = brand.accentStrong;
  const dark = brand.dark;
  const headline = title ?? brand.name;
  const tagline = subtitle ?? brand.tagline;
  const topLabel = eyebrow ?? brand.sub;
  const hostLabel = brand.host;

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
            // Satori (next/og) only supports flex/block/none — NOT inline-block.
            // A fixed-size flex leaf renders the same accent dash.
            display: "flex",
            width: 36,
            height: 4,
            background: accent,
            borderRadius: 2,
          }}
        />
        <span>HENRY ONYX</span>
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
        <span>{hostLabel}</span>
        <span
          style={{
            // Satori supports flex/block/none — NOT inline-flex.
            display: "flex",
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
