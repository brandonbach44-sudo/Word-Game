# Word Lists Audit

Snapshot as of 2026-07-10. Covers every word-list data file in `src/`, which games use it, and what shape it's in.

## TL;DR

- **9 list files exist. Only 7 are actually used.** `wordgrid/data/wordlist.ts` and `hangman/data/dailyWords.ts` are dead code.
- **2 shared master dictionaries** (`shared/words.ts`, `shared/words_long.ts`) back 5 games' validation logic.
- **4 games have their own dedicated lists**: Wordle, Hangman, Word Search, and Word Grid's board-generation pool (`commonWords.ts`).
- No game currently filters profanity — confirmed that's intentional per your call.

## Live lists

### 1. `shared/words.ts` — `VALID_WORDS`
- **40,924 words, unique, lowercase, 3–8 letters.**
- Source comment: Collins Scrabble Words filtered by real-world frequency (wordfreq), plus supplements (months, days, planets, languages, zodiac, mythology).
- **Role:** the master "is this a real word" validator.
- **Used by:** Anagrams (validate scrambled solutions), Word Builder (validate tile words), Word Grid (validate player-found words), Word Ladder (build the word graph), Hex Hive (combined with words_long).

### 2. `shared/words_long.ts` — `LONG_VALID_WORDS`
- **13,560 words, unique, lowercase, 9–15 letters.** Zero overlap with `shared/words.ts` (clean length split).
- **Role:** extension of the master dictionary for long words.
- **Used by:** Hex Hive only (needed for pangrams/long finds — its combined dictionary is 3–15 letters).
- Nothing else currently imports this. If any other game wants long-word support later, this is the file to reuse.

### 3. `wordgrid/data/commonWords.ts` — default export
- **4,711 words, unique, 3–7 letters, no Q/X/Z/J.**
- Source comment: `google-10000-english-usa-no-swears`, filtered to game dictionary.
- **Role:** a *board-generation seed pool* — different job than `shared/words.ts`. It's the "common enough that a casual player will actually find it" list, not the validator.
- **Used by:** Word Grid (seeds the grid + guarantees findable words), Anagrams (source pool for puzzle words, filtered by length).
- Note: 2 of its 4,711 words are **not** present in `shared/words.ts`. Since Word Grid validates finds against `shared/words.ts`, those 2 words could theoretically get placed on a board but rejected if a player finds them. Worth fixing — I'll flag the exact 2 words when we get to cleanup.

### 4. `wordle/data/wordle_words.ts` — DEEP-CLEANED 2026-07-10
- **`SOLUTIONS`: 1,229 words** (was 1,291), unique, 5 letters, uppercase. Curated "could be today's answer" pool.
- **`VALID_GUESSES`: 14,851 words** (was 14,855), unique, 5 letters, uppercase. Every solution is also a valid guess (confirmed, 0 missing).
- **Role:** fully self-contained, not shared with any other game.
- **Used by:** Wordle only.
- **What changed:**
  - Cross-checked against the original public Wordle word lists (two independent sources, byte-identical) — confirmed `VALID_GUESSES` was already an exact match to the authoritative 14,855-word list. No junk/non-words found.
  - Filtered `SOLUTIONS` to common words only using word-frequency data (zipf ≥ 2.3), removing 62 obscure entries (e.g. "JOLTY", "RIFFY", "SHIRR", "TUMID", "JAGGY", "LATKE", "UNPIN", "ORATE"). 1,229 solid, guessable answers remain.
  - Removed 4 genuine ethnic slurs from `VALID_GUESSES` (found via cross-reference with a standard content-moderation blocklist): COONS, NEGRO, NIGGA, PIKEY. None were in `SOLUTIONS`.
  - Kept "GROPE" and "HORNY" in `SOLUTIONS` per your call — crude/suggestive but not slurs or curse words, consistent with the app's profanity-allowed policy.

### 5. `hangman/data/words.ts`
- Not a flat list — a **category system**, mixed case, includes multi-word phrases.
- `WORD_CATEGORIES` (16 categories, 1,618 words total): Animals, Countries, Foods, Sports Teams, US Capitals, Technology, Dinosaurs, Superheroes, Cat Breeds, Dog Breeds, Space, Clothing, Games, Landmarks, Occupations, Idioms.
- `songTitles` (177), `movieTitles` (323), `tvShowTitles` (166) — feed into `PHRASE_CATEGORIES` alongside Idioms.
- **Role:** self-contained category+phrase source for Hangman's category-select mode.
- **Used by:** Hangman only.

