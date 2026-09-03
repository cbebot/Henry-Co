import {
  COMPANY,
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
 * One shared 1200x630 OG card for the whole ecosystem — a framed, gold-on-onyx
 * masthead built to read as a real, registered operating company (Henry Onyx
 * Limited, est. 2026, Emene · Enugu). Render it for a public division
 * (`divisionKey`) OR a non-division surface (`surfaceKey`, e.g. `account`);
 * both pull brand tokens from the same config registries, so there is exactly
 * one card design across every site. hub/account resolve to the brand gold;
 * divisions render the same frame in their own accent.
 *
 * The brand serif (Newsreader) is supplied at render time via `loadBrandOgFonts`
 * (see ./fonts) — with a default-font fallback so the image never fails.
 */
export type DefaultOgTemplateProps =
  | ({ divisionKey: DivisionKey; surfaceKey?: never } & OgTemplateContent)
  | ({ surfaceKey: SurfaceKey; divisionKey?: never } & OgTemplateContent);

type OgTemplateContent = {
  /** Override the wordmark (defaults to "HENRY ONYX"). */
  title?: string;
  /** Override the italic tagline. */
  subtitle?: string;
  /** Override the masthead eyebrow (defaults to EST · HQ). */
  eyebrow?: string;
};

const CREAM = "#F6F3EA";

type OgBrand = {
  eyebrow: string;
  wordmark: string;
  sublabel: string;
  tagline: string;
  host: string;
  accent: string;
  accentSoft: string;
  dark: string;
};

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** The authentic geometric Henry Onyx "H" monogram, recoloured to `color`. */
function monogramDataUri(color: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 64"><g fill="${color}">` +
    `<path d="M9 7H17V57H9Z"/><path d="M6.5 7H19.5V9H6.5Z"/><path d="M6.5 55H19.5V57H6.5Z"/>` +
    `<path d="M37 7H45V57H37Z"/><path d="M34.5 7H47.5V9H34.5Z"/><path d="M34.5 55H47.5V57H34.5Z"/>` +
    `<path d="M9 28H45V34H9Z"/></g></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function masthead(): string {
  const est = COMPANY.group.established;
  const hq = COMPANY.group.hqLocation.toUpperCase();
  return `EST. ${est} · ${hq}`;
}

function resolveOgBrand(props: DefaultOgTemplateProps): OgBrand {
  const wordmark = COMPANY.group.name.toUpperCase();
  if (props.surfaceKey) {
    const s = getSurfaceConfig(props.surfaceKey);
    return {
      eyebrow: masthead(),
      wordmark,
      sublabel: s.shortName.toUpperCase(),
      tagline: s.tagline,
      host: getSurfaceHost(props.surfaceKey),
      accent: s.accent,
      accentSoft: s.accentStrong,
      dark: s.dark,
    };
  }
  const key = props.divisionKey;
  const d = getDivisionConfig(key);
  const isMaster = key === "hub";
  return {
    eyebrow: masthead(),
    wordmark,
    // The hub card is the pure master brand (no division sub-label).
    sublabel: isMaster ? "" : d.shortName.toUpperCase(),
    tagline: isMaster ? COMPANY.group.tagline : d.tagline,
    host: henryDomainHost(key),
    accent: d.accent,
    accentSoft: d.accentStrong,
    dark: d.dark,
  };
}

export function DefaultOgTemplate(props: DefaultOgTemplateProps) {
  const brand = resolveOgBrand(props);
  const accent = brand.accent;
  const dark = brand.dark;
  const eyebrow = props.eyebrow ?? brand.eyebrow;
  const wordmark = props.title ? props.title.toUpperCase() : brand.wordmark;
  const tagline = props.subtitle ?? brand.tagline;

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative",
        padding: "74px 80px",
        backgroundColor: dark,
        backgroundImage: `radial-gradient(circle at 50% 36%, ${hexToRgba(
          accent,
          0.18,
        )} 0%, ${hexToRgba(accent, 0)} 54%)`,
        fontFamily: "Newsreader, serif",
        color: CREAM,
      }}
    >
      {/* Double brass frame */}
      <div
        style={{
          position: "absolute",
          top: 26,
          left: 26,
          right: 26,
          bottom: 26,
          display: "flex",
          border: `2px solid ${hexToRgba(accent, 0.85)}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 38,
          left: 38,
          right: 38,
          bottom: 38,
          display: "flex",
          border: `1px solid ${hexToRgba(accent, 0.38)}`,
        }}
      />

      {/* Masthead eyebrow */}
      <div
        style={{
          display: "flex",
          fontSize: 25,
          fontWeight: 400,
          letterSpacing: 11,
          color: accent,
        }}
      >
        {eyebrow}
      </div>

      {/* Brand monogram */}
      <img src={monogramDataUri(accent)} width={118} height={140} alt="" />

      {/* Wordmark + tagline cluster */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 80,
            fontWeight: 500,
            letterSpacing: 20,
            color: CREAM,
            // Optical: trailing letter-spacing pushes the block right; nudge back.
            paddingLeft: 20,
          }}
        >
          {wordmark}
        </div>

        {brand.sublabel ? (
          <div
            style={{
              display: "flex",
              fontSize: 27,
              fontWeight: 400,
              letterSpacing: 8,
              color: brand.accentSoft,
              paddingLeft: 8,
              marginTop: 10,
            }}
          >
            {brand.sublabel}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            width: 124,
            height: 2,
            backgroundColor: accent,
            margin: "26px 0 22px",
          }}
        />

        <div
          style={{
            display: "flex",
            fontSize: 31,
            fontStyle: "italic",
            fontWeight: 400,
            color: hexToRgba(CREAM, 0.84),
            maxWidth: 860,
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          {tagline}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 23,
            fontWeight: 400,
            letterSpacing: 7,
            color: accent,
            marginTop: 18,
            paddingLeft: 7,
          }}
        >
          {brand.host}
        </div>
      </div>
    </div>
  );
}
