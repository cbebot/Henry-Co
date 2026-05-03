import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "HenryCo Account";
export const size = { width: 1200, height: 630 } as const;
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(135deg, #050816 0%, #050816 55%, #C9A227 100%)",
          padding: "72px 88px",
          color: "white",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 540,
            height: 540,
            background:
              "radial-gradient(circle at top right, #F2D77A 0%, transparent 70%)",
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
            color: "#F2D77A",
            fontWeight: 600,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 36,
              height: 4,
              background: "#C9A227",
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
              color: "#F2D77A",
              opacity: 0.85,
              fontWeight: 500,
            }}
          >
            Single sign-on across every Henry & Co. division
          </span>
          <span
            style={{
              fontSize: 84,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            HenryCo Account
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
            One identity, one secure session, every HenryCo service in one place.
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
          <span>account.henrycogroup.com</span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "#C9A227",
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
