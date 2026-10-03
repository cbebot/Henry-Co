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
//               "0803 na 123 na 4567", "starts 0803, middle 123, ends 4567",
//               keycap / full-width / Arabic-Indic digits, "name at gmail dot com";
//   precision — prices, years, sizes, opening hours, model, part and serial
//               numbers, barcodes and capacities are not phone numbers.
//
// A hit carries a confidence, and the confidence follows two tiers, enforced in
// one place (`LITERAL_EVIDENCE`, applied last):
//
//   HIGH (the caller refuses) — only a datum written in its literal, standard
//            form: an 11-digit Nigerian mobile in one block or in up to four
//            groups with one plain separator (space, dash or dot); an address
//            with "@" and a domain, or "name_1 at domain.com"; a link or a
//            domain on a known top-level domain; a handle written "@handle",
//            "<app>: handle", "<app> handle" or "handle on <app>".
//   MEDIUM (a person looks) — every reading that rebuilds a datum from a
//            disguise: pieces joined across words or gaps, spelled, Pidgin or
//            look-alike digits, "double"/"triple", cue words, odd separators,
//            a bracketed or spelled "at"/"dot", arrows or quotes between an app
//            and a handle, words for a top-level domain — and every phrase with
//            no datum ("drop your number", "link in bio", "message me on WhatsApp").
//
// Holding is cheap: a person looks. Refusing an honest seller is the expensive
// error, so a refusal needs a datum nobody had to reconstruct. The text is read
// as it renders: invisible characters are removed and digits of other scripts
// (full-width, Arabic-Indic, keycaps) are digits — those are not disguises.
//
// Nothing here returns the matched text: a hit is a kind, a confidence and a
// short evidence tag, so results are safe to log and to store.
//
// Every quantifier is bounded and every scan is linear: a field of 100,000
// characters is screened in milliseconds, not seconds.
//
// Known limits (deterministic by design — an optional AI signal and buyer
// reports sit above this): a number written only in words of another language,
// a number inside an image, a plain word after an app name that is also an
// ordinary word (held, not refused), a label put in front of a number with extra
// digits added to it ("barcode 0 8031 2345 67 0"), a number grouped like a UPC or
// EAN barcode with a digit added ("0 80312 34567 8"), a number whose middle reads
// as a dated day ("08/03/2023/456"), an ordinary number between the pieces
// ("08031234 and size 42 and 567"), one digit at a time with a word between every
// digit (a digit alone in the prose is never a piece), a lower-case name before a
// capitalised everyday top-level domain ("adeshop.Shop" — the shape of a missing
// space after a full stop), and an ordinary English word, or two letters, as the
// name before "at gmail".
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
  "〇": "0",
  "零": "0",
  "一": "1",
  "二": "2",
  "三": "3",
  "四": "4",
  "五": "5",
  "六": "6",
  "七": "7",
  "八": "8",
  "九": "9",
};

/**
 * Everything that renders as nothing: format characters (soft hyphen, zero-width
 * and bidi controls, tag characters), combining marks and variation selectors.
 * "0803<soft hyphen>1234567" reads as one number and must be screened as one.
 */
const INVISIBLE_RE = new RegExp("[\\p{Cf}\\p{Mn}\\p{Me}\\u115F\\u1160\\u3164\\uFFA0]", "gu");

/** Letters of other scripts that read as a Latin O / I, or as a digit. */
const CONFUSABLES: Record<string, string> = {
  "О": "O", // Cyrillic О
  "о": "o",
  "Ο": "O", // Greek Ο
  "ο": "o",
  "Ø": "O", // Ø
  "ø": "o",
  "І": "I", // Cyrillic І
  "Ӏ": "I", // palochka
  "Ι": "I", // Greek Ι
  "З": "3", // Cyrillic З
  "。": ".", // ideographic full stop
  "｡": ".", // halfwidth ideographic full stop
  "․": ".", // one dot leader
  "·": ".", // middle dot
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

// ---- Words the phone reader knows ----------------------------------------------

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
 * ("tree", "for"-like sounds), so they count only inside a number that is already
 * being read out, or at the head of three number words in a row — never alone.
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

/** Words that only join the pieces of a number being READ OUT in words: "…three THEN one two three…". */
const SPELLED_JOINERS = new Set([
  "then", "and", "plus", "dash", "space", "next", "comma", "den", "hyphen", "dot", "slash", "stroke",
]);

/** "whatsapp", "watsap", "wassap", "whtsapp", "whats-app" … one pattern instead of a list that is never complete. */
const WHATSAPP = String.raw`wh?a?t?s{1,2}[\s-]?a{1,2}p{1,2}`;
const WHATSAPP_WORD_RE = /^wh?a?t?s{1,2}a{1,2}p{1,2}$/;

/**
 * Words that say "this number is how you reach me". Verbs and channels only:
 * nouns like "phone", "number" and "line" sit next to ordinary numbers in every
 * second listing ("phone 2023 6000 128"), and "Imo" is a state before it is an app.
 * "Calls" is not one (VoLTE calls, HD voice calls), and "dial" only counts right
 * before the number ("dial 5550101") — it is the face of a watch everywhere else.
 */
const CUE_WORDS = new Set([
  "call", "tel", "telephone", "whatsapp", "whatsap", "watsapp", "watsap", "wassap", "whatapp",
  "wa", "telegram", "viber", "wechat", "sms", "dm",
]);

/**
 * Nouns that sit next to ordinary numbers in every second listing — too weak to
 * make any number a phone number, but enough to settle a number that already has
 * the mobile shape with its leading zero dropped ("number 8031234567"). After
 * "my" or "our" ("my number …") they are as strong as a verb.
 */
const SOFT_CUE_WORDS = new Set(["number", "phone", "mobile", "contact", "chat", "line", "cell", "digits", "hotline"]);
const POSSESSIVES = new Set(["my", "our"]);

/** Labels that say the number after them is not a phone number. Read BEFORE any cue word. */
const NOT_A_PHONE_LABELS = new Set([
  "isbn", "barcode", "upc", "ean", "gtin", "serial", "sn", "imei", "imei1", "imei2", "meid", "sku", "model", "part",
  "pn", "oem", "mpn", "asin", "code", "ref", "reference", "batch", "lot", "tracking", "waybill", "awb", "nafdac",
  "reg", "registration", "item", "article", "iuc", "smartcard", "meter", "vin", "chassis", "engine", "hs", "rc",
  "invoice", "receipt", "voucher", "ticket", "mfd", "mfg", "manufactured", "exp", "expiry", "expires", "dated",
]);
/** "Part NUMBER …", "Item NO. …", "Product ID …": the second word of a two-word label. */
const LABEL_TAILS = new Set(["no", "nr", "num", "number", "id", "code", "ref", "reference"]);
/** The first word of a two-word label. */
const LABEL_HEADS = new Set([
  "product", "item", "article", "engine", "chassis", "frame", "model", "part", "serial", "order", "invoice",
  "receipt", "tracking", "batch", "lot", "reg", "registration", "iuc", "smartcard", "meter", "catalogue", "catalog",
  "style", "stock", "unit", "policy", "ticket", "booking", "certificate", "licence", "license", "permit",
]);
/** Barcode and IMEI labels: their whole number may hold a mobile-shaped stretch by chance. */
const BARCODE_LABELS = new Set(["isbn", "barcode", "upc", "ean", "gtin"]);
const IMEI_LABELS = new Set(["imei", "imei1", "imei2", "meid"]);

/** Units: a number followed by one is a measurement, and a unit never joins two numbers. */
const UNIT_WORDS = new Set([
  "mm", "cm", "m", "km", "in", "inch", "inches", "ft", "feet", "foot", "kg", "g", "grams", "lb", "lbs", "l", "ml",
  "litre", "litres", "liter", "liters", "v", "w", "kw", "kva", "mah", "ah", "hz", "gb", "tb", "mb", "pcs", "pieces",
  "pc", "units", "cartons", "packs", "sqm", "sqft", "sq", "metres", "meters", "yards", "years", "yrs", "days",
  "months", "hours", "hrs", "mins", "minutes", "naira", "percent", "degrees", "psi", "rpm",
]);
/** "0800 x 1200": a dimension, not a number cut in two. */
const DIMENSION_WORDS = new Set(["x", "by", "times"]);

/** Words that place a piece of a number: "starts 0803", "0803 the start", "the rest 1234567". */
const FIRST_WORDS = new Set(["first", "start", "starts", "starting", "begin", "begins", "beginning"]);
const MIDDLE_WORDS = new Set(["middle", "second", "next", "then", "followed", "centre", "center"]);
const LAST_WORDS = new Set(["last", "end", "ends", "ending", "final", "finally", "rest", "remaining", "remainder", "third"]);
/** Words that put one piece straight after another: "01234 then 56789". */
const SEQUENCE_WORDS = new Set(["then", "next", "followed", "after"]);

/**
 * What may sit between the digit groups of one number: any short run that has no
 * letter and no digit in it. Sellers separate with whatever the filter does not
 * expect — an emoji, "#", a non-breaking hyphen, " | " — so the test is "is this
 * a word?", not "is this on a list?".
 */
const HAS_LETTER_OR_DIGIT_RE = new RegExp("[\\p{L}\\p{N}]", "u");
/** A line break ends a number: pieces on different lines (or fields) are joined only by the piece reader, as a reconstruction. */
function isSeparator(piece: string): boolean {
  return piece.length <= 12 && !piece.includes("\n") && !HAS_LETTER_OR_DIGIT_RE.test(piece);
}

// ---- Number shapes -------------------------------------------------------------

/** Nigerian mobile prefixes in use: 070x, 080x (from 0802), 081x, 090x, 091x. 0700/0800/0900 are not mobiles. */
const NG_PREFIX = String.raw`(?:70[1-9]|80[2-9]|81\d|90[1-9]|91\d)`;
const NG_LOCAL_RE = new RegExp(String.raw`^0${NG_PREFIX}\d{7}$`);
const NG_INTL_RE = new RegExp(String.raw`^(?:00)?234${NG_PREFIX}\d{7}$`);
const NG_NO_TRUNK_RE = new RegExp(String.raw`^${NG_PREFIX}\d{7}$`);
/** The opening digits of a mobile number: "080", "0803…", "234803…". */
const NG_HEAD_RE = new RegExp(String.raw`^(?:0[789][01]$|0${NG_PREFIX}|(?:00)?234${NG_PREFIX})`);
/** A clock time in hours and minutes ("0800", "1730", "2100"): opening hours, not a number. */
const TIME_LIKE_RE = /^(?:[01]\d|2[0-3])(?:00|15|30|45)$/;

function isNgMobile(digits: string): boolean {
  return NG_LOCAL_RE.test(digits) || NG_INTL_RE.test(digits);
}

/** "123456789", "2345678": a count, not a number. */
function isCountingSequence(digits: string): boolean {
  if (digits.length < 3) return false;
  const step = digits.charCodeAt(1) - digits.charCodeAt(0);
  if (step !== 1 && step !== -1) return false;
  for (let i = 2; i < digits.length; i += 1) {
    if (digits.charCodeAt(i) - digits.charCodeAt(i - 1) !== step) return false;
  }
  return true;
}

// ---- Tokens ----------------------------------------------------------------

interface Token {
  text: string;
  separator: boolean;
  /** Where the token starts in the text it was cut from. */
  at: number;
}

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const re = /[A-Za-z0-9|]+|[^A-Za-z0-9|]+/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const piece = match[0];
    tokens.push({ text: piece, separator: !/[A-Za-z0-9|]/.test(piece), at: match.index });
  }
  return tokens;
}

/**
 * The separator a person types between the groups of a number: spaces, or a
 * dash or a dot with spaces around it or not. Null for anything else — a slash,
 * an underscore, a bracket, an emoji, a run of dots, a line break.
 */
type SeparatorStyle = "space" | "dash" | "dot";
const PLAIN_SEPARATOR_RE = /^[ \t]{0,3}([-‐‑‒–—−.])?[ \t]{0,3}$/;
function separatorStyle(text: string): SeparatorStyle | null {
  if (text.length === 0) return null;
  const match = PLAIN_SEPARATOR_RE.exec(text);
  if (match === null) return null;
  if (match[1] === undefined) return "space";
  return match[1] === "." ? "dot" : "dash";
}

/** A currency sign right before a number makes it a price ("₦25,000", "$ 40"). */
const CURRENCY_BEFORE_RE = /[₦$£€]\s?$/;

/** Up to `count` words before `index`, nearest first. Stops at a line or sentence break. */
function wordsBefore(tokens: Token[], index: number, count: number): string[] {
  const words: string[] = [];
  for (let i = index - 1; i >= 0 && words.length < count; i -= 1) {
    if (tokens[i].separator) {
      if (/[\n;!?]/.test(tokens[i].text)) break;
      continue;
    }
    words.push(tokens[i].text.toLowerCase());
  }
  return words;
}

/** Up to `count` words from `index` on (inclusive), nearest first. Stops at a line or sentence break. */
function wordsFrom(tokens: Token[], index: number, count: number): string[] {
  const words: string[] = [];
  for (let i = index; i < tokens.length && words.length < count; i += 1) {
    if (tokens[i].separator) {
      if (/[\n;!?]/.test(tokens[i].text)) break;
      continue;
    }
    words.push(tokens[i].text.toLowerCase());
  }
  return words;
}

// ---- Look-alike digits -----------------------------------------------------------

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

/**
 * How many digit-by-digit tokens follow `index` (up to `need`): number words,
 * Pidgin digits, a lone "o", single digits. A longer number does not count:
 * "tree 150 180" is a Christmas tree in sizes, "double ₦45,000" a price.
 */
function digitWordsAhead(tokens: Token[], index: number, need: number): number {
  let count = 0;
  for (let i = index + 1; i < tokens.length && count < need; i += 1) {
    const token = tokens[i];
    if (token.separator) {
      if (!isSeparator(token.text)) break;
      continue;
    }
    const lower = token.text.toLowerCase();
    const like = digitLikeToken(token.text);
    if (
      NUMBER_WORDS[lower] !== undefined ||
      PIDGIN_NUMBER_WORDS[lower] !== undefined ||
      lower === "o" ||
      (like !== null && like.digits.length === 1)
    ) {
      count += 1;
    } else {
      break;
    }
  }
  return count;
}

/** The next token that is not a separator, lower-cased, if it starts with digits ("234…", "00…"). */
function nextGroupText(tokens: Token[], index: number): string {
  for (let i = index + 1; i < tokens.length && i <= index + 2; i += 1) {
    if (tokens[i].separator) continue;
    return /^\d/.test(tokens[i].text) ? tokens[i].text : "";
  }
  return "";
}

