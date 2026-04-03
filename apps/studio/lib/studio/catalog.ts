import "server-only";

import { hasAdminSupabaseEnv } from "@/lib/supabase";
import {
  getStudioCaseStudyBySlug as getSeedCaseStudyBySlug,
  getStudioServiceBySlug as getSeedServiceBySlug,
  getStudioTeamBySlug as getSeedTeamBySlug,
  studioCaseStudies,
  studioCaseStudySlug,
  studioDifferentiators,
  studioFaqs,
  studioPackageSlug,
  studioPackages,
  studioProcess,
  studioServiceSlug,
  studioServices,
  studioTeamSlug,
  studioTeams,
  studioTestimonials,
  studioTrustSignals,
  studioValueComparisons,
} from "@/lib/studio/content";
import { cleanText } from "@/lib/studio/store";
import { readStudioCollection, upsertStudioCollectionRecord } from "@/lib/studio/store";
import type {
  StudioCaseStudy,
  StudioDifferentiator,
  StudioFaqItem,
  StudioPackage,
  StudioService,
  StudioTeamProfile,
  StudioTestimonial,
  StudioValueComparison,
} from "@/lib/studio/types";

type StudioCatalog = {
  services: StudioService[];
  packages: StudioPackage[];
  teams: StudioTeamProfile[];
  caseStudies: StudioCaseStudy[];
  differentiators: StudioDifferentiator[];
  faqs: StudioFaqItem[];
  testimonials: StudioTestimonial[];
  process: string[];
  trustSignals: string[];
  valueComparisons: StudioValueComparison[];
  platform: Record<string, unknown>;
};

type GetStudioCatalogOptions = {
  includeUnpublished?: boolean;
};

type SettingRow = {
  key: string;
  value: unknown;
};

const FAQ_KEY = "public_faqs";
const TESTIMONIAL_KEY = "public_testimonials";
const PROCESS_KEY = "public_process";
const TRUST_KEY = "public_trust_signals";
const COMPARISON_KEY = "public_value_comparisons";
const DIFFERENTIATOR_KEY = "public_differentiators";
const CASE_STUDY_KEY = "public_case_studies";

function defaultFaqs(): StudioFaqItem[] {
  return studioFaqs.map((item, index) => ({
    id: `faq-${index + 1}`,
    question: item.question,
    answer: item.answer,
  }));
}

function defaultTestimonials(): StudioTestimonial[] {
  return studioTestimonials.map((item, index) => ({
    id: `testimonial-${index + 1}`,
    name: item.name,
    quote: item.quote,
    company: null,
  }));
}

function defaultServices(): StudioService[] {
  return studioServices.map((service) => ({
    ...service,
    slug: studioServiceSlug(service),
    isPublished: true,
  }));
}

function defaultPackages(): StudioPackage[] {
  return studioPackages.map((pkg) => ({
    ...pkg,
    slug: studioPackageSlug(pkg),
    isPublished: true,
  }));
}

function defaultTeams(): StudioTeamProfile[] {
  return studioTeams.map((team) => ({
    ...team,
    slug: studioTeamSlug(team),
    isPublished: true,
  }));
}

function maybePublished<T extends { isPublished?: boolean }>(
  items: T[],
  includeUnpublished?: boolean
) {
  return includeUnpublished ? items : items.filter((item) => item.isPublished !== false);
}

function asTextList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanText(item)).filter(Boolean);
}

function asRecordArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function mapServiceRow(row: Record<string, unknown>): StudioService {
  return {
    id: cleanText(row.id),
    slug: cleanText(row.slug) || undefined,
    kind: cleanText(row.kind) as StudioService["kind"],
    name: cleanText(row.name),
    headline: cleanText(row.headline),
    summary: cleanText(row.summary),
    startingPrice: Number(row.starting_price ?? row.startingPrice ?? 0),
    deliveryWindow: cleanText(row.delivery_window ?? row.deliveryWindow),
    stack: asTextList(row.stack),
    isPublished: row.is_published !== false,
    outcomes: asTextList(row.outcomes),
    scoreBoosts: asTextList(row.score_boosts ?? row.scoreBoosts),
  };
}

