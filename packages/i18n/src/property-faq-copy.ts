import type { AppLocale } from "./locales";
import { deepMergeMessages } from "./merge-messages";

export type PropertyFaqCopy = {
  meta: {
    title: string;
    description: string;
  };
  page: {
    kicker: string;
    title: string;
    description: string;
  };
  empty: {
    text: string;
    trustLinkLabel: string;
  };
  faqItem: {
    openLabel: string;
    closeLabel: string;
  };
  contact: {
    kicker: string;
    title: string;
    description: string;
    submitListingCta: string;
    trustStandardsCta: string;
  };
};

const EN: PropertyFaqCopy = {
  meta: {
    title: "FAQ | HenryCo Property",
    description:
      "Answers to common questions from renters, buyers, owners, and managed-property clients before a viewing or submission.",
  },
  page: {
    kicker: "FAQ",
    title: "Before you reach out.",
    description:
      "The essentials renters, buyers, owners, and managed-property clients usually check before a viewing or submission.",
  },
  empty: {
    text:
      "We’re still publishing answers to the most common renter, buyer, and owner questions. In the meantime,",
    trustLinkLabel: "read how we govern listings before publication",
  },
  faqItem: {
    openLabel: "Open",
    closeLabel: "Close",
  },
  contact: {
    kicker: "Still have a question?",
    title: "Reach out — we’ll route it to the right desk.",
    description:
      "Listing submissions, viewings, managed property requests, and inspection follow-up each have their own thread so the right person sees it first.",
    submitListingCta: "Submit a listing",
    trustStandardsCta: "Trust standards",
  },
};

const FR: Partial<PropertyFaqCopy> = {
  meta: {
    title: "FAQ | HenryCo Property",
    description:
      "Réponses aux questions courantes des locataires, acheteurs, propriétaires et clients en gestion avant une visite ou une soumission.",
  },
  page: {
    kicker: "FAQ",
    title: "Avant de nous contacter.",
    description:
      "L’essentiel que les locataires, acheteurs, propriétaires et clients en gestion vérifient avant une visite ou une soumission.",
  },
  empty: {
    text:
      "Nous publions encore les réponses aux questions les plus courantes. En attendant,",
    trustLinkLabel: "lisez comment nous gérons les annonces avant publication",
  },
  faqItem: {
    openLabel: "Ouvrir",
    closeLabel: "Fermer",
  },
  contact: {
    kicker: "Vous avez encore une question ?",
    title: "Contactez-nous — nous vous dirigerons vers le bon interlocuteur.",
    description:
      "Les soumissions d’annonces, visites, demandes de gestion et suivis d’inspection ont chacun leur propre fil, afin que la bonne personne le voit en premier.",
    submitListingCta: "Soumettre une annonce",
    trustStandardsCta: "Standards de confiance",
  },
};

const ES: Partial<PropertyFaqCopy> = {
  meta: {
    title: "Preguntas frecuentes | HenryCo Property",
    description:
      "Respuestas a preguntas comunes de inquilinos, compradores, propietarios y clientes de gestión antes de una visita o presentación.",
  },
  page: {
    kicker: "Preguntas frecuentes",
    title: "Antes de contactarnos.",
    description:
      "Lo esencial que inquilinos, compradores, propietarios y clientes de gestión suelen revisar antes de una visita o presentación.",
  },
  empty: {
    text:
      "Aún estamos publicando respuestas a las preguntas más comunes. Mientras tanto,",
    trustLinkLabel: "lea cómo gobernamos los anuncios antes de su publicación",
  },
  faqItem: {
    openLabel: "Abrir",
    closeLabel: "Cerrar",
  },
  contact: {
    kicker: "¿Tiene otra pregunta?",
    title: "Contáctenos — lo dirigiremos al equipo correcto.",
    description:
      "Las presentaciones de listados, visitas, solicitudes de gestión y seguimiento de inspección tienen su propio hilo para que la persona correcta lo vea primero.",
    submitListingCta: "Enviar un listado",
    trustStandardsCta: "Estándares de confianza",
  },
};

