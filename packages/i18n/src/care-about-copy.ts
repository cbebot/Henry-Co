import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * CareAboutCopy — i18n surface for the public Care about page
 * (`apps/care/app/(public)/about/page.tsx`). Covers metadata, editorial hero
 * with CTAs and stat facts, three service lanes, standards bullets,
 * step-by-step flow, expectation reasons, and the closing CTA band.
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each locale is
 * a DeepPartial that deep-merges over EN so missing keys fall back to EN
 * silently at runtime. Mirrors the shape of `care-services-copy.ts`.
 */
export type CareAboutCopy = {
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    body: string;
    bookCta: string;
    contactCta: string;
  };
  heroFacts: {
    serviceHoursLabel: string;
    careDeskLabel: string;
    serviceOptionsLabel: string;
    pickupHoursFallback: string;
    /** Template with `{lines}` and `{packages}` placeholders. */
    linesPackagesTemplate: string;
  };
  lanes: {
    eyebrow: string;
    garmentCare: {
      title: string;
      body: string;
    };
    homeCleaning: {
      title: string;
      body: string;
    };
    officeCleaning: {
      title: string;
      body: string;
    };
  };
  standards: {
    eyebrow: string;
    title: string;
    bullets: readonly [string, string, string, string];
  };
  flow: {
    eyebrow: string;
    title: string;
    stepLabel: string;
    steps: readonly [
      { title: string; body: string },
      { title: string; body: string },
      { title: string; body: string },
      { title: string; body: string },
    ];
  };
  reasons: {
    eyebrow: string;
    pickupDelivery: {
      title: string;
      body: string;
    };
    qualityStandards: {
      title: string;
      body: string;
    };
    convenience: {
      title: string;
      body: string;
    };
  };
  closingCta: {
    eyebrow: string;
    title: string;
    body: string;
    bookCta: string;
    exploreCta: string;
  };
};

const CARE_ABOUT_COPY_EN: CareAboutCopy = {
  metadata: {
    title: "About HenryCo Care",
    description:
      "Learn how HenryCo Care delivers premium garment care, home cleaning, office cleaning, and dependable service follow-through.",
  },
  hero: {
    eyebrow: "About HenryCo Care",
    title: "Trust. Timing. Service quality.",
    body: "HenryCo Care provides garment care, pickup and delivery, home cleaning, office cleaning, and recurring service plans through one polished customer experience — dependable execution, respectful handling, a finish clients are happy to invite back.",
    bookCta: "Book a service",
    contactCta: "Contact the team",
  },
  heroFacts: {
    serviceHoursLabel: "Service hours",
    careDeskLabel: "Care desk",
    serviceOptionsLabel: "Service options",
    pickupHoursFallback: "Mon - Sat • 8:00 AM to 7:00 PM",
    linesPackagesTemplate: "{lines} lines · {packages} package plans",
  },
  lanes: {
    eyebrow: "Three service lanes",
    garmentCare: {
      title: "Garment care",
      body: "From daily wardrobe essentials to delicate pieces — cleaning, stain treatment, pressing, finishing, and return delivery handled with precision.",
    },
    homeCleaning: {
      title: "Home cleaning",
      body: "Homes are cared for with clear arrival windows, thoughtful service notes, and a finish designed to feel calm, fresh, and genuinely complete.",
    },
    officeCleaning: {
      title: "Office cleaning",
      body: "Workplaces receive reliable cleaning support with professional timing, organised site handling, and continuity businesses can count on.",
    },
  },
  standards: {
    eyebrow: "Why clients trust HenryCo Care",
    title: "Reliable service comes from standards clients can actually feel.",
    bullets: [
      "Clear communication before pickup, before arrival, and during every important update.",
      "Professional handling for garments, homes, and workplaces with the right context for each service type.",
      "Recurring service options that make long-term care easier to manage and easier to trust.",
      "One care desk that keeps follow-up documented instead of scattered across channels.",
    ],
  },
  flow: {
    eyebrow: "How the experience works",
    title: "Smooth for the client, disciplined behind the scenes.",
    stepLabel: "Step",
    steps: [
      {
        title: "Book the right service",
        body: "Choose garment care, home cleaning, or office cleaning and share the timing, address, and service notes that matter.",
      },
      {
        title: "Receive clear confirmation",
        body: "You receive confirmation, booking details, payment guidance where relevant, and a tracking code for follow-up.",
      },
      {
        title: "Service is carried out professionally",
        body: "Garments move through pickup and delivery. Homes and offices move through arrival, on-site work, and completion.",
      },
      {
        title: "Stay informed until the end",
        body: "Tracking and email updates keep the next step clear, whether that means return delivery or a completed visit.",
      },
    ],
  },
  reasons: {
    eyebrow: "What you can expect",
    pickupDelivery: {
      title: "Pickup and delivery",
      body: "Garment care includes controlled pickup, treatment, finishing, and return delivery so customers can follow the order from start to finish.",
    },
    qualityStandards: {
      title: "Quality standards",
      body: "Whether the service happens in a wardrobe, a home, or a workplace, the result should feel consistent, careful, and professionally finished.",
    },
    convenience: {
      title: "Convenience without compromise",
      body: "Recurring plans, clear updates, and premium support make it easier to keep garments, homes, and workplaces in excellent condition.",
    },
  },
  closingCta: {
    eyebrow: "Ready to experience HenryCo Care?",
    title: "Book a premium care service with timing, clarity, and follow-through built in.",
    body: "From garment pickup and delivery to recurring home and office cleaning, HenryCo Care is built to make dependable service feel easy.",
    bookCta: "Book a service",
    exploreCta: "Explore services",
  },
};

