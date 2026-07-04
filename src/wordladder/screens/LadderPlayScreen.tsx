// src/wordladder/screens/LadderPlayScreen.tsx
// Core Word Ladder gameplay engine, shared by both Daily and Practice routes.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lightbulb, FlagOff } from 'lucide-react-native';

import { useTheme } from '../../shared/ThemeContext';
import { AchievementPopup } from '../../wordbuilder/components/AchievementPopup';

import type { LadderDifficulty, LadderPuzzle } from '../utils/generator';
import { getHintPath } from '../utils/generator';
import { isOneLetterOff, isValidWord } from '../utils/wordGraph';
import {
  computeNextStreak,
  DailyLockState,
  formatDisplayDate,
  getTodayDateString,
  loadDailyLock,
  loadLadderStats,
  saveDailyLock,
  saveLadderStats,
  useCountdownToMidnight,
} from '../utils/ladderStorage';
import {
  Achievement,
  checkLadderAchievements,
  LadderGameResult,
} from '../utils/ladderAchievements';
import LadderResultOverlay from '../components/LadderResultOverlay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_HINTS = 3;
const KEYBOARD_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

type Props = {
  puzzle: LadderPuzzle;
  mode: 'daily' | 'practice';
  difficulty: LadderDifficulty;
  lockedResult?: DailyLockState | null; // daily-only: already played today
  onGoHome: () => void;
  onPlayAgain?: () => void; // practice-only
};

type GameStatus = 'playing' | 'won' | 'gave_up';

function buildTiles(word: string, length: number): string[] {
  const padded = word.toUpperCase().padEnd(length, ' ');
  return padded.slice(0, length).split('');
}

function diffIndex(a: string, b: string): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) return i;
  }
  return -1;
}

