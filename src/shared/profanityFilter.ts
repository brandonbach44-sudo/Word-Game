// src/shared/profanityFilter.ts
//
// Shared blocklist applied only at the SELECTION layer — i.e. whenever a
// generator is choosing which word to actually show/target in a puzzle
// (Furdle's daily solution, Word Ladder's start/end/path, Word Grid's
// placed words, Anagrams' target word). It is deliberately NOT applied to
// broad guess-validation dictionaries (VALID_WORDS / VALID_GUESSES) — a
// player typing a word during play should still get normal "not a word"
// behavior instead of a confusing false rejection, exactly like NYT Wordle
// separates its curated solution list from its much larger valid-guess list.
//
// This is an exact-match list (not substring matching) on purpose: substring
// matching would false-positive on innocuous words that merely contain a
// blocked root (e.g. "shitake", "assassin", "classic", "scunthorpe"), which
// is worse than missing an obscure inflected form.

const BLOCKED_WORDS: string[] = [
  // strongest profanity + common inflections
  'fuck', 'fucks', 'fucked', 'fucking', 'fucker', 'fuckers', 'fuckup', 'fuckups',
  'shit', 'shits', 'shitty', 'shite', 'shitty', 'bullshit',
  'bitch', 'bitches', 'bitched', 'bitching', 'bitchy',
  'cunt', 'cunts',
  'cock', 'cocks',
  'dick', 'dicks', 'dicky',
  'pussy', 'pussies',
  'whore', 'whores', 'whoring',
  'slut', 'sluts', 'slutty',
  'twat', 'twats',
  'wank', 'wanker', 'wankers', 'wanking',
  'bastard', 'bastards',
  'asshole', 'assholes',
  'douche', 'douchebag', 'douchebags',
  'crap', 'crappy',
  'piss', 'pissed', 'pissing',
  'cum', 'cums', 'cumming',
  'jizz',
  'boner', 'boners',
  'nigger', 'niggers', 'nigga', 'niggas',
  'faggot', 'faggots', 'fag', 'fags',
  'retard', 'retards', 'retarded',
  'spic', 'spics', 'chink', 'chinks', 'gook', 'gooks', 'kike', 'kikes',
  'tranny', 'trannies',
  'rape', 'raped', 'raping', 'rapist', 'rapists',
  'molest', 'molested', 'molesting', 'molester',
  'incest',
  'suicide',
  'orgasm', 'orgasms',
  'penis', 'penises',
  'vagina', 'vaginas',
  'anal',
  'porn', 'porno', 'pornos',
  'semen',
];

export const PROFANITY_BLOCKLIST: Set<string> = new Set(BLOCKED_WORDS.map((w) => w.toLowerCase()));

export function isBlockedWord(word: string): boolean {
  return PROFANITY_BLOCKLIST.has(word.toLowerCase());
}

/** Filters a word pool, dropping anything on the blocklist. Case-preserving on the output. */
export function filterProfanity<T extends string>(words: T[]): T[] {
  return words.filter((w) => !PROFANITY_BLOCKLIST.has(w.toLowerCase()));
}
