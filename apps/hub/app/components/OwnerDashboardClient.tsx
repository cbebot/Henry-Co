"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { HubOwnerCopy } from "@henryco/i18n";
import Image from "next/image";
import {
  createFallbackCompanyPage,
  normalizeCompanyPage,
  type CompanyPageRecord,
  type CompanyPageSection,
  type CompanyPageStat,
} from "../lib/company-pages";
import {
  normalizeCompanySettings,
  type CompanySettingsRecord,
} from "../lib/company-settings-shared";
import {
  normalizeCompanyPerson,
  type CompanyPersonRecord,
} from "../lib/company-people-shared";
import {
  Building2,
  Crown,
  ExternalLink,
  FileText,
  Globe,
  ImageIcon,
  LayoutDashboard,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  Star,
  UserSquare2,
} from "lucide-react";

type SettingsRecord = CompanySettingsRecord;

type PageRecord = CompanyPageRecord;
type PersonRecord = CompanyPersonRecord;

type DivisionRecord = {
  id?: string;
  slug: string;
  name: string;
  tagline?: string | null;
  description?: string | null;
  accent?: string | null;
  primary_url?: string | null;
  subdomain?: string | null;
  logo_url?: string | null;
  logo_public_id?: string | null;
  cover_url?: string | null;
  cover_public_id?: string | null;
  categories?: string[];
  highlights?: string[];
  who_its_for?: string[];
  how_it_works?: string[];
  trust?: string[];
  status?: "active" | "coming_soon" | "paused";
  lead_person_id?: string | null;
  lead_name?: string | null;
  lead_title?: string | null;
  lead_avatar_url?: string | null;
  is_featured?: boolean;
  is_published?: boolean;
  sort_order?: number;
};

type TabKey = "general" | "pages" | "leadership" | "divisions";
type NoticeTone = "success" | "error" | "info";

const emptySettings: SettingsRecord = normalizeCompanySettings(null);

const pageDefaults = (pageKey: string): PageRecord => {
  if (pageKey === "home") {
    return {
      ...createFallbackCompanyPage("home"),
      slug: "home",
      title: "Henry & Co.",
      subtitle: "Corporate Platform",
      hero_badge: "Group Platform",
      intro:
        "Explore the businesses, services, and operating divisions of Henry & Co.",
      primary_cta_label: "Explore divisions",
      primary_cta_href: "/#divisions",
      secondary_cta_label: "About Henry & Co.",
      secondary_cta_href: "/about",
    };
  }

  return createFallbackCompanyPage(pageKey);
};

const emptyPerson: PersonRecord = {
  id: "",
  page_key: "about",
  page_slug: "about",
  group_key: "leadership",
  kind: "leadership",
  full_name: "",
  job_title: "",
  role_title: "",
  role_label: "",
  division_slug: "",
  department: "",
  short_bio: "",
  long_bio: "",
  bio: "",
  email: "",
  phone: "",
  linkedin_url: "",
  photo_url: "",
  image_url: "",
  photo_public_id: "",
  sort_order: 100,
  is_owner: false,
  is_manager: false,
  is_featured: false,
  is_published: true,
  created_at: null,
  updated_at: null,
};

const emptyDivision: DivisionRecord = {
  slug: "",
  name: "",
  tagline: "",
  description: "",
  accent: "#C9A227",
  primary_url: "",
  subdomain: "",
  logo_url: "",
  logo_public_id: "",
  cover_url: "",
  cover_public_id: "",
  categories: [],
  highlights: [],
  who_its_for: [],
  how_it_works: [],
  trust: [],
  status: "active",
  lead_person_id: "",
  lead_name: "",
  lead_title: "",
  lead_avatar_url: "",
  is_featured: false,
  is_published: true,
  sort_order: 100,
};

function normalizeText(value: unknown, fallback = "") {
  const text = typeof value === "string" ? value.trim() : String(value ?? "").trim();
  return text || fallback;
}

function normalizeSettings(input?: SettingsRecord | null): SettingsRecord {
  return normalizeCompanySettings(input);
}

function normalizePage(input?: PageRecord | null, pageKey = "home"): PageRecord {
  const normalized = normalizeCompanyPage(input, pageKey);

  return {
    ...pageDefaults(pageKey),
    ...normalized,
    slug: normalized.slug || pageKey,
    stats: Array.isArray(normalized.stats) ? normalized.stats : [],
    sections: Array.isArray(normalized.sections) ? normalized.sections : [],
  };
}

function normalizePerson(input?: PersonRecord | null): PersonRecord {
  const normalized = normalizeCompanyPerson(input);

  return {
    ...normalized,
    id: normalized.id || "",
    page_key: normalized.page_key || "about",
    page_slug: normalized.page_slug ?? normalized.page_key,
    group_key: normalized.group_key || "leadership",
    kind: normalized.kind ?? "leadership",
    full_name: normalized.full_name,
    job_title: normalized.job_title ?? "",
    role_title: normalized.role_title ?? "",
    role_label: normalized.role_label ?? "",
    division_slug: normalized.division_slug ?? "",
    department: normalized.department ?? "",
    short_bio: normalized.short_bio ?? "",
    long_bio: normalized.long_bio ?? "",
    bio: normalized.bio ?? normalized.short_bio ?? normalized.long_bio ?? "",
    email: normalized.email ?? "",
    phone: normalized.phone ?? "",
    linkedin_url: normalized.linkedin_url ?? "",
    photo_url: normalized.photo_url ?? "",
    image_url: normalized.image_url ?? normalized.photo_url ?? "",
    photo_public_id: normalized.photo_public_id ?? "",
    sort_order: Number(normalized.sort_order ?? 100),
    is_owner: normalized.is_owner,
    is_manager: normalized.is_manager,
    is_featured: normalized.is_featured,
    is_published: normalized.is_published,
  };
}

function normalizeDivision(input?: DivisionRecord | null): DivisionRecord {
  return {
    ...emptyDivision,
    ...(input ?? {}),
    categories: Array.isArray(input?.categories) ? input!.categories : [],
    highlights: Array.isArray(input?.highlights) ? input!.highlights : [],
    who_its_for: Array.isArray(input?.who_its_for) ? input!.who_its_for : [],
    how_it_works: Array.isArray(input?.how_it_works) ? input!.how_it_works : [],
    trust: Array.isArray(input?.trust) ? input!.trust : [],
  };
}

function personRoleLabel(person: PersonRecord) {
  return (
    normalizeText(person.role_title) ||
    normalizeText(person.role_label) ||
    normalizeText(person.job_title) ||
    "Profile"
  );
}

function personTone(person: PersonRecord) {
  if (person.is_owner) return "owner";
  if (person.is_manager) return "manager";
  if (person.is_featured) return "featured";
  return "leadership";
}

function personToneLabel(
  person: PersonRecord,
  labels: { owner: string; management: string; featured: string; leadership: string }
) {
  if (person.is_owner) return labels.owner;
  if (person.is_manager) return labels.management;
  if (person.is_featured) return labels.featured;
  return labels.leadership;
}

