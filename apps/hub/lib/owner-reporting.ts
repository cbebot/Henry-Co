import "server-only";

import { getHqUrl } from "@henryco/config";
import { sendTransactionalEmail } from "@henryco/email";
import { getFinanceCenterData, getMessagingCenterData, getOperationsCenterData, getOwnerOverviewData } from "@/lib/owner-data";
import { divisionLabel, formatCurrencyAmount } from "@/lib/format";
import { createAdminSupabase } from "@/lib/supabase";

const LAGOS_TIME_ZONE = "Africa/Lagos";
const OWNER_REPORT_ENTITY_TYPE = "owner_report";
const DAY_MS = 24 * 60 * 60 * 1000;
const LAGOS_OFFSET_MS = 60 * 60 * 1000;

export type OwnerReportKind = "weekly" | "monthly";

type OwnerRecipient = {
  email: string;
  fullName: string;
};

type DispatchStatus = "sent" | "skipped" | "failed";

type DispatchResult = {
  email: string;
  fullName: string;
  status: DispatchStatus;
  reason: string | null;
  messageId: string | null;
};

function cleanText(value?: unknown) {
  return String(value ?? "").trim();
}

function extractEmail(value?: unknown) {
  const match = cleanText(value).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0].trim().toLowerCase() : null;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: LAGOS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    timeZone: LAGOS_TIME_ZONE,
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    timeZone: LAGOS_TIME_ZONE,
    year: "numeric",
    month: "long",
  }).format(date);
}

function toLagosDate(date: Date) {
  return new Date(date.getTime() + LAGOS_OFFSET_MS);
}

function lagosDateAtMidnight(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day) - LAGOS_OFFSET_MS);
}

function buildWeeklyPeriod(now: Date) {
  const lagosNow = toLagosDate(now);
  const weekdayIndex = (lagosNow.getUTCDay() + 6) % 7;
  const currentWeekStart = lagosDateAtMidnight(
    lagosNow.getUTCFullYear(),
    lagosNow.getUTCMonth(),
    lagosNow.getUTCDate() - weekdayIndex
  );
  const start = new Date(currentWeekStart.getTime() - 7 * DAY_MS);
  const end = new Date(currentWeekStart.getTime() - DAY_MS);

  return {
    key: `${formatDateKey(start)}__${formatDateKey(end)}`,
    label: `${formatShortDate(start)} – ${formatShortDate(end)}`,
  };
}

function buildMonthlyPeriod(now: Date) {
  const lagosNow = toLagosDate(now);
  const previousMonthStart = lagosDateAtMidnight(
    lagosNow.getUTCFullYear(),
    lagosNow.getUTCMonth() - 1,
    1
  );
  const anchor = new Date(previousMonthStart.getTime() + 14 * DAY_MS);

  return {
    key: new Intl.DateTimeFormat("en-CA", {
      timeZone: LAGOS_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
    }).format(previousMonthStart),
    label: formatMonthLabel(anchor),
  };
}

function shouldRunReport(kind: OwnerReportKind, now: Date) {
  const lagosNow = toLagosDate(now);
  if (kind === "weekly") {
    return lagosNow.getUTCDay() === 1;
  }
  return lagosNow.getUTCDate() === 1;
}