// ---- Phone runs --------------------------------------------------------------

interface PhoneRun {
  /** Digit groups in order, already de-obfuscated. */
  groups: string[];
  /** Per group: was it written to evade (letters for digits, a spelled-out digit)? */
  disguised: boolean[];
  /** Per group: was it a number word? */
  spelled: boolean[];
  /** Per group: written in plain ASCII digits (not a look-alike, a word or a multiplied digit). */
  plain: boolean[];
  /** Per pair of neighbouring groups: the plain separator between them, or null (an odd one, or skipped words). */
  gapStyles: Array<SeparatorStyle | null>;
  /** Per group: it opens a date ("08/11/2026", "2026-11-08"). No number is read from there. */
  dateStarts: boolean[];
  /** Written to evade: letters for digits, spelled-out digits, or one digit per token. */
  obfuscated: boolean;
  /** A leading "+" (or the word "plus"). */
  plus: boolean;
  /** A cue word ("call", "WhatsApp", "my number") sits right before or right after the run. */
  cued: boolean;
  /** A weaker noun ("number", "phone", "contact") sits next to the run. */
  softCued: boolean;
  /** What the word before the run says the number is. */
  label: "none" | "code" | "barcode" | "imei";
  /** The run's first token, and the token after its last. */
  start: number;
  end: number;
  /** The token of each group. */
  positions: number[];
  /** Its number words count up or down, with commas between them ("one, two, three, four"): a list, not a number. */
  countedList: boolean;
}

/** The run without its counted-out number words ("KET-2000 Two, three, four…" is "2000"). */
function withoutCountedWords(run: PhoneRun): PhoneRun {
  const keep = run.groups.map((_, index) => !run.spelled[index]);
  const pick = <T,>(values: T[]) => values.filter((_, index) => keep[index]);
  const disguised = pick(run.disguised);
  // A gap survives only between two groups that both stay and were neighbours.
  const gapStyles: Array<SeparatorStyle | null> = [];
  let previous = -1;
  for (let index = 0; index < run.groups.length; index += 1) {
    if (!keep[index]) continue;
    if (previous !== -1) gapStyles.push(index === previous + 1 ? run.gapStyles[previous] : null);
    previous = index;
  }
  return {
    ...run,
    groups: pick(run.groups),
    disguised,
    spelled: pick(run.spelled),
    plain: pick(run.plain),
    gapStyles,
    dateStarts: pick(run.dateStarts),
    positions: pick(run.positions),
    obfuscated: disguised.some(Boolean),
    countedList: false,
  };
}

/**
 * Is the number said to be a way to reach the seller? A cue counts only for a
 * number that could be a phone number: up to four groups ("1 202 555 0147"),
 * never a longer run ("4G bands 1/3/5/7/8/20/28") or a dotted reference
 * ("210.30.42.20.03.001, blue dial").
 */
function cueAround(
  tokens: Token[],
  start: number,
  end: number,
  groupCount: number,
  dotted: boolean,
): { cued: boolean; soft: boolean } {
  let cued = false;
  let soft = false;
  const before = wordsBefore(tokens, start, 4);
  for (let k = 0; k < before.length; k += 1) {
    const word = before[k];
    if (CUE_WORDS.has(word) || WHATSAPP_WORD_RE.test(word)) cued = true;
    if (k < 3 && SOFT_CUE_WORDS.has(word)) {
      soft = true;
      if (POSSESSIVES.has(before[k + 1] ?? "")) cued = true;
    }
  }
  // "dial 5550101", never "blue dial" before or after a number.
  if (before[0] === "dial") cued = true;
  for (const word of wordsFrom(tokens, end, 2)) {
    if (CUE_WORDS.has(word) || WHATSAPP_WORD_RE.test(word)) cued = true;
    if (SOFT_CUE_WORDS.has(word)) soft = true;
  }
  if (groupCount >= 5 || dotted) cued = false;
  return { cued, soft };
}

function labelBefore(tokens: Token[], start: number): PhoneRun["label"] {
  const [near, far] = wordsBefore(tokens, start, 2);
  let label: string | null = null;
  if (near !== undefined && NOT_A_PHONE_LABELS.has(near)) label = near;
  else if (near !== undefined && LABEL_TAILS.has(near) && far !== undefined && (NOT_A_PHONE_LABELS.has(far) || LABEL_HEADS.has(far))) {
    label = far;
  } else if (near !== undefined && /^(?:[a-z]|\d{1,2})$/.test(near) && far !== undefined && NOT_A_PHONE_LABELS.has(far)) {
    // A label with a suffix: "UPC-A", "EAN-13", "ISBN-10".
    label = far;
  }
  if (label === null) return "none";
  if (BARCODE_LABELS.has(label)) return "barcode";
  if (IMEI_LABELS.has(label)) return "imei";
  return "code";
}

/** Three groups that read as a date with a four-digit year: "08/11/2026", "11-08-2026", "2026.11.08". */
function looksLikeDate(a: string, b: string, c: string): boolean {
  const day = (value: string) => value.length <= 2 && Number(value) >= 1 && Number(value) <= 31;
  const month = (value: string) => value.length <= 2 && Number(value) >= 1 && Number(value) <= 12;
  const year = (value: string) => /^(?:19|20)\d{2}$/.test(value);
  return (year(c) && ((day(a) && month(b)) || (month(a) && day(b)))) || (year(a) && month(b) && day(c));
}

/** Does `next`, appended to the run, END a mobile number? Only windows ending at it are read (linear). */
function completesMobile(groups: string[], next: string): boolean {
  let joined = next;
  if (isNgMobile(joined)) return true;
  for (let k = groups.length - 1; k >= 0 && joined.length < 15; k -= 1) {
    joined = groups[k] + joined;
    if (isNgMobile(joined)) return true;
  }
  return false;
}

function collectPhoneRuns(tokens: Token[]): PhoneRun[] {
  const runs: PhoneRun[] = [];

  let groups: string[] = [];
  let disguised: boolean[] = [];
  let spelled: boolean[] = [];
  let plain: boolean[] = [];
  let positions: number[] = [];
  let obfuscated = false;
  let plus = false;
  let start = -1;
  let last = -1;
  let pendingMultiplier = 0;
  /** Groups in the current run that were written as words. */
  let wordGroups = 0;
  let commas = 0;

  const flush = () => {
    if (groups.length > 0) {
      const singles = groups.filter((group) => group.length === 1).length;
      // One digit per token ("0 8 0 3 1 2 …") is itself an evasion pattern.
      // Ten or more: a row of sizes or fractions ("1/2, 3/4, 1, 1 1/4") is shorter.
      const spelledOut = groups.length >= 10 && singles >= groups.length - 1;
      // Neighbouring groups with ONE separator token between them, and its kind.
      const gapStyles: Array<SeparatorStyle | null> = [];
      for (let k = 0; k + 1 < positions.length; k += 1) {
        const between = positions[k] + 1;
        gapStyles.push(positions[k + 1] === between + 1 && tokens[between].separator ? separatorStyle(tokens[between].text) : null);
      }
      const dotted = groups.length >= 3 && gapStyles.every((style) => style === "dot");
      // The groups on the run's first line: a field or line break ends what a cue word refers to.
      let lineGroups = 1;
      while (lineGroups < positions.length) {
        let broken = false;
        for (let t = positions[lineGroups - 1] + 1; t < positions[lineGroups]; t += 1) {
          if (tokens[t].text.includes("\n")) broken = true;
        }
        if (broken) break;
        lineGroups += 1;
      }
      // "Best before 08/11/2026": a date, written with one "/", "-" or "." twice.
      const dateStarts = groups.map(() => false);
      for (let k = 0; k + 2 < groups.length; k += 1) {
        if (!plain[k] || !plain[k + 1] || !plain[k + 2]) continue;
        if (positions[k + 1] !== positions[k] + 2 || positions[k + 2] !== positions[k + 1] + 2) continue;
        const first = tokens[positions[k] + 1].text;
        if (!/^[/.-]$/.test(first) || tokens[positions[k + 1] + 1].text !== first) continue;
        dateStarts[k] = looksLikeDate(groups[k], groups[k + 1], groups[k + 2]);
      }
      const cue = cueAround(tokens, start, last + 1, lineGroups, dotted);
      const words = groups.filter((_, index) => spelled[index]).join("");
      runs.push({
        groups,
        disguised: spelledOut ? groups.map(() => true) : disguised,
        spelled,
        plain: spelledOut ? groups.map(() => false) : plain,
        gapStyles,
        dateStarts,
        obfuscated: obfuscated || spelledOut,
        plus,
        cued: cue.cued,
        softCued: cue.soft,
        label: labelBefore(tokens, start),
        start,
        end: last + 1,
        positions,
        countedList: wordGroups >= 3 && commas >= wordGroups - 2 && isCountingSequence(words),
      });
    }
    groups = [];
    disguised = [];
    spelled = [];
    plain = [];
    positions = [];
    wordGroups = 0;
    commas = 0;
    obfuscated = false;
    plus = false;
    start = -1;
    last = -1;
    pendingMultiplier = 0;
  };

  /** The run so far ends with a digit read out on its own (a number word or a single digit). */
  const endsDigitByDigit = () => groups.length > 0 && (spelled[groups.length - 1] || groups[groups.length - 1].length === 1);

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];

    // A bare "|" between groups is a divider, not a digit.
    if (token.separator || /^\|+$/.test(token.text)) {
      if (groups.length === 0) {
        if (/\+\s*$/.test(token.text)) plus = true;
        continue;
      }
      if (!isSeparator(token.text)) {
        flush();
      } else if (/\+\s*$/.test(token.text)) {
        // "KET-2000 +44 7911 123456": a "+" starts an international number.
        flush();
        plus = true;
      } else if (token.text.includes(",")) {
        commas += 1;
      }
      continue;
    }

    const lower = token.text.toLowerCase();

    // "plus" read as "+" only in front of a number read out digit by digit or a
    // country code ("plus two three four…", "plus 234…"); "Galaxy S21 Plus 128/256" is a model.
    if (lower === "plus" && groups.length === 0) {
      if (digitWordsAhead(tokens, i, 1) >= 1 || /^(?:234|00)/.test(nextGroupText(tokens, i))) {
        plus = true;
        obfuscated = true;
      }
      continue;
    }

    // "double"/"triple" multiply ONE digit ("double one"); before a price it is a word ("double ₦45,000").
    if (MULTIPLIER_WORDS[lower] !== undefined) {
      if (digitWordsAhead(tokens, i, 1) >= 1) {
        pendingMultiplier = MULTIPLIER_WORDS[lower];
      } else {
        flush();
      }
      continue;
    }

    // A joining word inside a number that is being read out in words.
    if (SPELLED_JOINERS.has(lower) && wordGroups >= 2) continue;

    let word: string | undefined = NUMBER_WORDS[lower];
    // A Pidgin digit only beside other digits read out one by one ("0803 wan tu tree…",
    // "zero eit zero tree"), never before a longer number ("Christmas tree 150 180 210 cm").
    if (word === undefined && PIDGIN_NUMBER_WORDS[lower] !== undefined) {
      const ahead = digitWordsAhead(tokens, i, 2);
      if (endsDigitByDigit() || (groups.length > 0 && ahead >= 1) || ahead >= 2) word = PIDGIN_NUMBER_WORDS[lower];
    }
    // A lone letter o is a zero only beside digits read out one by one ("o-eight-o-tree");
    // the Pidgin particle after a price is not ("25,000 o, 30,000 for two").
    if (word === undefined && lower === "o" && (endsDigitByDigit() || digitWordsAhead(tokens, i, 1) >= 1)) word = "0";
    const like = word === undefined ? digitLikeToken(token.text) : null;

    if (word === undefined && like === null) {
      // Number words glued together or onto digits are a number written to evade.
      const glued = gluedNumberDigits(token.text);
      if (glued !== null) {
        if (start === -1) start = i;
        last = i;
        obfuscated = true;
        groups.push(glued);
        disguised.push(true);
        spelled.push(false);
        plain.push(false);
        positions.push(i);
        pendingMultiplier = 0;
        continue;
      }
      // A short group written with a weak look-alike ("S67") counts only when it
      // completes a mobile number with the groups before it.
      const weak = groups.length > 0 ? weakLookalikeDigits(token.text) : null;
      if (weak !== null && completesMobile(groups, weak)) {
        last = i;
        obfuscated = true;
        groups.push(weak);
        disguised.push(true);
        spelled.push(false);
        plain.push(false);
        positions.push(i);
        continue;
      }
      flush();
      continue;
    }

    const numeric = word ?? (like as { digits: string }).digits;
    if (start === -1) start = i;
    last = i;
    const evasive = word !== undefined || Boolean(like && like.disguised) || pendingMultiplier > 0;
    if (evasive) obfuscated = true;
    groups.push(pendingMultiplier > 0 && numeric.length === 1 ? numeric.repeat(pendingMultiplier) : numeric);
    disguised.push(evasive);
    spelled.push(word !== undefined);
    plain.push(!evasive && /^\d+$/.test(token.text));
    positions.push(i);
    if (word !== undefined) wordGroups += 1;
    pendingMultiplier = 0;
  }
  flush();

  return runs;
}

/** Does any window of consecutive groups spell a Nigerian mobile number? Linear: a window stops at 15 digits. */
function containsNigerianMobile(groups: string[], dateStarts?: ReadonlyArray<boolean>): boolean {
  for (let start = 0; start < groups.length; start += 1) {
    // A mobile number opens with 0, 234 or 00234 — never with a date ("08/11/2026, 500 g").
    const head = groups[start].charCodeAt(0);
    if ((head !== 48 && head !== 50) || dateStarts?.[start]) continue;
    // "0815-1700, 365": two clock times in a row open a range of hours, not a number.
    if (TIME_LIKE_RE.test(groups[start]) && start + 1 < groups.length && TIME_LIKE_RE.test(groups[start + 1])) continue;
    let joined = "";
    for (let end = start; end < groups.length && joined.length < 15; end += 1) {
      joined += groups[end];
      const n = joined.length;
      if ((n === 11 || n === 13 || n === 15) && isNgMobile(joined)) return true;
    }
  }
  return false;
}

