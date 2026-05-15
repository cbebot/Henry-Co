/**
 * PortalLiveStrip — editorial premium "now" strip used at the top of
 * the tracking surface. Surfaces ETA + status + capability evidence
 * in one calm band without inventing chrome.
 *
 * Token-only paint. No hex literals. Used as either a positive
 * (active shipment) or empty-state surface (no lookup yet).
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
    <div className="log-pf__live-strip" role="status" aria-live="polite">
      <div>
        <span className="log-pf__live-strip-eyebrow">
          <span className="log-pf__pulse me-2 inline-block align-[-1px]" aria-hidden />
          {eyebrow}
        </span>
        <p className="log-pf__live-strip-title">{title}</p>
        {meta ? <p className="log-pf__live-strip-meta">{meta}</p> : null}
      </div>
      {etaValue ? (
        <div className="log-pf__live-strip-eta">
          {etaLabel ? <span className="log-pf__live-strip-eta-label">{etaLabel}</span> : null}
          <span className="log-pf__live-strip-eta-value">{etaValue}</span>
          {etaMeta ? <span className="log-pf__live-strip-eta-meta">{etaMeta}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