async function listOwnerRecipients(): Promise<OwnerRecipient[]> {
  const configuredOwner = extractEmail(process.env.OWNER_ALERT_EMAIL);
  if (configuredOwner) {
    return [{ email: configuredOwner, fullName: "Owner" }];
  }

  const admin = createAdminSupabase();
  const { data: ownerProfiles } = await admin
    .from("owner_profiles")
    .select("user_id, email, role, is_active")
    .eq("is_active", true)
    .in("role", ["owner", "admin"]);

  const rows = ((ownerProfiles ?? []) as Array<Record<string, unknown>>).filter(Boolean);
  if (!rows.length) {
    return [];
  }

  const userIds = rows
    .map((row) => cleanText(row.user_id))
    .filter(Boolean);

  const profileNameById = new Map<string, string>();
  if (userIds.length) {
    const { data: customerProfiles } = await admin
      .from("customer_profiles")
      .select("id, full_name")
      .in("id", userIds);

    for (const row of (customerProfiles ?? []) as Array<Record<string, unknown>>) {
      const id = cleanText(row.id);
      if (id) {
        profileNameById.set(id, cleanText(row.full_name) || "Owner");
      }
    }
  }

  const authUsersById = new Map<string, { email: string | null; fullName: string | null }>();
  let page = 1;
  while (page <= 5) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;

    for (const user of data.users ?? []) {
      authUsersById.set(user.id, {
        email: extractEmail(user.email),
        fullName:
          cleanText(user.user_metadata?.full_name) ||
          cleanText(user.user_metadata?.name) ||
          null,
      });
    }

    if ((data.users ?? []).length < 200) break;
    page += 1;
  }

  const recipients = rows
    .map((row) => {
      const userId = cleanText(row.user_id);
      const authUser = userId ? authUsersById.get(userId) ?? null : null;
      const email = extractEmail(row.email) || authUser?.email || null;

      if (!email) return null;

      return {
        email,
        fullName:
          profileNameById.get(userId) ||
          authUser?.fullName ||
          cleanText(row.role) ||
          "Owner",
      } satisfies OwnerRecipient;
    })
    .filter((recipient): recipient is OwnerRecipient => Boolean(recipient));

  return recipients.filter(
    (recipient, index, list) => list.findIndex((entry) => entry.email === recipient.email) === index
  );
}

async function hasReportAudit(action: string, entityId: string) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("audit_logs")
    .select("id")
    .eq("action", action)
    .eq("entity_type", OWNER_REPORT_ENTITY_TYPE)
    .eq("entity_id", entityId)
    .limit(1)
    .maybeSingle();

  return Boolean(data?.id);
}

async function writeReportAudit(input: {
  action: string;
  entityId: string;
  reason?: string | null;
  payload: Record<string, unknown>;
}) {
  const admin = createAdminSupabase();
  await admin.from("audit_logs").insert({
    actor_id: null,
    actor_role: "system",
    action: input.action,
    entity_type: OWNER_REPORT_ENTITY_TYPE,
    entity_id: input.entityId,
    reason: input.reason ?? null,
    new_values: input.payload,
  } as never);
}

