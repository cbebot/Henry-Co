// ---------------------------------------------------------------------------
// contact.ts — obfuscation-resistant contact detection (pure, zero dependencies)
//
// Additive. `detectOffPlatformContact` in detect.ts is unchanged and keeps its
// callers; this module is for surfaces that must decide WITHOUT a human reading
// the text afterwards (instant-publish listings), where two things matter that
// the older detector does not give:
//
//   recall    — numbers written to dodge a filter: "o8o3 l23 4567",
//               "zero eight zero three…", "0 8 0 3 1 2 3 4 5 6 7", "+234-8O3…",
//               keycap / full-width / Arabic-Indic digits, "name at gmail dot com";
//   precision — prices, years, sizes, model numbers, barcodes and capacities are
//               not phone numbers. A hit carries a confidence so the caller can
//               reject only what is unmistakable and hold what merely looks odd.
//
// Nothing here returns the matched text: a hit is a kind, a confidence and a
// short evidence tag, so results are safe to log and to store.
//
// Known limits (deterministic by design — an optional AI signal sits above this):
// digits separated by filler words ("0803 then 123 then 4567"), letters other
// than o / l / I standing in for digits, and numbers inside images.
// ---------------------------------------------------------------------------

export type ContactKind = "phone" | "email" | "messaging_app" | "social_handle" | "link";
export type ContactConfidence = "high" | "medium" | "low";

export interface ContactHit {
  kind: ContactKind;
  confidence: ContactConfidence;
  /** Why it was flagged — a fixed tag, never the matched text. */
  evidence: string;
}

export interface ContactDetailsResult {
  detected: boolean;
  hits: ContactHit[];
  /** Strongest confidence across hits, or null when nothing was found. */
  highest: ContactConfidence | null;
}

const CONFIDENCE_RANK: Record<ContactConfidence, number> = { low: 0, medium: 1, high: 2 };

// ---- Unicode digit folding -------------------------------------------------

/** Zero code points of decimal-digit blocks NFKC does not fold to ASCII. */
const DIGIT_ZEROS = [
  0x0660, // Arabic-Indic
  0x06f0, // Extended Arabic-Indic
  0x07c0, // NKo
  0x0966, // Devanagari
  0x09e6, // Bengali
  0x0a66, // Gurmukhi
  0x0ae6, // Gujarati
  0x0b66, // Oriya
  0x0be6, // Tamil
  0x0c66, // Telugu
  0x0ce6, // Kannada
  0x0d66, // Malayalam
  0x0e50, // Thai
  0x0ed0, // Lao
  0x1040, // Myanmar
];

const INVISIBLE_RE = /[︀-️⃣​-‏‪-‮⁠-⁤﻿]/g;

function foldDigits(input: string): string {
  // NFKC folds full-width, mathematical, circled and superscript digits and
  // splits keycap emoji into "digit + variation selector + keycap".
  const s = input.normalize("NFKC").replace(INVISIBLE_RE, "");
  let out = "";
  for (const ch of s) {
    const cp = ch.codePointAt(0) as number;
    let mapped = ch;
    if (cp > 0x7f) {
      for (const zero of DIGIT_ZEROS) {
        if (cp >= zero && cp <= zero + 9) {
          mapped = String(cp - zero);
          break;
        }
      }
    }
    out += mapped;
  }
  return out;
}

// ---- Phone detection -------------------------------------------------------

const NUMBER_WORDS: Record<string, string> = {
  zero: "0",
  oh: "0",
  nought: "0",
  nil: "0",
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
};

const MULTIPLIER_WORDS: Record<string, number> = { double: 2, triple: 3, treble: 3 };

/**
 * Words that say "this number is how you reach me". Deliberately verbs and
 * channels only: nouns like "phone", "mobile", "number", "line" and "model" sit
 * next to ordinary numbers in every second listing ("phone 2023 6000 128").
 */
