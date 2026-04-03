import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import { buildCarePublicUrl } from "@/lib/care-links";
import { getCareSettings } from "@/lib/care-data";
import {
  sendAdminNotificationEmail,
  sendCustomerReengagementEmail,
  sendOwnerMonthlySummaryEmail,
  sendPaymentReminderEmail,
  sendServiceReminderEmail,
} from "@/lib/email/send";
import {
  buildMarketingUnsubscribeUrl,
  getMarketingSuppressionIndex,
  isMarketingAllowed,
} from "@/lib/messaging/preferences";
import {
  getWhatsAppCapability,
  normalizeWhatsAppPhone,
  sendWhatsAppText,
} from "@/lib/support/whatsapp";
import { getOperationsIntelligenceSnapshot } from "@/lib/operations-intelligence";

type BookingAutomationRow = {
  id: string;
  tracking_code: string | null;
  customer_name: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  service_family: string | null;
  service_type: string | null;
  created_at: string;
  updated_at: string | null;
  pickup_date: string | null;
  balance_due: number | null;
  quoted_total: number | null;
  amount_paid: number | null;
  payment_status: string | null;
  payment_requested_at: string | null;
  payment_due_at: string | null;
};

type PaymentAutomationRow = {
  id: string;
  amount: number | null;
  created_at: string;
};

type ExpenseAutomationRow = {
  id: string;
  amount: number | null;
  category: string | null;
  approval_status: string | null;
  created_at: string;
};

type AutomationRunSummary = {
  ownerSummariesSent: number;
  ownerAlertEmailsSent: number;
  ownerAlertWhatsAppSent: number;
  ownerDigestsSent: number;
  paymentRemindersSent: number;
  serviceRemindersSent: number;
  reengagementSent: number;
  whatsappSent: number;
  skipped: number;
};

const LAGOS_TIME_ZONE = "Africa/Lagos";
const SUPPORT_EVENT_ROUTE = "/api/cron/care-automation";

function cleanText(value?: string | null) {
  return String(value || "").trim();
}

function cleanEmail(value?: string | null) {
  const match = cleanText(value).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0].trim().toLowerCase() : null;
}

function asNumber(value: unknown, fallback = 0) {
  const normalized = Number(value ?? fallback);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function formatMoney(value: number) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("en-NG", {
    timeZone: LAGOS_TIME_ZONE,
    year: "numeric",
    month: "long",
  });
}

function getLagosDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LAGOS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const value = (type: "year" | "month" | "day") =>
    Number(parts.find((part) => part.type === type)?.value || "0");

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
  };
}

function getLagosMonthRange(date: Date) {
  const { year, month } = getLagosDateParts(date);

  return {
    monthKey: `${year}-${String(month).padStart(2, "0")}`,
    monthLabel: formatMonthLabel(date),
    start: new Date(Date.UTC(year, month - 1, 1, -1, 0, 0)),
    end: new Date(Date.UTC(year, month, 1, -1, 0, 0)),
  };
}

function isLastDayOfMonthInLagos(date: Date) {
  const { year, month, day } = getLagosDateParts(date);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day === lastDay;
}

function daysBetween(a: Date, b: Date) {
  return Math.floor((a.getTime() - b.getTime()) / 86400000);
}

function serviceFamilyLabel(value?: string | null) {
  const key = cleanText(value).toLowerCase();
  if (key === "home") return "Home cleaning";
  if (key === "office") return "Office cleaning";
  return "Wardrobe care";
}

function normalizeDisplayName(value?: string | null, fallback = "Customer") {
  const cleaned = cleanText(value);
  return cleaned || fallback;
}

async function writeAutomationLog(input: {
  eventType: string;
  success: boolean;
  email?: string | null;
  details: Record<string, unknown>;
}) {
  const supabase = createAdminSupabase();
  await supabase.from("care_security_logs").insert({
    event_type: input.eventType,
    route: SUPPORT_EVENT_ROUTE,
    email: input.email ?? null,
    success: input.success,
    details: input.details,
  } as never);
}

