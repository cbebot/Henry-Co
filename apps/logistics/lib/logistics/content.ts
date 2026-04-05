import type {
  LogisticsDifferentiator,
  LogisticsPublicMetric,
  LogisticsServiceCard,
  LogisticsSettings,
  LogisticsZone,
} from "@/lib/logistics/types";

export const DEFAULT_LOGISTICS_SETTINGS: LogisticsSettings = {
  businessName: "HenryCo Logistics",
  supportEmail: "logistics@henrycogroup.com",
  supportPhone: "+2349133957084",
  currency: "NGN",
  timezone: "Africa/Lagos",
  defaultCountry: "Nigeria",
  quoteExpiryHours: 24,
  staleShipmentHours: 12,
  ownerAlertEmail: null,
  ownerAlertWhatsApp: null,
  pickupHours: "Mon - Sat • 7:00 AM to 8:00 PM",
  operationsCity: "Enugu",
  operationsRegion: "Enugu",
  trackingLookupHelp:
    "Use your tracking code with the sender or recipient phone number for secure lookup.",
  businessTrustBullets: [
    "Live queue ownership across dispatch, rider, support, and finance.",
    "Proof-of-delivery evidence attached to every completed shipment.",
    "Rate-card governance with override audit and stale-shipment escalation.",
  ],
};

export const LOGISTICS_PUBLIC_METRICS: LogisticsPublicMetric[] = [
  {
    label: "Dispatch clarity",
    value: "One live command surface",
    note: "Quotes, bookings, riders, issues, and finance move through one accountable workflow.",
  },
  {
    label: "Customer trust",
    value: "Tracking with proof",
    note: "Every important event is timestamped, visible, and tied to proof of delivery.",
  },
  {
    label: "Ops readiness",
    value: "Same-day to inter-city",
    note: "Short-haul dispatch and governed inter-city lanes share the same operating logic.",
  },
];

export const LOGISTICS_SERVICES: LogisticsServiceCard[] = [
  {
    slug: "same-day-delivery",
    name: "Same-day delivery",
    summary: "Fast urban dispatch for urgent packages that still need disciplined handoff and proof.",
    promise: "Priority pickup, live status flow, and premium closeout.",
    badge: "Fast lane",
    serviceType: "same_day",
    highlights: ["Rapid pickup windows", "Premium handoff flow", "Delay escalation rules"],
  },
  {
    slug: "scheduled-delivery",
    name: "Scheduled delivery",
    summary: "Planned pickups and dropoffs for teams that want cleaner timing and fewer surprises.",
    promise: "Booked slots, governed pricing, and visible assignment.",
    badge: "Planned",
    serviceType: "scheduled",
    highlights: ["Book future runs", "ETA governance", "Repeat booking support"],
  },
  {
    slug: "dispatch-operations",
    name: "Internal dispatch operations",
    summary: "Operational dispatch lanes for HenryCo teams and partner businesses that need control, not noise.",
    promise: "Queue ownership, rider workflows, and issue playbooks.",
    badge: "Ops core",
    serviceType: "dispatch",
    highlights: ["Dispatch dashboards", "Rider assignment", "Exception handling"],
  },
  {
    slug: "inter-city-readiness",
    name: "Inter-city readiness",
    summary: "Governed cross-city movement with explicit pricing, lane visibility, and delivery assurance.",
    promise: "Controlled lane pricing and return-flow visibility.",
    badge: "Expansion lane",
    serviceType: "inter_city",
    highlights: ["Lane-based pricing", "Cross-city planning", "Return management"],
  },
];

export const LOGISTICS_FAQS = [
  {
    q: "Can customers request a quote before booking?",
    a: "Yes. Quotes and bookings share the same shipment builder. Quote mode saves the shipment intent, calculates pricing, and stops before payment.",
  },
  {
    q: "How is tracking secured?",
    a: "Public tracking uses the tracking code plus the sender or recipient phone number. Signed-in customers also see any shipment linked to their user id or normalized email.",
  },
  {
    q: "What happens when a rider hits an issue?",
    a: "Riders can raise structured issues directly from their workflow. Dispatch and support receive the escalation, and every resolution step is logged back onto the shipment timeline.",
  },
  {
    q: "Does the platform support business repeat routes?",
    a: "Yes. The data model and booking flow are built to support repeat addresses, recurring business routing, and future batch submissions.",
  },
];

