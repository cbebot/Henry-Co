import { NextResponse } from "next/server";
import { requireOwner } from "@/app/lib/owner-auth";

/**
 * Owner command palette command source — powers Cmd+K (⌘K / Ctrl+K) in the
 * owner shell. Returns a `CommandsWirePayload`-compatible JSON response so
 * `DashboardCommandPalette` from @henryco/search-ui can render and rank commands.
 *
 * The account app has its own version of this route for customer-surface commands.
 * The hub's version is owner-specific navigation — every major section of the
 * command center is a command so the owner can jump there without mousing.
 */

interface WireCommand {
  id: string;
  source: string;
  label: string;
  kicker: string | null;
  groupLabel: string;
  href: string | null;
  keywords: string[];
  shortcut: string[] | null;
  recencyAt: number | null;
}

const OWNER_COMMANDS: WireCommand[] = [
  // --- Overview ---
  { id: "nav-home", source: "navigation", label: "Command center home", kicker: "Overview", groupLabel: "Navigation", href: "/owner", keywords: ["home", "overview", "dashboard", "command", "center"], shortcut: null, recencyAt: null },

  // --- Finance ---
  { id: "nav-finance", source: "navigation", label: "Finance center", kicker: "Finance", groupLabel: "Navigation", href: "/owner/finance", keywords: ["finance", "money", "revenue", "expenses"], shortcut: null, recencyAt: null },
  { id: "nav-finance-revenue", source: "navigation", label: "Revenue", kicker: "Finance", groupLabel: "Navigation", href: "/owner/finance/revenue", keywords: ["revenue", "income", "sales", "spine", "ledger"], shortcut: null, recencyAt: null },
  { id: "nav-finance-expenses", source: "navigation", label: "Expenses", kicker: "Finance", groupLabel: "Navigation", href: "/owner/finance/expenses", keywords: ["expenses", "cost", "spend", "outflow"], shortcut: null, recencyAt: null },
  { id: "nav-finance-invoices", source: "navigation", label: "Invoices", kicker: "Finance", groupLabel: "Navigation", href: "/owner/finance/invoices", keywords: ["invoice", "billing", "payment"], shortcut: null, recencyAt: null },

  // --- Operations ---
  { id: "nav-operations", source: "navigation", label: "Operations center", kicker: "Operations", groupLabel: "Navigation", href: "/owner/operations", keywords: ["operations", "ops", "alerts", "queues"], shortcut: null, recencyAt: null },
  { id: "nav-operations-approvals", source: "navigation", label: "Approval center", kicker: "Operations", groupLabel: "Navigation", href: "/owner/operations/approvals", keywords: ["approval", "decision", "queue", "review", "vendor", "dispute"], shortcut: null, recencyAt: null },
  { id: "nav-operations-alerts", source: "navigation", label: "Operational alerts", kicker: "Operations", groupLabel: "Navigation", href: "/owner/operations/alerts", keywords: ["alerts", "warnings", "critical", "support"], shortcut: null, recencyAt: null },
  { id: "nav-operations-queues", source: "navigation", label: "Operations queues", kicker: "Operations", groupLabel: "Navigation", href: "/owner/operations/queues", keywords: ["queue", "backlog", "tasks", "pending"], shortcut: null, recencyAt: null },
  { id: "nav-operations-decisions", source: "navigation", label: "Operator decisions inbox", kicker: "Operations", groupLabel: "Navigation", href: "/owner/operations/decisions", keywords: ["decision", "operator", "studio", "agency", "deploy", "approve", "inbox"], shortcut: null, recencyAt: null },

  // --- AI & Intelligence ---
  { id: "nav-ai", source: "navigation", label: "Henry Onyx Intelligence", kicker: "AI", groupLabel: "Navigation", href: "/owner/ai", keywords: ["ai", "intelligence", "assistant", "helper"], shortcut: null, recencyAt: null },
  { id: "nav-ai-conversations", source: "navigation", label: "Intelligence conversations", kicker: "AI", groupLabel: "Navigation", href: "/owner/ai/conversations", keywords: ["conversation", "chat", "transcript", "escalation"], shortcut: null, recencyAt: null },
  { id: "nav-ai-signals", source: "navigation", label: "Live signals", kicker: "AI", groupLabel: "Navigation", href: "/owner/ai/signals", keywords: ["signal", "anomaly", "alert", "risk", "detection"], shortcut: null, recencyAt: null },
  { id: "nav-ai-insights", source: "navigation", label: "Helper insights", kicker: "AI", groupLabel: "Navigation", href: "/owner/ai/insights", keywords: ["insight", "recommendation", "action", "helper"], shortcut: null, recencyAt: null },

  // --- Divisions ---
  { id: "nav-divisions", source: "navigation", label: "Division control center", kicker: "Divisions", groupLabel: "Navigation", href: "/owner/divisions", keywords: ["division", "company", "units", "map"], shortcut: null, recencyAt: null },
  { id: "nav-divisions-care", source: "navigation", label: "Care division room", kicker: "Divisions", groupLabel: "Navigation", href: "/owner/divisions/care", keywords: ["care", "laundry", "fabric", "cleaning", "booking"], shortcut: null, recencyAt: null },
  { id: "nav-divisions-marketplace", source: "navigation", label: "Marketplace division room", kicker: "Divisions", groupLabel: "Navigation", href: "/owner/divisions/marketplace", keywords: ["marketplace", "vendor", "seller", "buyer", "product"], shortcut: null, recencyAt: null },
  { id: "nav-divisions-learn", source: "navigation", label: "Academy division room", kicker: "Divisions", groupLabel: "Navigation", href: "/owner/divisions/learn", keywords: ["learn", "academy", "course", "education"], shortcut: null, recencyAt: null },
  { id: "nav-divisions-studio", source: "navigation", label: "Studio division room", kicker: "Divisions", groupLabel: "Navigation", href: "/owner/divisions/studio", keywords: ["studio", "creative", "freelance", "client"], shortcut: null, recencyAt: null },
  { id: "nav-divisions-jobs", source: "navigation", label: "Jobs division room", kicker: "Divisions", groupLabel: "Navigation", href: "/owner/divisions/jobs", keywords: ["jobs", "hiring", "candidate", "employer", "recruitment"], shortcut: null, recencyAt: null },
  { id: "nav-divisions-property", source: "navigation", label: "Property division room", kicker: "Divisions", groupLabel: "Navigation", href: "/owner/divisions/property", keywords: ["property", "real estate", "listing", "landlord", "tenant"], shortcut: null, recencyAt: null },
  { id: "nav-divisions-logistics", source: "navigation", label: "Logistics division room", kicker: "Divisions", groupLabel: "Navigation", href: "/owner/divisions/logistics", keywords: ["logistics", "delivery", "transport", "fleet", "dispatch"], shortcut: null, recencyAt: null },

  // --- Staff ---
  { id: "nav-staff", source: "navigation", label: "Staff management", kicker: "Staff", groupLabel: "Navigation", href: "/owner/staff", keywords: ["staff", "team", "workforce", "employee"], shortcut: null, recencyAt: null },
  { id: "nav-staff-invite", source: "navigation", label: "Invite staff member", kicker: "Staff", groupLabel: "Navigation", href: "/owner/staff/invite", keywords: ["invite", "add staff", "onboard", "hire"], shortcut: null, recencyAt: null },

  // --- Messaging ---
  { id: "nav-messaging", source: "navigation", label: "Messaging center", kicker: "Messaging", groupLabel: "Navigation", href: "/owner/messaging", keywords: ["message", "communication", "chat"], shortcut: null, recencyAt: null },
  { id: "nav-messaging-team", source: "navigation", label: "Internal team chat", kicker: "Messaging", groupLabel: "Navigation", href: "/owner/messaging/team", keywords: ["team", "internal", "chat", "staff"], shortcut: null, recencyAt: null },
  { id: "nav-messaging-queues", source: "navigation", label: "Delivery queue diagnostics", kicker: "Messaging", groupLabel: "Navigation", href: "/owner/messaging/queues", keywords: ["email", "whatsapp", "delivery", "queue", "notification"], shortcut: null, recencyAt: null },

  // --- Settings ---
  { id: "nav-settings", source: "navigation", label: "Settings", kicker: "Settings", groupLabel: "Navigation", href: "/owner/settings", keywords: ["settings", "configuration", "preferences"], shortcut: null, recencyAt: null },
  { id: "nav-settings-security", source: "navigation", label: "Security and privilege", kicker: "Settings", groupLabel: "Navigation", href: "/owner/settings/security", keywords: ["security", "privilege", "owner profile", "audit", "access"], shortcut: null, recencyAt: null },
  { id: "nav-settings-audit", source: "navigation", label: "Audit log", kicker: "Settings", groupLabel: "Navigation", href: "/owner/settings/audit", keywords: ["audit", "log", "history", "events", "security"], shortcut: null, recencyAt: null },
  { id: "nav-brand", source: "navigation", label: "Brand settings", kicker: "Settings", groupLabel: "Navigation", href: "/owner/brand/settings", keywords: ["brand", "logo", "colours", "identity"], shortcut: null, recencyAt: null },
];

export async function GET(): Promise<Response> {
  const auth = await requireOwner();
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    generatedAt: Date.now(),
    commands: OWNER_COMMANDS,
    bySource: { navigation: OWNER_COMMANDS.length },
    emptyModules: [],
  });
}
