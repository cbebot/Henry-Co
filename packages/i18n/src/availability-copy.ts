import type { AppLocale } from "./locales";
import { deepMergeMessages } from "./merge-messages";

/**
 * surface:availability — typed copy for the V3-38 local-availability surfaces
 * (badge, graceful-unavailable state, find-similar CTA). Area NAMES are never
 * stored here — the resolved area interpolates through `{area}`. The
 * `approximateDisclosure` string is the PRIVACY-NDPR §1 disclosure for the
 * coarse IP-inferred location (advisory only; a saved address always wins).
 * EN is the base; locales fall back per-key through `deepMergeMessages`.
 */
export type AvailabilityCopy = {
  availability: {
    badgeAvailable: string;
    badgeLimited: string;
    badgeApproximate: string;
    approximateDisclosure: string;
    unavailableTitle: string;
    unavailableBody: string;
    unavailableBodyNoArea: string;
    findSimilar: string;
    areaFallback: string;
  };
};

const EN: AvailabilityCopy = {
  availability: {
    badgeAvailable: "Available in your area",
    badgeLimited: "Limited availability in your area",
    badgeApproximate: "Appears available near you",
    approximateDisclosure:
      "Based on the approximate location of your connection, not a saved address.",
    unavailableTitle: "Not available here yet",
    unavailableBody: "This service does not cover {area} yet.",
    unavailableBodyNoArea: "This service is not available in your area yet.",
    findSimilar: "See what is available near you",
    areaFallback: "your area",
  },
};

const FR: Partial<AvailabilityCopy> = {
  availability: {
    badgeAvailable: "Disponible dans votre zone",
    badgeLimited: "Disponibilité limitée dans votre zone",
    badgeApproximate: "Semble disponible près de chez vous",
    approximateDisclosure:
      "Basé sur la localisation approximative de votre connexion, pas sur une adresse enregistrée.",
    unavailableTitle: "Pas encore disponible ici",
    unavailableBody: "Ce service ne couvre pas encore {area}.",
    unavailableBodyNoArea: "Ce service n'est pas encore disponible dans votre zone.",
    findSimilar: "Voir ce qui est disponible près de chez vous",
    areaFallback: "votre zone",
  },
};

