import { isServiceBookingRecord } from "@/lib/care-booking-shared";

export type CareServiceFamily = "garment" | "home" | "office";

export type CareTrackingIconKey =
  | "calendar"
  | "truck"
  | "package"
  | "sparkles"
  | "clipboard"
  | "shield"
  | "check"
  | "briefcase"
  | "building"
  | "home"
  | "clock"
  | "alert";

export type CareTrackingTone = "amber" | "blue" | "violet" | "emerald" | "red" | "slate";

export type CareTrackingStep = {
  key: string;
  label: string;
  description: string;
  icon: CareTrackingIconKey;
};

export type ServiceSummaryDetails = {
  categoryLabel: string | null;
  serviceLabel: string | null;
  frequencyLabel: string | null;
  urgencyLabel: string | null;
  zoneLabel: string | null;
  preferredDays: string[];
  preferredStartDate: string | null;
  serviceWindow: string | null;
  propertyLabel: string | null;
  siteContactName: string | null;
  addOnLabels: string[];
  highlights: string[];
};

type BookingFamilyInput = {
  service_type?: string | null;
  item_summary?: string | null;
  status?: string | null;
};

const GARMENT_STEPS: CareTrackingStep[] = [
  {
    key: "booked",
    label: "Pickup scheduled",
    description: "The order is booked and waiting for the collection window.",
    icon: "calendar",
  },
  {
    key: "picked_up",
    label: "Picked up",
    description: "A rider has collected the garments from the customer.",
    icon: "truck",
  },
  {
    key: "received_at_facility",
    label: "Received at facility",
    description: "The garments have reached the care facility for intake.",
    icon: "package",
  },
  {
    key: "sorting_tagging",
    label: "Sorting and tagging",
    description: "Pieces are being identified, tagged, and grouped for handling.",
    icon: "clipboard",
  },
  {
    key: "treatment",
    label: "Cleaning and treatment",
    description: "Dry cleaning, washing, and stain treatment are underway.",
    icon: "sparkles",
  },
  {
    key: "pressing_finishing",
    label: "Pressing and finishing",
    description: "Garments are being pressed, shaped, and presentation-finished.",
    icon: "shield",
  },
  {
    key: "quality_check",
    label: "Quality check",
    description: "The final quality review is being completed before packing.",
    icon: "check",
  },
  {
    key: "packed",
    label: "Packed",
    description: "The order has been packed and prepared for return delivery.",
    icon: "package",
  },
  {
    key: "out_for_delivery",
    label: "Out for delivery",
    description: "The rider is moving the finished order back to the customer.",
    icon: "truck",
  },
  {
    key: "delivered",
    label: "Delivered",
    description: "The order has been returned successfully.",
    icon: "check",
  },
];

const HOME_STEPS: CareTrackingStep[] = [
  {
    key: "booked",
    label: "Booking confirmed",
    description: "The service request has been received and opened for planning.",
    icon: "calendar",
  },
  {
    key: "team_scheduled",
    label: "Team scheduled",
    description: "The home-cleaning slot has been scheduled internally.",
    icon: "clock",
  },
  {
    key: "team_assigned",
    label: "Cleaner assigned",
    description: "The cleaner or field team has been attached to the visit.",
    icon: "home",
  },
  {
    key: "team_en_route",
    label: "Cleaner en route",
    description: "The team is on the way to the property.",
    icon: "truck",
  },
  {
    key: "cleaning_started",
    label: "Cleaning started",
    description: "The team has arrived and started service at the property.",
    icon: "sparkles",
  },
  {
    key: "cleaning_in_progress",
    label: "Cleaning in progress",
    description: "The service is actively being completed on site.",
    icon: "sparkles",
  },
  {
    key: "cleaning_completed",
    label: "Cleaning completed",
    description: "The core cleaning work has been completed.",
    icon: "check",
  },
  {
    key: "inspection_completed",
    label: "Inspection completed",
    description: "Final checklist and quality inspection are complete.",
    icon: "shield",
  },
  {
    key: "customer_confirmed",
    label: "Customer follow-up",
    description: "The visit is complete and the customer follow-up stage is open.",
    icon: "check",
  },
];

