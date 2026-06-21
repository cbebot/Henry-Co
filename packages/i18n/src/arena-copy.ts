import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * ArenaCopy — i18n surface `surface:gaming` for V3-GAMING-01 (Henry Onyx Live).
 *
 * Pattern A typed-copy module (mirrors seller-academy-copy.ts): the EN baseline
 * is exhaustive; each non-en locale is a DeepPartial that deep-merges over EN, so
 * any missing key falls back to EN silently at runtime. ig/yo/ha/hi fall back to
 * English by design; the major locales carry the high-visibility strings, with
 * full localization tracked as a content follow-up.
 *
 * Brand label "Henry Onyx Live" is the gaming division name; it is sourced from
 * @henryco/config (getDivisionConfig("gaming").name) at call sites — the literal
 * here is only the EN copy fallback, not the brand source of truth.
 */
export type ArenaGameCopy = { name: string; description: string };

export type ArenaCopy = {
  metadata: { title: string; description: string };
  hero: {
    eyebrow: string;
    title: string;
    body: string;
    ctaPlay: string;
    ctaFairness: string;
  };
  lobby: {
    quickMatchTitle: string;
    quickMatchBody: string;
    chooseGame: string;
    findMatch: string;
    searching: string;
    liveMatchesLabel: string;
    winsLabel: string;
    ratingLabel: string;
    noLiveTitle: string;
    noLiveBody: string;
  };
  games: { "onyx-lines": ArenaGameCopy; "onyx-cards": ArenaGameCopy };
  match: {
    yourTurn: string;
    opponentTurn: string;
    waitingOpponent: string;
    youWon: string;
    youLost: string;
    tie: string;
    abandon: string;
    abandoned: string;
    seatYou: string;
    seatOpponent: string;
    shadowBid: string;
  };
  fairness: {
    title: string;
    body: string;
    verifyCta: string;
    commitmentLabel: string;
    revealedLabel: string;
    verified: string;
    failed: string;
    notReady: string;
    zeroRngNote: string;
  };
  leaderboard: {
    title: string;
    rank: string;
    player: string;
    rating: string;
    record: string;
    emptyTitle: string;
    emptyBody: string;
  };
  common: { play: string; games: string; leaderboard: string; fairPlay: string };
};

const ARENA_COPY_EN: ArenaCopy = {
  metadata: {
    title: "Henry Onyx Live",
    description:
      "Free-to-play, skill-based head-to-head matches with server-decided outcomes and a verifiable fairness proof on every game.",
  },
  hero: {
    eyebrow: "Henry Onyx Live",
    title: "Step into the arena.",
    body: "Original, skill-based games. Every move is decided by the server, and every match can be independently verified as fair. No stakes — just the play.",
    ctaPlay: "Find a match",
    ctaFairness: "How fair play works",
  },
  lobby: {
    quickMatchTitle: "Quick match",
    quickMatchBody: "Pick a game and we will pair you with an opponent of similar skill.",
    chooseGame: "Choose a game",
    findMatch: "Find a match",
    searching: "Finding an opponent…",
    liveMatchesLabel: "Live matches",
    winsLabel: "Wins",
    ratingLabel: "Rating",
    noLiveTitle: "No live matches yet",
    noLiveBody: "Start a quick match to play. Your results and ranking appear here.",
  },
  games: {
    "onyx-lines": {
      name: "Onyx Lines",
      description:
        "A perfect-information connection game with zero chance. Link your two edges before your opponent links theirs — pure strategy, no luck.",
    },
    "onyx-cards": {
      name: "Onyx Cards",
      description:
        "A simultaneous-selection duel over a shared, provably-fair prize track. Identical hands — the only variable is decision quality.",
    },
  },
  match: {
    yourTurn: "Your turn",
    opponentTurn: "Opponent's turn",
    waitingOpponent: "Waiting for your opponent…",
    youWon: "You won",
    youLost: "You lost",
    tie: "Tie",
    abandon: "Leave match",
    abandoned: "Match abandoned",
    seatYou: "You",
    seatOpponent: "Opponent",
    shadowBid: "Shadow bid (secretly double, once per match)",
  },
  fairness: {
    title: "Provably fair",
    body: "Before any move, the server publishes a sealed commitment to its random seed. After the match it reveals the seed — so anyone can confirm the deal was never rigged or changed mid-game.",
    verifyCta: "Verify this match",
    commitmentLabel: "Sealed commitment",
    revealedLabel: "Revealed seed",
    verified: "Verified fair",
    failed: "Verification failed",
    notReady: "Available when the match completes",
    zeroRngNote: "Onyx Lines uses no randomness at all — its fairness is self-evident from the move log.",
  },
  leaderboard: {
    title: "Leaderboard",
    rank: "Rank",
    player: "Player",
    rating: "Rating",
    record: "W / L / T",
    emptyTitle: "No ranked players yet",
    emptyBody: "Play a match to put yourself on the board.",
  },
  common: { play: "Play", games: "Games", leaderboard: "Leaderboard", fairPlay: "Fair play" },
};