const PT: Partial<PropertyFaqCopy> = {
  meta: {
    title: "Perguntas frequentes | HenryCo Property",
    description:
      "Respostas a perguntas comuns de inquilinos, compradores, proprietários e clientes de gestão antes de uma visita ou envio.",
  },
  page: {
    kicker: "Perguntas frequentes",
    title: "Antes de nos contatar.",
    description:
      "O essencial que inquilinos, compradores, proprietários e clientes de gestão costumam verificar antes de uma visita ou envio.",
  },
  empty: {
    text:
      "Ainda estamos publicando respostas para as perguntas mais comuns. Enquanto isso,",
    trustLinkLabel: "leia como governamos os anúncios antes da publicação",
  },
  faqItem: {
    openLabel: "Abrir",
    closeLabel: "Fechar",
  },
  contact: {
    kicker: "Ainda tem uma pergunta?",
    title: "Entre em contato — vamos encaminhar para o setor correto.",
    description:
      "Envios de listagens, visitas, solicitações de gestão e acompanhamento de inspeção têm cada um seu próprio fio para que a pessoa certa veja primeiro.",
    submitListingCta: "Enviar uma listagem",
    trustStandardsCta: "Padrões de confiança",
  },
};

const AR: Partial<PropertyFaqCopy> = {
  meta: {
    title: "الأسئلة الشائعة | HenryCo Property",
    description:
      "إجابات على الأسئلة الشائعة من المستأجرين والمشترين والملاك وعملاء الإدارة قبل المعاينة أو التقديم.",
  },
  page: {
    kicker: "الأسئلة الشائعة",
    title: "قبل التواصل معنا.",
    description:
      "الأساسيات التي يتحقق منها المستأجرون والمشترون والملاك وعملاء الإدارة عادةً قبل المعاينة أو التقديم.",
  },
  empty: {
    text:
      "لا نزال ننشر إجابات على أكثر الأسئلة شيوعًا. في الوقت الحالي،",
    trustLinkLabel: "اقرأ كيف نحكم الإعلانات قبل النشر",
  },
  faqItem: {
    openLabel: "فتح",
    closeLabel: "إغلاق",
  },
  contact: {
    kicker: "هل لديك سؤال آخر؟",
    title: "تواصل معنا — سنحولك إلى القسم الصحيح.",
    description:
      "تقديمات الإعلانات والمعاينات وطلبات الإدارة ومتابعة التفتيش لكل منها خيطها الخاص حتى تصل للشخص المناسب أولاً.",
    submitListingCta: "تقديم إعلان",
    trustStandardsCta: "معايير الثقة",
  },
};

const DE: Partial<PropertyFaqCopy> = {
  meta: {
    title: "Häufige Fragen | HenryCo Property",
    description:
      "Antworten auf häufige Fragen von Mietern, Käufern, Eigentümern und verwalteten Kunden vor einer Besichtigung oder Einreichung.",
  },
  page: {
    kicker: "Häufige Fragen",
    title: "Bevor Sie sich melden.",
    description:
      "Das Wesentliche, das Mieter, Käufer, Eigentümer und verwaltete Kunden normalerweise vor einer Besichtigung oder Einreichung prüfen.",
  },
  empty: {
    text:
      "Wir veröffentlichen noch Antworten auf die häufigsten Fragen. In der Zwischenzeit,",
    trustLinkLabel: "lesen Sie, wie wir Inserate vor der Veröffentlichung regeln",
  },
  faqItem: {
    openLabel: "Öffnen",
    closeLabel: "Schließen",
  },
  contact: {
    kicker: "Noch eine Frage?",
    title: "Melden Sie sich — wir leiten es an die richtige Stelle weiter.",
    description:
      "Inserateinreichungen, Besichtigungen, Verwaltungsanfragen und Inspektionsnachverfolgung haben jeweils ihren eigenen Thread, damit die richtige Person ihn zuerst sieht.",
    submitListingCta: "Inserat einreichen",
    trustStandardsCta: "Vertrauensstandards",
  },
};

