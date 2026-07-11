// src/anagrams/screens/AnagramsPlayScreen.tsx
// Core Anagrams gameplay engine, shared by both Daily and Practice routes.
//
// Interaction model: the scrambled word's letters appear as individual
// tappable tiles ("tray"). Tapping a tray tile places it into the next
// empty guess slot. Backspace removes the most recently placed tile back
// to the tray. Once every slot is filled the guess is checked automatically
// — correct advances to the next round, incorrect shakes and resets the
// slots so the player can try again (no penalty beyond time).

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { usePreventRemove } from '@react-navigation/core';
import { FlagOff, Lightbulb, Shuffle, SkipForward } from 'lucide-react-native';

import { useTheme } from '../../shared/ThemeContext';
import { AchievementPopup } from '../../shared/AchievementPopup';
import { ConfirmModal } from '../../shared/ConfirmModal';
import { GameTile } from '../../shared/GameTile';
import type { TierName } from '../../shared/tileTiers';

import type { AnagramPuzzle } from '../utils/generator';
import { getHintLetter, isValidAnagramGuess } from '../utils/generator';
import { calculateRoundScore, calculateTotalScore, RoundResult } from '../utils/scoring';
import {
  addDailyScoreToEquippedTier,
  clearDailyProgress,
  computeNextStreak,
  DailyLockState,
  DailyProgressState,
  formatDisplayDate,
  getTodayDateString,
  loadAnagramsStats,
  loadAnagramsTiles,
  loadDailyLock,
  saveAnagramsStats,
  saveDailyLock,
  saveDailyProgress,
  TOTAL_ROUNDS,
  useCountdownToMidnight,
} from '../utils/anagramsStorage';
import {
  Achievement,
  AnagramsGameResult,
  checkAnagramsAchievements,
} from '../utils/anagramsAchievements';
import AnagramsResultOverlay from '../components/AnagramsResultOverlay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  puzzle: AnagramPuzzle;
  mode: 'daily' | 'practice';
  lockedResult?: DailyLockState | null;
  initialProgress?: DailyProgressState | null;
  onGoHome: () => void;
  onPlayAgain?: () => void;
};

type Tile = { id: number; letter: string; used: boolean };
type RunStatus = 'playing' | 'complete';

function buildTray(letters: string[]): Tile[] {
  return letters.map((letter, id) => ({ id, letter, used: false }));
}

