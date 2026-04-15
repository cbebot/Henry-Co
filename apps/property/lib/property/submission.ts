import type {
  PropertyListingIntent,
  PropertyListingServiceType,
} from "@/lib/property/types";

export const PROPERTY_MAX_MEDIA_FILE_BYTES = 15 * 1024 * 1024;
export const PROPERTY_MAX_DOCUMENT_FILE_BYTES = 12 * 1024 * 1024;

export const PROPERTY_ALLOWED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export const PROPERTY_ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export type PropertyUploadFieldName =
  | "media"
  | "ownership_docs"
  | "authority_docs"
  | "management_docs"
  | "identity_docs"
  | "supporting_docs"
  | "inspection_docs";

export type PropertyDocumentKind =
  | "ownership_proof"
  | "authority_proof"
  | "management_authorization"
  | "identity_evidence"
  | "supporting_document"
  | "inspection_evidence";

export type PropertySubmissionFieldName =
  | "agency_name"
  | "authority_scope"
  | "owner_contact_name"
  | "owner_contact_phone"
  | "commercial_use"
  | "occupancy_status"
  | "management_scope"
  | "management_notes"
  | "inspection_window"
  | "inspection_notes"
  | "title_status";

export type PropertySubmissionOption = {
  label: string;
  value: string;
};

export type PropertySubmissionFieldSpec = {
  name: PropertySubmissionFieldName;
  label: string;
  description: string;
  kind: "text" | "textarea" | "tel" | "select";
  required: boolean;
  placeholder?: string;
  options?: PropertySubmissionOption[];
};

export type PropertySubmissionUploadSpec = {
  name: Exclude<PropertyUploadFieldName, "media">;
  label: string;
  kind: PropertyDocumentKind;
  description: string;
  required: boolean;
  minimumFiles: number;
  accept: string;
};

export type PropertySubmissionBlueprint = {
  serviceTitle: string;
  intentTitle: string;
  kind: "rent" | "sale" | "land" | "commercial" | "managed" | "shortlet";
  docsMin: number;
  mediaMin: number;
  requiresInspection: boolean;
  requiresVerifiedIdentity: boolean;
  showPriceFields: boolean;
  showBedrooms: boolean;
  showBathrooms: boolean;
  showLandFields: boolean;
  reviewHeadline: string;
  eligibilityCopy: string;
  managedTrackCopy: string;
  moderationChecks: string[];
  userChecklist: string[];
  contextFields: PropertySubmissionFieldSpec[];
  uploadFields: PropertySubmissionUploadSpec[];
};

export type PropertySubmissionUploadCounts = Record<PropertyUploadFieldName, number>;

export type PropertySubmissionContext = Partial<Record<PropertySubmissionFieldName, string>>;

const selectOptions = {
  authorityScope: [
    { value: "exclusive", label: "Exclusive marketing authority" },
    { value: "non_exclusive", label: "Non-exclusive authority" },
    { value: "caretaker", label: "Caretaker / family representative" },
    { value: "broker_assist", label: "Broker-assisted by HenryCo" },
  ] satisfies PropertySubmissionOption[],
  commercialUse: [
    { value: "office", label: "Office / HQ" },
    { value: "retail", label: "Retail / customer-facing" },
    { value: "hospitality", label: "Hospitality / mixed use" },
    { value: "industrial", label: "Industrial / warehouse" },
  ] satisfies PropertySubmissionOption[],
  occupancyStatus: [
    { value: "vacant", label: "Vacant and ready" },
    { value: "occupied_notice", label: "Occupied, notice served" },
    { value: "occupied_flexible", label: "Occupied, flexible access" },
    { value: "construction", label: "Still being prepared" },
  ] satisfies PropertySubmissionOption[],
  managementScope: [
    { value: "marketing_only", label: "Marketing only" },
    { value: "tenant_acquisition", label: "Tenant or buyer acquisition" },
    { value: "full_management", label: "Full management" },
    { value: "inspection_first", label: "Inspection before deciding scope" },
  ] satisfies PropertySubmissionOption[],
  inspectionWindow: [
    { value: "within_48h", label: "Within 48 hours" },
    { value: "within_7d", label: "Within 7 days" },
    { value: "after_docs", label: "After document review" },
    { value: "flexible", label: "Flexible with notice" },
  ] satisfies PropertySubmissionOption[],
} as const;