function personToneClasses(person: PersonRecord) {
  if (person.is_owner) {
    return "border-[#C9A227]/30 bg-[#C9A227]/12 text-[#f6df9a]";
  }

  if (person.is_manager) {
    return "border-sky-400/25 bg-sky-400/12 text-sky-200";
  }

  if (person.is_featured) {
    return "border-violet-400/25 bg-violet-400/12 text-violet-200";
  }

  return "border-white/10 bg-white/[0.06] text-white/76";
}

function listToText(value?: string[]) {
  return Array.isArray(value) ? value.join("\n") : "";
}

function textToList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function nullableText(value: unknown) {
  const text = normalizeText(value);
  return text || null;
}

function parseJsonArray<T>(value: string, label: string): T[] {
  const parsed = JSON.parse(value || "[]");

  if (!Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON array.`);
  }

  return parsed as T[];
}

function normalizeDivisionSubdomain(value: string) {
  const text = normalizeText(value).toLowerCase();

  if (!text) return "";

  try {
    const url = new URL(text.startsWith("http") ? text : `https://${text}`);
    return url.hostname.split(".")[0] || text;
  } catch {
    return text.replace(/^https?:\/\//i, "").replace(/[/.].*$/, "");
  }
}

async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.error || "Request failed.");
  }

  return json as T;
}

async function writeJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.error || "Request failed.");
  }

  return json as T;
}

type AssetUploadCopy = Pick<
  HubOwnerCopy["ownerDashboardClient"],
  "assetUploadPastePlaceholder" | "assetUploadingLabel" | "assetUploadLabel" | "assetPreviewUnavailable" | "assetPreviewReady" | "assetOpenLabel"
>;

function AssetUploadField({
  label,
  value,
  folder,
  onChange,
  copy,
}: {
  label: string;
  value?: string | null;
  folder: string;
  onChange: (value: string) => void;
  copy: AssetUploadCopy;
}) {
  const [uploading, setUploading] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const inputId = useMemo(
    () =>
      `${label.toLowerCase().replace(/\s+/g, "-")}-${Math.random()
        .toString(36)
        .slice(2)}`,
    [label]
  );
  const previewUrl = normalizeText(value);

  useEffect(() => {
    setPreviewFailed(false);
  }, [previewUrl]);

  async function handleFileChange(file: File | null) {
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const signature = await writeJson<{
        cloudName: string;
        apiKey: string;
        timestamp: number;
        folder: string;
        signature: string;
      }>("/api/owner/upload", { folder });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signature.apiKey);
      formData.append("timestamp", String(signature.timestamp));
      formData.append("folder", signature.folder);
      formData.append("signature", signature.signature);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${signature.cloudName}/auto/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const uploadJson = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadJson?.error?.message || "Cloudinary upload failed.");
      }

      onChange(uploadJson.secure_url || uploadJson.url || "");
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-white/80">{label}</div>
      <div className="flex gap-3">
        <input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none"
          placeholder={copy.assetUploadPastePlaceholder}
        />
        <label
          htmlFor={inputId}
          className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm text-white/90 transition hover:bg-white/10"
        >
          <ImageIcon className="h-4 w-4" />
          {uploading ? copy.assetUploadingLabel : copy.assetUploadLabel}
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
        />
      </div>

      {previewUrl ? (
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border border-white/12 bg-white/[0.06]">
            {!previewFailed ? (
              <Image
                src={previewUrl}
                alt={`${label} preview`}
                width={56}
                height={56}
                unoptimized
                className="h-full w-full object-contain p-1"
                onError={() => setPreviewFailed(true)}
              />
            ) : (
              <ImageIcon className="h-5 w-5 text-white/45" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm text-white/78">{previewUrl}</div>
            <div className="mt-1 text-xs text-white/45">
              {previewFailed ? copy.assetPreviewUnavailable : copy.assetPreviewReady}
            </div>
          </div>

          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-white/84 transition hover:bg-white/10"
          >
            {copy.assetOpenLabel}
          </a>
        </div>
      ) : null}

      {uploadError ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {uploadError}
        </div>
      ) : null}
    </div>
  );
}