const CUE_WORDS = new Set([
  "call",
  "calls",
  "dial",
  "ring",
  "tel",
  "telephone",
  "whatsapp",
  "whatsap",
  "watsapp",
  "wa",
  "telegram",
  "viber",
  "wechat",
  "imo",
  "sms",
  "reach",
  "dm",
]);

/** Characters allowed between the digit groups of one number. */
const SEPARATOR_RE = /^[\s.\-_/\\*~,()[\]:;·•–—'"`+=]+$/;

interface PhoneRun {
  /** Digit groups in order, already de-obfuscated. */
  groups: string[];
  /** Written to evade: letters for digits, spelled-out digits, or one digit per token. */
  obfuscated: boolean;
  /** A leading "+" (or the word "plus"). */
  plus: boolean;
  /** A cue word sits right before or right after the run. */
  cued: boolean;
}

/**
 * A token made only of digits and digit look-alikes, with at least one real
 * digit. `o`/`O` stand for zero anywhere; `l`, `I` and `|` stand for one only
 * when another digit follows — a trailing `l` is a litre ("100l"), not a 1.
 */
function digitLikeToken(token: string): { digits: string; disguised: boolean } | null {
  if (!/\d/.test(token)) return null;
  if (!/^[0-9oOlI|]+$/.test(token)) return null;
  let digits = "";
  let disguised = false;
  for (let i = 0; i < token.length; i += 1) {
    const ch = token[i];
    if (ch >= "0" && ch <= "9") {
      digits += ch;
    } else if (ch === "o" || ch === "O") {
      digits += "0";
      disguised = true;
    } else {
      // l / I / |
      if (i === token.length - 1) return null;
      digits += "1";
      disguised = true;
    }
  }
  return { digits, disguised };
}

function tokenize(text: string): Array<{ text: string; separator: boolean }> {
  const tokens: Array<{ text: string; separator: boolean }> = [];
  const re = /[A-Za-z0-9|]+|[^A-Za-z0-9|]+/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const piece = match[0];
    tokens.push({ text: piece, separator: !/[A-Za-z0-9|]/.test(piece) });
  }
  return tokens;
}

function collectPhoneRuns(text: string): PhoneRun[] {
  const tokens = tokenize(text);
  const runs: PhoneRun[] = [];

  let groups: string[] = [];
  let obfuscated = false;
  let plus = false;
  let startIndex = -1;
  let pendingMultiplier = 0;

  const cueNear = (from: number, step: 1 | -1, reach: number): boolean => {
    let seen = 0;
    for (let i = from; i >= 0 && i < tokens.length && seen < reach; i += step) {
      if (tokens[i].separator) continue;
      seen += 1;
      if (CUE_WORDS.has(tokens[i].text.toLowerCase())) return true;
    }
    return false;
  };

  const flush = (endIndex: number) => {
    if (groups.length > 0) {
      const singles = groups.filter((group) => group.length === 1).length;
      runs.push({
        groups,
        // One digit per token ("0 8 0 3 1 2 …") is itself an evasion pattern.
        obfuscated: obfuscated || (groups.length >= 7 && singles >= groups.length - 1),
        plus,
        cued: cueNear(startIndex - 1, -1, 4) || cueNear(endIndex, 1, 2),
      });
    }
    groups = [];
    obfuscated = false;
    plus = false;
    startIndex = -1;
    pendingMultiplier = 0;
  };

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];

    if (token.separator) {
      if (groups.length === 0) {
        if (/\+\s*$/.test(token.text)) plus = true;
        continue;
      }
      if (!SEPARATOR_RE.test(token.text)) flush(i);
      continue;
    }

    const lower = token.text.toLowerCase();

    if (lower === "plus" && groups.length === 0) {
      plus = true;
      obfuscated = true;
      continue;
    }

    if (MULTIPLIER_WORDS[lower] !== undefined) {
      pendingMultiplier = MULTIPLIER_WORDS[lower];
      continue;
    }

    const word = NUMBER_WORDS[lower];
    const like = word === undefined ? digitLikeToken(token.text) : null;

    if (word === undefined && like === null) {
      flush(i);
      continue;
    }

    const numeric = word ?? (like as { digits: string }).digits;
    if (startIndex === -1) startIndex = i;
    if (word !== undefined || (like && like.disguised) || pendingMultiplier > 0) obfuscated = true;
    groups.push(pendingMultiplier > 0 && numeric.length === 1 ? numeric.repeat(pendingMultiplier) : numeric);
    pendingMultiplier = 0;
  }
  flush(tokens.length);

  return runs;
}

