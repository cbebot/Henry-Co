/**
 * PortalLiveStrip — editorial premium "now" strip used on lookup
 * surfaces (search results count, listing detail breadcrumb). Surfaces
 * a calm state band without inventing chrome.
 *
 * Token-only paint. No hex literals. Used as either a positive
 * (results found, listing live) or empty-state surface (pre-search).
 *
 * Mirrors apps/logistics/components/portal/PortalLiveStrip.tsx (Wave
 * B3, PR #106) under .prp-pf paint.
 */
type PortalLiveStripProps = {
  eyebrow: string;
  title: string;
  meta?: string;
  etaLabel?: string;
  etaValue?: string;
  etaMeta?: string;
};

export function PortalLiveStrip({
  eyebrow,
  title,
  meta,
  etaLabel,
  etaValue,
  etaMeta,
}: PortalLiveStripProps) {
  return (
    <div className="prp-pf__live-strip" role="status" aria-live="polite">
      <div>
        <span className="prp-pf__live-strip-eyebrow">
          <span className="prp-pf__pulse mr-2 inline-block align-[-1px]" aria-hidden />
          {eyebrow}
        </span>
        <p className="prp-pf__live-strip-title">{title}</p>
        {meta ? <p className="prp-pf__live-strip-meta">{meta}</p> : null}
      </div>
      {etaValue ? (
        <div className="prp-pf__live-strip-eta">
          {etaLabel ? <span className="prp-pf__live-strip-eta-label">{etaLabel}</span> : null}
          <span className="prp-pf__live-strip-eta-value">{etaValue}</span>
          {etaMeta ? <span className="prp-pf__live-strip-eta-meta">{etaMeta}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
