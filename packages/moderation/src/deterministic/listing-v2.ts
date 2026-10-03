// ---------------------------------------------------------------------------
// deterministic/listing-v2.ts — the opt-in ruleset for content that publishes
// WITHOUT a human reading it first.
//
// The default ruleset was tuned for a world where every hit lands in front of a
// reviewer, so it errs towards flagging: "gas cooker" trips the hate construct,
// "ivory white dress" trips wildlife, "massage gun" trips weapons, and any six
// digit number reads as a phone. Under instant publish those are listings
// refused or queued for nothing. This ruleset keeps the same detectors and the
// same decision vocabulary and changes two things:
//
//   precision — every unambiguous-reject pattern is one with no benign reading;
//               terms that have one ("replica", "pistol", "silencer") hold for a
//               human instead of rejecting;
//   recall    — contact details go through @henryco/trust's obfuscation-proof
//               detector ("o8o3 l23 4567", "zero eight zero…").
//
// It is selected with `deterministic: { ruleset: "listing_v2" }`. Callers that
// do not ask for it get the default ruleset, unchanged.
//
// `detail` carries machine tokens (never raw text) so a caller can map a verdict
// to its own reason codes:
//   banned:<category> · counterfeit:explicit · ambiguous:<term> · hate:slur ·
//   hate:construct · profanity · contact:<kind>:<confidence> · scam:<kind> ·
//   signal:urgency · signal:address · image:known_bad
//
// One rule decides refuse-or-hold for contact and payment: the text is REFUSED
// only when it carries a concrete datum — a phone number, an email, a link, a
// handle tied to an app, or an account number beside a bank or wallet word
// (scam:payment_diversion). A phrase with no datum ("pay me directly", "transfer
// only", "link in bio") is HELD for a person (scam:payment_steering,
// contact:*:medium), and is narrowed so ordinary product sentences do not fire.
// ---------------------------------------------------------------------------

import {
  collapseTenDigitRuns,
  detectContactDetails,
  foldForScreening,
  hasSplitTenDigitNumber,
} from "@henryco/trust/contact";
import type { DetectorVerdict, ModerationDecision, ModerationInput, ModerationReason, ModerationSeverity } from "../types";
import { detectProfanity } from "./profanity";
import { checkImageHashes } from "./image-hash";

/** Bump when a rule changes: standing verdicts minted under an older value are re-scanned. */
export const LISTING_RULESET_VERSION = "listing_v2.2";

interface Rule {
  re: RegExp;
  token: string;
  /** Everyday phrases that contain the banned words and mean something else; removed before the rule is tested. */
  benign?: RegExp;
}

// ---- Prohibited: no benign reading ------------------------------------------

// Names with no everyday meaning in a sale context. Street names that are also
// ordinary words ("loud" speakers, "Igbo" attire, "hash" browns, an "LSD"
// differential, a doll called "Molly") only count next to dealer slang, and
// otherwise hold for a human.
const DRUG_NAMES = "weed|marijuana|cannabis|kush|meth|cocaine|tramadol|codeine";
const DRUG_SLANG = "loud|igbo|skunk|hash(?:ish)?|ecstasy|molly|lsd";
const SALE_CONTEXT = String.raw`(?:for\s+sale|delivery|wholesale|dealer|supplier)`;
const NOT_GARDENING = String.raw`(?!\s*(?:killer|trimmer|eater|barrier|control|whacker|puller|mat|seed\s+oil))`;

const BENIGN_WEAPON =
  /\bshotgun\s+(?:mic(?:rophone)?s?|mikes?)\b|\b(?:bubble|water|toy|nerf|foam|confetti|massage)\s+machine\s+guns?\b|\bmachine\s+guns?\s+toys?\b/gi;

