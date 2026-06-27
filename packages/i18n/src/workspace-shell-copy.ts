import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * Copy for the shared @henryco/workspace-shell chrome primitives
 * (desktop sidebar, mobile bottom-nav, and the shell content frame).
 * One top-level key per component; nested keys per string. EN is the
 * exhaustive baseline; fr/es/pt/ar/de/it/zh are authored. ig/yo/ha/hi
 * intentionally fall back to EN (human-translation only).
 *
 * The brand word "HenryCo" is never present in these strings, so no
 * verbatim brand handling is needed here.
 */
export type WorkspaceShellCopy = {
  sidebar: {
    navAria: string;
    attentionTitle: (count: number) => string;
    attentionBody: string;
    sectionsAria: string;
    badgeNew: (count: number) => string;
    avatarAlt: string;
    viewerFallback: string;
    accountSettings: string;
  };
  bottomNav: {
    navAria: string;
    badgeNew: (count: number) => string;
  };
  shell: {
    railAria: string;
  };
};

const EN: WorkspaceShellCopy = {
  sidebar: {
    navAria: "Primary navigation",
    attentionTitle: (count: number) =>
      `${count} item${count === 1 ? "" : "s"} need attention`,
    attentionBody:
      "Outstanding items, files awaiting your review, and unread messages from the team.",
    sectionsAria: "Sections",
    badgeNew: (count: number) => `${count} new`,
    avatarAlt: "Profile",
    viewerFallback: "Member",
    accountSettings: "Account & settings",
  },
  bottomNav: {
    navAria: "Mobile navigation",
    badgeNew: (count: number) => `${count} new`,
  },
  shell: {
    railAria: "Sidebar context",
  },
};

const FR: DeepPartial<WorkspaceShellCopy> = {
  sidebar: {
    navAria: "Navigation principale",
    attentionTitle: (count: number) =>
      `${count} élément${count === 1 ? "" : "s"} nécessite${count === 1 ? "" : "nt"} votre attention`,
    attentionBody:
      "Éléments en attente, fichiers à examiner et messages non lus de l'équipe.",
    sectionsAria: "Sections",
    badgeNew: (count: number) => `${count} nouveau${count === 1 ? "" : "x"}`,
    avatarAlt: "Profil",
    viewerFallback: "Membre",
    accountSettings: "Compte et paramètres",
  },
  bottomNav: {
    navAria: "Navigation mobile",
    badgeNew: (count: number) => `${count} nouveau${count === 1 ? "" : "x"}`,
  },
  shell: {
    railAria: "Contexte de la barre latérale",
  },
};

const ES: DeepPartial<WorkspaceShellCopy> = {
  sidebar: {
    navAria: "Navegación principal",
    attentionTitle: (count: number) =>
      `${count} elemento${count === 1 ? "" : "s"} requiere${count === 1 ? "" : "n"} tu atención`,
    attentionBody:
      "Elementos pendientes, archivos en espera de tu revisión y mensajes sin leer del equipo.",
    sectionsAria: "Secciones",
    badgeNew: (count: number) => `${count} nuevo${count === 1 ? "" : "s"}`,
    avatarAlt: "Perfil",
    viewerFallback: "Miembro",
    accountSettings: "Cuenta y ajustes",
  },
  bottomNav: {
    navAria: "Navegación móvil",
    badgeNew: (count: number) => `${count} nuevo${count === 1 ? "" : "s"}`,
  },
  shell: {
    railAria: "Contexto de la barra lateral",
  },
};

const PT: DeepPartial<WorkspaceShellCopy> = {
  sidebar: {
    navAria: "Navegação principal",
    attentionTitle: (count: number) =>
      `${count} item${count === 1 ? "" : "ns"} precisa${count === 1 ? "" : "m"} de atenção`,
    attentionBody:
      "Itens pendentes, arquivos aguardando sua revisão e mensagens não lidas da equipe.",
    sectionsAria: "Seções",
    badgeNew: (count: number) => `${count} novo${count === 1 ? "" : "s"}`,
    avatarAlt: "Perfil",
    viewerFallback: "Membro",
    accountSettings: "Conta e configurações",
  },
  bottomNav: {
    navAria: "Navegação móvel",
    badgeNew: (count: number) => `${count} novo${count === 1 ? "" : "s"}`,
  },
  shell: {
    railAria: "Contexto da barra lateral",
  },
};

