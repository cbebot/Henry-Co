// ---------------------------------------------------------------------------
// deterministic/banned-goods.ts — restricted / illegal goods detection
//
// Categories cover Nigerian law (NAFDAC-controlled substances, firearms,
// wildlife) plus common international bans. A match is an UNAMBIGUOUS reject:
// these listings must never go live, and there is no benign reading of
// "kidney for sale" or "AK-47 for sale". A few benign compounds ("glue gun",
// "water gun") are guarded against to avoid false positives.
// ---------------------------------------------------------------------------

import type { DetectorVerdict, ModerationReason } from "../types";

interface BannedPattern {
  re: RegExp;
  category: string;
}

// Benign compounds that contain a weapon word but are ordinary products.
const BENIGN_GUN = /\b(glue|nail|water|spray|heat|staple|grease|caulk|toy|squirt|paintball|nerf|bb)\s+gun\b/i;

const BANNED: BannedPattern[] = [
  // ---- Controlled drugs ---------------------------------------------------
  { re: /\b(cocaine|crack\s+cocaine|heroin|fentanyl|methamphetamine|crystal\s+meth|\bmeth\b|mdma|ecstasy|\blsd\b|ketamine|\bpcp\b|\bmolly\b)\b/i, category: "drugs" },
  // Nigeria-specific OTC abuse / NAFDAC-controlled
  { re: /\b(tramadol|codeine\s+syrup|rohypnol|colorado\s+(weed|loud)|\bloud\b\s+(for\s+sale|plug)|\bskunk\b|igbo\s+(for\s+sale|plug))\b/i, category: "drugs" },
  { re: /\b(weed|marijuana|cannabis|kush|hash(ish)?)\s+(for\s+sale|plug|delivery|wholesale)\b/i, category: "drugs" },
  { re: /\b(buy|order|sell|supply)\s+(weed|marijuana|cannabis|cocaine|tramadol|codeine)\b/i, category: "drugs" },
  // ---- Firearms / weapons -------------------------------------------------
  { re: /\b(ak[-\s]?47|ar[-\s]?15|firearm|handgun|pistol|rifle|shotgun|revolver|\buzi\b)\b/i, category: "weapons" },
  { re: /\b(ammunition|\bammo\b|live\s+rounds?|silencer|suppressor|grenade|\bc4\b|dynamite|\btnt\b|explosive\s+device|pipe\s+bomb)\b/i, category: "weapons" },
  { re: /\b(brass\s+knuckles|switchblade|butterfly\s+knife|flick\s+knife|stun\s+gun|taser)\b/i, category: "weapons" },
  { re: /\bgun\b/i, category: "weapons" }, // last resort; guarded by BENIGN_GUN below
  // ---- Counterfeit --------------------------------------------------------
  { re: /\b(counterfeit|knock[-\s]?off|\breplica\b|\bfake\b\s+(designer|rolex|gucci|louis\s+vuitton|currency|notes?)|1:1\s+(copy|replica)|super\s+fake|aaa\s+replica)\b/i, category: "counterfeit" },
  // ---- Wildlife / endangered ---------------------------------------------
  { re: /\b(ivory|elephant\s+tusk|rhino\s+horn|pangolin\s+scales?|leopard\s+skin|tiger\s+(bone|skin)|endangered\s+species)\b/i, category: "wildlife" },
  // ---- Regulated medicine / body --------------------------------------------
  { re: /\b(human\s+(organ|kidney|liver)|kidney\s+for\s+sale|organ\s+(donor|trade|for\s+sale)|sell\s+(my\s+)?(kidney|organ))\b/i, category: "human_body" },
  { re: /\b(anabolic\s+steroids?|\bhgh\b\s+for\s+sale|prescription\s+(drugs?|meds?)\s+(no\s+rx|without\s+prescription)|viagra\s+no\s+prescription)\b/i, category: "regulated_medicine" },
  // ---- Illicit digital / identity ----------------------------------------
  { re: /\b(fake\s+(id|passport|driver'?s?\s+licen[cs]e)|stolen\s+(cards?|goods|accounts?)|credit\s+card\s+(dumps?|numbers?)|\bfullz\b|hacked\s+accounts?|\bcvv\s+(shop|for\s+sale)|bank\s+logs?\s+for\s+sale)\b/i, category: "illicit_digital" },
];

/**
 * Detect restricted / banned goods in listing text.
 * Pure + deterministic. Returns an unambiguous reject on any category hit.
 */
export function detectBannedGoods(text: string, _locale = "en"): DetectorVerdict {
  const body = text || "";
  const categories = new Set<string>();

  for (const { re, category } of BANNED) {
    re.lastIndex = 0;
    if (re.test(body)) {
      // guard the bare "gun" pattern against benign compounds
      if (category === "weapons" && re.source === "\\bgun\\b" && BENIGN_GUN.test(body)) {
        continue;
      }
      categories.add(category);
    }
  }

  if (categories.size === 0) {
    return { decision: "approve", reasons: [], severity: "low", unambiguous: false, detail: [] };
  }

  const reasons: ModerationReason[] = ["banned_goods"];
  return {
    decision: "reject",
    reasons,
    severity: "critical",
    unambiguous: true,
    detail: [...categories],
  };
}
