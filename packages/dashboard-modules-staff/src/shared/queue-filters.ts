import type { FilterField } from "@henryco/dashboard-shell/components";

/**
 * Default filter field set Track C division modules surface. Modules
 * may extend or override.
 *
 * Lives in a server-safe module (no "use client" directive) so the
 * 12 module server components can spread it into their per-module
 * FILTERS arrays. Client components (StaffQueueShell,
 * GenericStaffQueueClient) re-export from here too — the value is the
 * same on both sides of the React Server / Client boundary.
 */
export const DEFAULT_STAFF_QUEUE_FILTERS: ReadonlyArray<FilterField> = [
  {
    id: "status",
    label: "Status",
    kind: "segmented",
    options: [
      { value: "open", label: "Open" },
      { value: "in_progress", label: "In progress" },
      { value: "escalated", label: "Escalated" },
      { value: "resolved", label: "Resolved" },
    ],
  },
  {
    id: "sla",
    label: "SLA",
    kind: "select",
    options: [
      { value: "breach", label: "Breach" },
      { value: "warning", label: "Warning" },
      { value: "healthy", label: "Healthy" },
    ],
  },
  {
    id: "assignee",
    label: "Assignee",
    kind: "select",
    options: [
      { value: "me", label: "Me" },
      { value: "unassigned", label: "Unassigned" },
      { value: "team", label: "My team" },
    ],
  },
  {
    id: "createdAt",
    label: "Created",
    kind: "daterange",
  },
  {
    id: "search",
    label: "Search",
    kind: "text",
    placeholder: "Subject, requester, ID…",
  },
];