/** Nigerian mobile shapes: 0[789][01]xxxxxxxx and the 234 / 00234 country-code forms. */
const NG_LOCAL_RE = /^0[789][01]\d{8}$/;
const NG_INTL_RE = /^(?:00)?234[789][01]\d{8}$/;
const NG_NO_TRUNK_RE = /^[789][01]\d{8}$/;

/** Does any window of consecutive groups spell a Nigerian mobile number? */
function containsNigerianMobile(groups: string[]): boolean {
  for (let start = 0; start < groups.length; start += 1) {
    let joined = "";
    for (let end = start; end < groups.length && joined.length < 15; end += 1) {
      joined += groups[end];
      if (NG_LOCAL_RE.test(joined) || NG_INTL_RE.test(joined)) return true;
    }
  }
  return false;
}

function classifyPhoneRun(run: PhoneRun): ContactHit | null {
  const digits = run.groups.join("");
  const n = digits.length;
  if (n < 7) return null;

  if (containsNigerianMobile(run.groups)) {
    return { kind: "phone", confidence: "high", evidence: run.obfuscated ? "ng_mobile_obfuscated" : "ng_mobile" };
  }
  if (n > 16) return null;

  // A number someone took the trouble to disguise is a contact attempt.
  if (run.obfuscated && n >= 10 && n <= 15) {
    return { kind: "phone", confidence: "high", evidence: "obfuscated_digits" };
  }

  if (run.plus && n >= 10 && n <= 15) {
    return { kind: "phone", confidence: "high", evidence: "international_plus" };
  }

  if (NG_NO_TRUNK_RE.test(digits)) {
    // Ten digits with the mobile prefix but no trunk zero: a phone when the text
    // says so, otherwise it could be prices sitting next to each other.
    return run.cued
      ? { kind: "phone", confidence: "high", evidence: "ng_mobile_no_trunk" }
      : { kind: "phone", confidence: "low", evidence: "ng_mobile_no_trunk_uncued" };
  }

  if (run.cued && n <= 15) {
    return { kind: "phone", confidence: n >= 10 ? "high" : "medium", evidence: "cued_number" };
  }

  if (run.obfuscated) {
    return { kind: "phone", confidence: "medium", evidence: "obfuscated_short" };
  }

  // Plain digit groups with nothing saying "call": sizes, prices, barcodes.
  return null;
}

// ---- Email -----------------------------------------------------------------

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}/;

const SPELLED_TLDS = "com|net|org|ng|co|io|me|info|biz|africa|xyz";
const WEBMAIL = "gmail|yahoo|ymail|hotmail|outlook|icloud|protonmail|proton";
const DOT_SPELLED = String.raw`(?:\(\s*dot\s*\)|\[\s*dot\s*\]|\{\s*dot\s*\}|\s+dot\s+)`;
const AT_BRACKETED = String.raw`(?:\(\s*at\s*\)|\[\s*at\s*\]|\{\s*at\s*\})`;
const LOCAL_PART = String.raw`[a-z0-9][a-z0-9._%+-]{1,40}`;

