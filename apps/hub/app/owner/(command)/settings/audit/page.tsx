import Link from "next/link";
import { ExternalLink, MapPin, MonitorSmartphone, ShieldAlert, ShieldCheck } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import {
  getAuditHistoryPageData,
  getSecurityActivityData,
  getSecurityThreatData,
  type OwnerKnownDevice,
} from "@/lib/owner-data";
import type { ThreatSeverity, ThreatPosture } from "@/lib/security/threat-signals";
import { getHubPublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

type SearchParams = { view?: string; q?: string };

const PILL = "inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-semibold capitalize";

/** Threat severity → dual-theme tone (shares the account palette tokens). */
function threatTone(severity: ThreatSeverity): string {
  if (severity === "critical") return `${PILL} bg-[var(--acct-red-soft)] text-[var(--acct-red-text)]`;
  if (severity === "warning") return `${PILL} bg-[var(--acct-orange-soft)] text-[var(--acct-orange-text)]`;
  return `${PILL} bg-[var(--acct-gold-soft)] text-[var(--acct-muted)]`;
}

/** Overall posture → banner styling + human word. */
function postureBanner(posture: ThreatPosture): { tone: string; label: string; calm: boolean } {
  switch (posture) {
    case "critical":
      return { tone: "border-[var(--acct-red)] bg-[var(--acct-red-soft)] text-[var(--acct-red-text)]", label: "Critical — act now", calm: false };
    case "elevated":
      return { tone: "border-[var(--acct-orange)] bg-[var(--acct-orange-soft)] text-[var(--acct-orange-text)]", label: "Elevated — review today", calm: false };
    case "watch":
      return { tone: "border-[var(--acct-gold)] bg-[var(--acct-gold-soft)] text-[var(--acct-ink)]", label: "Watch — nothing urgent", calm: false };
    default:
      return { tone: "border-[var(--acct-green)] bg-[var(--acct-green-soft)] text-[var(--acct-green-text)]", label: "All calm — no attacker signals", calm: true };
  }
}

/** Map a stored risk_level to a dual-theme tone (defaults to calm). */
function riskTone(level: string): string {
  const l = level.toLowerCase();
  if (l.includes("critical") || l.includes("high"))
    return `${PILL} bg-[var(--acct-red-soft)] text-[var(--acct-red-text)]`;
  if (l.includes("medium") || l.includes("elevated"))
    return `${PILL} bg-[var(--acct-orange-soft)] text-[var(--acct-orange-text)]`;
  return `${PILL} bg-[var(--acct-gold-soft)] text-[var(--acct-muted)]`;
}

/** Device trust state → dual-theme tone. */
function deviceTone(state: OwnerKnownDevice["state"]): string {
  if (state === "revoked") return `${PILL} bg-[var(--acct-red-soft)] text-[var(--acct-red-text)]`;
  if (state === "trusted") return `${PILL} bg-[var(--acct-gold-soft)] text-[var(--acct-gold-text)]`;
  return `${PILL} bg-[var(--acct-green-soft)] text-[var(--acct-green-text)]`;
}

/** Compact, locale-stable timestamp (UTC, minute precision). Empty → em dash. */
function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toISOString().slice(0, 16).replace("T", " ") + " UTC";
}