export function getPropertyServiceTypeTitle(serviceType: PropertyListingServiceType) {
  switch (serviceType) {
    case "rent":
      return "Residential rent";
    case "sale":
      return "Residential sale";
    case "shortlet":
      return "Short-let";
    case "land":
      return "Land";
    case "commercial":
      return "Commercial";
    case "agent_assisted":
      return "Agent-assisted listing";
    case "inspection_request":
      return "Inspection request";
    case "managed_property":
      return "Managed property";
    case "verified_property":
      return "Verified property";
    default:
      return serviceType;
  }
}

export function getPropertyIntentLabel(intent: PropertyListingIntent) {
  switch (intent) {
    case "owner_listed":
      return "Owner-listed";
    case "agent_listed":
      return "Agent-listed";
    case "agent_assisted":
      return "Agent-assisted";
    case "inspection_request":
      return "Inspection request";
    case "managed_property":
      return "Managed listing";
    case "verified_property":
      return "Verified listing";
    default:
      return intent;
  }
}

export function getPropertyKindForService(serviceType: PropertyListingServiceType) {
  switch (serviceType) {
    case "shortlet":
      return "shortlet";
    case "sale":
      return "sale";
    case "land":
      return "land";
    case "commercial":
      return "commercial";
    case "managed_property":
      return "managed";
    case "rent":
    case "agent_assisted":
    case "inspection_request":
    case "verified_property":
    default:
      return "rent";
  }
}

export function getPropertyIntentOptions(
  serviceType: PropertyListingServiceType
): PropertyListingIntent[] {
  if (serviceType === "inspection_request") {
    return ["inspection_request"];
  }

  if (serviceType === "managed_property") {
    return ["managed_property", "owner_listed", "agent_listed"];
  }

  if (serviceType === "verified_property") {
    return ["verified_property", "owner_listed", "agent_listed"];
  }

  if (serviceType === "agent_assisted") {
    return ["agent_assisted", "owner_listed", "agent_listed"];
  }

  return ["owner_listed", "agent_listed", "agent_assisted"];
}

function baseMinimums(serviceType: PropertyListingServiceType) {
  switch (serviceType) {
    case "sale":
    case "land":
    case "commercial":
    case "managed_property":
    case "verified_property":
      return { docsMin: 2, mediaMin: 6, requiresInspection: true };
    case "shortlet":
      return { docsMin: 1, mediaMin: 8, requiresInspection: true };
    case "inspection_request":
      return { docsMin: 0, mediaMin: 0, requiresInspection: true };
    case "agent_assisted":
      return { docsMin: 1, mediaMin: 5, requiresInspection: false };
    case "rent":
    default:
      return { docsMin: 1, mediaMin: 5, requiresInspection: false };
  }
}

function createUploadSpec(
  name: Exclude<PropertyUploadFieldName, "media">,
  label: string,
  kind: PropertyDocumentKind,
  description: string,
  required = false,
  minimumFiles = required ? 1 : 0
): PropertySubmissionUploadSpec {
  return {
    name,
    label,
    kind,
    description,
    required,
    minimumFiles,
    accept: ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx",
  };
}

