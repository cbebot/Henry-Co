import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * HubWorkspaceCopy — i18n surface for the hub Staff Workspace entry route.
 *
 * Covers the user-visible literals on `/workspace` and the optional
 * `/workspace/[...slug]` catch-all that redirects to the account staff
 * shell: route metadata (title, description) and the route-level loader
 * (brand title, subtitle, status label).
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each locale is
 * a Partial that deep-merges over EN so missing keys fall through to EN
 * silently. Mirrors `hub-public-copy.ts`.
 */
export type HubWorkspaceCopy = {
  metadata: {
    title: string;
    description: string;
  };
  loader: {
    title: string;
    subtitle: string;
    statusLabel: string;
  };
};

const HUB_WORKSPACE_COPY_EN: HubWorkspaceCopy = {
  metadata: {
    title: "Henry Onyx Staff HQ",
    description:
      "Role-aware HenryCo Staff HQ for managers, operators, finance reviewers, and cross-division teams.",
  },
  loader: {
    title: "Henry Onyx",
    subtitle: "Staff Workspace",
    statusLabel: "Loading workspace",
  },
};

const HUB_WORKSPACE_COPY_FR: DeepPartial<HubWorkspaceCopy> = {
  metadata: {
    title: "Henry Onyx — QG du personnel",
    description:
      "QG du personnel HenryCo selon le rôle : pour les responsables, opérateurs, contrôleurs financiers et équipes inter-divisions.",
  },
  loader: {
    title: "Henry Onyx",
    subtitle: "Espace de travail du personnel",
    statusLabel: "Chargement de l’espace de travail",
  },
};

const HUB_WORKSPACE_COPY_ES: DeepPartial<HubWorkspaceCopy> = {
  metadata: {
    title: "Henry Onyx — Central del personal",
    description:
      "Central del personal HenryCo según el rol: para responsables, operadores, revisores financieros y equipos interdivisionales.",
  },
  loader: {
    title: "Henry Onyx",
    subtitle: "Espacio de trabajo del personal",
    statusLabel: "Cargando el espacio de trabajo",
  },
};

const HUB_WORKSPACE_COPY_PT: DeepPartial<HubWorkspaceCopy> = {
  metadata: {
    title: "Henry Onyx — Central da equipa",
    description:
      "Central da equipa HenryCo orientada por função: para responsáveis, operadores, revisores financeiros e equipas entre divisões.",
  },
  loader: {
    title: "Henry Onyx",
    subtitle: "Espaço de trabalho da equipa",
    statusLabel: "A carregar o espaço de trabalho",
  },
};

const HUB_WORKSPACE_COPY_AR: DeepPartial<HubWorkspaceCopy> = {
  metadata: {
    title: "Henry Onyx — مقر فريق العمل",
    description:
      "مقر فريق العمل في HenryCo بحسب الدور: للمديرين والمشغلين ومراجعي الشؤون المالية والفرق العاملة عبر الأقسام.",
  },
  loader: {
    title: "Henry Onyx",
    subtitle: "مساحة عمل الفريق",
    statusLabel: "جارٍ تحميل مساحة العمل",
  },
};

const HUB_WORKSPACE_COPY_DE: DeepPartial<HubWorkspaceCopy> = {
  metadata: {
    title: "Henry Onyx — Mitarbeiterzentrale",
    description:
      "Rollenbasierte HenryCo-Mitarbeiterzentrale für Führungskräfte, Operatoren, Finanzprüfer und divisionsübergreifende Teams.",
  },
  loader: {
    title: "Henry Onyx",
    subtitle: "Mitarbeiter-Arbeitsbereich",
    statusLabel: "Arbeitsbereich wird geladen",
  },
};

const HUB_WORKSPACE_COPY_IT: DeepPartial<HubWorkspaceCopy> = {
  metadata: {
    title: "Henry Onyx — Quartier generale del personale",
    description:
      "Quartier generale del personale HenryCo basato sul ruolo: per responsabili, operatori, revisori finanziari e team interdivisionali.",
  },
  loader: {
    title: "Henry Onyx",
    subtitle: "Spazio di lavoro del personale",
    statusLabel: "Caricamento dello spazio di lavoro",
  },
};