async function hasAutomationLog(eventType: string, dedupeKey: string) {
  const supabase = createAdminSupabase();
  const { data } = await supabase
    .from("care_security_logs")
    .select("id")
    .eq("event_type", eventType)
    .contains("details", { dedupe_key: dedupeKey })
    .limit(1)
    .maybeSingle();

  return Boolean(data?.id);
}

async function getOwnerRecipients() {
  const envTarget = cleanEmail(process.env.OWNER_ALERT_EMAIL);
  if (envTarget) {
    return [
      {
        email: envTarget,
        fullName: "Owner",
      },
    ];
  }

  const supabase = createAdminSupabase();
  const owners: Array<{ email: string; fullName: string }> = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) {
      throw error;
    }

    const users = data.users || [];

    for (const user of users) {
      const role = cleanText(
        String(
          user.app_metadata?.staff_role ||
            user.user_metadata?.role ||
            user.app_metadata?.role ||
            ""
        )
      ).toLowerCase();

      const email = cleanEmail(user.email);
      if (role === "owner" && email) {
        owners.push({
          email,
          fullName:
            cleanText(String(user.user_metadata?.full_name || "")) ||
            cleanText(String(user.user_metadata?.name || "")) ||
            "Owner",
        });
      }
    }

    if (users.length < 100) break;
    page += 1;
  }

  return owners;
}

function getOwnerAlertWhatsAppTarget() {
  return normalizeWhatsAppPhone(process.env.OWNER_ALERT_WHATSAPP);
}

async function getAutomationDataset() {
  const supabase = createAdminSupabase();

  const [bookings, payments, expenses] = await Promise.all([
    supabase
      .from("care_bookings")
      .select(
        "id, tracking_code, customer_name, email, phone, status, service_family, service_type, created_at, updated_at, pickup_date, balance_due, quoted_total, amount_paid, payment_status, payment_requested_at, payment_due_at"
      )
      .order("created_at", { ascending: false })
      .limit(1200),
    supabase
      .from("care_payments")
      .select("id, amount, created_at")
      .order("created_at", { ascending: false })
      .limit(1200),
    supabase
      .from("care_expenses")
      .select("id, amount, category, approval_status, created_at")
      .order("created_at", { ascending: false })
      .limit(1200),
  ]);

  return {
    bookings: ((bookings.data ?? []) as BookingAutomationRow[]).map((row) => ({
      ...row,
      balance_due: row.balance_due == null ? null : asNumber(row.balance_due),
      quoted_total: row.quoted_total == null ? null : asNumber(row.quoted_total),
      amount_paid: row.amount_paid == null ? null : asNumber(row.amount_paid),
    })),
    payments: ((payments.data ?? []) as PaymentAutomationRow[]).map((row) => ({
      ...row,
      amount: row.amount == null ? null : asNumber(row.amount),
    })),
    expenses: ((expenses.data ?? []) as ExpenseAutomationRow[]).map((row) => ({
      ...row,
      amount: row.amount == null ? null : asNumber(row.amount),
    })),
  };
}

