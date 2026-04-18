import { isAppLocale, normalizeLocale, type AppLocale } from "@henryco/i18n";

type KnownNotificationLocalizationKey =
  | "support.request.created";

type NotificationLocalizationPayload = {
  key?: string | null;
  locale?: string | null;
  params?: Record<string, unknown> | null;
  rendered?: {
    title?: string | null;
    body?: string | null;
  } | null;
};

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNullableText(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function safeLocale(value: unknown) {
  const normalized = normalizeLocale(asNullableText(value));
  return isAppLocale(normalized) ? normalized : "en";
}

function subjectFromParams(params: Record<string, unknown>) {
  return asNullableText(params.subject) || asNullableText(params.request_subject) || "your request";
}

function renderKnownNotification(
  key: KnownNotificationLocalizationKey,
  locale: AppLocale,
  params: Record<string, unknown>,
) {
  if (key === "support.request.created") {
    const subject = subjectFromParams(params);

    if (locale === "fr") {
      return {
        title: "Demande d'assistance creee",
        body: `Votre demande "${subject}" a ete envoyee. Nous reviendrons vers vous bientot.`,
      };
    }

    if (locale === "es") {
      return {
        title: "Solicitud de soporte creada",
        body: `Tu solicitud "${subject}" se ha enviado. Te responderemos pronto.`,
      };
    }

    if (locale === "pt") {
      return {
        title: "Solicitacao de suporte criada",
        body: `Seu pedido "${subject}" foi enviado. Falaremos com voce em breve.`,
      };
    }

    if (locale === "ar") {
      return {
        title: "تم إنشاء طلب الدعم",
        body: `تم إرسال طلبك "${subject}". سنعود إليك قريبًا.`,
      };
    }

    if (locale === "de") {
      return {
        title: "Supportanfrage erstellt",
        body: `Deine Anfrage "${subject}" wurde uebermittelt. Wir melden uns in Kuerze.`,
      };
    }

    if (locale === "it") {
      return {
        title: "Richiesta di supporto creata",
        body: `La tua richiesta "${subject}" e stata inviata. Ti risponderemo presto.`,
      };
    }

    return {
      title: "Support request created",
      body: `Your request "${subject}" has been submitted. We'll get back to you soon.`,
    };
  }

  return null;
}

function readLocalization(row: Record<string, unknown>): NotificationLocalizationPayload | null {
  const detailPayload = asObject(row.detail_payload);
  const localization = detailPayload.localization;
  if (!localization || typeof localization !== "object" || Array.isArray(localization)) {
    return null;
  }

  return localization as NotificationLocalizationPayload;
}

export function buildNotificationLocalization(input: {
  key: string;
  locale: AppLocale;
  params?: Record<string, unknown>;
  renderedTitle: string;
  renderedBody: string;
}) {
  return {
    key: input.key,
    locale: input.locale,
    params: input.params || {},
    rendered: {
      title: input.renderedTitle,
      body: input.renderedBody,
    },
  };
}

export function resolveNotificationPresentation(input: {
  row: Record<string, unknown>;
  locale: AppLocale;
}) {
  const { row, locale } = input;
  const fallbackTitle = asText(row.title, "Notification");
  const fallbackBody = asText(row.body);
  const localization = readLocalization(row);

  if (!localization?.key) {
    return { title: fallbackTitle, body: fallbackBody };
  }

  const params = asObject(localization.params);
  const rendered = localization.rendered && typeof localization.rendered === "object"
    ? localization.rendered
    : null;
  const key = localization.key as KnownNotificationLocalizationKey;
  const localized = key ? renderKnownNotification(key, locale, params) : null;

  if (localized) {
    return localized;
  }

  return {
    title: asNullableText(rendered?.title) || fallbackTitle,
    body: asNullableText(rendered?.body) || fallbackBody,
  };
}

export function resolveNotificationStoredLocale(row: Record<string, unknown>): AppLocale | null {
  const localization = readLocalization(row);
  if (!localization?.locale) return null;
  return safeLocale(localization.locale);
}