/** "name (at) shop.com", "name [at] shop (dot) com" */
const BRACKET_AT_EMAIL_RE = new RegExp(
  String.raw`${LOCAL_PART}\s*${AT_BRACKETED}\s*[a-z0-9-]{2,40}\s*(?:\.|${DOT_SPELLED})\s*(?:${SPELLED_TLDS})\b`,
  "i",
);
/** "name at shop dot com" — the bare word "at" only counts with a spelled-out dot. */
const WORD_AT_EMAIL_RE = new RegExp(
  String.raw`${LOCAL_PART}\s+at\s+[a-z0-9-]{2,40}\s*${DOT_SPELLED}\s*(?:${SPELLED_TLDS})\b`,
  "i",
);
/** "name at gmail.com" — the bare word "at" also counts in front of a mailbox provider. */
const WORD_AT_WEBMAIL_RE = new RegExp(String.raw`${LOCAL_PART}\s+at\s+(?:${WEBMAIL})\s*\.\s*com\b`, "i");
/** A mailbox provider named with its dot ("gmail.com", "yahoo dot com"). */
const WEBMAIL_HINT_RE = new RegExp(String.raw`\b(?:${WEBMAIL})\s*(?:\.|${DOT_SPELLED})\s*(?:com|co\.[a-z]{2})\b`, "i");

// ---- Messaging apps, handles, links -----------------------------------------

const APP_NAMES = String.raw`whats\s?app|whatsap|watsapp|telegram|viber|wechat|imessage|snapchat|instagram|facebook|messenger|tiktok`;
const APP_SHORT = "signal|ig|insta|fb";
const CONTACT_VERBS = "add|chat|message|msg|contact|reach|text|ping|hit|find|follow|dm|call|order|buy|pay|send";

/** "message me on WhatsApp", "add us on Telegram", "DM me via IG". */
const APP_STEER_PRONOUN_RE = new RegExp(
  String.raw`\b(?:${CONTACT_VERBS})\s+(?:with\s+)?(?:me|us)\s+(?:up\s+)?(?:on|via|through|thru|at|by)\s+(?:my\s+|our\s+)?(?:${APP_NAMES}|${APP_SHORT})\b`,
  "i",
);
/** "my WhatsApp number", "our Telegram channel". */
const APP_POSSESSIVE_RE = new RegExp(
  String.raw`\b(?:my|our)\s+(?:${APP_NAMES}|ig|insta|fb)\s+(?:number|no|line|handle|id|page|account|group|channel)\b`,
  "i",
);
/** "orders via WhatsApp", "payment on Telegram only". */
const APP_CHANNEL_RE = new RegExp(
  String.raw`\b(?:orders?|buy|pay|payments?|contact|enquir(?:y|ies)|inquir(?:y|ies)|chat|message|delivery|negotiat\w+)\s+(?:is\s+|are\s+)?(?:only\s+|strictly\s+)?(?:on|via|through|thru)\s+(?:${APP_NAMES}|signal)\b`,
  "i",
);
/** "WhatsApp: 080…", "IG @shop", "Telegram - @name". A hyphen only counts before a number or handle. */
const APP_LABEL_RE = new RegExp(
  String.raw`\b(?:${APP_NAMES}|ig|insta|fb)\s*(?:me|us|number|no\.?|line|handle|id|page)?\s*(?::|@|[-–—]\s*(?=[\d@+]))`,
  "i",
);
const APP_MENTION_RE = new RegExp(String.raw`\b(?:${APP_NAMES})\b`, "i");
const DM_RE = /\b(?:dm\s+(?:me|us)|inbox\s+(?:me|us)|slide\s+into)\b/i;

const CONTACT_LINK_RE =
  /\b(?:wa\.me|t\.me|bit\.ly|tinyurl\.com|cutt\.ly|rebrand\.ly|linktr\.ee|chat\.whatsapp\.com|api\.whatsapp\.com)\/[^\s)]+/i;
const URL_RE = /\bhttps?:\/\/[^\s)]+/i;
/** A bare domain. Only TLDs that are not everyday words ("me", "co", "net", "shop" are excluded). */
const BARE_DOMAIN_RE =
  /(?<![@\w.-])(?:www\.)?[a-z0-9][a-z0-9-]{1,40}\.(?:com\.ng|com|org|ng|io|biz|info|xyz|africa)(?![\w-])/i;

