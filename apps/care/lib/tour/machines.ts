import type { TourMachine } from "./engine";

export const publicTour: TourMachine = {
  id: "care-public",
  version: 1,
  name: "Welcome to HenryCo Care",
  description: "Learn how to use our premium care services",
  steps: [
    {
      id: "welcome",
      title: "Welcome to HenryCo Care",
      body: "We provide premium garment care, home cleaning, and office cleaning services. Let us show you around so you feel confident using our platform.",
      placement: "center",
    },
    {
      id: "services",
      title: "Our Services",
      body: "We offer three core services: Garment Care for your clothes, Home Cleaning for residential spaces, and Office Cleaning for workplaces. Each comes with transparent pricing and professional execution.",
      route: "/services",
      placement: "center",
    },
    {
      id: "pricing",
      title: "Clear, Transparent Pricing",
      body: "Every service has upfront pricing. Home and office cleaning use package-based pricing, while garment care is priced per item. No hidden fees, no surprises.",
      route: "/pricing",
      placement: "center",
    },
    {
      id: "booking",
      title: "Book a Service",
      body: "Ready to get started? Our booking form guides you step by step. Choose your service, pick your items or package, set your preferred date, and submit. You will receive a confirmation with your tracking code.",
      route: "/book",
      placement: "center",
    },
    {
      id: "tracking",
      title: "Track Your Order",
      body: "After booking, use your tracking code or email to follow your service progress in real time. You will see every status update from pickup to delivery.",
      route: "/track",
      placement: "center",
    },
    {
      id: "contact",
      title: "Get Support Anytime",
      body: "Have questions or need help? Our contact page lets you reach us by email, phone, or through a support request. We aim to respond within hours, not days.",
      route: "/contact",
      placement: "center",
    },
    {
      id: "review",
      title: "Share Your Experience",
      body: "After your service is complete, we would love your feedback. Your review helps us improve and helps other customers make confident decisions.",
      route: "/review",
      placement: "center",
    },
    {
      id: "complete",
      title: "You are all set!",
      body: "You now know everything you need to use HenryCo Care confidently. Book your first service, track your order, and reach out anytime you need help. We are here for you.",
      placement: "center",
      actionLabel: "Book your first service",
      actionHref: "/book",
    },
  ],
};

export const ownerTour: TourMachine = {
  id: "care-owner",
  version: 1,
  name: "Owner Command Center",
  description: "Master your business operations dashboard",
  steps: [
    {
      id: "welcome",
      title: "Welcome to your Command Center",
      body: "This is your operational headquarters. From here you have complete visibility over finance, service performance, staffing, and company health. Let us walk through the key areas.",
      placement: "center",
    },
    {
      id: "overview",
      title: "Dashboard Overview",
      body: "Your overview shows live metrics: revenue, active bookings, pending payments, staff readiness, and service pressure. Use this as your daily starting point to identify what needs attention.",
      route: "/owner",
      placement: "center",
    },
    {
      id: "bookings",
      title: "Booking Management",
      body: "View and manage all customer bookings. Track payment status, service progress, and delivery timelines. You can search, filter, and take action on any booking from here.",
      route: "/owner/bookings",
      placement: "center",
    },
    {
      id: "staff",
      title: "Staff Management",
      body: "Create staff accounts, assign roles, manage access, and monitor team readiness. You control who has access to what. Every change is audit-logged for your security.",
      route: "/owner/staff",
      placement: "center",
    },
    {
      id: "pricing-control",
      title: "Pricing Governance",
      body: "You have final authority over all pricing. Managers can propose changes, but only you can approve them. This ensures pricing consistency and prevents unauthorized discounts.",
      route: "/owner/pricing",
      placement: "center",
    },
    {
      id: "security",
      title: "Security & Audit",
      body: "Monitor login activity, WhatsApp delivery health, and a complete audit trail of every significant action. This is your compliance and accountability center.",
      route: "/owner/security",
      placement: "center",
    },
    {
      id: "finance",
      title: "Financial Oversight",
      body: "Track revenue, expenses, margins, and cash flow. Review expense submissions from staff and approve or flag them. Your financial picture, always current.",
      route: "/owner/finance",
      placement: "center",
    },
    {
      id: "complete",
      title: "You are in control",
      body: "You now know your way around the command center. Use the sidebar navigation to move between areas. Notifications will alert you to anything that needs your attention.",
      placement: "center",
    },
  ],
};