export function getPropertySubmissionBlueprint(
  serviceType: PropertyListingServiceType,
  intent: PropertyListingIntent
): PropertySubmissionBlueprint {
  const minimums = baseMinimums(serviceType);
  const kind = getPropertyKindForService(serviceType);
  const isAgentTrack =
    intent === "agent_listed" || intent === "agent_assisted" || serviceType === "agent_assisted";
  const isManagedTrack = serviceType === "managed_property" || intent === "managed_property";
  const isInspectionTrack = serviceType === "inspection_request" || intent === "inspection_request";
  const isVerifiedTrack = serviceType === "verified_property" || intent === "verified_property";
  const requiresVerifiedIdentity =
    isManagedTrack ||
    isVerifiedTrack ||
    isAgentTrack ||
    serviceType === "sale" ||
    serviceType === "land" ||
    serviceType === "commercial";

  const contextFields: PropertySubmissionFieldSpec[] = [];
  const uploadFields: PropertySubmissionUploadSpec[] = [];

  if (isAgentTrack) {
    contextFields.push(
      {
        name: "agency_name",
        label: "Agency or brokerage",
        description: "Who is marketing the property on behalf of the owner?",
        kind: "text",
        required: true,
        placeholder: "Prime Crest Realty",
      },
      {
        name: "authority_scope",
        label: "Authority scope",
        description: "Tell HenryCo what authority you actually have.",
        kind: "select",
        required: true,
        options: selectOptions.authorityScope,
      },
      {
        name: "owner_contact_name",
        label: "Owner or principal contact",
        description: "The person HenryCo can call if authority needs to be confirmed.",
        kind: "text",
        required: true,
        placeholder: "Amina Yusuf",
      },
      {
        name: "owner_contact_phone",
        label: "Owner or principal phone",
        description: "Used only for trust review and inspection coordination.",
        kind: "tel",
        required: true,
        placeholder: "+234...",
      }
    );

    uploadFields.push(
      createUploadSpec(
        "authority_docs",
        "Agency or authority proof",
        "authority_proof",
        "Upload a signed mandate, brokerage authority letter, or owner approval note.",
        true
      )
    );
  } else {
    uploadFields.push(
      createUploadSpec(
        "ownership_docs",
        "Ownership or authority proof",
        "ownership_proof",
        "Upload title documents, lease authority, allocation papers, or any primary ownership proof.",
        isManagedTrack || isVerifiedTrack,
        isManagedTrack || isVerifiedTrack ? 1 : 0
      )
    );
  }

  if (serviceType === "commercial") {
    contextFields.push(
      {
        name: "commercial_use",
        label: "Commercial use",
        description: "Help reviewers understand the fit of the space.",
        kind: "select",
        required: true,
        options: selectOptions.commercialUse,
      },
      {
        name: "occupancy_status",
        label: "Occupancy status",
        description: "This affects inspection timing and viewing truth.",
        kind: "select",
        required: true,
        options: selectOptions.occupancyStatus,
      }
    );
  }

  if (serviceType === "land") {
    contextFields.push({
      name: "title_status",
      label: "Title status",
      description: "If you know the title status, state it clearly.",
      kind: "text",
      required: false,
      placeholder: "C of O, Governor's consent, excision...",
    });
  }

  if (isManagedTrack) {
    contextFields.push(
      {
        name: "management_scope",
        label: "Managed scope requested",
        description: "Tell HenryCo what level of management you want.",
        kind: "select",
        required: true,
        options: selectOptions.managementScope,
      },
      {
        name: "management_notes",
        label: "Management notes",
        description: "Operational context: tenant turnover, access pattern, caretaker reality, or pain points.",
        kind: "textarea",
        required: true,
        placeholder: "Caretaker is onsite weekdays, access needs 24-hour notice, target is premium corporate lets...",
      }
    );

    uploadFields.push(
      createUploadSpec(
        "management_docs",
        "Management authorization",
        "management_authorization",
        "Upload a management instruction, signed authorization, or board approval if HenryCo will operate the listing.",
        true
      )
    );
  }

  if (requiresVerifiedIdentity) {
    uploadFields.push(
      createUploadSpec(
        "identity_docs",
        "Identity or KYC support",
        "identity_evidence",
        "Optional supporting identity evidence for trust review. Your HenryCo account verification status is still the main identity gate.",
        false
      )
    );
  }

  if (isInspectionTrack || minimums.requiresInspection) {
    contextFields.push(
      {
        name: "inspection_window",
        label: "Inspection timing",
        description: "How soon can HenryCo realistically verify the property?",
        kind: "select",
        required: isInspectionTrack,
        options: selectOptions.inspectionWindow,
      },
      {
        name: "inspection_notes",
        label: "Inspection and access notes",
        description: "Gate code, caretaker reality, current occupancy, site constraints, or what HenryCo should verify.",
        kind: "textarea",
        required: isInspectionTrack || isManagedTrack,
        placeholder: "Access via estate gate 3, caretaker onsite from 10am, current tenant vacates next month...",
      }
    );

    uploadFields.push(
      createUploadSpec(
        "inspection_docs",
        "Inspection evidence",
        "inspection_evidence",
        "Optional: upload site photos, floor plans, or access notes that help the inspection team prepare.",
        false
      )
    );
  }

  uploadFields.push(
    createUploadSpec(
      "supporting_docs",
      "Supporting documents",
      "supporting_document",
      "Optional supporting files such as service-charge sheets, valuation notes, or readiness evidence.",
      false
    )
  );

  const moderationChecks = [
    "Authority to market or manage the property",
    "Media clarity and whether the listing is serious enough for review",
    "Price, access, and occupancy truth",
    minimums.requiresInspection ? "Inspection readiness and whether a site check is required" : "Whether inspection should be escalated anyway",
  ];

  const userChecklist = [
    "Public publication never happens instantly. HenryCo holds the submission privately first.",
    isManagedTrack
      ? "Managed listings need stronger operational context before they can move into publication."
      : "Non-managed listings can still be published, but HenryCo expects clean authority and readiness proof.",
    requiresVerifiedIdentity
      ? "This path relies on verified identity, authority proof, or both before publication can clear."
      : "If trust evidence is weak, HenryCo can still pause the listing and request stronger proof.",
    minimums.requiresInspection
      ? "Inspection-sensitive listings can stay off-market until the inspection rail is complete."
      : "Inspection may still be required if the listing looks higher-risk than the initial path suggests.",
  ];

  return {
    serviceTitle: getPropertyServiceTypeTitle(serviceType),
    intentTitle: getPropertyIntentLabel(intent),
    kind,
    docsMin: minimums.docsMin,
    mediaMin: minimums.mediaMin,
    requiresInspection: minimums.requiresInspection,
    requiresVerifiedIdentity,
    showPriceFields: !isInspectionTrack,
    showBedrooms: !["commercial", "land", "inspection_request"].includes(serviceType),
    showBathrooms: !["land", "inspection_request"].includes(serviceType),
    showLandFields: serviceType === "land",
    reviewHeadline: isManagedTrack
      ? "HenryCo will check authority, operating readiness, and whether the listing can enter managed operations."
      : isInspectionTrack
        ? "HenryCo will review the inspection request before deciding whether the property can move toward publication."
        : "HenryCo will review authority, copy, media, and readiness before any public release.",
    eligibilityCopy: requiresVerifiedIdentity
      ? "Eligibility is decided by verified identity, authority proof, document strength, and inspection readiness where needed."
      : "Eligibility is decided by authority proof, document strength, and inspection readiness where the listing warrants it.",
    managedTrackCopy: isManagedTrack
      ? "Managed listings imply HenryCo operational involvement after acceptance."
      : "Non-managed listings remain owner or agent run even if HenryCo clears them for publication.",
    moderationChecks,
    userChecklist,
    contextFields,
    uploadFields,
  };
}