function mapPackageRow(row: Record<string, unknown>): StudioPackage {
  return {
    id: cleanText(row.id),
    slug: cleanText(row.slug) || undefined,
    serviceId: cleanText(row.service_id ?? row.serviceId),
    name: cleanText(row.name),
    summary: cleanText(row.summary),
    price: Number(row.price ?? 0),
    depositRate: Number(row.deposit_rate ?? row.depositRate ?? 0.4),
    timelineWeeks: Number(row.timeline_weeks ?? row.timelineWeeks ?? 1),
    bestFor: cleanText(row.best_for ?? row.bestFor),
    includes: asTextList(row.includes),
    isPublished: row.is_published !== false,
  };
}

function mapTeamRow(row: Record<string, unknown>): StudioTeamProfile {
  return {
    id: cleanText(row.id),
    slug: cleanText(row.slug) || undefined,
    name: cleanText(row.name),
    label: cleanText(row.label),
    summary: cleanText(row.summary),
    availability: cleanText(row.availability) as StudioTeamProfile["availability"],
    focus: asTextList(row.focus),
    industries: asTextList(row.industries),
    stack: asTextList(row.stack),
    highlights: asTextList(row.highlights),
    scoreBiases: asTextList(row.score_biases ?? row.scoreBiases),
    isPublished: row.is_published !== false,
  };
}