/**
 * Does the run hold a Nigerian mobile number in its LITERAL, standard form: plain
 * digits, in one block or in up to four groups (five with a separate country
 * code) with one kind of plain separator between them — "08031234567",
 * "0803 123 4567", "0803-123-4567", "+234 803 123 4567". Anything else that
 * rebuilds into a mobile number (look-alike letters, words, odd separators,
 * mixed separators, one digit per group) is a reconstruction: a person looks.
 */
function literalNigerianMobile(run: PhoneRun, noStart: ReadonlyArray<boolean>): boolean {
  const { groups } = run;
  for (let start = 0; start < groups.length; start += 1) {
    if (!run.plain[start] || noStart[start]) continue;
    const head = groups[start].charCodeAt(0);
    if (head !== 48 && head !== 50) continue;
    if (TIME_LIKE_RE.test(groups[start]) && start + 1 < groups.length && TIME_LIKE_RE.test(groups[start + 1])) continue;
    let joined = "";
    let style: SeparatorStyle | null = null;
    for (let end = start; end < groups.length && end < start + 5; end += 1) {
      if (!run.plain[end]) break;
      if (end > start) {
        const gap = run.gapStyles[end - 1];
        if (gap === null || (style !== null && gap !== style)) break;
        style = gap;
      }
      joined += groups[end];
      if (joined.length > 15) break;
      const count = end - start + 1;
      if (count <= 4 && NG_LOCAL_RE.test(joined)) return true;
      if (count <= 5 && NG_INTL_RE.test(joined)) return true;
    }
  }
  return false;
}

/**
 * Barcodes printed the way barcodes are, with no label: UPC-A "0 70330 60301 6"
 * (1+5+5+1) or EAN-13 "5 901234 123457" (1+6+6), anywhere in a run ("KET-2000
 * 0 70330 60301 6"). Their middle may spell a mobile number by chance ("0 7033…"):
 * no number is read from inside one. Per group: does it sit in such a barcode?
 */
function barcodeGroups(run: PhoneRun): boolean[] {
  const inside = run.groups.map(() => false);
  for (const shape of [[1, 5, 5, 1], [1, 6, 6]]) {
    for (let start = 0; start + shape.length <= run.groups.length; start += 1) {
      const end = start + shape.length;
      const style = run.gapStyles[start];
      if (style !== "space" && style !== "dash") continue;
      let fits = true;
      for (let k = 0; k < shape.length && fits; k += 1) {
        fits = run.plain[start + k] && run.groups[start + k].length === shape[k] && (k === 0 || run.gapStyles[start + k - 1] === style);
      }
      // A barcode stands on its own: the same separator does not carry on into more digits.
      if (fits && end < run.groups.length && run.gapStyles[end - 1] === style) fits = false;
      if (fits) for (let k = start; k < end; k += 1) inside[k] = true;
    }
  }
  return inside;
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
 * Does the run hold a Nigerian mobile number with its trunk zero dropped?
 *
 *   "phone"  written the way a mobile number is — one ten-digit block, or
 *            "803 123 4567" — anywhere in the run;
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

function phoneHit(confidence: ContactConfidence, evidence: string): ContactHit {
  return { kind: "phone", confidence, evidence };
}

function classifyPhoneRun(input: PhoneRun): ContactHit | null {
  // Number words counted out with commas ("one, two, three, four, five, six, seven")
  // are a list: only what is left beside them is read — unless a mobile prefix sits
  // beside them ("0803, one, two, three…").
  const counted = input.countedList && !input.groups.some((group, index) => !input.spelled[index] && NG_HEAD_RE.test(group));
  const run = counted ? withoutCountedWords(input) : input;
  const digits = run.groups.join("");
  const n = digits.length;
  if (n < 7) return null;
  // No number starts inside a date or an unlabelled barcode ("08/11/2026", "0 70330 60301 6").
  const barcode = barcodeGroups(run);
  const noStart = run.dateStarts.map((date, index) => date || barcode[index]);
  // Refused only when written the standard way; rebuilt from a disguise, a person looks.
  const literal = literalNigerianMobile(run, isNgMobile(digits) ? run.dateStarts : noStart);
  const rebuilt = run.obfuscated ? "ng_mobile_obfuscated" : "ng_mobile_reconstructed";

  // A label says what the number is ("IMEI", "part number", "barcode") and is read
  // BEFORE any cue word: a labelled number is not a phone number unless the whole
  // of it is one anyway.
  if (run.label !== "none") {
    if (isNgMobile(digits)) return literal ? phoneHit("high", "ng_mobile") : phoneHit("medium", rebuilt);
    if (run.label === "barcode" && n >= 10 && n <= 13) return null;
    if (run.label === "imei" && n >= 14 && n <= 17) return null;
    // A mobile number inside a longer labelled code ("ref 0803 123 4567 9"): a person looks.
    return containsNigerianMobile(run.groups, noStart) ? phoneHit("medium", "ng_mobile_in_code") : null;
  }

  if (literal) return phoneHit("high", "ng_mobile");
  if (containsNigerianMobile(run.groups, noStart)) return phoneHit("medium", rebuilt);

  // A number someone took the trouble to disguise is a contact attempt — also when
  // it sits in a longer run of digits (a SKU or a size next to it does not hide it).
  if (run.obfuscated && hasDisguisedWindow(run)) return phoneHit("medium", "obfuscated_digits");

  // International dialling written with 00 ("0044 7911 123456"), wherever it starts in the run:
  // a short "00…" group, or the whole run.
  for (let index = 0; index < run.groups.length; index += 1) {
    const group = run.groups[index];
    if (!/^00[1-9]/.test(group) || (group.length > 6 && run.groups.length > 1)) continue;
    let joined = "";
    for (let end = index; end < run.groups.length && joined.length < 15; end += 1) {
      joined += run.groups[end];
      if (/^00[1-9]\d{8,12}$/.test(joined)) return phoneHit("medium", "international_00");
    }
  }
  if (n > 16) return null;

  if (run.plus && n >= 10 && n <= 15) return phoneHit("medium", "international_plus");

  const noTrunk = noTrunkShape(run);
  if (noTrunk === "phone") {
    // Ten digits with the mobile prefix but no trunk zero: the shape of a phone
    // number (and of an account number), said to be one or not. A person looks.
    return phoneHit("medium", run.cued || run.softCued ? "ng_mobile_no_trunk" : "ng_mobile_no_trunk_unlabelled");
  }
  if (noTrunk === "loose") {
    // Grouped like a part number ("90915-10003"): only a call to action makes it
    // worth a look. A noun ("part number") never does.
    return run.cued ? phoneHit("medium", "ng_mobile_no_trunk") : phoneHit("low", "ng_mobile_no_trunk_uncued");
  }

  if (run.cued && n <= 15) return phoneHit("medium", "cued_number");

  // A trunk-zero number called a line or a phone ("UK line 07911 123456").
  if (run.softCued && /^0[1-9]\d{8,11}$/.test(digits)) return phoneHit("medium", "cued_trunk_number");

  // Ten digits in one block is the shape of a bank account number (and of a mobile
  // number without its zero). Unless a label says what it is, a person looks.
  if (run.groups.some((group) => group.length === 10)) return phoneHit("medium", "ten_digit_number");

  if (run.obfuscated) return phoneHit("medium", "obfuscated_short");

  // Plain digit groups with nothing saying "call": sizes, prices, barcodes.
  return null;
}

// ---- A number in pieces ----------------------------------------------------------

/** How far apart two pieces of one number may be: "0803 (that's my MTN line, no spaces) 123…". */
const PIECE_GAP_CHARS = 60;

/**
 * What lies between two runs, read for joining them into one number: null when
 * it is too long, or when a unit follows the first piece ("0803 mm by 1234 mm" is
 * a size). Otherwise anything at all — words, asides, a row of dots, a line break.
 */
function gapBetween(tokens: Token[], from: number, to: number): { dimension: boolean } | null {
  if (from >= to || to >= tokens.length) return null;
  if (tokens[to].at - tokens[from].at > PIECE_GAP_CHARS) return null;
  let dimension = false;
  let first = true;
  for (let i = from; i < to; i += 1) {
    const token = tokens[i];
    if (token.separator) continue;
    const lower = token.text.toLowerCase();
    if (first && UNIT_WORDS.has(lower)) return null;
    first = false;
    if (DIMENSION_WORDS.has(lower)) dimension = true;
  }
  return { dimension };
}

/**
 * A mobile number in pieces with anything between them, once a piece opens with a
 * mobile prefix: "0803 na 123 na 4567", "Call 0803 (that's MTN), then 123, then
 * 4567", "0803 . . . . . . . 123 . . . . . . . 4567", "zero eight zero three (my
 * MTN line) one two three…". The next pieces are taken within 60 characters of
 * each other. Opening hours and dimensions never join ("0800 to 1800", "080 x
 * 1200 x 2100 mm"). Always a reconstruction: a person looks.
 */
function joinsAcrossWords(runs: PhoneRun[], tokens: Token[]): boolean {
  // Extend `joined` with the opening groups of run k (and, when all of run k is
  // used, with run k + 1). Pieces are taken by digits, not whole runs: the end of
  // a run may belong to the next field ("…4567\n2-4 days"). A digit standing on
  // its own in the prose ("the MTN one", "a two litre kettle", "4 burners") is
  // never a piece: it is passed over, inside the gap. A chain stops at 13 digits
  // or 60 characters from the last piece: linear.
  const extend = (joined: string, headToken: number, previousEnd: number, k: number, depth: number, dimension: boolean): boolean => {
    if (k >= runs.length || depth > 24) return false;
    const run = runs[k];
    const gap = gapBetween(tokens, previousEnd, run.start);
    if (gap === null || TIME_LIKE_RE.test(run.groups[0])) return false;
    if (run.groups.length === 1 && run.groups[0].length === 1) return extend(joined, headToken, previousEnd, k + 1, depth + 1, dimension);
    const across = dimension || gap.dimension;
    let digits = joined;
    for (let p = 0; p < run.groups.length; p += 1) {
      digits += run.groups[p];
      if (digits.length > 13) break;
      if (isNgMobile(digits)) {
        if (across) {
          // "080 x 3100 x 2150 mm" is a frame size.
          const [after] = wordsFrom(tokens, run.positions[p] + 1, 1);
          const [before] = wordsBefore(tokens, headToken, 1);
          if ((after !== undefined && (UNIT_WORDS.has(after) || DIMENSION_WORDS.has(after))) || (before !== undefined && DIMENSION_WORDS.has(before))) {
            return false;
          }
        }
        return true;
      }
      if (p === run.groups.length - 1 && extend(digits, headToken, run.end, k + 1, depth + 1, across)) return true;
    }
    return false;
  };
  for (let i = 0; i + 1 < runs.length; i += 1) {
    const { groups, positions, dateStarts } = runs[i];
    // The head is the closing groups of the run ("KET-2000 0803 na 123…" opens at 0803):
    // up to three groups, or four digits read out one by one ("zero eight zero three").
    // A list ("Sizes 08 10 12 14 16") is not the start of a number.
    let head = "";
    for (let s = groups.length - 1; s >= 0; s -= 1) {
      head = groups[s] + head;
      if (head.length > 10) break;
      // A date is not the start of a number ("Best before 08/11/2026, 500 g").
      if (dateStarts[s]) break;
      const count = groups.length - s;
      if (count > 4 || (count === 4 && head.length > 4)) break;
      if (head.length < 3 || !NG_HEAD_RE.test(head)) continue;
      if (s === groups.length - 1 && TIME_LIKE_RE.test(head)) continue;
      if (extend(head, positions[s], runs[i].end, i + 1, 1, false)) return true;
    }
  }
  return false;
}

/** 0 = first piece, 1 = middle, 2 = last, -1 = an unplaced piece that opens with a mobile prefix. */
interface Piece {
  kind: -1 | 0 | 1 | 2;
  digits: string;
  at: number;
}

interface PlacedPieces {
  pieces: Piece[];
  /** "01234 then 56789": two pieces read one after the other. */
  sequences: Array<[string, string]>;
}

/**
 * Pieces of a number placed by words: "starts 0803, middle 123, ends 4567",
 * "4567 is the end, 0803 the start, 123 the middle", "first 5 digits 01234, last
 * 5 digits 56789". A placing word belongs to the nearest number of three or more
 * digits in its own clause (after it first, then before it). Linear.
 */
function placePieces(tokens: Token[]): PlacedPieces {
  const pieces: Piece[] = [];
  const sequences: Array<[string, string]> = [];
  let clause: Array<{ at: number; word: string | null; digits: string | null }> = [];

  const close = () => {
    const placed = new Set<number>();
    for (let k = 0; k < clause.length; k += 1) {
      const word = clause[k].word;
      if (word === null) continue;
      const kind = FIRST_WORDS.has(word) ? 0 : MIDDLE_WORDS.has(word) ? 1 : LAST_WORDS.has(word) ? 2 : -1;
      const sequence = SEQUENCE_WORDS.has(word);
      if (kind === -1 && !sequence) continue;
      let after = -1;
      for (let j = k + 1; j < clause.length && j <= k + 3; j += 1) {
        const digits = clause[j].digits;
        if (digits !== null && digits.length >= 3) {
          after = j;
          break;
        }
      }
      let before = -1;
      for (let j = k - 1; j >= 0 && j >= k - 2; j -= 1) {
        const digits = clause[j].digits;
        if (digits !== null && digits.length >= 3) {
          before = j;
          break;
        }
      }
      if (sequence && after !== -1 && before !== -1) {
        sequences.push([clause[before].digits as string, clause[after].digits as string]);
      }
      if (kind === -1) continue;
      const target = after !== -1 ? after : k >= 1 ? findBack(k) : -1;
      if (target === -1 || placed.has(target)) continue;
      placed.add(target);
      pieces.push({ kind: kind as 0 | 1 | 2, digits: clause[target].digits as string, at: clause[target].at });
    }
    for (let j = 0; j < clause.length; j += 1) {
      const digits = clause[j].digits;
      if (digits !== null && !placed.has(j) && digits.length >= 4 && digits.length < 11 && NG_HEAD_RE.test(digits)) {
        pieces.push({ kind: -1, digits, at: clause[j].at });
      }
    }
    clause = [];
  };

  function findBack(k: number): number {
    for (let j = k - 1; j >= 0 && j >= k - 3; j -= 1) {
      const digits = clause[j].digits;
      if (digits !== null && digits.length >= 3) return j;
    }
    return -1;
  }

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token.separator) {
      // A comma or full stop followed by a space, or a line break, ends a clause;
      // the dots and commas inside a number ("0803.123", "0123,456") do not.
      if (/[\n;!?]|[.,](?:\s|$)/.test(token.text)) close();
      continue;
    }
    const like = digitLikeToken(token.text);
    // A price is never a piece of a number ("₦25000 then ₦30000 for the bigger size").
    const price = like !== null && i > 0 && tokens[i - 1].separator && CURRENCY_BEFORE_RE.test(tokens[i - 1].text);
    clause.push({ at: i, word: like ? null : token.text.toLowerCase(), digits: like && !price ? like.digits : null });
    if (clause.length >= 64) close();
  }
  close();
  pieces.sort((a, b) => a.at - b.at);
  return { pieces, sequences };
}

