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
// digits separated by filler words ("0803 then 123 then 4567"), a number written
// only in words of another language, and numbers inside images.
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
  0x1090, // Myanmar Shan
  0x0de6, // Sinhala Lith
  0x0f20, // Tibetan
  0x17e0, // Khmer
  0x1810, // Mongolian
  0x1946, // Limbu
  0x19d0, // New Tai Lue
  0x1a80, // Tai Tham Hora
  0x1a90, // Tai Tham Tham
  0x1b50, // Balinese
  0x1bb0, // Sundanese
  0x1c40, // Lepcha
  0x1c50, // Ol Chiki
  0xa620, // Vai
  0xa8d0, // Saurashtra
  0xa900, // Kayah Li
  0xa9d0, // Javanese
  0xaa50, // Cham
  0xabf0, // Meetei Mayek
  0x104a0, // Osmanya
  0x1e950, // Adlam
];

/** Han numerals, read as the digits they are. */
const HAN_DIGITS: Record<string, string> = {
  "\u3007": "0",
  "\u96f6": "0",
  "\u4e00": "1",
  "\u4e8c": "2",
  "\u4e09": "3",
  "\u56db": "4",
  "\u4e94": "5",
  "\u516d": "6",
  "\u4e03": "7",
  "\u516b": "8",
  "\u4e5d": "9",
};

/**
 * Everything that renders as nothing: format characters (soft hyphen, zero-width
 * and bidi controls, tag characters), combining marks and variation selectors.
 * "0803<soft hyphen>1234567" reads as one number and must be screened as one.
 */
const INVISIBLE_RE = new RegExp("[\\p{Cf}\\p{Mn}\\p{Me}\\u115F\\u1160\\u3164\\uFFA0]", "gu");

/** Letters of other scripts that read as a Latin O / I, or as a digit. */
const CONFUSABLES: Record<string, string> = {
  "\u041e": "O", // Cyrillic О
  "\u043e": "o",
  "\u039f": "O", // Greek Ο
  "\u03bf": "o",
  "\u00d8": "O", // Ø
  "\u00f8": "o",
  "\u0406": "I", // Cyrillic І
  "\u04c0": "I", // palochka
  "\u0399": "I", // Greek Ι
  "\u0417": "3", // Cyrillic З
  "\u3002": ".", // ideographic full stop
  "\uff61": ".", // halfwidth ideographic full stop
  "\u2024": ".", // one dot leader
  "\u00b7": ".", // middle dot
};

/** Dingbat digit series NFKC leaves alone: [first code point, value of that code point, count]. */
const DINGBAT_DIGITS: ReadonlyArray<readonly [number, number, number]> = [
  [0x24ff, 0, 1], // negative circled zero
  [0x1f10b, 0, 1], // dingbat circled sans-serif zero
  [0x1f10c, 0, 1], // dingbat negative circled sans-serif zero
  [0x2776, 1, 9], // negative circled 1-9
  [0x2780, 1, 9], // sans-serif circled 1-9
  [0x278a, 1, 9], // negative sans-serif circled 1-9
  [0x24f5, 1, 9], // double circled 1-9
];

/**
 * The text as a reader sees it: compatibility forms folded, invisible characters
 * removed, look-alike letters and every digit script mapped to ASCII.
 */