const OFFICE_STEPS: CareTrackingStep[] = [
  {
    key: "booked",
    label: "Booking confirmed",
    description: "The office or commercial booking has been created.",
    icon: "calendar",
  },
  {
    key: "schedule_confirmed",
    label: "Schedule confirmed",
    description: "The service slot is confirmed for the site.",
    icon: "clock",
  },
  {
    key: "team_assigned",
    label: "Team assigned",
    description: "The commercial cleaning team has been assigned.",
    icon: "briefcase",
  },
  {
    key: "access_confirmed",
    label: "Access confirmed",
    description: "Site access and operating instructions are confirmed.",
    icon: "building",
  },
  {
    key: "on_site_started",
    label: "On-site started",
    description: "The team is on site and the service has started.",
    icon: "building",
  },
  {
    key: "service_in_progress",
    label: "Service in progress",
    description: "The workspace cleaning scope is actively in progress.",
    icon: "sparkles",
  },
  {
    key: "checklist_completed",
    label: "Checklist completed",
    description: "Section-level task completion has been recorded.",
    icon: "clipboard",
  },
  {
    key: "supervisor_signoff",
    label: "Supervisor sign-off",
    description: "Internal review and supervisor sign-off are being completed.",
    icon: "shield",
  },
  {
    key: "service_completed",
    label: "Service completed",
    description: "The commercial visit has been completed successfully.",
    icon: "check",
  },
];

const STATUS_ALIASES: Record<CareServiceFamily, Record<string, string>> = {
  garment: {
    confirmed: "booked",
    cleaning: "treatment",
    received: "received_at_facility",
    received_in_facility: "received_at_facility",
    sorting: "sorting_tagging",
    tagging: "sorting_tagging",
    pressing: "pressing_finishing",
    finishing: "pressing_finishing",
  },
  home: {
    confirmed: "team_scheduled",
    picked_up: "team_assigned",
    out_for_delivery: "team_en_route",
    cleaning: "cleaning_in_progress",
    quality_check: "inspection_completed",
    delivered: "customer_confirmed",
  },
  office: {
    confirmed: "schedule_confirmed",
    picked_up: "team_assigned",
    out_for_delivery: "access_confirmed",
    cleaning: "service_in_progress",
    quality_check: "supervisor_signoff",
    delivered: "service_completed",
  },
};

const FAMILY_LABELS: Record<CareServiceFamily, string> = {
  garment: "Wardrobe care",
  home: "Home cleaning",
  office: "Office cleaning",
};

