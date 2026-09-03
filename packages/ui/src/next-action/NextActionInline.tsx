/**
 * V3-39 — <NextActionInline /> — the inline slot for sensitive and
 * surface-anchored next actions (KYC, wallet, destructive steps render HERE,
 * inside their own page region — never as a floating chip).
 *
 * Hook-free and server-component-compatible. Tokens only, both themes; the
 * CTA is dark-ink-on-gold in both (house AA pattern).
 */

import { ArrowUpRight } from "lucide-react";

export interface NextActionInlineAction {
  id: string;
  title: string;
  description?: string;
  ctaHref: string;
  ctaLabel: string;
}

export function NextActionInline({ action }: { action: NextActionInlineAction }) {
  return (
    <>
      <NextActionInlineStyles />
      <div className="hc-nai-card">
        <div className="hc-nai-copy">
          <p className="hc-nai-title">{action.title}</p>
          {action.description ? <p className="hc-nai-body">{action.description}</p> : null}
        </div>
        <a className="hc-nai-cta" href={action.ctaHref}>
          {action.ctaLabel}
          <ArrowUpRight aria-hidden />
        </a>
      </div>
    </>
  );
}

export function NextActionInlineStyles() {
  return (
    <style>{`
.hc-nai-card{
  --hc-nai-surface:#ffffff;--hc-nai-ink:#0b1220;--hc-nai-ink-soft:rgba(11,18,32,.62);
  --hc-nai-line:rgba(11,18,32,.12);--hc-nai-accent:#C9A227;--hc-nai-on-accent:#0b1220;
  display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;
  background:color-mix(in srgb,var(--hc-nai-accent) 7%,var(--hc-nai-surface));
  border:1px solid color-mix(in srgb,var(--hc-nai-accent) 36%,var(--hc-nai-line));
  border-radius:1rem;padding:.85rem 1rem}
:where(html.dark,html[data-theme="dark"],.dark) .hc-nai-card{
  --hc-nai-surface:#0f1a2c;--hc-nai-ink:#F5F1E8;--hc-nai-ink-soft:rgba(245,241,232,.64);
  --hc-nai-line:rgba(245,241,232,.16)}
.hc-nai-copy{min-width:0}
.hc-nai-title{margin:0;font-family:var(--font-reading,serif);font-size:.95rem;font-weight:600;color:var(--hc-nai-ink)}
.hc-nai-body{margin:.2rem 0 0;font-size:.8rem;line-height:1.5;color:var(--hc-nai-ink-soft)}
.hc-nai-cta{flex:none;display:inline-flex;align-items:center;gap:.35rem;border-radius:999px;padding:.45rem .9rem;font-size:.8rem;font-weight:700;text-decoration:none;background:var(--hc-nai-accent);color:var(--hc-nai-on-accent)}
.hc-nai-cta:hover{filter:brightness(1.05)}
.hc-nai-cta:focus-visible{outline:2px solid var(--hc-nai-ink);outline-offset:2px}
.hc-nai-cta svg{width:.9rem;height:.9rem}
`}</style>
  );
}