export function foldForScreening(input: string): string {
  // NFKC folds full-width, mathematical, circled and superscript digits and
  // splits keycap emoji into "digit + variation selector + keycap".
  const s = String(input ?? "").normalize("NFKC").replace(INVISIBLE_RE, "");
  let out = "";
  for (const ch of s) {
    const cp = ch.codePointAt(0) as number;
    let mapped = ch;
    if (cp > 0x7f) {
      const confusable = CONFUSABLES[ch] ?? HAN_DIGITS[ch];
      if (confusable !== undefined) {
        mapped = confusable;
      } else {
        for (const zero of DIGIT_ZEROS) {
          if (cp >= zero && cp <= zero + 9) {
            mapped = String(cp - zero);
            break;
          }
        }
        if (mapped === ch) {
          for (const [first, value, count] of DINGBAT_DIGITS) {
            if (cp >= first && cp < first + count) {
              mapped = String(value + (cp - first));
              break;
            }
          }
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
 * Pidgin spellings of the digits. Every one of them is an ordinary word too
 * ("tree", "for"-like sounds), so they count only INSIDE a number that is already
 * being spelled out in words — never on their own.
 */
const PIDGIN_NUMBER_WORDS: Record<string, string> = {
  wan: "1",
  tu: "2",
  tree: "3",
  fo: "4",
  faiv: "5",
  siks: "6",
  sevin: "7",
  eit: "8",
  nain: "9",
};

/** Words that only join the pieces of a number being read out: "…three THEN one two three THEN…". */
const FILLER_WORDS = new Set([
  "then", "and", "plus", "dash", "space", "next", "comma", "den", "hyphen", "x", "by", "to", "dot", "slash", "stroke",
]);

/**
 * Words that say "this number is how you reach me". Deliberately verbs and
 * channels only: nouns like "phone", "mobile", "number", "line" and "model" sit
 * next to ordinary numbers in every second listing ("phone 2023 6000 128").
 */
/** "whatsapp", "watsap", "wassap", "whtsapp", "whatsaap" … one pattern instead of a list that is never complete. */
const WHATSAPP = String.raw`wh?a?t?s{1,2}\s?a{1,2}p{1,2}`;
const WHATSAPP_WORD_RE = /^wh?a?t?s{1,2}a{1,2}p{1,2}$/;

const CUE_WORDS = new Set([
  "call",
  "calls",
  "dial",
  "tel",
  "telephone",
  "whatsapp",
  "whatsap",
  "watsapp",
  "watsap",
  "wassap",
  "whatapp",
  "wa",
  "telegram",
  "viber",
  "wechat",
  "imo",
  "sms",
  "reach",
  "dm",
]);

/**
 * Nouns that sit next to ordinary numbers in every second listing — too weak to
 * make any number a phone number, but enough to settle a number that already has
 * the Nigerian mobile shape with its leading zero dropped ("my number 8031234567").
 */
const SOFT_CUE_WORDS = new Set(["number", "phone", "mobile", "contact", "chat", "line", "cell", "digits", "hotline"]);

/** Labels that say the number after them is NOT a phone number. */
const NOT_A_PHONE_LABELS = new Set([
  "isbn",
  "barcode",
  "upc",
  "ean",
  "serial",
  "imei",
  "sku",
  "model",
  "part",
  "code",
  "ref",
  "reference",
  "batch",
  "lot",
  "tracking",
  "nafdac",
  "reg",
  "registration",
]);

/**
 * What may sit between the digit groups of one number: any short run that has no
 * letter and no digit in it. Sellers separate with whatever the filter does not
 * expect — an emoji, "#", a non-breaking hyphen, " | " — so the test is "is this
 * a word?", not "is this on a list?".
 */
const HAS_LETTER_OR_DIGIT_RE = new RegExp("[\\p{L}\\p{N}]", "u");
function isSeparator(piece: string): boolean {
  return piece.length <= 12 && !HAS_LETTER_OR_DIGIT_RE.test(piece);
}

interface PhoneRun {
  /** Digit groups in order, already de-obfuscated. */
  groups: string[];
  /** Per group: was it written to evade (letters for digits, a spelled-out digit)? */
  disguised: boolean[];
  /** Written to evade: letters for digits, spelled-out digits, or one digit per token. */
  obfuscated: boolean;
  /** A leading "+" (or the word "plus"). */
  plus: boolean;
  /** A cue word sits right before or right after the run. */
  cued: boolean;
  /** A weaker noun ("number", "phone", "contact") sits next to the run. */
  softCued: boolean;
  /** The word before the run says it is something else ("ISBN", "model", "serial"). */
  labelled: boolean;
}

/** Letters that pass for a digit only inside a token that is otherwise a number. */
const WEAK_LOOKALIKES: Record<string, string> = {
  s: "5",
  S: "5",
  b: "8",
  B: "8",
  z: "2",
  Z: "2",
  G: "6",
  g: "9",
  q: "9",
  i: "1",
  E: "3",
  e: "3",
  T: "7",
  t: "7",
  A: "4",
  a: "4",
};

/** A token written with the weak look-alikes ("S67", "12E4"), mapped to digits. Null when it is not one. */
function weakLookalikeDigits(token: string): string | null {
  if (!/\d/.test(token) || !/^[0-9oOlI|sSbBzZGgqiEeTtAa]+$/.test(token)) return null;
  let digits = "";
  for (const ch of token) {
    if (ch >= "0" && ch <= "9") digits += ch;
    else if (ch === "o" || ch === "O") digits += "0";
    else if (ch === "l" || ch === "I" || ch === "|") digits += "1";
    else digits += WEAK_LOOKALIKES[ch];
  }
  return digits;
}

const NUMBER_WORD_ALTERNATION = "zero|nought|one|two|three|four|five|six|seven|eight|nine|oh";
/** Number words glued to digits or to each other: "zero8zero3", "onetwothree", "4Five6Seven". */
const GLUED_NUMBER_TOKEN_RE = new RegExp(`^(?:${NUMBER_WORD_ALTERNATION}|[0-9oO])+$`, "i");
const GLUED_NUMBER_PART_RE = new RegExp(`${NUMBER_WORD_ALTERNATION}|[0-9oO]`, "gi");

/** "zero8zero3" -> "0803". Needs a real digit plus a word, or two words: "one" and "phone" stay words. */
function gluedNumberDigits(token: string): string | null {
  if (!GLUED_NUMBER_TOKEN_RE.test(token)) return null;
  const parts = token.match(GLUED_NUMBER_PART_RE) ?? [];
  const words = parts.filter((part) => part.length > 1).length;
  const realDigits = parts.filter((part) => part.length === 1 && part >= "0" && part <= "9").length;
  // A lone letter o only reads as zero next to real digits ("o8o3onetwo…").
  if (realDigits === 0 && parts.some((part) => part === "o" || part === "O")) return null;
  if (words === 0 || (words === 1 && realDigits === 0)) return null;
  return parts
    .map((part) => (part.length > 1 ? NUMBER_WORDS[part.toLowerCase()] : part === "o" || part === "O" ? "0" : part))
    .join("");
}

/**
 * A token made only of digits and digit look-alikes, with at least one real
 * digit. `o`/`O` stand for zero anywhere; `l`, `I` and `|` stand for one only
 * when another digit follows — a trailing `l` is a litre ("100l"), not a 1.
 *
 * The weaker look-alikes (S for 5, B for 8, Z for 2 …) count only inside a long
 * token that is mostly digits ("08031234S67"), and never mark the run as
 * disguised by themselves: such a token is flagged only when what it spells has
 * the shape of a phone number. "S23", "5S" and "B12" stay what they are.
 */
function digitLikeToken(token: string): { digits: string; disguised: boolean } | null {
  if (!/\d/.test(token)) return null;
  const strong = /^[0-9oOlI|]+$/.test(token);
  if (!strong) {
    if (!/^[0-9oOlI|sSbBzZGgqiEeTtAa]+$/.test(token)) return null;
    // o / O / l / I / | already read as digits, so they count towards "mostly digits".
    const real = token.replace(/[^0-9oOlI|]/g, "").length;
    if (token.length < 7 || real * 10 < token.length * 7) return null;
  }
  let digits = "";
  let disguised = false;
  for (let i = 0; i < token.length; i += 1) {
    const ch = token[i];
    if (ch >= "0" && ch <= "9") {
      digits += ch;
    } else if (ch === "o" || ch === "O") {
      digits += "0";
      disguised = true;
    } else if (ch === "l" || ch === "I" || ch === "|") {
      if (i === token.length - 1) return null;
      digits += "1";
      disguised = true;
    } else {
      digits += WEAK_LOOKALIKES[ch];
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
  let disguised: boolean[] = [];
  let obfuscated = false;
  let plus = false;
  let startIndex = -1;
  let pendingMultiplier = 0;
  /** Groups in the current run that were written as words. */
  let wordGroups = 0;

  const wordNear = (words: ReadonlySet<string>, from: number, step: 1 | -1, reach: number): boolean => {
    let seen = 0;
    for (let i = from; i >= 0 && i < tokens.length && seen < reach; i += step) {
      if (tokens[i].separator) continue;
      seen += 1;
      const word = tokens[i].text.toLowerCase();
      if (words.has(word)) return true;
      if (words === CUE_WORDS && WHATSAPP_WORD_RE.test(word)) return true;
    }
    return false;
  };

  const flush = (endIndex: number) => {
    if (groups.length > 0) {
      const singles = groups.filter((group) => group.length === 1).length;
      // One digit per token ("0 8 0 3 1 2 …") is itself an evasion pattern.
      // Ten or more: a row of sizes or fractions ("1/2, 3/4, 1, 1 1/4") is shorter.
      const spelledOut = groups.length >= 10 && singles >= groups.length - 1;
      runs.push({
        groups,
        disguised: spelledOut ? groups.map(() => true) : disguised,
        obfuscated: obfuscated || spelledOut,
        plus,
        cued: wordNear(CUE_WORDS, startIndex - 1, -1, 4) || wordNear(CUE_WORDS, endIndex, 1, 2),
        softCued: wordNear(SOFT_CUE_WORDS, startIndex - 1, -1, 3) || wordNear(SOFT_CUE_WORDS, endIndex, 1, 2),
        labelled: wordNear(NOT_A_PHONE_LABELS, startIndex - 1, -1, 2),
      });
    }
    groups = [];
    disguised = [];
    wordGroups = 0;
    obfuscated = false;
    plus = false;
    startIndex = -1;
    pendingMultiplier = 0;
  };

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];

    // A bare "|" between groups is a divider, not a digit.
    if (token.separator || /^\|+$/.test(token.text)) {
      if (groups.length === 0) {
        if (/\+\s*$/.test(token.text)) plus = true;
        continue;
      }
      if (!isSeparator(token.text)) flush(i);
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

    // A joining word inside a number that is being read out, or that opened with a
    // mobile prefix ("0803 then 123 then 4567"), does not end the number.
    if (
      FILLER_WORDS.has(lower) &&
      groups.length > 0 &&
      (wordGroups >= 2 || groups.some((group) => /^(?:0|234)[789][01]/.test(group)))
    ) {
      continue;
    }

    const word = NUMBER_WORDS[lower] ?? (wordGroups >= 2 ? PIDGIN_NUMBER_WORDS[lower] : undefined);
    const like = word === undefined ? digitLikeToken(token.text) : null;

    if (word === undefined && like === null) {
      // Number words glued together or onto digits are a number written to evade.
      const glued = gluedNumberDigits(token.text);
      if (glued !== null) {
        if (startIndex === -1) startIndex = i;
        obfuscated = true;
        groups.push(glued);
        disguised.push(true);
        pendingMultiplier = 0;
        continue;
      }
      // A short group written with a weak look-alike ("S67") counts only when it
      // completes a mobile number with the groups before it.
      const weak = groups.length > 0 ? weakLookalikeDigits(token.text) : null;
      if (weak !== null && containsNigerianMobile([...groups, weak])) {
        obfuscated = true;
        groups.push(weak);
        disguised.push(true);
        continue;
      }
      flush(i);
      continue;
    }

    const numeric = word ?? (like as { digits: string }).digits;
    if (startIndex === -1) startIndex = i;
    const evasive = word !== undefined || Boolean(like && like.disguised) || pendingMultiplier > 0;
    if (evasive) obfuscated = true;
    groups.push(pendingMultiplier > 0 && numeric.length === 1 ? numeric.repeat(pendingMultiplier) : numeric);
    disguised.push(evasive);
    if (word !== undefined) wordGroups += 1;
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

/** Is there a stretch of consecutive groups, 10 to 15 digits long, that includes a disguised group? */
function hasDisguisedWindow(run: PhoneRun): boolean {
  for (let start = 0; start < run.groups.length; start += 1) {
    let length = 0;
    let disguised = false;
    for (let end = start; end < run.groups.length; end += 1) {
      length += run.groups[end].length;
      disguised = disguised || run.disguised[end];
      if (length > 15) break;
      if (length >= 10 && disguised) return true;
    }
  }
  return false;
}

/**
 * A mobile number cut in two and placed in different sentences or fields:
 * "…code 0803. … batch 1234567", or the first half in the URL handle and the rest
 * in the title. Looks at the digit groups of the whole text, whatever stands
 * between them, and accepts only the unmistakable case: a group that opens with a
 * Nigerian mobile prefix, completed to exactly eleven digits by ONE other group.
 * How far away the other piece may sit depends on how unmistakable it is: six or
 * seven missing digits can be anywhere in the text (the URL handle is read last,
 * the title first), five a few numbers away, and a short piece must be the very
 * next or previous number — "open 0700 to 2100" and "0803 mm by 1234 mm" are not
 * phone numbers.
 */
function hasSplitNigerianMobile(text: string): boolean {
  const groups = text.match(/\d+/g) ?? [];
  for (let i = 0; i < groups.length; i += 1) {
    const first = groups[i];
    if (first.length < 4 || first.length > 8 || !/^0[789][01]/.test(first)) continue;
    const missing = 11 - first.length;
    const reach = missing >= 6 ? groups.length : missing === 5 ? 6 : 1;
    for (let j = Math.max(0, i - reach); j < groups.length && j <= i + reach; j += 1) {
      if (j !== i && groups[j].length === missing) return true;
    }
  }
  return false;
}

/**
 * Does the run hold a Nigerian mobile number with its trunk zero dropped?
 *
 *   "phone"  written the way a mobile number is — one ten-digit block, or
 *            "803 123 4567" — anywhere in the run (a SKU or a delivery window next
 *            to it does not hide it);
 *   "loose"  the run as a whole has the digits but not the grouping: a part number
 *            ("90915-10003") or a row of sizes;
 *   "none"   neither.
 */
function noTrunkShape(run: PhoneRun): "phone" | "loose" | "none" {
  for (let start = 0; start < run.groups.length; start += 1) {
    const first = run.groups[start];
    if (first.length === 10) {
      if (NG_NO_TRUNK_RE.test(first)) return "phone";
      continue;
    }
    if (first.length < 3 || first.length > 4) continue;
    let joined = first;
    for (let end = start + 1; end < run.groups.length && end <= start + 2; end += 1) {
      joined += run.groups[end];
      if (joined.length === 10 && NG_NO_TRUNK_RE.test(joined)) return "phone";
      if (joined.length >= 10) break;
    }
  }
  return NG_NO_TRUNK_RE.test(run.groups.join("")) ? "loose" : "none";
}

function classifyPhoneRun(run: PhoneRun): ContactHit | null {
  const digits = run.groups.join("");
  const n = digits.length;
  if (n < 7) return null;

  if (containsNigerianMobile(run.groups)) {
    return { kind: "phone", confidence: "high", evidence: run.obfuscated ? "ng_mobile_obfuscated" : "ng_mobile" };
  }

  // A number someone took the trouble to disguise is a contact attempt — also when
  // it sits in a longer run of digits (a SKU or a size next to it does not hide it).
  if (run.obfuscated && hasDisguisedWindow(run)) {
    return { kind: "phone", confidence: "high", evidence: "obfuscated_digits" };
  }
  if (n > 16) return null;

  if (run.plus && n >= 10 && n <= 15) {
    return { kind: "phone", confidence: "high", evidence: "international_plus" };
  }

  const noTrunk = noTrunkShape(run);
  if (noTrunk !== "none") {
    // Ten digits with the mobile prefix but no trunk zero: a phone when the text
    // says so. With nothing said it is still the shape of one, so a person looks —
    // unless it is labelled as something else, or is grouped like a part number.
    if (run.cued || run.softCued) return { kind: "phone", confidence: "high", evidence: "ng_mobile_no_trunk" };
    if (run.labelled || noTrunk === "loose") {
      return { kind: "phone", confidence: "low", evidence: "ng_mobile_no_trunk_uncued" };
    }
    return { kind: "phone", confidence: "medium", evidence: "ng_mobile_no_trunk_unlabelled" };
  }

  if (run.cued && n <= 15) {
    return { kind: "phone", confidence: n >= 10 ? "high" : "medium", evidence: "cued_number" };
  }

  // Ten digits in one block is the shape of a bank account number (and of a mobile
  // number without its zero). Unless the text says what it is — an ISBN, a part
  // number, a barcode — a person looks.
  if (!run.labelled && run.groups.some((group) => group.length === 10)) {
    return { kind: "phone", confidence: "medium", evidence: "ten_digit_number" };
  }

  if (run.obfuscated) {
    return { kind: "phone", confidence: "medium", evidence: "obfuscated_short" };
  }

  // Plain digit groups with nothing saying "call": sizes, prices, barcodes.
  return null;
}

// ---- Email -----------------------------------------------------------------

// Every quantifier in this file is bounded, and nothing scans "the rest of the
// text" from each position: a field of 100,000 characters is screened in
// milliseconds, not seconds. (An address has at most 64 characters before the @.)
const EMAIL_RE = /[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9-]{1,63}(?:\.[a-zA-Z0-9-]{1,63}){0,4}\.[a-zA-Z]{2,24}/;

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
/** "name@gmail", "name@gmail,com" — a mailbox provider after an @ needs no dot to be an address. */
const AT_WEBMAIL_RE = new RegExp(String.raw`[a-z0-9._%+-]{2,64}\s?@\s?(?:${WEBMAIL})\b`, "i");
/** A mailbox provider named at all ("adeshop gmail", "it is a gmail account"). A listing has no reason to. */
const WEBMAIL_MENTION_RE = /\b(?:gmail|ymail|hotmail|protonmail|yahoo\s?mail)\b/i;
/** "name at gmail", "gmail: name" — the unmistakable providers only. */
const WEBMAIL_SURE = "gmail|yahoo|ymail|hotmail|icloud|protonmail";
const WORD_AT_SURE_WEBMAIL_RE = new RegExp(String.raw`${LOCAL_PART}\s+at\s+(?:${WEBMAIL_SURE})\b`, "i");
const WEBMAIL_LABEL_RE = new RegExp(String.raw`\b(?:${WEBMAIL_SURE})\s*[:\-–]\s*[a-z0-9][a-z0-9._%+-]{2,40}\b`, "i");
/** "name@shop" with no top-level domain: probably an address. Not a price ("3pcs@N5000"). */
const EMAIL_LIKE_RE = /(?=[a-z0-9._%+-]{0,63}[a-z])[a-z0-9._%+-]{3,64}@(?!(?:ngn|n|₦)?\s?\d)[a-z][a-z0-9-]{2,63}/i;
/** A mailbox provider named with its dot ("gmail.com", "yahoo dot com"). */
const WEBMAIL_HINT_RE = new RegExp(String.raw`\b(?:${WEBMAIL})\s*(?:\.|${DOT_SPELLED})\s*(?:com|co\.[a-z]{2})\b`, "i");

// ---- Messaging apps, handles, links -----------------------------------------

const APP_NAMES = String.raw`${WHATSAPP}|telegram|viber|wechat|imessage|snapchat|instagram|facebook|messenger|tiktok|botim|truecaller|discord|skype|threads`;
const APP_SHORT = String.raw`signal|ig|insta|fb|wa|w\/a|snap`;
const CONTACT_VERBS = "add|chat|message|msg|contact|reach|text|ping|hit|find|follow|dm|call|order|buy|pay|send|buzz|holla|hmu";

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
  String.raw`\b(?:${APP_NAMES}|ig|insta|fb|snap)\s*(?:me|us|number|no\.?|line|handle|id|page)?\s*(?::|@|[-–—]\s*(?=[\d@+]))`,
  "i",
);
/**
 * The seller sending the buyer to an app: "available on WhatsApp for orders",
 * "find our page on Facebook". A product that merely works with an app, or copy
 * that names one ("also available on Telegram", "follow the latest styles on
 * Instagram"), is not that — it needs the seller ("our", "my") or a reason to go
 * there (orders, enquiries).
 */
const APP_DESTINATION_RE = new RegExp(
  String.raw`\b(?:available|reachable|active|online)\s+on\s+(?:${APP_NAMES})\b(?=[^.\n]{0,30}\b(?:for|to)\s+(?:orders?|enquir\w+|inquir\w+|more|details|chat|contact|buy|purchase)\b)|\b(?:find|search|follow|check|add|like|visit)\s+(?:our|my)\s+[a-z]+\s+on\s+(?:${APP_NAMES}|ig|insta|fb)\b`,
  "i",
);
/** "find Ade Shop NG on Facebook" — a NAME to look up on an app. Checked for the capital in code. */
const FIND_NAME_ON_APP_RE = new RegExp(
  String.raw`\b(?:find|search(?:\s+for)?|look\s+for|check)\s+([A-Za-z][\w&'-]*(?:\s+[A-Za-z][\w&'-]*){0,3})\s+on\s+(?:${APP_NAMES}|ig|insta|fb)\b`,
  "i",
);
const APP_MENTION_RE = new RegExp(String.raw`\b(?:${APP_NAMES})\b`, "i");
/** "hmu on ig", "we dey for tiktok", "price na for WhatsApp", "message my personal line". */
const APP_SLANG_RE = new RegExp(
  String.raw`\b(?:hmu|holla|buzz|ping)\b[^.\n]{0,20}\b(?:on|via|at)\s+(?:${APP_NAMES}|${APP_SHORT})\b|\b(?:we|i)\s+dey\s+(?:for|on)\s+(?:${APP_NAMES}|${APP_SHORT})\b|\b(?:price|prices|order|orders|payment)\s+(?:na|is|dey)\s+(?:for|on)\s+(?:${APP_NAMES}|${APP_SHORT})\b|\b(?:message|text|call|reach|contact|dm|msg)\s+(?:me\s+on\s+)?my\s+(?:personal\s+|private\s+|direct\s+)?(?:line|number|phone)\b|\b(?:dm|message|text|msg|send)\b[^.\n]{0,30}\bto\s+my\s+(?:personal\s+|private\s+)?(?:line|number|phone)\b|\b(?:holla|hmu|buzz|ping)\s+(?:at\s+)?@?(?=[a-z0-9_.]{0,30}(?:_|\.[a-z0-9]|[a-z]{3}[a-z0-9]{0,20}\d))[a-z0-9][a-z0-9_.]{2,29}\b`,
  "i",
);
const DM_RE =
  /\b(?:dm\s+(?:me|us)|inbox\s+(?:me|us)|slide\s+into|(?:dm|inbox|pm)\s+for\s+(?:price|prices|details|info|more|orders?|enquir\w+)|send\s+(?:me\s+|us\s+)?a\s+dm|all\s+(?:our\s+|my\s+)?socials?|(?:our|my)\s+socials?|social\s+media\s+(?:handle|page)s?)\b/i;
/** "check my store name for my number" — the contact was moved somewhere the rules do not read together. */
const CONTACT_ELSEWHERE_RE =
  /\b(?:check|see|look\s+at|view)\s+(?:my|our|the)\s+(?:store|shop|profile|bio|page)(?:\s+name)?\s+for\s+(?:my|our|the)\s+(?:number|contact|phone|whatsapp|digits|details)\b/i;

/** Hosts whose links are a phone number, a handle or an outside checkout by another name. */
const CONTACT_LINK_HOSTS = [
  "wa\\.me",
  "wa\\.link",
  "t\\.me",
  "m\\.me",
  "fb\\.me",
  "chat\\.whatsapp\\.com",
  "api\\.whatsapp\\.com",
  "instagram\\.com",
  "facebook\\.com",
  "tiktok\\.com",
  "twitter\\.com",
  "x\\.com",
  "snapchat\\.com",
  "bit\\.ly",
  "tinyurl\\.com",
  "cutt\\.ly",
  "rebrand\\.ly",
  "shorturl\\.at",
  "tiny\\.cc",
  "rb\\.gy",
  "is\\.gd",
  "t\\.co",
  "linktr\\.ee",
  "bio\\.link",
  "linkin\\.bio",
  "beacons\\.ai",
  "take\\.app",
  "selar\\.co",
  "selar\\.com",
  "paystack\\.shop",
  "paystack\\.com",
  "flutterwave\\.com",
  "bumpa\\.shop",
].join("|");
const CONTACT_LINK_RE = new RegExp(String.raw`\b(?:${CONTACT_LINK_HOSTS})\/[^\s)]+`, "i");
const URL_RE = /\bhttps?:\/\/[^\s)]+/i;
/** "anything.tld/path" — a link written without its scheme. */
const PATH_LINK_RE = /(?<![@\w.-])(?:[a-z0-9][a-z0-9-]{0,40}\.){1,4}[a-z]{2,10}\/[^\s)]{2,}/i;
/** A bare domain, with any number of subdomains, on a top-level domain that is not an everyday word. */
const BARE_DOMAIN_RE =
  /(?<![@\w.-])(?:www\.)?(?:[a-z0-9][a-z0-9-]{0,40}\.){0,3}[a-z0-9][a-z0-9-]{1,40}\.(?:com\.ng|co\.uk|co\.za|com|org|ng|io|biz|info|xyz|africa)(?![\w-])/i;
/**
 * A bare domain on a top-level domain that IS an everyday word ("adeshop.store",
 * "adeshop.shop"). Lower case only, and a label of four or more characters: a
 * missing space after a full stop ("…very good.Shop now") is not an address.
 */
const WORD_DOMAIN_RE =
  /(?<![@\w.-])(?:[a-z0-9][a-z0-9-]{0,40}\.){0,3}[a-z0-9][a-z0-9-]{3,40}\.(?:store|shop|online|site|app|link|net|co|me|live)(?![\w.-])/;
/** The same, shouted: "ADESHOP.STORE". */
const WORD_DOMAIN_CAPS_RE =
  /(?<![@\w.-])[A-Z0-9][A-Z0-9-]{3,40}\.(?:STORE|SHOP|ONLINE|SITE|APP|LINK|NET|CO|ME|LIVE)(?![\w.-])/;
/** A dot dressed up or moved: "adeshop[.]com", "adeshop,com", "adeshop•com", "adeshop. com". Lower case only. */
const DISGUISED_DOT_DOMAIN_RE =
  /\b[a-z0-9][a-z0-9-]{2,40}(?:\s?(?:\[\.\]|\(\.\)|,|•|·)\s?|\.\s+)(?:com\.ng|com|org)\b/;
/** "adeshop dot com", "adeshop .com". Only top-level domains that are not words ("polka dot net fabric"). */
const SPELLED_DOMAIN_RE =
  /\b[a-z0-9][a-z0-9-]{2,40}(?:\s+\.\s*|\s+dot\s+|\s*\(\s*dot\s*\)\s*|\s*\[\s*dot\s*\]\s*)(?:com\.ng|com|ng|org|io|africa)\b|\b[a-z0-9][a-z0-9-]{2,40}\s*(?:\(\s*dot\s*\)|\[\s*dot\s*\])\s*(?:store|shop|online|site|app|link|net|co|me|live)\b|\b(?!polka\b)[a-z0-9][a-z0-9-]{3,40}\s+dot\s+(?:store|shop|online|site)\b/i;

/** "@shopname" — needs a letter, and is not a price ("@5000", "@N5000"). */
const HANDLE_RE = /(?:^|[\s(,;])@(?!(?:ngn|n|₦)?\s?\d)(?=[a-zA-Z0-9_.]{0,29}[a-zA-Z])[a-zA-Z0-9_.]{3,30}\b/i;

const HANDLE_APPS = "ig|insta|instagram|tiktok|snapchat|snap|facebook|fb|twitter|telegram|threads";
/**
 * "IG adeshop_ng", "our tiktok is adeshop.ng", "snapchat adeshop22" — an app
 * followed by a handle-shaped word: letters with a "_", a "." or a digit in it.
 */
const APP_THEN_HANDLE_RE = new RegExp(
  // The app name is a whole word and something separates it from the handle
  // ("Snapchat." is not "snap" + "chat."). Handle-shaped means: an underscore, a
  // dot INSIDE the word, or letters followed by a digit — "1080p" and "Reels." are not.
  String.raw`\b(?:${HANDLE_APPS})\b(?:\s{1,3}(?:(?:is|handle|page|name|username|id|at)\s{1,3})?|\s{0,3}[:@–-]\s{0,3})@?(?=[a-z0-9_.]{0,30}(?:_|\.[a-z0-9]|[a-z]{3}[a-z0-9]{0,20}\d))[a-z0-9][a-z0-9_.]{2,29}[a-z0-9]\b`,
  "i",
);
/** "search adeshop on Instagram", "we are adeshop_ng on tiktok". */
const HANDLE_ON_APP_RE = new RegExp(
  // Handle-shaped as above, or written with its "@": "find inspiration on TikTok" is neither.
  String.raw`\b(?:search|find|follow|check|add|we\s+are|i\s+am|i'?m)\s+(?:for\s+|out\s+|us\s+as\s+|me\s+as\s+)?(?:@[a-z0-9][a-z0-9_.]{2,29}|(?=[a-z0-9_.]{0,30}(?:_|\.[a-z0-9]|[a-z]{3}[a-z0-9]{0,20}\d))[a-z0-9][a-z0-9_.]{2,29})\s+on\s+(?:${HANDLE_APPS})\b`,
  "i",
);
/** "search adeshop on Instagram": one plain word to look up. A person looks (it may be an ordinary word). */
const WORD_ON_APP_RE = new RegExp(
  String.raw`\b(?:search|find|follow|ping|buzz|holla|we\s+are|i\s+am|i'?m|we\s+dey\s+(?:for|on)\s+(?:${HANDLE_APPS})\s+as)\s+(?:for\s+)?([a-z][a-z0-9]{3,29})(?:\s+on\s+(?:${HANDLE_APPS})\b|\b(?<=\bas\s[a-z0-9]{4,30}))`,
  "i",
);
/** Ordinary words that follow "find … on Instagram" in honest copy. */
const NOT_A_HANDLE = new Set([
  "more", "inspiration", "ideas", "them", "videos", "reviews", "prices", "deals", "tutorials", "styles",
  "tips", "content", "photos", "pictures", "trends", "looks", "outfits", "designs", "recipes", "samples",
  "examples", "updates", "people", "friends", "everything", "anything", "something", "others", "live",
]);
/** "drop your number", "leave your contact in a review" — asking the BUYER for a way to reach them. */
const CONTACT_REQUEST_RE =
  /\b(?:drop|leave|put|send|share|give)\s+(?:me\s+|us\s+)?(?:your|ur)\s+(?:number|contact|digits|phone|whatsapp|line)\b/i;
/** "link in bio", "my linktree", "scan the QR code to order". */
const LINK_IN_BIO_RE =
  /\blink\s+(?:is\s+)?in\s+(?:my\s+|our\s+|the\s+)?bio\b|\b(?:in|on)\s+(?:my|our)\s+bio\b|\b(?:is|are)\s+in\s+the\s+bio\b|\blinktree\b|\bscan\s+(?:the\s+|our\s+|my\s+|this\s+)?qr(?:\s+code)?\b[^.\n]{0,30}\b(?:order|pay|buy|contact|chat|reach)\b/i;
/** "the number is on the picture" — the contact was moved where text rules cannot read it. */
const CONTACT_IN_IMAGE_RE =
  /\b(?:number|contact|phone|whatsapp|digits|line)\s+(?:is|are)\s+(?:on|in)\s+the\s+(?:picture|photo|image|pic|flyer|banner)s?\b/i;

// ---- Public API ------------------------------------------------------------

/**
 * Detect contact details in free text, including the usual ways of hiding them.
 * Pure and deterministic. Returns kinds + confidences only — never the text.
 */
export function detectContactDetails(input: string): ContactDetailsResult {
  const hits: ContactHit[] = [];
  const text = foldForScreening(String(input ?? ""));

  if (text.trim().length === 0) {
    return { detected: false, hits, highest: null };
  }

  // A wa.me / t.me link is a phone number or a handle by another name.
  if (CONTACT_LINK_RE.test(text) || LINK_IN_BIO_RE.test(text)) {
    hits.push({ kind: "link", confidence: "high", evidence: "contact_link" });
  } else if (URL_RE.test(text)) {
    hits.push({ kind: "link", confidence: "medium", evidence: "url" });
  } else if (PATH_LINK_RE.test(text)) {
    hits.push({ kind: "link", confidence: "medium", evidence: "link_path" });
  }

  if (EMAIL_RE.test(text) || AT_WEBMAIL_RE.test(text)) {
    hits.push({ kind: "email", confidence: "high", evidence: "email" });
  } else if (
    BRACKET_AT_EMAIL_RE.test(text) ||
    WORD_AT_EMAIL_RE.test(text) ||
    WORD_AT_WEBMAIL_RE.test(text) ||
    WORD_AT_SURE_WEBMAIL_RE.test(text) ||
    WEBMAIL_LABEL_RE.test(text)
  ) {
    hits.push({ kind: "email", confidence: "high", evidence: "email_spelled" });
  } else if (WEBMAIL_HINT_RE.test(text) || WEBMAIL_MENTION_RE.test(text)) {
    hits.push({ kind: "email", confidence: "medium", evidence: "webmail_hint" });
  } else if (EMAIL_LIKE_RE.test(text)) {
    hits.push({ kind: "email", confidence: "medium", evidence: "email_like" });
  } else if (
    !hits.some((hit) => hit.kind === "link") &&
    (BARE_DOMAIN_RE.test(text) ||
      WORD_DOMAIN_RE.test(text) ||
      WORD_DOMAIN_CAPS_RE.test(text) ||
      DISGUISED_DOT_DOMAIN_RE.test(text) ||
      SPELLED_DOMAIN_RE.test(text))
  ) {
    hits.push({ kind: "link", confidence: "medium", evidence: "bare_domain" });
  }

  // Two readings of the same text: "|" as a look-alike for 1, and "|" as a divider
  // between groups. A number glued to a word ("call08031234567") is cut free first.
  const phoneText = text
    .replace(/(?<=[A-Za-z]{2})(?=\d{7})/g, " ")
    .replace(/(?<=\d{7})(?=[A-Za-z]{2})/g, " ")
    .replace(/(^|[^A-Za-z0-9])([A-Za-z])(?=(?:0|234)[789][01]\d{8}(?!\d))/g, "$1$2 ")
    .replace(/((?:^|[^0-9])(?:0|234)[789][01]\d{8})(?=[A-Za-z])/g, "$1 ");
  const readings = phoneText.includes("|") ? [phoneText, phoneText.replace(/\|/g, " ")] : [phoneText];
  let strongestPhone: ContactHit | null = null;
  for (const reading of readings) {
    for (const run of collectPhoneRuns(reading)) {
      const hit = classifyPhoneRun(run);
      if (!hit) continue;
      if (!strongestPhone || CONFIDENCE_RANK[hit.confidence] > CONFIDENCE_RANK[strongestPhone.confidence]) {
        strongestPhone = hit;
      }
    }
  }
  if (CONTACT_IN_IMAGE_RE.test(text) || CONTACT_ELSEWHERE_RE.test(text) || CONTACT_REQUEST_RE.test(text)) {
    strongestPhone = { kind: "phone", confidence: "high", evidence: "contact_elsewhere" };
  } else if (
    (!strongestPhone || strongestPhone.confidence === "low") &&
    hasSplitNigerianMobile(phoneText)
  ) {
    strongestPhone = { kind: "phone", confidence: "medium", evidence: "ng_mobile_split" };
  }
  if (strongestPhone) hits.push(strongestPhone);

  if (
    APP_STEER_PRONOUN_RE.test(text) ||
    APP_POSSESSIVE_RE.test(text) ||
    APP_CHANNEL_RE.test(text) ||
    APP_LABEL_RE.test(text) ||
    APP_DESTINATION_RE.test(text) ||
    APP_SLANG_RE.test(text)
  ) {
    hits.push({ kind: "messaging_app", confidence: "high", evidence: "app_steer" });
  } else if (DM_RE.test(text)) {
    hits.push({ kind: "messaging_app", confidence: "medium", evidence: "dm_request" });
  } else if (APP_MENTION_RE.test(text)) {
    // A bare mention ("works with WhatsApp video calls") is not a contact attempt.
    hits.push({ kind: "messaging_app", confidence: "low", evidence: "app_mention" });
  }

  const named = FIND_NAME_ON_APP_RE.exec(text);
  const word = WORD_ON_APP_RE.exec(text);
  if (
    APP_THEN_HANDLE_RE.test(text) ||
    HANDLE_ON_APP_RE.test(text) ||
    // A capitalised name to look up ("find Ade Shop NG on Facebook"), not "find the latest styles on …".
    (named !== null && /^[A-Z]/.test(named[1]))
  ) {
    hits.push({ kind: "social_handle", confidence: "high", evidence: "app_handle" });
  } else if (word !== null && !NOT_A_HANDLE.has(word[1].toLowerCase())) {
    hits.push({ kind: "social_handle", confidence: "medium", evidence: "word_on_app" });
  } else if (HANDLE_RE.test(text) && !hits.some((hit) => hit.kind === "email")) {
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
