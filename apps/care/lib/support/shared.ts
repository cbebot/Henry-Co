export const SUPPORT_THREAD_STATUSES = [
  "new",
  "open",
  "pending_customer",
  "resolved",
] as const;

export type SupportThreadStatus = (typeof SUPPORT_THREAD_STATUSES)[number];

export const SUPPORT_CONTACT_METHODS = [
  "email",
  "phone",
  "whatsapp",
  "any",
] as const;

export type SupportContactMethod = (typeof SUPPORT_CONTACT_METHODS)[number];

export const SUPPORT_SERVICE_CATEGORIES = [
  "general",
  "garment_care",
  "home_cleaning",
  "office_cleaning",
  "pickup_delivery",
  "billing_payment",
  "recurring_plan",
] as const;

export type SupportServiceCategory = (typeof SUPPORT_SERVICE_CATEGORIES)[number];

export const SUPPORT_URGENCY_LEVELS = [
  "routine",
  "priority",
  "urgent",
] as const;

export type SupportUrgency = (typeof SUPPORT_URGENCY_LEVELS)[number];

const SUPPORT_STATUS_LABELS: Record<SupportThreadStatus, string> = {
  new: "New",
  open: "Open",
  pending_customer: "Pending customer",
  resolved: "Resolved",
};

const SUPPORT_CONTACT_METHOD_LABELS: Record<SupportContactMethod, string> = {
  email: "Email",
  phone: "Phone call",
  whatsapp: "WhatsApp",
  any: "Best available route",
};

const SUPPORT_SERVICE_CATEGORY_LABELS: Record<SupportServiceCategory, string> = {
  general: "General question",
  garment_care: "Garment care",
  home_cleaning: "Home cleaning",
  office_cleaning: "Office cleaning",
  pickup_delivery: "Pickup or delivery",
  billing_payment: "Billing or payment",
  recurring_plan: "Recurring plan",
};

const SUPPORT_URGENCY_LABELS: Record<SupportUrgency, string> = {
  routine: "Routine",
  priority: "Priority",
  urgent: "Urgent",
};

export function isSupportThreadStatus(value: string | null | undefined): value is SupportThreadStatus {
  return SUPPORT_THREAD_STATUSES.includes(String(value || "").trim().toLowerCase() as SupportThreadStatus);
}

export function isSupportContactMethod(value: string | null | undefined): value is SupportContactMethod {
  return SUPPORT_CONTACT_METHODS.includes(String(value || "").trim().toLowerCase() as SupportContactMethod);
}

export function isSupportServiceCategory(value: string | null | undefined): value is SupportServiceCategory {
  return SUPPORT_SERVICE_CATEGORIES.includes(String(value || "").trim().toLowerCase() as SupportServiceCategory);
}

export function isSupportUrgency(value: string | null | undefined): value is SupportUrgency {
  return SUPPORT_URGENCY_LEVELS.includes(String(value || "").trim().toLowerCase() as SupportUrgency);
}

export function normalizeSupportThreadStatus(value: string | null | undefined): SupportThreadStatus {
  const normalized = String(value || "").trim().toLowerCase();
  return isSupportThreadStatus(normalized) ? normalized : "new";
}

export function normalizeSupportContactMethod(value: string | null | undefined): SupportContactMethod {
  const normalized = String(value || "").trim().toLowerCase();
  return isSupportContactMethod(normalized) ? normalized : "email";
}

export function normalizeSupportServiceCategory(value: string | null | undefined): SupportServiceCategory {
  const normalized = String(value || "").trim().toLowerCase();
  return isSupportServiceCategory(normalized) ? normalized : "general";
}

export function normalizeSupportUrgency(value: string | null | undefined): SupportUrgency {
  const normalized = String(value || "").trim().toLowerCase();
  return isSupportUrgency(normalized) ? normalized : "routine";
}

export function formatSupportThreadStatusLabel(status: string | null | undefined) {
  return SUPPORT_STATUS_LABELS[normalizeSupportThreadStatus(status)];
}

export function formatSupportContactMethodLabel(method: string | null | undefined) {
  return SUPPORT_CONTACT_METHOD_LABELS[normalizeSupportContactMethod(method)];
}

export function formatSupportServiceCategoryLabel(category: string | null | undefined) {
  return SUPPORT_SERVICE_CATEGORY_LABELS[normalizeSupportServiceCategory(category)];
}

export function formatSupportUrgencyLabel(urgency: string | null | undefined) {
  return SUPPORT_URGENCY_LABELS[normalizeSupportUrgency(urgency)];
}
