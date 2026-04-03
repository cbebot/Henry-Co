export const PUBLIC_NAV = [
  { label: "Services", href: "/services" },
  { label: "Pricing", href: "/pricing" },
  { label: "Business", href: "/business" },
  { label: "Quote", href: "/quote" },
  { label: "Book", href: "/book" },
  { label: "Track", href: "/track" },
  { label: "Support", href: "/support" },
] as const;

export const CUSTOMER_NAV = [
  { label: "Overview", href: "/customer" },
  { label: "Shipments", href: "/customer/shipments" },
  { label: "Support", href: "/support" },
] as const;

export const DISPATCH_NAV = [
  { label: "Dispatch", href: "/dispatch" },
  { label: "Queues", href: "/dispatch/queues" },
  { label: "Issues", href: "/dispatch/issues" },
  { label: "Riders", href: "/dispatch/riders" },
  { label: "Pricing", href: "/dispatch/pricing" },
] as const;

export const RIDER_NAV = [
  { label: "Overview", href: "/rider" },
  { label: "Pickups", href: "/rider/pickups" },
  { label: "Deliveries", href: "/rider/deliveries" },
  { label: "History", href: "/rider/history" },
  { label: "Expenses", href: "/rider/expenses" },
] as const;

export const SUPPORT_NAV = [
  { label: "Support", href: "/support" },
  { label: "Escalations", href: "/support/escalations" },
] as const;

export const OWNER_NAV = [
  { label: "Owner", href: "/owner" },
  { label: "Dispatch", href: "/dispatch" },
  { label: "Finance", href: "/finance" },
  { label: "Support", href: "/support" },
] as const;