### 6. `wordsearch/data/themes.ts`
- **18 themed categories** (~1,150 words total): animals, sports, countries, space, food, music, ocean, weather, nature, holidays, cities, technology, body, movies, tv_shows, video_games, music_artists, superheroes.
- Own stated rules in the file header: single words only, max 10 letters, min 3 letters, ~20–25 per theme.
- **Used by:** Word Search only.

### 7. `hexhive/utils/dictionary.ts`
- Not a data file itself — combines `shared/words.ts` + `shared/words_long.ts` into one `Set` (`HEXHIVE_WORDS`, 3–15 letters). No independent content to audit.

## Deleted (2026-07-10)

### `wordgrid/data/wordlist.ts` — 80,272 words, 3–8 letters — DELETED
Zero imports anywhere in `src/`. 36,698 of its words overlapped with `shared/words.ts` — looked like an earlier, unfiltered full dictionary `shared/words.ts` was curated down from. Confirmed unused, removed.

### `hangman/data/dailyWords.ts` — stub, 0 real entries — DELETED
Never imported anywhere. Was scaffolding for a "Word of the Day" offline mode that never got wired in. Confirmed unused, removed — this can be rebuilt properly whenever that mode gets scheduled for real.

## Overlap / consistency notes
- `shared/words.ts` and `shared/words_long.ts` don't overlap — clean split at the 8/9-letter boundary.
- `commonWords.ts` isn't a perfect subset of `shared/words.ts` (2 stray words) — will fix during cleanup.
- Casing is inconsistent across files by design (lowercase for the two shared dictionaries, uppercase for Wordle and Word Search, mixed/title case for Hangman) — not a bug, just worth knowing before writing any cross-file tooling.
- No file currently applies a profanity filter — confirmed intentional, not flagging as an issue.

## Completed (2026-07-10)
1. Deleted `wordgrid/data/wordlist.ts` (dead) and `hangman/data/dailyWords.ts` (unwired stub) — both confirmed unused.
2. Deep-cleaned Wordle: `SOLUTIONS` 1,291→1,229 (obscurity filter), `VALID_GUESSES` 14,855→14,851 (4 slurs removed).
3. Fixed `commonWords.ts` — removed "eau" and "louis" (not in validator dict), now a strict subset of `shared/words.ts` (4,709 words).
4. Word Search `themes.ts` — fixed stale header docs (actually 60 words/theme, max 12 letters, not 20-25/max 10), fixed 3 content bugs: garbled "MSSTEEL"→"MSMARVEL", "WONDER"→"WONDERWOMAN", off-theme "WAKANDA" (a place, not a movie)→"DEADPOOL".
5. Hangman `words.ts` — removed 9 duplicate entries (7 duplicate idioms, 2 near-duplicate idiom phrasings, 1 duplicate "Seinfeld" in TV shows). 16 word categories, song/movie/TV title lists otherwise clean, no other dupes or malformed entries.
6. Shared master dictionaries — the big one:
   - `shared/words.ts`: 40,924 → 34,451 words. Removed 15 genuine slurs (negro, nigger, kike, spic, wetback, faggot, fag, coon, coons, darkie, mong, spastic, poof, shemale, jailbait). Trimmed obscure entries to zipf≥2.0 (~6,500 removed — e.g. "abaft", "abjure", "acari"). Left all profanity/crude-but-not-slur words alone per your policy (fuck, shit, ass, etc. — these are opt-in discoveries in word games, not force-fed).
   - `shared/words_long.ts`: 13,560 → 11,672 words. Same zipf≥2.0 cutoff (was previously 1.8).
   - **Caught and fixed a knock-on bug before it shipped:** Hex Hive's 500 pre-generated daily puzzles (`hexhive/data/puzzles.ts`) each depend on a specific 7-letter pangram existing in the dictionary. The obscurity trim broke 55 of them (11%) — their pangram word got filtered out, meaning those days would've had *no* pangram to find at all. Restored those 43 (short list) + 12 (long list) specific words below the general cutoff, scoped only to preserving those puzzles. Re-verified: all 500 puzzles now have ≥1 pangram and a healthy word count. Also refreshed the stale `wordCount` reference field on every puzzle entry to match the new dictionary.

