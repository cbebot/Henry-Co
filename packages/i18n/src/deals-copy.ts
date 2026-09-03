import type { AppLocale } from "./locales";
import { deepMergeMessages } from "./merge-messages";

/**
 * surface:deals — typed copy for the V3-35 deals & campaigns surfaces (the
 * account-home offers rail today; approval-state labels for the staff queue
 * and authoring surfaces that build on the same model).
 *
 * Deal TITLES/DESCRIPTIONS are author-supplied free text — they render through
 * `translateSurfaceLabel` at the surface, never from this module. This module
 * owns only the chrome (labels, term templates, reason-code labels, lifecycle
 * states). EN is the base; locales without an override fall back to EN through
 * `deepMergeMessages` (the ecosystem i18n maturity model).
 */
export type DealsCopy = {
  rail: {
    kicker: string;
    title: string;
    listLabel: string;
    view: string;
    endsOn: string;
  };
  terms: {
    percentOff: string;
    amountOff: string;
    bogo: string;
    bundle: string;
    spotlight: string;
  };
  reasons: {
    divisionLocal: string;
    recentDivisionActivity: string;
    categoryMatch: string;
    endingSoon: string;
    newThisWeek: string;
    crossDivisionOffer: string;
  };
  status: {
    draft: string;
    pending_review: string;
    approved: string;
    active: string;
    paused: string;
    expired: string;
    rejected: string;
  };
};

const EN: DealsCopy = {
  rail: {
    kicker: "Offers",
    title: "Current deals",
    listLabel: "Current deals",
    view: "View deal",
    endsOn: "Ends {date}",
  },
  terms: {
    percentOff: "{percent}% off",
    amountOff: "{amount} off",
    bogo: "Buy one, get one",
    bundle: "Bundle offer",
    spotlight: "Featured",
  },
  reasons: {
    divisionLocal: "Available now",
    recentDivisionActivity: "Based on your recent activity",
    categoryMatch: "Matches your interests",
    endingSoon: "Ending soon",
    newThisWeek: "New this week",
    crossDivisionOffer: "Across divisions",
  },
  status: {
    draft: "Draft",
    pending_review: "Pending review",
    approved: "Approved",
    active: "Active",
    paused: "Paused",
    expired: "Expired",
    rejected: "Rejected",
  },
};

const FR: Partial<DealsCopy> = {
  rail: { kicker: "Offres", title: "Offres en cours", listLabel: "Offres en cours", view: "Voir l'offre", endsOn: "Se termine le {date}" },
  terms: { percentOff: "{percent}% de réduction", amountOff: "{amount} de réduction", bogo: "Un acheté, un offert", bundle: "Offre groupée", spotlight: "Sélection" },
  reasons: { divisionLocal: "Disponible maintenant", recentDivisionActivity: "Selon votre activité récente", categoryMatch: "Correspond à vos centres d'intérêt", endingSoon: "Se termine bientôt", newThisWeek: "Nouveau cette semaine", crossDivisionOffer: "Dans plusieurs divisions" },
  status: { draft: "Brouillon", pending_review: "En attente de vérification", approved: "Approuvée", active: "Active", paused: "En pause", expired: "Expirée", rejected: "Refusée" },
};

const ES: Partial<DealsCopy> = {
  rail: { kicker: "Ofertas", title: "Ofertas actuales", listLabel: "Ofertas actuales", view: "Ver oferta", endsOn: "Termina el {date}" },
  terms: { percentOff: "{percent}% de descuento", amountOff: "{amount} de descuento", bogo: "Compra uno y llévate otro", bundle: "Oferta combinada", spotlight: "Destacada" },
  reasons: { divisionLocal: "Disponible ahora", recentDivisionActivity: "Según tu actividad reciente", categoryMatch: "Coincide con tus intereses", endingSoon: "Termina pronto", newThisWeek: "Nueva esta semana", crossDivisionOffer: "En varias divisiones" },
  status: { draft: "Borrador", pending_review: "Pendiente de revisión", approved: "Aprobada", active: "Activa", paused: "Pausada", expired: "Vencida", rejected: "Rechazada" },
};

const PT: Partial<DealsCopy> = {
  rail: { kicker: "Ofertas", title: "Ofertas atuais", listLabel: "Ofertas atuais", view: "Ver oferta", endsOn: "Termina em {date}" },
  terms: { percentOff: "{percent}% de desconto", amountOff: "{amount} de desconto", bogo: "Compre um, leve outro", bundle: "Oferta combinada", spotlight: "Destaque" },
  reasons: { divisionLocal: "Disponível agora", recentDivisionActivity: "Com base na sua atividade recente", categoryMatch: "Combina com seus interesses", endingSoon: "Termina em breve", newThisWeek: "Nova esta semana", crossDivisionOffer: "Em várias divisões" },
  status: { draft: "Rascunho", pending_review: "Aguardando revisão", approved: "Aprovada", active: "Ativa", paused: "Pausada", expired: "Expirada", rejected: "Rejeitada" },
};