const PIECE_RANK: Record<Piece["kind"], number> = { [-1]: 0, 0: 0, 1: 1, 2: 2 };

/** Do placed pieces, put in the order their words give, make a number `accept` takes? */
function piecesMake(pieces: Piece[], accept: (digits: string) => boolean, explicitFirst: boolean): boolean {
  const ordered = (list: Piece[]) => [...list].sort((a, b) => PIECE_RANK[a.kind] - PIECE_RANK[b.kind]);
  const valid = (list: Piece[]) => {
    const ranks = list.map((piece) => PIECE_RANK[piece.kind]);
    if (new Set(ranks).size !== ranks.length || !ranks.includes(0)) return false;
    if (!list.some((piece) => piece.kind >= 0)) return false;
    if (explicitFirst && !list.some((piece) => piece.kind === 0)) return false;
    return true;
  };
  // Only a window that holds a piece placed by a word can make a number.
  const placed: number[] = [0];
  for (const piece of pieces) placed.push(placed[placed.length - 1] + (piece.kind >= 0 ? 1 : 0));
  for (let j = 1; j < pieces.length; j += 1) {
    if (placed[j + 1] === placed[Math.max(0, j - 5)]) continue;
    for (let i = Math.max(0, j - 5); i < j; i += 1) {
      const pair = [pieces[i], pieces[j]];
      if (valid(pair) && accept(ordered(pair).map((piece) => piece.digits).join(""))) return true;
      for (let m = i + 1; m < j; m += 1) {
        const triple = [pieces[i], pieces[m], pieces[j]];
        if (valid(triple) && accept(ordered(triple).map((piece) => piece.digits).join(""))) return true;
      }
    }
  }
  return false;
}

/**
 * A mobile number cut in two and placed in different sentences or fields:
 * "…code 0803. … batch 1234567", or the first half in the URL handle and the rest
 * in the title. Looks at the free-standing digit groups of the whole text and
 * accepts only the unmistakable case: a group that opens with a mobile prefix (not
 * a clock time), completed to exactly eleven digits by ONE other group. How far
 * away the other piece may sit depends on how unmistakable it is: six or seven
 * missing digits can be anywhere (the URL handle is read last, the title first),
 * five a few numbers away, four or fewer only next to it. Linear.
 */
function hasSplitNigerianMobile(text: string): boolean {
  const groups: string[] = [];
  const re = /(?<![A-Za-z0-9])\d+(?![A-Za-z0-9])/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) groups.push(match[0]);
  const positions = new Map<number, number[]>();
  for (let i = 0; i < groups.length; i += 1) {
    const list = positions.get(groups[i].length);
    if (list) list.push(i);
    else positions.set(groups[i].length, [i]);
  }
  for (let i = 0; i < groups.length; i += 1) {
    const first = groups[i];
    if (first.length < 4 || first.length > 8 || TIME_LIKE_RE.test(first) || !NG_HEAD_RE.test(first) || first.startsWith("2")) continue;
    const missing = 11 - first.length;
    const list = positions.get(missing);
    if (!list) continue;
    if (missing >= 6) return true;
    const reach = missing === 5 ? 6 : missing === 4 ? 3 : 1;
    // Nearest other group of that length (binary search).
    let lo = 0;
    let hi = list.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (list[mid] < i) lo = mid + 1;
      else hi = mid;
    }
    for (const candidate of [list[lo - 1], list[lo], list[lo + 1]]) {
      if (candidate !== undefined && candidate !== i && Math.abs(candidate - i) <= reach) return true;
    }
  }
  return false;
}

// ---- Account numbers (read by the listing ruleset) --------------------------------

export interface TenDigitNumber {
  /** Where the number sits in the folded text returned beside it. */
  start: number;
  end: number;
  /**
   * Written the standard way: plain digits in one block, or in up to three groups
   * with one kind of plain separator ("0123456789", "0123 456 789",
   * "01234-56789"). Anything else is loose — four or more groups, an odd
   * separator ("0123/456/789", "(0123) 456789"), look-alike digits, two halves
   * joined by a word ("01573 and 92846").
   */
  standard: boolean;
}

/** A digit group, with look-alike letters inside a number ("o123") read as digits. */
const DIGIT_GROUP_RE = /(?<![A-Za-z0-9])(?=[0-9oOlI]{0,23}\d)[0-9oOlI]{1,24}(?![A-Za-z0-9])/g;
/** A price written with thousands commas: "10,000", "1,250,000" (never "0123,456,789"). */
const THOUSANDS_RE = /(?<![\d,])[1-9]\d{0,2}(?:,\d{3})+(?!\d|,\d)/g;
/** Between two groups of one number: a short run with no letter, digit, line break or currency sign that does not end a clause. */
const GROUP_GAP_RE = /^(?!.*[,.;:!?]\s)[^A-Za-z0-9\n₦$£€]{1,3}$/;
/** Two halves joined by a word or a sign: "01573 and 92846", "01573, 92846", "01234 then 56789". */
const HALVES_GAP_RE = /^\s{0,3}(?:[,&+]|and|then|plus|next|followed\s{1,3}by)\s{0,3}$/i;

/**
 * The ten-digit numbers (bank account numbers) in the text as a reader sees it,
 * each marked standard or loose. Prices and lists are never one: a group behind a
 * currency sign or in thousands commas ("₦10,000-₦15,000", "10,000-15,000"), two
 * round amounts ("15000-25000"), a list that counts up ("36 37 38 39 40"). Linear.
 */
export function findTenDigitNumbers(input: string): { text: string; numbers: TenDigitNumber[] } {
  const text = foldForScreening(String(input ?? ""));
  const prices: Array<[number, number]> = [];
  THOUSANDS_RE.lastIndex = 0;
  let found: RegExpExecArray | null;
  while ((found = THOUSANDS_RE.exec(text)) !== null) {
    const start = found.index;
    const end = start + found[0].length;
    // Ten digits in thousands commas with no currency beside them ("Acct: 2,034,567,891") are not a price.
    const tenDigits = found[0].replace(/,/g, "").length === 10;
    const currency = CURRENCY_BEFORE_RE.test(text.slice(Math.max(0, start - 2), start)) || /^\s?(?:naira|ngn)\b/i.test(text.slice(end, end + 7));
    if (!tenDigits || currency) prices.push([start, end]);
  }

  interface Group {
    digits: string;
    start: number;
    end: number;
    plain: boolean;
    price: boolean;
  }
  const groups: Group[] = [];
  let priceIndex = 0;
  DIGIT_GROUP_RE.lastIndex = 0;
  while ((found = DIGIT_GROUP_RE.exec(text)) !== null) {
    const like = digitLikeToken(found[0]);
    if (like === null) continue;
    const start = found.index;
    const end = start + found[0].length;
    while (priceIndex < prices.length && prices[priceIndex][1] <= start) priceIndex += 1;
    const inThousands = priceIndex < prices.length && prices[priceIndex][0] <= start;
    const price =
      inThousands ||
      CURRENCY_BEFORE_RE.test(text.slice(Math.max(0, start - 2), start)) ||
      /^\s?(?:naira|ngn)\b/i.test(text.slice(end, end + 7));
    groups.push({ digits: like.digits, start, end, plain: !like.disguised && /^\d+$/.test(found[0]), price });
  }

  const numbers: TenDigitNumber[] = [];
  /** For each group, the first group of its run. */
  const runOf: number[] = [];
  const runSize = new Map<number, number>();
  const linked = (i: number) =>
    !groups[i].price &&
    !groups[i - 1].price &&
    groups[i].start - groups[i - 1].end <= 3 &&
    GROUP_GAP_RE.test(text.slice(groups[i - 1].end, groups[i].start));

  const evaluate = (first: number, last: number) => {
    const size = last - first + 1;
    let digits = "";
    for (let k = first; k <= last && digits.length <= 10; k += 1) digits += groups[k].digits;
    if (size > 10 || groups[first].price || digits.length !== 10) {
      if (size > 1) {
        // Ten digits in one block are one number, whatever stands beside them ("KET-2000 0123456789").
        for (let k = first; k <= last; k += 1) {
          const group = groups[k];
          if (group.plain && !group.price && group.digits.length === 10) numbers.push({ start: group.start, end: group.end, standard: true });
        }
        // So is a standard number opening or closing a longer run ("KET-2000 0123 456 789 GTB").
        if (size <= 12 && !groups[first].price) {
          for (const [a, b] of [[first, first + 1], [first, first + 2], [last - 1, last], [last - 2, last]]) {
            if (a < first || b > last || a >= b) continue;
            let window = "";
            let plain = true;
            for (let k = a; k <= b; k += 1) {
              window += groups[k].digits;
              plain = plain && groups[k].plain;
            }
            if (!plain || window.length !== 10) continue;
            if (b - a === 1 && /00$/.test(groups[a].digits) && /00$/.test(groups[b].digits)) continue;
            // Spaces or dashes: a dotted stretch of a longer run is a reference ("03.3100.3600/69").
            const styles: Array<SeparatorStyle | null> = [];
            for (let k = a + 1; k <= b; k += 1) styles.push(separatorStyle(text.slice(groups[k - 1].end, groups[k].start)));
            if (styles.every((style) => style !== null && style !== "dot" && style === styles[0])) {
              numbers.push({ start: groups[a].start, end: groups[b].end, standard: true });
            }
          }
        }
      }
      return;
    }
    const run = groups.slice(first, last + 1);
    // Two round amounts are a price range ("15000-25000"); a list counting up is sizes ("36 37 38 39 40").
    if (size === 2 && run.every((group) => /00$/.test(group.digits))) return;
    if (
      size >= 4 &&
      run.every((group) => group.digits.length === run[0].digits.length) &&
      run.every((group, k) => k === 0 || Number(group.digits) > Number(run[k - 1].digits))
    ) {
      return;
    }
    const styles: Array<SeparatorStyle | null> = [];
    for (let k = 1; k < run.length; k += 1) styles.push(separatorStyle(text.slice(run[k - 1].end, run[k].start)));
    const standard =
      size <= 3 && run.every((group) => group.plain) && styles.every((style) => style !== null && style === styles[0]);
    numbers.push({ start: run[0].start, end: run[run.length - 1].end, standard });
  };

  let first = 0;
  for (let i = 0; i <= groups.length; i += 1) {
    if (i < groups.length && i > 0 && linked(i)) {
      runOf.push(first);
      continue;
    }
    if (i > 0) {
      evaluate(first, i - 1);
      runSize.set(first, i - first);
    }
    first = i;
    if (i < groups.length) runOf.push(i);
  }

  // Two single groups joined by a word: "GTB: 01573 and 92846", "Account: 01573, 92846".
  for (let i = 1; i < groups.length; i += 1) {
    const a = groups[i - 1];
    const b = groups[i];
    if (runOf[i - 1] !== i - 1 || runOf[i] !== i || runSize.get(i - 1) !== 1 || runSize.get(i) !== 1) continue;
    if (a.price || b.price || a.digits.length + b.digits.length !== 10) continue;
    if (a.digits.length < 3 || b.digits.length < 3 || /000$/.test(a.digits) || /000$/.test(b.digits)) continue;
    if (b.start - a.end > 16 || !HALVES_GAP_RE.test(text.slice(a.end, b.start))) continue;
    numbers.push({ start: a.start, end: b.end, standard: false });
  }
  numbers.sort((x, y) => x.start - y.start);
  return { text, numbers };
}

/**
 * Ten digits written in placed pieces ("first 5 digits 01234, last 5 digits
 * 56789", "ends with 56789, starts with 01234") or one after the other ("01234
 * then 56789"): an account number given in halves. Always a reconstruction. A
 * round amount is a price, not a half ("₦25000 then ₦30000").
 */
export function hasSplitTenDigitNumber(input: string): boolean {
  const tokens = tokenize(foldForScreening(String(input ?? "")));
  const { pieces, sequences } = placePieces(tokens);
  const round = (digits: string) => /000$/.test(digits);
  if (sequences.some(([a, b]) => a.length + b.length === 10 && !round(a) && !round(b))) return true;
  return piecesMake(
    pieces.filter((piece) => !round(piece.digits)),
    (digits) => digits.length === 10,
    true,
  );
}

// ---- Email -----------------------------------------------------------------

// An address has at most 64 characters before the @.
const EMAIL_RE = /[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9-]{1,63}(?:\.[a-zA-Z0-9-]{1,63}){0,4}\.[a-zA-Z]{2,24}/;
/** "name @ shop.com", "name@ shop.com": an @ with a space beside it, and a domain. */
const SPACED_AT_EMAIL_RE =
  /[a-z0-9._%+-]{2,64}(?:\s{1,2}@\s{0,2}|@\s{1,2})[a-z0-9-]{2,63}(?:\.[a-z0-9-]{2,63}){0,3}\.[a-z]{2,24}\b/i;

/** Top-level domains a reader knows as the end of an address. */
const KNOWN_TLDS = String.raw`com\.ng|org\.ng|gov\.ng|edu\.ng|co\.uk|co\.za|com|net|org|ng|io|co|me|info|biz|xyz|africa|store|shop|online|site|app|link|live|tech|top|club|uk|za|gh|ke|us|ca|de|fr`;
const SPELLED_TLDS = "com|net|org|ng|co|io|me|info|biz|africa|xyz";
const WEBMAIL = "gmail|g-mail|googlemail|yahoo|ymail|hotmail|outlook|icloud|protonmail|proton|yandex|aol|gmx|zoho";
const DOT_SPELLED = String.raw`(?:\(\s{0,3}dot\s{0,3}\)|\[\s{0,3}dot\s{0,3}\]|\{\s{0,3}dot\s{0,3}\}|<\s{0,3}dot\s{0,3}>|\s{1,3}dot\s{1,3})`;
const AT_BRACKETED = String.raw`(?:\(\s{0,3}(?:at|@)\s{0,3}\)|\[\s{0,3}(?:at|@)\s{0,3}\]|\{\s{0,3}(?:at|@)\s{0,3}\}|<\s{0,3}(?:at|@)\s{0,3}>)`;
const LOCAL_PART = String.raw`[a-z0-9][a-z0-9._%+-]{1,40}`;
/** "name at gmail", "name at g-mail", "name at outlook": a mailbox provider. */
const WEBMAIL_SURE = String.raw`gmail|g[\s-]?mail|googlemail|yahoo|ymail|hotmail|outlook|icloud|protonmail|yandex|aol|gmx|zoho`;

