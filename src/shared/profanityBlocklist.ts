// src/shared/profanityBlocklist.ts
//
// Words that should NEVER appear as a forced puzzle answer, target, or daily
// word — in Word Ladder, Anagrams, Furdle, or any other system-generated
// game. These words remain valid for player input (so a user can still type
// them as a guess or chain step if they choose).
//
// All entries are lowercase to match how words are stored across the app.

export const PROFANITY_BLOCKLIST: Set<string> = new Set([
  // 3-letter
  'ass', 'cum', 'fag', 'gay', 'tit',
  // 4-letter
  'anus', 'arse', 'butt', 'clit', 'cock', 'crap', 'cunt',
  'damn', 'dick', 'dike', 'dyke', 'fart', 'fuck', 'hell', 'homo',
  'jizz', 'kike', 'piss', 'poop', 'porn', 'pube', 'shit', 'slut',
  'smut', 'spic', 'turd', 'twat', 'wank',
  // 5-letter
  'bitch', 'boner', 'boobs', 'chink', 'cocks', 'cunts', 'dicks',
  'dykes', 'farts', 'fucks', 'negro', 'penis', 'porno', 'prick',
  'pubes', 'pussy', 'rapes', 'shits', 'spics', 'taint', 'titty',
  'twats', 'wanks', 'whore',
  // 6-letter
  'boners', 'faggot', 'fucked', 'fucker', 'hooker', 'jizzed',
  'pecker', 'pissed', 'pisser', 'pricks', 'rapist', 'slutty', 'whores',
  // 7-letter
  'asshole', 'asswipe', 'bastard', 'bitched', 'bitches', 'blowjob',
  'cumshot', 'dickish', 'fuckboy', 'fuckers', 'fucking', 'hookers',
  'pissing', 'rapists', 'scrotum', 'shitter', 'titties', 'whoring',
]);
