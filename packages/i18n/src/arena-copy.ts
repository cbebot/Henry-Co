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
  goalStrip: { linesOnyx: string; linesAlabaster: string; cards: string };
  practice: {
    cta: string;
    body: string;
    pickGame: string;
    difficultyLabel: string;
    gentle: string;
    gentleBody: string;
    even: string;
    evenBody: string;
    sharp: string;
    sharpBody: string;
    start: string;
    vsAi: string;
    thinking: string;
    newGame: string;
    liveSoon: string;
    youAreOnyx: string;
    backToArena: string;
  };
  coach: {
    title: string;
    learnCta: string;
    replay: string;
    next: string;
    back: string;
    done: string;
    skip: string;
    linesSteps: { title: string; body: string }[];
    cardsSteps: { title: string; body: string }[];
  };
  rules: {
    "onyx-lines": {
      goalOnyx: string;
      goalAlabaster: string;
      howToConnect: string;
      exactlyOne: string;
      bridges: string;
      vein: string;
      swap: string;
      fracture: string;
      strategy: string[];
    };
    "onyx-cards": {
      goal: string;
      identicalHands: string;
      prizeOrder: string;
      effectiveValue: string;
      facetBonus: string;
      veinCarry: string;
      shadowBid: string;
      strategy: string[];
    };
  };
  hints: {
    linesBlock: string;
    linesSwap: string;
    linesFracture: string;
    linesYourTurn: string;
    cardsPrize: string;
    cardsHoldShadow: string;
  };
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
  goalStrip: {
    linesOnyx: "You're ◆ Onyx — link the TOP and BOTTOM edges before your opponent links theirs.",
    linesAlabaster: "You're ◇ Alabaster — link the LEFT and RIGHT edges before your opponent links theirs.",
    cards: "Win the most prize value across 10 rounds. Identical hands — only your choices differ.",
  },
  practice: {
    cta: "Practice vs the Onyx AI",
    body: "Play instantly against an on-device opponent. No waiting, no stakes — learn the game by playing it.",
    pickGame: "Choose a game to practice",
    difficultyLabel: "Difficulty",
    gentle: "Gentle",
    gentleBody: "A forgiving opponent for your first games.",
    even: "Even",
    evenBody: "Plays a solid, honest game.",
    sharp: "Sharp",
    sharpBody: "Calculates hard — bring your best.",
    start: "Start practice",
    vsAi: "Onyx AI",
    thinking: "Onyx AI is thinking…",
    newGame: "New game",
    liveSoon: "Live matches against real players are coming soon — practice now to be ready.",
    youAreOnyx: "You play first, as Onyx.",
    backToArena: "Back to the arena",
  },
  coach: {
    title: "How to play",
    learnCta: "Learn how to win",
    replay: "Replay the walkthrough",
    next: "Next",
    back: "Back",
    done: "Got it",
    skip: "Skip",
    linesSteps: [
      {
        title: "Your goal",
        body: "You are Onyx. Build an unbroken chain of your stones from the top edge to the bottom edge. Your opponent, Alabaster, is racing to link left to right.",
      },
      {
        title: "How stones connect",
        body: "Each stone touches its six neighbours. A connection follows those links — straight or diagonal — all the way across the board.",
      },
      {
        title: "Someone always wins",
        body: "When the board fills, exactly one of you will have connected — draws are impossible. So every stone you place to advance also blocks your opponent.",
      },
      {
        title: "Bridges win races",
        body: "Two of your stones a short step apart, with two empty links between them, form a bridge: your opponent can't cut both at once. Bridges let you cross faster than a solid line.",
      },
      {
        title: "The twists",
        body: "Grey 'vein' cells are neutral walls — route around them. Swap: if the opener plays too strong, the second player may claim that stone. Fracture: once per game, turn an opponent stone that touches two of yours into a wall.",
      },
      {
        title: "How to win",
        body: "Play toward the centre first, advance with bridges, and make every move sit on your opponent's shortest path. Save your fracture for the move that breaks their winning link.",
      },
    ],
    cardsSteps: [
      {
        title: "Your goal",
        body: "Win the most total prize value over 10 rounds. Both players hold the same hand — cards 1 to 10 — so there is no luck of the draw.",
      },
      {
        title: "Each round",
        body: "You both secretly commit one card. The higher card wins that round's prize. Both cards are spent either way, so choose what each prize is worth to you.",
      },
      {
        title: "The prize track",
        body: "Every prize and its order is public from the start — and provably fair. Plan ahead: which prizes will you fight for, and which will you let go?",
      },
      {
        title: "Carry and facet bonus",
        body: "Tie a round and nobody wins — the prize carries onto the next round, making it bigger. Win with a card whose facet matches the prize's facet for bonus points.",
      },
      {
        title: "The shadow bid",
        body: "Once per match you may shadow-bid: secretly double your committed card. It's revealed only if you lose — a hidden way to steal a key prize.",
      },
      {
        title: "How to win",
        body: "Spend high cards on high prizes and dump low cards on low ones. Watch the carry, chase facet matches, and hold your shadow bid for the prize that swings the match.",
      },
    ],
  },
  rules: {
    "onyx-lines": {
      goalOnyx: "Link the top and bottom edges with your stones.",
      goalAlabaster: "Link the left and right edges with your stones.",
      howToConnect: "Stones connect to their six touching neighbours; a path may run straight or diagonally.",
      exactlyOne: "No draws: when the board fills, exactly one player has connected.",
      bridges: "A bridge — two stones a step apart with two empty links — can't be cut, so it's a safe fast connection.",
      vein: "The grey vein cells are fixed neutral walls. Route around them.",
      swap: "Pie rule: the second player may claim the opener's first stone, so open modestly.",
      fracture: "Once per game, fracture an opponent stone that touches two of yours into a neutral wall.",
      strategy: [
        "Take the centre early — central stones touch more paths.",
        "Advance with bridges to move two steps safely.",
        "Make every move both extend your line and block theirs.",
        "Hold your fracture for the move that breaks their connection.",
      ],
    },
    "onyx-cards": {
      goal: "Win the most prize value across 10 rounds.",
      identicalHands: "Both players hold cards 1–10 — only your decisions differ.",
      prizeOrder: "The prize order is public and provably fair from the start.",
      effectiveValue: "The higher committed card wins the round; both cards are spent.",
      facetBonus: "Win with a facet that matches the prize for bonus points.",
      veinCarry: "Equal commits award nothing — the prize carries to the next round.",
      shadowBid: "Once per match, secretly double a card; revealed only on a loss.",
      strategy: [
        "Spend high cards on high-value prizes.",
        "Dump low cards on prizes you're willing to lose.",
        "Watch the carry — a tie makes the next prize worth chasing.",
        "Save your shadow bid for a match-swinging prize.",
      ],
    },
  },
  hints: {
    linesBlock: "⚠ Block {cell} — your opponent connects next turn.",
    linesSwap: "You can swap: claim the opening stone as your own.",
    linesFracture: "Fracture is available — you can break a stone that touches two of yours.",
    linesYourTurn: "Your move. Extend toward your edges and block theirs.",
    cardsPrize: "This prize is worth {value} now.",
    cardsHoldShadow: "A big prize — consider your one shadow bid.",
  },
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