const AnagramsPlayScreen: React.FC<Props> = ({
  puzzle,
  mode,
  lockedResult,
  initialProgress,
  onGoHome,
  onPlayAgain,
}) => {
  const { background } = useTheme();
  const countdown = useCountdownToMidnight();
  const alreadyLocked = mode === 'daily' && !!lockedResult;

  const startingRoundIndex = alreadyLocked ? 0 : initialProgress?.roundIndex ?? 0;
  const startingRoundResults = alreadyLocked ? [] : initialProgress?.roundResults ?? [];

  const [roundIndex, setRoundIndex] = useState(startingRoundIndex);
  const [roundResults, setRoundResults] = useState<RoundResult[]>(startingRoundResults);
  const [runStatus, setRunStatus] = useState<RunStatus>(alreadyLocked ? 'complete' : 'playing');
  const [showResult, setShowResult] = useState(alreadyLocked);
  const [finalStreaks, setFinalStreaks] = useState<{ current: number | null; best: number | null }>({
    current: null,
    best: null,
  });
  const [runTotalScore, setRunTotalScore] = useState(lockedResult?.totalScore ?? 0);
  const [runPerfectBonus, setRunPerfectBonus] = useState(lockedResult?.perfectBonusApplied ?? false);
  const [runElapsed, setRunElapsed] = useState(lockedResult?.timeSeconds ?? 0);

  const currentRound = puzzle.rounds[roundIndex];

  const [tray, setTray] = useState<Tile[]>(() => buildTray(currentRound.scrambled));
  const [trayOrder, setTrayOrder] = useState<number[]>(() => currentRound.scrambled.map((_, i) => i));
  const [guessSlots, setGuessSlots] = useState<(number | null)[]>(() =>
    Array(currentRound.scrambled.length).fill(null)
  );
  const [hintsUsedThisRound, setHintsUsedThisRound] = useState(0);
  const [shake, setShake] = useState(false);
  const [solved, setSolved] = useState(false);

  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([]);
  const [currentPopupAchievement, setCurrentPopupAchievement] = useState<Achievement | null>(null);

  // Equipped cube skin — cosmetic only, applies in both Daily and Practice
  // even though unlocking one is Daily-only (see anagramsTiers.ts).
  const [equippedTier, setEquippedTier] = useState<TierName>('default');
  const [equippedVariant, setEquippedVariant] = useState(1);

  useEffect(() => {
    loadAnagramsTiles().then((tiles) => {
      setEquippedTier(tiles.equippedTier);
      setEquippedVariant(tiles.equippedVariant);
    });
  }, []);

  const runStartTimeRef = useRef(Date.now());
  const roundStartTimeRef = useRef(Date.now());
  const savedRef = useRef(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Reset the tray/slots whenever we move to a new round.
  useEffect(() => {
    if (alreadyLocked) return;
    setTray(buildTray(currentRound.scrambled));
    setTrayOrder(currentRound.scrambled.map((_, i) => i));
    setGuessSlots(Array(currentRound.scrambled.length).fill(null));
    setHintsUsedThisRound(0);
    roundStartTimeRef.current = Date.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIndex]);

  // Run timer autosave (Daily only) — survives app backgrounding.
  useEffect(() => {
    if (mode !== 'daily' || alreadyLocked || runStatus !== 'playing') return;
    saveDailyProgress({
      dateISO: getTodayDateString(),
      roundIndex,
      roundResults,
      guessSlots: [],
      hintsUsedThisRound: 0,
      elapsedSecondsThisRound: 0,
    });
  }, [mode, alreadyLocked, runStatus, roundIndex, roundResults]);

  useEffect(() => {
    if (!alreadyLocked) return;
    loadAnagramsStats().then((stats) => {
      setFinalStreaks({ current: stats.daily.currentStreak, best: stats.daily.bestStreak });
    });
  }, [alreadyLocked]);

  useEffect(() => {
    if (pendingAchievements.length > 0 && !currentPopupAchievement) {
      setCurrentPopupAchievement(pendingAchievements[0]);
      setPendingAchievements((prev) => prev.slice(1));
    }
  }, [pendingAchievements, currentPopupAchievement]);

  function triggerShake() {
    setShake(true);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      setTray(buildTray(currentRound.scrambled));
      setTrayOrder(currentRound.scrambled.map((_, i) => i));
      setGuessSlots(Array(currentRound.scrambled.length).fill(null));
      setShake(false);
    }, 550);
  }

  function advanceRound(result: RoundResult) {
    const nextResults = [...roundResults, result];
    setRoundResults(nextResults);

    if (roundIndex + 1 >= TOTAL_ROUNDS) {
      finishRun(nextResults);
    } else {
      setRoundIndex((r) => r + 1);
    }
  }

  function checkGuess(slots: (number | null)[], tiles: Tile[]) {
    if (slots.some((s) => s === null)) return;
    const guess = slots.map((id) => tiles.find((t) => t.id === id)!.letter).join('');
    const letters = currentRound.scrambled;
    if (isValidAnagramGuess(guess, letters)) {
      const timeSeconds = Math.round((Date.now() - roundStartTimeRef.current) / 1000);
      // Brief pause with a green "solved" flash so the correct answer
      // actually registers before jumping to the next word.
      setSolved(true);
      setTimeout(() => {
        setSolved(false);
        advanceRound({ solved: true, skipped: false, timeSeconds, hintsUsed: hintsUsedThisRound });
      }, 550);
    } else {
      triggerShake();
    }
  }

  const handleTrayTap = (id: number) => {
    if (runStatus !== 'playing' || shake || solved) return;
    const tile = tray.find((t) => t.id === id);
    if (!tile || tile.used) return;
    const firstEmpty = guessSlots.indexOf(null);
    if (firstEmpty === -1) return;

    const nextSlots = [...guessSlots];
    nextSlots[firstEmpty] = id;
    const nextTray = tray.map((t) => (t.id === id ? { ...t, used: true } : t));

    setGuessSlots(nextSlots);
    setTray(nextTray);
    checkGuess(nextSlots, nextTray);
  };

  const handleBackspace = () => {
    if (runStatus !== 'playing' || shake || solved) return;
    let lastFilled = -1;
    for (let i = guessSlots.length - 1; i >= 0; i--) {
      if (guessSlots[i] !== null) {
        lastFilled = i;
        break;
      }
    }
    if (lastFilled === -1) return;
    const id = guessSlots[lastFilled]!;
    const nextSlots = [...guessSlots];
    nextSlots[lastFilled] = null;
    setGuessSlots(nextSlots);
    setTray((prev) => prev.map((t) => (t.id === id ? { ...t, used: false } : t)));
  };

  const handleShuffle = () => {
    if (runStatus !== 'playing' || shake || solved) return;
    setTrayOrder((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
  };

  const handleHint = () => {
    if (runStatus !== 'playing' || shake || solved) return;
    const firstEmpty = guessSlots.indexOf(null);
    if (firstEmpty === -1) return;
    const hint = getHintLetter(currentRound.word, guessSlots.map((id) => (id === null ? '' : tray.find((t) => t.id === id)!.letter)));
    if (!hint || hint.index !== firstEmpty) return;

    const targetLetter = hint.letter;
    const matchingTile = tray.find((t) => !t.used && t.letter === targetLetter);
    if (!matchingTile) return;

    const nextSlots = [...guessSlots];
    nextSlots[firstEmpty] = matchingTile.id;
    const nextTray = tray.map((t) => (t.id === matchingTile.id ? { ...t, used: true } : t));

    setGuessSlots(nextSlots);
    setTray(nextTray);
    setHintsUsedThisRound((h) => h + 1);
    checkGuess(nextSlots, nextTray);
  };

  const handleSkip = () => {
    if (runStatus !== 'playing' || shake || solved) return;
    const timeSeconds = Math.round((Date.now() - roundStartTimeRef.current) / 1000);
    advanceRound({ solved: false, skipped: true, timeSeconds, hintsUsed: hintsUsedThisRound });
  };

  // Ends the run right now — the current round plus any remaining rounds all
  // count as skipped. Same underlying path as leaving mid-Daily-game (see
  // confirmLeaveDaily below), just triggered explicitly instead of via back
  // navigation, and available in both Daily and Practice. Mirrors Word
  // Ladder's Give Up: no confirmation prompt, immediate and final.
  const handleGiveUp = () => {
    if (runStatus !== 'playing') return;
    const remaining = TOTAL_ROUNDS - roundResults.length;
    const filledResults = [
      ...roundResults,
      ...Array.from({ length: remaining }, () => ({
        solved: false,
        skipped: true,
        timeSeconds: 0,
        hintsUsed: 0,
      })),
    ];
    finishRun(filledResults);
  };

  async function finishRun(finalResults: RoundResult[]) {
    if (savedRef.current) return;
    savedRef.current = true;

    setRunStatus('complete');
    const finalElapsed = Math.round((Date.now() - runStartTimeRef.current) / 1000);
    setRunElapsed(finalElapsed);

    const { total, perfectBonusApplied, wordsSolved } = calculateTotalScore(finalResults);
    setRunTotalScore(total);
    setRunPerfectBonus(perfectBonusApplied);

    const won = wordsSolved === finalResults.length;

    const stats = await loadAnagramsStats();
    const modeStats = mode === 'daily' ? stats.daily : stats.practice;

    modeStats.gamesPlayed += 1;
    if (won) modeStats.gamesWon += 1;
    modeStats.totalScore += total;
    if (modeStats.bestScore == null || total > modeStats.bestScore) modeStats.bestScore = total;
    modeStats.totalTimeSeconds += finalElapsed;
    modeStats.wordsSolved += wordsSolved;
    modeStats.roundsSkipped += finalResults.filter((r) => r.skipped).length;
    modeStats.hintsUsed += finalResults.reduce((sum, r) => sum + r.hintsUsed, 0);
    if (perfectBonusApplied) {
      modeStats.perfectRuns += 1;
      if (modeStats.fastestPerfectTimeSeconds == null || finalElapsed < modeStats.fastestPerfectTimeSeconds) {
        modeStats.fastestPerfectTimeSeconds = finalElapsed;
      }
    }

    // Track the cross-run "consecutive solved without a skip" streak.
    for (const r of finalResults) {
      if (r.skipped) stats.globalNoSkipStreak = 0;
      else if (r.solved) stats.globalNoSkipStreak += 1;
    }

    let streakCurrent: number | null = null;
    let streakBest: number | null = null;

    if (mode === 'daily') {
      const prevLock = await loadDailyLock();
      const newStreak = computeNextStreak(won, prevLock, modeStats.currentStreak);
      modeStats.currentStreak = newStreak;
      modeStats.bestStreak = Math.max(modeStats.bestStreak, newStreak);
      streakCurrent = modeStats.currentStreak;
      streakBest = modeStats.bestStreak;

      await saveDailyLock({
        dateISO: getTodayDateString(),
        won,
        words: puzzle.rounds.map((r) => r.word),
        roundResults: finalResults,
        totalScore: total,
        perfectBonusApplied,
        timeSeconds: finalElapsed,
      });
      await clearDailyProgress();

      // Cube/tile cosmetics are Daily-only — only a Daily run's score
      // counts toward the currently-equipped tier's V2 (glow) unlock.
      await addDailyScoreToEquippedTier(total);
    }

    await saveAnagramsStats(stats);

    const fastestRoundSeconds = finalResults.filter((r) => r.solved && !r.skipped).reduce<number | null>(
      (min, r) => (min == null || r.timeSeconds < min ? r.timeSeconds : min),
      null
    );

    const result: AnagramsGameResult = {
      mode,
      won,
      perfectBonusApplied,
      wordsSolved,
      totalScore: total,
      timeSeconds: finalElapsed,
      fastestRoundSeconds,
      consecutiveSolvedNoSkip: stats.globalNoSkipStreak,
    };
    const newlyUnlocked = await checkAnagramsAchievements(result, stats);
    if (newlyUnlocked.length > 0) setPendingAchievements((prev) => [...prev, ...newlyUnlocked]);

    setFinalStreaks({ current: streakCurrent, best: streakBest });
    setShowResult(true);
  }

  // Daily only allows one attempt per day — leaving mid-run counts the
  // remaining rounds as skipped, mirroring Word Ladder's "leaving = loss".
  const navigation = useNavigation();
  // usePreventRemove's condition is read from its own render's closure, so
  // re-dispatching the nav action right after finishRun() (before React
  // re-renders with the post-finish runStatus) would otherwise let the
  // still-stale "playing" closure intercept its own re-dispatch and reopen
  // the modal — leaving becomes impossible. This ref bypasses the guard
  // synchronously the moment "Leave" is confirmed.
  const isLeavingRef = useRef(false);
  const isMidDailyGame = mode === 'daily' && !alreadyLocked && runStatus === 'playing' && !isLeavingRef.current;
  const [leaveAction, setLeaveAction] = useState<any>(null);

  usePreventRemove(isMidDailyGame, ({ data }) => {
    setLeaveAction(data.action);
  });

  const confirmLeaveDaily = async () => {
    const action = leaveAction;
    setLeaveAction(null);
    if (!action) return;
    isLeavingRef.current = true;
    const remaining = TOTAL_ROUNDS - roundResults.length;
    const filledResults = [
      ...roundResults,
      ...Array.from({ length: remaining }, () => ({
        solved: false,
        skipped: true,
        timeSeconds: 0,
        hintsUsed: 0,
      })),
    ];
    await finishRun(filledResults);
    navigation.dispatch(action);
  };

  const isDaily = mode === 'daily';
  const displayWords = alreadyLocked && lockedResult ? lockedResult.words : puzzle.rounds.map((r) => r.word);
  const displayResults = alreadyLocked && lockedResult ? lockedResult.roundResults : roundResults;

  const shareText = isDaily
    ? `Anagrams Daily — ${formatDisplayDate()}\nScore: ${runTotalScore}${
        runPerfectBonus ? ' (Perfect Run!)' : ''
      }${finalStreaks.current && finalStreaks.current > 1 ? `\n🔥 ${finalStreaks.current} day streak` : ''}`
    : `Anagrams — Score: ${runTotalScore}${runPerfectBonus ? ' (Perfect Run!)' : ''}`;

  const tileSize = useMemo(() => {
    const gap = 6;
    const horizontalPadding = 40;
    const len = currentRound.scrambled.length;
    const raw = Math.floor((SCREEN_WIDTH - horizontalPadding - gap * (len - 1)) / len);
    // Raise the cap so short words (e.g. 4 letters) get noticeably bigger,
    // more tappable tiles instead of being stuck at the same small size.
    return Math.max(30, Math.min(64, raw));
  }, [currentRound]);

  const projectedScore = useMemo(() => {
    return roundResults.reduce((sum, r, i) => sum + calculateRoundScore(i, r), 0);
  }, [roundResults]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: background.backgroundColor }]}>
      <StatusBar barStyle={background.statusBar === 'light' ? 'light-content' : 'dark-content'} />

      <AchievementPopup
        achievement={currentPopupAchievement}
        onDismiss={() => setCurrentPopupAchievement(null)}
        backgroundColor={background.cardColor}
        textColor={background.textColor}
      />

      <ConfirmModal
        visible={!!leaveAction}
        title="Leave Daily Anagrams?"
        message="You've only got one Daily attempt per day — leaving now will count any remaining words as skipped."
        onCancel={() => setLeaveAction(null)}
        onConfirm={confirmLeaveDaily}
        backgroundColor={background.cardColor}
        textColor={background.textColor}
        secondaryText={background.secondaryText}
        borderColor={background.borderColor}
      />

      {/* Header — title is absolutely centered on the full row so it lines
          up with "Word X of Y" below, regardless of the back/score widths. */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onGoHome}>
          <Text style={[styles.backText, { color: background.secondaryText }]}>← Games</Text>
        </Pressable>
        <View style={styles.titleWrap} pointerEvents="box-none">
          <Text style={[styles.title, { color: background.textColor }]}>
            {isDaily ? 'Daily Anagrams' : 'Anagrams'}
          </Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={[styles.scoreText, { color: background.secondaryText }]}>{projectedScore}</Text>
        </View>
      </View>

      {!alreadyLocked && (
        <Text style={[styles.roundLabel, { color: background.secondaryText }]}>
          Word {roundIndex + 1} of {TOTAL_ROUNDS}
        </Text>
      )}

      {runStatus === 'playing' && !alreadyLocked && (
        <>
          {/* Slots + tray live in the lower-center thumb zone rather than
              pinned to the top of the screen. */}
          <View style={styles.playArea}>
          {/* Guess slots */}
          <Animated.View
            style={[
              styles.slotRow,
              {
                transform: [
                  {
                    translateX: shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-10, 10] }),
                  },
                ],
              },
            ]}
          >
            {guessSlots.map((id, i) => {
              const letter = id !== null ? tray.find((t) => t.id === id)?.letter ?? '' : '';

              // Wrong-guess shake always overrides the cosmetic skin so the
              // red flash stays unmistakable. A correct guess (`solved`)
              // intentionally does NOT change color — it just briefly
              // pauses input (see checkGuess) so the word is readable
              // before the round advances, without a "right answer" flash.
              if (shake) {
                return (
                  <View
                    key={i}
                    style={[
                      styles.tile,
                      {
                        width: tileSize,
                        height: tileSize,
                        backgroundColor: background.cardColor,
                        borderColor: '#e94560',
                        borderWidth: 2.5,
                      },
                    ]}
                  >
                    <Text style={[styles.tileText, { color: background.textColor, fontSize: tileSize * 0.42 }]}>
                      {letter}
                    </Text>
                  </View>
                );
              }

              if (equippedTier !== 'default') {
                return (
                  <GameTile
                    key={i}
                    letter={letter}
                    index={i}
                    isSelected={false}
                    selectionOrder={null}
                    onPress={() => {}}
                    tileSize={tileSize}
                    tierName={equippedTier}
                    variant={equippedVariant}
                    appBg={background.backgroundColor}
                  />
                );
              }

              return (
                <View
                  key={i}
                  style={[
                    styles.tile,
                    {
                      width: tileSize,
                      height: tileSize,
                      backgroundColor: background.cardColor,
                      borderColor: background.borderColor,
                      borderWidth: 1.5,
                    },
                  ]}
                >
                  <Text style={[styles.tileText, { color: background.textColor, fontSize: tileSize * 0.42 }]}>
                    {letter}
                  </Text>
                </View>
              );
            })}
          </Animated.View>

          {/* Tray — tiles keep their original slot even once used, so the
              remaining letters never shift position when one is tapped. */}
          <View style={styles.trayRow}>
            {trayOrder.map((id) => {
              const tile = tray.find((t) => t.id === id)!;
              if (tile.used) {
                return (
                  <View
                    key={id}
                    style={[styles.tile, styles.trayTile, { width: tileSize, height: tileSize, opacity: 0 }]}
                  />
                );
              }

              if (equippedTier !== 'default') {
                return (
                  <GameTile
                    key={id}
                    letter={tile.letter}
                    index={id}
                    isSelected={false}
                    selectionOrder={null}
                    onPress={() => handleTrayTap(id)}
                    tileSize={tileSize}
                    tierName={equippedTier}
                    variant={equippedVariant}
                    appBg={background.backgroundColor}
                  />
                );
              }

              return (
                <Pressable
                  key={id}
                  onPress={() => handleTrayTap(id)}
                  style={({ pressed }) => [
                    styles.tile,
                    styles.trayTile,
                    {
                      width: tileSize,
                      height: tileSize,
                      backgroundColor: background.cardColor,
                      borderColor: background.borderColor,
                      transform: [{ scale: pressed ? 0.92 : 1 }],
                    },
                  ]}
                >
                  <Text style={[styles.tileText, { color: background.textColor, fontSize: tileSize * 0.42 }]}>
                    {tile.letter}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          </View>

          {/* Controls — Daily is Shuffle/Back/Give Up (bigger, since there
              are only a few). Practice is Shuffle/Back/Skip/Give Up in one
              row, sized up and pulled closer to the tray; Hint lives
              separately as a floating button in the bottom-right corner. */}
          <View style={[styles.controlsRow, !isDaily && styles.controlsRowPractice]}>
            <Pressable
              style={[
                styles.controlButton,
                isDaily ? styles.controlButtonLarge : styles.controlButtonWide,
                { borderColor: background.borderColor },
              ]}
              onPress={handleShuffle}
            >
              <Shuffle size={isDaily ? 20 : 18} color={background.textColor} />
              <Text
                style={[
                  styles.controlButtonText,
                  isDaily ? styles.controlButtonTextLarge : styles.controlButtonTextWide,
                  { color: background.textColor },
                ]}
              >
                Shuffle
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.controlButton,
                isDaily ? styles.controlButtonLarge : styles.controlButtonWide,
                { borderColor: background.borderColor },
              ]}
              onPress={handleBackspace}
            >
              <Text
                style={[
                  styles.controlButtonText,
                  isDaily ? styles.controlButtonTextLarge : styles.controlButtonTextWide,
                  { color: background.textColor },
                ]}
              >
                ⌫ Back
              </Text>
            </Pressable>
            {!isDaily && (
              <Pressable
                style={[styles.controlButton, styles.controlButtonWide, { borderColor: background.borderColor }]}
                onPress={handleSkip}
              >
                <SkipForward size={18} color={background.textColor} />
                <Text style={[styles.controlButtonText, styles.controlButtonTextWide, { color: background.textColor }]}>
                  Skip
                </Text>
              </Pressable>
            )}
            <Pressable
              style={[
                styles.controlButton,
                isDaily ? styles.controlButtonLarge : styles.controlButtonWide,
                { borderColor: background.borderColor },
              ]}
              onPress={handleGiveUp}
            >
              <FlagOff size={isDaily ? 20 : 18} color={background.textColor} />
              <Text
                style={[
                  styles.controlButtonText,
                  isDaily ? styles.controlButtonTextLarge : styles.controlButtonTextWide,
                  { color: background.textColor },
                ]}
              >
                Give Up
              </Text>
            </Pressable>
          </View>

          {!isDaily && (
            <Pressable
              style={[
                styles.hintFab,
                { backgroundColor: background.cardColor, borderColor: background.borderColor },
              ]}
              onPress={handleHint}
            >
              <Lightbulb size={22} color={background.textColor} />
            </Pressable>
          )}
        </>
      )}

      <AnagramsResultOverlay
        visible={showResult}
        mode={mode}
        words={displayWords}
        roundResults={displayResults}
        totalScore={runTotalScore}
        perfectBonusApplied={runPerfectBonus}
        timeSeconds={runElapsed}
        currentStreak={finalStreaks.current}
        bestStreak={finalStreaks.best}
        nextDailySecondsRemaining={isDaily ? parseCountdownSeconds(countdown) : null}
        shareText={shareText}
        onClose={() => {
          setShowResult(false);
          onGoHome();
        }}
        onPlayAgain={() => {
          setShowResult(false);
          onPlayAgain?.();
        }}
        onGoHome={onGoHome}
      />
    </SafeAreaView>
  );
};

