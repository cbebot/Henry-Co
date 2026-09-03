// surface:account_status — V3-40 neutral enforcement states (typed Pattern-A copy).
//
// Shown to a customer ONLY when a STAFF-APPLIED hold/freeze under a LIVE risk
// model gates a sensitive action (never from a score alone — no auto-punishment).
// Doctrine: calm, neutral, actionable. NEVER the word "fraud", NEVER a score,
// NEVER an accusation — a false positive on a paying customer must read as a
// routine check, because for them it is.

import type { AppLocale } from "./locales";
import { deepMergeMessages } from "./merge-messages";

export type RiskStatusCopy = {
  /** Staff HOLD — the action waits for a human check; the account is fine. */
  hold: { title: string; body: string };
  /** Staff FREEZE — sensitive actions paused; support is the path forward. */
  freeze: { title: string; body: string };
};

const EN: RiskStatusCopy = {
  hold: {
    title: "A quick review is needed",
    body: "This action needs a short review by our team before it continues. Your account and balance are unaffected — a specialist will confirm shortly.",
  },
  freeze: {
    title: "Account temporarily on hold",
    body: "Sensitive actions on your account are paused while our team completes a review. Please contact support and we will walk you through the next steps.",
  },
};

const FR: Partial<RiskStatusCopy> = {
  hold: {
    title: "Une vérification rapide est nécessaire",
    body: "Cette action nécessite une courte vérification par notre équipe avant de continuer. Votre compte et votre solde ne sont pas affectés — un spécialiste confirmera sous peu.",
  },
  freeze: {
    title: "Compte temporairement en pause",
    body: "Les actions sensibles de votre compte sont suspendues pendant que notre équipe termine une vérification. Veuillez contacter le support et nous vous guiderons pour la suite.",
  },
};

const ES: Partial<RiskStatusCopy> = {
  hold: {
    title: "Se necesita una revisión rápida",
    body: "Esta acción necesita una breve revisión de nuestro equipo antes de continuar. Tu cuenta y tu saldo no se ven afectados — un especialista confirmará en breve.",
  },
  freeze: {
    title: "Cuenta temporalmente en pausa",
    body: "Las acciones sensibles de tu cuenta están en pausa mientras nuestro equipo completa una revisión. Contacta con soporte y te guiaremos en los siguientes pasos.",
  },
};

const PT: Partial<RiskStatusCopy> = {
  hold: {
    title: "É necessária uma verificação rápida",
    body: "Esta ação precisa de uma breve verificação da nossa equipa antes de continuar. A sua conta e o seu saldo não são afetados — um especialista confirmará em breve.",
  },
  freeze: {
    title: "Conta temporariamente em pausa",
    body: "As ações sensíveis da sua conta estão em pausa enquanto a nossa equipa conclui uma verificação. Contacte o suporte e orientá-lo-emos nos próximos passos.",
  },
};

const DE: Partial<RiskStatusCopy> = {
  hold: {
    title: "Eine kurze Prüfung ist erforderlich",
    body: "Diese Aktion benötigt eine kurze Prüfung durch unser Team, bevor sie fortgesetzt wird. Ihr Konto und Ihr Guthaben sind nicht betroffen — eine Fachkraft bestätigt in Kürze.",
  },
  freeze: {
    title: "Konto vorübergehend angehalten",
    body: "Sensible Aktionen Ihres Kontos sind pausiert, während unser Team eine Prüfung abschließt. Bitte kontaktieren Sie den Support — wir begleiten Sie durch die nächsten Schritte.",
  },
};

const IT: Partial<RiskStatusCopy> = {
  hold: {
    title: "È necessaria una rapida verifica",
    body: "Questa azione richiede una breve verifica del nostro team prima di continuare. Il tuo account e il tuo saldo non sono interessati — uno specialista confermerà a breve.",
  },
  freeze: {
    title: "Account temporaneamente in pausa",
    body: "Le azioni sensibili del tuo account sono in pausa mentre il nostro team completa una verifica. Contatta l'assistenza e ti guideremo nei prossimi passi.",
  },
};