const IT: Partial<PropertyFaqCopy> = {
  meta: {
    title: "FAQ | HenryCo Property",
    description:
      "Risposte alle domande più comuni da affittuari, acquirenti, proprietari e clienti di gestione prima di una visita o una presentazione.",
  },
  page: {
    kicker: "FAQ",
    title: "Prima di contattarci.",
    description:
      "L’essenziale che affittuari, acquirenti, proprietari e clienti di gestione controllano di solito prima di una visita o una presentazione.",
  },
  empty: {
    text:
      "Stiamo ancora pubblicando le risposte alle domande più comuni. Nel frattempo,",
    trustLinkLabel: "leggi come gestiamo gli annunci prima della pubblicazione",
  },
  faqItem: {
    openLabel: "Apri",
    closeLabel: "Chiudi",
  },
  contact: {
    kicker: "Hai ancora una domanda?",
    title: "Contattaci — ti indirizzeremo al reparto giusto.",
    description:
      "Le presentazioni di annunci, le visite, le richieste di gestione e il follow-up delle ispezioni hanno ciascuno il proprio thread in modo che la persona giusta lo veda per prima.",
    submitListingCta: "Invia un annuncio",
    trustStandardsCta: "Standard di fiducia",
  },
};

const ZH: Partial<PropertyFaqCopy> = {
  meta: {
    title: "常见问题 | HenryCo Property",
    description:
      "租户、买家、业主和管理客户在看房或提交前常足问题的解答。",
  },
  page: {
    kicker: "常见问题",
    title: "联系我们之前。",
    description:
      "租户、买家、业主和管理客户在看房或提交前通常检查的基本信息。",
  },
  empty: {
    text: "我们仍在发布最常见问题的解答。目前，",
    trustLinkLabel: "阅读我们如何在发布前管理挂牌",
  },
  faqItem: {
    openLabel: "打开",
    closeLabel: "关闭",
  },
  contact: {
    kicker: "还有问题？",
    title: "联系我们 — 我们将将其转到正确的部门。",
    description:
      "挂牌提交、看房、管理请求和审查跟进各有其自己的线程，以便正确的人首先看到它。",
    submitListingCta: "提交挂牌",
    trustStandardsCta: "信任标准",
  },
};

const HI: Partial<PropertyFaqCopy> = {
  meta: {
    title: "सामान्य प्रश्न | HenryCo Property",
    description:
      "किरायेदारों, खरीददारों, मालिकों और प्रबंधन ग्राहकों के सामान्य प्रश्नों के उत्तर देखने से पहले।",
  },
  page: {
    kicker: "सामान्य प्रश्न",
    title: "संपर्क करने से पहले।",
    description:
      "किरायेदार, खरीददार, मालिक और प्रबंधन ग्राहक आमतौर पर देखने से पहले की जांच करते हैं।",
  },
  empty: {
    text: "हम अभी से अधिक सामान्य प्रश्नों के उत्तर प्रकाशित कर रहे हैं। इस दौरान,",
    trustLinkLabel: "पढ़ें कि हम प्रकाशन से पहले विज्ञापनों कैसे नियंत्रित करते हैं",
  },
  faqItem: {
    openLabel: "खोलें",
    closeLabel: "बंद करें",
  },
  contact: {
    kicker: "अभी भी कोई प्रश्न है?",
    title: "संपर्क करें — हम इसे सही विभाग तक पहुंचाएंगे।",
    description:
      "लिस्टिंग सबमिशन, दर्शन, प्रबंधन अनुरोध और निरीक्षण फॉलो-अप में से प्रत्येक का अपना थ्रेड है ताकि सही व्यक्ति पहले देखे।",
    submitListingCta: "लिस्टिंग सबमिट करें",
    trustStandardsCta: "विश्वास मानक",
  },
};

const IG: Partial<PropertyFaqCopy> = {
  meta: {
    title: "Ajuju Na-adịkarị | HenryCo Property",
    description:
      "Aza n'ajuju ndị a na-ajụkarị site na ndị na-atọrọ ụlọ, ndị na-azụ, ndị nwe ụlọ, na ndị ahịa nlekọta tupu ịhụ ụlọ ma ọ bụ ibugo.",
  },
  page: {
    kicker: "Ajuju Na-adịkarị",
    title: "Tupu ị kpọtụrụ anyị.",
    description:
      "Ihe ndị na-atọrọ ụlọ, ndị na-azụ, ndị nwe ụlọ na ndị ahịa nlekọta na-ahụkarị tupu ịhụ ụlọ ma ọ bụ ibugo.",
  },
  empty: {
    text: "Anyị ka na-ebipụta aza n'ajuju ndị a na-ajụkarị. Ka oge ahụ,",
    trustLinkLabel: "gụọ ka anyị si achịkwa ngosi tupu ebipụtaaha",
  },
  faqItem: {
    openLabel: "Meghee",
    closeLabel: "Mechie",
  },
  contact: {
    kicker: "Ka i nwere ajuju ọzọ?",
    title: "Kpọtụrụ anyị — anyị ga-azitere ya na ọṓẓṣọụ kwesiri.",
    description:
      "Ngosi nke nbugo, nlele, arịọ nlekọta, na nchịkọta nyocha nwere isi-okwu ha nke ha ka onye kwesiri ma ha na-ahụ ya mbụ.",
    submitListingCta: "Bufee ngosi",
    trustStandardsCta: "Ọkọlọtọ ntụkwasị obi",
  },
};