export default function OwnerDashboardClient({ copy }: { copy: HubOwnerCopy["ownerDashboardClient"] }) {
  const [activeTab, setActiveTab] = useState<TabKey>("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<NoticeTone>("info");

  const [settings, setSettings] = useState<SettingsRecord>(emptySettings);
  const [pages, setPages] = useState<PageRecord[]>([]);
  const [people, setPeople] = useState<PersonRecord[]>([]);
  const [divisions, setDivisions] = useState<DivisionRecord[]>([]);

  const [selectedPageKey, setSelectedPageKey] = useState("home");
  const [selectedPersonId, setSelectedPersonId] = useState<string>("new");
  const [selectedDivisionSlug, setSelectedDivisionSlug] = useState<string>("new");

  const [pageDraft, setPageDraft] = useState<PageRecord>(pageDefaults("home"));
  const [pageStatsInput, setPageStatsInput] = useState("[]");
  const [pageSectionsInput, setPageSectionsInput] = useState("[]");
  const [personDraft, setPersonDraft] = useState<PersonRecord>(emptyPerson);
  const [divisionDraft, setDivisionDraft] = useState<DivisionRecord>(emptyDivision);

  const peopleStats = useMemo(
    () => ({
      total: people.length,
      published: people.filter((person) => person.is_published !== false).length,
      owners: people.filter((person) => person.is_owner).length,
      managers: people.filter((person) => person.is_manager).length,
    }),
    [people]
  );

  const divisionStats = useMemo(
    () => ({
      total: divisions.length,
      published: divisions.filter((division) => division.is_published !== false).length,
      featured: divisions.filter((division) => division.is_featured).length,
      active: divisions.filter((division) => division.status === "active").length,
    }),
    [divisions]
  );

  const selectedPersonPreview = useMemo(() => normalizePerson(personDraft), [personDraft]);
  const selectedDivisionPreview = useMemo(
    () => normalizeDivision(divisionDraft),
    [divisionDraft]
  );

  function showMessage(nextMessage: string | null, tone: NoticeTone = "info") {
    setMessage(nextMessage);
    setMessageTone(tone);
  }

  const loadAll = useCallback(async () => {
    setLoading(true);
    showMessage(null);

    try {
      const [settingsRes, pagesRes, peopleRes, divisionsRes] = await Promise.all([
        readJson<{ settings: SettingsRecord | null }>("/api/owner/settings"),
        readJson<{ pages: PageRecord[] }>("/api/owner/pages"),
        readJson<{ people: PersonRecord[] }>("/api/owner/people"),
        readJson<{ divisions: DivisionRecord[] }>("/api/owner/divisions"),
      ]);

      const nextSettings = normalizeSettings(settingsRes.settings);
      const nextPages = Array.isArray(pagesRes.pages)
        ? pagesRes.pages.map((item) =>
            normalizePage(
              item,
              normalizeText((item as { slug?: string | null; page_key?: string | null }).slug) ||
                normalizeText((item as { page_key?: string | null }).page_key) ||
                "home"
            )
          )
        : [];
      const nextPeople = Array.isArray(peopleRes.people)
        ? peopleRes.people.map((item) => normalizePerson(item))
        : [];
      const nextDivisions = Array.isArray(divisionsRes.divisions) ? divisionsRes.divisions : [];

      setSettings(nextSettings);
      setPages(nextPages);
      setPeople(nextPeople);
      setDivisions(nextDivisions);
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "Unable to load dashboard.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    const found = pages.find((item) => item.slug === selectedPageKey);
    const nextDraft = normalizePage(found, selectedPageKey);
    setPageDraft(nextDraft);
    setPageStatsInput(JSON.stringify(nextDraft.stats ?? [], null, 2));
    setPageSectionsInput(JSON.stringify(nextDraft.sections ?? [], null, 2));
  }, [pages, selectedPageKey]);

  useEffect(() => {
    if (selectedPersonId === "new") {
      setPersonDraft(normalizePerson(emptyPerson));
      return;
    }

    const found = people.find((item) => item.id === selectedPersonId);
    setPersonDraft(normalizePerson(found));
  }, [people, selectedPersonId]);

  useEffect(() => {
    if (selectedDivisionSlug === "new") {
      setDivisionDraft(normalizeDivision(emptyDivision));
      return;
    }

    const found = divisions.find((item) => item.slug === selectedDivisionSlug);
    setDivisionDraft(normalizeDivision(found));
  }, [divisions, selectedDivisionSlug]);

  async function saveSettings() {
    setSaving(true);
    showMessage(null);

    try {
      await writeJson("/api/owner/settings", normalizeSettings(settings));
      showMessage("General settings saved.", "success");
      await loadAll();
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "Unable to save settings.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function savePage() {
    setSaving(true);
    showMessage(null);

    try {
      const stats = parseJsonArray<CompanyPageStat>(pageStatsInput, "Page stats");
      const sections = parseJsonArray<CompanyPageSection>(
        pageSectionsInput,
        "Page sections"
      );
      const nextPage = normalizePage(
        {
          ...pageDraft,
          slug: selectedPageKey,
          stats,
          sections,
        },
        selectedPageKey
      );

      await writeJson("/api/owner/pages", {
        id: nextPage.id ?? undefined,
        slug: selectedPageKey,
        page_key: selectedPageKey,
        title: normalizeText(nextPage.title),
        subtitle: nullableText(nextPage.subtitle),
        hero_badge: nullableText(nextPage.hero_badge),
        intro: nullableText(nextPage.intro),
        hero_image_url: nullableText(nextPage.hero_image_url),
        primary_cta_label: nullableText(nextPage.primary_cta_label),
        primary_cta_href: nullableText(nextPage.primary_cta_href),
        secondary_cta_label: nullableText(nextPage.secondary_cta_label),
        secondary_cta_href: nullableText(nextPage.secondary_cta_href),
        cta_primary_label: nullableText(nextPage.primary_cta_label),
        cta_primary_href: nullableText(nextPage.primary_cta_href),
        cta_secondary_label: nullableText(nextPage.secondary_cta_label),
        cta_secondary_href: nullableText(nextPage.secondary_cta_href),
        hero_kicker: nullableText(nextPage.hero_badge),
        hero_title: normalizeText(nextPage.title),
        hero_body: nullableText(nextPage.intro),
        hero_primary_label: nullableText(nextPage.primary_cta_label),
        hero_primary_href: nullableText(nextPage.primary_cta_href),
        hero_secondary_label: nullableText(nextPage.secondary_cta_label),
        hero_secondary_href: nullableText(nextPage.secondary_cta_href),
        body: sections,
        stats,
        sections,
        seo_title: nullableText(nextPage.seo_title),
        seo_description: nullableText(nextPage.seo_description),
        is_published: nextPage.is_published !== false,
        sort_order: Number(nextPage.sort_order ?? 100),
      });
      showMessage(`${selectedPageKey} page saved.`, "success");
      await loadAll();
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Unable to save page.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function savePerson() {
    setSaving(true);
    showMessage(null);

    try {
      const payload = normalizePerson({
        ...personDraft,
        full_name: normalizeText(personDraft.full_name),
        job_title: normalizeText(personDraft.job_title),
        role_title:
          normalizeText(personDraft.role_title) ||
          normalizeText(personDraft.role_label) ||
          normalizeText(personDraft.job_title) ||
          "Team Member",
        role_label:
          normalizeText(personDraft.role_label) ||
          normalizeText(personDraft.role_title) ||
          normalizeText(personDraft.job_title) ||
          "Team Member",
      });

      await writeJson("/api/owner/people", payload);
      showMessage("Leadership record saved.", "success");
      await loadAll();
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "Unable to save leadership record.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveDivision() {
    setSaving(true);
    showMessage(null);

    try {
      const payload = normalizeDivision({
        ...divisionDraft,
        slug: normalizeText(divisionDraft.slug).toLowerCase().replace(/\s+/g, "-"),
        name: normalizeText(divisionDraft.name),
        subdomain: normalizeDivisionSubdomain(divisionDraft.subdomain ?? ""),
      });

      await writeJson("/api/owner/divisions", payload);
      showMessage("Division saved.", "success");
      await loadAll();
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "Unable to save division.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] px-4 py-10 text-white">
        <div className="mx-auto max-w-7xl rounded-[32px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
          {copy.loadingDashboard}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050816] px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-white/45">
                {copy.headerEyebrow}
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                {copy.headerTitle}
              </h1>
              <p className="mt-2 text-sm text-white/64">
                {copy.headerDescription}
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/78">
              <ShieldCheck className="h-4 w-4 text-[#C9A227]" />
              {copy.serverRoutedBadge}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MiniStatCard label={copy.statLabelLeadershipProfiles} value={String(peopleStats.total)} />
            <MiniStatCard label={copy.statLabelPublishedProfiles} value={String(peopleStats.published)} />
            <MiniStatCard label={copy.statLabelPublishedDivisions} value={String(divisionStats.published)} />
            <MiniStatCard label={copy.statLabelFeaturedDivisions} value={String(divisionStats.featured)} />
          </div>

          {message ? (
            <div
              className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
                messageTone === "success"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
                  : messageTone === "error"
                    ? "border-rose-500/20 bg-rose-500/10 text-rose-100"
                    : "border-white/10 bg-black/25 text-white/82"
              }`}
            >
              {message}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <TabButton
            active={activeTab === "general"}
            onClick={() => setActiveTab("general")}
            icon={<LayoutDashboard className="h-4 w-4" />}
            label={copy.tabGeneralSettings}
          />
          <TabButton
            active={activeTab === "pages"}
            onClick={() => setActiveTab("pages")}
            icon={<FileText className="h-4 w-4" />}
            label={copy.tabCompanyPages}
          />
          <TabButton
            active={activeTab === "leadership"}
            onClick={() => setActiveTab("leadership")}
            icon={<UserSquare2 className="h-4 w-4" />}
            label={copy.tabLeadership}
          />
          <TabButton
            active={activeTab === "divisions"}
            onClick={() => setActiveTab("divisions")}
            icon={<Building2 className="h-4 w-4" />}
            label={copy.tabDivisions}
          />
        </div>

        {activeTab === "general" ? (
          <section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
            <div className="grid gap-4 lg:grid-cols-2">
              <Input
                label={copy.generalLegalNameLabel}
                value={settings.legal_name ?? ""}
                onChange={(value) => setSettings((prev) => ({ ...prev, legal_name: value }))}
              />
              <Input
                label={copy.generalBrandTitleLabel}
                value={settings.brand_title ?? ""}
                onChange={(value) => setSettings((prev) => ({ ...prev, brand_title: value }))}
              />
              <Input
                label={copy.generalBrandSubtitleLabel}
                value={settings.brand_subtitle ?? ""}
                onChange={(value) =>
                  setSettings((prev) => ({ ...prev, brand_subtitle: value }))
                }
              />
              <Input
                label={copy.generalBaseDomainLabel}
                value={settings.base_domain ?? ""}
                onChange={(value) => setSettings((prev) => ({ ...prev, base_domain: value }))}
              />
              <Input
                label={copy.generalSupportEmailLabel}
                value={settings.support_email ?? ""}
                onChange={(value) =>
                  setSettings((prev) => ({ ...prev, support_email: value }))
                }
              />
              <Input
                label={copy.generalSupportPhoneLabel}
                value={settings.support_phone ?? ""}
                onChange={(value) =>
                  setSettings((prev) => ({ ...prev, support_phone: value }))
                }
              />
              <Input
                label={copy.generalBrandAccentLabel}
                value={settings.brand_accent ?? ""}
                onChange={(value) =>
                  setSettings((prev) => ({ ...prev, brand_accent: value }))
                }
              />
              <Input
                label={copy.generalCopyrightLabelLabel}
                value={settings.copyright_label ?? ""}
                onChange={(value) =>
                  setSettings((prev) => ({ ...prev, copyright_label: value }))
                }
              />
            </div>

            <div className="mt-4 grid gap-4">
              <TextArea
                label={copy.generalBrandDescriptionLabel}
                value={settings.brand_description ?? ""}
                onChange={(value) =>
                  setSettings((prev) => ({ ...prev, brand_description: value }))
                }
              />
              <TextArea
                label={copy.generalFooterBlurbLabel}
                value={settings.footer_blurb ?? ""}
                onChange={(value) =>
                  setSettings((prev) => ({ ...prev, footer_blurb: value }))
                }
              />
              <TextArea
                label={copy.generalOfficeAddressLabel}
                value={settings.office_address ?? ""}
                onChange={(value) =>
                  setSettings((prev) => ({ ...prev, office_address: value }))
                }
              />
              <TextArea
                label={copy.generalDefaultMetaDescriptionLabel}
                value={settings.default_meta_description ?? ""}
                onChange={(value) =>
                  setSettings((prev) => ({ ...prev, default_meta_description: value }))
                }
              />
              <AssetUploadField
                label={copy.generalLogoUrlLabel}
                value={settings.logo_url ?? ""}
                folder="henryco/logo"
                onChange={(value) => setSettings((prev) => ({ ...prev, logo_url: value }))}
                copy={copy}
              />
              <AssetUploadField
                label={copy.generalFaviconUrlLabel}
                value={settings.favicon_url ?? ""}
                folder="henryco/favicon"
                onChange={(value) =>
                  setSettings((prev) => ({ ...prev, favicon_url: value }))
                }
                copy={copy}
              />
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <BrandSettingsPreview settings={settings} copy={copy} />
              <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-white/45">
                  {copy.generalPublishingNotesEyebrow}
                </div>
                <div className="mt-4 space-y-3 text-sm leading-7 text-white/66">
                  <p>{copy.generalPublishingNote1}</p>
                  <p>{copy.generalPublishingNote2}</p>
                  <p>{copy.generalPublishingNote3}</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <ActionButton onClick={saveSettings} saving={saving} label={copy.generalSaveLabel} savingLabel={copy.assetUploadingLabel} />
            </div>
          </section>
        ) : null}

        {activeTab === "pages" ? (
          <section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              <div className="space-y-2">
                {["home", "about", "contact", "privacy", "terms"].map((key) => (
                  <button
                    key={key}
                    onClick={() => setSelectedPageKey(key)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      selectedPageKey === key
                        ? "border-[#C9A227] bg-[#C9A227] text-black"
                        : "border-white/10 bg-black/25 text-white/84 hover:bg-white/10"
                    }`}
                  >
                    <span>{key}</span>
                    <Globe className="h-4 w-4" />
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/70">
                  {copy.pagesEditingRoute} <span className="font-semibold text-white">/{selectedPageKey === "home" ? "" : selectedPageKey}</span>
                </div>
                <Input
                  label={copy.pagesTitleLabel}
                  value={pageDraft.title ?? ""}
                  onChange={(value) => setPageDraft((prev) => ({ ...prev, title: value }))}
                />
                <Input
                  label={copy.pagesSubtitleLabel}
                  value={pageDraft.subtitle ?? ""}
                  onChange={(value) => setPageDraft((prev) => ({ ...prev, subtitle: value }))}
                />
                <Input
                  label={copy.pagesHeroBadgeLabel}
                  value={pageDraft.hero_badge ?? ""}
                  onChange={(value) =>
                    setPageDraft((prev) => ({ ...prev, hero_badge: value }))
                  }
                />
                <TextArea
                  label={copy.pagesIntroLabel}
                  value={pageDraft.intro ?? ""}
                  onChange={(value) =>
                    setPageDraft((prev) => ({ ...prev, intro: value }))
                  }
                />
                <AssetUploadField
                  label={copy.pagesHeroImageLabel}
                  value={pageDraft.hero_image_url ?? ""}
                  folder={`henryco/pages/${selectedPageKey}`}
                  onChange={(value) =>
                    setPageDraft((prev) => ({ ...prev, hero_image_url: value }))
                  }
                  copy={copy}
                />
                <div className="grid gap-4 lg:grid-cols-2">
                  <Input
                    label={copy.pagesPrimaryCtaLabelLabel}
                    value={pageDraft.primary_cta_label ?? ""}
                    onChange={(value) =>
                      setPageDraft((prev) => ({ ...prev, primary_cta_label: value }))
                    }
                  />
                  <Input
                    label={copy.pagesPrimaryCtaHrefLabel}
                    value={pageDraft.primary_cta_href ?? ""}
                    onChange={(value) =>
                      setPageDraft((prev) => ({ ...prev, primary_cta_href: value }))
                    }
                  />
                  <Input
                    label={copy.pagesSecondaryCtaLabelLabel}
                    value={pageDraft.secondary_cta_label ?? ""}
                    onChange={(value) =>
                      setPageDraft((prev) => ({ ...prev, secondary_cta_label: value }))
                    }
                  />
                  <Input
                    label={copy.pagesSecondaryCtaHrefLabel}
                    value={pageDraft.secondary_cta_href ?? ""}
                    onChange={(value) =>
                      setPageDraft((prev) => ({ ...prev, secondary_cta_href: value }))
                    }
                  />
                </div>
                <Input
                  label={copy.pagesSeoTitleLabel}
                  value={pageDraft.seo_title ?? ""}
                  onChange={(value) => setPageDraft((prev) => ({ ...prev, seo_title: value }))}
                />
                <TextArea
                  label={copy.pagesSeoDescriptionLabel}
                  value={pageDraft.seo_description ?? ""}
                  onChange={(value) =>
                    setPageDraft((prev) => ({ ...prev, seo_description: value }))
                  }
                />
                <TextArea
                  label={copy.pagesStatsJsonLabel}
                  value={pageStatsInput}
                  onChange={setPageStatsInput}
                />
                <TextArea
                  label={copy.pagesSectionsJsonLabel}
                  value={pageSectionsInput}
                  onChange={setPageSectionsInput}
                />
                <div className="grid gap-4 lg:grid-cols-2">
                  <Input
                    label={copy.pagesSortOrderLabel}
                    value={String(pageDraft.sort_order ?? 100)}
                    onChange={(value) =>
                      setPageDraft((prev) => ({
                        ...prev,
                        sort_order: Number(value || 100),
                      }))
                    }
                  />
                  <Toggle
                    label={copy.pagesPublishedLabel}
                    checked={pageDraft.is_published !== false}
                    onChange={(value) =>
                      setPageDraft((prev) => ({ ...prev, is_published: value }))
                    }
                  />
                </div>

                <ActionButton onClick={savePage} saving={saving} label={copy.pagesSaveLabel} savingLabel={copy.assetUploadingLabel} />
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "leadership" ? (
          <section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
            <div className="mb-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-white/45">
                  {copy.leadershipEyebrow}
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                  {copy.leadershipTitle}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/66">
                  {copy.leadershipDescription}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MiniStatCard label={copy.leadershipStatProfiles} value={String(peopleStats.total)} />
                  <MiniStatCard label={copy.leadershipStatPublished} value={String(peopleStats.published)} />
                  <MiniStatCard label={copy.leadershipStatOwners} value={String(peopleStats.owners)} />
                  <MiniStatCard label={copy.leadershipStatManagers} value={String(peopleStats.managers)} />
                </div>
              </div>

              <LeadershipPreviewCard person={selectedPersonPreview} copy={copy} />
            </div>

            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
              <div className="space-y-3">
                <button
                  onClick={() => setSelectedPersonId("new")}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    selectedPersonId === "new"
                      ? "border-[#C9A227] bg-[#C9A227] text-black"
                      : "border-white/10 bg-black/25 text-white/84 hover:bg-white/10"
                  }`}
                >
                  <span>{copy.leadershipNewRecord}</span>
                  <UserSquare2 className="h-4 w-4" />
                </button>

                {people.map((person) => (
                  <PersonListButton
                    key={person.id ?? person.full_name}
                    person={person}
                    active={selectedPersonId === person.id}
                    onClick={() => setSelectedPersonId(person.id || "new")}
                    copy={copy}
                  />
                ))}
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <Input
                    label={copy.leadershipFullNameLabel}
                    value={personDraft.full_name ?? ""}
                    onChange={(value) =>
                      setPersonDraft((prev) => ({ ...prev, full_name: value }))
                    }
                  />
                  <Input
                    label={copy.leadershipJobTitleLabel}
                    value={personDraft.job_title ?? ""}
                    onChange={(value) =>
                      setPersonDraft((prev) => ({ ...prev, job_title: value }))
                    }
                  />
                  <Input
                    label={copy.leadershipRoleLabelLabel}
                    value={personDraft.role_label ?? ""}
                    onChange={(value) =>
                      setPersonDraft((prev) => ({ ...prev, role_label: value }))
                    }
                  />
                  <Input
                    label={copy.leadershipRoleTitleLabel}
                    value={personDraft.role_title ?? ""}
                    onChange={(value) =>
                      setPersonDraft((prev) => ({ ...prev, role_title: value }))
                    }
                  />
                  <Input
                    label={copy.leadershipDepartmentLabel}
                    value={personDraft.department ?? ""}
                    onChange={(value) =>
                      setPersonDraft((prev) => ({ ...prev, department: value }))
                    }
                  />
                  <Select
                    label={copy.leadershipDivisionServedLabel}
                    value={personDraft.division_slug ?? ""}
                    onChange={(value) =>
                      setPersonDraft((prev) => ({
                        ...prev,
                        division_slug: value || null,
                      }))
                    }
                    options={[
                      { label: copy.leadershipNoDivisionOption, value: "" },
                      ...divisions.map((item) => ({
                        label: item.name,
                        value: item.slug,
                      })),
                    ]}
                  />
                  <Input
                    label={copy.leadershipEmailLabel}
                    value={personDraft.email ?? ""}
                    onChange={(value) =>
                      setPersonDraft((prev) => ({ ...prev, email: value }))
                    }
                  />
                  <Input
                    label={copy.leadershipPhoneLabel}
                    value={personDraft.phone ?? ""}
                    onChange={(value) =>
                      setPersonDraft((prev) => ({ ...prev, phone: value }))
                    }
                  />
                </div>

                <Input
                  label={copy.leadershipLinkedinLabel}
                  value={personDraft.linkedin_url ?? ""}
                  onChange={(value) =>
                    setPersonDraft((prev) => ({ ...prev, linkedin_url: value }))
                  }
                />

                <AssetUploadField
                  label={copy.leadershipPhotoUrlLabel}
                  value={personDraft.photo_url ?? ""}
                  folder="henryco/people"
                  copy={copy}
                  onChange={(value) =>
                    setPersonDraft((prev) => ({ ...prev, photo_url: value }))
                  }
                />

                <TextArea
                  label={copy.leadershipShortBioLabel}
                  value={personDraft.short_bio ?? ""}
                  onChange={(value) =>
                    setPersonDraft((prev) => ({ ...prev, short_bio: value }))
                  }
                />
                <TextArea
                  label={copy.leadershipLongBioLabel}
                  value={personDraft.long_bio ?? ""}
                  onChange={(value) =>
                    setPersonDraft((prev) => ({ ...prev, long_bio: value }))
                  }
                />

                <div className="grid gap-4 lg:grid-cols-5">
                  <Input
                    label={copy.leadershipSortOrderLabel}
                    value={String(personDraft.sort_order ?? 100)}
                    onChange={(value) =>
                      setPersonDraft((prev) => ({
                        ...prev,
                        sort_order: Number(value || 100),
                      }))
                    }
                  />
                  <Toggle
                    label={copy.leadershipPublishedLabel}
                    checked={personDraft.is_published !== false}
                    onChange={(value) =>
                      setPersonDraft((prev) => ({ ...prev, is_published: value }))
                    }
                  />
                  <Toggle
                    label={copy.leadershipOwnerLabel}
                    checked={Boolean(personDraft.is_owner)}
                    onChange={(value) =>
                      setPersonDraft((prev) => ({
                        ...prev,
                        is_owner: value,
                        is_manager: value ? false : prev.is_manager,
                        is_featured: value ? false : prev.is_featured,
                      }))
                    }
                  />
                  <Toggle
                    label={copy.leadershipFeaturedLabel}
                    checked={Boolean(personDraft.is_featured)}
                    onChange={(value) =>
                      setPersonDraft((prev) => ({ ...prev, is_featured: value }))
                    }
                  />
                  <Toggle
                    label={copy.leadershipManagerLabel}
                    checked={Boolean(personDraft.is_manager)}
                    onChange={(value) =>
                      setPersonDraft((prev) => ({
                        ...prev,
                        is_manager: value,
                        is_owner: value ? false : prev.is_owner,
                        is_featured: value ? false : prev.is_featured,
                      }))
                    }
                  />
                </div>

                <div className="rounded-[28px] border border-white/10 bg-black/25 p-5 text-sm leading-7 text-white/66">
                  {copy.leadershipTogglesNote}
                </div>

                <ActionButton
                  onClick={savePerson}
                  saving={saving}
                  label={copy.leadershipSaveLabel}
                  savingLabel={copy.assetUploadingLabel}
                />
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "divisions" ? (
          <section className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
            <div className="mb-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-white/45">
                  {copy.divisionsEyebrow}
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                  {copy.divisionsTitle}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/66">
                  {copy.divisionsDescription}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MiniStatCard label={copy.divisionsStatDivisions} value={String(divisionStats.total)} />
                  <MiniStatCard label={copy.divisionsStatPublished} value={String(divisionStats.published)} />
                  <MiniStatCard label={copy.divisionsStatFeatured} value={String(divisionStats.featured)} />
                  <MiniStatCard label={copy.divisionsStatActive} value={String(divisionStats.active)} />
                </div>
              </div>

              <DivisionPreviewCard division={selectedDivisionPreview} copy={copy} />
            </div>

            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
              <div className="space-y-3">
                <button
                  onClick={() => setSelectedDivisionSlug("new")}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    selectedDivisionSlug === "new"
                      ? "border-[#C9A227] bg-[#C9A227] text-black"
                      : "border-white/10 bg-black/25 text-white/84 hover:bg-white/10"
                  }`}
                >
                  <span>{copy.divisionsNewDivision}</span>
                  <Building2 className="h-4 w-4" />
                </button>

                {divisions.map((division) => (
                  <DivisionListButton
                    key={division.slug}
                    division={division}
                    active={selectedDivisionSlug === division.slug}
                    onClick={() => setSelectedDivisionSlug(division.slug)}
                    leadLabel={copy.divisionsLeadLabel}
                    statusActiveFallback={copy.divisionsStatusActive}
                  />
                ))}
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <Input
                    label={copy.divisionsSlugLabel}
                    value={divisionDraft.slug ?? ""}
                    onChange={(value) =>
                      setDivisionDraft((prev) => ({
                        ...prev,
                        slug: value.trim().toLowerCase().replace(/\s+/g, "-"),
                      }))
                    }
                  />
                  <Input
                    label={copy.divisionsNameLabel}
                    value={divisionDraft.name ?? ""}
                    onChange={(value) =>
                      setDivisionDraft((prev) => ({ ...prev, name: value }))
                    }
                  />
                  <Input
                    label={copy.divisionsTaglineLabel}
                    value={divisionDraft.tagline ?? ""}
                    onChange={(value) =>
                      setDivisionDraft((prev) => ({ ...prev, tagline: value }))
                    }
                  />
                  <Input
                    label={copy.divisionsAccentLabel}
                    value={divisionDraft.accent ?? "#C9A227"}
                    onChange={(value) =>
                      setDivisionDraft((prev) => ({ ...prev, accent: value }))
                    }
                  />
                  <Input
                    label={copy.divisionsPrimaryUrlLabel}
                    value={divisionDraft.primary_url ?? ""}
                    onChange={(value) =>
                      setDivisionDraft((prev) => ({ ...prev, primary_url: value }))
                    }
                  />
                  <Input
                    label={copy.divisionsSubdomainInputLabel}
                    value={divisionDraft.subdomain ?? ""}
                    onChange={(value) =>
                      setDivisionDraft((prev) => ({
                        ...prev,
                        subdomain: normalizeDivisionSubdomain(value),
                      }))
                    }
                  />
                  <Select
                    label={copy.divisionsStatusLabel}
                    value={divisionDraft.status ?? "active"}
                    onChange={(value) =>
                      setDivisionDraft((prev) => ({
                        ...prev,
                        status: (value as DivisionRecord["status"]) ?? "active",
                      }))
                    }
                    options={[
                      { label: copy.divisionsStatusActiveOption, value: "active" },
                      { label: copy.divisionsStatusComingSoonOption, value: "coming_soon" },
                      { label: copy.divisionsStatusPausedOption, value: "paused" },
                    ]}
                  />
                  <Input
                    label={copy.divisionsSortOrderLabel}
                    value={String(divisionDraft.sort_order ?? 100)}
                    onChange={(value) =>
                      setDivisionDraft((prev) => ({
                        ...prev,
                        sort_order: Number(value || 100),
                      }))
                    }
                  />
                </div>

                <TextArea
                  label={copy.divisionsDescriptionLabel}
                  value={divisionDraft.description ?? ""}
                  onChange={(value) =>
                    setDivisionDraft((prev) => ({ ...prev, description: value }))
                  }
                />

                <AssetUploadField
                  label={copy.divisionsLogoUrlLabel}
                  value={divisionDraft.logo_url ?? ""}
                  folder="henryco/divisions/logo"
                  copy={copy}
                  onChange={(value) =>
                    setDivisionDraft((prev) => ({ ...prev, logo_url: value }))
                  }
                />

                <AssetUploadField
                  label={copy.divisionsCoverUrlLabel}
                  value={divisionDraft.cover_url ?? ""}
                  folder="henryco/divisions/cover"
                  copy={copy}
                  onChange={(value) =>
                    setDivisionDraft((prev) => ({ ...prev, cover_url: value }))
                  }
                />

                <div className="grid gap-4 lg:grid-cols-2">
                  <TextArea
                    label={copy.divisionsCategoriesLabel}
                    value={listToText(divisionDraft.categories)}
                    onChange={(value) =>
                      setDivisionDraft((prev) => ({
                        ...prev,
                        categories: textToList(value),
                      }))
                    }
                  />
                  <TextArea
                    label={copy.divisionsHighlightsLabel}
                    value={listToText(divisionDraft.highlights)}
                    onChange={(value) =>
                      setDivisionDraft((prev) => ({
                        ...prev,
                        highlights: textToList(value),
                      }))
                    }
                  />
                  <TextArea
                    label={copy.divisionsWhoItServesLabel}
                    value={listToText(divisionDraft.who_its_for)}
                    onChange={(value) =>
                      setDivisionDraft((prev) => ({
                        ...prev,
                        who_its_for: textToList(value),
                      }))
                    }
                  />
                  <TextArea
                    label={copy.divisionsHowItWorksLabel}
                    value={listToText(divisionDraft.how_it_works)}
                    onChange={(value) =>
                      setDivisionDraft((prev) => ({
                        ...prev,
                        how_it_works: textToList(value),
                      }))
                    }
                  />
                  <TextArea
                    label={copy.divisionsTrustPointsLabel}
                    value={listToText(divisionDraft.trust)}
                    onChange={(value) =>
                      setDivisionDraft((prev) => ({
                        ...prev,
                        trust: textToList(value),
                      }))
                    }
                  />
                  <div className="space-y-4">
                    <Select
                      label={copy.divisionsLeadPersonLabel}
                      value={divisionDraft.lead_person_id ?? ""}
                      onChange={(value) => {
                        const person = people.find((item) => item.id === value) ?? null;
                        const linkedRole =
                          person?.role_title ?? person?.role_label ?? person?.job_title ?? "";

                        setDivisionDraft((prev) => ({
                          ...prev,
                          lead_person_id: value || null,
                          lead_name: person ? person.full_name : prev.lead_name ?? "",
                          lead_title: person ? linkedRole : prev.lead_title ?? "",
                          lead_avatar_url: person ? person.photo_url ?? "" : prev.lead_avatar_url ?? "",
                        }));
                      }}
                      options={[
                        { label: copy.divisionsNoLinkedPersonOption, value: "" },
                        ...people.map((person) => ({
                          label: person.full_name,
                          value: person.id ?? "",
                        })),
                      ]}
                    />

                    <Input
                      label={copy.divisionsLeadNameLabel}
                      value={divisionDraft.lead_name ?? ""}
                      onChange={(value) =>
                        setDivisionDraft((prev) => ({ ...prev, lead_name: value }))
                      }
                    />
                    <Input
                      label={copy.divisionsLeadTitleLabel}
                      value={divisionDraft.lead_title ?? ""}
                      onChange={(value) =>
                        setDivisionDraft((prev) => ({ ...prev, lead_title: value }))
                      }
                    />
                    <AssetUploadField
                      label={copy.divisionsLeadAvatarLabel}
                      value={divisionDraft.lead_avatar_url ?? ""}
                      folder="henryco/divisions/lead"
                      copy={copy}
                      onChange={(value) =>
                        setDivisionDraft((prev) => ({ ...prev, lead_avatar_url: value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <Toggle
                    label={copy.divisionsPublishedLabel}
                    checked={divisionDraft.is_published !== false}
                    onChange={(value) =>
                      setDivisionDraft((prev) => ({ ...prev, is_published: value }))
                    }
                  />
                  <Toggle
                    label={copy.divisionsFeaturedLabel}
                    checked={Boolean(divisionDraft.is_featured)}
                    onChange={(value) =>
                      setDivisionDraft((prev) => ({ ...prev, is_featured: value }))
                    }
                  />
                </div>

                <div className="rounded-[28px] border border-white/10 bg-black/25 p-5 text-sm leading-7 text-white/66">
                  {copy.divisionsLeadSyncNote}
                </div>

                <ActionButton onClick={saveDivision} saving={saving} label={copy.divisionsSaveLabel} savingLabel={copy.assetUploadingLabel} />
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function MiniStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">{label}</div>
      <div className="mt-1 text-lg font-semibold tracking-tight text-white">{value}</div>
    </div>
  );
}

function RemoteImageFrame({
  src,
  alt,
  wrapperClassName,
  imageClassName,
  fallback,
}: {
  src?: string | null;
  alt: string;
  wrapperClassName?: string;
  imageClassName?: string;
  fallback: React.ReactNode;
}) {
  const cleanSrc = normalizeText(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const showImage = Boolean(cleanSrc) && failedSrc !== cleanSrc;

  return (
    <div
      className={`grid place-items-center overflow-hidden rounded-2xl border border-white/12 bg-white/[0.06] ${
        wrapperClassName ?? ""
      }`}
    >
      {showImage ? (
        <Image
          src={cleanSrc}
          alt={alt}
          width={160}
          height={160}
          unoptimized
          className={`h-full w-full object-contain ${imageClassName ?? ""}`}
          onLoad={() => setFailedSrc(null)}
          onError={() => setFailedSrc(cleanSrc)}
        />
      ) : (
        fallback
      )}
    </div>
  );
}

function initialsFromName(name: string) {
  return name
    .split(" ")
    .map((part) => part.trim()[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function PersonAvatarFrame({
  person,
  sizeClassName = "h-14 w-14",
}: {
  person: PersonRecord;
  sizeClassName?: string;
}) {
  return (
    <RemoteImageFrame
      src={person.photo_url}
      alt={person.full_name || "Leadership profile"}
      wrapperClassName={sizeClassName}
      imageClassName="object-cover"
      fallback={
        <div className="grid h-full w-full place-items-center bg-black/20 text-sm font-semibold text-white/84">
          {initialsFromName(person.full_name || "Leadership")}
        </div>
      }
    />
  );
}

function DivisionLogoFrame({
  src,
  name,
}: {
  src?: string | null;
  name: string;
}) {
  return (
    <RemoteImageFrame
      src={src}
      alt={`${name} logo`}
      wrapperClassName="h-14 w-14"
      imageClassName="p-2"
      fallback={<Building2 className="h-5 w-5 text-white/50" />}
    />
  );
}

function BrandSettingsPreview({ settings, copy }: { settings: SettingsRecord; copy: HubOwnerCopy["ownerDashboardClient"] }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(201,162,39,0.16),rgba(255,255,255,0.04))] p-5 shadow-[0_18px_70px_rgba(0,0,0,0.24)]">
      <div className="text-xs uppercase tracking-[0.2em] text-white/45">{copy.brandPreviewEyebrow}</div>
      <div className="mt-4 flex items-center gap-4">
        <RemoteImageFrame
          src={settings.logo_url}
          alt={settings.brand_title || "Henry & Co."}
          wrapperClassName="h-16 w-16"
          imageClassName="p-2"
          fallback={<Sparkles className="h-6 w-6 text-[#C9A227]" />}
        />

        <div className="min-w-0">
          <div className="text-lg font-semibold tracking-tight text-white">
            {settings.brand_title || "Henry & Co."}
          </div>
          <div className="mt-1 text-xs uppercase tracking-[0.2em] text-white/45">
            {settings.brand_subtitle || copy.brandPreviewDefaultSubtitle}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/12 bg-black/20 px-3 py-1 text-[11px] text-white/76">
              Accent {settings.brand_accent || "#C9A227"}
            </span>
            <span className="rounded-full border border-white/12 bg-black/20 px-3 py-1 text-[11px] text-white/76">
              {settings.base_domain || "henrycogroup.com"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">{copy.brandPreviewLogoLabel}</div>
          <div className="mt-2 truncate text-sm text-white/84">
            {normalizeText(settings.logo_url) || copy.brandPreviewNoLogoUrl}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">{copy.brandPreviewFaviconLabel}</div>
          <div className="mt-2 truncate text-sm text-white/84">
            {normalizeText(settings.favicon_url) || copy.brandPreviewFaviconFallback}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-white/45">
            <Mail className="h-3.5 w-3.5 text-[#C9A227]" />
            {copy.brandPreviewSupportEmailLabel}
          </div>
          <div className="mt-2 text-sm text-white/84">
            {settings.support_email || copy.brandPreviewNotSet}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-white/45">
            <Phone className="h-3.5 w-3.5 text-[#C9A227]" />
            {copy.brandPreviewSupportPhoneLabel}
          </div>
          <div className="mt-2 text-sm text-white/84">
            {settings.support_phone || copy.brandPreviewNotSet}
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonListButton({
  person,
  active,
  onClick,
  copy,
}: {
  person: PersonRecord;
  active: boolean;
  onClick: () => void;
  copy: Pick<HubOwnerCopy["ownerDashboardClient"], "leadershipToneOwner" | "leadershipToneManagement" | "leadershipToneFeatured" | "leadershipToneLeadership" | "leadershipPublishedBadge" | "leadershipDraftBadge">;
}) {
  const toneLabels = { owner: copy.leadershipToneOwner, management: copy.leadershipToneManagement, featured: copy.leadershipToneFeatured, leadership: copy.leadershipToneLeadership };
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-[24px] border p-3 text-left transition ${
        active
          ? "border-[#C9A227] bg-[#C9A227]/14"
          : "border-white/10 bg-black/25 hover:bg-white/10"
      }`}
    >
      <div className="flex items-start gap-3">
        <PersonAvatarFrame person={person} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">{person.full_name}</div>
          <div className="mt-1 truncate text-xs text-white/58">{personRoleLabel(person)}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${personToneClasses(
                person
              )}`}
            >
              {personToneLabel(person, toneLabels)}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] text-white/65">
              {person.is_published !== false ? copy.leadershipPublishedBadge : copy.leadershipDraftBadge}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function LeadershipPreviewCard({ person, copy }: { person: PersonRecord; copy: HubOwnerCopy["ownerDashboardClient"] }) {
  const toneLabels = { owner: copy.leadershipToneOwner, management: copy.leadershipToneManagement, featured: copy.leadershipToneFeatured, leadership: copy.leadershipToneLeadership };
  const toneIcon =
    personTone(person) === "owner" ? (
      <Crown className="h-4 w-4" />
    ) : personTone(person) === "manager" ? (
      <ShieldCheck className="h-4 w-4" />
    ) : personTone(person) === "featured" ? (
      <Star className="h-4 w-4" />
    ) : (
      <UserSquare2 className="h-4 w-4" />
    );

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-[0_18px_70px_rgba(0,0,0,0.24)]">
      <div className="text-xs uppercase tracking-[0.2em] text-white/45">{copy.leadershipSelectedEyebrow}</div>
      <div className="mt-4 flex items-start gap-4">
        <PersonAvatarFrame person={person} sizeClassName="h-20 w-20" />

        <div className="min-w-0 flex-1">
          <div className="text-xl font-semibold tracking-tight text-white">
            {person.full_name || copy.leadershipNewRecord}
          </div>
          <div className="mt-2 text-sm text-white/70">{personRoleLabel(person)}</div>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-white/68">
            <span className="text-[#C9A227]">{toneIcon}</span>
            {personToneLabel(person, toneLabels)}
          </div>
        </div>
      </div>

      <p className="mt-5 text-sm leading-7 text-white/66">
        {normalizeText(person.short_bio) ||
          normalizeText(person.long_bio) ||
          copy.leadershipPreviewPlaceholder}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MiniStatCard
          label={copy.leadershipDivisionServedLabel}
          value={normalizeText(person.division_slug).replace(/-/g, " ") || copy.leadershipNoDivisionOption}
        />
        <MiniStatCard
          label={copy.leadershipSortOrderLabel}
          value={String(Number(person.sort_order ?? 100))}
        />
      </div>
    </div>
  );
}

function DivisionListButton({
  division,
  active,
  onClick,
  leadLabel,
  statusActiveFallback,
}: {
  division: DivisionRecord;
  active: boolean;
  onClick: () => void;
  leadLabel: string;
  statusActiveFallback: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-[24px] border p-3 text-left transition ${
        active
          ? "border-[#C9A227] bg-[#C9A227]/14"
          : "border-white/10 bg-black/25 hover:bg-white/10"
      }`}
    >
      <div className="flex items-start gap-3">
        <DivisionLogoFrame src={division.logo_url} name={division.name || "Division"} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">{division.name}</div>
          <div className="mt-1 truncate text-xs text-white/58">
            {normalizeText(division.tagline) || normalizeText(division.slug)}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] text-white/72">
              {division.status || statusActiveFallback}
            </span>
            {division.lead_name ? (
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] text-white/72">
                {leadLabel}: {division.lead_name}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}

function DivisionPreviewCard({ division, copy }: { division: DivisionRecord; copy: HubOwnerCopy["ownerDashboardClient"] }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-[0_18px_70px_rgba(0,0,0,0.24)]">
      <div className="text-xs uppercase tracking-[0.2em] text-white/45">{copy.divisionsSelectedEyebrow}</div>
      <div className="mt-4 flex items-start gap-4">
        <DivisionLogoFrame src={division.logo_url} name={division.name || "Division"} />

        <div className="min-w-0 flex-1">
          <div className="text-xl font-semibold tracking-tight text-white">
            {division.name || copy.divisionsNewFallbackTitle}
          </div>
          <div className="mt-2 text-sm text-white/70">
            {normalizeText(division.tagline) || copy.divisionsNewFallbackDescription}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/68">
              {division.status || copy.divisionsStatusActive}
            </span>
            {division.is_featured ? (
              <span className="rounded-full border border-[#C9A227]/20 bg-[#C9A227]/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[#f6df9a]">
                {copy.divisionsFeaturedBadge}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MiniStatCard label={copy.divisionsLeadLabel} value={normalizeText(division.lead_name) || copy.brandPreviewNotSet} />
        <MiniStatCard
          label={copy.divisionsSubdomainLabel}
          value={normalizeText(division.subdomain) || copy.brandPreviewNotSet}
        />
      </div>

      {division.primary_url ? (
        <a
          href={division.primary_url}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/86 transition hover:bg-white/10"
        >
          {copy.divisionsPreviewDestination}
          <ExternalLink className="h-4 w-4" />
        </a>
      ) : null}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm transition ${
        active
          ? "border-[#C9A227] bg-[#C9A227] text-black"
          : "border-white/10 bg-white/[0.06] text-white/84 hover:bg-white/10"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ActionButton({
  onClick,
  saving,
  label,
  savingLabel,
}: {
  onClick: () => void;
  saving: boolean;
  label: string;
  savingLabel: string;
}) {
  return (
    <button
      onClick={() => void onClick()}
      disabled={saving}
      className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#C9A227] px-5 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Save className="h-4 w-4" />
      {saving ? savingLabel : label}
    </button>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm text-white/80">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm text-white/80">{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm text-white/80">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none"
      >
        {options.map((item) => (
          <option
            key={`${item.label}-${item.value}`}
            value={item.value}
            className="bg-[#0B1020] text-white"
          >
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex h-11 items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 text-sm text-white/84">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
    </label>
  );
}