export const managerTour: TourMachine = {
  id: "care-manager",
  version: 1,
  name: "Operations Manager Guide",
  description: "Learn your daily operational workflow",
  steps: [
    {
      id: "welcome",
      title: "Welcome, Operations Manager",
      body: "Your role is daily execution: moving bookings through the pipeline, coordinating staff, managing intake quality, and keeping the operation running smoothly.",
      placement: "center",
    },
    {
      id: "overview",
      title: "Your Daily Overview",
      body: "Start here each day. Your overview shows queue pressure, pending tasks, and staffing gaps. Address items in priority order to keep the operation flowing.",
      route: "/manager",
      placement: "center",
    },
    {
      id: "operations",
      title: "Operations Queue",
      body: "This is your primary workspace. Manage booking intake, update service status, coordinate pickups and deliveries, and ensure nothing falls through the cracks.",
      route: "/manager/operations",
      placement: "center",
    },
    {
      id: "pricing",
      title: "Pricing Proposals",
      body: "You can draft pricing changes and submit them for owner approval. You cannot publish directly — this ensures pricing discipline across the company.",
      route: "/manager/pricing",
      placement: "center",
    },
    {
      id: "complete",
      title: "Ready to operate",
      body: "You are set up for daily execution. Check your overview each morning, work through the operations queue, and use notifications to catch escalations early.",
      placement: "center",
    },
  ],
};

export const supportTour: TourMachine = {
  id: "care-support",
  version: 1,
  name: "Support Agent Guide",
  description: "Master customer conversation management",
  steps: [
    {
      id: "welcome",
      title: "Welcome to Support",
      body: "You are the voice of HenryCo Care. Your job is to respond to customers promptly, resolve issues thoroughly, and ensure every interaction builds trust.",
      placement: "center",
    },
    {
      id: "overview",
      title: "Support Overview",
      body: "Your dashboard shows response pressure, stale threads, and channel readiness. Use this to prioritize which conversations need attention first.",
      route: "/support",
      placement: "center",
    },
    {
      id: "inbox",
      title: "Support Inbox",
      body: "This is your main workspace. Browse threads, filter by status or assignee, and select a conversation to view details. Urgent and stale threads are highlighted so you can triage effectively.",
      route: "/support/inbox",
      placement: "center",
    },
    {
      id: "payments",
      title: "Payment Reviews",
      body: "When customers submit payment proof, it arrives here. Review the evidence, approve valid payments, request corrections, or reject fraudulent submissions.",
      route: "/support/payments",
      placement: "center",
    },
    {
      id: "reviews",
      title: "Review Moderation",
      body: "Customer reviews need your approval before going public. Read each review, approve genuine feedback, and reject inappropriate content to protect the brand.",
      route: "/support/reviews",
      placement: "center",
    },
    {
      id: "complete",
      title: "You are ready to help",
      body: "Start each shift by checking your inbox for stale or urgent threads. Reply promptly, escalate when needed, and keep internal notes for your teammates.",
      placement: "center",
    },
  ],
};

export const riderTour: TourMachine = {
  id: "care-rider",
  version: 1,
  name: "Rider Guide",
  description: "Navigate your pickup and delivery workflow",
  steps: [
    {
      id: "welcome",
      title: "Welcome, Rider",
      body: "Your role is pickup and delivery movement. This dashboard keeps your routes clear and your tasks organized so you can focus on efficient, reliable service.",
      placement: "center",
    },
    {
      id: "overview",
      title: "Route Overview",
      body: "Your overview shows today's active volume, pending pickups, and delivery queue. Start here to plan your route each day.",
      route: "/rider",
      placement: "center",
    },
    {
      id: "pickups",
      title: "Pickups Queue",
      body: "Collection-ready requests appear here grouped by urgency. Mark pickups as completed when items are in hand.",
      route: "/rider/pickups",
      placement: "center",
    },
    {
      id: "deliveries",
      title: "Deliveries Queue",
      body: "Return deliveries and completion confirmations. Update each delivery as you complete it to keep the customer timeline accurate.",
      route: "/rider/deliveries",
      placement: "center",
    },
    {
      id: "complete",
      title: "Ride safe",
      body: "Check your queues regularly, update statuses promptly, and log any route expenses. Your updates keep customers informed in real time.",
      placement: "center",
    },
  ],
};

export const staffTour: TourMachine = {
  id: "care-staff",
  version: 1,
  name: "Service Staff Guide",
  description: "Your assignment and execution workflow",
  steps: [
    {
      id: "welcome",
      title: "Welcome to your workspace",
      body: "You handle home and office service execution. This dashboard shows your assigned visits, service details, and history so you can deliver consistent, high-quality work.",
      placement: "center",
    },
    {
      id: "overview",
      title: "Service Overview",
      body: "Your overview shows today's visit load, upcoming assignments, and recurring cadence health. Start here to see what is on your plate.",
      route: "/staff",
      placement: "center",
    },
    {
      id: "assignments",
      title: "Active Assignments",
      body: "Your current service assignments appear here in priority order. Each assignment shows the customer, location, service type, and any special instructions.",
      route: "/staff/assignments",
      placement: "center",
    },
    {
      id: "complete",
      title: "Deliver with care",
      body: "Check your assignments daily, follow any special instructions, and update each visit status as you complete it. Your professionalism is what customers remember.",
      placement: "center",
    },
  ],
};

export function getTourForScope(scope: string): TourMachine | null {
  switch (scope) {
    case "public": return publicTour;
    case "owner": return ownerTour;
    case "manager": return managerTour;
    case "support": return supportTour;
    case "rider": return riderTour;
    case "staff": return staffTour;
    default: return null;
  }
}