const YO: Partial<PropertyFaqCopy> = {
  meta: {
    title: "Awọn Ibeere Ti A Saba Bi | HenryCo Property",
    description:
      "Awọn idahun si awọn ibeere ti o wọpọ lati ọdọ awọn agbatẹru, awọn onibara, awọn onile, ati awọn alabara iṣakoso ṣaaju wiwo tabi ifisilẹ.",
  },
  page: {
    kicker: "Awọn Ibeere Ti A Saba Bi",
    title: "Ṣaaju ki o to kan si wa.",
    description:
      "Awọn ohun ipilẹ ti awọn agbatẹru, awọn onibara, awọn onile, ati awọn alabara iṣakoso maa n ṣayẹwo ṣaaju wiwo tabi ifisilẹ.",
  },
  empty: {
    text: "A n tun ṣe atẹjade awọn idahun si awọn ibeere ti o wọpọ. Nibayi,",
    trustLinkLabel: "ka bii a ṣe n ṣakoso awọn atẹjade ṣaaju itusilẹ",
  },
  faqItem: {
    openLabel: "Ṣii",
    closeLabel: "Pa",
  },
  contact: {
    kicker: "Ṣe o tun ni ibeere?",
    title: "Kan si wa — a o fi i ranṣẹ si ibi ti o tọ.",
    description:
      "Awọn ifisilẹ atẹjade, awọn wiwo, awọn ibeere iṣakoso, ati atẹle-iṣayẹwo kọọkan ni ẹrọ wọn ki eniyan to tọ ki o ri i ni akọkọ.",
    submitListingCta: "Fi atẹjade silẹ",
    trustStandardsCta: "Awọn ipilẹṣẹ igbẹkẹle",
  },
};

const HA: Partial<PropertyFaqCopy> = {
  meta: {
    title: "Tambayoyi na Kowa | HenryCo Property",
    description:
      "Amsoshi ga tambayoyin da mă hăwan gida, masu saye, mă mallakin gida, da abokan hulda na gudanarwa ke yi kafin duban gida ko gabatarwa.",
  },
  page: {
    kicker: "Tambayoyi na Kowa",
    title: "Kafin ku tuntube mu.",
    description:
      "Muhimman abubuwa da mă hăwan gida, masu saye, mă mallakin gida, da abokan hulda na gudanarwa ke duba kafin duban gida ko gabatarwa.",
  },
  empty: {
    text: "Muna har yanzu wallafa amsoshi ga tambayoyi da aka fi yawan yi. A halin yanzu,",
    trustLinkLabel: "karanta yadda muke sarrafa jera kadarori kafin bugawa",
  },
  faqItem: {
    openLabel: "Bude",
    closeLabel: "Rufe",
  },
  contact: {
    kicker: "Kuna da wata tambaya?",
    title: "Tuntubar mu — za mu aika zuwa ga kwamitin da ya dace.",
    description:
      "Gabatarwa na jera kadarori, kallonni, buƙatun gudanarwa, da bi-biye na duba-duba kowannensu yana da zaren nasa domin mutumin da ya dace ya ga shi da farko.",
    submitListingCta: "Gabatar da jerin gida",
    trustStandardsCta: "Ma'aunin amana",
  },
};

const LOCALE_OVERRIDES: Partial<Record<AppLocale, Partial<PropertyFaqCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
  hi: HI,
  ig: IG,
  yo: YO,
  ha: HA,
};

export function getPropertyFaqCopy(locale: AppLocale): PropertyFaqCopy {
  const overrides = LOCALE_OVERRIDES[locale];
  if (overrides) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as PropertyFaqCopy;
  }
  return EN;
}