async function sendOwnerMonthlySummary(now: Date, dataset: Awaited<ReturnType<typeof getAutomationDataset>>) {
  if (!isLastDayOfMonthInLagos(now)) {
    return 0;
  }

  const owners = await getOwnerRecipients();
  if (owners.length === 0) {
    return 0;
  }

  const { start, end, monthKey, monthLabel } = getLagosMonthRange(now);
  const monthStart = start.getTime();
  const monthEnd = end.getTime();

  const monthBookings = dataset.bookings.filter((row) => {
    const time = new Date(row.created_at).getTime();
    return time >= monthStart && time < monthEnd;
  });
  const monthPayments = dataset.payments.filter((row) => {
    const time = new Date(row.created_at).getTime();
    return time >= monthStart && time < monthEnd;
  });
  const monthExpenses = dataset.expenses.filter((row) => {
    const time = new Date(row.created_at).getTime();
    return time >= monthStart && time < monthEnd;
  });

  const inflow = monthPayments.reduce((sum, row) => sum + asNumber(row.amount), 0);
  const outflow = monthExpenses
    .filter((row) => cleanText(row.approval_status).toLowerCase() !== "voided")
    .reduce((sum, row) => sum + asNumber(row.amount), 0);
  const net = inflow - outflow;
  const deliveredCount = monthBookings.filter(
    (row) => cleanText(row.status).toLowerCase() === "delivered"
  ).length;
  const outstandingBalance = dataset.bookings.reduce(
    (sum, row) => sum + Math.max(0, asNumber(row.balance_due)),
    0
  );
  const pendingExpenseCount = dataset.expenses.filter(
    (row) => cleanText(row.approval_status).toLowerCase() === "recorded"
  ).length;

  const topExpenseCategories = Object.entries(
    monthExpenses
      .filter((row) => cleanText(row.approval_status).toLowerCase() !== "voided")
      .reduce<Record<string, number>>((acc, row) => {
        const key = cleanText(row.category).toLowerCase() || "other";
        acc[key] = (acc[key] || 0) + asNumber(row.amount);
        return acc;
      }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, amount]) => `${key.replace(/_/g, " ")} • ${formatMoney(amount)}`);

  const keySignals = [
    `${monthBookings.length} booking(s) were created this month.`,
    `${deliveredCount} booking(s) reached delivered status in the same period.`,
    `${pendingExpenseCount} expense record(s) still need owner action.`,
    `Outstanding balance across active bookings is ${formatMoney(outstandingBalance)}.`,
  ];

  const financeUrl = await buildCarePublicUrl("/owner/finance");
  let sent = 0;

  for (const owner of owners) {
    const dedupeKey = `owner-monthly-summary:${monthKey}:${owner.email}`;
    if (await hasAutomationLog("owner_monthly_summary_sent", dedupeKey)) {
      continue;
    }

    const dispatch = await sendOwnerMonthlySummaryEmail(owner.email, {
      ownerName: owner.fullName,
      monthLabel,
      inflow: formatMoney(inflow),
      outflow: formatMoney(outflow),
      net: formatMoney(net),
      bookingsCount: monthBookings.length,
      deliveredCount,
      outstandingBalance: formatMoney(outstandingBalance),
      pendingExpenseCount,
      topExpenseCategories,
      keySignals,
      financeUrl,
    });

    await writeAutomationLog({
      eventType:
        dispatch.status === "sent" ? "owner_monthly_summary_sent" : "owner_monthly_summary_failed",
      success: dispatch.status === "sent",
      email: owner.email,
      details: {
        dedupe_key: dedupeKey,
        month_key: monthKey,
        dispatch_status: dispatch.status,
        notification_id: dispatch.notificationId,
        reason: dispatch.reason,
      },
    });

    if (dispatch.status === "sent") {
      sent += 1;
    }
  }

  return sent;
}

function dayKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function sendOwnerOperationalAlerts(now: Date) {
  const [targets, snapshot] = await Promise.all([
    getOwnerRecipients(),
    getOperationsIntelligenceSnapshot(),
  ]);
  const whatsAppCapability = getWhatsAppCapability();
  const ownerWhatsApp = getOwnerAlertWhatsAppTarget();
  const key = dayKey(now);
  const criticalSignals = snapshot.signals.filter((signal) => signal.tone === "critical");

  let ownerAlertEmailsSent = 0;
  let ownerAlertWhatsAppSent = 0;
  let ownerDigestsSent = 0;

  for (const signal of criticalSignals.slice(0, 5)) {
    const dedupeKey = `owner-critical-alert:${signal.id}:${key}`;
    if (await hasAutomationLog("owner_alert_email_sent", dedupeKey)) {
      continue;
    }

    for (const target of targets) {
      const emailDispatch = await sendAdminNotificationEmail(
        target.email,
        {
          heading: `Owner alert • ${signal.title}`,
          summary: signal.summary,
          lines: [
            `Area: ${signal.group}`,
            `Recommended view: ${signal.href}`,
            `Generated: ${new Date(snapshot.generatedAt).toLocaleString("en-NG")}`,
          ],
        },
        {
          dedupeKey: `${dedupeKey}:${target.email}`,
        }
      );

      await writeAutomationLog({
        eventType:
          emailDispatch.status === "sent" ? "owner_alert_email_sent" : "owner_alert_email_failed",
        success: emailDispatch.status === "sent",
        email: target.email,
        details: {
          dedupe_key: dedupeKey,
          signal_id: signal.id,
          signal_title: signal.title,
          notification_id: emailDispatch.notificationId,
          dispatch_status: emailDispatch.status,
          reason: emailDispatch.reason,
        },
      });

      if (emailDispatch.status === "sent") {
        ownerAlertEmailsSent += 1;
      }
    }

    if (ownerWhatsApp && whatsAppCapability.configured) {
      const whatsapp = await sendWhatsAppText({
        phone: ownerWhatsApp,
        body: [
          "HenryCo Care owner alert",
          signal.title,
          signal.summary,
          `Area: ${signal.group}`,
          `Open next: ${signal.href}`,
        ].join("\n"),
        metadata: {
          sourceKind: "owner_alert",
          sourceId: signal.id,
          sourceLabel: signal.title,
          conversationPolicy: "business_initiated",
        },
      });

      await writeAutomationLog({
        eventType:
          whatsapp.status === "sent"
            ? "owner_alert_whatsapp_sent"
            : "owner_alert_whatsapp_failed",
        success: whatsapp.status === "sent",
        email: null,
        details: {
          dedupe_key: `${dedupeKey}:whatsapp`,
          signal_id: signal.id,
          signal_title: signal.title,
          whatsapp_status: whatsapp.status,
          whatsapp_reason: whatsapp.reason,
          whatsapp_provider: whatsapp.provider,
          whatsapp_message_id: whatsapp.messageId,
          whatsapp_status_code: whatsapp.statusCode,
          whatsapp_graph_error_code: whatsapp.graphErrorCode,
          whatsapp_response_summary: whatsapp.responseSummary,
        },
      });

      if (whatsapp.status === "sent") {
        ownerAlertWhatsAppSent += 1;
      }
    }
  }

  const digestKey = `owner-digest:${key}`;
  if (!(await hasAutomationLog("owner_digest_sent", digestKey))) {
    const topSignals = snapshot.signals.slice(0, 6);
    const digestLines =
      topSignals.length > 0
        ? topSignals.map((signal) => `${signal.group}: ${signal.title} — ${signal.summary}`)
        : ["No critical or warning signals are open right now."];

    for (const target of targets) {
      const digest = await sendAdminNotificationEmail(
        target.email,
        {
          heading: "Owner digest • Daily Care operations summary",
          summary:
            topSignals.length > 0
              ? `${topSignals.length} signal${topSignals.length === 1 ? "" : "s"} deserves visibility today.`
              : "Today’s operating picture is calm across bookings, support, payments, and reviews.",
          lines: digestLines,
        },
        {
          dedupeKey: `${digestKey}:${target.email}`,
        }
      );

      await writeAutomationLog({
        eventType: digest.status === "sent" ? "owner_digest_sent" : "owner_digest_failed",
        success: digest.status === "sent",
        email: target.email,
        details: {
          dedupe_key: digestKey,
          signal_count: topSignals.length,
          notification_id: digest.notificationId,
          dispatch_status: digest.status,
          reason: digest.reason,
        },
      });

      if (digest.status === "sent") {
        ownerDigestsSent += 1;
      }
    }
  }

  return {
    ownerAlertEmailsSent,
    ownerAlertWhatsAppSent,
    ownerDigestsSent,
  };
}

