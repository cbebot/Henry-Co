"use server";

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { calculateCleaningQuote } from "@/lib/care-catalog";
import { getCareBookingCatalog, getCareSettings } from "@/lib/care-data";
import {
  SERVICE_BOOKING_MARKER,
  formatFrequencyLabel,
  formatUrgencyLabel,
  normalizeCleaningBookingPayload,
  toCleaningQuoteInput,
} from "@/lib/care-booking-shared";
import {
  buildTrackingUrl,
  sendAdminNotificationEmail,
  sendBookingConfirmationEmail,
  sendPaymentRequestEmail,
} from "@/lib/email/send";
import { ensureCareBookingAccountLink } from "@/lib/account-linking";
import {
  ensureBookingPaymentRequest,
  markPaymentRequestDeliveryState,
} from "@/lib/payments/verification";
import { notifyStaffRoles } from "@/lib/staff-alerts";
import { sendWhatsAppText } from "@/lib/support/whatsapp";
import { createSupabaseServer } from "@/lib/supabase/server";
import { normalizeEmail, normalizePhone } from "@henryco/config";

type TreatmentType = "standard" | "stain" | "deep_stain" | "delicate";
type PaymentPlan = "book_first" | "pay_now";

type SelectedBookingItem = {
  pricing_id: string;
  quantity: number;
  urgent?: boolean;
  treatment?: TreatmentType | string;
};

type OrderItemInsertPayload = {
  booking_id: string;
  pricing_id: string;
  pricing_category: string;
  pricing_item_name: string;
  pricing_unit: string;
  garment_type: string;
  service_type: string | null;
  quantity: number;
  urgent: boolean;
  treatment: TreatmentType;
  unit_price_snapshot: number;
  urgent_fee_snapshot: number;
  line_total: number;
  notes: string | null;
};

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error("Missing Supabase admin env vars.");
  }

  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function asText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function asNullableText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function redirectToTracking(trackingCode: string, phone?: string | null): never {
  const params = new URLSearchParams();
  params.set("code", trackingCode);
  params.set("booked", "1");

  const contactPhone = String(phone || "").trim();
  if (contactPhone) {
    params.set("phone", contactPhone);
  }

  redirect(`/track?${params.toString()}`);
}

function normalizeTreatment(value: string): TreatmentType {
  const key = String(value || "").trim().toLowerCase();
  if (key === "stain") return "stain";
  if (key === "deep_stain") return "deep_stain";
  if (key === "delicate") return "delicate";
  return "standard";
}

function treatmentChargePerUnit(treatment: TreatmentType) {
  if (treatment === "stain") return 500;
  if (treatment === "deep_stain") return 1000;
  if (treatment === "delicate") return 700;
  return 0;
}

function asItemsJson(formData: FormData): SelectedBookingItem[] {
  const raw = String(formData.get("selected_items_json") ?? "").trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((row) => ({
        pricing_id: String(row?.pricing_id ?? "").trim(),
        quantity: Math.max(1, Number(row?.quantity ?? 1)),
        urgent: Boolean(row?.urgent),
        treatment: normalizeTreatment(String(row?.treatment ?? "standard")),
      }))
      .filter((row) => row.pricing_id);
  } catch {
    return [];
  }
}

function parsePaymentPlan(formData: FormData): PaymentPlan {
  return asText(formData, "payment_plan") === "pay_now" ? "pay_now" : "book_first";
}

function paymentPlanLabel(paymentPlan: PaymentPlan) {
  return paymentPlan === "pay_now" ? "Pay now" : "Book first";
}

function paymentPlanSpecialInstruction(paymentPlan: PaymentPlan) {
  return paymentPlan === "pay_now"
    ? "Payment path: customer chose to pay immediately after booking submission."
    : "Payment path: customer chose to book first and pay after confirmation.";
}

function summarizeWhatsAppSupport(settings: Awaited<ReturnType<typeof getCareSettings>>) {
  return [settings.payment_support_whatsapp, settings.payment_support_email]
    .filter(Boolean)
    .join(" • ");
}