const DE: Partial<DealsCopy> = {
  rail: { kicker: "Angebote", title: "Aktuelle Angebote", listLabel: "Aktuelle Angebote", view: "Angebot ansehen", endsOn: "Endet am {date}" },
  terms: { percentOff: "{percent} % Rabatt", amountOff: "{amount} Rabatt", bogo: "Eins kaufen, eins geschenkt", bundle: "Paketangebot", spotlight: "Ausgewählt" },
  reasons: { divisionLocal: "Jetzt verfügbar", recentDivisionActivity: "Basierend auf deiner letzten Aktivität", categoryMatch: "Passt zu deinen Interessen", endingSoon: "Endet bald", newThisWeek: "Neu diese Woche", crossDivisionOffer: "Bereichsübergreifend" },
  status: { draft: "Entwurf", pending_review: "Prüfung ausstehend", approved: "Genehmigt", active: "Aktiv", paused: "Pausiert", expired: "Abgelaufen", rejected: "Abgelehnt" },
};

const IT: Partial<DealsCopy> = {
  rail: { kicker: "Offerte", title: "Offerte in corso", listLabel: "Offerte in corso", view: "Vedi offerta", endsOn: "Termina il {date}" },
  terms: { percentOff: "{percent}% di sconto", amountOff: "{amount} di sconto", bogo: "Uno compri, uno in omaggio", bundle: "Offerta pacchetto", spotlight: "In evidenza" },
  reasons: { divisionLocal: "Disponibile ora", recentDivisionActivity: "In base alla tua attività recente", categoryMatch: "In linea con i tuoi interessi", endingSoon: "Termina a breve", newThisWeek: "Novità di questa settimana", crossDivisionOffer: "In più divisioni" },
  status: { draft: "Bozza", pending_review: "In attesa di revisione", approved: "Approvata", active: "Attiva", paused: "In pausa", expired: "Scaduta", rejected: "Rifiutata" },
};

const AR: Partial<DealsCopy> = {
  rail: { kicker: "العروض", title: "العروض الحالية", listLabel: "العروض الحالية", view: "عرض التفاصيل", endsOn: "ينتهي في {date}" },
  terms: { percentOff: "خصم {percent}%", amountOff: "خصم {amount}", bogo: "اشترِ واحدًا واحصل على آخر", bundle: "عرض مجمّع", spotlight: "مختار" },
  reasons: { divisionLocal: "متاح الآن", recentDivisionActivity: "استنادًا إلى نشاطك الأخير", categoryMatch: "يتوافق مع اهتماماتك", endingSoon: "ينتهي قريبًا", newThisWeek: "جديد هذا الأسبوع", crossDivisionOffer: "عبر عدة أقسام" },
  status: { draft: "مسودة", pending_review: "بانتظار المراجعة", approved: "معتمد", active: "نشط", paused: "متوقف مؤقتًا", expired: "منتهي", rejected: "مرفوض" },
};

const IG: Partial<DealsCopy> = {
  rail: { kicker: "Onyinye ahịa", title: "Onyinye ahịa dị ugbu a", listLabel: "Onyinye ahịa dị ugbu a", view: "Lee onyinye ahịa", endsOn: "Ga-akwụsị {date}" },
  terms: { percentOff: "Mbelata {percent}%", amountOff: "Mbelata {amount}", bogo: "Zụta otu, nweta ọzọ", bundle: "Onyinye jikọtara ọnụ", spotlight: "Nke a họpụtara" },
  reasons: { divisionLocal: "Dị ugbu a", recentDivisionActivity: "Dabere n'ọrụ gị na nso nso a", categoryMatch: "Dabara na mmasị gị", endingSoon: "Na-akwụsị n'oge na-adịghị anya", newThisWeek: "Ọhụrụ n'izu a", crossDivisionOffer: "N'ofe ngalaba dị iche iche" },
  status: { draft: "Edemede mbụ", pending_review: "Na-eche nyocha", approved: "Akwadoro", active: "Na-arụ ọrụ", paused: "Kwụsịtụrụ", expired: "Agwụla oge ya", rejected: "Ajụrụ" },
};