export default async function OwnerAuditPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) || {};
  const view = sp.view === "all" ? "all" : "risk";
  const q = typeof sp.q === "string" ? sp.q : "";
  const [data, security, threat, locale] = await Promise.all([
    getAuditHistoryPageData({ view, q, limit: 220 }),
    getSecurityActivityData({ limit: 60 }),
    getSecurityThreatData(),
    getHubPublicLocale(),
  ]);
  const t = (s: string) => translateSurfaceLabel(locale, s);
  const banner = postureBanner(threat.posture);

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow={t("Audit Log")}
        title={t("Sensitive activity history")}
        description={t("Privilege, payout, wallet, and security-relevant events. Navigation audit tail appears when staff_navigation_audit is populated (future staff dashboards).")}
      />

      {/* Threat watch — attacker fingerprints derived live from every account's
          sign-in + device telemetry. This is the "we see everything" surface:
          not sign-in/out noise, but credential spray, impossible travel, shared
          devices, revoked-device reuse. Same engine as the owner dashboard +
          the Founder AI, so all three read one truth. */}
      <OwnerPanel
        title={t("Threat watch")}
        description={t("Attacker signals derived live from platform-wide sign-in and device telemetry — the view only this console has. Every signal is evidence-backed: a real count you can act on, not sign-in/out noise.")}
        action={
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--acct-muted)]">
            {banner.calm ? (
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
            )}
            {threat.metrics.eventsAnalyzed} {t("events")} · {threat.metrics.windowDays}
            {t("d")}
          </span>
        }
      >
        <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${banner.tone}`}>
          {t(banner.label)}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: t("Critical"), value: threat.metrics.criticalCount, danger: threat.metrics.criticalCount > 0 },
            { label: t("Warnings"), value: threat.metrics.warningCount },
            { label: t("Spray IPs"), value: threat.metrics.distinctSprayIps },
            { label: t("Shared devices"), value: threat.metrics.sharedDevices },
            { label: t("Impossible travel"), value: threat.metrics.impossibleTravelAccounts },
            { label: t("Revoked reuse"), value: threat.metrics.revokedReuse, danger: threat.metrics.revokedReuse > 0 },
            { label: t("Watch-level"), value: threat.metrics.watchCount },
            { label: t("Devices tracked"), value: threat.metrics.devicesAnalyzed },
          ].map((stat) => (
            <div key={stat.label} className="acct-card px-3 py-2">
              <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-[var(--acct-muted)]">{stat.label}</p>
              <p className={`mt-0.5 text-xl font-bold ${stat.danger ? "text-[var(--acct-red-text)]" : "text-[var(--acct-ink)]"}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {threat.signals.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--acct-muted)]">
            {t("No attacker signals in the current window. This panel lights up the moment the telemetry shows one.")}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {threat.signals.map((signal) => (
              <li key={signal.id} className="acct-card px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={threatTone(signal.severity)}>{t(signal.severity)}</span>
                  <span className="font-semibold text-[var(--acct-ink)]">{signal.title}</span>
                  <span className="ml-auto font-mono text-[0.7rem] text-[var(--acct-muted)]">
                    {signal.evidenceCount} {t("rows")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--acct-muted)]">{signal.detail}</p>
                {signal.subjects.length > 0 ? (
                  <p className="mt-1 truncate text-xs text-[var(--acct-muted)]" title={signal.subjects.join(", ")}>
                    {t("Involves")}: {signal.subjects.join(", ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {threat.blindSpots.length > 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-[var(--acct-line)] px-4 py-2">
            <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-[var(--acct-muted)]">
              {t("Known blind spots")}
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-[var(--acct-muted)]">
              {threat.blindSpots.map((spot, i) => (
                <li key={i}>{spot}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </OwnerPanel>

      <OwnerPanel
        title={t("Filters")}
        description={t("Risk view highlights permission, security, owner, payout, and wallet events. All merges staff and platform audit_logs.")}
      >
        <form className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end" method="get">
          <input type="hidden" name="view" value={view} />
          <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-semibold text-[var(--acct-muted)]">
            {t("Search")}
            <input
              name="q"
              defaultValue={data.query}
              placeholder={t("Action, entity, actor…")}
              className="rounded-xl border border-[var(--acct-line)] bg-[var(--acct-bg)] px-3 py-2 text-sm text-[var(--acct-ink)] outline-none focus:border-[var(--acct-gold)]"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-xl bg-[var(--acct-gold)] px-4 py-2 text-sm font-semibold text-[var(--hc-ink-on-accent,#1a1814)]"
            >
              {t("Apply")}
            </button>
            <Link
              href={`/owner/settings/audit?view=risk${data.query ? `&q=${encodeURIComponent(data.query)}` : ""}`}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                view === "risk"
                  ? "border-[var(--acct-gold)] bg-[var(--acct-gold-soft)] text-[var(--acct-ink)]"
                  : "border-[var(--acct-line)] text-[var(--acct-muted)]"
              }`}
            >
              {t("Risk only")}
            </Link>
            <Link
              href={`/owner/settings/audit?view=all${data.query ? `&q=${encodeURIComponent(data.query)}` : ""}`}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                view === "all"
                  ? "border-[var(--acct-gold)] bg-[var(--acct-gold-soft)] text-[var(--acct-ink)]"
                  : "border-[var(--acct-line)] text-[var(--acct-muted)]"
              }`}
            >
              {t("All merged")}
            </Link>
          </div>
        </form>
      </OwnerPanel>

      <OwnerPanel
        title={t("Audit stream")}
        description={`${data.rows.length} ${t("rows")} · ${view === "risk" ? t("Risk view") : t("All merged")}`}
      >
        <div className="overflow-x-auto">
          <table className="owner-table">
            <thead>
              <tr>
                <th>{t("Source")}</th>
                <th>{t("Action")}</th>
                <th>{t("Entity")}</th>
                <th>{t("Actor")}</th>
                <th>{t("When")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => {
                const rowId = String(row.id || "");
                const rowSource = String(row._source || "");
                const canDrill = Boolean(rowId && (rowSource === "staff" || rowSource === "platform"));
                return (
                <tr key={`${rowSource}-${rowId}-${String(row.created_at)}`}>
                  <td className="whitespace-nowrap text-xs uppercase tracking-wide text-[var(--acct-muted)]">
                    {rowSource}
                  </td>
                  <td>{String(row.action || row.event_type || t("event"))}</td>
                  <td className="max-w-[min(280px,28vw)]">
                    <div className="truncate font-medium text-[var(--acct-ink)]" title={String(row.entityLabel || "")}>
                      {"entityLabel" in row && row.entityLabel ? String(row.entityLabel) : String(row.entity || row.entity_id || "—")}
                    </div>
                    {row.entity_id ? (
                      <div className="truncate font-mono text-[0.65rem] text-[var(--acct-muted)]" title={String(row.entity_id)}>
                        {t("ID")} {String(row.entity_id).slice(0, 8)}…
                      </div>
                    ) : null}
                  </td>
                  <td className="max-w-[min(240px,26vw)] text-sm">
                    <div className="truncate text-[var(--acct-ink)]" title={String(row.actorLabel || "")}>
                      {"actorLabel" in row && row.actorLabel ? String(row.actorLabel) : String(row.actor_role || row.role || "—")}
                    </div>
                  </td>
                  <td className="whitespace-nowrap text-sm text-[var(--acct-muted)]">
                    {String(row.created_at || "")}
                  </td>
                  {canDrill ? (
                    <td>
                      <Link
                        href={`/owner/settings/audit/${rowSource}/${rowId}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--owner-accent)]"
                      >
                        {t("Detail")}
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </Link>
                    </td>
                  ) : (
                    <td />
                  )}
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </OwnerPanel>

      {/* Sessions & devices — Smartsupp-tier visibility over WHO signed in, from
          WHERE, on WHAT device, sourced live from customer_security_log +
          account_known_devices (the account app writes these on every sign-in). */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t("Sign-in events"), value: security.metrics.eventCount },
          { label: t("People seen"), value: security.metrics.distinctUsers },
          { label: t("High-risk events"), value: security.metrics.highRisk, danger: security.metrics.highRisk > 0 },
          { label: t("Known devices"), value: security.metrics.deviceCount, sub: security.metrics.revokedDevices > 0 ? `${security.metrics.revokedDevices} ${t("revoked")}` : undefined },
        ].map((stat) => (
          <div
            key={stat.label}
            className="acct-card px-4 py-3"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--acct-muted)]">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold ${stat.danger ? "text-[var(--acct-red-text)]" : "text-[var(--acct-ink)]"}`}>
              {stat.value}
            </p>
            {stat.sub ? <p className="text-[0.7rem] text-[var(--acct-red-text)]">{stat.sub}</p> : null}
          </div>
        ))}
      </div>

      <OwnerPanel
        title={t("Sessions & sign-in security")}
        description={t("Live sign-in and security events — who, from where, on what device. Read from the account security log; the owner console is the one place this platform-wide trail is visible.")}
        action={
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--acct-muted)]">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {security.metrics.eventCount} {t("events")}
          </span>
        }
      >
        {security.events.length === 0 ? (
          <p className="text-sm text-[var(--acct-muted)]">
            {t("No sign-in or security events recorded yet. They appear here the moment the account app logs one.")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="owner-table">
              <thead>
                <tr>
                  <th>{t("Person")}</th>
                  <th>{t("Event")}</th>
                  <th>{t("Risk")}</th>
                  <th>{t("Device")}</th>
                  <th>{t("Location")}</th>
                  <th>{t("IP")}</th>
                  <th>{t("When")}</th>
                </tr>
              </thead>
              <tbody>
                {security.events.map((event) => (
                  <tr key={event.id}>
                    <td className="max-w-[min(220px,24vw)]">
                      <div className="truncate font-medium text-[var(--acct-ink)]" title={event.userLabel}>
                        {event.userLabel}
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-sm text-[var(--acct-ink)]">
                      {event.eventType.replace(/_/g, " ")}
                    </td>
                    <td>
                      {event.riskLevel ? (
                        <span className={riskTone(event.riskLevel)}>{event.riskLevel}</span>
                      ) : (
                        <span className="text-[var(--acct-muted)]">—</span>
                      )}
                    </td>
                    <td className="max-w-[min(220px,22vw)]">
                      <div className="truncate text-sm text-[var(--acct-muted)]" title={event.device}>
                        {event.device || "—"}
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-sm text-[var(--acct-muted)]">
                      {event.location || event.country || "—"}
                      {event.country && event.location ? (
                        <span className="ml-1 font-mono text-[0.6rem] uppercase text-[var(--acct-muted)]">{event.country}</span>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap font-mono text-xs text-[var(--acct-muted)]">{event.ip || "—"}</td>
                    <td className="whitespace-nowrap text-sm text-[var(--acct-muted)]">{formatWhen(event.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </OwnerPanel>

      <OwnerPanel
        title={t("Known devices")}
        description={t("The persistent device registry — first country seen, last activity, and trust state. Revoked devices can no longer complete a trusted sign-in.")}
        action={
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--acct-muted)]">
            <MonitorSmartphone className="h-3.5 w-3.5" aria-hidden />
            {security.metrics.deviceCount} {t("devices")}
          </span>
        }
      >
        {security.devices.length === 0 ? (
          <p className="text-sm text-[var(--acct-muted)]">
            {t("No devices registered yet. Each new sign-in device is recorded here with its first-seen country.")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="owner-table">
              <thead>
                <tr>
                  <th>{t("Person")}</th>
                  <th>{t("Device")}</th>
                  <th>{t("First country")}</th>
                  <th>{t("Last seen")}</th>
                  <th>{t("State")}</th>
                </tr>
              </thead>
              <tbody>
                {security.devices.map((device) => (
                  <tr key={device.id}>
                    <td className="max-w-[min(220px,24vw)]">
                      <div className="truncate font-medium text-[var(--acct-ink)]" title={device.userLabel}>
                        {device.userLabel}
                      </div>
                    </td>
                    <td className="max-w-[min(260px,26vw)]">
                      <div className="truncate text-sm text-[var(--acct-muted)]" title={device.device}>
                        {device.device}
                      </div>
                    </td>
                    <td className="whitespace-nowrap font-mono text-xs uppercase text-[var(--acct-muted)]">
                      {device.firstCountry || "—"}
                    </td>
                    <td className="whitespace-nowrap text-sm text-[var(--acct-muted)]">{formatWhen(device.lastSeenAt)}</td>
                    <td>
                      <span className={deviceTone(device.state)}>{t(device.state)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </OwnerPanel>

      {data.navigationTail.length > 0 ? (
        <OwnerPanel
          title={t("Navigation audit (preview)")}
          description={t("Populated when staff sessions emit navigation events — reserved for future staff dashboard analytics.")}
        >
          <table className="owner-table">
            <thead>
              <tr>
                <th>{t("Path")}</th>
                <th>{t("Division")}</th>
                <th>{t("When")}</th>
              </tr>
            </thead>
            <tbody>
              {data.navigationTail.map((row, idx) => (
                <tr key={`nav-${idx}-${String(row.path)}-${String(row.created_at)}`}>
                  <td className="font-mono text-xs">{String(row.path || "")}</td>
                  <td>{String(row.division || "—")}</td>
                  <td className="text-sm text-[var(--acct-muted)]">{String(row.created_at || "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </OwnerPanel>
      ) : null}
    </div>
  );
}
