/**
 * @henryco/i18n/ui-misc-copy — shared-package UI miscellany copy.
 *
 * Internationalizes hardcoded customer-facing strings in cross-cutting
 * shared-package UI components (work-unit "pkg-ui-misc"):
 *   - chat-composer AttachmentPreview (attachment chips + a11y labels)
 *   - ui/public PublicNavbar (mobile menu toggle a11y label)
 *   - ui/public ThemeToggle (theme toggle a11y label)
 *
 * Source-of-truth strings are EN. Each authored locale supplies a
 * `DeepPartial` that `deepMergeMessages` merges over EN, so any future
 * leaf gracefully falls back to English until the locale gets translated.
 *
 * Authored locales: fr/es/pt/ar/de/it/zh (+ EN baseline). ig/yo/ha/hi are
 * intentionally omitted and fall back to EN (human-translation only).
 */
import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

export type UiMiscCopy = {
  /** chat-composer AttachmentPreview component. */
  attachmentPreview: {
    /** aria-label on the attachments list container. */
    listLabel: string;
    /** aria-label / default prop for the remove-attachment button. */
    removeLabel: string;
    /** aria-label / default prop for the retry-upload button. */
    retryLabel: string;
    /** Status text shown while an upload is in progress (no percentage yet). */
    uploading: string;
    /** Fallback status text shown when an upload fails without a specific error. */
    failed: string;
  };
  /** ui/public PublicNavbar component. */
  navbar: {
    /** aria-label on the mobile menu open/close button. */
    toggleMenu: string;
  };
  /** ui/public ThemeToggle component. */
  themeToggle: {
    /** aria-label on the light/dark theme toggle button. */
    toggleTheme: string;
  };
};

const EN: UiMiscCopy = {
  attachmentPreview: {
    listLabel: "Attached files",
    removeLabel: "Remove attachment",
    retryLabel: "Retry upload",
    uploading: "Uploading…",
    failed: "Failed",
  },
  navbar: {
    toggleMenu: "Toggle menu",
  },
  themeToggle: {
    toggleTheme: "Toggle theme",
  },
};

const FR: DeepPartial<UiMiscCopy> = {
  attachmentPreview: {
    listLabel: "Fichiers joints",
    removeLabel: "Supprimer la pièce jointe",
    retryLabel: "Réessayer l’envoi",
    uploading: "Envoi…",
    failed: "Échec",
  },
  navbar: {
    toggleMenu: "Afficher/masquer le menu",
  },
  themeToggle: {
    toggleTheme: "Changer de thème",
  },
};

const ES: DeepPartial<UiMiscCopy> = {
  attachmentPreview: {
    listLabel: "Archivos adjuntos",
    removeLabel: "Quitar adjunto",
    retryLabel: "Reintentar la subida",
    uploading: "Subiendo…",
    failed: "Error",
  },
  navbar: {
    toggleMenu: "Mostrar/ocultar el menú",
  },
  themeToggle: {
    toggleTheme: "Cambiar de tema",
  },
};

const PT: DeepPartial<UiMiscCopy> = {
  attachmentPreview: {
    listLabel: "Arquivos anexados",
    removeLabel: "Remover anexo",
    retryLabel: "Tentar enviar novamente",
    uploading: "Enviando…",
    failed: "Falha",
  },
  navbar: {
    toggleMenu: "Mostrar/ocultar o menu",
  },
  themeToggle: {
    toggleTheme: "Alternar tema",
  },
};

const AR: DeepPartial<UiMiscCopy> = {
  attachmentPreview: {
    listLabel: "الملفات المرفقة",
    removeLabel: "إزالة المرفق",
    retryLabel: "إعادة محاولة الرفع",
    uploading: "جارٍ الرفع…",
    failed: "فشل",
  },
  navbar: {
    toggleMenu: "إظهار/إخفاء القائمة",
  },
  themeToggle: {
    toggleTheme: "تبديل السمة",
  },
};

const DE: DeepPartial<UiMiscCopy> = {
  attachmentPreview: {
    listLabel: "Angehängte Dateien",
    removeLabel: "Anhang entfernen",
    retryLabel: "Upload wiederholen",
    uploading: "Wird hochgeladen…",
    failed: "Fehlgeschlagen",
  },
  navbar: {
    toggleMenu: "Menü ein-/ausblenden",
  },
  themeToggle: {
    toggleTheme: "Design umschalten",
  },
};

const IT: DeepPartial<UiMiscCopy> = {
  attachmentPreview: {
    listLabel: "File allegati",
    removeLabel: "Rimuovi allegato",
    retryLabel: "Riprova il caricamento",
    uploading: "Caricamento…",
    failed: "Non riuscito",
  },
  navbar: {
    toggleMenu: "Mostra/nascondi il menu",
  },
  themeToggle: {
    toggleTheme: "Cambia tema",
  },
};

const ZH: DeepPartial<UiMiscCopy> = {
  attachmentPreview: {
    listLabel: "已附加的文件",
    removeLabel: "移除附件",
    retryLabel: "重试上传",
    uploading: "上传中…",
    failed: "失败",
  },
  navbar: {
    toggleMenu: "切换菜单",
  },
  themeToggle: {
    toggleTheme: "切换主题",
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<UiMiscCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
};
// ig, yo, ha, hi are intentionally OMITTED -> fall back to EN (human-translation only).

export function getUiMiscCopy(locale: AppLocale): UiMiscCopy {
  const o = LOCALE_MAP[locale];
  if (o)
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      o as unknown as Record<string, unknown>,
    ) as unknown as UiMiscCopy;
  return EN;
}
