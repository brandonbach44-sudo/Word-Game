// src/shared/wordReports.ts
//
// Quietly collects words a player tried that the dictionary rejected, so a real
// word missing from the list becomes something you find out about instead of
// something a player silently gives up on.
//
// ── Nothing happens during play ─────────────────────────────────────────────
// The rejection behaves exactly as it always has: same shake, same haptic, same
// message. This module only writes to storage. There is no popup, no toast, and
// nothing to dismiss mid-word — the moment someone is mid-puzzle is the worst
// possible time to ask them to file a bug report.
//
// ── Why one cross-game list and not one per game ────────────────────────────
// src/shared/words.ts is the dictionary for Word Grid, Hex Hive, Wordsmith and
// Word Ladder alike, so a word missing in one is missing in all of them. Eight
// separate lists would model the app's structure rather than the actual problem,
// and would ask the player the same question up to eight times about one gap.
// One list, one prompt, at the scope the dictionary actually lives at — the same
// reasoning that keeps Streak Skips on the home screen and off game menus.
//
// ── Only plausible words ────────────────────────────────────────────────────
// The value of this is entirely in its signal-to-noise. A list dominated by
// keyboard mashing is a list nobody reads, so the bar to be recorded is
// deliberately high (see isPlausibleReport).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PROFANITY_BLOCKLIST } from './profanityBlocklist';
import { GAME_LABELS, getTodayISODate, type GameId } from './dailyReminders';

const REPORTS_KEY = 'wordfury_word_reports_v1';

/**
 * Below four letters this is mostly noise: three-letter attempts are usually
 * someone probing the minimum length rather than proposing a real word, and
 * short strings are what random swiping produces.
 */
const MIN_LENGTH = 4;

/**
 * Long enough to be worth a look, short enough that the list stays readable and
 * the storage stays tiny. Oldest entries fall off the end.
 */
const MAX_STORED = 30;

export interface WordReport {
  word: string;
  /** Which game it was tried in — the same word can be missing everywhere. */
  gameId: GameId;
  dateISO: string;
}

interface ReportStore {
  reports: WordReport[];
  /** Guards the prompt so it's offered at most once a day. */
  lastOfferedDateISO: string;
}

const EMPTY: ReportStore = { reports: [], lastOfferedDateISO: '' };

async function loadStore(): Promise<ReportStore> {
  try {
    const raw = await AsyncStorage.getItem(REPORTS_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.reports)) return { ...EMPTY };
    return { ...EMPTY, ...parsed };
  } catch (e) {
    console.warn('loadStore (wordReports) error', e);
    return { ...EMPTY };
  }
}

async function saveStore(store: ReportStore): Promise<void> {
  try {
    await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn('saveStore (wordReports) error', e);
  }
}

/**
 * The bar for being worth reporting at all.
 *
 * Everything here exists to keep the list readable. A report list full of
 * QWERTY fragments is one nobody opens, at which point the whole feature is
 * just storage that never pays off.
 */
export function isPlausibleReport(word: string): boolean {
  const w = word.trim().toUpperCase();
  if (w.length < MIN_LENGTH) return false;
  // Letters only. Rules out anything that came from a stray character.
  if (!/^[A-Z]+$/.test(w)) return false;
  // A word with no vowel (and no Y standing in for one) is almost never a real
  // word and is exactly what a random swipe across a grid produces. This does
  // throw away the rare genuine case — CRWTH is a real word and fails here —
  // but the filter's whole job is signal-to-noise, and a list nobody reads
  // because it's full of swipe fragments helps nobody.
  if (!/[AEIOUY]/.test(w)) return false;
  // Three of the same letter in a row is not English.
  if (/(.)\1\1/.test(w)) return false;
  // Never collect profanity, even to report it.
  if (PROFANITY_BLOCKLIST.has(w.toLowerCase())) return false;
  return true;
}

/**
 * Note a rejected word. Safe to call on every rejection: implausible words are
 * dropped, duplicates are ignored, and it never throws into the game loop.
 *
 * Deliberately fire-and-forget — a game's rejection path must not wait on
 * storage to give the player their feedback.
 */
export function recordRejectedWord(gameId: GameId, word: string): void {
  const w = word.trim().toUpperCase();
  if (!isPlausibleReport(w)) return;

  (async () => {
    try {
      const store = await loadStore();
      // Same word in the same game twice is one gap, not two.
      if (store.reports.some((r) => r.word === w && r.gameId === gameId)) return;
      const reports = [...store.reports, { word: w, gameId, dateISO: getTodayISODate() }];
      // Keep the newest MAX_STORED.
      await saveStore({
        ...store,
        reports: reports.slice(-MAX_STORED),
      });
    } catch (e) {
      console.warn('recordRejectedWord error', e);
    }
  })();
}

export interface PendingReports {
  reports: WordReport[];
  /**
   * True when there is something to report AND we haven't already asked today.
   * The prompt is worth showing once; asking twice is nagging.
   */
  shouldOffer: boolean;
}

export async function loadPendingReports(): Promise<PendingReports> {
  const store = await loadStore();
  return {
    reports: store.reports,
    shouldOffer: store.reports.length > 0 && store.lastOfferedDateISO !== getTodayISODate(),
  };
}

/**
 * Records that the player has been asked today, whether or not they sent
 * anything. Declining must not put the same question back tomorrow morning.
 */
export async function markReportsOffered(): Promise<void> {
  const store = await loadStore();
  await saveStore({ ...store, lastOfferedDateISO: getTodayISODate() });
}

/** Called after a successful send, so the same words aren't reported twice. */
export async function clearWordReports(): Promise<void> {
  const store = await loadStore();
  await saveStore({ ...store, reports: [], lastOfferedDateISO: getTodayISODate() });
}

/**
 * The message body for the feedback form. Grouped by game so a gap that shows
 * up in several games is visible as exactly that.
 */
export function buildReportMessage(reports: WordReport[]): string {
  const byGame = new Map<GameId, string[]>();
  for (const r of reports) {
    const list = byGame.get(r.gameId) ?? [];
    list.push(r.word);
    byGame.set(r.gameId, list);
  }
  const lines = ['These words were rejected but look like real words:', ''];
  for (const [gameId, words] of byGame) {
    lines.push(`${GAME_LABELS[gameId]}: ${words.join(', ')}`);
  }
  return lines.join('\n');
}