async function sendPaymentReminders(
  now: Date,
  settings: Awaited<ReturnType<typeof getCareSettings>>,
  dataset: Awaited<ReturnType<typeof getAutomationDataset>>
) {
  const trackUrlFor = async (trackingCode: string) =>
    buildCarePublicUrl("/track", { code: trackingCode });

  let sent = 0;
  const whatsAppCapability = getWhatsAppCapability();

  for (const booking of dataset.bookings) {
    const trackingCode = cleanText(booking.tracking_code);
    const email = cleanEmail(booking.email);
    const status = cleanText(booking.status).toLowerCase();
    const paymentRequestedAt = cleanText(booking.payment_requested_at);
    const balanceDue = Math.max(0, asNumber(booking.balance_due));

    if (!trackingCode || !paymentRequestedAt || !balanceDue || status === "cancelled") {
      continue;
    }

    const requestedAt = new Date(paymentRequestedAt);
    if (Number.isNaN(requestedAt.getTime())) {
      continue;
    }

    const ageDays = daysBetween(now, requestedAt);
    if (![1, 3, 7].includes(ageDays)) {
      continue;
    }

    const dedupeKey = `payment-reminder:${booking.id}:${ageDays}`;
    if (await hasAutomationLog("payment_reminder_sent", dedupeKey)) {
      continue;
    }

    const dueLabel =
      ageDays === 1
        ? "Payment reminder after 24 hours"
        : ageDays === 3
        ? "Second reminder after 3 days"
        : "Final reminder after 7 days";

    const trackUrl = await trackUrlFor(trackingCode);
    const dispatch = await sendPaymentReminderEmail(
      email,
      booking.id,
      {
        customerName: normalizeDisplayName(booking.customer_name),
        trackingCode,
        amountDue: formatMoney(balanceDue),
        currencyLabel: cleanText(settings.payment_currency) || "NGN",
        dueLabel,
        accountName:
          cleanText(settings.payment_account_name) ||
          cleanText(settings.company_account_name) ||
          "HenryCo Care",
        accountNumber:
          cleanText(settings.payment_account_number) ||
          cleanText(settings.company_account_number) ||
          "Not provided yet",
        bankName:
          cleanText(settings.payment_bank_name) ||
          cleanText(settings.company_bank_name) ||
          "Not provided yet",
        instructions:
          cleanText(settings.payment_instructions) ||
          "Reply with payment confirmation once the transfer is complete.",
        trackUrl,
      },
      dedupeKey
    );

    let whatsappStatus = "skipped";
    let whatsappReason: string | null = "WhatsApp is not configured.";

    if (whatsAppCapability.configured) {
      const whatsapp = await sendWhatsAppText({
        phone: booking.phone,
        body: [
          "HenryCo Care payment reminder",
          `Tracking code: ${trackingCode}`,
          `Amount due: ${formatMoney(balanceDue)}`,
          dueLabel,
          "",
          `Bank: ${cleanText(settings.payment_bank_name) || cleanText(settings.company_bank_name) || "HenryCo Care"}`,
          `Account number: ${cleanText(settings.payment_account_number) || cleanText(settings.company_account_number) || "Not provided yet"}`,
          "Please send payment confirmation once the transfer is complete.",
        ].join("\n"),
        metadata: {
          sourceKind: "payment_reminder",
          sourceId: booking.id,
          sourceLabel: trackingCode,
          conversationPolicy: "business_initiated",
        },
      });
      whatsappStatus = whatsapp.status;
      whatsappReason = whatsapp.reason;
    }

    await writeAutomationLog({
      eventType: dispatch.status === "sent" ? "payment_reminder_sent" : "payment_reminder_failed",
      success: dispatch.status === "sent",
      email,
      details: {
        dedupe_key: dedupeKey,
        booking_id: booking.id,
        tracking_code: trackingCode,
        stage_days: ageDays,
        dispatch_status: dispatch.status,
        notification_id: dispatch.notificationId,
        whatsapp_status: whatsappStatus,
        whatsapp_reason: whatsappReason,
      },
    });

    if (dispatch.status === "sent") {
      sent += 1;
    }
  }

  return sent;
}

