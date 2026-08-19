// src/shared/furyHistory.ts
//
// The cross-game history behind the "Your Fury" screen.
//
// ── Derived, never stored ───────────────────────────────────────────────────
// Nothing here is persisted. All eight games already keep their own daily
// history, so "how many of the eight did I clear on August 12" is a question
// their existing records can already answer — it just needed asking. This is
// the same rule dailyRitual.ts follows for "played today", extended backwards
// over time, and it means this screen cannot desync from the games it reports
// on and cannot corrupt a streak it only reads.
//
// ── The one file that knows all eight shapes ────────────────────────────────
// Mirrors the GAME_STATE pattern in dailyReminders.ts: one adapter per game,
// and this is the only module that has to know eight storage shapes at once.
// Every game keeps knowing only its own. Adding a ninth game means adding one
// adapter here and nothing else.

import { ALL_GAME_IDS, GAME_LABELS, type GameId } from './dailyReminders';

import { loadWordsmithDailyHistory } from '../wordbuilder/utils/storage';
import { loadWordleDailyHistory } from '../wordle/storage/wordleStorage';
import { loadHangmanDailyHistory } from '../hangman/utils/dailyChallenge';
import { loadWordGridDailyHistory } from '../wordgrid/utils/dailyChallenge';
import { loadWSDailyHistory } from '../wordsearch/utils/wsStorage';
import { loadLadderDailyHistory } from '../wordladder/utils/ladderStorage';
import { loadDailyHistory as loadHexHiveDailyHistory } from '../hexhive/utils/storage';
import { loadAnagramsDailyHistory } from '../anagrams/utils/anagramsStorage';

/** How one game's day reads on the cross-game screen. */
export interface FuryDayGameEntry {
  /**
   * Not every game has a win/lose state — Wordsmith and Word Grid are score
   * races — so 'played' is a first-class outcome, not a fallback.
   */
  result: 'won' | 'lost' | 'played';
  /** That game's own phrasing, e.g. "3/6 guesses" or "1,240 pts · 12 words". */
  detail: string;
}

export interface FuryDay {
  dateISO: string;
  /** How many of the eight were cleared. 0 is never rendered as a failure. */
  count: number;
  /** Only games with a record for this day appear. */
  games: Partial<Record<GameId, FuryDayGameEntry>>;
}

export type FuryHistory = Record<string, FuryDay>;

/**
 * A normalised view of one game's whole history: dateISO -> entry.
 *
 * Seven of the eight games already store exactly { dateISO, result, detail },
 * so their adapters are a pass-through. Hex Hive is the exception and gets
 * converted below.
 */
type NormalisedHistory = Record<string, FuryDayGameEntry>;

function passthrough(
  raw: Record<string, { result?: string; detail?: string } | undefined>,
): NormalisedHistory {
  const out: NormalisedHistory = {};
  for (const [dateISO, entry] of Object.entries(raw)) {
    if (!entry) continue;
    const result =
      entry.result === 'won' || entry.result === 'lost' ? entry.result : 'played';
    out[dateISO] = { result, detail: entry.detail ?? '' };
  }
  return out;
}

/**
 * One loader per game. Each returns that game's history already normalised, so
 * the merge below is shape-agnostic.
 */
const HISTORY_LOADERS: Record<GameId, () => Promise<NormalisedHistory>> = {
  wordsmith: async () => passthrough(await loadWordsmithDailyHistory()),
  furdle: async () => passthrough(await loadWordleDailyHistory()),
  hangman: async () => passthrough(await loadHangmanDailyHistory()),
  wordgrid: async () => passthrough(await loadWordGridDailyHistory()),
  wordsearch: async () => passthrough(await loadWSDailyHistory()),
  wordladder: async () => passthrough(await loadLadderDailyHistory()),

  // Hex Hive is the one outlier. It stores a structured record — score,
  // wordsFound/totalWords, rankName, fullyCleared — with no result or detail
  // field at all, so both are synthesised here for display.
  //
  // Normalising its stored shape to match the other seven would mean a
  // migration on a shipped storage key to gain nothing but tidiness, which is
  // a bad trade for a read-only screen. The adaptation stays at the read edge.
  hexhive: async () => {
    const raw = await loadHexHiveDailyHistory();
    const out: NormalisedHistory = {};
    for (const [dateISO, entry] of Object.entries(raw)) {
      if (!entry) continue;
      const words =
        typeof entry.wordsFound === 'number' && typeof entry.totalWords === 'number'
          ? `${entry.wordsFound}/${entry.totalWords} words`
          : '';
      const rank = entry.rankName ? String(entry.rankName) : '';
      out[dateISO] = {
        result: entry.fullyCleared ? 'won' : 'played',
        detail: [rank, words].filter(Boolean).join(' · '),
      };
    }
    return out;
  },

  anagrams: async () => passthrough(await loadAnagramsDailyHistory()),
};

/**
 * Merge all eight histories into one date-keyed map.
 *
 * A single game's storage failing degrades that game's rows to absent rather
 * than blanking the whole screen — the same defensive shape
 * loadDailyCompletionMap already uses. An empty day is indistinguishable from
 * a day before that game's history store existed, which is exactly why the UI
 * renders a zero-count day as neutral and never as a miss.
 */
export async function loadFuryHistory(): Promise<FuryHistory> {
  const perGame = await Promise.all(
    ALL_GAME_IDS.map(async (id) => {
      try {
        return [id, await HISTORY_LOADERS[id]()] as const;
      } catch (e) {
        console.warn(`loadFuryHistory: ${id} history unavailable`, e);
        return [id, {} as NormalisedHistory] as const;
      }
    }),
  );

  const merged: FuryHistory = {};
  for (const [id, history] of perGame) {
    for (const [dateISO, entry] of Object.entries(history)) {
      // Guard the key itself: a corrupt store shouldn't put junk dates on a
      // calendar. Anything that isn't YYYY-MM-DD is dropped.
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) continue;
      const day = merged[dateISO] ?? { dateISO, count: 0, games: {} };
      day.games[id] = entry;
      day.count += 1;
      merged[dateISO] = day;
    }
  }
  return merged;
}

export interface FuryTotals {
  /** Days with at least one daily completed. A floor, not a lifetime total. */
  daysPlayed: number;
  /** Every daily ever completed, across all eight games. */
  dailiesDone: number;
  /** Days where all eight were cleared, as visible in the history. */
  perfectDaysInHistory: number;
}

/**
 * Lifetime totals straight off the merged map.
 *
 * These are floors rather than true lifetime figures, because history only goes
 * back to whenever each game's history store shipped. The UI labels them
 * plainly so they can never contradict what the calendar shows.
 *
 * perfectDaysInHistory is deliberately separate from RitualState.perfectDays:
 * the stored counter is authoritative (it has counted every Perfect Day since
 * the ritual shipped), while this one is only what the histories can prove.
 * Showing the stored number and deriving this one keeps both honest instead of
 * quietly picking whichever is larger.
 */
export function summariseFuryHistory(history: FuryHistory): FuryTotals {
  let daysPlayed = 0;
  let dailiesDone = 0;
  let perfectDaysInHistory = 0;

  for (const day of Object.values(history)) {
    if (day.count > 0) daysPlayed += 1;
    dailiesDone += day.count;
    if (day.count >= ALL_GAME_IDS.length) perfectDaysInHistory += 1;
  }

  return { daysPlayed, dailiesDone, perfectDaysInHistory };
}

/** Display label for a game id, re-exported so the screen has one import. */
export function labelForGame(id: GameId): string {
  return GAME_LABELS[id];
}
