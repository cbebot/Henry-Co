/**
 * PortalLiveStrip — editorial premium "now" strip used at the top of
 * the tracking surface. Surfaces ETA + status + capability evidence
 * in one calm band without inventing chrome.
 *
 * V3 Wave B1 mirror of apps/logistics/components/portal/PortalLiveStrip.tsx
 * (just-merged Wave B3). Token-only paint. No hex literals. Used as
 * either a positive (active booking) or empty-state surface (no
 * lookup yet).
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
    <div className="care-pf__live-strip" role="status" aria-live="polite">
      <div>
        <span className="care-pf__live-strip-eyebrow">
          <span className="care-pf__pulse mr-2 inline-block align-[-1px]" aria-hidden />
          {eyebrow}
        </span>
        <p className="care-pf__live-strip-title">{title}</p>
        {meta ? <p className="care-pf__live-strip-meta">{meta}</p> : null}
      </div>
      {etaValue ? (
        <div className="care-pf__live-strip-eta">
          {etaLabel ? <span className="care-pf__live-strip-eta-label">{etaLabel}</span> : null}
          <span className="care-pf__live-strip-eta-value">{etaValue}</span>
          {etaMeta ? <span className="care-pf__live-strip-eta-meta">{etaMeta}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