const HUB_WORKSPACE_COPY_ZH: DeepPartial<HubWorkspaceCopy> = {
  metadata: {
    title: "Henry Onyx 员工总部",
    description:
      "HenryCo 员工总部按角色划分,服务于管理者、运营人员、财务审核人员及跨部门团队。",
  },
  loader: {
    title: "Henry Onyx",
    subtitle: "员工工作区",
    statusLabel: "正在加载工作区",
  },
};

const HUB_WORKSPACE_COPY_HI: DeepPartial<HubWorkspaceCopy> = {
  metadata: {
    title: "Henry Onyx — स्टाफ़ मुख्यालय",
    description:
      "HenryCo स्टाफ़ मुख्यालय भूमिका के अनुसार: प्रबंधकों, संचालकों, वित्तीय समीक्षकों और क्रॉस-डिवीज़न टीमों के लिए।",
  },
  loader: {
    title: "Henry Onyx",
    subtitle: "स्टाफ़ कार्यक्षेत्र",
    statusLabel: "कार्यक्षेत्र लोड हो रहा है",
  },
};

const HUB_WORKSPACE_COPY_IG: DeepPartial<HubWorkspaceCopy> = {
  metadata: {
    title: "Henry Onyx — Isi Ụlọ Ọrụ Ndị Ọrụ",
    description:
      "Isi ụlọ ọrụ HenryCo dabere n’ọrụ onye ọ bụla na-arụ — maka ndị nlekọta, ndị na-arụ ọrụ, ndị na-enyocha ego, na otu na-arụkọ ọrụ n’etiti ngalaba.",
  },
  loader: {
    title: "Henry Onyx",
    subtitle: "Ebe ọrụ ndị ọrụ",
    statusLabel: "Na-ebudata ebe ọrụ",
  },
};

const HUB_WORKSPACE_COPY_YO: DeepPartial<HubWorkspaceCopy> = {
  metadata: {
    title: "Henry Onyx — Olú-Ọ́fíìsì Òṣìṣẹ́",
    description:
      "Olú-ọ́fíìsì òṣìṣẹ́ HenryCo tó dá lórí ipa: fún àwọn olùdarí, òṣìṣẹ́ ẹ̀rọ, olùṣàyẹ̀wò ìnáwó àti àwọn ẹgbẹ́ tó ń ṣiṣẹ́ kọjá àwọn ìpín.",
  },
  loader: {
    title: "Henry Onyx",
    subtitle: "Àyè iṣẹ́ òṣìṣẹ́",
    statusLabel: "Ń gbé àyè iṣẹ́ wọlé",
  },
};

const HUB_WORKSPACE_COPY_HA: DeepPartial<HubWorkspaceCopy> = {
  metadata: {
    title: "Henry Onyx — Babbar Cibiyar Ma’aikata",
    description:
      "Babbar cibiyar ma’aikatan HenryCo gwargwadon matsayi — ga manyan masu kula, ma’aikata, masu duba al’amuran kuɗi, da ƙungiyoyin da ke aiki tsakanin rassa.",
  },
  loader: {
    title: "Henry Onyx",
    subtitle: "Filin aikin ma’aikata",
    statusLabel: "Ana loda filin aiki",
  },
};

const HUB_WORKSPACE_LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<HubWorkspaceCopy>>> = {
  fr: HUB_WORKSPACE_COPY_FR,
  es: HUB_WORKSPACE_COPY_ES,
  pt: HUB_WORKSPACE_COPY_PT,
  ar: HUB_WORKSPACE_COPY_AR,
  de: HUB_WORKSPACE_COPY_DE,
  it: HUB_WORKSPACE_COPY_IT,
  zh: HUB_WORKSPACE_COPY_ZH,
  hi: HUB_WORKSPACE_COPY_HI,
  ig: HUB_WORKSPACE_COPY_IG,
  yo: HUB_WORKSPACE_COPY_YO,
  ha: HUB_WORKSPACE_COPY_HA,
};

export function getHubWorkspaceCopy(locale: AppLocale): HubWorkspaceCopy {
  const overrides = HUB_WORKSPACE_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      HUB_WORKSPACE_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as HubWorkspaceCopy;
  }
  return HUB_WORKSPACE_COPY_EN;
}

/** @internal */
export function __dangerouslyGetEnglishHubWorkspaceCopy(): HubWorkspaceCopy {
  return HUB_WORKSPACE_COPY_EN;
}