async function sendOwnerReportEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const dispatch = await sendTransactionalEmail({
    to: input.to,
    purpose: "security",
    fromName: "HenryCo HQ",
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (dispatch.status === "sent") {
    return {
      status: "sent" as const,
      reason: null,
      messageId: cleanText(dispatch.messageId) || null,
    };
  }

  if (dispatch.status === "skipped") {
    return {
      status: "failed" as const,
      reason: dispatch.skippedReason || "Email provider not configured for HenryCo HQ.",
      messageId: null,
    };
  }

  return {
    status: "failed" as const,
    reason: dispatch.safeError || "Unknown email dispatch error.",
    messageId: null,
  };
}

function renderList(items: string[]) {
  if (!items.length) return "";
  return `
    <ul style="margin:0;padding-left:18px;color:#5d5b55;font-size:14px;line-height:1.75;">
      ${items.map((item) => `<li style="margin:0 0 8px;">${escapeHtml(item)}</li>`).join("")}
    </ul>
  `;
}

function renderMetricCard(label: string, value: string, detail: string) {
  return `
    <div style="flex:1 1 180px;min-width:180px;border:1px solid rgba(23,18,15,0.08);border-radius:18px;padding:16px;background:#f7f4ee;">
      <div style="font-size:11px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#867f74;">${escapeHtml(label)}</div>
      <div style="margin-top:8px;font-size:24px;font-weight:700;letter-spacing:-0.03em;color:#17120f;">${escapeHtml(value)}</div>
      <div style="margin-top:8px;font-size:13px;line-height:1.6;color:#5d5b55;">${escapeHtml(detail)}</div>
    </div>
  `;
}

function renderOwnerReportEmail(input: {
  kind: OwnerReportKind;
  periodLabel: string;
  recipientName: string;
  overview: Awaited<ReturnType<typeof getOwnerOverviewData>>;
  finance: Awaited<ReturnType<typeof getFinanceCenterData>>;
  operations: Awaited<ReturnType<typeof getOperationsCenterData>>;
  messaging: Awaited<ReturnType<typeof getMessagingCenterData>>;
}) {
  const title =
    input.kind === "monthly"
      ? `HenryCo owner monthly report • ${input.periodLabel}`
      : `HenryCo owner weekly report • ${input.periodLabel}`;
  const intro =
    input.kind === "monthly"
      ? "This report is the richer monthly owner snapshot: money movement, pressure points, delivery health, and the next sensible executive actions."
      : "This weekly owner report keeps the most important operational and financial truths visible without making you parse raw tables.";
  const topSignals = input.overview.signals.slice(0, 5).map((signal) => `${signal.title}: ${signal.body}`);
  const divisionPressure = [...input.overview.divisions]
    .sort((left, right) => left.healthScore - right.healthScore)
    .slice(0, 4)
    .map(
      (division) =>
        `${division.displayName} — ${division.healthLabel} health, ${division.alertCount} alert(s), ${formatCurrencyAmount(division.revenueNaira)} recognized revenue.`
    );
  const financeLines = [
    `Recognized revenue: ${formatCurrencyAmount(input.finance.moneyMovement.recognizedRevenueNaira)}`,
    `Recorded outflow: ${formatCurrencyAmount(input.finance.moneyMovement.recordedOutflowNaira)}`,
    `Wallet funding awaiting verification: ${formatCurrencyAmount(input.finance.moneyMovement.walletFundingPendingNaira)}`,
    `Wallet withdrawals awaiting payout: ${formatCurrencyAmount(input.finance.moneyMovement.walletWithdrawalPendingNaira)}`,
    `Pending shared invoices: ${input.finance.pendingInvoices.length}`,
    `Pending marketplace payouts: ${input.finance.pendingPayouts.length}`,
  ];
  const messagingLines = [
    `${input.messaging.metrics.failed} delivery failure(s) are still open in the notification queues.`,
    `${input.messaging.metrics.skipped} queue item(s) were skipped.`,
    `${input.operations.metrics.openSupport} support thread(s) are still open across divisions.`,
    `${input.operations.metrics.staleSupport} support thread(s) are stale beyond the live update window.`,
  ];
  const recommendations = input.overview.helperInsights
    .slice(0, 4)
    .map((insight) => `${insight.title}: ${insight.body}`);
  const movementRows = input.finance.recentPayments
    .slice(0, input.kind === "monthly" ? 8 : 5)
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 12px;border-top:1px solid rgba(23,18,15,0.08);font-size:13px;color:#17120f;">${escapeHtml(divisionLabel(item.division))}</td>
          <td style="padding:10px 12px;border-top:1px solid rgba(23,18,15,0.08);font-size:13px;color:#5d5b55;">${escapeHtml(item.label)}</td>
          <td style="padding:10px 12px;border-top:1px solid rgba(23,18,15,0.08);font-size:13px;color:#5d5b55;">${escapeHtml(item.status)}</td>
          <td style="padding:10px 12px;border-top:1px solid rgba(23,18,15,0.08);font-size:13px;color:#17120f;">${escapeHtml(formatCurrencyAmount(item.amountNaira))}</td>
        </tr>
      `
    )
    .join("");

  const html = `
    <div style="background:#f3efe8;padding:32px;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#17120f;">
      <div style="max-width:760px;margin:0 auto;background:#fffdfa;border:1px solid rgba(23,18,15,0.08);border-radius:32px;overflow:hidden;box-shadow:0 32px 90px rgba(15,15,15,0.12);">
        <div style="padding:30px 34px;background:linear-gradient(135deg,#17120f 0%,#4f4232 55%,#c9a227 100%);color:#fffaf2;">
          <div style="font-size:11px;font-weight:800;letter-spacing:0.24em;text-transform:uppercase;opacity:0.78;">HenryCo HQ</div>
          <h1 style="margin:14px 0 8px;font-family:'Source Serif 4',Georgia,Cambria,'Times New Roman',serif;font-size:40px;line-height:1;font-weight:600;">${escapeHtml(title)}</h1>
          <p style="margin:0;font-size:15px;line-height:1.7;max-width:620px;color:rgba(255,250,242,0.9);">${escapeHtml(intro)}</p>
        </div>

        <div style="padding:28px 34px;">
          <p style="margin:0 0 18px;font-size:15px;line-height:1.75;color:#5d5b55;">Hello ${escapeHtml(input.recipientName || "Owner")},</p>
          <p style="margin:0 0 22px;font-size:15px;line-height:1.85;color:#5d5b55;">${escapeHtml(input.overview.executiveDigest)}</p>

          <div style="display:flex;flex-wrap:wrap;gap:14px;margin-bottom:24px;">
            ${renderMetricCard(
              "Recognized Revenue",
              formatCurrencyAmount(input.finance.moneyMovement.recognizedRevenueNaira),
              "Live revenue observed across Care, Marketplace, and shared invoices."
            )}
            ${renderMetricCard(
              "Recorded Outflow",
              formatCurrencyAmount(input.finance.moneyMovement.recordedOutflowNaira),
              "Care expense ledger plus wallet payouts already marked complete."
            )}
            ${renderMetricCard(
              "Critical Signals",
              String(input.overview.metrics.criticalSignals),
              "Items currently demanding owner attention."
            )}
            ${renderMetricCard(
              "Open Support",
              String(input.operations.metrics.openSupport),
              "Cross-division customer and operational threads still open."
            )}
          </div>

          <section style="margin-top:24px;">
            <h2 style="margin:0 0 10px;font-size:18px;font-weight:700;color:#17120f;">Owner watchlist</h2>
            ${renderList(topSignals)}
          </section>

          <section style="margin-top:24px;">
            <h2 style="margin:0 0 10px;font-size:18px;font-weight:700;color:#17120f;">Money visibility</h2>
            ${renderList(financeLines)}
          </section>

          <section style="margin-top:24px;">
            <h2 style="margin:0 0 10px;font-size:18px;font-weight:700;color:#17120f;">Operations and messaging health</h2>
            ${renderList(messagingLines)}
          </section>

          <section style="margin-top:24px;">
            <h2 style="margin:0 0 10px;font-size:18px;font-weight:700;color:#17120f;">Division pressure</h2>
            ${renderList(divisionPressure)}
          </section>

          ${
            recommendations.length
              ? `
          <section style="margin-top:24px;">
            <h2 style="margin:0 0 10px;font-size:18px;font-weight:700;color:#17120f;">Practical next actions</h2>
            ${renderList(recommendations)}
          </section>
          `
              : ""
          }

          <section style="margin-top:24px;">
            <h2 style="margin:0 0 10px;font-size:18px;font-weight:700;color:#17120f;">Recent money movement</h2>
            <div style="overflow:hidden;border:1px solid rgba(23,18,15,0.08);border-radius:18px;">
              <table style="width:100%;border-collapse:collapse;background:#fffdfa;">
                <thead>
                  <tr style="background:#f7f4ee;">
                    <th style="padding:12px;text-align:left;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#867f74;">Source</th>
                    <th style="padding:12px;text-align:left;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#867f74;">Reference</th>
                    <th style="padding:12px;text-align:left;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#867f74;">Status</th>
                    <th style="padding:12px;text-align:left;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#867f74;">Amount</th>
                  </tr>
                </thead>
                <tbody>${movementRows}</tbody>
              </table>
            </div>
          </section>

          <div style="margin-top:28px;">
            <a href="${escapeHtml(getHqUrl("/owner"))}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#17120f;color:#fffaf2;text-decoration:none;font-weight:700;">
              Open Owner HQ
            </a>
          </div>

          <p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#867f74;">
            Generated from live HenryCo HQ data surfaces. If a number looks stale, refresh the relevant division after the next workflow update lands.
          </p>
        </div>
      </div>
    </div>
  `;

  const text = [
    title,
    "",
    intro,
    "",
    `Recognized revenue: ${formatCurrencyAmount(input.finance.moneyMovement.recognizedRevenueNaira)}`,
    `Recorded outflow: ${formatCurrencyAmount(input.finance.moneyMovement.recordedOutflowNaira)}`,
    `Critical signals: ${input.overview.metrics.criticalSignals}`,
    `Open support: ${input.operations.metrics.openSupport}`,
    "",
    "Owner watchlist:",
    ...topSignals.map((line) => `- ${line}`),
    "",
    "Money visibility:",
    ...financeLines.map((line) => `- ${line}`),
    "",
    "Operations and messaging health:",
    ...messagingLines.map((line) => `- ${line}`),
    "",
    "Division pressure:",
    ...divisionPressure.map((line) => `- ${line}`),
    ...(recommendations.length
      ? ["", "Practical next actions:", ...recommendations.map((line) => `- ${line}`)]
      : []),
    "",
    `Open Owner HQ: ${getHqUrl("/owner")}`,
  ].join("\n");

  return {
    subject: title,
    html,
    text,
  };
}

export async function runOwnerReport(
  kind: OwnerReportKind,
  options?: {
    now?: Date;
    force?: boolean;
  }
) {
  const now = options?.now ?? new Date();
  const period = kind === "monthly" ? buildMonthlyPeriod(now) : buildWeeklyPeriod(now);

  if (!options?.force && !shouldRunReport(kind, now)) {
    return {
      ok: true,
      kind,
      periodKey: period.key,
      periodLabel: period.label,
      generatedAt: now.toISOString(),
      recipients: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      scheduleSkipped: true,
      deliveries: [] as DispatchResult[],
    };
  }

  const [overview, finance, operations, messaging, recipients] = await Promise.all([
    getOwnerOverviewData(),
    getFinanceCenterData(),
    getOperationsCenterData(),
    getMessagingCenterData(),
    listOwnerRecipients(),
  ]);

  if (!recipients.length) {
    return {
      ok: false,
      kind,
      periodKey: period.key,
      periodLabel: period.label,
      reason: "No owner recipients could be resolved from OWNER_ALERT_EMAIL or active owner profiles.",
      deliveries: [] as DispatchResult[],
    };
  }

  const deliveries: DispatchResult[] = [];
  const sentAction = `owner_report_${kind}_sent`;
  const failedAction = `owner_report_${kind}_failed`;

  for (const recipient of recipients) {
    const entityId = `${kind}:${period.key}:${recipient.email}`;
    const alreadySent = options?.force ? false : await hasReportAudit(sentAction, entityId);
    if (alreadySent) {
      deliveries.push({
        email: recipient.email,
        fullName: recipient.fullName,
        status: "skipped",
        reason: "A sent audit row already exists for this owner and report period.",
        messageId: null,
      });
      continue;
    }

    const emailTemplate = renderOwnerReportEmail({
      kind,
      periodLabel: period.label,
      recipientName: recipient.fullName,
      overview,
      finance,
      operations,
      messaging,
    });
    const dispatch = await sendOwnerReportEmail({
      to: recipient.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    const action = dispatch.status === "sent" ? sentAction : failedAction;
    await writeReportAudit({
      action,
      entityId,
      reason: dispatch.reason,
      payload: {
        reportKind: kind,
        periodKey: period.key,
        periodLabel: period.label,
        recipient: recipient.email,
        deliveryStatus: dispatch.status,
        messageId: dispatch.messageId,
        metrics: overview.metrics,
        finance: finance.moneyMovement,
      },
    });

    deliveries.push({
      email: recipient.email,
      fullName: recipient.fullName,
      status: dispatch.status,
      reason: dispatch.reason,
      messageId: dispatch.messageId,
    });
  }

  const sent = deliveries.filter((item) => item.status === "sent").length;
  const failed = deliveries.filter((item) => item.status === "failed").length;
  const skipped = deliveries.filter((item) => item.status === "skipped").length;

  return {
    ok: sent > 0 && failed === 0,
    kind,
    periodKey: period.key,
    periodLabel: period.label,
    generatedAt: now.toISOString(),
    recipients: recipients.length,
    sent,
    failed,
    skipped,
    scheduleSkipped: false,
    deliveries,
  };
}

export async function runOwnerReports(input?: {
  kinds?: OwnerReportKind[];
  force?: boolean;
  now?: Date;
}) {
  const now = input?.now ?? new Date();
  const summaries = [];
  for (const kind of input?.kinds ?? ["weekly", "monthly"]) {
    summaries.push(
      await runOwnerReport(kind, {
        now,
        force: input?.force ?? false,
      })
    );
  }
  return {
    ok: summaries.every((summary) => summary.failed === 0),
    generatedAt: now.toISOString(),
    reports: summaries,
  };
}