async function sendMarketingNurture(
  now: Date,
  dataset: Awaited<ReturnType<typeof getAutomationDataset>>
) {
  const suppressionIndex = await getMarketingSuppressionIndex();
  const latestActivityByContact = new Map<string, number>();
  let serviceRemindersSent = 0;
  let reengagementSent = 0;
  let whatsappSent = 0;
  let skipped = 0;
  const whatsAppCapability = getWhatsAppCapability();

  for (const booking of dataset.bookings) {
    const email = cleanEmail(booking.email);
    const phone = normalizeWhatsAppPhone(booking.phone);
    const activitySource = booking.updated_at || booking.created_at;
    const activityAt = new Date(activitySource).getTime();
    if (Number.isNaN(activityAt)) continue;

    if (email) {
      latestActivityByContact.set(email, Math.max(latestActivityByContact.get(email) || 0, activityAt));
    }

    if (phone) {
      latestActivityByContact.set(phone, Math.max(latestActivityByContact.get(phone) || 0, activityAt));
    }
  }

  const bookUrl = await buildCarePublicUrl("/book");
  const contactUrl = await buildCarePublicUrl("/contact");

  for (const booking of dataset.bookings) {
    const status = cleanText(booking.status).toLowerCase();
    const trackingCode = cleanText(booking.tracking_code);
    const email = cleanEmail(booking.email);
    const phone = normalizeWhatsAppPhone(booking.phone);
    const customerName = normalizeDisplayName(booking.customer_name);
    const serviceFamily = serviceFamilyLabel(booking.service_family);
    const serviceType = cleanText(booking.service_type) || "Service request";

    if (status !== "delivered" || !trackingCode || (!email && !phone)) {
      continue;
    }

    const completedAt = new Date(booking.updated_at || booking.created_at);
    if (Number.isNaN(completedAt.getTime())) {
      continue;
    }

    const daysSinceCompletion = daysBetween(now, completedAt);
    let campaign: "service_reminder" | "customer_reengagement" | null = null;
    let dedupeKey = "";

    if (daysSinceCompletion >= 21 && daysSinceCompletion <= 28) {
      campaign = "service_reminder";
      dedupeKey = `service-reminder:${booking.id}:21`;
    } else if (daysSinceCompletion >= 60 && daysSinceCompletion <= 75) {
      campaign = "customer_reengagement";
      dedupeKey = `customer-reengagement:${booking.id}:60`;
    }

    if (!campaign) {
      continue;
    }

    const latestEmailActivity = email ? latestActivityByContact.get(email) || 0 : 0;
    const latestPhoneActivity = phone ? latestActivityByContact.get(phone) || 0 : 0;
    const latestActivity = Math.max(latestEmailActivity, latestPhoneActivity);

    if (latestActivity > completedAt.getTime() + 1000 * 60 * 60 * 24 * 5) {
      skipped += 1;
      continue;
    }

    if (!isMarketingAllowed(suppressionIndex, { email, phone })) {
      skipped += 1;
      continue;
    }

    if (await hasAutomationLog(`${campaign}_sent`, dedupeKey)) {
      continue;
    }

    const unsubscribeUrl = await buildMarketingUnsubscribeUrl({ email, phone });

    if (email) {
      const dispatch =
        campaign === "service_reminder"
          ? await sendServiceReminderEmail(
              email,
              booking.id,
              {
                customerName,
                serviceFamilyLabel: serviceFamily,
                serviceType,
                timingLabel: "Around this point in the cycle",
                recommendation:
                  serviceFamily === "Wardrobe care"
                    ? "A fresh pickup keeps the wardrobe rotation easy before items pile up again."
                    : "A planned return visit helps keep the space in its best condition without a rushed recovery booking later.",
                bookUrl,
                contactUrl,
                unsubscribeUrl,
              },
              dedupeKey
            )
          : await sendCustomerReengagementEmail(
              email,
              booking.id,
              {
                customerName,
                serviceFamilyLabel: serviceFamily,
                serviceType,
                comebackNote:
                  serviceFamily === "Wardrobe care"
                    ? "If there is another batch ready, pickup can be booked again in a few minutes."
                    : "If the property or workplace needs another round, the booking flow is already prepared for a quick return.",
                bookUrl,
                contactUrl,
                unsubscribeUrl,
              },
              dedupeKey
            );

      await writeAutomationLog({
        eventType: `${campaign}_${dispatch.status === "sent" ? "sent" : "failed"}`,
        success: dispatch.status === "sent",
        email,
        details: {
          dedupe_key: dedupeKey,
          booking_id: booking.id,
          tracking_code: trackingCode,
          dispatch_status: dispatch.status,
          notification_id: dispatch.notificationId,
        },
      });

      if (dispatch.status === "sent") {
        if (campaign === "service_reminder") {
          serviceRemindersSent += 1;
        } else {
          reengagementSent += 1;
        }
      }
    }

    if (phone && whatsAppCapability.configured) {
      const whatsapp = await sendWhatsAppText({
        phone,
        body:
          campaign === "service_reminder"
            ? [
                "HenryCo Care reminder",
                `Hello ${customerName},`,
                "",
                `It may be a good time to schedule the next ${serviceFamily.toLowerCase()} visit.`,
                "Book again whenever you are ready.",
                bookUrl,
                "",
                "Reply STOP by email if you want outreach paused.",
              ].join("\n")
            : [
                "HenryCo Care check-in",
                `Hello ${customerName},`,
                "",
                "This is a light follow-up in case you want another pickup or service slot.",
                bookUrl,
                "",
                "Reply STOP by email if you want outreach paused.",
              ].join("\n"),
        metadata: {
          sourceKind:
            campaign === "service_reminder"
              ? "marketing_service_reminder"
              : "marketing_reengagement",
          sourceId: booking.id,
          sourceLabel: trackingCode,
          conversationPolicy: "business_initiated",
        },
      });

      await writeAutomationLog({
        eventType: `${campaign}_whatsapp_${whatsapp.status}`,
        success: whatsapp.status === "sent",
        email,
        details: {
          dedupe_key: `${dedupeKey}:whatsapp`,
          booking_id: booking.id,
          tracking_code: trackingCode,
          whatsapp_status: whatsapp.status,
          whatsapp_reason: whatsapp.reason,
        },
      });

      if (whatsapp.status === "sent") {
        whatsappSent += 1;
      }
    }
  }

  return {
    serviceRemindersSent,
    reengagementSent,
    whatsappSent,
    skipped,
  };
}