const AR: DeepPartial<WorkspaceShellCopy> = {
  sidebar: {
    navAria: "التنقل الرئيسي",
    attentionTitle: (count: number) => `${count} عنصر يحتاج إلى انتباهك`,
    attentionBody:
      "عناصر معلقة وملفات بانتظار مراجعتك ورسائل غير مقروءة من الفريق.",
    sectionsAria: "الأقسام",
    badgeNew: (count: number) => `${count} جديد`,
    avatarAlt: "الملف الشخصي",
    viewerFallback: "عضو",
    accountSettings: "الحساب والإعدادات",
  },
  bottomNav: {
    navAria: "التنقل عبر الجوال",
    badgeNew: (count: number) => `${count} جديد`,
  },
  shell: {
    railAria: "سياق الشريط الجانبي",
  },
};

const DE: DeepPartial<WorkspaceShellCopy> = {
  sidebar: {
    navAria: "Hauptnavigation",
    attentionTitle: (count: number) =>
      `${count} Element${count === 1 ? "" : "e"} ${count === 1 ? "benötigt" : "benötigen"} Ihre Aufmerksamkeit`,
    attentionBody:
      "Offene Elemente, Dateien zur Überprüfung und ungelesene Nachrichten vom Team.",
    sectionsAria: "Abschnitte",
    badgeNew: (count: number) => `${count} neu`,
    avatarAlt: "Profil",
    viewerFallback: "Mitglied",
    accountSettings: "Konto und Einstellungen",
  },
  bottomNav: {
    navAria: "Mobile Navigation",
    badgeNew: (count: number) => `${count} neu`,
  },
  shell: {
    railAria: "Seitenleisten-Kontext",
  },
};

const IT: DeepPartial<WorkspaceShellCopy> = {
  sidebar: {
    navAria: "Navigazione principale",
    attentionTitle: (count: number) =>
      `${count} elemento${count === 1 ? "" : "i"} richiede${count === 1 ? "" : "ono"} la tua attenzione`,
    attentionBody:
      "Elementi in sospeso, file in attesa della tua revisione e messaggi non letti dal team.",
    sectionsAria: "Sezioni",
    badgeNew: (count: number) => `${count} nuovo${count === 1 ? "" : "i"}`,
    avatarAlt: "Profilo",
    viewerFallback: "Membro",
    accountSettings: "Account e impostazioni",
  },
  bottomNav: {
    navAria: "Navigazione mobile",
    badgeNew: (count: number) => `${count} nuovo${count === 1 ? "" : "i"}`,
  },
  shell: {
    railAria: "Contesto della barra laterale",
  },
};

const ZH: DeepPartial<WorkspaceShellCopy> = {
  sidebar: {
    navAria: "主导航",
    attentionTitle: (count: number) => `${count} 个项目需要处理`,
    attentionBody: "待处理项目、等待您审阅的文件以及团队的未读消息。",
    sectionsAria: "板块",
    badgeNew: (count: number) => `${count} 条新消息`,
    avatarAlt: "个人资料",
    viewerFallback: "成员",
    accountSettings: "账户和设置",
  },
  bottomNav: {
    navAria: "移动导航",
    badgeNew: (count: number) => `${count} 条新消息`,
  },
  shell: {
    railAria: "侧边栏上下文",
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<WorkspaceShellCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
};
// ig, yo, ha, hi are intentionally OMITTED -> fall back to EN (human-translation only).

export function getWorkspaceShellCopy(locale: AppLocale): WorkspaceShellCopy {
  const o = LOCALE_MAP[locale];
  if (o)
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      o as unknown as Record<string, unknown>,
    ) as unknown as WorkspaceShellCopy;
  return EN;
}
