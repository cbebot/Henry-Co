export type MarketplaceFaqCategory = {
  id: string;
  label: string;
  description: string;
  items: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
};

/**
 * MARKETPLACE_FAQS — static help centre content for CHROME-01B FIX 9.
 * Sourced from existing platform knowledge; can be migrated to a CMS
 * table in a later pass without changing the consumer surface.
 */
export const MARKETPLACE_FAQS: MarketplaceFaqCategory[] = [
  {
    id: "my-order",
    label: "My order",
    description: "Tracking, payments, deliveries, and missing items.",
    items: [
      {
        id: "track-order",
        question: "How do I track my order?",
        answer:
          "Open your account, go to Orders, and pick the order you want to follow. Each shipment shows its status, carrier and tracking code.",
      },
      {
        id: "delayed-delivery",
        question: "My delivery is late — what should I do?",
        answer:
          "If there is no update, open a support thread from the order page and include the tracking code.",
      },
      {
        id: "missing-item",
        question: "An item is missing from my order.",
        answer:
          "Open a dispute from Account → Disputes. The seller's payout is frozen while our team reviews it and arranges any refund.",
      },
      {
        id: "split-shipment",
        question: "Why did my order arrive in multiple packages?",
        answer:
          "Multi-vendor orders ship from each seller separately, and each shipment has its own tracking. You are only charged delivery once.",
      },
      {
        id: "payment-not-confirmed",
        question: "I paid but my order still says payment pending.",
        answer: "Open a support thread from the order and include your payment reference.",
      },
    ],
  },
  {
    id: "payment",
    label: "Payment",
    description: "Payment methods, protection, and currency.",
    items: [
      {
        id: "payment-methods",
        question: "What payment methods are accepted?",
        answer:
          "Pay by card (where available), Henry Onyx wallet, or cash on delivery. Cash on delivery is supported only on listings that explicitly opt in — look for the COD-eligible badge on the product page.",
      },
      {
        id: "payment-protection",
        question: "Is my payment protected?",
        answer:
          "Card and wallet payments are held until delivery is confirmed. Cash-on-delivery orders are paid to the rider and are not held. If something goes wrong, open a dispute and our team reviews it.",
      },
      {
        id: "duplicate-charge",
        question: "I was charged twice for the same order.",
        answer:
          "Open a support thread from the order and include both payment references. Our team reviews it and arranges any refund.",
      },
      {
        id: "currency",
        question: "What currency are prices shown in?",
        answer: "Prices are shown and charged in naira (NGN).",
      },
    ],
  },
  {
    id: "returns",
    label: "Returns",
    description: "Disputes and refunds.",
    items: [
      {
        id: "order-problem",
        question: "Problem with an order?",
        answer:
          "Open a dispute from Account → Disputes. The seller's payout is frozen while our team reviews it and arranges any refund.",
      },
    ],
  },
  {
    id: "sellers",
    label: "Sellers",
    description: "Onboarding, listings, payouts, and seller verification.",
    items: [
      {
        id: "become-seller",
        question: "How do I become a seller?",
        answer:
          "Apply through Sell on the marketplace. The application asks for your business details, sample products, and verification documents.",
      },
      {
        id: "listing-rules",
        question: "What can I list?",
        answer:
          "Anything legal in Nigeria, of demonstrably good quality, with accurate photos and descriptions. Counterfeit, expired, recalled, or stolen goods are not allowed.",
      },
      {
        id: "payout-schedule",
        question: "When do I get paid?",
        answer:
          "Request a payout from your releasable balance at any time. Funds become releasable when the buyer confirms, or 1–5 days after delivery (by tier). Every request is reviewed before release.",
      },
      {
        id: "seller-fees",
        question: "What fees do sellers pay?",
        answer:
          "Commission is 15%, 12% or 9% by trust tier, plus a payout processing fee (2% + ₦300, 1.5% + ₦250 or 1% + ₦250). Both are deducted from your settlement.",
      },
      {
        id: "seller-verification",
        question: "Why does my seller account need verification?",
        answer:
          "Verification is how buyers know they are dealing with a real, accountable seller. It unlocks higher listing limits and faster auto-release.",
      },
    ],
  },
  {
    id: "account",
    label: "Account",
    description: "Sign-in, profile, addresses, and account security.",
    items: [
      {
        id: "create-account",
        question: "How do I create a Henry Onyx account?",
        answer:
          "Tap Sign up and use your email or phone number. The account works across Henry Onyx — Marketplace, Care, Property, Logistics, Studio, Jobs, and Learn — so you only ever sign in once.",
      },
      {
        id: "forgot-password",
        question: "I forgot my password.",
        answer:
          "On the sign-in page, tap Forgot password and enter the email on the account. If the email never arrives, check spam and confirm the email address matches the one on file.",
      },
      {
        id: "addresses",
        question: "How do I manage delivery addresses?",
        answer:
          "Open Account → Addresses to add, edit, or remove addresses. The address selected at checkout becomes the default for that order.",
      },
      {
        id: "delete-account",
        question: "How do I delete my account?",
        answer:
          "Account → Privacy → Delete account. Deletion is permanent and removes your orders, addresses, saved items, and reviews. We retain anonymised purchase records as required by tax and dispute-resolution law.",
      },
    ],
  },
  {
    id: "trust-and-safety",
    label: "Trust and safety",
    description: "Counterfeits, scams, reviews, and reporting concerns.",
    items: [
      {
        id: "report-listing",
        question: "I think a listing is suspicious.",
        answer:
          "Open a support ticket with a link to the listing or seller and the reason — counterfeit, misleading, harmful, or other. We may follow up to ask for evidence.",
      },
      {
        id: "fake-reviews",
        question: "How do you keep reviews honest?",
        answer: "Reviews can be checked before they appear, and sellers cannot delete or edit them.",
      },
      {
        id: "buyer-protection",
        question: "What protects me as a buyer?",
        answer:
          "Card and wallet payments are held until delivery is confirmed. If something goes wrong, open a dispute and our team reviews it.",
      },
      {
        id: "data-privacy",
        question: "How is my personal data handled?",
        answer:
          "Your name, email, phone, and addresses are visible to you and the platform. Sellers see only what is needed to fulfil an order — name, delivery address, and phone for the courier — and never see your card or payment details.",
      },
      {
        id: "scam-message",
        question: "A seller messaged me asking to pay outside the platform.",
        answer:
          "Don't pay them. Off-platform payments lose all buyer protection and are usually a scam. Report it to us in a support ticket.",
      },
    ],
  },
];