const AR: Partial<RiskStatusCopy> = {
  hold: {
    title: "مطلوب مراجعة سريعة",
    body: "يحتاج هذا الإجراء إلى مراجعة قصيرة من فريقنا قبل المتابعة. حسابك ورصيدك غير متأثرين — سيؤكد مختص قريبًا.",
  },
  freeze: {
    title: "الحساب متوقف مؤقتًا",
    body: "الإجراءات الحساسة في حسابك متوقفة مؤقتًا بينما يُكمل فريقنا المراجعة. يُرجى التواصل مع الدعم وسنرشدك إلى الخطوات التالية.",
  },
};

const IG: Partial<RiskStatusCopy> = {
  hold: {
    title: "A chọrọ nyocha ngwa ngwa",
    body: "Omume a chọrọ nyocha dị mkpirikpi site n'aka ndị otu anyị tupu ọ gaa n'ihu. Akaụntụ gị na ego gị adịghị emetụta — onye ọkachamara ga-akwado n'oge na-adịghị anya.",
  },
  freeze: {
    title: "Akaụntụ kwụsịrị nwa oge",
    body: "Omume ndị dị nro na akaụntụ gị kwụsịrị ka ndị otu anyị na-emecha nyocha. Biko kpọtụrụ ndị enyemaka, anyị ga-eduzi gị n'ihe ndị ọzọ.",
  },
};

const YO: Partial<RiskStatusCopy> = {
  hold: {
    title: "A nílò àyẹ̀wò kíákíá",
    body: "Ìgbésẹ̀ yìí nílò àyẹ̀wò kúkúrú láti ọwọ́ ẹgbẹ́ wa kó tó tẹ̀síwájú. Àkáǹtì rẹ àti owó rẹ kò ní ìpalára — akọ́ṣẹ́mọṣẹ́ kan yóò jẹ́rìí sí i láìpẹ́.",
  },
  freeze: {
    title: "Àkáǹtì dúró fún ìgbà díẹ̀",
    body: "Àwọn ìgbésẹ̀ pàtàkì lórí àkáǹtì rẹ ti dúró nígbà tí ẹgbẹ́ wa ń parí àyẹ̀wò. Jọ̀wọ́ kan sí ìrànlọ́wọ́, a ó sì tọ́ ọ sọ́nà fún àwọn ìgbésẹ̀ tó kàn.",
  },
};

const HA: Partial<RiskStatusCopy> = {
  hold: {
    title: "Ana buƙatar bita cikin sauri",
    body: "Wannan matakin yana buƙatar ɗan bita daga ƙungiyarmu kafin ya ci gaba. Asusunka da kuɗinka ba su shafu ba — ƙwararre zai tabbatar nan ba da daɗewa ba.",
  },
  freeze: {
    title: "An dakatar da asusu na ɗan lokaci",
    body: "An dakatar da muhimman ayyuka a asusunka yayin da ƙungiyarmu ke kammala bita. Da fatan za a tuntuɓi tallafi, za mu bi da kai kan matakai na gaba.",
  },
};

const ZH: Partial<RiskStatusCopy> = {
  hold: {
    title: "需要快速核查",
    body: "此操作需要我们的团队进行简短核查后才能继续。您的账户和余额不受影响——专员将很快确认。",
  },
  freeze: {
    title: "账户暂时冻结",
    body: "在我们的团队完成核查期间，您账户的敏感操作已暂停。请联系客服，我们将引导您完成后续步骤。",
  },
};

const HI: Partial<RiskStatusCopy> = {
  hold: {
    title: "एक त्वरित समीक्षा आवश्यक है",
    body: "आगे बढ़ने से पहले इस कार्रवाई की हमारी टीम द्वारा एक छोटी समीक्षा आवश्यक है। आपके खाते और शेष राशि पर कोई प्रभाव नहीं है — एक विशेषज्ञ शीघ्र पुष्टि करेंगे।",
  },
  freeze: {
    title: "खाता अस्थायी रूप से रोका गया",
    body: "जब तक हमारी टीम समीक्षा पूरी करती है, आपके खाते की संवेदनशील कार्रवाइयाँ रोक दी गई हैं। कृपया सहायता से संपर्क करें, हम अगले चरणों में आपका मार्गदर्शन करेंगे।",
  },
};

const LOCALE_COPY: Partial<Record<AppLocale, Partial<RiskStatusCopy>>> = {
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

export function getRiskStatusCopy(locale: AppLocale): RiskStatusCopy {
  const overrides = LOCALE_COPY[locale];
  if (overrides) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as RiskStatusCopy;
  }
  return EN;
}
