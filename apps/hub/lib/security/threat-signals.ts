/**
 * Threat-detection engine — owner security watchtower.
 *
 * Pure, deterministic assessment over the two telemetry tables the account app
 * already writes on every sign-in: `customer_security_log` (event + ip +
 * location + a `metadata` jsonb carrying country/risk/device/reason) and
 * `account_known_devices` (the persistent per-device registry). No I/O, no
 * `server-only` — so it is unit-testable and the same function grounds both the
 * owner audit console and the Founder AI facts pack.
 *
 * Calibration (owner rule, 2026-06-26): every signal is backed by REAL rows —
 * a count you could click through to. We never invent an attacker. We are also
 * honest about what the data cannot see: failed logins are not recorded
 * anywhere today, so classic failed-attempt brute-force is a KNOWN blind spot
 * (surfaced in `blindSpots`), not a signal we fake.
 *
 * What IS derivable, and what each needs:
 *   - credential_spray   one IP → many distinct accounts        (ip_address)
 *   - shared_device      one device cookie → many accounts      (device_id)
 *   - impossible_travel  one account, 2 countries, short gap    (country/location)
 *   - new_device_alert   repeated new-device/country tripwires  (event_type)
 *   - revoked_reuse      a killed device seen again afterwards   (revoked_at/last_seen)
 *   - reset_pressure     password-reset floods on one account   (event_type)
 *   - high_risk_cluster  a pile-up of high-risk events          (risk_level)
 */

export type ThreatLogRow = {
  userId: string;
  userLabel?: string;
  eventType: string;
  ip: string;
  /** metadata.country (ISO-2, uppercase) — only stamped on alert events. */
  country: string;
  /** location_summary "City, CC" — country is parsed from the trailing code. */
  location: string;
  device: string;
  /** metadata.risk_level — "low" | "medium" | "high". */
  riskLevel: string;
  /** metadata.event_category — "sign_in" | "session" | "sensitive_change" | "alert". */
  category: string;
  /** metadata.reason on alerts — "new_device" | "new_country" | "new_device_and_country". */
  reason: string;
  createdAt: string | null;
};

export type ThreatDeviceRow = {
  userId: string;
  userLabel?: string;
  deviceId: string;
  firstCountry: string;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  trustedAt: string | null;
  revokedAt: string | null;
};

export type ThreatKind =
  | "credential_spray"
  | "shared_device"
  | "impossible_travel"
  | "new_device_alert"
  | "revoked_reuse"
  | "reset_pressure"
  | "high_risk_cluster";

export type ThreatSeverity = "critical" | "warning" | "watch";

export type ThreatSignal = {
  id: string;
  kind: ThreatKind;
  severity: ThreatSeverity;
  title: string;
  /** One-line, owner-readable explanation of the evidence. */
  detail: string;
  /** How many real rows back this (accounts, events, or devices). */
  evidenceCount: number;
  /** Human labels for the accounts / IPs involved (capped for display). */
  subjects: string[];
};

export type ThreatPosture = "calm" | "watch" | "elevated" | "critical";

export type ThreatAssessment = {
  posture: ThreatPosture;
  signals: ThreatSignal[];
  metrics: {
    windowDays: number;
    eventsAnalyzed: number;
    devicesAnalyzed: number;
    criticalCount: number;
    warningCount: number;
    watchCount: number;
    distinctSprayIps: number;
    sharedDevices: number;
    impossibleTravelAccounts: number;
    revokedReuse: number;
  };
  /** What the telemetry genuinely cannot see — surfaced, never faked. */
  blindSpots: string[];
};

export type AssessOptions = {
  /** Reference "now" in ms; injectable for tests. Defaults to Date.now(). */
  nowMs?: number;
  /** How far back to consider events. Defaults to 30 days. */
  windowDays?: number;
};

const SEVERITY_RANK: Record<ThreatSeverity, number> = { critical: 3, warning: 2, watch: 1 };
const HOUR = 3_600_000;
const DAY = 86_400_000;

function labelOf(row: { userLabel?: string; userId: string }): string {
  if (row.userLabel && row.userLabel.trim()) return row.userLabel.trim();
  return row.userId ? `${row.userId.slice(0, 8)}…` : "unknown";
}

/** Derive an ISO-2 country from the explicit field or the "City, CC" location. */
function countryOf(row: ThreatLogRow): string {
  const explicit = row.country.trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(explicit)) return explicit;
  const match = row.location.trim().match(/,\s*([A-Za-z]{2})$/);
  return match ? match[1].toUpperCase() : "";
}

function ms(iso: string | null): number {
  if (!iso) return NaN;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : NaN;
}

function capSubjects(values: Iterable<string>, cap = 6): string[] {
  const seen: string[] = [];
  for (const v of values) {
    if (v && !seen.includes(v)) seen.push(v);
    if (seen.length >= cap) break;
  }
  return seen;
}