/**
 * "ada_obi at gmail.com", "email me: ada at yahoo.com" — the word "at" and a
 * domain. Literal (refused) when the name is handle-shaped (a digit, "_" or ".")
 * or the text says it is an address; otherwise a person looks ("ada at gmail.com").
 */
const WORD_AT_DOMAIN_RE = new RegExp(
  String.raw`(?<![a-z0-9._%+-])(${LOCAL_PART})\s{1,3}at\s{1,3}[a-z0-9-]{2,40}(?:\.[a-z0-9-]{2,40}){0,3}\.(?:${KNOWN_TLDS})\b`,
  "gi",
);
const MAIL_FRAME_BEFORE_RE = /\b(?:e-?mail|mail)\b(?:\s{1,3}(?:me|us))?(?:\s{1,3}(?:at|on))?\s{0,3}[:\-–—]?\s{0,3}$/i;
/** "name (at) shop.com", "name [at] gmail", "name {at} yahoo", "name(@)gmail", "name <at> shop (dot) com". */
const BRACKET_AT_EMAIL_RE = new RegExp(
  String.raw`${LOCAL_PART}\s{0,3}${AT_BRACKETED}\s{0,3}(?:(?:${WEBMAIL_SURE})\b|[a-z0-9-]{2,40}\s{0,3}(?:\.|${DOT_SPELLED})\s{0,3}(?:${SPELLED_TLDS})\b)`,
  "i",
);
/** "name at shop dot com" — the bare word "at" with a spelled-out dot. */
const WORD_AT_EMAIL_RE = new RegExp(
  String.raw`${LOCAL_PART}\s{1,3}at\s{1,3}[a-z0-9-]{2,40}\s{0,3}${DOT_SPELLED}\s{0,3}(?:${SPELLED_TLDS})\b`,
  "i",
);
/** "name@gmail", "name@gmail,com" — a mailbox provider after an @, without its domain. */
const AT_WEBMAIL_RE = new RegExp(String.raw`[a-z0-9._%+-]{2,64}\s?@\s?(?:${WEBMAIL})\b`, "i");
/** "name gmail com", "name🌀gmail🌀com": the provider and "com" with anything but a dot between. */
const WEBMAIL_SEPARATED_COM_RE = new RegExp(String.raw`[a-z0-9._]{2,40}[^a-z0-9\n]{1,4}(?:${WEBMAIL_SURE})[^a-z0-9\n]{1,4}com\b`, "i");
/** "Mail adeshop on gmail", "email me adeshop at yahoo". */
const MAIL_NAME_ON_WEBMAIL_RE = new RegExp(
  String.raw`\b(?:e-?mail|mail)\s{1,3}(?:me\s{1,3}|us\s{1,3})?(?:at\s{1,3}|on\s{1,3})?[a-z][a-z0-9._]{2,30}\s{1,3}(?:on|at|@|via)\s{1,3}(?:${WEBMAIL_SURE})\b`,
  "i",
);
/** "name at gmail", "name at outlook" — a mailbox provider after the bare word "at", not a store or an app. */
const WORD_AT_WEBMAIL_RE = new RegExp(
  String.raw`(?<![a-z0-9._%+-])(${LOCAL_PART})\s{1,3}at\s{1,3}(?:${WEBMAIL_SURE})\b(?![\s-]{1,3}(?:stores?|shops?|malls?|outlets?|branch(?:es)?|express|cent(?:re|er)|village|plaza|offices?|app|calendars?|accounts?))`,
  "gi",
);
/**
 * Words that stand before "at" in ordinary sentences: "available at Outlook
 * stores", "not locked at iCloud", "backed up at iCloud", "good at Outlook", "log
 * in at Gmail". A name is none of these.
 */
const AT_NOT_LOCAL = new Set([
  "available", "sold", "bought", "found", "priced", "made", "seen", "buy", "shop", "shopping", "pickup", "pick",
  "picked", "collect", "collected", "collection", "delivered", "located", "order", "ordered", "selling", "retail",
  "retailing", "going", "now", "only", "also", "get", "got", "it", "its", "them", "us", "me", "you", "him", "her",
  "here", "there", "today", "tonight", "best", "cheapest", "cheaper", "cheap", "goes", "starts", "starting", "stock",
  "stocked", "pay", "paid", "sync", "synced", "syncs", "works", "work", "worked", "working", "login", "log", "logged",
  "sign", "signed", "signs", "up", "out", "in", "on", "off", "down", "over", "back", "away", "around", "about",
  "along", "home", "both", "all", "too", "again", "once", "well", "right", "open", "opened", "opens", "closed",
  "close", "free", "clean", "good", "great", "nice", "fine", "easy", "hard", "fast", "quick", "quickly", "safe",
  "safely", "secure", "securely", "accessible", "reachable", "kept", "set", "left", "done", "stored", "saved",
  "backed", "locked", "unlocked", "linked", "connected", "verified", "activated", "created", "purchased", "built",
  "held", "put", "sent", "read", "shown", "worn", "used", "tested", "checked", "removed", "added", "listed", "based",
  "hosted", "registered", "reset", "restored", "synchronised", "synchronized", "enabled", "disabled", "supported",
  "compatible", "included", "installed", "preinstalled", "updated", "upgraded", "downloaded", "uploaded", "shared",
  "posted", "is", "are", "was", "were", "be", "been", "being", "look", "looks", "looked", "this", "that", "these",
  "those", "which", "what", "who", "everything", "anything", "something", "nothing", "everyone", "someone", "more",
  "most", "less", "least", "new", "old", "one", "ones", "yes", "no", "not", "easily", "directly", "currently",
  "already", "usually", "really", "fully", "nicely", "perfectly", "properly", "exactly", "simply", "mostly",
  "mainly", "early", "daily", "weekly", "monthly", "yearly", "likely", "friendly", "lovely", "just", "even",
  "still", "very", "so", "then", "when", "where", "while", "if", "as", "than", "mail", "email", "emails", "account",
  "accounts", "backup", "backups", "storage", "photos", "photo", "contacts", "contact", "data", "files", "file",
  "music", "notes", "calendar", "apps", "app", "id", "ids", "password", "passwords", "logins",
]);

/** An ordinary word in front of "at", not the name part of an address. */
function ordinaryWordBeforeAt(word: string): boolean {
  const lower = word.toLowerCase();
  if (/[\d_.]/.test(lower)) return false;
  // "logging", "selling": a verb.
  return lower.length <= 2 || AT_NOT_LOCAL.has(lower) || (lower.length >= 6 && lower.endsWith("ing"));
}

/** "name at domain.com": "high" when written as an address, "medium" when a person should look, else null. */
function wordAtDomain(text: string): ContactConfidence | null {
  let best: ContactConfidence | null = null;
  WORD_AT_DOMAIN_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = WORD_AT_DOMAIN_RE.exec(text)) !== null) {
    const local = match[1];
    const framed = MAIL_FRAME_BEFORE_RE.test(text.slice(Math.max(0, match.index - 24), match.index));
    if ((/[\d_.]/.test(local) && /[a-z]/i.test(local)) || framed) return "high";
    if (!ordinaryWordBeforeAt(local)) best = "medium";
  }
  return best;
}

/** "adeshop at gmail": a name, the bare word "at" and a mailbox provider. */
function wordAtWebmail(text: string): boolean {
  WORD_AT_WEBMAIL_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = WORD_AT_WEBMAIL_RE.exec(text)) !== null) {
    if (!ordinaryWordBeforeAt(match[1])) return true;
  }
  return false;
}
/** "gmail: name", "gmail - name" — a provider used as a label. Not "Gmail: supported", not "Gmail-friendly". */
const WEBMAIL_LABEL_RE = new RegExp(
  String.raw`\b(?:gmail|yahoo|ymail|hotmail|icloud|protonmail)(?:\s{0,3}:|\s{1,3}[\-–]|[\-–]\s)\s{0,3}(?!(?:supported|compatible|yes|no|ready|sync|synced|app|apps|account|accounts|support|integration|enabled|included|preinstalled|works)\b)[a-z0-9][a-z0-9._%+-]{2,40}\b`,
  "i",
);
/** "name@shop" with no top-level domain: probably an address. Not a price ("3pcs@N5000"). */
const EMAIL_LIKE_RE = /(?=[a-z0-9._%+-]{0,63}[a-z])[a-z0-9._%+-]{3,64}@(?!(?:ngn|n|₦)?\s?\d)[a-z][a-z0-9-]{2,63}/i;
/** A mailbox provider named with its dot ("gmail.com", "yahoo dot com"). */
const WEBMAIL_HINT_RE = new RegExp(String.raw`\b(?:${WEBMAIL})\s{0,3}(?:\.|${DOT_SPELLED})\s{0,3}(?:com|co\.[a-z]{2})\b`, "i");
/**
 * "my gmail", "(gmail)", "e-mail: adeshopstore", "mail me: adeshop" — an address
 * half given. A provider named as a feature ("comes with Gmail") is not.
 */
const WEBMAIL_POINTER_RE = new RegExp(
  String.raw`\b(?:my|our)\s+(?:${WEBMAIL})\b|\(\s{0,3}(?:${WEBMAIL})\s{0,3}\)|\be-?mail\s{0,3}(?:me\s{0,3})?[:\-–]\s{0,3}[a-z][a-z0-9._%+-]{2,40}\b|\b(?:e-?)?mail\s{1,3}(?:me|us)\s{0,3}(?:[:\-–]|\bat\b|\bon\b)\s{0,3}[a-z][a-z0-9._%+-]{2,40}\b`,
  "i",
);

// ---- Messaging apps, handles, links -----------------------------------------

const APP_NAMES = String.raw`${WHATSAPP}|telegram|viber|wechat|imessage|snapchat|instagram|facebook|messenger|tiktok|botim|truecaller|discord|skype|twitter|zangi|imo(?!\s+state)`;
const APP_SHORT = String.raw`signal|ig|insta|fb|wa|w\/a|snap|tg`;
const CONTACT_VERBS = "add|chat|message|msg|contact|reach|text|ping|hit|find|follow|dm|call|order|buy|pay|send|buzz|holla|hmu";

/** A handle candidate (captured): a letter, then 3 to 30 more characters. Checked by `isHandleShaped`. */
const HANDLE_CANDIDATE = String.raw`([a-z][a-z0-9_.]{2,29}[a-z0-9])`;

/**
 * A word that can only be a handle: an "_", a "." between two lower-case letters,
 * or a digit after three letters ("adeshop_ng", "ade.shop", "adeshop22"). Not a
 * rank ("no.1"), not a full stop with no space after it ("free.Outside",
 * "easy.Just"), not "1080p", "2.1m" or "Reels.".
 */
function isHandleShaped(word: string): boolean {
  if (!/^[A-Za-z][A-Za-z0-9_.]{2,29}[A-Za-z0-9]$/.test(word)) return false;
  if (/^no\.\d/i.test(word)) return false;
  if (word.includes("_")) return true;
  if (/[a-z]\.[a-z]/.test(word)) return true;
  return /[A-Za-z]{3}[A-Za-z0-9]{0,20}\d/.test(word);
}

/** Does the global `re` match with a handle-shaped capture? Captures listed in `atGroups` follow an "@" and pass with any letter. */
function matchesHandle(re: RegExp, text: string, atGroups: ReadonlyArray<number> = []): boolean {
  re.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    for (let index = 1; index < match.length; index += 1) {
      const value = match[index];
      if (value === undefined) continue;
      if (atGroups.includes(index) ? /[a-z]/i.test(value) : isHandleShaped(value)) return true;
    }
  }
  return false;
}

/** "message me on WhatsApp", "add us on Telegram", "DM me via IG", "find us on X". */
const APP_STEER_PRONOUN_RE = new RegExp(
  String.raw`\b(?:${CONTACT_VERBS})\s{1,3}(?:with\s{1,3})?(?:me|us)\s{1,3}(?:up\s{1,3})?(?:on|via|through|thru|at|by)\s{1,3}(?:my\s{1,3}|our\s{1,3})?(?:${APP_NAMES}|${APP_SHORT}|threads|x)\b`,
  "i",
);
/** "WhatsApp me", "Whats-App us": the app used as a verb. */
const APP_AS_VERB_RE = new RegExp(String.raw`\b(?:${WHATSAPP}|telegram|viber|imo|wechat|botim)\s{1,3}(?:me|us)\b`, "i");
/** "my WhatsApp number", "our Telegram channel", "our YouTube channel". */
const APP_POSSESSIVE_RE = new RegExp(
  String.raw`\b(?:my|our)\s{1,3}(?:${APP_NAMES}|ig|insta|fb|tg|youtube)\s{1,3}(?:number|no|line|handle|id|page|account|group|channel)\b`,
  "i",
);
/** "orders via WhatsApp", "payment on Telegram only". */
const APP_CHANNEL_RE = new RegExp(
  String.raw`\b(?:orders?|buy|pay|payments?|contact|enquir(?:y|ies)|inquir(?:y|ies)|chat|message|delivery|negotiat\w{0,6})\s{1,3}(?:is\s{1,3}|are\s{1,3})?(?:only\s{1,3}|strictly\s{1,3})?(?:on|via|through|thru)\s{1,3}(?:${APP_NAMES}|signal)\b`,
  "i",
);
/**
 * Apps that label a handle on their own. "Imo" is a state and "snap" a button
 * before either is an app: they count with "app" after them, or with "on", "my",
 * "@" (see the weaker readings below).
 */
const LABEL_APPS = String.raw`${WHATSAPP}|telegram|viber|wechat|imessage|snapchat|instagram|facebook|messenger|tiktok|botim|truecaller|discord|skype|twitter|zangi|ig|insta|fb|tg|(?:imo|snap)\s{1,3}app`;
/**
 * An app used as the label of a handle, written the standard way: "IG @shop",
 * "Telegram - @name", "Instagram: adeshop_ng". "WhatsApp: supported", "TikTok -
 * 60fps" and "Instagram - 2.1m tall" are not — the label needs a handle after it.
 * (An app next to a NUMBER is lifted by the phone reader below: "WhatsApp: 0803…".)
 */
