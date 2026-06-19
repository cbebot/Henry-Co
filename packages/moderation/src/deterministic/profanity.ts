// ---------------------------------------------------------------------------
// deterministic/profanity.ts — locale-aware hate-speech + profanity detection
//
// Two tiers:
//   • hate-speech (slurs + group-targeted incitement)  -> UNAMBIGUOUS reject
//   • borderline profanity                             -> hold (human review)
//
// This is a SEED lexicon, deliberately compact and clearly categorised. In
// production it is augmented by an authority-maintained hate-speech list per
// market; the detection MECHANISM (locale routing, obfuscation normalisation,
// word-boundary vs substring matching) is the durable part. No raw user text
// is ever logged from here — it returns reason codes + matched-category labels.
// ---------------------------------------------------------------------------

import type { DetectorVerdict, ModerationReason, ModerationSeverity } from "../types";

/** Languages written without inter-word spaces use substring matching. */
const SUBSTRING_LOCALES = new Set(["zh", "ja", "th"]);

/** Anything outside Basic Latin + Latin-1/Extended is treated as non-latin. */
const NON_LATIN = /[^ -ɏ]/;

/**
 * Normalise text to defeat the cheapest obfuscation: case, accents, and the
 * common leet substitutions. Intentionally conservative — it must not turn
 * clean words into matches.
 */
export function normalizeForLexicon(input: string): string {
  let s = input.toLowerCase();
  // strip combining diacritics (café -> cafe) for latin-script matching
  s = s.normalize("NFKD").replace(/[̀-ͯ]/g, "");
  // collapse the most common leetspeak
  s = s
    .replace(/[@4]/g, "a")
    .replace(/0/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/3/g, "e")
    .replace(/[$5]/g, "s")
    .replace(/7/g, "t");
  // collapse runs of repeated letters (shiiit -> shit)
  s = s.replace(/([a-z])\1{2,}/g, "$1$1");
  return s;
}

/** Per-locale lexicon. `reject` = hate/slur (block); `hold` = profanity (review). */
interface LocaleLexicon {
  reject: string[];
  hold: string[];
}

// Universal terms applied regardless of locale (English-dominant internet + brands).
const UNIVERSAL: LocaleLexicon = {
  // A restrained seed of unambiguous English slurs. Kept short on purpose; the
  // authority list expands this. Matched on word boundaries after normalisation.
  reject: ["nigger", "faggot", "kike", "chink", "spic", "tranny", "retard"],
  hold: ["fuck", "shit", "bitch", "asshole", "bastard", "cunt", "dick", "whore"],
};

// Locale-specific seeds (1-3 terms each; expand via authority list).
const LEXICON: Record<string, LocaleLexicon> = {
  en: { reject: [], hold: ["wanker", "bollocks"] },
  fr: { reject: ["pede", "negre"], hold: ["merde", "putain", "salope"] },
  es: { reject: ["maricon", "sudaca"], hold: ["mierda", "puta", "cabron"] },
  pt: { reject: ["viado", "macaco preto"], hold: ["merda", "puta", "caralho"] },
  de: { reject: ["judensau", "kanake"], hold: ["scheisse", "schlampe"] },
  it: { reject: ["frocio", "negro di merda"], hold: ["merda", "stronzo", "puttana"] },
  ig: { reject: [], hold: ["nsi"] },
  yo: { reject: [], hold: ["ole jati"] },
  ha: { reject: [], hold: ["dan iska"] },
  ar: { reject: ["khawal"], hold: ["sharmuta", "kuss"] },
  hi: { reject: [], hold: ["bhenchod", "madarchod", "chutiya"] },
  zh: { reject: [], hold: ["他妈的", "傻屄", "贱人"] },
};

/**
 * Group-targeted hate / incitement constructs (locale-agnostic English seed).
 * These catch hate framed without a slur ("all <group> should die").
 */
const HATE_CONSTRUCTS: RegExp[] = [
  /\b(kill|gas|exterminate|lynch|behead)\s+(all\s+)?(the\s+)?\w+s?\b/i,
  /\b(all|every)\s+\w+s?\s+(should|must|deserve\s+to)\s+(die|burn|hang|be\s+killed)\b/i,
  /\b(go\s+back\s+to\s+your\s+country|subhuman|inferior\s+race|master\s+race)\b/i,
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchTerms(normalized: string, locale: string, terms: string[]): string[] {
  const hits: string[] = [];
  const substring = SUBSTRING_LOCALES.has(locale);
  for (const raw of terms) {
    const term = normalizeForLexicon(raw);
    if (!term) continue;
    if (substring || NON_LATIN.test(term)) {
      // non-latin script (CJK/Arabic/Devanagari) — substring match
      if (normalized.includes(term)) hits.push(raw);
    } else {
      const re = new RegExp(`(?:^|[^a-z])${escapeRegex(term)}(?:$|[^a-z])`, "i");
      if (re.test(` ${normalized} `)) hits.push(raw);
    }
  }
  return hits;
}

/**
 * Detect hate speech (reject) and profanity (hold) in `text` for `locale`.
 * Pure: no I/O, deterministic. Returns reason codes + category labels only.
 */
export function detectProfanity(text: string, locale = "en"): DetectorVerdict {
  const lang = (locale || "en").slice(0, 2).toLowerCase();
  const normalized = normalizeForLexicon(text || "");
  const reasons: ModerationReason[] = [];
  const detail: string[] = [];
  let severity: ModerationSeverity = "low";

  const localeLex = LEXICON[lang];
  const rejectTerms = [...UNIVERSAL.reject, ...(localeLex?.reject ?? [])];
  const holdTerms = [...UNIVERSAL.hold, ...(localeLex?.hold ?? [])];

  const hateHits = matchTerms(normalized, lang, rejectTerms);
  const constructHit = HATE_CONSTRUCTS.some((re) => re.test(text || ""));

  if (hateHits.length > 0 || constructHit) {
    reasons.push("hate_speech");
    detail.push(...hateHits);
    if (constructHit) detail.push("hate_construct");
    return {
      decision: "reject",
      reasons,
      severity: "critical",
      unambiguous: true,
      detail,
    };
  }

  const profanityHits = matchTerms(normalized, lang, holdTerms);
  if (profanityHits.length > 0) {
    reasons.push("profanity");
    detail.push(...profanityHits);
    severity = "medium";
    return {
      decision: "hold",
      reasons,
      severity,
      unambiguous: false,
      detail,
    };
  }

  return { decision: "approve", reasons, severity, unambiguous: false, detail };
}
