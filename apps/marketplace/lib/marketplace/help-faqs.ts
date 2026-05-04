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
          "Open your account, go to Orders, and pick the order you want to follow. Each shipment shows its current milestone, the assigned carrier, and the delivery window. Split shipments appear as separate cards under the same order, so a partial delivery is never a surprise.",
      },
      {
        id: "delayed-delivery",
        question: "My delivery is late — what should I do?",
        answer:
          "Wait until the end of the delivery window shown on the shipment card. If the window has passed and there is still no update, open a support thread from the order page. Include the tracking code; the message routes straight to the dispatch desk with full context.",
      },
      {
        id: "missing-item",
        question: "An item is missing from my order.",
        answer:
          "Open the order, tap Report a problem on the affected item, and choose Missing item. Attach a photo of the package contents if you have one. Most missing-item claims are resolved within one business day with a refund or replacement, depending on stock.",
      },
      {
        id: "split-shipment",
        question: "Why did my order arrive in multiple packages?",
        answer:
          "Multi-vendor orders ship from each seller separately so nothing waits in a warehouse for slower items. The order page shows one card per shipment with its own tracking and ETA. You are only charged delivery once.",
      },
      {
        id: "payment-not-confirmed",
        question: "I paid but my order still says payment pending.",
        answer:
          "Bank transfers can take up to 30 minutes to clear. If you used a transfer, your order will progress automatically once the payment lands. If it has been over an hour, open a support thread from the order and include your payment reference.",
      },
    ],
  },
  {
    id: "payment",
    label: "Payment",
    description: "Cards, transfers, refunds, and payment protection.",
    items: [
      {
        id: "payment-methods",
        question: "What payment methods are accepted?",
        answer:
          "Card, bank transfer, and HenryCo wallet. Cash on delivery is supported only on listings that explicitly opt in — look for the COD-eligible badge on the product page.",
      },
      {
        id: "payment-protection",
        question: "Is my payment protected?",
        answer:
          "Yes. Your payment sits in a held state until the seller confirms shipment and the carrier confirms hand-off. If something goes wrong, support can reverse the held payment from inside the order thread without you having to chase a bank.",
      },
      {
        id: "refund-timing",
        question: "How long do refunds take?",
        answer:
          "Wallet refunds are instant. Card refunds typically clear in 3–7 business days, depending on your bank. Bank transfer refunds clear within 1–3 business days. The order page shows the current refund status throughout.",
      },
      {
        id: "duplicate-charge",
        question: "I was charged twice for the same order.",
        answer:
          "Open the order and check the payments tab — what often looks like a duplicate is an authorisation that has not yet released. If a true duplicate has settled, support can reverse the second charge inside the order thread.",
      },
      {
        id: "currency",
        question: "What currency are prices shown in?",
        answer:
          "Prices and totals on the marketplace are quoted in NGN. Settlement is also in NGN. Cross-border buyers see their local equivalent at checkout but settle the NGN amount.",
      },
    ],
  },
  {
    id: "returns",
    label: "Returns",
    description: "Eligibility, timelines, and how to start a return.",
    items: [
      {
        id: "return-window",
        question: "How long do I have to return an item?",
        answer:
          "Most items can be returned within 7 days of delivery. Some categories — perishables, intimate-wear, custom-made — are not return-eligible and the product page makes that clear before checkout.",
      },
      {
        id: "start-return",
        question: "How do I start a return?",
        answer:
          "Open the order, tap Start a return on the item, and choose the reason. The seller reviews and either approves or asks for clarification within 24 hours. Once approved, you get a free pickup or drop-off label.",
      },
      {
        id: "return-condition",
        question: "What condition do items need to be in?",
        answer:
          "Items must be unused, in their original packaging, with all included accessories. Items returned in worse condition are reviewed case by case and may receive a partial refund.",
      },
      {
        id: "return-shipping",
        question: "Who pays the return shipping?",
        answer:
          "If the return is due to a seller error — wrong item, defective, or not as described — return shipping is on the seller. If you simply changed your mind, return shipping is deducted from your refund.",
      },
      {
        id: "exchange",
        question: "Can I exchange instead of returning?",
        answer:
          "Yes, when the seller has the size or variant in stock. Choose Exchange from the return flow and pick the variant you want. If the new variant costs more, you pay the difference; if it costs less, the difference is refunded.",
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
          "Apply through Sell on the marketplace. The application asks for your business details, sample products, and verification documents. Most applications are reviewed within 3 business days.",
      },
      {
        id: "listing-rules",
        question: "What can I list?",
        answer:
          "Anything legal in Nigeria, of demonstrably good quality, with accurate photos and descriptions. Counterfeit, expired, recalled, or stolen goods are removed and the listing seller is suspended.",
      },
      {
        id: "payout-schedule",
        question: "When do I get paid?",
        answer:
          "Payouts run weekly on Mondays for all orders confirmed delivered the previous week, after the 7-day return window has closed. Higher-volume sellers can request a daily payout cadence after 90 days of clean operations.",
      },
      {
        id: "seller-fees",
        question: "What fees do sellers pay?",
        answer:
          "A flat platform commission applies per sold item; the rate appears in your seller dashboard before you confirm a listing. Payment processing is included in the commission — no separate gateway fees.",
      },
      {
        id: "seller-verification",
        question: "Why does my seller account need verification?",
        answer:
          "Verification is how buyers know they are dealing with a real, accountable seller. The verified badge on your store and listings increases trust and conversion. Verification also unlocks higher payout limits.",
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
        question: "How do I create a HenryCo account?",
        answer:
          "Tap Sign up and use your email or phone number. The account works across the entire HenryCo group — Marketplace, Care, Property, Logistics, Studio, Jobs, and Learn — so you only ever sign in once.",
      },
      {
        id: "forgot-password",
        question: "I forgot my password.",
        answer:
          "On the sign-in page, tap Forgot password and enter the email on the account. We send a reset link that expires in 30 minutes for security. If the email never arrives, check spam and confirm the email address matches the one on file.",
      },
      {
        id: "addresses",
        question: "How do I manage delivery addresses?",
        answer:
          "Open Account → Addresses to add, edit, or remove addresses. The address selected at checkout becomes the default for that order. Addresses are scoped to your account, not the device, so they follow you across browsers and phones.",
      },
      {
        id: "two-factor",
        question: "How do I turn on two-factor authentication?",
        answer:
          "Account → Security → Two-factor. We support authenticator apps and SMS. Authenticator apps are recommended because they continue to work even when your SIM is swapped or your phone is offline.",
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
          "Tap Report on the listing or seller page and choose the closest reason — counterfeit, misleading, harmful, or other. Reports go to trust review and are usually triaged within 24 hours. We may follow up to ask for evidence.",
      },
      {
        id: "fake-reviews",
        question: "How do you keep reviews honest?",
        answer:
          "Reviews can only be left by buyers who actually completed a purchase, and rating-manipulation patterns are flagged automatically. Sellers cannot delete or edit reviews; they can reply once and escalate to trust if a review breaks the policy.",
      },
      {
        id: "buyer-protection",
        question: "What protects me as a buyer?",
        answer:
          "Held payments, verified sellers, a 7-day return window, and an open dispute path. If a seller goes silent on a dispute, support steps in within 48 hours to resolve it.",
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
          "Don't pay them. Off-platform payments lose all buyer protection and are usually a scam. Report the message from the chat thread; the seller will be removed if confirmed and you keep your payment safety.",
      },
    ],
  },
];