function parseCountdownSeconds(countdown: string): number | null {
  const match = countdown.match(/(\d+)h (\d+)m (\d+)s/);
  if (!match) return null;
  const [, h, m, s] = match;
  return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s);
}

export default AnagramsPlayScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 6,
    position: 'relative',
  },
  backButton: { padding: 8, zIndex: 1 },
  backText: { fontSize: 15, fontWeight: '500' },
  titleWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold' },
  scoreBox: { width: 60, alignItems: 'flex-end', paddingRight: 4, zIndex: 1 },
  scoreText: { fontSize: 15, fontWeight: '600' },

  roundLabel: { textAlign: 'center', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },

  // Fills the space between the header and the controls, then centers its
  // children (slots + tray) in that space — lower-middle of the screen,
  // within thumb reach but not crammed against the bottom edge.
  playArea: { flex: 1, justifyContent: 'center', paddingBottom: 12 },

  slotRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 28 },
  trayRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
  tile: { borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  trayTile: { borderWidth: 1.5 },
  tileText: { fontWeight: '900' },

  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 24,
  },
  // Practice pulls the row up: closer to the tray above, and enough
  // clearance below to stay clear of the floating Hint button.
  controlsRowPractice: {
    marginTop: 4,
    marginBottom: 92,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  controlButtonText: { fontSize: 13, fontWeight: '700' },
  // Used only on Daily, where Shuffle/Back are the sole two buttons — fixed
  // width keeps them identical in size no matter that Shuffle has an icon
  // and Back is text-only, so the pair sits evenly aligned on the page.
  controlButtonLarge: {
    justifyContent: 'center',
    gap: 8,
    width: 132,
    height: 56,
    paddingVertical: 0,
  },
  controlButtonTextLarge: { fontSize: 16 },
  // Used in Practice for the Shuffle/Back/Skip trio — fixed width and
  // height so all three are identical regardless of label/icon differences.
  controlButtonWide: {
    justifyContent: 'center',
    gap: 8,
    width: 104,
    height: 56,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  controlButtonTextWide: { fontSize: 15 },
  // Hint floats on its own in the bottom-right corner in Practice, separate
  // from the main row since it's used less often than Shuffle/Back/Skip.
  hintFab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
