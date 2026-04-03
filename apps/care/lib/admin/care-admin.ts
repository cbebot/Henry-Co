/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";

import { createClient } from "@supabase/supabase-js";
import {
  applyEffectiveBookingStatuses,
  applyReviewMedia,
} from "@/lib/care-runtime-overrides";
import { getOptionalEnv } from "@/lib/env";

export type AdminBookingRow = {
  id: string;
  tracking_code: string;
  customer_name: string;
  phone: string | null;
  email: string | null;
  service_type: string;
  item_summary: string | null;
  pickup_address: string;
  pickup_date: string | null;
  pickup_slot: string | null;
  special_instructions: string | null;
  status: string;
  quoted_total?: number | null;
  balance_due?: number | null;
  payment_status?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type AdminPricingRow = {
  id: string;
  category: string;
  item_name: string;
  description: string | null;
  unit: string;
  price: number;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at?: string | null;
};

export type AdminReviewRow = {
  id: string;
  customer_name: string;
  city: string | null;
  rating: number;
  review_text: string;
  is_approved: boolean;
  created_at: string;
  photo_url?: string | null;
  photo_public_id?: string | null;
};

export type AdminSettingRow = {
  hero_badge: string;
  hero_title: string;
  hero_subtitle: string;
  about_title: string;
  about_body: string;
  pickup_hours: string | null;
  pricing_note: string | null;
  support_email: string | null;
  support_phone: string | null;
  logo_url?: string | null;
  favicon_url?: string | null;
  hero_image_url?: string | null;
  promo_video_url?: string | null;
  promo_video_title?: string | null;
  promo_video_body?: string | null;
  public_site_url?: string | null;
  care_domain?: string | null;
  hub_domain?: string | null;
  company_account_name?: string | null;
  company_account_number?: string | null;
  company_bank_name?: string | null;
  payment_instructions?: string | null;
  payment_whatsapp?: string | null;
  payment_support_email?: string | null;
  payment_support_whatsapp?: string | null;
  payment_currency?: string | null;
  notification_sender_name?: string | null;
  notification_reply_to_email?: string | null;
  picked_up_email_subject?: string | null;
  picked_up_email_body?: string | null;
};

export type AdminOrderItemRow = {
  id: string;
  booking_id: string;
  item_tag: string;
  garment_type: string;
  service_type: string | null;
  brand: string | null;
  color: string | null;
  quantity: number;
  urgent: boolean;
  intake_status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  pricing_id?: string | null;
  unit_price?: number | null;
  line_total?: number | null;
  pricing_snapshot?: Record<string, unknown> | null;
  booking?: {
    tracking_code: string;
    customer_name: string;
    phone: string | null;
    pickup_date: string | null;
    pickup_slot: string | null;
    status: string;
    pickup_address: string;
  } | null;
};

export type AdminPaymentRow = {
  id: string;
  booking_id: string | null;
  payment_no: string;
  amount: number;
  payment_method: string;
  reference: string | null;
  notes: string | null;
  received_by: string | null;
  created_at: string;
  booking?: {
    tracking_code: string;
    customer_name: string;
    status: string;
  } | null;
};

export type AdminExpenseRow = {
  id: string;
  expense_no: string;
  expense_date: string;
  category: string;
  vendor: string | null;
  description: string;
  amount: number;
  payment_method: string | null;
  receipt_url: string | null;
  created_by: string | null;
  approved_by: string | null;
  approval_status: string;
  created_at: string;
};

export type SecurityLogRow = {
  id: string;
  event_type: string;
  route: string | null;
  user_id: string | null;
  role: string | null;
  actor_user_id: string | null;
  actor_role: string | null;
  email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  country: string | null;
  city: string | null;
  success: boolean;
  details: Record<string, unknown> | null;
  created_at: string;
};

export type FinanceSummaryRow = {
  total_inflow: number;
  total_outflow: number;
  balance: number;
};

type Scope = "active" | "archive" | "all";

function getAdminSupabase() {
  const url = getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRole = getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRole) {
    throw new Error("Missing Supabase admin env vars.");
  }

  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function isArchived(createdAt?: string | null) {
  if (!createdAt) return false;
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return false;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  return d < cutoff;
}

function applyScope<T extends { created_at?: string | null }>(rows: T[], scope: Scope = "active") {
  if (scope === "all") return rows;
  if (scope === "archive") return rows.filter((row) => isArchived(row.created_at));
  return rows.filter((row) => !isArchived(row.created_at));
}

function matchesQuery(value: unknown, q: string) {
  if (!q) return true;
  return JSON.stringify(value).toLowerCase().includes(q.toLowerCase());
}

function rangeFrom(limit: number, offset = 0) {
  return { from: offset, to: offset + limit - 1 };
}

export async function getAdminBookings(opts?: {
  scope?: Scope;
  q?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<AdminBookingRow[]> {
  const scope = opts?.scope ?? "active";
  const q = String(opts?.q || "").trim();
  const status = String(opts?.status || "").trim().toLowerCase();
  const limit = opts?.limit ?? 500;
  const offset = opts?.offset ?? 0;
  const { from, to } = rangeFrom(limit, offset);

  try {
    const supabase = getAdminSupabase();
    const { data } = await supabase
      .from("care_bookings")
      .select(
        "id, tracking_code, customer_name, phone, email, service_type, item_summary, pickup_address, pickup_date, pickup_slot, special_instructions, status, quoted_total, balance_due, payment_status, created_at, updated_at"
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    let rows = (data || []) as AdminBookingRow[];

    if (status) {
      rows = rows.filter((row) => String(row.status || "").toLowerCase() === status);
    }

    rows = applyScope(rows, scope);

    if (q) {
      rows = rows.filter((row) => matchesQuery(row, q));
    }

    return await applyEffectiveBookingStatuses(rows);
  } catch {
    return [];
  }
}

export async function getUrgentBookings(limit = 10) {
  const rows = await getAdminBookings({ scope: "active", limit: 500 });

  function urgencyScore(row: AdminBookingRow) {
    const status = String(row.status || "").toLowerCase();

    if (status === "out_for_delivery") return 100;
    if (status === "booked" || status === "confirmed") {
      if (!row.pickup_date) return 40;
      const today = new Date();
      const pickup = new Date(row.pickup_date);
      today.setHours(0, 0, 0, 0);
      pickup.setHours(0, 0, 0, 0);

      const diff = Math.round((pickup.getTime() - today.getTime()) / 86400000);
      if (diff < 0) return 95;
      if (diff === 0) return 90;
      if (diff === 1) return 80;
      if (diff <= 3) return 60;
    }

    if (status === "picked_up") return 50;
    if (status === "quality_check") return 55;
    return 10;
  }

  return [...rows].sort((a, b) => urgencyScore(b) - urgencyScore(a)).slice(0, limit);
}

export async function getAdminPricing(): Promise<AdminPricingRow[]> {
  try {
    const supabase = getAdminSupabase();
    const { data } = await supabase
      .from("care_pricing")
      .select("id, category, item_name, description, unit, price, is_featured, is_active, sort_order, created_at")
      .order("sort_order", { ascending: true });

    return ((data || []) as any[]).map((row) => ({
      ...row,
      price: Number(row.price ?? 0),
      is_featured: Boolean(row.is_featured),
      is_active: Boolean(row.is_active),
      sort_order: Number(row.sort_order ?? 100),
    }));
  } catch {
    return [];
  }
}

export async function getAdminReviews(limit = 100): Promise<AdminReviewRow[]> {
  try {
    const supabase = getAdminSupabase();
    const { data } = await supabase
      .from("care_reviews")
      .select("id, customer_name, city, rating, review_text, is_approved, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    return await applyReviewMedia((data || []) as AdminReviewRow[]);
  } catch {
    return [];
  }
}

export async function getAdminSettings(): Promise<AdminSettingRow | null> {
  try {
    const supabase = getAdminSupabase();

    const extended = await supabase
      .from("care_settings")
      .select(
        "hero_badge, hero_title, hero_subtitle, about_title, about_body, pickup_hours, pricing_note, support_email, support_phone, logo_url, favicon_url, hero_image_url, promo_video_url, promo_video_title, promo_video_body, public_site_url, care_domain, hub_domain, company_account_name, company_account_number, company_bank_name, payment_instructions, payment_whatsapp, payment_support_email, payment_support_whatsapp, payment_currency, notification_sender_name, notification_reply_to_email, picked_up_email_subject, picked_up_email_body"
      )
      .limit(1)
      .maybeSingle();

    if (!extended.error) {
      return (extended.data || null) as AdminSettingRow | null;
    }

    const fallback = await supabase
      .from("care_settings")
      .select(
        "hero_badge, hero_title, hero_subtitle, about_title, about_body, pickup_hours, pricing_note, support_email, support_phone, logo_url, favicon_url, hero_image_url, promo_video_url"
      )
      .limit(1)
      .maybeSingle();

    return (fallback.data || null) as AdminSettingRow | null;
  } catch {
    return null;
  }
}

export async function getOrderItems(opts?: {
  scope?: Scope;
  q?: string;
  urgentOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<AdminOrderItemRow[]> {
  const scope = opts?.scope ?? "active";
  const q = String(opts?.q || "").trim();
  const urgentOnly = Boolean(opts?.urgentOnly);
  const limit = opts?.limit ?? 500;
  const offset = opts?.offset ?? 0;
  const { from, to } = rangeFrom(limit, offset);

  try {
    const supabase = getAdminSupabase();

    const extended = await supabase
      .from("care_order_items")
      .select(
        "id, booking_id, item_tag, garment_type, service_type, brand, color, quantity, urgent, intake_status, notes, created_by, created_at, pricing_id, unit_price, line_total, pricing_snapshot, booking:care_bookings(tracking_code, customer_name, phone, pickup_date, pickup_slot, status, pickup_address)"
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    let rows: AdminOrderItemRow[] = [];

    if (!extended.error) {
      rows = ((extended.data || []) as any[]).map((row) => ({
        ...row,
        quantity: Number(row.quantity ?? 0),
        unit_price: row.unit_price == null ? null : Number(row.unit_price ?? 0),
        line_total: row.line_total == null ? null : Number(row.line_total ?? 0),
      })) as AdminOrderItemRow[];
    } else {
      const fallback = await supabase
        .from("care_order_items")
        .select(
          "id, booking_id, item_tag, garment_type, service_type, brand, color, quantity, urgent, intake_status, notes, created_by, created_at, booking:care_bookings(tracking_code, customer_name, phone, pickup_date, pickup_slot, status, pickup_address)"
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      rows = ((fallback.data || []) as any[]).map((row) => ({
        ...row,
        quantity: Number(row.quantity ?? 0),
      })) as AdminOrderItemRow[];
    }

    rows = applyScope(rows, scope);

    if (urgentOnly) {
      rows = rows.filter((row) => Boolean(row.urgent));
    }

    if (q) {
      rows = rows.filter((row) => matchesQuery(row, q));
    }

    return rows;
  } catch {
    return [];
  }
}

export async function getPayments(opts?: {
  scope?: Scope;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<AdminPaymentRow[]> {
  const scope = opts?.scope ?? "active";
  const q = String(opts?.q || "").trim();
  const limit = opts?.limit ?? 500;
  const offset = opts?.offset ?? 0;
  const { from, to } = rangeFrom(limit, offset);

  try {
    const supabase = getAdminSupabase();
    const { data } = await supabase
      .from("care_payments")
      .select(
        "id, booking_id, payment_no, amount, payment_method, reference, notes, received_by, created_at, booking:care_bookings(tracking_code, customer_name, status)"
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    let rows = ((data || []) as any[]).map((row) => ({
      ...row,
      amount: Number(row.amount ?? 0),
    })) as AdminPaymentRow[];

    rows = applyScope(rows, scope);

    if (q) {
      rows = rows.filter((row) => matchesQuery(row, q));
    }

    return rows;
  } catch {
    return [];
  }
}

export async function getExpenses(opts?: {
  scope?: Scope;
  q?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<AdminExpenseRow[]> {
  const scope = opts?.scope ?? "active";
  const q = String(opts?.q || "").trim();
  const status = String(opts?.status || "").trim().toLowerCase();
  const limit = opts?.limit ?? 500;
  const offset = opts?.offset ?? 0;
  const { from, to } = rangeFrom(limit, offset);

  try {
    const supabase = getAdminSupabase();
    const { data } = await supabase
      .from("care_expenses")
      .select(
        "id, expense_no, expense_date, category, vendor, description, amount, payment_method, receipt_url, created_by, approved_by, approval_status, created_at"
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    let rows = ((data || []) as any[]).map((row) => ({
      ...row,
      amount: Number(row.amount ?? 0),
    })) as AdminExpenseRow[];

    rows = applyScope(rows, scope);

    if (status) {
      rows = rows.filter((row) => String(row.approval_status || "").toLowerCase() === status);
    }

    if (q) {
      rows = rows.filter((row) => matchesQuery(row, q));
    }

    return rows;
  } catch {
    return [];
  }
}

export async function getFinanceRows(opts?: {
  scope?: Scope;
  q?: string;
  limit?: number;
  offset?: number;
}) {
  const scope = opts?.scope ?? "active";
  const q = String(opts?.q || "").trim();
  const limit = opts?.limit ?? 500;
  const offset = opts?.offset ?? 0;
  const { from, to } = rangeFrom(limit, offset);

  try {
    const supabase = getAdminSupabase();
    const { data } = await supabase
      .from("care_finance_ledger")
      .select("id, entry_type, source_table, source_id, booking_id, direction, amount, narration, created_at")
      .order("created_at", { ascending: false })
      .range(from, to);

    let rows = ((data || []) as any[]).map((row) => ({
      ...row,
      amount: Number(row.amount ?? 0),
    }));

    rows = applyScope(rows, scope);

    if (q) {
      rows = rows.filter((row) => matchesQuery(row, q));
    }

    return rows;
  } catch {
    return [];
  }
}

export async function getFinanceSummary(): Promise<FinanceSummaryRow> {
  try {
    const supabase = getAdminSupabase();

    const { data: summaryRow } = await supabase
      .from("care_finance_summary")
      .select("total_inflow, total_outflow, balance")
      .maybeSingle();

    if (summaryRow) {
      return {
        total_inflow: Number((summaryRow as any).total_inflow ?? 0),
        total_outflow: Number((summaryRow as any).total_outflow ?? 0),
        balance: Number((summaryRow as any).balance ?? 0),
      };
    }

    const { data } = await supabase
      .from("care_finance_ledger")
      .select("direction, amount");

    const rows = (data || []) as any[];
    const total_inflow = rows
      .filter((row) => row.direction === "inflow")
      .reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
    const total_outflow = rows
      .filter((row) => row.direction === "outflow")
      .reduce((sum, row) => sum + Number(row.amount ?? 0), 0);

    return {
      total_inflow,
      total_outflow,
      balance: total_inflow - total_outflow,
    };
  } catch {
    return {
      total_inflow: 0,
      total_outflow: 0,
      balance: 0,
    };
  }
}

export async function getSecurityLogs(opts?: {
  q?: string;
  success?: "all" | "success" | "failed";
  limit?: number;
}): Promise<SecurityLogRow[]> {
  const q = String(opts?.q || "").trim();
  const success = opts?.success ?? "all";
  const limit = opts?.limit ?? 150;

  try {
    const supabase = getAdminSupabase();
    const { data } = await supabase
      .from("care_security_logs")
      .select(
        "id, event_type, route, user_id, role, email, ip_address, user_agent, country, city, success, details, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    let rows = ((data || []) as any[]).map((row) => {
      const details =
        row.details && typeof row.details === "object" && !Array.isArray(row.details)
          ? (row.details as Record<string, unknown>)
          : null;

      return {
        ...row,
        details,
        actor_user_id:
          typeof details?.actor_user_id === "string"
            ? details.actor_user_id
            : row.user_id ?? null,
        actor_role:
          typeof details?.actor_role === "string"
            ? details.actor_role
            : row.role ?? null,
      } satisfies SecurityLogRow;
    });

    if (success === "success") {
      rows = rows.filter((row) => row.success);
    } else if (success === "failed") {
      rows = rows.filter((row) => !row.success);
    }

    if (q) {
      rows = rows.filter((row) => matchesQuery(row, q));
    }

    return rows;
  } catch {
    return [];
  }
}

export function monthArchiveNote() {
  return "Records older than 30 days move into archive view automatically for cleaner operations.";
}

export function recentCutoffIso() {
  return daysAgoIso(30);
}