## Snapshot of all lists after cleanup
| List | Games | Before | After |
|---|---|---|---|
| `shared/words.ts` | Anagrams, Word Builder, Word Grid, Word Ladder, Hex Hive | 40,924 | 34,451 |
| `shared/words_long.ts` | Hex Hive | 13,560 | 11,672 |
| `wordgrid/data/commonWords.ts` | Word Grid, Anagrams | 4,711 | 4,709 |
| `wordle/data/wordle_words.ts` (SOLUTIONS) | Wordle | 1,291 | 1,229 |
| `wordle/data/wordle_words.ts` (VALID_GUESSES) | Wordle | 14,855 | 14,851 |
| `hangman/data/words.ts` | Hangman | ~2,300 entries across 16 categories + titles | duplicates removed |
| `wordsearch/data/themes.ts` | Word Search | 1,080 (18 themes × 60) | 1,080, 3 content fixes |

## Round 2 — deeper accuracy pass (2026-07-10, continued)
1. **US Capitals**: verified against real data — all 50 correct, already perfect, no changes.
2. **Countries**: found 8 real sovereign countries missing entirely (United Arab Emirates, Bosnia and Herzegovina, Central African Republic, Democratic Republic of the Congo, Papua New Guinea, Sao Tome and Principe, Trinidad and Tobago, Saint Vincent and the Grenadines) plus Palestine (consistent with the list already including similarly-disputed Kosovo/Taiwan/Vatican City). 188 → 197, no duplicates.
3. **Dinosaurs**: 4 of 25 entries weren't actually dinosaurs (Pterodactyl, Pteranodon = pterosaurs/flying reptiles; Mosasaurus, Plesiosaurus = marine reptiles) — swapped for genuine dinosaur genera (Brontosaurus, Utahraptor, Dilophosaurus, Baryonyx).
4. **Cat Breeds / Dog Breeds**: checked against real breed data — both clean, no changes needed.
5. **Shared dictionaries — cross-validated against a 178k-word authoritative Scrabble dictionary** (much stricter than frequency data, since frequency alone can't tell a real word from a proper noun or brand name that's just common in text):
   - Found ~2,500 words that weren't in the Scrabble dictionary. Cross-referenced those against US name databases to isolate people's names that had slipped in as "common words" (albert, betty, barton, baxter, canada, spain, thor, william, etc.) — removed 509 of these (485 short dict + 24 long dict), keeping deliberate exceptions like month/day/planet/zodiac/language names per the file's own stated design.
   - Hand-classified the remaining ~1,080 ambiguous words one by one — kept genuinely useful modern/global vocabulary (selfie, emoji, podcast, hashtag, cosplay, webinar, sriracha, matcha, paneer, etc.), removed brand names (Google, Facebook, Bitcoin, Myspace, Linux, Sikorsky, etc.), removed ~230 meaningless fragments/foreign non-words, and removed 5 more slur/exploitation-adjacent terms that the first slur pass missed (shemales, ladyboy, ladyboys, paedo, upskirt).
   - **Broke and re-fixed Hex Hive puzzle integrity twice more** — each removal wave was re-checked against all 500 puzzles; 2 more puzzles lost their pangram (needed "pilcher" and "wildman") and were restored as scoped exceptions, same as round 1. Final state: all 500 puzzles verified solvable with ≥1 pangram.
   - Final counts: `shared/words.ts` 34,451 → 33,693. `shared/words_long.ts` 11,672 → 11,648.
   - Re-verified `commonWords.ts` is still a clean subset after all this — no reconciliation needed.

## Round 3 — Word Search pop-culture consistency + final Hangman spot-check (2026-07-10, continued)
1. **Word Search Movies/TV Shows/Video Games/Superheroes**: resolved all the ambiguous multi-word-title fragments flagged earlier. Where the full concatenated title fit under the 12-letter cap, used it (KNIVESOUT, THEDEPARTED, THEPRESTIGE, THESHINING, THEEXORCIST, LETHALWEAPON, BREAKINGBAD, COBRAKAI, SQUIDGAME, PRISONBREAK, GREYSANATOMY, HOLLOWKNIGHT, SHOVELKNIGHT, HOTLINEMIAMI, SYSTEMSHOCK, DEUSEX, SCARLETWITCH, SHANGCHI, BLACKBOLT). Where concatenation would exceed 12 letters (e.g. "Schindler's List", "The Matrix Revolutions", "Avengers: Endgame"), swapped in a different real, unambiguous title of the right length instead (ARRIVAL, SPEED, CHINATOWN, NOMADLAND, HEREDITARY, DARK, NARCOS, CHEERS, CRASH, OUTLAST) rather than leave a confusing fragment. Verified: 0 duplicates, 0 words over 12 letters, all categories still at 60 words.
2. **Remaining Hangman categories** (Sports Teams, Landmarks, Occupations, Games, Technology, Space, Animals, Foods, Superheroes): spot-checked all of them. Sports Teams is current and accurate (correctly includes the 2024 Utah Mammoth rebrand). No factual errors, garbled entries, or fictional/incorrect names found anywhere in this batch.