async function ensureCatalogSeeded() {
  if (!hasAdminSupabaseEnv()) return;
  const [services, packages, teams, settings] = await Promise.all([
    readStudioCollection<Record<string, unknown>>("studio_services"),
    readStudioCollection<Record<string, unknown>>("studio_packages"),
    readStudioCollection<Record<string, unknown>>("studio_team_profiles"),
    readStudioCollection<Record<string, unknown>>("studio_settings"),
  ]);

  if (services.length === 0) {
    for (const service of defaultServices()) {
      await upsertStudioCollectionRecord("studio_services", {
        id: service.id,
        slug: service.slug,
        kind: service.kind,
        name: service.name,
        headline: service.headline,
        summary: service.summary,
        starting_price: service.startingPrice,
        delivery_window: service.deliveryWindow,
        stack: service.stack,
        outcomes: service.outcomes,
        score_boosts: service.scoreBoosts,
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  if (packages.length === 0) {
    for (const pkg of defaultPackages()) {
      await upsertStudioCollectionRecord("studio_packages", {
        id: pkg.id,
        service_id: pkg.serviceId,
        slug: pkg.slug,
        name: pkg.name,
        summary: pkg.summary,
        price: pkg.price,
        deposit_rate: pkg.depositRate,
        timeline_weeks: pkg.timelineWeeks,
        best_for: pkg.bestFor,
        includes: pkg.includes,
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  if (teams.length === 0) {
    for (const team of defaultTeams()) {
      await upsertStudioCollectionRecord("studio_team_profiles", {
        id: team.id,
        slug: team.slug,
        name: team.name,
        label: team.label,
        summary: team.summary,
        availability: team.availability,
        focus: team.focus,
        industries: team.industries,
        stack: team.stack,
        highlights: team.highlights,
        score_biases: team.scoreBiases,
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  const settingKeys = new Set(settings.map((item) => cleanText(item.key)));
  const seedSettings: Array<{ key: string; value: unknown }> = [
    { key: CASE_STUDY_KEY, value: studioCaseStudies },
    { key: DIFFERENTIATOR_KEY, value: studioDifferentiators },
    { key: FAQ_KEY, value: defaultFaqs() },
    { key: TESTIMONIAL_KEY, value: defaultTestimonials() },
    { key: PROCESS_KEY, value: studioProcess },
    { key: TRUST_KEY, value: studioTrustSignals },
    { key: COMPARISON_KEY, value: studioValueComparisons },
    {
      key: "platform",
      value: {
        currency: "NGN",
        support_email: "studio@henrycogroup.com",
        support_phone: "+2349133957084",
        primary_cta: "Start a Studio project",
      },
    },
  ];

  for (const setting of seedSettings) {
    if (settingKeys.has(setting.key)) continue;
    await upsertStudioCollectionRecord(
      "studio_settings",
      {
        key: setting.key,
        value: setting.value,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      undefined,
      { onConflict: "key", idKey: "key" }
    );
  }
}

export async function getStudioCatalog(
  options: GetStudioCatalogOptions = {}
): Promise<StudioCatalog> {
  const defaults = {
    services: defaultServices(),
    packages: defaultPackages(),
    teams: defaultTeams(),
  };

  if (!hasAdminSupabaseEnv()) {
    return {
      services: maybePublished(defaults.services, options.includeUnpublished),
      packages: maybePublished(defaults.packages, options.includeUnpublished),
      teams: maybePublished(defaults.teams, options.includeUnpublished),
      caseStudies: studioCaseStudies,
      differentiators: studioDifferentiators,
      faqs: defaultFaqs(),
      testimonials: defaultTestimonials(),
      process: studioProcess,
      trustSignals: studioTrustSignals,
      valueComparisons: studioValueComparisons,
      platform: {
        currency: "NGN",
        support_email: "studio@henrycogroup.com",
        support_phone: "+2349133957084",
        primary_cta: "Start a Studio project",
      },
    };
  }

  await ensureCatalogSeeded();

  const [serviceRows, packageRows, teamRows, settingRows] = await Promise.all([
    readStudioCollection<Record<string, unknown>>("studio_services"),
    readStudioCollection<Record<string, unknown>>("studio_packages"),
    readStudioCollection<Record<string, unknown>>("studio_team_profiles"),
    readStudioCollection<SettingRow & Record<string, unknown>>("studio_settings"),
  ]);

  const settingMap = new Map(settingRows.map((item) => [cleanText(item.key), item.value]));
  const services = serviceRows.length > 0 ? serviceRows.map(mapServiceRow).filter((item) => item.id) : defaults.services;
  const packages = packageRows.length > 0 ? packageRows.map(mapPackageRow).filter((item) => item.id) : defaults.packages;
  const teams = teamRows.length > 0 ? teamRows.map(mapTeamRow).filter((item) => item.id) : defaults.teams;

  return {
    services: maybePublished(services, options.includeUnpublished),
    packages: maybePublished(packages, options.includeUnpublished),
    teams: maybePublished(teams, options.includeUnpublished),
    caseStudies: asRecordArray<StudioCaseStudy>(settingMap.get(CASE_STUDY_KEY) ?? studioCaseStudies),
    differentiators: asRecordArray<StudioDifferentiator>(
      settingMap.get(DIFFERENTIATOR_KEY) ?? studioDifferentiators
    ),
    faqs: asRecordArray<StudioFaqItem>(settingMap.get(FAQ_KEY) ?? defaultFaqs()),
    testimonials: asRecordArray<StudioTestimonial>(
      settingMap.get(TESTIMONIAL_KEY) ?? defaultTestimonials()
    ),
    process: asTextList(settingMap.get(PROCESS_KEY) ?? studioProcess),
    trustSignals: asTextList(settingMap.get(TRUST_KEY) ?? studioTrustSignals),
    valueComparisons: asRecordArray<StudioValueComparison>(
      settingMap.get(COMPARISON_KEY) ?? studioValueComparisons
    ),
    platform:
      (settingMap.get("platform") as Record<string, unknown> | undefined) ?? {
        currency: "NGN",
      },
  };
}

export async function getStudioServiceBySlug(slug: string) {
  const catalog = await getStudioCatalog();
  return (
    catalog.services.find((item) => (item.slug || studioServiceSlug(item)) === slug) ??
    getSeedServiceBySlug(slug)
  );
}

export async function getStudioTeamBySlug(slug: string) {
  const catalog = await getStudioCatalog();
  return catalog.teams.find((item) => (item.slug || studioTeamSlug(item)) === slug) ?? getSeedTeamBySlug(slug);
}

export async function getStudioCaseStudyBySlug(slug: string) {
  const catalog = await getStudioCatalog();
  return catalog.caseStudies.find((item) => studioCaseStudySlug(item) === slug) ?? getSeedCaseStudyBySlug(slug);
}
