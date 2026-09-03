import type { FlowPoint } from "@/lib/finance-ledger";

/**
 * A self-hosted, dependency-free SVG sparkline (V3-22 S4: no charting SaaS, no
 * client bundle). It is a pure server component and reserves a fixed box so it
 * contributes ~0 to CLS. Values are scaled to the box; a flat/empty series draws
 * a baseline rather than nothing, so "no movement" reads honestly.
 */
export default function Sparkline({
  points,
  width = 520,
  height = 64,
  accent = "var(--acct-green)",
  ariaLabel,
}: {
  points: FlowPoint[];
  width?: number;
  height?: number;
  accent?: string;
  ariaLabel?: string;
}) {
  const values = points.map((p) => p.volumeMinor);
  const max = Math.max(1, ...values);
  const pad = 4;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const n = points.length;

  const x = (i: number) => (n <= 1 ? pad + innerW / 2 : pad + (innerW * i) / (n - 1));
  const y = (v: number) => pad + innerH - (innerH * v) / max;

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.volumeMinor).toFixed(1)}`).join(" ");
  const area =
    n > 0
      ? `${line} L ${x(n - 1).toFixed(1)} ${(height - pad).toFixed(1)} L ${x(0).toFixed(1)} ${(height - pad).toFixed(1)} Z`
      : "";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      role="img"
      aria-label={ariaLabel}
      style={{ display: "block" }}
    >
      <line
        x1={pad}
        y1={height - pad}
        x2={width - pad}
        y2={height - pad}
        stroke="var(--acct-line)"
        strokeWidth={1}
      />
      {n > 0 ? (
        <>
          <path d={area} fill={accent} fillOpacity={0.12} />
          <path d={line} fill="none" stroke={accent} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {n <= 31 ? (
            <circle cx={x(n - 1)} cy={y(points[n - 1].volumeMinor)} r={2.5} fill={accent} />
          ) : null}
        </>
      ) : null}
    </svg>
  );
}