function humanize(text: string) {
  const normalized = String(text || "").replaceAll("_", " ").trim();
  if (!normalized) return "Unknown";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function inferCareServiceFamily(input: BookingFamilyInput): CareServiceFamily {
  const serviceType = String(input.service_type || "").toLowerCase();
  const itemSummary = String(input.item_summary || "").toLowerCase();

  if (
    isServiceBookingRecord(input) &&
    (serviceType.includes("office") ||
      itemSummary.includes("office cleaning") ||
      itemSummary.includes("workspace"))
  ) {
    return "office";
  }

  if (
    isServiceBookingRecord(input) &&
    (serviceType.includes("home") ||
      itemSummary.includes("home cleaning") ||
      itemSummary.includes("residential"))
  ) {
    return "home";
  }

  if (serviceType.includes("office")) return "office";
  if (serviceType.includes("home")) return "home";
  return "garment";
}

export function getTrackingSteps(family: CareServiceFamily) {
  if (family === "home") return HOME_STEPS;
  if (family === "office") return OFFICE_STEPS;
  return GARMENT_STEPS;
}

export function normalizeTrackingStatus(status: string | null | undefined, family: CareServiceFamily) {
  const raw = String(status || "booked").trim().toLowerCase();
  if (!raw) return "booked";
  return STATUS_ALIASES[family][raw] || raw;
}

export function getTrackingStatusLabel(status: string | null | undefined, family: CareServiceFamily) {
  const key = normalizeTrackingStatus(status, family);
  const step = getTrackingSteps(family).find((entry) => entry.key === key);
  return step?.label || humanize(key);
}

export function getTrackingTone(status: string | null | undefined, family: CareServiceFamily): CareTrackingTone {
  const key = normalizeTrackingStatus(status, family);

  if (key === "cancelled" || key === "issue" || key === "exception") return "red";
  if (key === "delivered" || key === "customer_confirmed" || key === "service_completed") {
    return "emerald";
  }
  if (["out_for_delivery", "team_en_route", "team_assigned", "access_confirmed"].includes(key)) {
    return "blue";
  }
  if (
    [
      "treatment",
      "pressing_finishing",
      "cleaning_started",
      "cleaning_in_progress",
      "cleaning_completed",
      "service_in_progress",
      "on_site_started",
    ].includes(key)
  ) {
    return "violet";
  }
  if (
    ["quality_check", "inspection_completed", "checklist_completed", "supervisor_signoff"].includes(
      key
    )
  ) {
    return "emerald";
  }
  if (["booked", "team_scheduled", "schedule_confirmed", "received_at_facility", "sorting_tagging", "packed"].includes(key)) {
    return "amber";
  }
  return family === "garment" ? "amber" : "slate";
}

export function getTrackingStatusOptions(family: CareServiceFamily) {
  const steps = getTrackingSteps(family);
  const options = steps.map((step) => step.key);

  if (family === "garment") {
    return [...options, "cancelled"];
  }

  return [...options, "cancelled"];
}

export function getTrackingStatusDescription(
  status: string | null | undefined,
  family: CareServiceFamily
) {
  const key = normalizeTrackingStatus(status, family);
  const step = getTrackingSteps(family).find((entry) => entry.key === key);
  return step?.description || humanize(key);
}

export function toStoredBookingStatus(
  status: string | null | undefined,
  family: CareServiceFamily
) {
  const key = normalizeTrackingStatus(status, family);

  if (key === "cancelled") {
    return "cancelled";
  }

  if (family === "garment") {
    if (key === "picked_up") {
      return "picked_up";
    }

    if (
      [
        "received_at_facility",
        "sorting_tagging",
        "treatment",
        "pressing_finishing",
        "quality_check",
        "packed",
      ].includes(key)
    ) {
      return "picked_up";
    }

    if (key === "out_for_delivery") {
      return "out_for_delivery";
    }

    if (key === "delivered") {
      return "delivered";
    }

    return "booked";
  }

  if (family === "home") {
    if (["cleaning_started", "cleaning_in_progress"].includes(key)) {
      return "picked_up";
    }

    if (["cleaning_completed", "inspection_completed", "customer_confirmed"].includes(key)) {
      return "delivered";
    }

    return "booked";
  }

  if (["on_site_started", "service_in_progress"].includes(key)) {
    return "picked_up";
  }

  if (["checklist_completed", "supervisor_signoff", "service_completed"].includes(key)) {
    return "delivered";
  }

  return "booked";
}

export function getTrackingCustomerGuidance(
  status: string | null | undefined,
  family: CareServiceFamily
) {
  const key = normalizeTrackingStatus(status, family);

  if (family === "garment") {
    if (key === "booked") {
      return [
        "Keep your pickup window available and keep the tracking code close.",
        "Use the tracking page any time you need a live progress check.",
      ];
    }

    if (key === "picked_up" || key === "received_at_facility" || key === "sorting_tagging") {
      return [
        "Your order is now inside the care process.",
        "You do not need to do anything unless the team contacts you for clarification.",
      ];
    }

    if (key === "out_for_delivery") {
      return [
        "Please stay reachable so delivery can be completed smoothly.",
        "If the delivery window needs to change, contact the Care desk immediately.",
      ];
    }

    if (key === "delivered") {
      return [
        "Your order has been returned successfully.",
        "Inspect the finishing and share a review if the service met the standard.",
      ];
    }

    return [
      "The order is moving through the active care process.",
      "Tracking stays live until return delivery is complete.",
    ];
  }

  if (family === "home") {
    if (["booked", "team_scheduled", "team_assigned", "team_en_route"].includes(key)) {
      return [
        "Please keep access notes and arrival instructions available for the team.",
        "If the service window changes, reply to the booking email or contact support.",
      ];
    }

    if (["cleaning_started", "cleaning_in_progress"].includes(key)) {
      return [
        "The cleaning team is now working on site.",
        "Use support for any urgent change request while the visit is in progress.",
      ];
    }

    return [
      "The visit is in its completion and follow-up stage.",
      "Once you are satisfied with the result, you can leave a verified review.",
    ];
  }

  if (["booked", "schedule_confirmed", "team_assigned", "access_confirmed"].includes(key)) {
    return [
      "Please keep site access and any operating instructions available for the team.",
      "Support can help if the visit window or access details need adjustment.",
    ];
  }

  if (["on_site_started", "service_in_progress"].includes(key)) {
    return [
      "The team is currently on site carrying out the agreed scope.",
      "Use support for any urgent site clarification while the visit is active.",
    ];
  }

  return [
    "The commercial visit is now in completion and sign-off.",
    "You can review the result and share verified feedback after completion.",
  ];
}

export function isReviewEligibleStatus(
  family: CareServiceFamily,
  status: string | null | undefined
) {
  const normalized = normalizeTrackingStatus(status, family);

  if (family === "garment") {
    return normalized === "delivered";
  }

  if (family === "home") {
    return normalized === "inspection_completed" || normalized === "customer_confirmed";
  }

  return normalized === "supervisor_signoff" || normalized === "service_completed";
}

export function getTrackingCurrentIndex(status: string | null | undefined, family: CareServiceFamily) {
  const normalized = normalizeTrackingStatus(status, family);
  const steps = getTrackingSteps(family);
  const exact = steps.findIndex((entry) => entry.key === normalized);
  if (exact >= 0) return exact;
  if (["cancelled", "issue", "exception"].includes(normalized)) return steps.length - 1;
  return 0;
}

export function getTrackingHeadline(family: CareServiceFamily) {
  if (family === "home") return "Home cleaning execution";
  if (family === "office") return "Office cleaning execution";
  return "Wardrobe delivery movement";
}

export function getTrackingSupportCopy(family: CareServiceFamily) {
  if (family === "home") {
    return "This timeline focuses on team scheduling, arrival, on-site progress, inspection, and completion quality at the property.";
  }
  if (family === "office") {
    return "This timeline focuses on schedule readiness, access confirmation, site execution, checklist completion, and internal sign-off.";
  }
  return "This timeline focuses on pickup, facility intake, cleaning and finishing, packing, and return delivery.";
}

export function getServiceFamilyLabel(family: CareServiceFamily) {
  return FAMILY_LABELS[family];
}

export function parseServiceBookingSummary(itemSummary?: string | null): ServiceSummaryDetails | null {
  const raw = String(itemSummary || "").trim();
  if (!raw || !raw.includes("[service_booking]")) return null;

  const parts = raw
    .split("|")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry) => entry !== "[service_booking]");

  const details: ServiceSummaryDetails = {
    categoryLabel: parts[0] ?? null,
    serviceLabel: parts[1] ?? null,
    frequencyLabel: null,
    urgencyLabel: null,
    zoneLabel: null,
    preferredDays: [],
    preferredStartDate: null,
    serviceWindow: null,
    propertyLabel: null,
    siteContactName: null,
    addOnLabels: [],
    highlights: [],
  };

  for (const part of parts.slice(2)) {
    if (part.startsWith("Frequency:")) {
      details.frequencyLabel = part.replace("Frequency:", "").trim();
      continue;
    }
    if (part.startsWith("Urgency:")) {
      details.urgencyLabel = part.replace("Urgency:", "").trim();
      continue;
    }
    if (part.startsWith("Zone:")) {
      details.zoneLabel = part.replace("Zone:", "").trim();
      continue;
    }
    if (part.startsWith("Preferred days:")) {
      details.preferredDays = part
        .replace("Preferred days:", "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
      continue;
    }
    if (part.startsWith("Plan start:")) {
      details.preferredStartDate = part.replace("Plan start:", "").trim();
      continue;
    }
    if (part.startsWith("Window:")) {
      details.serviceWindow = part.replace("Window:", "").trim();
      continue;
    }
    if (part.startsWith("Property:")) {
      details.propertyLabel = part.replace("Property:", "").trim();
      continue;
    }
    if (part.startsWith("Site contact:")) {
      details.siteContactName = part.replace("Site contact:", "").trim();
      continue;
    }
    if (part.startsWith("Add-ons:")) {
      details.addOnLabels = part
        .replace("Add-ons:", "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
      continue;
    }

    details.highlights.push(part);
  }

  return details;
}

export function isRecurringService(details: ServiceSummaryDetails | null) {
  if (!details?.frequencyLabel) return false;
  return details.frequencyLabel.toLowerCase() !== "one-time";
}