export const LOGISTICS_DIFFERENTIATORS: LogisticsDifferentiator[] = [
  {
    id: "confidence-meter",
    name: "Promise-window confidence meter",
    description:
      "Expose a promised delivery window plus an internal confidence score based on zone, rider load, and issue history.",
    pros: ["Sharper customer trust", "Dispatch sees risk before SLA drift"],
    cons: ["Needs clean event data", "Can mislead if heuristics decay"],
    difficulty: "high",
    innovationScore: 8,
  },
  {
    id: "shadow-eta",
    name: "Shadow ETA recalibration",
    description:
      "Compare promised ETA against actual completion and feed that delta back into lane confidence and stale thresholds.",
    pros: ["Self-correcting operations", "Better lane governance over time"],
    cons: ["Needs history volume", "Requires consistent event capture"],
    difficulty: "high",
    innovationScore: 9,
  },
  {
    id: "recovery-playbooks",
    name: "Recovery playbooks",
    description:
      "Turn delay, failed attempt, and POD mismatch cases into structured reroute, reattempt, refund, and return flows.",
    pros: ["Less ops improvisation", "Faster exception resolution"],
    cons: ["Initial modelling overhead"],
    difficulty: "medium",
    innovationScore: 8,
  },
  {
    id: "pod-pack",
    name: "Proof-of-delivery trust pack",
    description:
      "Require recipient name, timestamp, and evidence media before a shipment can close.",
    pros: ["Fewer disputes", "Stronger customer visibility"],
    cons: ["More rider closeout steps"],
    difficulty: "medium",
    innovationScore: 7,
  },
  {
    id: "repeat-lanes",
    name: "Business repeat lanes",
    description:
      "Let operators and business clients reuse address books and route templates without rebuilding shipment details every time.",
    pros: ["Stronger B2B retention", "Faster booking for repeat clients"],
    cons: ["More workflow states to maintain"],
    difficulty: "high",
    innovationScore: 8,
  },
  {
    id: "heat-map",
    name: "Queue heat map",
    description:
      "Rank dispatch queues by stale time, SLA risk, delay probability, and rider imbalance instead of raw status counts.",
    pros: ["Higher signal ops view", "Better prioritization"],
    cons: ["Needs opinionated scoring"],
    difficulty: "medium",
    innovationScore: 8,
  },
  {
    id: "override-ledger",
    name: "Override governance ledger",
    description:
      "Require a reason, actor, and review trail for every manual price or status override.",
    pros: ["Less leakage", "Cleaner finance audit"],
    cons: ["Slightly more operator friction"],
    difficulty: "medium",
    innovationScore: 7,
  },
  {
    id: "dual-surface",
    name: "Dual-surface customer visibility",
    description:
      "Keep shipments visible in public tracking and in the shared HenryCo account with documents, notifications, and support continuity.",
    pros: ["Future-proof account strategy", "Better customer memory"],
    cons: ["Requires disciplined mirroring"],
    difficulty: "high",
    innovationScore: 9,
  },
];

export const DEFAULT_LOGISTICS_ZONES: LogisticsZone[] = [
  {
    id: "zone-enugu-urban",
    key: "enugu_urban",
    name: "Enugu Urban",
    summary: "Fast inner-city pickups and drops within the core urban delivery ring.",
    city: "Enugu",
    region: "Enugu",
    baseFee: 3000,
    sameDayMultiplier: 1.25,
    interCityMultiplier: 1,
    etaHoursMin: 2,
    etaHoursMax: 6,
    active: true,
    sortOrder: 10,
  },
  {
    id: "zone-enugu-outskirts",
    key: "enugu_outskirts",
    name: "Enugu Outskirts",
    summary: "Extended metro edges and longer in-state dispatch lanes.",
    city: "Enugu",
    region: "Enugu",
    baseFee: 4500,
    sameDayMultiplier: 1.35,
    interCityMultiplier: 1.1,
    etaHoursMin: 4,
    etaHoursMax: 10,
    active: true,
    sortOrder: 20,
  },
  {
    id: "zone-other-igbo-states",
    key: "other_igbo_states",
    name: "Other Igbo States",
    summary: "Governed inter-city movement across nearby regional lanes.",
    city: "Regional",
    region: "South East",
    baseFee: 8500,
    sameDayMultiplier: 1.5,
    interCityMultiplier: 1.45,
    etaHoursMin: 8,
    etaHoursMax: 24,
    active: true,
    sortOrder: 30,
  },
  {
    id: "zone-intercity-priority",
    key: "intercity_priority",
    name: "Inter-city Priority",
    summary: "Priority lane for governed same-day or next-window inter-city fulfillment.",
    city: "Regional",
    region: "Nigeria",
    baseFee: 12000,
    sameDayMultiplier: 1.75,
    interCityMultiplier: 1.65,
    etaHoursMin: 10,
    etaHoursMax: 36,
    active: true,
    sortOrder: 40,
  },
];

export const TIMELINE_LABELS: Record<string, string> = {
  quote_requested: "Quote requested",
  quoted: "Quoted",
  awaiting_payment: "Awaiting payment",
  booked: "Booked",
  assigned: "Rider assigned",
  pickup_confirmed: "Picked up",
  in_transit: "In transit",
  delayed: "Delayed",
  attempted_delivery: "Delivery attempted",
  delivered: "Delivered",
  failed_delivery: "Delivery failed",
  return_initiated: "Return started",
  returned: "Returned",
  cancelled: "Cancelled",
};

export const TIMELINE_DESCRIPTIONS: Record<string, string> = {
  quote_requested: "Shipment intent has been captured and is waiting for pricing validation.",
  quoted: "Pricing is ready and the shipment can move into booking when approved.",
  awaiting_payment: "The shipment is booked but waiting for payment confirmation.",
  booked: "The shipment is confirmed and waiting for dispatch assignment.",
  assigned: "A rider or dispatch operator has been attached to the shipment.",
  pickup_confirmed: "Pickup has been completed and the package is now inside the active delivery flow.",
  in_transit: "The shipment is moving through the route toward final handoff.",
  delayed: "The shipment is still active but has drifted from the planned promise window.",
  attempted_delivery: "A delivery attempt was made but completion is still open.",
  delivered: "Delivery is complete and proof has been captured.",
  failed_delivery: "The shipment could not be delivered and needs operator review.",
  return_initiated: "A return flow has started for the shipment.",
  returned: "The shipment has been returned to its origin or safe holding point.",
  cancelled: "The shipment was cancelled before completion.",
};