const APP_LABEL_DATUM_RE = new RegExp(
  String.raw`\b(?:${LABEL_APPS})\s{0,3}(?:(?:me|us|number|no\.?|line|handle|id|page|username|user)\s{0,3})?(?::|[-–—]|\bis\b)\s{0,3}(?:@([a-z0-9_.]{3,30})|${HANDLE_CANDIDATE})|\b(?:${LABEL_APPS})\s{0,3}@([a-z0-9_.]{3,30})`,
  "gi",
);
/**
 * An app and a handle with something odd between them: "IG 👉 adeshop_ng", 'IG:
 * "adeshop_ng"', "IG (adeshop_ng)", "IG | adeshop_ng", "IG => adeshop_ng", "I.G »
 * adeshop_ng" — or a weak app label ("Snap: adeshop22", "Imo - adeshop22"). A
 * person looks.
 */
const APP_ODD_HANDLE_RE = new RegExp(
  String.raw`\b(?:${LABEL_APPS}|imo|snap|i\s?\.\s?g)\.?[^a-z0-9\n]{1,10}@?${HANDLE_CANDIDATE}`,
  "gi",
);
/**
 * The seller sending the buyer to an app: "available on WhatsApp for orders",
 * "find our page on Facebook". A product that merely works with an app, or copy
 * that names one ("also available on Telegram", "follow the latest styles on
 * Instagram"), is not that — it needs the seller ("our", "my") or a reason to go
 * there (orders, enquiries).
 */
const APP_DESTINATION_RE = new RegExp(
  String.raw`\b(?:available|reachable|active|online)\s{1,3}on\s{1,3}(?:${APP_NAMES})\b(?=[^.\n]{0,30}\b(?:for|to)\s{1,3}(?:orders?|enquir\w{0,6}|inquir\w{0,6}|more|details|chat|contact|buy|purchase)\b)|\b(?:find|search|follow|check|add|like|visit)\s{1,3}(?:our|my)\s{1,3}[a-z]{1,20}\s{1,3}on\s{1,3}(?:${APP_NAMES}|ig|insta|fb)\b|\b(?:i\s{1,3}am|i'?m|we\s{1,3}are|we'?re)\s{1,3}(?:also\s{1,3})?(?:on|active\s{1,3}on|available\s{1,3}on)\s{1,3}(?:${APP_NAMES})\b`,
  "i",
);
/** "find Ade Shop NG on Facebook" — a NAME to look up on an app. Checked for the capital in code. */
const FIND_NAME_ON_APP_RE = new RegExp(
  String.raw`\b(?:find|search(?:\s{1,3}for)?|look\s{1,3}for|check)\s{1,3}([A-Za-z][\w&'-]{0,30}(?:\s{1,3}[A-Za-z][\w&'-]{0,30}){0,3})\s{1,3}on\s{1,3}(?:${APP_NAMES}|ig|insta|fb)\b`,
  "i",
);
const APP_MENTION_RE = new RegExp(String.raw`\b(?:${APP_NAMES})\b`, "i");
/** "hmu on ig", "we dey for tiktok", "price na for WhatsApp", "message my personal line". */
const APP_SLANG_RE = new RegExp(
  String.raw`\b(?:hmu|holla|buzz|ping)\b[^.\n]{0,20}\b(?:on|via|at)\s{1,3}(?:${APP_NAMES}|${APP_SHORT})\b|\b(?:we|i)\s{1,3}dey\s{1,3}(?:for|on)\s{1,3}(?:${APP_NAMES}|${APP_SHORT})\b|\b(?:price|prices|order|orders|payment)\s{1,3}(?:na|is|dey)\s{1,3}(?:for|on)\s{1,3}(?:${APP_NAMES}|ig|insta|fb|w\/a)\b|\b(?:message|text|call|reach|contact|dm|msg)\s{1,3}(?:me\s{1,3}on\s{1,3})?my\s{1,3}(?:personal\s{1,3}|private\s{1,3}|direct\s{1,3})?(?:line|number|phone)\b|\b(?:dm|message|text|msg|send)\b[^.\n]{0,30}\bto\s{1,3}my\s{1,3}(?:personal\s{1,3}|private\s{1,3})?(?:line|number|phone)\b`,
  "i",
);
/** "holla at adeshop_ng", "hmu adeshop22": slang in front of a handle, with no app named. A person looks. */
const SLANG_HANDLE_RE = new RegExp(String.raw`\b(?:holla|hmu|buzz|ping)\s{1,3}(?:at\s{1,3})?@?${HANDLE_CANDIDATE}`, "gi");
/** "discord, user adeshop#1234": a Discord username with its tag (refused). */
const DISCORD_TAG_RE = /\bdiscord\b[^.\n]{0,20}?\b[a-z][a-z0-9_.]{2,31}#\d{4}\b/i;
/** "user adeshop#1234" with no app named: a person looks. Not "colour#2045" on a hang tag. */
const USER_TAG_RE = /\buser(?:name)?\b[^.\n]{0,20}?\b[a-z][a-z0-9_.]{2,31}#\d{4}\b/i;
/** "@adeshop_ng", "@ade.shop", "@adeshop22": an @ and a word that can only be a handle (refused). */
const AT_HANDLE_RE = new RegExp(String.raw`(?:^|[\s(,;:])@${HANDLE_CANDIDATE}`, "gi");
const DM_RE =
  /\b(?:dm\s{1,3}(?:me|us)|inbox\s{1,3}(?:me|us)|slide\s{1,3}into|(?:dm|inbox|pm)\s{1,3}for\s{1,3}(?:price|prices|details|info|more|orders?|enquir\w{0,6})|send\s{1,3}(?:me\s{1,3}|us\s{1,3})?a\s{1,3}dm|all\s{1,3}(?:our\s{1,3}|my\s{1,3})?socials?|(?:our|my)\s{1,3}socials|(?:my|our)\s{1,3}social\s{1,3}media\s{1,3}(?:handles?|pages?|accounts?)|social\s{1,3}media\s{1,3}handles?)\b/i;

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
  "threads\\.net",
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
/** "telegram dot me slash adeshop", "wa dot me slash 234…": a contact link spelled out (a person looks). */
const SPELLED_CONTACT_LINK_RE = /\b(?:t|wa|m|fb|telegram)\s{0,3}(?:\.|dot)\s{0,3}me\s{0,3}(?:\/|slash)\s{0,3}[a-z0-9_]{3,32}\b/i;
/** A link with its scheme; the host is captured. */
const URL_RE = /\bhttps?:\/\/([^\s/?#)]{1,253})/gi;
/** "anything.tld/path" — a link written without its scheme; the host is captured. */
const PATH_LINK_RE = /(?<![@\w.-])((?:[a-z0-9][a-z0-9-]{0,40}\.){1,4}[a-z]{2,10})\/[^\s)]{2,}/gi;
/** The top-level domains of a refused link or domain. ("africa" is held: "Made in Nigeria.Africa's finest".) */
const DOMAIN_TLDS = String.raw`com\.ng|org\.ng|gov\.ng|edu\.ng|co\.uk|co\.za|com|org|ng|io|biz|xyz|info|store|shop|online|site|app|link|net|co|me|live|tech|africa`;
const KNOWN_TLD_RE = new RegExp(String.raw`\.(?:${KNOWN_TLDS})$`, "i");
/** A bare domain, with up to three subdomains: the name and the top-level domain are captured. */
const DOMAIN_CANDIDATE_RE = new RegExp(
  String.raw`(?<![@\w.-])((?:www\.)?(?:[a-z0-9][a-z0-9-]{0,40}\.){0,3}[a-z0-9][a-z0-9-]{0,40})\.(${DOMAIN_TLDS})(?![\w-]|\.[a-z0-9])`,
  "gi",
);
/** Top-level domains that are everyday words: a capital after the dot may be a full stop with no space after it ("Good item.Net weight"). */
const WORD_TLDS = new Set(["store", "shop", "online", "site", "app", "link", "net", "co", "me", "live", "info", "tech"]);
/** Platforms and mailbox providers: their bare domain names a place, not the seller ("comes with a Gmail.com account"). */
const PLATFORM_NAMES = new Set([
  "gmail", "googlemail", "yahoo", "ymail", "hotmail", "outlook", "live", "icloud", "protonmail", "proton", "aol", "gmx",
  "zoho", "yandex", "google", "apple", "samsung", "microsoft", "amazon", "ebay", "aliexpress", "alibaba", "jumia",
  "konga", "temu", "shein", "facebook", "instagram", "tiktok", "twitter", "x", "youtube", "whatsapp", "telegram",
  "snapchat", "netflix", "spotify", "paypal", "paystack", "flutterwave", "opay", "palmpay", "linkedin", "pinterest",
]);
/** Words that end a sentence and start the next with no space ("Brand New.Shop Now", "quality.shop now"). */
const SENTENCE_WORDS = new Set([
  "now", "here", "there", "today", "new", "brand", "item", "items", "quality", "price", "prices", "size", "sizes",
  "colour", "colours", "color", "colors", "stock", "available", "original", "authentic", "guaranteed", "durable",
  "warranty", "delivery", "nationwide", "lagos", "abuja", "nigeria", "condition", "box", "pieces", "pack", "set",
  "more", "best", "good", "great", "nice", "fine", "well", "too", "also", "only", "free", "fast", "cheap",
  "affordable", "it", "them", "this", "that", "us", "you", "online", "offline", "home", "office", "use", "used",
  "order", "orders", "sale", "offer", "offers", "discount", "deal", "deals", "product", "products", "service",
  "services", "contact", "click", "visit", "our", "the", "your", "all", "any", "please", "thanks", "thank", "store",
  "shop", "weight", "material", "design", "designs", "style", "styles", "fabric", "leather", "cotton", "kids",
  "adults", "men", "women", "ladies", "unisex", "sealed", "clean", "neat", "working", "perfect", "excellent",
]);

/**
 * How sure a bare domain is, from how it is written ("adeshop.store", "AdeShop.Store",
 * "ADESHOP.STORE" are refused; "Adeshop.Shop Now" and "quality.shop" are held;
 * "item.Net weight" and "Brand New.Shop Now" are a full stop with no space after it).
 */
function domainConfidence(host: string, tld: string, after: string): ContactConfidence | null {
  const labels = host.split(".");
  const www = labels[0].toLowerCase() === "www";
  const name = labels[labels.length - 1];
  const lowerTld = tld.toLowerCase();
  const subdomains = labels.length - (www ? 1 : 0) > 1;
  if (lowerTld === "africa") return "medium";
  // "x.com", "facebook.com", "gmail.com": a platform, not the seller's own address.
  if (name.length < 2 || (!subdomains && PLATFORM_NAMES.has(name.toLowerCase()))) return "medium";
  // com, org, ng, io, biz, xyz: never the first word of a sentence.
  if (!WORD_TLDS.has(lowerTld)) return "high";
  if (www || subdomains || /\d/.test(name) || name.includes("-") || /[a-z][A-Z]/.test(name)) return "high";
  const ordinary = SENTENCE_WORDS.has(name.toLowerCase()) || /^[a-z]{4,}(?:ed|ing|ly)$/i.test(name);
  const isUpper = (value: string) => value === value.toUpperCase() && /[A-Z]/.test(value);
  const isCapitalised = (value: string) => /^[A-Z][a-z0-9-]*$/.test(value);
  if (tld === lowerTld) return name.length < 4 || ordinary ? "medium" : "high";
  if (isUpper(tld)) return isUpper(name) && name.length >= 4 && !ordinary ? "high" : "medium";
  if (isCapitalised(tld)) {
    // "item.Net", "now.Shop", "Brand New.Shop": a full stop with no space after it.
    if (!isCapitalised(name) || ordinary) return null;
    // "Ade.Shop": too short to tell from a sentence break. A person looks.
    if (name.length < 4) return "medium";
    // "Visit Adeshop.Shop Now" may be Title Case copy with a missing space: a person looks.
    // (A line break ends the copy: the next field may start with a capital.)
    return /^[ \t]{0,3}[A-Z]/.test(after) ? "medium" : "high";
  }
  return "medium";
}

/** The strongest reading of the bare domains in the text, or null. */
function bareDomains(text: string): ContactConfidence | null {
  let best: ContactConfidence | null = null;
  DOMAIN_CANDIDATE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = DOMAIN_CANDIDATE_RE.exec(text)) !== null) {
    const end = match.index + match[0].length;
    const confidence = domainConfidence(match[1], match[2], text.slice(end, end + 4));
    if (confidence === "high") return "high";
    if (confidence === "medium") best = "medium";
  }
  return best;
}

/** A link with its scheme ("url") or without it ("link_path"): refused on a known top-level domain, held otherwise. */
function linkPaths(text: string): { confidence: ContactConfidence; evidence: string } | null {
  let best: { confidence: ContactConfidence; evidence: string } | null = null;
  URL_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = URL_RE.exec(text)) !== null) {
    if (KNOWN_TLD_RE.test(match[1].replace(/:\d+$/, ""))) return { confidence: "high", evidence: "url" };
    best = { confidence: "medium", evidence: "url_other" };
  }
  PATH_LINK_RE.lastIndex = 0;
  while ((match = PATH_LINK_RE.exec(text)) !== null) {
    const host = match[1];
    const dot = host.lastIndexOf(".");
    const confidence = KNOWN_TLD_RE.test(host) ? domainConfidence(host.slice(0, dot), host.slice(dot + 1), "/") : null;
    if (confidence === "high") return { confidence: "high", evidence: "link_path" };
    best = { confidence: "medium", evidence: "link_path_other" };
  }
  return best;
}