## Round 4 — Word Search cities fix + Animals/Space/Technology/Superheroes deep-check in both games (2026-07-10, continued)
1. **Word Search cities theme**: 2 real errors found and fixed — "KUWAIT" (a country name, not a city) → "KUWAITCITY", and "ADDIS" (a truncated fragment of Addis Ababa) → "ADDISABABA". Word Search's countries theme, checked the same way, was already fully accurate — 60 real countries, correctly spelled, no changes needed.
2. **Animals** — Hangman (245 items) and Word Search (60 items): both fully accurate, real species (Hangman reasonably includes a few well-known extinct animals like Mammoth and Dodo, which is normal for a general trivia category), no duplicates in either.
3. **Space** — Hangman (65 items): fully accurate, real planets/moons/constellations/phenomena, no changes. Word Search (60 items): found 2 weak/ambiguous entries — "DWARF" and "BINARY" are real words but too generic standalone (not clearly space-related out of context) — fixed to "WHITEDWARF" and "BINARYSTAR".
4. **Technology** — Hangman (140 items) and Word Search (60 items): both accurate. Brand/company names (Google, Bitcoin, Docker, Python, etc.) are appropriate here, unlike in the shared validator dictionaries — these are curated guessing/trivia categories, not open word-validation dictionaries, so recognizable tech brands are exactly the right content.
5. **Superheroes** — Hangman (39 items) and Word Search (60 items): both clean, no duplicates, no errors.

## Round 5 — remaining Word Search themes + remaining Hangman categories (2026-07-10, continued)
1. **Word Search Sports theme**: fixed 3 equipment-vs-activity mix-ups — "RACQUET" (equipment) → "RACQUETBALL" (sport), "WINDSURF" → "WINDSURFING", "SNOWBOARD" → "SNOWBOARDING".
2. **Word Search Ocean theme**: fixed 1 fragment — "TRIGGER" (not a sea creature on its own) → "TRIGGERFISH".
3. **Word Search Holidays theme**: fixed 8 fragment/ambiguity issues — "MEMORIAL"→"MEMORIALDAY", "VALENTINE"→"VALENTINES", "INDEPENDENCE" (couldn't fit "INDEPENDENCEDAY" under the 12-letter cap, swapped for the real holiday "EPIPHANY" instead), "LABOR"→"LABORDAY", "VETERANS"→"VETERANSDAY", "MARDI"→"MARDIGRAS", "ANZAC"→"ANZACDAY", "BASTILLE"→"BASTILLEDAY".
4. **Word Search Food, Music, Nature, Countries, Music Artists themes**: all already fully accurate, no changes needed.
5. **Hangman Foods (306), Sports Teams (136, confirmed all current including EPL clubs), Clothing (67), Games (44), Landmarks (42), Occupations (89), Idioms (76, all correctly worded)**: all checked, all clean, no duplicates or factual errors found.

Every category in both Hangman and Word Search has now had a genuine fact-check pass, not just a duplicate/format check.

Decision: Hangman and Word Search will keep independent word lists rather than sharing a single source, since their format requirements are incompatible (Hangman allows unlimited-length multi-word phrases; Word Search caps at 12 letters, single token, no spaces) and their selection intent differs (Hangman's factual categories aim for exhaustive coverage; Word Search wants a curated 60-word grid-friendly sample). Each will continue to be verified independently rather than merged.

The word lists are now meaningfully more accurate across every game — factual errors fixed (dinosaurs, countries), proper-noun and brand-name pollution removed from the shared dictionaries, ambiguous pop-culture fragments resolved, and every game's runtime behavior (Hex Hive puzzles especially) re-verified intact after each change. Not literally every one of the ~46,000 shared-dictionary words has been individually eyeballed, but every list in the app has now had at least one rigorous, evidence-based pass well beyond simple deduplication.