/** "@shopname" — needs a letter, and is not a price ("@5000", "@N5000"). */
const HANDLE_RE = /(?:^|[\s(,;])@(?!(?:ngn|n|₦)?\s?\d)(?=[a-zA-Z0-9_.]*[a-zA-Z])[a-zA-Z0-9_.]{3,30}\b/i;

// ---- Public API ------------------------------------------------------------

/**
 * Detect contact details in free text, including the usual ways of hiding them.
 * Pure and deterministic. Returns kinds + confidences only — never the text.
 */
export function detectContactDetails(input: string): ContactDetailsResult {
  const hits: ContactHit[] = [];
  const text = foldDigits(String(input ?? ""));

  if (text.trim().length === 0) {
    return { detected: false, hits, highest: null };
  }

  // A wa.me / t.me link is a phone number or a handle by another name.
  if (CONTACT_LINK_RE.test(text)) {
    hits.push({ kind: "link", confidence: "high", evidence: "contact_link" });
  } else if (URL_RE.test(text)) {
    hits.push({ kind: "link", confidence: "medium", evidence: "url" });
  }

  if (EMAIL_RE.test(text)) {
    hits.push({ kind: "email", confidence: "high", evidence: "email" });
  } else if (BRACKET_AT_EMAIL_RE.test(text) || WORD_AT_EMAIL_RE.test(text) || WORD_AT_WEBMAIL_RE.test(text)) {
    hits.push({ kind: "email", confidence: "high", evidence: "email_spelled" });
  } else if (WEBMAIL_HINT_RE.test(text)) {
    hits.push({ kind: "email", confidence: "medium", evidence: "webmail_hint" });
  } else if (!hits.some((hit) => hit.kind === "link") && BARE_DOMAIN_RE.test(text)) {
    hits.push({ kind: "link", confidence: "medium", evidence: "bare_domain" });
  }

  let strongestPhone: ContactHit | null = null;
  for (const run of collectPhoneRuns(text)) {
    const hit = classifyPhoneRun(run);
    if (!hit) continue;
    if (!strongestPhone || CONFIDENCE_RANK[hit.confidence] > CONFIDENCE_RANK[strongestPhone.confidence]) {
      strongestPhone = hit;
    }
  }
  if (strongestPhone) hits.push(strongestPhone);

  if (
    APP_STEER_PRONOUN_RE.test(text) ||
    APP_POSSESSIVE_RE.test(text) ||
    APP_CHANNEL_RE.test(text) ||
    APP_LABEL_RE.test(text)
  ) {
    hits.push({ kind: "messaging_app", confidence: "high", evidence: "app_steer" });
  } else if (DM_RE.test(text)) {
    hits.push({ kind: "messaging_app", confidence: "medium", evidence: "dm_request" });
  } else if (APP_MENTION_RE.test(text)) {
    // A bare mention ("works with WhatsApp video calls") is not a contact attempt.
    hits.push({ kind: "messaging_app", confidence: "low", evidence: "app_mention" });
  }

  if (HANDLE_RE.test(text) && !hits.some((hit) => hit.kind === "email")) {
    hits.push({ kind: "social_handle", confidence: "medium", evidence: "handle" });
  }

  // A messaging app named next to a number or a handle is the whole instruction.
  const hasApp = hits.some((hit) => hit.kind === "messaging_app");
  const hasReach = hits.some(
    (hit) => (hit.kind === "phone" && hit.confidence !== "low") || hit.kind === "social_handle",
  );
  if (hasApp && hasReach) {
    for (const hit of hits) {
      if (hit.kind === "messaging_app" && hit.confidence !== "high") {
        hit.confidence = "high";
        hit.evidence = "app_with_contact";
      } else if ((hit.kind === "phone" || hit.kind === "social_handle") && hit.confidence === "medium") {
        hit.confidence = "high";
        hit.evidence = `${hit.evidence}_with_app`;
      }
    }
  }

  let highest: ContactConfidence | null = null;
  for (const hit of hits) {
    if (highest === null || CONFIDENCE_RANK[hit.confidence] > CONFIDENCE_RANK[highest]) {
      highest = hit.confidence;
    }
  }

  return { detected: hits.length > 0, hits, highest };
}
