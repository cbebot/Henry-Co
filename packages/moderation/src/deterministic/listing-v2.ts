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
// ---------------------------------------------------------------------------

import { detectContactDetails, foldForScreening } from "@henryco/trust/contact";
import type { DetectorVerdict, ModerationDecision, ModerationInput, ModerationReason, ModerationSeverity } from "../types";
import { detectProfanity } from "./profanity";
import { checkImageHashes } from "./image-hash";

/** Bump when a rule changes: standing verdicts minted under an older value are re-scanned. */
export const LISTING_RULESET_VERSION = "listing_v2.1";

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

/** Banks and wallets whose name next to ten digits is an account to pay into. */
const BANK_NAMES =
  "gtb|gtbank|gt\\s?bank|guaranty\\s+trust|zenith|uba|first\\s?bank|fcmb|wema|stanbic|ecobank|providus|kuda|opay|o-pay|palmpay|palm\\s?pay|moniepoint|monie\\s?point|[a-z]+\\s+bank";
const TEN_DIGITS = "(?<!\\d)(?:\\d[\\s.-]?){9}\\d(?!\\d)";

const SCAM: Rule[] = [
  {
    // An account number: ten digits beside a bank, a wallet or the word "account".
    // "power bank 20000mAh" is a battery; a bank has a name in front of it.
    re: new RegExp(
      `\\b(?:${BANK_NAMES}|acct|acc|a\\/c|account|aza)\\b(?<!power\\s+bank)[^\\n.]{0,60}?${TEN_DIGITS}|${TEN_DIGITS}[^\\n.]{0,40}?\\b(?:${BANK_NAMES}|aza)\\b(?<!power\\s+bank)`,
      "i",
    ),
    token: "scam:payment_diversion",
  },
  {
    // A bare account number beside a word for paying into it ("just send to 0123456789",
    // "number to credit: 0123456789", "0123456789 send alert"), and USSD transfer codes.
    re: new RegExp(
      `\\b(?:send|transfer|pay|credit|deposit)\\w*\\s+(?:(?:it|am|money|cash|payment|funds|alert|the\\s+money)\\s+)?(?:to\\s+|into\\s+)?[:\\-]?\\s?${TEN_DIGITS}|\\bcredit\\b[^\\n.]{0,12}?[:\\-]\\s?${TEN_DIGITS}|${TEN_DIGITS}[^\\n.]{0,16}?\\b(?:send\\s+alert|credit\\s+alert|for\\s+(?:payment|transfer|alert))\\b|\\*\\d{3}\\*[\\d*]{4,40}#`,
      "i",
    ),
    token: "scam:payment_diversion",
  },
  {
    // "aza" — the everyday word for a bank account — and the Pidgin for paying outside.
    re: /\b(?:my|our|the|this)\s+aza\b|\baza\s*(?::|=|-|is\b|na\b|no\b|number\b|details?\b)|\b(?:send|drop|share)\s+(?:your\s+|ur\s+|me\s+your\s+)?aza\b|\btalk\s+(?:price|business|am)\s+(?:for\s+)?outside\b|\bna\s+outside\b|\bno\s+be\s+here\s+you\s+go\s+pay\b|\bpay\s+(?:for|na)\s+outside\b|\b(?:settle|pay|send|transfer|balance)\b[^.\n]{0,30}\bto\s+my\s+(?:number|line|phone)\b|\b(?:transfer|send|pay)\s+(?:am\s+|it\s+)?come\s+my\s+side\b|\b(?:order|buy)\s+from\s+(?:my|our)\s+(?:page|profile|ig|instagram|whatsapp|website|site)\b/i,
    token: "scam:payment_diversion",
  },
  {
    // Steering the payment itself off the platform, in the words sellers use.
    re: /\b(?:pa(?:y|id|yment)|transfer|send|deposit)\w*\b[^.\n]{0,30}\b(?:to|into|in)\s+(?:my|our)\s+(?:[a-z]+\s+){0,2}(?:account|acct|bank|wallet|gtb|opay|palmpay|kuda|uba|zenith)\b|\btransfer\s+direct(?:ly)?\b|\bpay\s+(?:me|us)\s+(?:outside|offline|privately|in\s+person|in\s+cash|cash)\b|\b(?:cheaper|discount\w*|better\s+price|less)\b[^.\n]{0,40}\b(?:off|outside)\s+(?:the|this)\s+(?:app|platform|site|website|marketplace)\b|\bbuy\s+direct(?:ly)?\s+from\s+(?:me|us)\b|\b(?:do\s*n[o'’]?t|don'?t|never)\s+pay\s+(?:here|on\s+(?:the\s+|this\s+)?(?:app|site|platform|website))\b|\bpay\s+(?:me\s+)?when\s+you\s+see\s+me\b|\b(?:dm|inbox|message|chat|call|text|ask)\b[^.\n]{0,20}\bfor\s+(?:my\s+|the\s+|our\s+)?(?:account|acct|bank|payment)\s+(?:details?|number|info)\b/i,
    token: "scam:payment_diversion",
  },
  {
    re: new RegExp(
      `\\b(?:send|transfer|pay)\\w*\\s+(?:the\\s+)?(?:money|payment|cash|funds)\\s+to\\s+${TEN_DIGITS}`,
      "i",
    ),
    token: "scam:payment_diversion",
  },
  {
    re: /\bdeal\w*\s+(?:privately|offline|outside)\b|\bdeal\s+with\s+(?:me|us)\s+direct(?:ly)?\b|\b(?:deal|transaction|sale)\s+offline\b|\bno\s+need\s+to\s+(?:order|pay|buy|check\s?out)\s+(?:here|on\s+(?:the|this)\s+(?:app|site|platform))\b|\bbuy\s+(?:it\s+)?from\s+(?:me|us)\s+direct(?:ly)?\b|\bno\s+(?:platform|service|app)\s+(?:charges?|fees?|commission)\b|\b(?:account|acct|bank|payment)\s+(?:details?|number|info)\s+(?:(?:is|are)\s+)?(?:on|in)\s+the\s+(?:picture|photo|image|pic|flyer)s?\b|\b(?:bank\s+)?transfer\s+only\b|\bpayment\s+(?:by|via)\s+(?:bank\s+)?transfer\b|\b(?:usdt|btc|bitcoin|crypto)\s+accepted\b/i,
    token: "scam:payment_diversion",
  },
  {
    // More of the same, in Pidgin and in shorthand.
    // Each needs its money context: "delivery price for outside Lagos", "sends an alert to
    // your phone" and "just transfer the files" are honest.
    re: /\b(?:my|correct|real|last|better|best)\s+price\s+(?:for|na)\s+outside\b|\bno\s+dey\s+pay\s+for\s+here\b|\bsend\s+(?:me\s+|us\s+)?(?:the\s+)?(?:credit|payment|transfer|bank)\s+alert\b|\bsend\s+alert\s+(?:after|once|when)\s+(?:you\s+)?(?:pay|transfer|payment)\w*|\bpay\s+(?:me\s+|us\s+)?for\s+hand\b|\bsettle\s+(?:me|us)\s+outside\b|\bforget\s+(?:this|the)\s+(?:app|platform|site|website)\b|\bno\s+need\s+to\s+check\s?out\b|\bpay\s+(?:me|us)\s+(?:through|via|with|on)\s+my\b|\bwire\s+(?:it|the\s+money|money)\s+to\b/i,
    token: "scam:payment_diversion",
  },
  {
    // Money asked for before anything is sent.
    re: /\b(?:deposit|part[-\s]payment|advance\s+payment|upfront)\b[^.\n]{0,40}\bbefore\s+(?:i|we)\s+(?:ship|send|deliver|dispatch|release)\b|\bdeposit\s+first\b|\b(?:half|part|some)\s+upfront\b|\bupfront\s+to\s+(?:secure|reserve|book)\b/i,
    token: "scam:advance_fee",
  },
  {
    re: /\b(?:pay\s+(?:me\s+)?direct(?:ly)?|pay\s+(?:the\s+)?seller\s+direct(?:ly)?|send\s+(?:the\s+)?(?:payment|money)\s+to\s+my|transfer\s+(?:the\s+money\s+)?to\s+(?:my|this)\s+account|pay\s+into\s+my|pay\s+outside|outside\s+(?:the\s+)?(?:platform|app|site|website)|avoid\s+(?:the\s+)?(?:platform\s+)?fees?|skip\s+(?:the\s+)?fees?|off[-\s]?platform|deal\s+outside|bank\s+transfer\s+only|contact\s+(?:the\s+)?seller\s+direct(?:ly)?|western\s+union|moneygram|pay\s+(?:with|in|via|by)\s+(?:crypto|bitcoin|btc|usdt|gift\s?cards?)|(?:crypto|bitcoin|usdt)\s+(?:payments?\s+)?only)\b/i,
    token: "scam:payment_diversion",
  },
  {
    re: /\b(?:click\s+this\s+link|verify\s+your\s+account|confirm\s+your\s+(?:identity|password|credentials)|log\s*in\s+here|reset\s+your\s+password)\b/i,
    token: "scam:phishing",
  },
  {
    re: /\b(?:send\s+(?:me\s+)?your\s+(?:id|bvn|nin|otp)|driver'?s?\s+licen[cs]e\s+(?:photo|copy|scan)|your\s+(?:bvn|nin|otp|atm\s+pin|card\s+details)|atm\s+(?:card\s+)?(?:pin|details))\b/i,
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

  // 5. Scam language. Steering payment off the platform is refused outright; the
  //    rest holds. Urgency on its own is ordinary sales copy and only a signal.
  for (const rule of SCAM) {
    if (!rule.re.test(text)) continue;
    detail.push(rule.token);
    reasons.add("scam_suspected");
    if (rule.token === "scam:payment_diversion") raise("reject", "high");
    else raise("hold", "high");
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