/** A look-alike top-level domain: "adeshop.c0m", "adeshop.st0re". */
const LOOKALIKE_TLD_RE = /(?<![@\w.-])[a-z0-9][a-z0-9-]{2,40}\.(?:c0m|c0|0rg|n9|st0re|sh0p|0nline)(?![\w-])/i;
/** "www adeshop com", "www.adeshop com": the address with a dot left out. */
const WWW_SPACED_RE = /\bwww[\s.]{1,3}[a-z0-9][a-z0-9-]{2,40}\s{1,3}(?:com|net|org|ng|store|shop|online|co)\b|\bwww\s{1,3}[a-z0-9][a-z0-9-]{2,40}[\s.]{1,3}(?:com|net|org|ng|store|shop|online|co)\b/i;
/** "adeshop dotcom". */
const DOTCOM_RE = /\b[a-z0-9][a-z0-9-]{2,40}\s{1,3}dot(?:com|net|org|ng)\b/i;
/** "adeshop .store": the dot moved off the name. Lower case: "Good item .Net weight" is a stray space. */
const DOT_MOVED_WORD_TLD_RE = /\b[a-z0-9][a-z0-9-]{2,40}\s{1,3}\.(?:store|shop|online|site|app|link|net|co|me|live)\b/;
/** "adeshop(.)store", "adeshop[.]shop", "adeshop•online": a dot dressed up, before any top-level domain. */
const BRACKETED_DOT_DOMAIN_RE =
  /\b[a-z0-9][a-z0-9-]{2,40}\s?(?:\[\s?\.\s?\]|\(\s?\.\s?\)|\{\s?\.\s?\}|•)\s?(?:com|net|org|ng|io|co|me|info|biz|store|shop|online|site|app|link|live)\b/i;
/** A dot dressed up or moved: "adeshop[.]com", "adeshop,com", "adeshop•com", "adeshop. com". Lower case only. */
const DISGUISED_DOT_DOMAIN_RE =
  /\b[a-z0-9][a-z0-9-]{2,40}(?:\s?(?:\[\.\]|\(\.\)|,|•|·)\s?|\.\s{1,3})(?:com\.ng|com|org)\b/;
/** "adeshop dot com", "adeshop .com". Only top-level domains that are not words ("polka dot net fabric"). */
const SPELLED_DOMAIN_RE =
  /\b[a-z0-9][a-z0-9-]{2,40}(?:\s{1,3}\.\s{0,3}|\s{1,3}dot\s{1,3}|\s{0,3}\(\s{0,3}dot\s{0,3}\)\s{0,3}|\s{0,3}\[\s{0,3}dot\s{0,3}\]\s{0,3})(?:com\.ng|com|ng|org|io|africa)\b|\b[a-z0-9][a-z0-9-]{2,40}\s{0,3}(?:\(\s{0,3}dot\s{0,3}\)|\[\s{0,3}dot\s{0,3}\])\s{0,3}(?:store|shop|online|site|app|link|net|co|me|live)\b|\b(?!polka\b)[a-z0-9][a-z0-9-]{3,40}\s{1,3}dot\s{1,3}(?:store|shop|online|site)\b/i;

/**
 * The link is somewhere else: "link in bio", "my site is in my bio", "bio link",
 * "check bio", "link dey my bio", "tap the link on my profile", "l1nk in bio",
 * "my linktree". A phrase, not an address — held for a person. "Available in our
 * bio range" names a product line, not a profile.
 */
const LINK_ELSEWHERE_RE = new RegExp(
  String.raw`\b(?:l[i1!|]nks?|url|website|web\s?site|site|number|contact|whatsapp|handle|catalogu?e|price\s?list)\b[^.\n]{0,12}?\b(?:in|on|for|inside|dey)\s{1,3}(?:my\s{1,3}|our\s{1,3}|the\s{1,3})?(?:bio|profile|description)\b|\bbio[\s-]{0,2}l[i1]nk\b|\bcheck\s{1,3}(?:my\s{1,3}|our\s{1,3}|the\s{1,3})?(?:bio|profile)\b(?=[ \t]{0,3}(?:$|[\n.,;:!?)]|for\b|to\b))|\blink\s?tree\b|\blinktr\.?ee\b`,
  "i",
);
/**
 * A QR code or barcode sent as the way to order or chat: "scan the QR code to
 * order", "QR code on the last picture, scan to order", "use the barcode in the
 * picture to pay". Not "scan the QR code to pay at the counter" (a QR stand) or
 * "scan the QR code on the box to verify it".
 */
const QR_STEER_RE =
  /\b(?:scan|use)\b[^.\n]{0,40}?\b(?:qr|bar\s?code)\b[^.\n]{0,40}?\bto\s{1,3}(?:order|buy|chat|contact|message|dm|reach\s{1,3}(?:me|us)|pay\s{1,3}(?:me|us))\b|\b(?:qr|bar\s?code|code)\b[^.\n]{0,30}?\b(?:in|on)\s{1,3}the\s{1,3}(?:[a-z]{1,10}\s{1,3})?(?:picture|photo|image|pic|flyer|banner)s?\b[^.\n]{0,30}?\bto\s{1,3}(?:order|buy|chat|contact|message|dm|pay|reach)\b|\b(?:qr|bar\s?code)\b[^.\n]{0,40}?\bscan\s{1,3}(?:it\s{1,3})?to\s{1,3}(?:order|buy|chat|pay|contact)\b/i;

/** "search adeshop on Instagram", "we are adeshop_ng on tiktok". */
const HANDLE_APPS = "ig|insta|instagram|tiktok|snapchat|facebook|fb|twitter|telegram|tg";
/**
 * "IG adeshop_ng", "our tiktok is adeshop.ng", "snapchat adeshop22" — an app
 * followed by a handle-shaped word.
 */
const APP_THEN_HANDLE_RE = new RegExp(
  // The app name is a whole word and something separates it from the handle
  // ("Snapchat." is not "snap" + "chat.").
  String.raw`\b(?:${HANDLE_APPS})\b(?:\s{1,3}(?:(?:is|handle|page|name|username|id|at)\s{1,3})?|\s{0,3}[:@–—-]\s{0,3})@?${HANDLE_CANDIDATE}`,
  "gi",
);
/** "my snap: adeshop22", "my gram is adeshop_ng": a short app name the seller owns, then a handle. */
const POSSESSIVE_HANDLE_RE = new RegExp(
  String.raw`\b(?:my|our)\s{1,3}(?:snap|threads|gram|ig|insta|tg|tiktok|telegram|twitter|x|imo)\s{0,3}(?:is\s{1,3}|[:=@–—-]\s{0,3})?@?${HANDLE_CANDIDATE}`,
  "gi",
);
/** "we are adeshop_ng on Instagram", "follow @adeshop on IG". Handle-shaped, or written with its "@": "find inspiration on TikTok" is neither. */
const HANDLE_ON = String.raw`\b(?:search|find|follow|check|add|we\s{1,3}are|i\s{1,3}am|i'?m)\s{1,3}(?:for\s{1,3}|out\s{1,3}|us\s{1,3}as\s{1,3}|me\s{1,3}as\s{1,3})?(?:@([a-z0-9][a-z0-9_.]{2,29})|${HANDLE_CANDIDATE})\s{1,3}on\s{1,3}`;
const HANDLE_ON_APP_RE = new RegExp(String.raw`${HANDLE_ON}(?:${HANDLE_APPS})\b`, "gi");
/** "adeshop_ng on IG", "@adeshop on TikTok": a word that can only be a handle, then the app. */
const BARE_HANDLE_ON_APP_RE = new RegExp(
  String.raw`(?:^|[\s(,;:])(?:@([a-z0-9][a-z0-9_.]{2,29})|${HANDLE_CANDIDATE})\s{1,3}on\s{1,3}(?:${HANDLE_APPS})\b`,
  "gi",
);
/** "Follow adeshop_ng on I.G": the app name dotted apart. A person looks. */
const HANDLE_ON_DOTTED_APP_RE = new RegExp(String.raw`${HANDLE_ON}i\s?\.\s?g\b`, "gi");
/** "search adeshop on Instagram": one plain word to look up. A person looks (it may be an ordinary word). */
const WORD_ON_APP_RE = new RegExp(
  String.raw`\b(?:search|find|follow|ping|buzz|holla|we\s{1,3}are|i\s{1,3}am|i'?m|we\s{1,3}dey\s{1,3}(?:for|on)\s{1,3}(?:${HANDLE_APPS})\s{1,3}as)\s{1,3}(?:for\s{1,3})?([a-z][a-z0-9]{3,29})(?:\s{1,3}on\s{1,3}(?:${HANDLE_APPS})\b|\b(?<=\bas\s[a-z0-9]{4,30}))`,
  "i",
);
/**
 * "IG adeshop", "tiktok adeshopng", "IG — adeshop": an app name, then one plain
 * word ending the sentence. A person looks — unless the word is one honest copy
 * puts there ("Instagram videos", "Facebook live", "Telegram stand").
 */
const APP_THEN_WORD_RE = new RegExp(
  String.raw`\b(?:${HANDLE_APPS})\b\s{0,3}(?:(?:is|na|=|:|-|–|—)\s{0,3})?@?([a-z][a-z0-9]{3,29})\b(?=\s{0,3}(?:$|[.,;!?)\n]))`,
  "gi",
);
/** Ordinary words that follow "find … on Instagram" or an app name in honest copy. */
const NOT_A_HANDLE = new Set([
  "more", "inspiration", "ideas", "them", "videos", "video", "reviews", "prices", "deals", "tutorials", "styles",
  "style", "tips", "content", "photos", "photo", "pictures", "picture", "pics", "trends", "trend", "trending", "looks",
  "look", "outfits", "outfit", "designs", "recipes", "recipe", "samples", "examples", "updates", "update", "people",
  "friends", "everything", "anything", "something", "others", "live", "reels", "reel", "stories", "story", "posts",
  "post", "filters", "filter", "lenses", "lens", "business", "marketplace", "ads", "advert", "adverts", "clips",
  "clip", "influencer", "influencers", "creator", "creators", "users", "user", "fans", "followers", "follower",
  "famous", "viral", "ready", "worthy", "shop", "shops", "store", "stores", "page", "pages", "account", "accounts",
  "handle", "handles", "streaming", "stream", "streams", "calls", "call", "chats", "chat", "groups", "group",
  "channel", "channels", "status", "stickers", "sticker", "desktop", "apps", "compatible", "support", "supported",
  "links", "lite", "messenger", "dance", "dances", "challenge", "challenges", "lights", "light", "ring", "tripod",
  "selfie", "photography", "vlog", "vlogs", "vlogging", "marketing", "growth", "likes", "views", "feed", "grid",
  "profile", "template", "templates", "accessories", "version", "premium", "verified", "boost", "promotion", "promo",
  "sales", "seller", "sellers", "fashion", "inspired", "aesthetic", "baddie", "baddies", "shorts", "series", "games",
  "game", "songs", "song", "music", "audio", "sound", "sounds", "effects", "effect", "campaign", "campaigns", "tricks",
  "hacks", "inbox", "messages", "message", "notifications", "notification", "integration", "friendly", "optimized",
  "optimised", "format", "formats", "size", "sizes", "ratio", "portrait", "landscape", "square", "vertical",
  "horizontal", "resolution", "quality", "stand", "stands", "holder", "mount", "kit", "kits", "bundle", "lamp",
  "backdrop", "backdrops", "studio", "shoots", "shoot", "content", "creator", "web", "voice", "notes", "backup",
]);
/** "@Lekki", "@home", "@retail" — the sign used for "at", not a handle. */
const AT_NOT_A_HANDLE = new Set([
  "home", "work", "office", "school", "church", "mosque", "night", "noon", "midnight", "dawn", "all", "any", "every",
  "last", "least", "best", "first", "once", "cost", "price", "retail", "wholesale", "discount", "checkout", "delivery",
  "pickup", "store", "shop", "the", "this", "that", "our", "your", "each", "only", "just", "affordable", "factory",
  "source", "market", "marketplace", "lekki", "ikeja", "yaba", "ajah", "ikoyi", "surulere", "festac", "gbagada",
  "ogba", "maryland", "magodo", "agege", "oshodi", "apapa", "mushin", "ikorodu", "badagry", "epe", "lagos", "abuja",
  "ibadan", "kano", "kaduna", "enugu", "owerri", "onitsha", "aba", "uyo", "calabar", "asaba", "benin", "warri", "jos",
  "ilorin", "abeokuta", "akure", "osogbo", "ife", "port", "phc", "nsukka", "makurdi", "lokoja", "minna", "sokoto",
  "zaria", "ota", "sango", "mowe", "ibafo", "berger", "ojota", "ketu", "ikotun", "egbeda", "idimu", "ejigbo", "isolo",
  "ilupeju", "obalende", "marina", "oniru", "chevron", "sangotedo", "ibeju", "wuse", "garki", "maitama", "gwarinpa",
  "kubwa", "jabi", "utako", "asokoro", "nyanya", "lugbe", "victoria", "island", "mainland", "estate",
]);
/** "@shopname" — needs a letter, and is not a price ("@5000", "@N5000"). */
const AT_WORD_RE = /(?:^|[\s(,;])@(?!(?:ngn|n|₦)?\s?\d)((?=[a-z0-9_.]{0,29}[a-z])[a-z0-9_.]{3,30})\b/gi;

/**
 * Asking the BUYER for a way to reach them: "drop your number", "comment your
 * number", "tell me your number", "your number abeg, I go call you", "just drop
 * number", "share your handle make I follow you". Not "put your phone on the pad",
 * "your number plate", "your contact lenses", "your number on the jersey".
 */
const BUYER_NOUN = String.raw`(?:phone\s{1,3}(?:number|no)|mobile\s{1,3}(?:number|no)|whatsapp\s{1,3}(?:number|no|line)|number|digits|contacts?|whatsapp|wa\s{1,3}(?:number|no))`;
const BUYER_NOUN_GUARD = String.raw`(?!\s{1,3}(?:plates?|lens(?:es)?|paper|adhesive|glue|grill|solution|on\s{1,3}(?:the|your|a)\s{1,3}(?:back|front|jersey|shirt|kit|cake|cap|sleeve|shorts|card)|printed|print|of\b|status|stickers?|chats?|backup|business|web|messages)\b)`;
const BUYER_CONTACT_REQUEST_RE = new RegExp(
  String.raw`\b(?:drop|leave|put|send|share|give|comment|write|type|tell|post|enter|paste|key\s{1,3}in|provide|submit|forward|whatsapp|inbox|dm)\s{1,3}(?:me\s{1,3}|us\s{1,3})?(?:your|ur|yr)\s{1,3}${BUYER_NOUN}\b${BUYER_NOUN_GUARD}|\b(?:drop|leave|send|share|give|comment|post)\s{1,3}(?:me\s{1,3}|us\s{1,3})?(?:number|digits)\b${BUYER_NOUN_GUARD}|\b(?:your|ur|yr)\s{1,3}${BUYER_NOUN}\b${BUYER_NOUN_GUARD}[^.\n]{0,12}?\b(?:abeg|pls|please|make\s{1,3}(?:i|we)|so\s{1,3}(?:i|we)|i\s{1,3}(?:go|will|wil)|i'll|we\s{1,3}(?:go|will))\b|\b(?:share|drop|send|give)\s{1,3}(?:me\s{1,3}|us\s{1,3})?(?:your|ur)\s{1,3}(?:ig\s{1,3}|instagram\s{1,3}|tiktok\s{1,3}|snap\s{1,3})?handle\b(?=[ \t]{0,3}(?:make\s{1,3}(?:i|we)|so\s{1,3}(?:i|we)|for\s{1,3}(?:me|us)|[\n.,!]|$))`,
  "i",
);
/**
 * The number was moved where text rules cannot read it: "the number is on the
 * picture", "my WhatsApp number is in the picture". Not "the phone is in the
 * picture for size" or "part number is in the picture".
 */
const CONTACT_IN_IMAGE_RE =
  /\b(?:(?:my|our)\s{1,3}(?:whatsapp\s{1,3}|phone\s{1,3}|mobile\s{1,3}|contact\s{1,3}|account\s{1,3}|bank\s{1,3})?(?:number|digits|contacts?|line|whatsapp|details|handle|ig|instagram|account)|the\s{1,3}(?:whatsapp\s{1,3}|phone\s{1,3}|mobile\s{1,3}|contact\s{1,3})?(?:number|digits)|contact\s{1,3}(?:number|details|info))\s{1,3}(?:is|are|dey|na)\s{1,3}(?:on|in|for)\s{1,3}(?:the|my|our|this)\s{1,3}(?:[a-z]{1,10}\s{1,3})?(?:picture|photo|image|pic|flyer|banner|poster|video)s?\b/i;
/** "check my store name for my number", "details in my store name". Never "see our shop for the details". */
const CONTACT_ELSEWHERE_RE =
  /\b(?:check|see|look\s{1,3}at|view|visit|open)\s{1,3}(?:my|our|the)\s{1,3}(?:store|shop|profile|bio|page)(?:\s{1,3}name)?\s{1,3}for\s{1,3}(?:my|our)\s{1,3}(?:number|contact|phone|whatsapp|digits|line|details|account)\b|\b(?:number|contact|digits|whatsapp|details|account(?:\s{1,3}details)?)\s{1,3}(?:is\s{1,3}|are\s{1,3})?(?:in|on)\s{1,3}(?:my|our|the)\s{1,3}(?:store|shop)\s{1,3}name\b/i;

/**
 * THE REFUSE TIER. The only evidence that may be "high" (the caller refuses): a
 * datum in its literal, standard form. Every other evidence — a reconstruction
 * or a phrase — is clamped to "medium" at the end of `detectContactDetails`,
 * whatever any rule above said, so a new rule cannot refuse by accident.
 *
 *   ng_mobile        11-digit Nigerian mobile, one block or ≤4 plain groups (+234 allowed)
 *   email            an address with "@" and a domain
 *   email_at         "name_1 at domain.com" (a handle-shaped name, or "email me: …")
 *   contact_link     wa.me/…, t.me/…, instagram.com/…, a link shortener with a path
 *   url, link_path   a link on a known top-level domain, with or without its scheme
 *   domain           a bare domain on a known top-level domain, written as one
 *   app_label        "<app>: handle", "<app> @handle"
 *   app_handle       "<app> handle", "my <app>: handle", "handle on <app>"
 *   at_handle        "@handle" with a word that can only be a handle
 *   discord_tag      "discord … name#1234"
 *   app_with_contact an app named beside one of the above
 */
export const LITERAL_EVIDENCE: ReadonlySet<string> = new Set([
  "ng_mobile",
  "email",
  "email_at",
  "contact_link",
  "url",
  "link_path",
  "domain",
  "app_label",
  "app_handle",
  "at_handle",
  "discord_tag",
  "app_with_contact",
]);

function appThenWord(text: string): boolean {
  APP_THEN_WORD_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = APP_THEN_WORD_RE.exec(text)) !== null) {
    if (!NOT_A_HANDLE.has(match[1].toLowerCase())) return true;
  }
  return false;
}

