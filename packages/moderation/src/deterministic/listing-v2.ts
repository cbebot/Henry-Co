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

import { detectContactDetails } from "@henryco/trust/contact";
import type { DetectorVerdict, ModerationDecision, ModerationInput, ModerationReason, ModerationSeverity } from "../types";
import { detectProfanity } from "./profanity";
import { checkImageHashes } from "./image-hash";

/** Bump when a rule changes: standing verdicts minted under an older value are re-scanned. */
export const LISTING_RULESET_VERSION = "listing_v2.1";

interface Rule {
  re: RegExp;
  token: string;
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
  },
  {
    re: /\b(?:brass\s+knuckles|knuckle\s+duster|switchblade|butterfly\s+knife|flick\s+knife|stun\s+gun|taser)\b/i,
    token: "banned:weapons",
  },
  // Wildlife
  {
    re: /\b(?:elephant\s+tusks?|rhino\s+horn|pangolin\s+scales?|leopard\s+skin|tiger\s+(?:bone|skin)|endangered\s+species)\b/i,
    token: "banned:wildlife",
  },
  {
    re: /\b(?:(?:real|genuine|raw|elephant)\s+ivory|ivory\s+(?:tusks?|carvings?|figurines?|bangles?|jewel\w*|chess))\b/i,
    token: "banned:wildlife",
  },
  // Human body
  {
    re: /\b(?:human\s+(?:organ|kidney|liver)|kidney\s+for\s+sale|organ\s+(?:donor|trade|for\s+sale)|sell\s+(?:my\s+)?(?:kidney|organ))\b/i,
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
  },
];

// ---- Ambiguous: a human decides ---------------------------------------------

const BENIGN_GUN =
  /\b(?:glue|hot\s+glue|nail|water|spray|heat|staple|grease|caulk(?:ing)?|toy|squirt|paintball|nerf|bb|massage|tattoo|price|label(?:l?ing)?|tagging|soldering|silicone|foam|sealant|air(?:\s+blow)?|blow|piercing|thermometer|temperature|infrared|fogging|sanitizer|sanitiser|gel|bubble|confetti|tape|rivet|riveting|pressure|wash(?:ing)?|paint|cake|icing|fascial?)\s+guns?\b|\bgun[-\s]?metal\b|\btop\s+gun\b/gi;
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
  "jews?|muslims?|christians?|igbos?|yorubas?|hausas?|fulanis?|ijaws?|tivs?|blacks?|whites?|gays?|lesbians?|homosexuals?|women|girls|foreigners|immigrants|refugees|arabs?|indians?|chinese|africans?|nigerians?|ghanaians?|albinos?|disabled|cripples?";

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

const SCAM: Rule[] = [
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
    re: /\b(?:you(?:'ve)?\s+won|congratulations\s+you|claim\s+your\s+prize|free\s+money|guaranteed\s+(?:income|profit)|guaranteed\s+returns?\s+of\s+\d|double\s+your\s+money)\b/i,
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
  const text = input.text ?? "";
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
    if (rule.re.test(text)) {
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
  const language = detectProfanity(text, input.locale, { hateConstructs: LISTING_HATE_CONSTRUCTS });
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