// --- Per-locale overrides (deep-merge over EN). Missing keys fall back to EN. ---
// High-visibility strings for the major locales; ig/yo/ha/hi (+ remaining keys)
// fall back to English by design (full localization is a content follow-up).
const ARENA_COPY_FR: DeepPartial<ArenaCopy> = {
  hero: {
    eyebrow: "Henry Onyx Live",
    title: "Entrez dans l'arène.",
    ctaPlay: "Trouver un match",
    ctaFairness: "Le jeu équitable",
  },
  lobby: { quickMatchTitle: "Match rapide", findMatch: "Trouver un match", searching: "Recherche d'un adversaire…" },
  match: { yourTurn: "À vous de jouer", opponentTurn: "Au tour de l'adversaire", youWon: "Vous avez gagné", youLost: "Vous avez perdu", tie: "Égalité" },
  fairness: { title: "Équité prouvable", verifyCta: "Vérifier ce match", verified: "Équité vérifiée" },
  common: { play: "Jouer", games: "Jeux", leaderboard: "Classement", fairPlay: "Jeu équitable" },
};
const ARENA_COPY_ES: DeepPartial<ArenaCopy> = {
  hero: {
    eyebrow: "Henry Onyx Live",
    title: "Entra en la arena.",
    ctaPlay: "Buscar partida",
    ctaFairness: "Cómo funciona el juego justo",
  },
  lobby: { quickMatchTitle: "Partida rápida", findMatch: "Buscar partida", searching: "Buscando rival…" },
  match: { yourTurn: "Tu turno", opponentTurn: "Turno del rival", youWon: "Has ganado", youLost: "Has perdido", tie: "Empate" },
  fairness: { title: "Justicia comprobable", verifyCta: "Verificar esta partida", verified: "Justicia verificada" },
  common: { play: "Jugar", games: "Juegos", leaderboard: "Clasificación", fairPlay: "Juego justo" },
};
const ARENA_COPY_PT: DeepPartial<ArenaCopy> = {
  hero: { eyebrow: "Henry Onyx Live", title: "Entre na arena.", ctaPlay: "Encontrar partida", ctaFairness: "Como funciona o jogo justo" },
  lobby: { quickMatchTitle: "Partida rápida", findMatch: "Encontrar partida", searching: "Procurando oponente…" },
  match: { yourTurn: "Sua vez", opponentTurn: "Vez do oponente", youWon: "Você venceu", youLost: "Você perdeu", tie: "Empate" },
  fairness: { title: "Comprovadamente justo", verifyCta: "Verificar esta partida", verified: "Justiça verificada" },
  common: { play: "Jogar", games: "Jogos", leaderboard: "Classificação", fairPlay: "Jogo justo" },
};
const ARENA_COPY_DE: DeepPartial<ArenaCopy> = {
  hero: { eyebrow: "Henry Onyx Live", title: "Betritt die Arena.", ctaPlay: "Match finden", ctaFairness: "So funktioniert faires Spiel" },
  lobby: { quickMatchTitle: "Schnelles Match", findMatch: "Match finden", searching: "Gegner wird gesucht…" },
  match: { yourTurn: "Du bist dran", opponentTurn: "Gegner ist dran", youWon: "Gewonnen", youLost: "Verloren", tie: "Unentschieden" },
  fairness: { title: "Beweisbar fair", verifyCta: "Dieses Match prüfen", verified: "Fairness bestätigt" },
  common: { play: "Spielen", games: "Spiele", leaderboard: "Bestenliste", fairPlay: "Faires Spiel" },
};
const ARENA_COPY_IT: DeepPartial<ArenaCopy> = {
  hero: { eyebrow: "Henry Onyx Live", title: "Entra nell'arena.", ctaPlay: "Trova una partita", ctaFairness: "Come funziona il gioco equo" },
  lobby: { quickMatchTitle: "Partita rapida", findMatch: "Trova una partita", searching: "Ricerca avversario…" },
  match: { yourTurn: "Tocca a te", opponentTurn: "Turno dell'avversario", youWon: "Hai vinto", youLost: "Hai perso", tie: "Pareggio" },
  fairness: { title: "Equità dimostrabile", verifyCta: "Verifica questa partita", verified: "Equità verificata" },
  common: { play: "Gioca", games: "Giochi", leaderboard: "Classifica", fairPlay: "Gioco equo" },
};
const ARENA_COPY_AR: DeepPartial<ArenaCopy> = {
  hero: { eyebrow: "Henry Onyx Live", title: "ادخل الحلبة.", ctaPlay: "ابحث عن مباراة", ctaFairness: "كيف يعمل اللعب العادل" },
  lobby: { quickMatchTitle: "مباراة سريعة", findMatch: "ابحث عن مباراة", searching: "جارٍ البحث عن خصم…" },
  match: { yourTurn: "دورك", opponentTurn: "دور الخصم", youWon: "لقد فزت", youLost: "لقد خسرت", tie: "تعادل" },
  fairness: { title: "عدل قابل للإثبات", verifyCta: "تحقق من هذه المباراة", verified: "تم التحقق من العدالة" },
  common: { play: "العب", games: "الألعاب", leaderboard: "المتصدرون", fairPlay: "اللعب العادل" },
};
// zh / hi / ig / yo / ha — fall back to English for Pass 1 (content follow-up).
const ARENA_COPY_ZH: DeepPartial<ArenaCopy> = {};
const ARENA_COPY_HI: DeepPartial<ArenaCopy> = {};
const ARENA_COPY_IG: DeepPartial<ArenaCopy> = {};
const ARENA_COPY_YO: DeepPartial<ArenaCopy> = {};
const ARENA_COPY_HA: DeepPartial<ArenaCopy> = {};

const ARENA_LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<ArenaCopy>>> = {
  fr: ARENA_COPY_FR,
  es: ARENA_COPY_ES,
  pt: ARENA_COPY_PT,
  de: ARENA_COPY_DE,
  it: ARENA_COPY_IT,
  ar: ARENA_COPY_AR,
  zh: ARENA_COPY_ZH,
  hi: ARENA_COPY_HI,
  ig: ARENA_COPY_IG,
  yo: ARENA_COPY_YO,
  ha: ARENA_COPY_HA,
};

export function getArenaCopy(locale: AppLocale): ArenaCopy {
  const overrides = ARENA_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      ARENA_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as ArenaCopy;
  }
  return ARENA_COPY_EN;
}

/** @internal — tests/tooling only. */
export function __dangerouslyGetEnglishArenaCopy(): ArenaCopy {
  return ARENA_COPY_EN;
}