const YO: Partial<DealsCopy> = {
  rail: { kicker: "Àwọn ìfunni", title: "Àwọn ìfunni lọ́wọ́lọ́wọ́", listLabel: "Àwọn ìfunni lọ́wọ́lọ́wọ́", view: "Wo ìfunni", endsOn: "Yóò parí ní {date}" },
  terms: { percentOff: "Ẹ̀dínwó {percent}%", amountOff: "Ẹ̀dínwó {amount}", bogo: "Ra ọ̀kan, gba ọ̀kan", bundle: "Ìfunni àkópọ̀", spotlight: "Àyànfẹ́" },
  reasons: { divisionLocal: "Wà ní báyìí", recentDivisionActivity: "Dá lórí ìgbòkègbodò rẹ láìpẹ́", categoryMatch: "Bá ohun tí o nífẹ̀ẹ́ sí mu", endingSoon: "Ó fẹ́ parí", newThisWeek: "Tuntun ní ọ̀sẹ̀ yìí", crossDivisionOffer: "Kọjá àwọn ẹ̀ka" },
  status: { draft: "Àkọsílẹ̀ àkọ́kọ́", pending_review: "Ń dúró fún àyẹ̀wò", approved: "Ti fọwọ́ sí", active: "Ń ṣiṣẹ́", paused: "Ti dáwọ́ dúró", expired: "Ti parí", rejected: "Ti kọ̀" },
};

const HA: Partial<DealsCopy> = {
  rail: { kicker: "Tayoyi", title: "Tayoyin da ake da su yanzu", listLabel: "Tayoyin da ake da su yanzu", view: "Duba tayin", endsOn: "Zai ƙare a {date}" },
  terms: { percentOff: "Rangwamen {percent}%", amountOff: "Rangwamen {amount}", bogo: "Sayi ɗaya, sami ɗaya", bundle: "Tayin haɗaɗɗe", spotlight: "Zaɓaɓɓe" },
  reasons: { divisionLocal: "Akwai yanzu", recentDivisionActivity: "Bisa ayyukanka na kwanan nan", categoryMatch: "Ya dace da abubuwan da kake so", endingSoon: "Zai ƙare nan ba da daɗewa ba", newThisWeek: "Sabo a wannan makon", crossDivisionOffer: "A sassa daban-daban" },
  status: { draft: "Daftari", pending_review: "Ana jiran bita", approved: "An amince", active: "Yana aiki", paused: "An dakata", expired: "Ya ƙare", rejected: "An ƙi" },
};

const ZH: Partial<DealsCopy> = {
  rail: { kicker: "优惠", title: "当前优惠", listLabel: "当前优惠", view: "查看优惠", endsOn: "{date}结束" },
  terms: { percentOff: "{percent}% 优惠", amountOff: "优惠 {amount}", bogo: "买一送一", bundle: "组合优惠", spotlight: "精选" },
  reasons: { divisionLocal: "现已可用", recentDivisionActivity: "根据你最近的活动", categoryMatch: "符合你的兴趣", endingSoon: "即将结束", newThisWeek: "本周新上", crossDivisionOffer: "跨多个板块" },
  status: { draft: "草稿", pending_review: "待审核", approved: "已批准", active: "进行中", paused: "已暂停", expired: "已过期", rejected: "已拒绝" },
};

const HI: Partial<DealsCopy> = {
  rail: { kicker: "ऑफ़र", title: "मौजूदा ऑफ़र", listLabel: "मौजूदा ऑफ़र", view: "ऑफ़र देखें", endsOn: "{date} को समाप्त" },
  terms: { percentOff: "{percent}% की छूट", amountOff: "{amount} की छूट", bogo: "एक खरीदें, एक पाएँ", bundle: "बंडल ऑफ़र", spotlight: "चुनिंदा" },
  reasons: { divisionLocal: "अभी उपलब्ध", recentDivisionActivity: "आपकी हाल की गतिविधि के आधार पर", categoryMatch: "आपकी रुचियों से मेल खाता है", endingSoon: "जल्द समाप्त हो रहा है", newThisWeek: "इस सप्ताह नया", crossDivisionOffer: "कई विभागों में" },
  status: { draft: "ड्राफ़्ट", pending_review: "समीक्षा लंबित", approved: "स्वीकृत", active: "सक्रिय", paused: "रोका गया", expired: "समाप्त", rejected: "अस्वीकृत" },
};

const LOCALE_COPY: Partial<Record<AppLocale, Partial<DealsCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  de: DE,
  it: IT,
  ar: AR,
  ig: IG,
  yo: YO,
  ha: HA,
  zh: ZH,
  hi: HI,
};

export function getDealsCopy(locale: AppLocale): DealsCopy {
  const overrides = LOCALE_COPY[locale];
  if (overrides) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as DealsCopy;
  }
  return EN;
}

/** Replace `{key}` tokens in a copy string with values (mirrors the surface pattern). */
export function formatDealsTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match,
  );
}