const CARE_ABOUT_COPY_FR: DeepPartial<CareAboutCopy> = {};
const CARE_ABOUT_COPY_ES: DeepPartial<CareAboutCopy> = {};
const CARE_ABOUT_COPY_PT: DeepPartial<CareAboutCopy> = {};
const CARE_ABOUT_COPY_AR: DeepPartial<CareAboutCopy> = {};
const CARE_ABOUT_COPY_DE: DeepPartial<CareAboutCopy> = {};
const CARE_ABOUT_COPY_IT: DeepPartial<CareAboutCopy> = {};
const CARE_ABOUT_COPY_ZH: DeepPartial<CareAboutCopy> = {};
const CARE_ABOUT_COPY_HI: DeepPartial<CareAboutCopy> = {};
const CARE_ABOUT_COPY_IG: DeepPartial<CareAboutCopy> = {};
const CARE_ABOUT_COPY_YO: DeepPartial<CareAboutCopy> = {};
const CARE_ABOUT_COPY_HA: DeepPartial<CareAboutCopy> = {};

const CARE_ABOUT_LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<CareAboutCopy>>> = {
  fr: CARE_ABOUT_COPY_FR,
  es: CARE_ABOUT_COPY_ES,
  pt: CARE_ABOUT_COPY_PT,
  ar: CARE_ABOUT_COPY_AR,
  de: CARE_ABOUT_COPY_DE,
  it: CARE_ABOUT_COPY_IT,
  zh: CARE_ABOUT_COPY_ZH,
  hi: CARE_ABOUT_COPY_HI,
  ig: CARE_ABOUT_COPY_IG,
  yo: CARE_ABOUT_COPY_YO,
  ha: CARE_ABOUT_COPY_HA,
};

export function getCareAboutCopy(locale: AppLocale): CareAboutCopy {
  const overrides = CARE_ABOUT_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      CARE_ABOUT_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as CareAboutCopy;
  }
  return CARE_ABOUT_COPY_EN;
}

/** @internal */
export function __dangerouslyGetEnglishCareAboutCopy(): CareAboutCopy {
  return CARE_ABOUT_COPY_EN;
}
