export type PageHelp = {
  title: string;
  description: string;
  tips: string[];
  faq: Array<{ question: string; answer: string }>;
};

const helpContent: Record<string, PageHelp> = {
  // Public pages
  "/": {
    title: "Home",
    description: "The main landing page for HenryCo Care. Here you can discover our services, see pricing highlights, read customer reviews, and find quick links to book or track a service.",
    tips: [
      "Use the navigation bar to explore services, pricing, and booking",
      "Scroll down to see featured services and customer reviews",
      "Click 'Book Now' to start your first service request",
    ],
    faq: [
      { question: "How do I get started?", answer: "Click 'Book Now' in the navigation or hero section to start a service request. You'll choose your service type, select items or packages, and provide your details." },
      { question: "Do I need an account?", answer: "No account is needed to book a service. You'll receive a tracking code via email to follow your order." },
    ],
  },
  "/services": {
    title: "Services",
    description: "Browse our three core service categories: Garment Care, Home Cleaning, and Office Cleaning. Each service includes detailed descriptions of what's covered.",
    tips: [
      "Compare service categories to find what fits your needs",
      "Check individual item pricing under each category",
      "Note that add-ons and modifiers can adjust the final price",
    ],
    faq: [
      { question: "What services do you offer?", answer: "We offer Garment Care (dry cleaning, laundry, pressing), Home Cleaning (one-time and recurring), and Office Cleaning (commercial spaces)." },
      { question: "Can I combine services?", answer: "Yes, you can book multiple service types in a single request." },
    ],
  },
  "/pricing": {
    title: "Pricing",
    description: "Transparent pricing for all our services. Home and office cleaning use package-based pricing, while garment care is priced per item.",
    tips: [
      "Package prices are starting rates — actual cost may vary based on property size and extras",
      "Garment prices are per individual item",
      "Add-ons like kitchen deep cleaning or upholstery care are available",
    ],
    faq: [
      { question: "Are there hidden fees?", answer: "No. Pricing is transparent and upfront. Any adjustments for property size or urgency are communicated before confirmation." },
    ],
  },
  "/book": {
    title: "Book a Service",
    description: "Complete the booking form to request a service. You'll select your service type, choose items or packages, provide your details, and submit.",
    tips: [
      "Fill in all required fields marked with an asterisk",
      "Double-check your contact information for accurate updates",
      "You'll receive a tracking code after submission",
      "Payment details will be shared after booking confirmation",
    ],
    faq: [
      { question: "What happens after I book?", answer: "You'll receive a confirmation email with a tracking code. Our team will review your request and confirm timing and pricing." },
      { question: "Can I cancel a booking?", answer: "Contact our support team through the contact page or reply to your confirmation email." },
    ],
  },
  "/track": {
    title: "Track Your Order",
    description: "Enter your tracking code or email to see the real-time status of your service. Every update from pickup to delivery is shown in a clear timeline.",
    tips: [
      "Your tracking code was sent to you via email after booking",
      "You can also search by the email address you used when booking",
      "Status updates appear in real time as your service progresses",
    ],
    faq: [
      { question: "Where is my tracking code?", answer: "Check the confirmation email you received after booking. The tracking code format is a short alphanumeric code." },
    ],
  },
  "/contact": {
    title: "Contact Us",
    description: "Reach out to our team with questions, concerns, or feedback. We respond promptly to all inquiries.",
    tips: [
      "Include your tracking code if your question is about an existing order",
      "Be specific about your issue for a faster resolution",
      "You can also reach us by phone during business hours",
    ],
    faq: [
      { question: "How fast will I get a response?", answer: "We aim to respond within a few hours during business hours (Mon-Sat, 8 AM - 7 PM)." },
    ],
  },
  // Owner pages
  "/owner": {
    title: "Owner Overview",
    description: "Your command center showing live business metrics: revenue, bookings, payments, staff readiness, and service pressure.",
    tips: [
      "Check this dashboard first thing each day",
      "Red or amber metrics indicate areas needing attention",
      "Click through to specific sections for detailed management",
    ],
    faq: [
      { question: "What do the metric colors mean?", answer: "Green indicates healthy status, amber means attention is needed, and red signals urgent action required." },
    ],
  },
  "/owner/staff": {
    title: "Staff Management",
    description: "Create, manage, and control staff accounts. Assign roles, send invitations, freeze or deactivate accounts as needed.",
    tips: [
      "Always assign the correct role — it controls what each staff member can access",
      "Use the 'Repair' action if a staff member's profile is out of sync",
      "Deactivated accounts cannot log in but their history is preserved",
    ],
    faq: [
      { question: "What roles are available?", answer: "Owner, Manager, Support, Rider, and Staff. Each role has specific permissions and dashboard access." },
    ],
  },
  "/owner/security": {
    title: "Security & Audit",
    description: "Monitor all security events, login activity, WhatsApp health, and staff actions. Every significant action is logged here.",
    tips: [
      "Review the audit log regularly for unusual activity",
      "Check WhatsApp health status if customer messages are not being delivered",
      "Use the staff lifecycle controls to manage active sessions",
    ],
    faq: [],
  },
  "/owner/pricing": {
    title: "Pricing Governance",
    description: "Review and approve pricing changes proposed by managers. You have final authority over all published pricing.",
    tips: [
      "Pending proposals appear in your approval inbox",
      "Review the proposed changes against current pricing before approving",
      "Add decision notes to maintain a clear audit trail",
    ],
    faq: [],
  },
  // Support pages
  "/support/inbox": {
    title: "Support Inbox",
    description: "Your primary workspace for managing customer conversations. Browse, filter, and respond to threads.",
    tips: [
      "Start with urgent and stale threads — they need attention first",
      "Use the filter bar to narrow by status or assignee",
      "Click a thread to see full details and conversation history",
      "Use the Reply action to open a focused reply workspace",
    ],
    faq: [
      { question: "What does 'stale' mean?", answer: "A thread is stale when it has had no activity for 12+ hours. These need a response to maintain customer trust." },
      { question: "What statuses are available?", answer: "New, Open, Pending Customer (waiting for their reply), and Resolved. Use status changes to keep the queue organized." },
    ],
  },
  "/support/payments": {
    title: "Payment Reviews",
    description: "Review customer payment proof submissions. Approve valid payments, request corrections, or reject fraudulent submissions.",
    tips: [
      "Verify the amount matches the booking total",
      "Check that the payment reference is legible",
      "Use 'Request More' if the proof is unclear rather than rejecting immediately",
    ],
    faq: [],
  },
  // Manager pages
  "/manager": {
    title: "Manager Overview",
    description: "Your daily execution dashboard showing queue pressure, pending tasks, and staffing readiness.",
    tips: [
      "Check this dashboard each morning to plan your day",
      "Focus on items with the highest urgency first",
      "Coordinate with support for customer-facing issues",
    ],
    faq: [],
  },
  "/manager/operations": {
    title: "Operations Queue",
    description: "Manage the full booking pipeline: intake, processing, status updates, and completion.",
    tips: [
      "Process bookings in order of creation unless urgency overrides",
      "Update status promptly so customers see accurate tracking",
      "Flag any issues early to prevent escalation",
    ],
    faq: [],
  },
  "/manager/pricing": {
    title: "Pricing Proposals",
    description: "Draft and submit pricing changes for owner approval. You cannot publish directly.",
    tips: [
      "Base proposals on actual cost changes or market conditions",
      "Include clear reasoning in your proposal notes",
      "Check the published pricing reference before drafting changes",
    ],
    faq: [],
  },
  // Rider pages
  "/rider": {
    title: "Rider Overview",
    description: "Your route health dashboard showing active volume, pending pickups, and delivery queue.",
    tips: [
      "Plan your route at the start of each shift",
      "Mark items as collected immediately upon pickup",
      "Log fuel and transport expenses promptly",
    ],
    faq: [],
  },
  // Staff pages
  "/staff": {
    title: "Staff Overview",
    description: "Your service readiness dashboard showing today's visit load and upcoming assignments.",
    tips: [
      "Check assignments first thing each day",
      "Read special instructions before each visit",
      "Update visit status as soon as you complete each one",
    ],
    faq: [],
  },
};

export function getHelpForRoute(pathname: string): PageHelp | null {
  // Try exact match first
  if (helpContent[pathname]) return helpContent[pathname];

  // Try parent path
  const segments = pathname.split("/").filter(Boolean);
  while (segments.length > 0) {
    const parent = "/" + segments.join("/");
    if (helpContent[parent]) return helpContent[parent];
    segments.pop();
  }

  return helpContent["/"] || null;
}