const ES: Partial<AvailabilityCopy> = { availability: { badgeAvailable: "Disponible en tu zona", badgeLimited: "Disponibilidad limitada en tu zona", badgeApproximate: "Parece disponible cerca de ti", approximateDisclosure: "Basado en la ubicación aproximada de tu conexión, no en una dirección guardada.", unavailableTitle: "Aún no disponible aquí", unavailableBody: "Este servicio aún no cubre {area}.", unavailableBodyNoArea: "Este servicio aún no está disponible en tu zona.", findSimilar: "Ver lo que está disponible cerca de ti", areaFallback: "tu zona" } };
const PT: Partial<AvailabilityCopy> = { availability: { badgeAvailable: "Disponível na sua área", badgeLimited: "Disponibilidade limitada na sua área", badgeApproximate: "Parece disponível perto de você", approximateDisclosure: "Com base na localização aproximada da sua conexão, não em um endereço salvo.", unavailableTitle: "Ainda não disponível aqui", unavailableBody: "Este serviço ainda não cobre {area}.", unavailableBodyNoArea: "Este serviço ainda não está disponível na sua área.", findSimilar: "Veja o que está disponível perto de você", areaFallback: "sua área" } };
const DE: Partial<AvailabilityCopy> = { availability: { badgeAvailable: "In deiner Gegend verfügbar", badgeLimited: "Eingeschränkte Verfügbarkeit in deiner Gegend", badgeApproximate: "Scheint in deiner Nähe verfügbar", approximateDisclosure: "Basierend auf dem ungefähren Standort deiner Verbindung, nicht auf einer gespeicherten Adresse.", unavailableTitle: "Hier noch nicht verfügbar", unavailableBody: "Dieser Service deckt {area} noch nicht ab.", unavailableBodyNoArea: "Dieser Service ist in deiner Gegend noch nicht verfügbar.", findSimilar: "Sieh, was in deiner Nähe verfügbar ist", areaFallback: "deine Gegend" } };
const IT: Partial<AvailabilityCopy> = { availability: { badgeAvailable: "Disponibile nella tua zona", badgeLimited: "Disponibilità limitata nella tua zona", badgeApproximate: "Sembra disponibile vicino a te", approximateDisclosure: "In base alla posizione approssimativa della tua connessione, non a un indirizzo salvato.", unavailableTitle: "Non ancora disponibile qui", unavailableBody: "Questo servizio non copre ancora {area}.", unavailableBodyNoArea: "Questo servizio non è ancora disponibile nella tua zona.", findSimilar: "Vedi cosa è disponibile vicino a te", areaFallback: "la tua zona" } };
const AR: Partial<AvailabilityCopy> = { availability: { badgeAvailable: "متاح في منطقتك", badgeLimited: "توفر محدود في منطقتك", badgeApproximate: "يبدو متاحًا بالقرب منك", approximateDisclosure: "استنادًا إلى الموقع التقريبي لاتصالك، وليس إلى عنوان محفوظ.", unavailableTitle: "غير متاح هنا بعد", unavailableBody: "هذه الخدمة لا تغطي {area} بعد.", unavailableBodyNoArea: "هذه الخدمة غير متاحة في منطقتك بعد.", findSimilar: "اطّلع على ما هو متاح بالقرب منك", areaFallback: "منطقتك" } };
const IG: Partial<AvailabilityCopy> = { availability: { badgeAvailable: "Dị na mpaghara gị", badgeLimited: "Nnweta dị oke na mpaghara gị", badgeApproximate: "O yiri ka ọ dị nso na gị", approximateDisclosure: "Dabere n'ọnọdụ ịntanetị gị nke na-ezughị oke, ọ bụghị adreesị echekwara.", unavailableTitle: "Adịbeghị ebe a", unavailableBody: "Ọrụ a erubeghị {area}.", unavailableBodyNoArea: "Ọrụ a adịbeghị na mpaghara gị.", findSimilar: "Lee ihe dị nso na gị", areaFallback: "mpaghara gị" } };
const YO: Partial<AvailabilityCopy> = { availability: { badgeAvailable: "Ó wà ní agbègbè rẹ", badgeLimited: "Ìwọ̀nba ni wíwà ní agbègbè rẹ", badgeApproximate: "Ó jọ pé ó wà nítòsí rẹ", approximateDisclosure: "Dá lórí ipò ìsopọ̀ rẹ tí kò pé, kì í ṣe àdírẹ́sì tí a fipamọ́.", unavailableTitle: "Kò tíì sí níbí", unavailableBody: "Iṣẹ́ yìí kò tíì dé {area}.", unavailableBodyNoArea: "Iṣẹ́ yìí kò tíì sí ní agbègbè rẹ.", findSimilar: "Wo ohun tí ó wà nítòsí rẹ", areaFallback: "agbègbè rẹ" } };
const HA: Partial<AvailabilityCopy> = { availability: { badgeAvailable: "Akwai a yankinka", badgeLimited: "Akwai kaɗan a yankinka", badgeApproximate: "Da alama akwai kusa da kai", approximateDisclosure: "Bisa kimanin wurin haɗin yanar gizonka, ba adireshin da aka ajiye ba.", unavailableTitle: "Ba a kai nan ba tukuna", unavailableBody: "Wannan sabis ɗin bai kai {area} ba tukuna.", unavailableBodyNoArea: "Wannan sabis ɗin ba ya nan a yankinka tukuna.", findSimilar: "Duba abin da ke kusa da kai", areaFallback: "yankinka" } };
const ZH: Partial<AvailabilityCopy> = { availability: { badgeAvailable: "在你所在地区可用", badgeLimited: "你所在地区可用性有限", badgeApproximate: "你附近似乎可用", approximateDisclosure: "基于你连接的大致位置，而非已保存的地址。", unavailableTitle: "此地暂未开通", unavailableBody: "此服务暂未覆盖{area}。", unavailableBodyNoArea: "此服务暂未在你所在地区开通。", findSimilar: "查看你附近可用的服务", areaFallback: "你所在地区" } };
const HI: Partial<AvailabilityCopy> = { availability: { badgeAvailable: "आपके क्षेत्र में उपलब्ध", badgeLimited: "आपके क्षेत्र में सीमित उपलब्धता", badgeApproximate: "आपके पास उपलब्ध प्रतीत होता है", approximateDisclosure: "आपके कनेक्शन के अनुमानित स्थान पर आधारित, सहेजे गए पते पर नहीं।", unavailableTitle: "यहाँ अभी उपलब्ध नहीं", unavailableBody: "यह सेवा अभी {area} में उपलब्ध नहीं है।", unavailableBodyNoArea: "यह सेवा अभी आपके क्षेत्र में उपलब्ध नहीं है।", findSimilar: "देखें आपके पास क्या उपलब्ध है", areaFallback: "आपका क्षेत्र" } };

const LOCALE_COPY: Partial<Record<AppLocale, Partial<AvailabilityCopy>>> = {
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

export function getAvailabilityCopy(locale: AppLocale): AvailabilityCopy {
  const overrides = LOCALE_COPY[locale];
  if (overrides) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as AvailabilityCopy;
  }
  return EN;
}

/** Replace `{key}` tokens in a copy string with values (mirrors the surface pattern). */
export function formatAvailabilityTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match,
  );
}