function atHandle(text: string): boolean {
  AT_WORD_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = AT_WORD_RE.exec(text)) !== null) {
    if (!AT_NOT_A_HANDLE.has(match[1].toLowerCase().replace(/\.+$/, ""))) return true;
  }
  return false;
}

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

  // Emails first: an address holds a domain, which is not read again as a link.
  // (The patterns built on "@" only run when there is one.)
  const hasAtSign = text.includes("@");
  let email: ContactHit | null = null;
  if (hasAtSign && (EMAIL_RE.test(text) || SPACED_AT_EMAIL_RE.test(text))) {
    email = { kind: "email", confidence: "high", evidence: "email" };
  } else {
    const worded = wordAtDomain(text);
    if (worded === "high") {
      email = { kind: "email", confidence: "high", evidence: "email_at" };
    } else if (
      worded === "medium" ||
      (hasAtSign && AT_WEBMAIL_RE.test(text)) ||
      BRACKET_AT_EMAIL_RE.test(text) ||
      WORD_AT_EMAIL_RE.test(text) ||
      wordAtWebmail(text) ||
      WEBMAIL_LABEL_RE.test(text) ||
      WEBMAIL_SEPARATED_COM_RE.test(text) ||
      MAIL_NAME_ON_WEBMAIL_RE.test(text)
    ) {
      email = { kind: "email", confidence: "medium", evidence: "email_spelled" };
    } else if (WEBMAIL_HINT_RE.test(text) || WEBMAIL_POINTER_RE.test(text)) {
      email = { kind: "email", confidence: "medium", evidence: "webmail_hint" };
    } else if (hasAtSign && EMAIL_LIKE_RE.test(text)) {
      email = { kind: "email", confidence: "medium", evidence: "email_like" };
    }
  }

  // Links: the strongest reading wins. A wa.me / t.me link is a phone number or a handle by another name.
  const link: { hit: ContactHit | null } = { hit: null };
  const consideredLink = (confidence: ContactConfidence | null, evidence: string) => {
    if (confidence === null || confidence === "low") return;
    if (!link.hit || CONFIDENCE_RANK[confidence] > CONFIDENCE_RANK[link.hit.confidence]) {
      link.hit = { kind: "link", confidence, evidence };
    }
  };
  if (CONTACT_LINK_RE.test(text)) consideredLink("high", "contact_link");
  const linked = linkPaths(text);
  if (linked) consideredLink(linked.confidence, linked.evidence);
  if (email === null) {
    const domain = bareDomains(text);
    consideredLink(domain, domain === "high" ? "domain" : "bare_domain");
    if (
      LOOKALIKE_TLD_RE.test(text) ||
      WWW_SPACED_RE.test(text) ||
      DOTCOM_RE.test(text) ||
      DOT_MOVED_WORD_TLD_RE.test(text) ||
      BRACKETED_DOT_DOMAIN_RE.test(text) ||
      DISGUISED_DOT_DOMAIN_RE.test(text) ||
      SPELLED_DOMAIN_RE.test(text)
    ) {
      consideredLink("medium", "bare_domain");
    }
  }
  if (SPELLED_CONTACT_LINK_RE.test(text)) consideredLink("medium", "link_spelled");
  if (LINK_ELSEWHERE_RE.test(text) || QR_STEER_RE.test(text)) consideredLink("medium", "link_elsewhere");
  if (link.hit) hits.push(link.hit);
  if (email) hits.push(email);

  // Two readings of the same text: "|" as a look-alike for 1, and "|" as a divider
  // between groups. A number glued to a word ("call08031234567") is cut free first,
  // and "S/N", "P/N" are read as the labels they are.
  const phoneText = text
    .replace(/(?<=[A-Za-z]{2})(?=\d{7})/g, " ")
    .replace(/(?<=\d{7})(?=[A-Za-z]{2})/g, " ")
    .replace(/(^|[^A-Za-z0-9])([A-Za-z])(?=(?:0|234)[789][01]\d{8}(?!\d))/g, "$1$2 ")
    .replace(/((?:^|[^0-9])(?:0|234)[789][01]\d{8})(?=[A-Za-z])/g, "$1 ")
    .replace(/\b([SsPp])\s?\/\s?([Nn])\b/g, "$1$2");
  const readings = phoneText.includes("|") ? [phoneText, phoneText.replace(/\|/g, " ")] : [phoneText];
  const phone: { hit: ContactHit | null } = { hit: null };
  const consider = (hit: ContactHit) => {
    if (!phone.hit || CONFIDENCE_RANK[hit.confidence] > CONFIDENCE_RANK[phone.hit.confidence]) phone.hit = hit;
  };
  for (let index = 0; index < readings.length; index += 1) {
    const tokens = tokenize(readings[index]);
    const runs = collectPhoneRuns(tokens);
    for (const run of runs) {
      const hit = classifyPhoneRun(run);
      if (!hit) continue;
      // "0803 | 123 | 4567" read with "|" as a divider is a reconstruction.
      consider(index > 0 && hit.confidence === "high" ? phoneHit("medium", "ng_mobile_reconstructed") : hit);
    }
    // Pieces joined across words, or placed by words: always a reconstruction.
    if (!phone.hit || phone.hit.confidence === "low") {
      if (joinsAcrossWords(runs, tokens)) consider(phoneHit("medium", "ng_mobile_joined"));
      const { pieces, sequences } = placePieces(tokens);
      if (sequences.some(([a, b]) => isNgMobile(a + b)) || piecesMake(pieces, isNgMobile, false)) {
        consider(phoneHit("medium", "ng_mobile_pieces"));
      }
    }
  }
  if ((!phone.hit || phone.hit.confidence === "low") && hasSplitNigerianMobile(phoneText)) {
    consider(phoneHit("medium", "ng_mobile_split"));
  }
  // A phrase that asks for, or points to, a number that is not in the text: a person looks.
  if (
    (!phone.hit || phone.hit.confidence === "low") &&
    (CONTACT_IN_IMAGE_RE.test(text) || CONTACT_ELSEWHERE_RE.test(text) || BUYER_CONTACT_REQUEST_RE.test(text))
  ) {
    phone.hit = phoneHit("medium", "contact_elsewhere");
  }
  if (phone.hit) hits.push(phone.hit);

  // Steering to an app is a phrase (held); an app used as the label of a number or
  // a handle is the whole instruction (refused).
  if (matchesHandle(APP_LABEL_DATUM_RE, text, [1, 3])) {
    hits.push({ kind: "messaging_app", confidence: "high", evidence: "app_label" });
  } else if (
    APP_STEER_PRONOUN_RE.test(text) ||
    APP_AS_VERB_RE.test(text) ||
    APP_POSSESSIVE_RE.test(text) ||
    APP_CHANNEL_RE.test(text) ||
    APP_DESTINATION_RE.test(text) ||
    APP_SLANG_RE.test(text)
  ) {
    hits.push({ kind: "messaging_app", confidence: "medium", evidence: "app_steer" });
  } else if (DM_RE.test(text)) {
    hits.push({ kind: "messaging_app", confidence: "medium", evidence: "dm_request" });
  } else if (APP_MENTION_RE.test(text)) {
    // A bare mention ("works with WhatsApp video calls") is not a contact attempt.
    hits.push({ kind: "messaging_app", confidence: "low", evidence: "app_mention" });
  }

  const named = FIND_NAME_ON_APP_RE.exec(text);
  const word = WORD_ON_APP_RE.exec(text);
  const hasEmail = hits.some((hit) => hit.kind === "email");
  if (
    matchesHandle(APP_THEN_HANDLE_RE, text) ||
    matchesHandle(POSSESSIVE_HANDLE_RE, text) ||
    matchesHandle(HANDLE_ON_APP_RE, text, [1]) ||
    matchesHandle(BARE_HANDLE_ON_APP_RE, text)
  ) {
    hits.push({ kind: "social_handle", confidence: "high", evidence: "app_handle" });
  } else if (!hasEmail && matchesHandle(AT_HANDLE_RE, text)) {
    hits.push({ kind: "social_handle", confidence: "high", evidence: "at_handle" });
  } else if (DISCORD_TAG_RE.test(text)) {
    hits.push({ kind: "social_handle", confidence: "high", evidence: "discord_tag" });
  } else if (
    matchesHandle(APP_ODD_HANDLE_RE, text) ||
    matchesHandle(HANDLE_ON_DOTTED_APP_RE, text, [1]) ||
    matchesHandle(SLANG_HANDLE_RE, text) ||
    USER_TAG_RE.test(text) ||
    // A capitalised name to look up ("find Ade Shop NG on Facebook"), not "find the latest styles on …".
    (named !== null && /^[A-Z]/.test(named[1]))
  ) {
    hits.push({ kind: "social_handle", confidence: "medium", evidence: "app_handle_disguised" });
  } else if ((word !== null && !NOT_A_HANDLE.has(word[1].toLowerCase())) || appThenWord(text)) {
    hits.push({ kind: "social_handle", confidence: "medium", evidence: "word_on_app" });
  } else if (!hasEmail && atHandle(text)) {
    hits.push({ kind: "social_handle", confidence: "medium", evidence: "handle" });
  }

  // The refuse tier, enforced in one place: only a literal datum stays "high".
  const clamp = () => {
    for (const hit of hits) {
      if (hit.confidence === "high" && !LITERAL_EVIDENCE.has(hit.evidence)) hit.confidence = "medium";
    }
  };
  clamp();

  // A messaging app named next to a number or a handle is the whole instruction —
  // as sure as that number or handle is, and never surer: a phrase next to an app
  // stays a phrase, and a reconstruction next to an app stays a reconstruction.
  let datum: ContactConfidence | null = null;
  for (const hit of hits) {
    if (hit.kind !== "phone" && hit.kind !== "social_handle") continue;
    if (hit.confidence === "low" || hit.evidence === "contact_elsewhere") continue;
    if (datum === null || CONFIDENCE_RANK[hit.confidence] > CONFIDENCE_RANK[datum]) datum = hit.confidence;
  }
  if (datum !== null) {
    for (const hit of hits) {
      if (hit.kind === "messaging_app" && CONFIDENCE_RANK[hit.confidence] < CONFIDENCE_RANK[datum]) {
        hit.confidence = datum;
        hit.evidence = "app_with_contact";
      }
    }
  }

  clamp();

  let highest: ContactConfidence | null = null;
  for (const hit of hits) {
    if (highest === null || CONFIDENCE_RANK[hit.confidence] > CONFIDENCE_RANK[highest]) {
      highest = hit.confidence;
    }
  }

  return { detected: hits.length > 0, hits, highest };
}