export async function runCareAutomationSweep(now = new Date()): Promise<AutomationRunSummary> {
  try {
    const settings = await getCareSettings();
    const dataset = await getAutomationDataset();

    const [ownerSummariesSent, ownerAlerts, paymentRemindersSent, nurture] = await Promise.all([
      sendOwnerMonthlySummary(now, dataset),
      sendOwnerOperationalAlerts(now),
      sendPaymentReminders(now, settings, dataset),
      sendMarketingNurture(now, dataset),
    ]);

    const summary = {
      ownerSummariesSent,
      ownerAlertEmailsSent: ownerAlerts.ownerAlertEmailsSent,
      ownerAlertWhatsAppSent: ownerAlerts.ownerAlertWhatsAppSent,
      ownerDigestsSent: ownerAlerts.ownerDigestsSent,
      paymentRemindersSent,
      serviceRemindersSent: nurture.serviceRemindersSent,
      reengagementSent: nurture.reengagementSent,
      whatsappSent: nurture.whatsappSent,
      skipped: nurture.skipped,
    } satisfies AutomationRunSummary;

    await writeAutomationLog({
      eventType: "automation_sweep_completed",
      success: true,
      details: {
        run_at: now.toISOString(),
        ...summary,
      },
    });

    return summary;
  } catch (error) {
    await writeAutomationLog({
      eventType: "automation_sweep_failed",
      success: false,
      details: {
        run_at: now.toISOString(),
        reason: error instanceof Error ? error.message : "Automation sweep failed.",
      },
    });
    throw error;
  }
}