const PROHIBITED: Rule[] = [
  // Controlled drugs
  {
    re: /\b(?:cocaine|crack\s+cocaine|heroin|fentanyl|methamphetamine|crystal\s+meth|mdma|rohypnol|codeine\s+syrup|tramadol)\b/i,
    token: "banned:drugs",
  },
  { re: new RegExp(String.raw`\b(?:${DRUG_NAMES})\s+(?:${SALE_CONTEXT}|plug)\b`, "i"), token: "banned:drugs" },
  {
    re: new RegExp(String.raw`\b(?:buy|order|sell|selling|supply)\s+(?:${DRUG_NAMES})\b${NOT_GARDENING}`, "i"),
    token: "banned:drugs",
  },
  { re: /\b(?:loud|igbo|skunk|kush|weed)\s+plug\b/i, token: "banned:drugs" },
  // Firearms, ammunition, explosives, prohibited weapons
  {
    re: /\b(?:ak[-\s]?47|ar[-\s]?15|firearms?|handguns?|shotguns?|revolvers?|uzi|machine\s+guns?|live\s+rounds?|ammunition|explosive\s+device|pipe\s+bomb|c4\s+explosive)\b/i,
    token: "banned:weapons",
    // A shotgun microphone is a microphone; a bubble machine gun is a toy.
    benign: BENIGN_WEAPON,
  },
  {
    re: /\b(?:brass\s+knuckles|knuckle\s+duster|switchblade|butterfly\s+knife|flick\s+knife|stun\s+gun|taser)\b/i,
    token: "banned:weapons",
  },
  // Wildlife
  {
    // "leopard skin print" is a pattern on cloth, not a skin.
    re: /\b(?:elephant\s+tusks?|rhino\s+horn|pangolin\s+scales?|(?:leopard|tiger)\s+skin(?!\s+(?:print|pattern|design|fabric|texture|style))|tiger\s+bone|endangered\s+species)\b/i,
    token: "banned:wildlife",
  },
  {
    // Ivory is also a colour: "ivory bangles" is held for a person (see ambiguousTokens), not refused.
    re: /\b(?:(?:real|genuine|raw|elephant)\s+ivory|ivory\s+(?:tusks?|carvings?|figurines?|chess))\b/i,
    token: "banned:wildlife",
  },
  // Human body
  {
    // A church organ for sale is a musical instrument.
    re: /\b(?:human\s+(?:organ|kidney|liver)|kidney\s+for\s+sale|organ\s+(?:donor|trade)|sell\s+(?:my\s+)?(?:kidney|organ))\b/i,
    token: "banned:human_body",
  },
  // Regulated medicine sold around its controls
  {
    re: /\b(?:anabolic\s+steroids?|hgh\s+for\s+sale|prescription\s+(?:drugs?|meds?)\s+(?:no\s+rx|without\s+prescription)|viagra\s+no\s+prescription|abortion\s+pills?|misoprostol|cytotec)\b/i,
    token: "banned:regulated_medicine",
  },
  // Illicit digital / identity
  {
    re: /\b(?:fake\s+(?:id|passport|driver'?s?\s+licen[cs]e|certificates?)|stolen\s+(?:cards?|accounts?)|credit\s+card\s+(?:dumps?|numbers?)|fullz|hacked\s+accounts?|cvv\s+(?:shop|for\s+sale)|bank\s+logs?\s+for\s+sale)\b/i,
    token: "banned:illicit_digital",
  },
];

/** An explicit claim that the item is a copy. */
const COUNTERFEIT: Rule[] = [
  {
    re: /\b(?:counterfeit|knock[-\s]?offs?|super\s+fake|aaa\s+replica|1:1\s+(?:copy|replica|quality)|mirror\s+(?:quality|copy)|first\s+copy|high\s+copy|master\s+copy|fake\s+(?:designer|rolex|gucci|louis\s+vuitton|nike|adidas|currency|notes?|money))\b/i,
    token: "counterfeit:explicit",
    // A counterfeit-note detector finds fakes; "first copy out time" is a printer's speed.
    benign:
      /\banti[-\s]?counterfeit\w*\b|\b(?:counterfeit|fake)\s+(?:notes?|money|currency|cash|bills?|banknotes?)\s+(?:detect\w+|check\w+|test\w+|pens?|machines?|markers?)\b|\bfirst\s+copy\s+out\b/gi,
  },
];

// ---- Ambiguous: a human decides ---------------------------------------------

const BENIGN_GUN =
  /\b(?:(?:bubble|water|toy|nerf|foam|confetti|massage)\s+machine|glue|hot\s+glue|nail|water|spray|heat|staple|grease|caulk(?:ing)?|toy|squirt|paintball|nerf|bb|massage|tattoo|price|label(?:l?ing)?|tagging|soldering|silicone|foam|sealant|air(?:\s+blow)?|blow|piercing|thermometer|temperature|infrared|fogging|sanitizer|sanitiser|gel|bubble|confetti|tape|rivet|riveting|pressure|wash(?:ing)?|paint|cake|icing|fascial?)\s+guns?\b|\bgun[-\s]?metal\b|\btop\s+gun\b/gi;
const BENIGN_PISTOL = /\b(?:water|toy|glue)\s+pistols?\b|\bpistol[-\s]grip\b/gi;
const BENIGN_RIFLE = /\b(?:toy|nerf|water)\s+rifles?\b/gi;
const BENIGN_SILENCER =
  /\b(?:exhaust|muffler|generator|gen|engine|car|motorcycle|bike|keyboard|door|air\s+compressor|compressor|pipe)\s+silencers?\b|\bsilencers?\s+(?:pipe|box|muffler|for\s+(?:generator|exhaust|car|motorcycle|bike))\b/gi;
const BENIGN_SUPPRESSOR = /\b(?:surge|noise|spike|voltage|transient|spark|dust)\s+suppress(?:or|er)s?\b/gi;
const BENIGN_WEED = /\b(?:weed\s+(?:killer|trimmer|eater|barrier|control|whacker|puller|mat))\b/gi;
const BENIGN_CANNABIS = /\b(?:hemp|cannabis)\s+(?:seed\s+oil|oil\s+shampoo|fibre|fiber|rope|fabric|cloth)\b/gi;
const DRUG_SLANG_SALE_RE = new RegExp(String.raw`\b(?:${DRUG_SLANG})\s+${SALE_CONTEXT}\b`, "i");

function mentionsOutside(text: string, word: RegExp, benign: RegExp): boolean {
  return word.test(text.replace(benign, " "));
}

function ambiguousTokens(text: string): string[] {
  const tokens: string[] = [];
  if (mentionsOutside(text, /\bguns?\b/i, BENIGN_GUN)) tokens.push("ambiguous:gun");
  if (mentionsOutside(text, /\bpistols?\b/i, BENIGN_PISTOL)) tokens.push("ambiguous:pistol");
  if (mentionsOutside(text, /\brifles?\b/i, BENIGN_RIFLE)) tokens.push("ambiguous:rifle");
  if (mentionsOutside(text, /\bsilencers?\b/i, BENIGN_SILENCER)) tokens.push("ambiguous:silencer");
  if (mentionsOutside(text, /\bsuppress(?:or|er)s?\b/i, BENIGN_SUPPRESSOR)) tokens.push("ambiguous:suppressor");
  if (/\b(?:ammo|grenades?|dynamite)\b/i.test(text)) tokens.push("ambiguous:munition");
  if (/\breplicas?\b/i.test(text)) tokens.push("ambiguous:replica");
  if (/\bivory\s+(?:bangles?|jewel\w*|necklaces?|beads?)\b/i.test(text)) tokens.push("ambiguous:ivory");
  if (mentionsOutside(text, /\b(?:marijuana|cannabis)\b/i, BENIGN_CANNABIS)) tokens.push("ambiguous:cannabis");
  if (
    mentionsOutside(text, /\bweed\b/i, BENIGN_WEED) &&
    /\b(?:smoke|smoking|strain|high\s+grade|420|joint)\b/i.test(text)
  ) {
    tokens.push("ambiguous:cannabis");
  }
  if (DRUG_SLANG_SALE_RE.test(text)) tokens.push("ambiguous:drug_slang");
  return [...new Set(tokens)];
}

// ---- Hate: slurs (shared lexicon) + group-targeted incitement ----------------

const GROUPS =
  "jews?|muslims?|christians?|igbos?|yorubas?|hausas?|fulanis?|ijaws?|tivs?|blacks|whites|(?:black|white)\\s+(?:people|men|women|folks?)|gays?|lesbians?|homosexuals?|women|girls|foreigners|immigrants|refugees|arabs?|indians?|chinese|africans?|nigerians?|ghanaians?|albinos?|disabled|cripples?";

/**
 * Incitement against a named group. A verb plus any noun ("gas cooker", "kill
 * switch") is not hate, and a possessive ("kill women's odour") is not a group.
 */
export const LISTING_HATE_CONSTRUCTS: RegExp[] = [
  new RegExp(
    String.raw`\b(?:kill|gas|exterminate|lynch|behead|slaughter)\s+(?:all\s+)?(?:the\s+|those\s+|these\s+)?(?:${GROUPS})\b(?!['’])`,
    "i",
  ),
  new RegExp(
    String.raw`\b(?:all|every)\s+(?:the\s+)?(?:${GROUPS})\s+(?:should|must|deserve\s+to)\s+(?:die|burn|hang|be\s+killed)\b`,
    "i",
  ),
  /\b(?:go\s+back\s+to\s+your\s+country|subhuman|inferior\s+race|master\s+race)\b/i,
];

// ---- Scam ------------------------------------------------------------------

/**
 * Banks and wallets. A name used for a product ("Moniepoint POS terminal",
 * "GTB-branded mug", "Zenith Chronomaster" — a watch) is not a payment
 * destination; a word that is also an ordinary word ("sterling silver",
 * "heritage", "carbon") only counts with "bank" after it.
 */
const BANK_NAMES = String.raw`gt\s?bank|gtb|guaranty\s+trust(?:\s+bank)?|zenith(?:\s+bank)?|uba|united\s+bank\s+for\s+africa|first\s?bank|access\s+bank|fcmb|first\s+city\s+monument|fidelity\s+bank|union\s+bank|wema(?:\s+bank)?|alat|sterling\s+bank|polaris\s+bank|keystone\s+bank|stanbic(?:\s+ibtc)?|ecobank|providus(?:\s+bank)?|jaiz(?:\s+bank)?|unity\s+bank|heritage\s+bank|globus\s+bank|suntrust\s+bank|titan\s+trust|taj\s?bank|lotus\s+bank|premium\s?trust(?:\s+bank)?|optimus\s+bank|parallex(?:\s+bank)?|citi\s?bank|standard\s+chartered|kuda(?:\s+bank|\s+mfb)?|kudimoney|opay|o-pay|palm\s?pay|monie\s?point|paga|fair\s?money|eyowo|monnify|vfd\s+(?:bank|mfb)|chipper\s+cash|rubies\s+(?:bank|mfb)|carbon\s+(?:wallet|mfb)`;
const PRODUCT_NOUN = String.raw`(?:pos|terminals?|machines?|cards?|readers?|sound\s?box(?:es)?|speakers?|stickers?|branded|merch|souvenirs?|mugs?|t-?shirts?|shirts?|caps?|umbrellas?|calendars?|diar(?:y|ies)|tokens?|atm|debit|paper|rolls?|printers?|watch(?:es)?|chronomaster|defy|el\s+primero|pilot|elite)`;
const BANK_WORD_RE = new RegExp(
  String.raw`\b(?:${BANK_NAMES})\b(?![\s-]{0,3}(?:(?:bank|mfb)\b[\s-]{0,3})?${PRODUCT_NOUN}\b)`,
  "i",
);
/** The account itself named: "acct", "account number", "my account", "aza" (Pidgin for a bank account). */
const ACCOUNT_PHRASE_RE =
  /\b(?:acct|aza|a\/c\s{0,2}(?:no|number|num)\b|acc\s{0,2}(?:no|number|num)\b|account\s{0,2}(?:no\b|number|num\b|details?|name|#|:)|(?:my|our|bank|business|personal|savings|current|corporate)\s+account\b)/i;
/**
 * Labels that say a ten-digit number is a product's, not an account: "ISBN",
 * "serial", "S/N", "IMEI", "part number". A label a seller could put in front of
 * an account number ("ref", "code", "batch") is not on this list.
 */
const PRODUCT_LABELS = String.raw`isbn(?:-?1[03])?|imei\d?|meid|serial|s\/?n|model|part|p\/?n|oem|mpn|barcode|ean|upc|gtin|article|product\s+id|item\s+(?:no|number|code)|iuc|smartcard|waybill|awb|tracking|hs\s+code|nafdac|vin|chassis|engine|meter|asin`;
/** A ten-digit number standing on its own (after collapseTenDigitRuns), not behind a product label. */
const TEN = String.raw`(?<![0-9A-Za-z])(?<!\b(?:${PRODUCT_LABELS})(?:\s{0,2}(?:no|number|num|nr|id|code))?\.?\s{0,3}[:#.\-]?\s{0,3})\d{10}(?![0-9A-Za-z])`;
const TEN_RE = new RegExp(TEN, "i");
/** "account … 0123456789" close together, for the plain word "account". */
const ACCOUNT_NEAR_TEN_RE = new RegExp(String.raw`\baccount\b[^\n]{0,40}?${TEN}|${TEN}[^\n]{0,20}?\baccount\b`, "i");
/** "send money to 0123456789", "number to credit: 0123456789", "wire it to 0123456789". */
const MONEY_VERB_TEN_RE = new RegExp(
  String.raw`\b(?:send|sent|transfer|pay|paid|credit|deposit|wire|fund|remit|lodge)\w{0,8}\b[^\n.]{0,24}?${TEN}`,
  "i",
);
/** "0123456789 send alert", "0123456789 for payment". */
const TEN_ALERT_RE = new RegExp(
  String.raw`${TEN}[^\n.]{0,16}?\b(?:send\s+alert|credit\s+alert|drop\s+alert|for\s+(?:payment|transfer|alert))\b`,
  "i",
);
/** "acct 01234567890 (drop the last zero)": eleven digits beside an account word. A person looks. */
const ELEVEN_NEAR_ACCOUNT_RE = new RegExp(
  String.raw`\b(?:account|acct|acc|aza|${BANK_NAMES})\b[^\n.]{0,20}?(?<![0-9A-Za-z])\d{11}(?![0-9A-Za-z])`,
  "i",
);
/** A USSD transfer code: "*737*1*5000*0123456789#", "*894*0123 456 789#". */
const USSD_RE = /\*\d{2,4}(?:\*[\d\s.-]{1,24}){1,5}#/g;

/**
 * The text carries a coordinate to pay into: an account number (ten digits as
 * one number, however it is separated, or in placed halves) beside a bank,
 * wallet or account word anywhere in the text, or right after a money verb, or
 * inside a USSD transfer code. This — and only this — refuses.
 */
function carriesPaymentCoordinate(text: string): boolean {
  const collapsed = collapseTenDigitRuns(text);
  const ten = TEN_RE.test(collapsed);
  const bankWord = BANK_WORD_RE.test(text) || ACCOUNT_PHRASE_RE.test(text);
  if (ten && (bankWord || ACCOUNT_NEAR_TEN_RE.test(collapsed) || MONEY_VERB_TEN_RE.test(collapsed) || TEN_ALERT_RE.test(collapsed))) {
    return true;
  }
  if (bankWord && hasSplitTenDigitNumber(text)) return true;
  for (const match of text.matchAll(USSD_RE)) {
    for (const segment of match[0].slice(1, -1).split("*")) {
      if (segment.replace(/\D/g, "").length === 10) return true;
    }
  }
  return false;
}

const WALLETS = String.raw`opay|o-pay|palm\s?pay|monie\s?point|kuda|paga|fair\s?money|kudimoney|eyowo|chipper\s+cash`;
/** "outside Lagos", "outside the state": a delivery area, not the platform. */
const NOT_A_PLACE = String.raw`(?!\s{1,3}(?:lagos|abuja|ibadan|kano|kaduna|port\s+harcourt|ph|enugu|owerri|benin|warri|jos|ilorin|abeokuta|akure|calabar|uyo|asaba|onitsha|aba|nigeria|lekki|ikeja|ajah|yaba|surulere|ikorodu|town|the\s+(?:state|city|country|town|area|estate|region|zone|island|mainland)|[a-z]{1,20}\s+(?:state|buyers?|customers?|deliver(?:y|ies)|orders?|areas?|states?|shipping))\b)`;

/**
 * Steering a payment or a deal off the platform, with no coordinate to pay into.
 * Held for a person, never refused — and each needs its money or platform
 * context: "heat transfer only", "pay directly at checkout", "dealers outside
 * Lagos", "send payment alert to your phone" and "forget the app, the remote does
 * it" are honest.
 */
const STEERING: RegExp[] = [
  // "aza" — the everyday word for a bank account.
  /\b(?:my|our|the|this)\s+aza\b|\baza\s{0,3}(?::|=|-|is\b|na\b|no\b|number\b|details?\b)|\b(?:send|drop|share)\s+(?:your\s+|ur\s+|me\s+your\s+)?aza\b/i,
  // Pidgin: paying or pricing "outside".
  new RegExp(
    String.raw`\btalk\s+(?:the\s+)?(?:price|business|am|deal)\s+(?:for\s+)?outside\b|\bna\s+outside\b(?=\s{0,3}(?:[\n.,;!?]|$))|\bno\s+be\s+here\s+(?:you|una|we)\s+go\s+pay\b|\bpay\s+(?:for|na)\s+outside\b(?=\s{0,3}(?:[\n.,;!?]|$))|\b(?:transfer|send|pay)\s+(?:am\s+|it\s+)?come\s+my\s+side\b|\bsettle\s+(?:the\s+)?price\s+(?:for\s+)?outside\b|\boutside\s+price\s+(?:dey|is|na)\b|\b(?:my|correct|real|last|better|best|final|cheaper)\s+price\s+(?:for|na)\s+outside\b${NOT_A_PLACE}|\bno\s+dey\s+pay\s+for\s+here\b|\bpay\s+(?:me\s+|us\s+)?for\s+hand\b|\bsettle\s+(?:me|us)\s+outside\b`,
    "i",
  ),
  // The money to "my number", "my side".
  /\b(?:settle|pay|balance)\b[^.\n]{0,30}\bto\s+my\s+(?:number|line|phone)\b|\b(?:send|transfer)\s+(?:the\s+)?(?:money|payment|cash|balance|funds?|am|it)\b[^.\n]{0,20}\bto\s+my\s+(?:number|line|phone)\b/i,
  // Ordering through the seller's own page or app, or for a price that is only there.
  /\b(?:order|buy|patroni[sz]e)\s+(?:from|through|via|on)\s+(?:my|our)\s+(?:ig|insta|instagram|whatsapp|wa|website|site|profile|tiktok|facebook|fb|telegram)\b|\b(?:cheaper|discount\w{0,4}|better\s+price)\b[^.\n]{0,40}\b(?:my|our)\s+(?:page|profile|ig|instagram|website|site|whatsapp)\b|\b(?:my|our)\s+(?:page|profile|ig|instagram|website|site|whatsapp)\b[^.\n]{0,40}\b(?:cheaper|discount\w{0,4}|better\s+price)\b/i,
  // Into the seller's own account, bank or wallet.
  new RegExp(
    String.raw`\b(?:pa(?:y|id|yment)|transfer|send|deposit)\w{0,6}\b[^.\n]{0,30}\b(?:to|into|in)\s+(?:my|our)\s+(?:[a-z]{1,20}\s+){0,2}(?:account|acct|bank|wallet|aza|gtb|gtbank|uba|zenith|first\s?bank|access|wema|fcmb|providus|${WALLETS})\b`,
    "i",
  ),
  // Paying the seller directly, outside, in cash, or with the platform left out.
  /\btransfer\s+direct(?:ly)?\b(?!\s+(?:to\s+(?:your|the|a|any|other|another)|from|between|via|over|with|onto|into\s+(?:your|the)|in\s+the)\b)|\bpay\s+(?:me|us)\s+(?:outside|offline|privately|in\s+person|in\s+cash|cash|direct(?:ly)?)\b|\bpay\s+(?:the\s+)?seller\s+direct(?:ly)?\b|\bpay\s+direct(?:ly)?\b(?!\s+(?:at|in|on|through|via|with|using|online|from|into\s+(?:your|the)|to\s+(?:the\s+)?(?:platform|checkout|app))\b)|\bpay\s+(?:me|us)\s+(?:through|via|with|on)\s+my\b|\bpay\s+(?:me\s+)?when\s+you\s+see\s+me\b|\bsend\s+(?:the\s+)?(?:payment|money)\s+to\s+my\b|\btransfer\s+(?:the\s+money\s+)?to\s+(?:my|this)\s+account\b|\bpay\s+into\s+my\b|\bwire\s+(?:the\s+)?(?:money|cash|payment|funds)\s+to\b/i,
  new RegExp(String.raw`\bpay\s+outside\b${NOT_A_PLACE}`, "i"),
  // Cheaper off the platform, or the platform's checkout or fee avoided.
  /\b(?:cheaper|discount\w{0,4}|better\s+price|less)\b[^.\n]{0,40}\b(?:off|outside)\s+(?:the|this)\s+(?:app|platform|site|website|marketplace)\b|\b(?:pay|payment|deal|buy|order|transact\w{0,4}|cheaper|discount\w{0,4}|price|chat|talk|contact|meet|arrange)\b[^.\n]{0,40}\boutside\s+(?:the\s+|this\s+)?(?:platform|app|site|website|marketplace)\b|\boff[-\s]?platform\b|\bno\s+(?:platform|app|marketplace|site)\s+(?:charges?|fees?|commission)\b|\b(?:avoid|skip|save|dodge|escape)\s+(?:the\s+)?(?:platform\s+|app\s+|site\s+|service\s+|marketplace\s+)?(?:fees?|charges?|commission)\b(?=\s{0,3}(?:[\n.,;!?]|$)|\s+(?:if|by|when|and)\b)|\b(?:avoid|skip|dodge)\s+(?:the\s+)?(?:platform|app|site|marketplace)\s+(?:fees?|charges?|commission)\b/i,
  // Dealing with the seller directly, privately, offline.
  /\bbuy\s+(?:it\s+)?direct(?:ly)?\s+from\s+(?:me|us)\b|\bbuy\s+(?:it\s+)?from\s+(?:me|us)\s+direct(?:ly)?\b|\bdeal(?:s|ing)?\s+(?:privately|offline)\b|\bdeal(?:s|ing)?\s+outside\b(?=\s{0,3}(?:[\n.,;!?]|$|(?:the\s+|this\s+)?(?:app|platform|site|website|marketplace)\b))|\bdeal\s+with\s+(?:me|us)\s+direct(?:ly)?\b|\b(?:deal|transaction|sale)\s+offline\b|\bcontact\s+(?:the\s+)?seller\s+direct(?:ly)?\b(?![^.\n]{0,40}\b(?:chat|this\s+page|the\s+app|platform|messages?|here|inbox)\b)/i,
  // Not paying here, or not checking out.
  /\b(?:do\s{0,2}n[o'’]?t|don'?t|never)\s+pay\s+(?:here|on\s+(?:the\s+|this\s+)?(?:app|site|platform|website))\b|\bno\s+need\s+to\s+(?:order|pay|buy|check\s?out)\s+(?:here|on\s+(?:the|this)\s+(?:app|site|platform))\b|\bno\s+need\s+(?:to\s+|for\s+)?check\s?out\b|\bforget\s+(?:this|that)\s+(?:app|platform|site|website)\b|\bforget\s+the\s+(?:platform|site|website)\b|\bforget\s+the\s+app\b(?=[^.\n]{0,40}\b(?:pay|cash|transfer|price|cheaper|deal|buy)\b)/i,
  // Account details asked for, or put in a picture.
  /\b(?:dm|inbox|message|chat|call|text|ask)\b[^.\n]{0,20}\bfor\s+(?:my\s+|the\s+|our\s+)?(?:account|acct|bank|payment)\s+(?:details?|number|info)\b|\b(?:account|acct|bank|payment)\s+(?:details?|number|info)\s+(?:(?:is|are)\s+)?(?:on|in)\s+the\s+(?:picture|photo|image|pic|flyer)s?\b/i,
  // "Transfer only", "payment by transfer": the platform's checkout left out. Not "heat transfer only" or "data transfer only".
  /(?<!\b(?:heat|data|file|files|photo|photos|picture|pictures|music|video|videos|image|images|wireless|usb|bluetooth|thermal|water|liquid|signal|power|energy|sublimation|vinyl|dtf|digital|contact|contacts|call|calls|sim)[\s-]{1,3})\btransfer\s+only\b(?!\s+(?:works?|for|of|via|over|with|between|from|speed|rate|cables?|mode)\b)|\b(?:bank|cash|direct)\s+transfer\s+only\b|\bpayment\s+(?:is\s+)?(?:by|via|through)\s+(?:bank\s+)?transfer\b(?!\s+(?:at|on|in|through|via)\s+(?:the\s+)?(?:checkout|app|platform|site)\b)/i,
  // Alerts: "send me the alert", "send alert after you pay". Not a soundbox that sends a payment alert.
  /\b(?:send|drop|forward)\s+(?:me\s+|us\s+)?(?:the\s+)?(?:(?:credit|payment|transfer|bank|debit)\s+)?alert\b(?=[^.\n]{0,25}\b(?:once|after|when|immediately|to\s+confirm|as\s+soon)\b|\s{0,3}(?:[\n.,;!?]|$))|\bsend\s+(?:me|us)\s+(?:the\s+)?(?:(?:credit|payment|transfer|bank)\s+)?alert\b/i,
  // Crypto, gift cards, remittance. Not a crypto wallet that can "send, receive and pay with crypto".
  /(?<!\breceive\s{1,3}and\s{1,3})(?<!\breceive,\s{0,3}(?:and\s{1,3})?)\bpay\s+(?:me\s+|us\s+)?(?:with|in|via|by)\s+(?:crypto|bitcoin|btc|usdt|gift\s?cards?|itunes|steam\s+cards?)\b|\b(?:crypto|bitcoin|usdt)\s+(?:payments?\s+)?only\b|\b(?:usdt|btc|bitcoin|crypto|eth|ethereum)\s+(?:is\s+)?accepted\b|\b(?:western\s+union|moneygram|world\s?remit)\b/i,
  // A wallet as the way to pay: "Opay/Palmpay accepted", "I accept Opay", "fund my Palmpay", "pay through Opay".
  new RegExp(
    String.raw`\b(?:${WALLETS})(?:\s{0,3}(?:[,/&]|and|or)\s{0,3}(?:${WALLETS})){0,4}\s+(?:(?:transfers?|payments?)\s+)?(?:accepted|only)\b|\b(?:i|we)\s+(?:accept|take)\s+(?:${WALLETS})\b|\b(?:fund|top\s?up|load|credit)\s+my\s+(?:${WALLETS})\b|\b(?:pay|transfer|send)\s+(?:me\s+)?(?:through|via|with|on|using)\s+(?:my\s+)?(?:${WALLETS})\b(?![^.\n]{0,20}\b(?:at|on|in)\s+(?:the\s+)?checkout\b)`,
    "i",
  ),
  // Eleven digits beside an account word (one digit added to dodge the ten-digit rule).
  ELEVEN_NEAR_ACCOUNT_RE,
];

const SCAM: Rule[] = [
  {
    // Money asked for before anything is sent. "No deposit required before we ship" reassures.
    re: /(?<!\bno\s)(?<!\bwithout\s)(?<!\bzero\s)\b(?:deposit|part[-\s]payment|advance\s+payment|upfront(?:\s+payment)?)\b[^.\n]{0,40}\bbefore\s+(?:i|we)\s+(?:ship|send|deliver|dispatch|release)\b|\bdeposit\s+first\b|\b(?:half|part|some)\s+upfront\b|\bupfront\s+to\s+(?:secure|reserve|book)\b|(?<!\bno\s)\bupfront\s+payment\s+(?:pls|please|plz|only|first|required|is\s+required|needed)\b/i,
    token: "scam:advance_fee",
  },
  {
    // "Reset your password with the master code" is a smart lock; "reset your password here" is not.
    re: /\b(?:click\s+(?:this|the)\s+link|verify\s+your\s+account|confirm\s+your\s+(?:identity|password|credentials)|log\s{0,2}in\s+here|reset\s+your\s+password\s+(?:here|via|at|on\s+(?:this|our)|with\s+(?:this|the)\s+link|using\s+(?:this|the)\s+link))\b/i,
    token: "scam:phishing",
  },
  {
    // Asking for an identity or card secret. "We never ask for your OTP" and "SIM registration needs your NIN" are not.
    re: /\b(?:send|give|drop|share|provide|submit|tell|forward|text|dm|inbox|whatsapp)\s+(?:me\s+|us\s+)?(?:your|ur)\s+(?:id\s+card|id|bvn|nin|otp|atm\s+pin|pin|card\s+details|card\s+number|cvv)\b|(?<!\b(?:never|not|don'?t|do\s+not|won'?t|will\s+not|no\s+one|nobody)\s(?:[a-z]{1,12}\s){0,3})\byour\s+(?:bvn|otp|atm\s+pin|card\s+pin|card\s+details|cvv)\b|\bdriver'?s?\s+licen[cs]e\s+(?:photo|copy|scan)\b|(?<!\b(?:never|not|don'?t|do\s+not|won'?t|will\s+not|no\s+one|nobody)\s(?:[a-z]{1,12}\s){0,4})\batm\s+(?:card\s+)?(?:pin|details)\b/i,
    token: "scam:identity_request",
  },
  {
    re: /\b(?:you(?:'ve)?\s+won(?!['’]t)|congratulations\s+you|claim\s+your\s+prize|free\s+money|guaranteed\s+(?:income|profit)|guaranteed\s+returns?\s+of\s+\d|double\s+your\s+money)\b/i,
    token: "scam:advance_fee",
  },
];

const URGENCY_RE = /\b(?:act\s+now|limited\s+time|hurry|urgent(?:ly)?|don'?t\s+miss|expires?\s+soon|last\s+chance)\b/i;

/** A street address is a signal, not a hold: sellers legitimately name a pickup area. */
const ADDRESS_RE = /\b\d{1,5}[a-z]?,?\s+(?:[a-z]+\s+){1,3}(?:street|road|avenue|crescent|boulevard|estate|lane)\b/i;

const SEVERITY_RANK: Record<ModerationSeverity, number> = { low: 0, medium: 1, high: 2, critical: 3 };

export interface ListingRulesetOptions {
  imageHashes?: ReadonlyArray<string>;
  knownBadImageHashes?: ReadonlySet<string>;
  imageHashTolerance?: number;
}

/**
 * Run the listing ruleset. Pure and deterministic. Same contract as
 * `runDeterministic`: an unambiguous reject short-circuits the AI layer.
 */
export function runListingRulesetV2(input: ModerationInput, opts: ListingRulesetOptions = {}): DetectorVerdict {
  // Screened as a reader sees it: invisible characters removed, look-alike
  // letters and every digit script folded to ASCII.
  const text = foldForScreening(input.text ?? "");
  const reasons = new Set<ModerationReason>();
  const detail: string[] = [];
  const state: { decision: ModerationDecision; severity: ModerationSeverity; unambiguous: boolean } = {
    decision: "approve",
    severity: "low",
    unambiguous: false,
  };

  const raise = (next: "hold" | "reject", level: ModerationSeverity) => {
    if (next === "reject") {
      state.decision = "reject";
      state.unambiguous = true;
    } else if (state.decision === "approve") {
      state.decision = "hold";
    }
    if (SEVERITY_RANK[level] > SEVERITY_RANK[state.severity]) state.severity = level;
  };

  // 1. Prohibited goods and explicit counterfeits.
  for (const rule of [...PROHIBITED, ...COUNTERFEIT]) {
    if (rule.re.test(rule.benign ? text.replace(rule.benign, " ") : text)) {
      if (!detail.includes(rule.token)) detail.push(rule.token);
      reasons.add("banned_goods");
      raise("reject", "critical");
    }
  }

  // 2. Terms with a benign reading: a human decides.
  for (const token of ambiguousTokens(text)) {
    detail.push(token);
    reasons.add("banned_goods");
    raise("hold", "medium");
  }

  // 3. Hate (shared slur lexicon; listing-grade constructs) and profanity.
  // "Kike" with a capital is a Yoruba given name (Kikelomo) long before it is anything else here.
  const language = detectProfanity(text.replace(/\bKike\b/g, "Name"), input.locale, {
    hateConstructs: LISTING_HATE_CONSTRUCTS,
  });
  if (language.reasons.includes("hate_speech")) {
    detail.push((language.detail ?? []).includes("hate_construct") ? "hate:construct" : "hate:slur");
    reasons.add("hate_speech");
    raise("reject", "critical");
  } else if (language.reasons.includes("profanity")) {
    detail.push("profanity");
    reasons.add("profanity");
    raise("hold", "medium");
  }

  // 4. Contact details, including the usual disguises.
  for (const hit of detectContactDetails(text).hits) {
    detail.push(`contact:${hit.kind}:${hit.confidence}`);
    if (hit.confidence === "low") continue;
    reasons.add(hit.kind === "phone" || hit.kind === "email" ? "pii_leak" : "off_platform_contact");
    if (hit.confidence === "high") raise("reject", "high");
    else raise("hold", "medium");
  }

  // 5. Scam language. A coordinate to pay into, off the platform, is refused
  //    outright; steering with no coordinate, and the rest, holds for a person.
  //    Urgency on its own is ordinary sales copy and only a signal.
  if (carriesPaymentCoordinate(text)) {
    detail.push("scam:payment_diversion");
    reasons.add("scam_suspected");
    raise("reject", "high");
  }
  if (STEERING.some((re) => re.test(text))) {
    detail.push("scam:payment_steering");
    reasons.add("scam_suspected");
    raise("hold", "high");
  }
  for (const rule of SCAM) {
    if (!rule.re.test(text)) continue;
    if (!detail.includes(rule.token)) detail.push(rule.token);
    reasons.add("scam_suspected");
    raise("hold", "high");
  }
  if (URGENCY_RE.test(text)) detail.push("signal:urgency");
  if (ADDRESS_RE.test(text)) detail.push("signal:address");

  // 6. Known-bad images (hashes supplied by the caller).
  if (opts.imageHashes?.length && opts.knownBadImageHashes?.size) {
    const images = checkImageHashes(
      { hashes: opts.imageHashes, knownBad: opts.knownBadImageHashes },
      { maxHammingDistance: opts.imageHashTolerance },
    );
    if (images.decision === "reject") {
      detail.push("image:known_bad");
      reasons.add("image_hash_match");
      raise("reject", "critical");
    }
  }

  return {
    decision: state.decision,
    reasons: [...reasons],
    severity: state.severity,
    unambiguous: state.unambiguous,
    detail,
  };
}