/**
 * Assess the recorded security telemetry for attacker fingerprints.
 * Deterministic: same inputs → same output (used by both the console and AI).
 */
export function assessThreats(
  logs: ThreatLogRow[],
  devices: ThreatDeviceRow[],
  options: AssessOptions = {},
): ThreatAssessment {
  const nowMs = options.nowMs ?? Date.now();
  const windowDays = options.windowDays ?? 30;
  const cutoff = nowMs - windowDays * DAY;

  const windowed = logs.filter((row) => {
    const t = ms(row.createdAt);
    return !Number.isFinite(t) || t >= cutoff; // keep undated rows rather than drop evidence
  });

  const signals: ThreatSignal[] = [];

  // ── 1) Credential spray — one IP driving many distinct accounts ────────────
  // The strongest fingerprint we can see without failed-attempt data: a single
  // source address tied to sign-in/alert events across several accounts.
  const ipToUsers = new Map<string, Map<string, string>>();
  for (const row of windowed) {
    const ip = row.ip.trim();
    if (!ip || !row.userId) continue;
    if (row.category === "session") continue; // sign-outs are not attacker signal
    const users = ipToUsers.get(ip) ?? new Map<string, string>();
    users.set(row.userId, labelOf(row));
    ipToUsers.set(ip, users);
  }
  let distinctSprayIps = 0;
  for (const [ip, users] of ipToUsers) {
    if (users.size < 3) continue;
    distinctSprayIps += 1;
    signals.push({
      id: `spray-${ip}`,
      kind: "credential_spray",
      severity: users.size >= 5 ? "warning" : "watch",
      title: `One IP tied to ${users.size} accounts`,
      detail: `Source ${ip} produced sign-in activity across ${users.size} different accounts in the window — a shared network, account farm, or credential-stuffing source. Worth a look.`,
      evidenceCount: users.size,
      subjects: capSubjects([ip, ...users.values()]),
    });
  }

  // ── 2) Shared device — one browser cookie holding many accounts ────────────
  const deviceToUsers = new Map<string, Map<string, string>>();
  for (const row of devices) {
    if (!row.deviceId || !row.userId) continue;
    const users = deviceToUsers.get(row.deviceId) ?? new Map<string, string>();
    users.set(row.userId, labelOf(row));
    deviceToUsers.set(row.deviceId, users);
  }
  let sharedDevices = 0;
  for (const [deviceId, users] of deviceToUsers) {
    if (users.size < 2) continue;
    sharedDevices += 1;
    signals.push({
      id: `device-${deviceId}`,
      kind: "shared_device",
      severity: users.size >= 3 ? "critical" : "warning",
      title: `Device shared by ${users.size} accounts`,
      detail: `One physical device is registered to ${users.size} accounts — the classic duplicate-account / account-farming pattern. A single browser rarely holds this many real people.`,
      evidenceCount: users.size,
      subjects: capSubjects(users.values()),
    });
  }

  // ── 3) Impossible travel — one account, two countries, short gap ───────────
  const byUser = new Map<string, ThreatLogRow[]>();
  for (const row of windowed) {
    if (!row.userId) continue;
    const list = byUser.get(row.userId) ?? [];
    list.push(row);
    byUser.set(row.userId, list);
  }
  let impossibleTravelAccounts = 0;
  for (const [, rows] of byUser) {
    const geo = rows
      .map((row) => ({ country: countryOf(row), t: ms(row.createdAt), label: labelOf(row) }))
      .filter((g) => g.country && Number.isFinite(g.t))
      .sort((a, b) => a.t - b.t);
    let hit: { a: string; b: string; gapMin: number; label: string } | null = null;
    for (let i = 1; i < geo.length; i += 1) {
      const prev = geo[i - 1];
      const cur = geo[i];
      if (prev.country === cur.country) continue;
      const gapMs = cur.t - prev.t;
      if (gapMs <= 3 * HOUR) {
        hit = { a: prev.country, b: cur.country, gapMin: Math.round(gapMs / 60000), label: cur.label };
        break;
      }
    }
    if (!hit) continue;
    impossibleTravelAccounts += 1;
    signals.push({
      id: `travel-${hit.label}-${hit.a}-${hit.b}`,
      kind: "impossible_travel",
      severity: hit.gapMin <= 60 ? "critical" : "warning",
      title: `Impossible travel: ${hit.a} → ${hit.b} in ${hit.gapMin}m`,
      detail: `${hit.label} appears in ${hit.a} then ${hit.b} only ${hit.gapMin} minutes apart — either a hijacked session, a VPN, or two people on one account. Confirm with the owner of that account.`,
      evidenceCount: 2,
      subjects: [hit.label],
    });
  }

  // ── 4) New-device/country alert bursts — a takeover tripwire being hammered ─
  const alertsByUser = new Map<string, { count: number; label: string }>();
  for (const row of windowed) {
    if (row.eventType !== "new_device_sign_in_alert") continue;
    const entry = alertsByUser.get(row.userId) ?? { count: 0, label: labelOf(row) };
    entry.count += 1;
    alertsByUser.set(row.userId, entry);
  }
  for (const [, entry] of alertsByUser) {
    if (entry.count < 3) continue;
    signals.push({
      id: `newdevice-${entry.label}`,
      kind: "new_device_alert",
      severity: entry.count >= 5 ? "warning" : "watch",
      title: `${entry.count} new-device alerts on one account`,
      detail: `${entry.label} tripped the new-device / new-country alert ${entry.count} times — repeated unfamiliar sign-ins are what an account under attack looks like.`,
      evidenceCount: entry.count,
      subjects: [entry.label],
    });
  }

  // ── 5) Revoked-device reuse — a killed device seen alive again ─────────────
  let revokedReuse = 0;
  for (const row of devices) {
    const revoked = ms(row.revokedAt);
    const lastSeen = ms(row.lastSeenAt);
    if (!Number.isFinite(revoked) || !Number.isFinite(lastSeen)) continue;
    if (lastSeen > revoked + 60000) {
      revokedReuse += 1;
      signals.push({
        id: `revoked-${row.deviceId}`,
        kind: "revoked_reuse",
        severity: "critical",
        title: "Revoked device active again",
        detail: `${labelOf(row)} has a device that was revoked, then seen again afterwards — a killed/compromised device should never come back. Investigate immediately.`,
        evidenceCount: 1,
        subjects: [labelOf(row)],
      });
    }
  }

  // ── 6) Password-reset pressure — recovery abuse / takeover prep ─────────────
  const resetByUser = new Map<string, { count: number; label: string }>();
  const resetByIp = new Map<string, number>();
  for (const row of windowed) {
    if (row.eventType !== "account_password_reset_request") continue;
    const entry = resetByUser.get(row.userId) ?? { count: 0, label: labelOf(row) };
    entry.count += 1;
    resetByUser.set(row.userId, entry);
    if (row.ip.trim()) resetByIp.set(row.ip.trim(), (resetByIp.get(row.ip.trim()) ?? 0) + 1);
  }
  for (const [, entry] of resetByUser) {
    if (entry.count < 3) continue;
    signals.push({
      id: `reset-${entry.label}`,
      kind: "reset_pressure",
      severity: entry.count >= 5 ? "warning" : "watch",
      title: `${entry.count} password-reset requests on one account`,
      detail: `${entry.label} requested a password reset ${entry.count} times in the window — either a locked-out user or someone probing account recovery.`,
      evidenceCount: entry.count,
      subjects: [entry.label],
    });
  }

  // ── 7) High-risk cluster — a pile-up the account app already flagged high ───
  const highRisk = windowed.filter(
    (row) => /high/i.test(row.riskLevel) || row.category === "alert",
  );
  if (highRisk.length >= 8) {
    const users = capSubjects(highRisk.map(labelOf));
    signals.push({
      id: "high-risk-cluster",
      kind: "high_risk_cluster",
      severity: highRisk.length >= 20 ? "warning" : "watch",
      title: `${highRisk.length} high-risk events in ${windowDays}d`,
      detail: `${highRisk.length} events were classed high-risk or alert-grade in the last ${windowDays} days across ${users.length}+ accounts — elevated background pressure worth watching.`,
      evidenceCount: highRisk.length,
      subjects: users,
    });
  }

  // Order: severity desc, then evidence desc — worst, best-supported first.
  signals.sort(
    (a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || b.evidenceCount - a.evidenceCount,
  );

  const criticalCount = signals.filter((s) => s.severity === "critical").length;
  const warningCount = signals.filter((s) => s.severity === "warning").length;
  const watchCount = signals.filter((s) => s.severity === "watch").length;

  const posture: ThreatPosture =
    criticalCount > 0 ? "critical" : warningCount > 0 ? "elevated" : watchCount > 0 ? "watch" : "calm";

  return {
    posture,
    signals,
    metrics: {
      windowDays,
      eventsAnalyzed: windowed.length,
      devicesAnalyzed: devices.length,
      criticalCount,
      warningCount,
      watchCount,
      distinctSprayIps,
      sharedDevices,
      impossibleTravelAccounts,
      revokedReuse,
    },
    blindSpots: [
      "Failed sign-in attempts are not recorded anywhere yet — classic failed-password brute-force is invisible until we capture them.",
      "Country is only precise on alert events; ordinary sign-in geography is inferred from the coarse IP city, so a determined VPN can mask location.",
    ],
  };
}