const LadderPlayScreen: React.FC<Props> = ({
  puzzle,
  mode,
  difficulty,
  lockedResult,
  onGoHome,
  onPlayAgain,
}) => {
  const { background } = useTheme();
  const wordLength = puzzle.wordLength;
  const countdown = useCountdownToMidnight();

  const alreadyLocked = mode === 'daily' && !!lockedResult;

  const [chain, setChain] = useState<string[]>([puzzle.start]);
  const [currentCells, setCurrentCells] = useState<string[]>(Array(wordLength).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [status, setStatus] = useState<GameStatus>(alreadyLocked ? (lockedResult!.result === 'won' ? 'won' : 'gave_up') : 'playing');
  const [elapsed, setElapsed] = useState(0);
  const [showResult, setShowResult] = useState(alreadyLocked);
  const [finalStreaks, setFinalStreaks] = useState<{ current: number | null; best: number | null }>({
    current: null,
    best: null,
  });

  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([]);
  const [currentPopupAchievement, setCurrentPopupAchievement] = useState<Achievement | null>(null);

  const startTimeRef = useRef(Date.now());
  const scrollRef = useRef<ScrollView>(null);
  const savedRef = useRef(false);

  // Timer
  useEffect(() => {
    if (status !== 'playing' || alreadyLocked) return;
    const interval = setInterval(() => {
      setElapsed(Math.round((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [status, alreadyLocked]);

  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, [chain.length]);

  useEffect(() => {
    if (pendingAchievements.length > 0 && !currentPopupAchievement) {
      setCurrentPopupAchievement(pendingAchievements[0]);
      setPendingAchievements((prev) => prev.slice(1));
    }
  }, [pendingAchievements, currentPopupAchievement]);

  const tileSize = useMemo(() => {
    const gap = 6;
    const horizontalPadding = 40;
    const raw = Math.floor((SCREEN_WIDTH - horizontalPadding - gap * (wordLength - 1)) / wordLength);
    return Math.max(32, Math.min(52, raw));
  }, [wordLength]);

  async function finishGame(finalStatus: 'won' | 'gave_up', finalChain: string[], finalHints: number) {
    if (savedRef.current) return;
    savedRef.current = true;

    setStatus(finalStatus);
    const finalElapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    setElapsed(finalElapsed);

    const steps = finalChain.length - 1;
    const won = finalStatus === 'won';

    const stats = await loadLadderStats();
    const modeStats = mode === 'daily' ? stats.daily : stats.practice;

    modeStats.gamesPlayed += 1;
    if (won) modeStats.gamesWon += 1;
    else modeStats.gamesGivenUp += 1;
    modeStats.totalSteps += steps;
    modeStats.totalParSteps += puzzle.par;
    modeStats.totalTimeSeconds += finalElapsed;
    modeStats.hintsUsed += finalHints;

    if (won) {
      if (modeStats.fastestTimeSeconds == null || finalElapsed < modeStats.fastestTimeSeconds) {
        modeStats.fastestTimeSeconds = finalElapsed;
      }
      const overPar = steps - puzzle.par;
      if (modeStats.bestStepsOverPar == null || overPar < modeStats.bestStepsOverPar) {
        modeStats.bestStepsOverPar = overPar;
      }
      if (steps === puzzle.par) modeStats.perfectSolves += 1;
      if (finalHints === 0) modeStats.hintFreeWins += 1;
      if (difficulty === 'easy') modeStats.easyWins += 1;
      if (difficulty === 'medium') modeStats.mediumWins += 1;
      if (difficulty === 'hard') modeStats.hardWins += 1;
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
        result: won ? 'won' : 'gave_up',
        steps,
        par: puzzle.par,
        timeSeconds: finalElapsed,
        hintsUsed: finalHints,
        start: puzzle.start,
        end: puzzle.end,
      });
    }

    await saveLadderStats(stats);

    const result: LadderGameResult = {
      mode,
      difficulty,
      won,
      steps,
      par: puzzle.par,
      timeSeconds: finalElapsed,
      hintsUsed: finalHints,
    };
    const newlyUnlocked = await checkLadderAchievements(result, stats);
    if (newlyUnlocked.length > 0) setPendingAchievements((prev) => [...prev, ...newlyUnlocked]);

    setFinalStreaks({ current: streakCurrent, best: streakBest });
    setShowResult(true);
  }

  const handleKeyPress = (key: string) => {
    if (status !== 'playing') return;
    setError(null);
    const firstEmpty = currentCells.indexOf('');
    if (firstEmpty === -1) return;
    const next = [...currentCells];
    next[firstEmpty] = key;
    setCurrentCells(next);
  };

  const handleBackspace = () => {
    if (status !== 'playing') return;
    setError(null);
    const next = [...currentCells];
    for (let i = next.length - 1; i >= 0; i--) {
      if (next[i] !== '') {
        next[i] = '';
        break;
      }
    }
    setCurrentCells(next);
  };

  const handleSubmit = () => {
    if (status !== 'playing') return;
    if (currentCells.some((c) => c === '')) {
      setError('Fill in all letters');
      return;
    }
    const guess = currentCells.join('').toLowerCase();
    const last = chain[chain.length - 1];

    if (guess === last) {
      setError('That’s the same word');
      return;
    }
    if (chain.includes(guess)) {
      setError('Already used that word');
      return;
    }
    if (!isOneLetterOff(last, guess)) {
      setError('Change exactly one letter');
      return;
    }
    if (!isValidWord(guess)) {
      setError('Not a real word');
      return;
    }

    const newChain = [...chain, guess];
    setChain(newChain);
    setCurrentCells(Array(wordLength).fill(''));
    setError(null);

    if (guess === puzzle.end) {
      finishGame('won', newChain, hintsUsed);
    }
  };

  const handleHint = () => {
    if (status !== 'playing' || hintsUsed >= MAX_HINTS) return;
    const last = chain[chain.length - 1];
    const path = getHintPath(last, puzzle.end);
    if (!path || path.length < 2) return;
    const nextWord = path[1];
    const idx = diffIndex(last, nextWord);
    if (idx === -1) return;

    const next = [...currentCells];
    next[idx] = nextWord[idx].toUpperCase();
    setCurrentCells(next);
    setHintsUsed((h) => h + 1);
    setError(null);
  };

  const handleGiveUp = () => {
    if (status !== 'playing') return;
    finishGame('gave_up', chain, hintsUsed);
  };

  const isWin = status === 'won';
  const displayChain = alreadyLocked && lockedResult ? [lockedResult.start] : chain;
  const displayEnd = alreadyLocked && lockedResult ? lockedResult.end : puzzle.end;

  const shareText =
    mode === 'daily'
      ? `Word Ladder Daily — ${formatDisplayDate()}\n${puzzle.start.toUpperCase()} → ${puzzle.end.toUpperCase()}\n${
          isWin ? `Solved in ${chain.length - 1} steps (par ${puzzle.par})` : `Gave up (par ${puzzle.par})`
        }${finalStreaks.current && finalStreaks.current > 1 ? `\n🔥 ${finalStreaks.current} day streak` : ''}`
      : `Word Ladder — ${puzzle.start.toUpperCase()} → ${puzzle.end.toUpperCase()}\n${
          isWin ? `Solved in ${chain.length - 1} steps (par ${puzzle.par})` : `Gave up (par ${puzzle.par})`
        }`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: background.backgroundColor }]}>
      <StatusBar barStyle={background.statusBar === 'light' ? 'light-content' : 'dark-content'} />

      {/* Achievement Popup */}
      <AchievementPopup
        achievement={currentPopupAchievement}
        onDismiss={() => setCurrentPopupAchievement(null)}
        backgroundColor={background.cardColor}
        textColor={background.textColor}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onGoHome}>
          <Text style={[styles.backText, { color: background.secondaryText }]}>← Games</Text>
        </Pressable>
        <Text style={[styles.title, { color: background.textColor }]}>
          {mode === 'daily' ? 'Daily Ladder' : 'Word Ladder'}
        </Text>
        <View style={styles.timerBox}>
          <Text style={[styles.timerText, { color: background.secondaryText }]}>
            {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.ladderScroll}
        contentContainerStyle={styles.ladderContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Confirmed rungs */}
        {displayChain.map((word, i) => {
          const prevWord = i > 0 ? displayChain[i - 1] : null;
          const changed = prevWord ? diffIndex(prevWord, word) : -1;
          const isStart = i === 0;
          return (
            <View key={`${word}-${i}`} style={styles.rowWrap}>
              {isStart && <Text style={[styles.rowLabel, { color: background.secondaryText }]}>START</Text>}
              <View style={styles.tileRow}>
                {buildTiles(word, wordLength).map((letter, ci) => (
                  <View
                    key={ci}
                    style={[
                      styles.tile,
                      {
                        width: tileSize,
                        height: tileSize,
                        backgroundColor: background.cardColor,
                        borderColor: ci === changed ? '#4ecca3' : background.borderColor,
                        borderWidth: ci === changed ? 2.5 : 1.5,
                      },
                    ]}
                  >
                    <Text style={[styles.tileText, { color: background.textColor, fontSize: tileSize * 0.42 }]}>
                      {letter.trim()}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        {/* Active input row */}
        {status === 'playing' && !alreadyLocked && (
          <View style={styles.rowWrap}>
            <View style={styles.tileRow}>
              {currentCells.map((letter, ci) => (
                <View
                  key={ci}
                  style={[
                    styles.tile,
                    {
                      width: tileSize,
                      height: tileSize,
                      backgroundColor: background.cardColor,
                      borderColor: error ? '#e94560' : background.borderColor,
                      borderWidth: 1.5,
                    },
                  ]}
                >
                  <Text style={[styles.tileText, { color: background.textColor, fontSize: tileSize * 0.42 }]}>
                    {letter}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Target rung */}
        <View style={styles.rowWrap}>
          <Text style={[styles.rowLabel, { color: background.secondaryText }]}>TARGET</Text>
          <View style={styles.tileRow}>
            {buildTiles(displayEnd, wordLength).map((letter, ci) => (
              <View
                key={ci}
                style={[
                  styles.tile,
                  styles.targetTile,
                  {
                    width: tileSize,
                    height: tileSize,
                    borderColor: '#d4a017',
                    backgroundColor: isWin ? '#4ecca322' : 'transparent',
                  },
                ]}
              >
                <Text style={[styles.tileText, { color: background.textColor, fontSize: tileSize * 0.42 }]}>
                  {letter.trim()}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Error message */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Controls */}
      {status === 'playing' && !alreadyLocked && (
        <View style={styles.controlsRow}>
          <Pressable
            style={[styles.controlButton, { borderColor: background.borderColor }, hintsUsed >= MAX_HINTS && styles.controlButtonDisabled]}
            onPress={handleHint}
            disabled={hintsUsed >= MAX_HINTS}
          >
            <Lightbulb size={16} color={background.textColor} />
            <Text style={[styles.controlButtonText, { color: background.textColor }]}>
              Hint ({MAX_HINTS - hintsUsed})
            </Text>
          </Pressable>
          <Pressable style={[styles.controlButton, { borderColor: background.borderColor }]} onPress={handleGiveUp}>
            <FlagOff size={16} color={background.textColor} />
            <Text style={[styles.controlButtonText, { color: background.textColor }]}>Give Up</Text>
          </Pressable>
        </View>
      )}

      {/* Keyboard */}
      {status === 'playing' && !alreadyLocked && (
        <View style={styles.keyboard}>
          {KEYBOARD_ROWS.map((row, ri) => (
            <View key={ri} style={styles.keyboardRow}>
              {ri === 2 && (
                <Pressable
                  style={[styles.key, styles.wideKey, { backgroundColor: background.cardColor }]}
                  onPress={handleSubmit}
                >
                  <Text style={[styles.keyText, { color: background.textColor, fontSize: 11 }]}>ENTER</Text>
                </Pressable>
              )}
              {row.split('').map((letter) => (
                <Pressable
                  key={letter}
                  style={[styles.key, { backgroundColor: background.cardColor }]}
                  onPress={() => handleKeyPress(letter)}
                >
                  <Text style={[styles.keyText, { color: background.textColor }]}>{letter}</Text>
                </Pressable>
              ))}
              {ri === 2 && (
                <Pressable
                  style={[styles.key, styles.wideKey, { backgroundColor: background.cardColor }]}
                  onPress={handleBackspace}
                >
                  <Text style={[styles.keyText, { color: background.textColor, fontSize: 16 }]}>⌫</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      )}

      <LadderResultOverlay
        visible={showResult}
        mode={mode}
        status={alreadyLocked && lockedResult ? (lockedResult.result === 'won' ? 'won' : 'gave_up') : status === 'won' ? 'won' : 'gave_up'}
        startWord={puzzle.start}
        endWord={puzzle.end}
        steps={alreadyLocked && lockedResult ? lockedResult.steps : chain.length - 1}
        par={puzzle.par}
        timeSeconds={alreadyLocked && lockedResult ? lockedResult.timeSeconds : elapsed}
        hintsUsed={alreadyLocked && lockedResult ? lockedResult.hintsUsed : hintsUsed}
        currentStreak={finalStreaks.current}
        bestStreak={finalStreaks.best}
        nextDailySecondsRemaining={mode === 'daily' ? parseCountdownSeconds(countdown) : null}
        shareText={shareText}
        onClose={() => setShowResult(false)}
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

export default LadderPlayScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 6,
  },
  backButton: { padding: 8 },
  backText: { fontSize: 15, fontWeight: '500' },
  title: { fontSize: 18, fontWeight: 'bold' },
  timerBox: { width: 60, alignItems: 'flex-end', paddingRight: 4 },
  timerText: { fontSize: 15, fontWeight: '600' },

  ladderScroll: { flex: 1 },
  ladderContent: { paddingHorizontal: 20, paddingTop: 6, alignItems: 'center' },
  rowWrap: { alignItems: 'center', marginBottom: 8 },
  rowLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  tileRow: { flexDirection: 'row', gap: 6 },
  tile: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetTile: { borderStyle: 'dashed', borderWidth: 2 },
  tileText: { fontWeight: '900' },

  errorText: {
    textAlign: 'center',
    color: '#e94560',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },

  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  controlButtonDisabled: { opacity: 0.4 },
  controlButtonText: { fontSize: 13, fontWeight: '700' },

  keyboard: { paddingHorizontal: 4, paddingBottom: 10 },
  keyboardRow: { flexDirection: 'row', justifyContent: 'center', marginVertical: 3, gap: 4 },
  key: {
    minWidth: 30,
    height: 46,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  wideKey: { minWidth: 46, paddingHorizontal: 6 },
  keyText: { fontSize: 15, fontWeight: '700' },
});