async function logBookingWhatsAppDelivery(
  supabase: ReturnType<typeof getAdminSupabase>,
  input: {
    eventBase: string;
    bookingId: string;
    trackingCode: string;
    recipientEmail?: string | null;
    recipientPhone?: string | null;
    result: Awaited<ReturnType<typeof sendWhatsAppText>>;
  }
) {
  try {
    await supabase.from("care_security_logs").insert({
      event_type: `${input.eventBase}_${input.result.status}`,
      route: "/book",
      email: input.recipientEmail ?? null,
      success: input.result.status === "sent",
      details: {
        booking_id: input.bookingId,
        tracking_code: input.trackingCode,
        recipient_phone: input.recipientPhone ?? null,
        whatsapp_provider: input.result.provider,
        whatsapp_status: input.result.status,
        whatsapp_reason: input.result.reason,
        whatsapp_message_id: input.result.messageId,
        whatsapp_status_code: input.result.statusCode,
        whatsapp_graph_error_code: input.result.graphErrorCode,
        whatsapp_response_summary: input.result.responseSummary,
      },
    } as never);
  } catch {
    // ignore log failure
  }
}

async function sendBookingConfirmationWhatsApp(input: {
  supabase: ReturnType<typeof getAdminSupabase>;
  bookingId: string;
  trackingCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  serviceLabel: string;
  scheduleLabel: string;
  paymentPlan: PaymentPlan;
  trackUrl: string;
  supportLine: string;
}) {
  const paymentMessage =
    input.paymentPlan === "pay_now"
      ? "Your payment instructions have been sent by email. Once payment is made, reply with your receipt so the team can confirm the booking quickly."
      : "We have emailed the payment details for whenever you are ready to confirm the booking.";

  const supportMessage = input.supportLine
    ? `Need help? Reach us through ${input.supportLine}.`
    : "Reply to your email confirmation if anything about the schedule or address needs to change.";

  const result = await sendWhatsAppText({
    phone: input.customerPhone,
    body: [
      `HenryCo Care booking • ${input.trackingCode}`,
      `Hello ${input.customerName},`,
      "",
      "Your booking has been received.",
      `Service: ${input.serviceLabel}`,
      `Schedule: ${input.scheduleLabel}`,
      `Payment path: ${paymentPlanLabel(input.paymentPlan)}`,
      "",
      paymentMessage,
      "",
      `Track your booking: ${input.trackUrl}`,
      supportMessage,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  await logBookingWhatsAppDelivery(input.supabase, {
    eventBase: "booking_confirmation_whatsapp",
    bookingId: input.bookingId,
    trackingCode: input.trackingCode,
    recipientEmail: input.customerEmail,
    recipientPhone: input.customerPhone,
    result,
  });

  return result;
}

function parseServicePayload(formData: FormData) {
  const raw = asText(formData, "service_booking_json");
  if (!raw) return null;

  try {
    return normalizeCleaningBookingPayload(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function generateTrackingCode() {
  const supabase = getAdminSupabase();

  for (let i = 0; i < 10; i++) {
    const code = `TRK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

    const { data } = await supabase
      .from("care_bookings")
      .select("id")
      .eq("tracking_code", code)
      .maybeSingle();

    if (!data?.id) return code;
  }

  return `TRK-${Date.now()}`;
}

async function getAuthenticatedCustomerProjection(
  supabase: ReturnType<typeof getAdminSupabase>
) {
  const accountSupabase = await createSupabaseServer();
  const {
    data: { user },
  } = await accountSupabase.auth.getUser();

  if (!user?.id) {
    return {
      user: null,
      profile: null,
    };
  }

  const { data: profile } = await supabase
    .from("customer_profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user,
    profile: profile ?? null,
  };
}

async function insertOrderItemWithFallback(
  supabase: ReturnType<typeof getAdminSupabase>,
  payload: OrderItemInsertPayload
) {
  const modernAttempt = await supabase.from("care_order_items").insert({
    booking_id: payload.booking_id,
    pricing_id: payload.pricing_id,
    pricing_category: payload.pricing_category,
    pricing_item_name: payload.pricing_item_name,
    pricing_unit: payload.pricing_unit,
    garment_type: payload.garment_type,
    service_type: payload.service_type,
    quantity: payload.quantity,
    urgent: payload.urgent,
    intake_status: "received",
    notes: payload.notes,
    created_by: null,
    unit_price_snapshot: payload.unit_price_snapshot,
    urgent_fee_snapshot: payload.urgent_fee_snapshot,
    line_total: payload.line_total,
  } as never);

  if (!modernAttempt.error) {
    return { error: null };
  }

  const fallbackAttempt = await supabase.from("care_order_items").insert({
    booking_id: payload.booking_id,
    garment_type: payload.garment_type,
    service_type: payload.service_type,
    quantity: payload.quantity,
    urgent: payload.urgent,
    notes: payload.notes,
    created_by: null,
  } as never);

  return { error: fallbackAttempt.error };
}

async function recalculateBookingTotals(
  supabase: ReturnType<typeof getAdminSupabase>,
  bookingId: string
) {
  try {
    await supabase.rpc("care_recalculate_booking_totals", {
      p_booking_id: bookingId,
    });
  } catch {
    // ignore recalculation failures; booking creation still succeeds
  }
}

function buildServiceSummary(input: {
  categoryLabel: string;
  serviceLabel: string;
  frequencyLabel: string;
  urgencyLabel: string;
  zoneLabel: string | null;
  addOnLabels: string[];
  preferredDays: string[];
  preferredStartDate: string | null;
  serviceWindow: string | null;
  propertyLabel: string | null;
  siteContactName: string | null;
  quoteSummary: string[];
}) {
  const parts = [
    SERVICE_BOOKING_MARKER,
    input.categoryLabel,
    input.serviceLabel,
    `Frequency: ${input.frequencyLabel}`,
    `Urgency: ${input.urgencyLabel}`,
    input.zoneLabel ? `Zone: ${input.zoneLabel}` : null,
    input.addOnLabels.length > 0 ? `Add-ons: ${input.addOnLabels.join(", ")}` : null,
    input.preferredDays.length > 0 ? `Preferred days: ${input.preferredDays.join(", ")}` : null,
    input.preferredStartDate ? `Plan start: ${input.preferredStartDate}` : null,
    input.serviceWindow ? `Window: ${input.serviceWindow}` : null,
    input.propertyLabel ? `Property: ${input.propertyLabel}` : null,
    input.siteContactName ? `Site contact: ${input.siteContactName}` : null,
    ...input.quoteSummary,
  ].filter(Boolean);

  return parts.join(" | ");
}

export async function createPublicBookingAction(formData: FormData) {
  const supabase = getAdminSupabase();
  const authenticatedCustomer = await getAuthenticatedCustomerProjection(supabase);

  const bookingMode = asText(formData, "booking_mode") === "service" ? "service" : "garment";
  const customer_name =
    asText(formData, "customer_name") ||
    String(authenticatedCustomer.profile?.full_name || "").trim() ||
    String(authenticatedCustomer.user?.user_metadata?.full_name || "").trim() ||
    String(authenticatedCustomer.user?.user_metadata?.name || "").trim();
  const email =
    normalizeEmail(asNullableText(formData, "email")) ||
    normalizeEmail(authenticatedCustomer.user?.email ?? null);
  const phone =
    asText(formData, "phone") || String(authenticatedCustomer.profile?.phone || "").trim();
  const phone_normalized = normalizePhone(phone);
  const pickup_address = asText(formData, "pickup_address");
  const return_address = asNullableText(formData, "return_address");
  const pickup_date = asNullableText(formData, "pickup_date");
  const pickup_slot = asNullableText(formData, "pickup_slot");
  const rawSpecialInstructions = asNullableText(formData, "special_instructions");
  const paymentPlan = parsePaymentPlan(formData);

  if (!customer_name || !phone || !pickup_address || !pickup_date || !pickup_slot) {
    redirect("/book?error=Please complete all required booking fields.");
  }
  if (bookingMode === "garment" && !String(return_address || "").trim()) {
    redirect("/book?error=Please provide a return address for delivery completion.");
  }

  if (!phone_normalized) {
    redirect("/book?error=Phone number could not be normalized.");
  }

  if (bookingMode === "service") {
    const servicePayload = parseServicePayload(formData);
    if (!servicePayload) {
      redirect("/book?error=Service details are missing or invalid.");
    }

    const catalog = await getCareBookingCatalog();
    const serviceType = catalog.serviceTypes.find(
      (item) =>
        item.key === servicePayload.serviceTypeKey &&
        item.category_key === servicePayload.categoryKey &&
        item.is_active
    );

    if (!serviceType) {
      redirect("/book?error=The selected service type is no longer available.");
    }

    const selectedPackage =
      catalog.packages.find(
        (item) =>
          item.slug === servicePayload.packageSlug &&
          item.category_key === servicePayload.categoryKey &&
          item.is_active
      ) ?? null;

    const selectedZone =
      catalog.zones.find((item) => item.key === servicePayload.zoneKey && item.is_active) ?? null;

    const selectedAddOns = catalog.addOns.filter(
      (item) =>
        item.category_key === servicePayload.categoryKey &&
        item.is_active &&
        (servicePayload.addonKeys ?? []).includes(item.key)
    );

    const quoteInput = toCleaningQuoteInput(servicePayload);
    const quote = calculateCleaningQuote(quoteInput, catalog);
    const noUrgencyQuote = calculateCleaningQuote(
      {
        ...quoteInput,
        urgencyKey: "standard",
      },
      catalog
    );

    const categoryLabel =
      servicePayload.categoryKey === "office" ? "Office Cleaning" : "Home Cleaning";
    const serviceLabel = selectedPackage?.name ?? serviceType.name;
    const frequencyLabel = formatFrequencyLabel(servicePayload.frequencyKey);
    const urgencyLabel = formatUrgencyLabel(servicePayload.urgencyKey);
    const quoted_urgent_fee = Math.max(0, quote.total - noUrgencyQuote.total);
    const item_summary = buildServiceSummary({
      categoryLabel,
      serviceLabel,
      frequencyLabel,
      urgencyLabel,
      zoneLabel: selectedZone?.name ?? null,
      addOnLabels: selectedAddOns.map((item) => item.label),
      preferredDays: servicePayload.preferredDays ?? [],
      preferredStartDate: servicePayload.preferredStartDate ?? null,
      serviceWindow: servicePayload.serviceWindow ?? pickup_slot,
      propertyLabel: servicePayload.propertyLabel ?? null,
      siteContactName: servicePayload.siteContactName ?? null,
      quoteSummary: quote.summary,
    });

    const special_instructions =
      [
        rawSpecialInstructions,
        paymentPlanSpecialInstruction(paymentPlan),
        return_address ? `Return address: ${return_address}` : null,
        servicePayload.propertyLabel ? `Property label: ${servicePayload.propertyLabel}` : null,
        servicePayload.siteContactName ? `Site contact: ${servicePayload.siteContactName}` : null,
      ]
        .filter(Boolean)
        .join(" | ") || null;

    const tracking_code = await generateTrackingCode();
    const bookingPayload = {
      tracking_code,
      customer_name,
      email,
      phone,
      phone_normalized,
      service_type: `${categoryLabel} • ${serviceLabel}`,
      item_summary,
      pickup_address,
      pickup_date,
      pickup_slot,
      special_instructions,
      status: "booked",
      quoted_subtotal: quote.basePrice,
      quoted_urgent_fee,
      quoted_total: quote.total,
      amount_paid: 0,
      balance_due: quote.total,
      payment_status: "unpaid",
    };

    const bookingResult = await supabase
      .from("care_bookings")
      .insert(bookingPayload as never)
      .select("id, tracking_code")
      .maybeSingle();

    if (bookingResult.error || !bookingResult.data?.id) {
      redirect(
        `/book?error=${encodeURIComponent(
          `Service booking could not be created: ${bookingResult.error?.message || "Unknown error"}`
        )}`
      );
    }

    await supabase.from("care_security_logs").insert({
      event_type: "public_service_booking_created",
      route: "/book",
      success: true,
        details: {
          booking_id: bookingResult.data.id,
          tracking_code: bookingResult.data.tracking_code,
          account_user_id: authenticatedCustomer.user?.id ?? null,
          category_key: servicePayload.categoryKey,
          service_type_key: servicePayload.serviceTypeKey,
          package_slug: servicePayload.packageSlug ?? null,
          frequency_key: servicePayload.frequencyKey ?? "one_time",
          quote_total: quote.total,
          payment_plan: paymentPlan,
        },
      } as never);

    if (authenticatedCustomer.user?.id) {
      await ensureCareBookingAccountLink({
        userId: authenticatedCustomer.user.id,
        email,
        fullName: customer_name,
        phone,
        source: "authenticated_booking",
        booking: {
          id: bookingResult.data.id,
          tracking_code: bookingResult.data.tracking_code,
          customer_name,
          service_type: `${categoryLabel} • ${serviceLabel}`,
          pickup_date,
          pickup_slot: servicePayload.serviceWindow ?? pickup_slot,
          status: "booked",
          balance_due: quote.total,
        },
      });
    }

    const settings = await getCareSettings();
    const trackUrl = await buildTrackingUrl(bookingResult.data.tracking_code, phone);
    const paymentSupportLine = summarizeWhatsAppSupport(settings);

    if (email) {
      const paymentRequest = await ensureBookingPaymentRequest({
        bookingId: bookingResult.data.id,
        requestKind: "booking_payment_request",
        recipientEmail: email,
      });

      await sendBookingConfirmationEmail(email, bookingResult.data.id, {
        customerName: customer_name,
        trackingCode: bookingResult.data.tracking_code,
        serviceFamilyLabel: categoryLabel,
        serviceType: serviceLabel,
        pickupDate: pickup_date,
        serviceWindow: servicePayload.serviceWindow ?? pickup_slot,
        addressSummary: pickup_address,
        orderSummary: item_summary,
        trackUrl,
        nextSteps:
          paymentPlan === "pay_now"
            ? [
                "Use the payment email immediately to complete transfer with the tracking code as your reference.",
                "Reply to that same email with your receipt so support can confirm payment and move the booking forward faster.",
                "Keep the tracking code close for schedule updates, visit progress, and support follow-up.",
                "Reply if the address, access instructions, or preferred time window needs adjustment.",
              ]
            : [
                "Keep the tracking code close for schedule updates, visit progress, and support follow-up.",
                "Check the payment email in this same conversation for the account details and amount due.",
                "After making payment, reply to that same email with your receipt so the team can confirm payment and continue the booking.",
                "Reply if the address, access instructions, or preferred time window needs adjustment.",
              ],
      });

      const paymentResult = await sendPaymentRequestEmail(
        email,
        bookingResult.data.id,
        paymentRequest.id,
        {
        customerName: customer_name,
        trackingCode: bookingResult.data.tracking_code,
        amountDue: `₦${quote.total.toLocaleString()}`,
        currencyLabel: settings.payment_currency || "NGN",
        accountName: settings.payment_account_name || settings.company_account_name || "HenryCo Care",
        accountNumber:
          settings.payment_account_number || settings.company_account_number || "Not available",
        bankName: settings.payment_bank_name || settings.company_bank_name || "Not available",
        instructions: [
          paymentPlan === "pay_now"
            ? "Customer selected the pay-now path. Make payment with the tracking code as your transfer reference so the team can confirm it immediately."
            : settings.payment_instructions ||
              "Make payment with the tracking code as your transfer reference.",
          "After making payment, reply to this same email with your receipt so the team can confirm payment and continue your order.",
          paymentSupportLine
            ? `If needed, you may also share the same receipt through ${paymentSupportLine}.`
            : null,
        ]
          .filter(Boolean)
          .join(" "),
        trackUrl,
      });

      await markPaymentRequestDeliveryState({
        requestId: paymentRequest.id,
        deliveryStatus:
          paymentResult.status === "sent"
            ? "sent"
            : paymentResult.status === "failed"
              ? "failed"
              : "queued",
        notificationId: paymentResult.notificationId,
        messageId: paymentResult.messageId,
        reason: paymentResult.reason,
      });
    }

    await sendBookingConfirmationWhatsApp({
      supabase,
      bookingId: bookingResult.data.id,
      trackingCode: bookingResult.data.tracking_code,
      customerName: customer_name,
      customerPhone: phone,
      customerEmail: email,
      serviceLabel: `${categoryLabel} • ${serviceLabel}`,
      scheduleLabel: `${pickup_date || "Date to be confirmed"} • ${servicePayload.serviceWindow ?? pickup_slot ?? "Time window to be confirmed"}`,
      paymentPlan,
      trackUrl,
      supportLine: paymentSupportLine,
    });

    if (settings.support_email) {
      await sendAdminNotificationEmail(settings.support_email, {
        heading: "New public service booking received",
        summary: "A customer just created a new home or office service request through the public booking flow.",
        lines: [
          `Tracking code: ${bookingResult.data.tracking_code}`,
          `Customer: ${customer_name}`,
          `Service: ${categoryLabel} • ${serviceLabel}`,
          `Quoted total: ₦${quote.total.toLocaleString()}`,
          `Payment path: ${paymentPlanLabel(paymentPlan)}`,
        ],
      });
    }

    try {
      await notifyStaffRoles({
        roles: ["support", "manager", "staff"],
        heading: `Service booking alert • ${bookingResult.data.tracking_code}`,
        summary:
          paymentPlan === "pay_now"
            ? "A new service booking entered the queue with immediate payment intent."
            : "A new service booking entered the queue and needs normal operational follow-through.",
        lines: [
          `Customer: ${customer_name}`,
          `Service: ${categoryLabel} • ${serviceLabel}`,
          `Quoted total: ₦${quote.total.toLocaleString()}`,
          `Pickup date: ${pickup_date || "Not provided"}`,
          `Window: ${servicePayload.serviceWindow ?? pickup_slot ?? "Not provided"}`,
          `Payment path: ${paymentPlanLabel(paymentPlan)}`,
          `Tracking code: ${bookingResult.data.tracking_code}`,
        ],
      });
    } catch {
      // booking creation should not fail if internal role-mail fanout is unavailable
    }

    redirectToTracking(bookingResult.data.tracking_code, phone);
  }

  const selectedItems = asItemsJson(formData);

  if (selectedItems.length === 0) {
    redirect("/book?error=Please select at least one garment or care line.");
  }

  const pricingIds = [...new Set(selectedItems.map((item) => item.pricing_id))];

  const { data: pricingRows, error: pricingError } = await supabase
    .from("care_pricing")
    .select("id, category, item_name, unit, price, is_active, description")
    .in("id", pricingIds);

  if (pricingError || !pricingRows || pricingRows.length === 0) {
    redirect("/book?error=Pricing records could not be loaded. Please try again.");
  }

  const pricingMap = new Map(
    pricingRows
      .filter((row) => Boolean((row as Record<string, unknown>).is_active))
      .map((row) => [
        String(row.id),
        {
          id: String(row.id),
          category: String(row.category ?? "").trim(),
          item_name: String(row.item_name ?? "").trim(),
          unit: String(row.unit ?? "item").trim(),
          price: Number(row.price ?? 0),
          description: row.description ? String(row.description) : null,
        },
      ])
  );

  const validItems = selectedItems.filter((item) => pricingMap.has(item.pricing_id));

  if (validItems.length === 0) {
    redirect("/book?error=No valid active pricing items were selected.");
  }

  let quoted_subtotal = 0;
  let quoted_urgent_fee = 0;
  let quoted_total = 0;

  const item_summary = validItems
    .map((item) => {
      const pricing = pricingMap.get(item.pricing_id)!;
      const quantity = Math.max(1, Number(item.quantity || 1));
      const treatment = normalizeTreatment(String(item.treatment || "standard"));
      const baseTotal = quantity * Number(pricing.price || 0);
      const treatmentTotal = treatmentChargePerUnit(treatment) * quantity;
      const urgentTotal = item.urgent ? Math.round(baseTotal * 0.2) : 0;
      const lineTotal = baseTotal + treatmentTotal + urgentTotal;

      quoted_subtotal += baseTotal;
      quoted_urgent_fee += urgentTotal;
      quoted_total += lineTotal;

      return `${pricing.item_name} x${quantity}${item.urgent ? " (urgent)" : ""}${
        treatment !== "standard" ? ` [${treatment.replaceAll("_", " ")}]` : ""
      }`;
    })
    .join(", ");

  const distinctCategories = [
    ...new Set(validItems.map((item) => pricingMap.get(item.pricing_id)?.category).filter(Boolean)),
  ];

  const service_type =
    distinctCategories.length === 1 ? String(distinctCategories[0]) : "Mixed care items";

  const tracking_code = await generateTrackingCode();
  const bookingPayload = {
    tracking_code,
    customer_name,
    email,
    phone,
    phone_normalized,
    service_type,
    item_summary,
    pickup_address,
    pickup_date,
    pickup_slot,
    special_instructions:
      [rawSpecialInstructions, paymentPlanSpecialInstruction(paymentPlan), return_address ? `Return address: ${return_address}` : null]
        .filter(Boolean)
        .join(" | ") || null,
    status: "booked",
    quoted_subtotal,
    quoted_urgent_fee,
    quoted_total,
    amount_paid: 0,
    balance_due: quoted_total,
    payment_status: "unpaid",
  };

  const bookingResult = await supabase
    .from("care_bookings")
    .insert(bookingPayload as never)
    .select("id, tracking_code")
    .maybeSingle();

  if (bookingResult.error || !bookingResult.data?.id) {
    redirect(
      `/book?error=${encodeURIComponent(
        `Booking could not be created: ${bookingResult.error?.message || "Unknown error"}`
      )}`
    );
  }

  const itemErrors: string[] = [];

  for (const item of validItems) {
    const pricing = pricingMap.get(item.pricing_id)!;
    const quantity = Math.max(1, Number(item.quantity || 1));
    const treatment = normalizeTreatment(String(item.treatment || "standard"));
    const baseTotal = quantity * Number(pricing.price || 0);
    const treatmentTotal = treatmentChargePerUnit(treatment) * quantity;
    const urgentTotal = item.urgent ? Math.round(baseTotal * 0.2) : 0;
    const lineTotal = baseTotal + treatmentTotal + urgentTotal;

    const notes = [
      "[public_booking]",
      `[treatment: ${treatment}]`,
      `[base_total: ₦${baseTotal}]`,
      `[treatment_total: ₦${treatmentTotal}]`,
      `[urgent_total: ₦${urgentTotal}]`,
      `[line_total: ₦${lineTotal}]`,
      `[booking_total: ₦${quoted_total}]`,
    ].join(" ");

    const result = await insertOrderItemWithFallback(supabase, {
      booking_id: bookingResult.data.id,
      pricing_id: pricing.id,
      pricing_category: pricing.category,
      pricing_item_name: pricing.item_name,
      pricing_unit: pricing.unit,
      garment_type: pricing.item_name,
      service_type: pricing.category || null,
      quantity,
      urgent: Boolean(item.urgent),
      treatment,
      unit_price_snapshot: Number(pricing.price || 0),
      urgent_fee_snapshot: urgentTotal,
      line_total: lineTotal,
      notes,
    });

    if (result.error) {
      itemErrors.push(result.error.message || "Unknown garment-line save error");
    }
  }

  await recalculateBookingTotals(supabase, bookingResult.data.id);

  if (itemErrors.length > 0) {
    redirect(
      `/book?error=${encodeURIComponent(
        `Booking was created but some garment lines could not be saved: ${itemErrors[0]}`
      )}&tracking=${encodeURIComponent(bookingResult.data.tracking_code)}`
    );
  }

  await supabase.from("care_security_logs").insert({
    event_type: "public_booking_created",
    route: "/book",
    success: true,
    details: {
      booking_id: bookingResult.data.id,
      tracking_code: bookingResult.data.tracking_code,
      account_user_id: authenticatedCustomer.user?.id ?? null,
      booking_mode: "garment",
      line_count: validItems.length,
      quoted_total,
      finance_visibility: "awaiting_payment_record",
      payment_plan: paymentPlan,
    },
  } as never);

  if (authenticatedCustomer.user?.id) {
    await ensureCareBookingAccountLink({
      userId: authenticatedCustomer.user.id,
      email,
      fullName: customer_name,
      phone,
      source: "authenticated_booking",
      booking: {
        id: bookingResult.data.id,
        tracking_code: bookingResult.data.tracking_code,
        customer_name,
        service_type,
        pickup_date,
        pickup_slot,
        status: "booked",
        balance_due: quoted_total,
      },
    });
  }

  const settings = await getCareSettings();
  const trackUrl = await buildTrackingUrl(bookingResult.data.tracking_code, phone);
  const paymentSupportLine = summarizeWhatsAppSupport(settings);

  if (email) {
    const paymentRequest = await ensureBookingPaymentRequest({
      bookingId: bookingResult.data.id,
      requestKind: "booking_payment_request",
      recipientEmail: email,
    });

    await sendBookingConfirmationEmail(email, bookingResult.data.id, {
      customerName: customer_name,
      trackingCode: bookingResult.data.tracking_code,
      serviceFamilyLabel: "Wardrobe care",
      serviceType: service_type,
      pickupDate: pickup_date,
      serviceWindow: pickup_slot,
      addressSummary: pickup_address,
      orderSummary: item_summary,
      trackUrl,
      nextSteps:
        paymentPlan === "pay_now"
          ? [
              "Use the payment email immediately to pay with the tracking code as your transfer reference.",
              "Reply to that same email with your receipt so support can confirm payment before pickup progression.",
              "Keep the tracking code close for pickup, care progress, and return delivery updates.",
              "Reply if the pickup address or collection window needs adjustment.",
            ]
          : [
              "Keep the tracking code close for pickup, care progress, and return delivery updates.",
              "Check the payment email in this same conversation for the account details and amount due.",
              "After payment, reply to that same email with your receipt so the team can confirm payment and continue the booking.",
              "Reply if the pickup address or collection window needs adjustment.",
            ],
    });

    const paymentResult = await sendPaymentRequestEmail(
      email,
      bookingResult.data.id,
      paymentRequest.id,
      {
      customerName: customer_name,
      trackingCode: bookingResult.data.tracking_code,
      amountDue: `₦${quoted_total.toLocaleString()}`,
      currencyLabel: settings.payment_currency || "NGN",
      accountName: settings.payment_account_name || settings.company_account_name || "HenryCo Care",
      accountNumber:
        settings.payment_account_number || settings.company_account_number || "Not available",
      bankName: settings.payment_bank_name || settings.company_bank_name || "Not available",
      instructions: [
        paymentPlan === "pay_now"
          ? "Customer selected the pay-now path. Make payment with the tracking code as your transfer reference so pickup can move faster after verification."
          : settings.payment_instructions ||
            "Make payment with the tracking code as your transfer reference.",
        "After making payment, reply to this same email with your receipt so the team can confirm payment and continue your order.",
        paymentSupportLine
          ? `If needed, you may also share the same receipt through ${paymentSupportLine}.`
          : null,
      ]
        .filter(Boolean)
        .join(" "),
      trackUrl,
    });

    await markPaymentRequestDeliveryState({
      requestId: paymentRequest.id,
      deliveryStatus:
        paymentResult.status === "sent"
          ? "sent"
          : paymentResult.status === "failed"
            ? "failed"
            : "queued",
      notificationId: paymentResult.notificationId,
      messageId: paymentResult.messageId,
      reason: paymentResult.reason,
    });
  }

  await sendBookingConfirmationWhatsApp({
    supabase,
    bookingId: bookingResult.data.id,
    trackingCode: bookingResult.data.tracking_code,
    customerName: customer_name,
    customerPhone: phone,
    customerEmail: email,
    serviceLabel: service_type,
    scheduleLabel: `${pickup_date || "Date to be confirmed"} • ${pickup_slot || "Time window to be confirmed"}`,
    paymentPlan,
    trackUrl,
    supportLine: paymentSupportLine,
  });

  if (settings.support_email) {
    await sendAdminNotificationEmail(settings.support_email, {
      heading: "New public garment booking received",
      summary: "A wardrobe-care booking has just entered the public intake queue.",
      lines: [
        `Tracking code: ${bookingResult.data.tracking_code}`,
        `Customer: ${customer_name}`,
        `Service type: ${service_type}`,
        `Quoted total: ₦${quoted_total.toLocaleString()}`,
        `Payment path: ${paymentPlanLabel(paymentPlan)}`,
      ],
    });
  }

  try {
    await notifyStaffRoles({
      roles: ["support", "manager", "rider"],
      heading: `Garment booking alert • ${bookingResult.data.tracking_code}`,
      summary:
        paymentPlan === "pay_now"
          ? "A new garment booking entered the queue with immediate payment intent."
          : "A new garment booking entered the queue for standard pickup follow-through.",
      lines: [
        `Customer: ${customer_name}`,
        `Service type: ${service_type}`,
        `Quoted total: ₦${quoted_total.toLocaleString()}`,
        `Pickup date: ${pickup_date || "Not provided"}`,
        `Window: ${pickup_slot || "Not provided"}`,
        `Payment path: ${paymentPlanLabel(paymentPlan)}`,
        `Tracking code: ${bookingResult.data.tracking_code}`,
      ],
    });
  } catch {
    // booking creation should not fail if internal role-mail fanout is unavailable
  }

  redirectToTracking(bookingResult.data.tracking_code, phone);
}