export function readPropertySubmissionContext(
  formData: FormData,
  blueprint: PropertySubmissionBlueprint
): PropertySubmissionContext {
  return Object.fromEntries(
    blueprint.contextFields
      .map((field) => {
        const value = String(formData.get(field.name) || "").trim();
        return [field.name, value];
      })
      .filter(([, value]) => Boolean(value))
  ) as PropertySubmissionContext;
}

export function countPropertyUploadFiles(formData: FormData): PropertySubmissionUploadCounts {
  const count = (key: PropertyUploadFieldName) =>
    formData
      .getAll(key)
      .filter((value): value is File => value instanceof File && value.size > 0).length;

  return {
    media: count("media"),
    ownership_docs: count("ownership_docs"),
    authority_docs: count("authority_docs"),
    management_docs: count("management_docs"),
    identity_docs: count("identity_docs"),
    supporting_docs: count("supporting_docs") + count("verification_docs" as PropertyUploadFieldName),
    inspection_docs: count("inspection_docs"),
  };
}

export function validatePropertySubmissionBlueprint(input: {
  blueprint: PropertySubmissionBlueprint;
  context: PropertySubmissionContext;
  uploadCounts: PropertySubmissionUploadCounts;
}) {
  const errors: string[] = [];

  for (const field of input.blueprint.contextFields) {
    if (!field.required) continue;
    if (!String(input.context[field.name] || "").trim()) {
      errors.push(`${field.label} is required for this submission path.`);
    }
  }

  for (const field of input.blueprint.uploadFields) {
    if (!field.required) continue;
    if ((input.uploadCounts[field.name] || 0) < field.minimumFiles) {
      errors.push(`${field.label} is required for this submission path.`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function validatePropertyUploadFile(
  file: File,
  mode: "media" | "document"
): string | null {
  const allowed = mode === "media" ? PROPERTY_ALLOWED_MEDIA_TYPES : PROPERTY_ALLOWED_DOCUMENT_TYPES;
  const maxBytes =
    mode === "media" ? PROPERTY_MAX_MEDIA_FILE_BYTES : PROPERTY_MAX_DOCUMENT_FILE_BYTES;

  if (file.size > maxBytes) {
    return `${file.name} is too large for ${mode === "media" ? "media" : "document"} upload review.`;
  }

  if (!allowed.has(String(file.type || "").toLowerCase())) {
    return `${file.name} is not an accepted ${mode === "media" ? "media" : "document"} format.`;
  }

  return null;
}
