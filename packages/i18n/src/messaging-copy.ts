import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * MessagingCopy — i18n surface for the contact-safety hint that renders
 * when a message is blocked or masked by `@henryco/contact-safety`. The
 * safety check itself returns only a `contact_blocked` reason code; this
 * module holds the user-facing block/mask hint copy the surface keys off.
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each listed
 * locale is a Partial that deep-merges over EN so missing keys fall through
 * to EN silently. Mirrors the shape of `care-pricing-copy.ts`.
 *
 * ig / yo / ha / hi are INTENTIONALLY omitted from the locale map → they
 * resolve to the EN baseline verbatim. This honours the absolute
 * no-machine-translation rule for Nigerian languages + Hindi by omission,
 * never by adding machine translations. The brand name "Henry Onyx" stays
 * verbatim in every locale's strings.
 */
export type MessagingCopy = {
  contactSafety: {
    blockedTitle: string;
    blockedBody: string;
    maskedTitle: string;
    maskedBody: string;
    reassurance: string;
    dismiss: string;
  };
};

const MESSAGING_COPY_EN: MessagingCopy = {
  contactSafety: {
    blockedTitle: "Let's keep this on Henry Onyx",
    blockedBody: "Phone numbers, emails, and off-platform links can't be sent. Keeping the conversation here is how we protect you from scammers.",
    maskedTitle: "We hid some details",
    maskedBody: "Contact details and outside links are hidden so the conversation stays safe on Henry Onyx.",
    reassurance: "You're protected here.",
    dismiss: "Got it",
  },
};

const MESSAGING_COPY_FR: DeepPartial<MessagingCopy> = {
  contactSafety: {
    blockedTitle: "Restons sur Henry Onyx",
    blockedBody: "Les numéros de téléphone, e-mails et liens externes ne peuvent pas être envoyés. Garder la conversation ici vous protège des arnaqueurs.",
    maskedTitle: "Nous avons masqué certains détails",
    maskedBody: "Les coordonnées et liens externes sont masqués pour que la conversation reste sûre sur Henry Onyx.",
    reassurance: "Vous êtes protégé ici.",
    dismiss: "Compris",
  },
};
const MESSAGING_COPY_ES: DeepPartial<MessagingCopy> = {
  contactSafety: {
    blockedTitle: "Sigamos en Henry Onyx",
    blockedBody: "No se pueden enviar números de teléfono, correos ni enlaces externos. Mantener la conversación aquí te protege de estafadores.",
    maskedTitle: "Ocultamos algunos datos",
    maskedBody: "Los datos de contacto y enlaces externos se ocultan para que la conversación siga siendo segura en Henry Onyx.",
    reassurance: "Aquí estás protegido.",
    dismiss: "Entendido",
  },
};
const MESSAGING_COPY_PT: DeepPartial<MessagingCopy> = {
  contactSafety: {
    blockedTitle: "Vamos manter no Henry Onyx",
    blockedBody: "Números de telefone, e-mails e links externos não podem ser enviados. Manter a conversa aqui protege você de golpistas.",
    maskedTitle: "Ocultamos alguns detalhes",
    maskedBody: "Dados de contato e links externos ficam ocultos para a conversa permanecer segura no Henry Onyx.",
    reassurance: "Você está protegido aqui.",
    dismiss: "Entendi",
  },
};
const MESSAGING_COPY_AR: DeepPartial<MessagingCopy> = {
  contactSafety: {
    blockedTitle: "لنُبقِ المحادثة على Henry Onyx",
    blockedBody: "لا يمكن إرسال أرقام الهواتف أو البريد الإلكتروني أو الروابط الخارجية. إبقاء المحادثة هنا يحميك من المحتالين.",
    maskedTitle: "أخفينا بعض التفاصيل",
    maskedBody: "تُخفى بيانات التواصل والروابط الخارجية لتبقى المحادثة آمنة على Henry Onyx.",
    reassurance: "أنت محميّ هنا.",
    dismiss: "حسنًا",
  },
};
const MESSAGING_COPY_DE: DeepPartial<MessagingCopy> = {
  contactSafety: {
    blockedTitle: "Bleiben wir bei Henry Onyx",
    blockedBody: "Telefonnummern, E-Mails und externe Links können nicht gesendet werden. Das Gespräch hier zu halten schützt Sie vor Betrügern.",
    maskedTitle: "Wir haben einige Angaben ausgeblendet",
    maskedBody: "Kontaktdaten und externe Links werden ausgeblendet, damit das Gespräch auf Henry Onyx sicher bleibt.",
    reassurance: "Hier sind Sie geschützt.",
    dismiss: "Verstanden",
  },
};
const MESSAGING_COPY_IT: DeepPartial<MessagingCopy> = {
  contactSafety: {
    blockedTitle: "Restiamo su Henry Onyx",
    blockedBody: "Numeri di telefono, email e link esterni non possono essere inviati. Mantenere qui la conversazione ti protegge dai truffatori.",
    maskedTitle: "Abbiamo nascosto alcuni dettagli",
    maskedBody: "I recapiti e i link esterni vengono nascosti perché la conversazione resti sicura su Henry Onyx.",
    reassurance: "Qui sei protetto.",
    dismiss: "Ho capito",
  },
};
const MESSAGING_COPY_ZH: DeepPartial<MessagingCopy> = {
  contactSafety: {
    blockedTitle: "请继续在 Henry Onyx 上沟通",
    blockedBody: "电话号码、电子邮件和站外链接无法发送。把对话留在这里能保护你免受诈骗。",
    maskedTitle: "我们隐藏了部分信息",
    maskedBody: "联系方式和外部链接已被隐藏，让对话在 Henry Onyx 上保持安全。",
    reassurance: "你在这里受到保护。",
    dismiss: "知道了",
  },
};

const MESSAGING_LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<MessagingCopy>>> = {
  fr: MESSAGING_COPY_FR,
  es: MESSAGING_COPY_ES,
  pt: MESSAGING_COPY_PT,
  ar: MESSAGING_COPY_AR,
  de: MESSAGING_COPY_DE,
  it: MESSAGING_COPY_IT,
  zh: MESSAGING_COPY_ZH,
  // ig / yo / ha / hi intentionally omitted → EN fallback (never machine-translated)
};

export function getMessagingCopy(locale: AppLocale): MessagingCopy {
  const overrides = MESSAGING_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      MESSAGING_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as MessagingCopy;
  }
  return MESSAGING_COPY_EN;
}
