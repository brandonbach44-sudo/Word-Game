import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../shared/ThemeContext';
import { COLORS } from '../shared/theme';

import { AchievementPopup } from './Components/AchievementPopup';
import { DailyChallengeCard } from './Components/DailyChallengeCard';
import { DailyChallengePopup } from './Components/DailyChallengePopup';
import { GameStatus } from './Components/GameStatus';
import { HangmanFigure } from './Components/HangmanFigure';
import { Keyboard } from './Components/Keyboard';
import { WordDisplay } from './Components/WordDisplay';

import { DAILY_WORDS } from './data/dailyWords';
import {
  DailyChallengeStats,
  getDailyWordIndex,
  getTodayDateString,
  loadDailyStats,
  saveDailyResult,
} from './utils/dailyChallenge';

import { useHangman } from './Hooks/useHangman';

import { PHRASE_CATEGORIES, WORD_CATEGORIES } from './data/words';
import {
  Achievement,
  checkAchievements,
  getLockedAchievements,
  getTotalAchievementCount,
  getUnlockedAchievementsWithDetails,
} from './utils/achievements';
import {
  getAverageIncorrectGuesses,
  getBestCategory,
  getFavoriteCategory,
  getGuessAccuracy,
  getUniqueWordsCount,
  getWinRate,
  HangmanStats,
  loadHangmanStats,
  updateStatsAfterGame,
} from './utils/storage';

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  backButton: { padding: 8 },
  backButtonText: { fontSize: 16, fontWeight: '500' },
  title: { fontSize: 22, fontWeight: 'bold' },
  headerPlaceholder: { width: 60 },
  segmentSwitcher: { flexDirection: 'row', alignSelf: 'center', marginTop: 12, marginBottom: 8, borderRadius: 999, padding: 4 },
  segmentButton: { paddingVertical: 8, paddingHorizontal: 24, borderRadius: 999 },
  segmentButtonText: { fontSize: 14, fontWeight: '500' },
  playScrollView: { flex: 1 },
  playContainer: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 20 },
  startTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  startDescription: { fontSize: 16, textAlign: 'center', marginBottom: 24 },
  gameModeCard: { width: '100%', padding: 20, borderRadius: 16, borderWidth: 2, marginBottom: 12, alignItems: 'center' },
  gameModeTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  gameModeDescription: { fontSize: 14 },
  rulesContainer: { width: '100%', padding: 20, borderRadius: 16, borderWidth: 1, marginTop: 12 },
  rulesTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  ruleItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  ruleNumber: { fontSize: 18, fontWeight: 'bold', width: 28 },
  ruleText: { fontSize: 14, flex: 1 },
  gameInfoBar: { flexDirection: 'row', marginHorizontal: 20, padding: 12, borderRadius: 12, borderWidth: 1 },
  infoItem: { flex: 1, alignItems: 'center' },
  infoLabel: { fontSize: 12, marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: 'bold' },
  infoDivider: { width: 1, marginHorizontal: 12 },
  figureContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  keyboardContainer: { marginTop: 'auto', paddingBottom: 16 },
  categoryContainer: { flex: 1 },
  categoryContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  categoryTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  categorySubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  categoryCard: { width: '48%', padding: 20, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  categoryCardText: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  statsContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 15 },
  statsSectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  statsCard: { width: '48%', padding: 15, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  statsCardWide: { width: '100%' },
  statsValue: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  statsLabel: { fontSize: 12, textAlign: 'center' },
  loadingText: { fontSize: 16, textAlign: 'center', marginTop: 20 },
  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  achievementCard: { width: '48%', padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  achievementCardLocked: { opacity: 0.5 },
  achievementEmoji: { fontSize: 32, marginBottom: 6 },
  achievementEmojiLocked: { opacity: 0.5 },
  achievementName: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 2 },
  achievementDesc: { fontSize: 11, textAlign: 'center' },
  achievementTextLocked: { opacity: 0.7 },
  lockedDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 15, fontSize: 14, fontWeight: '500' }
});

type SegmentKey = 'play' | 'stats';
type GameMode = 'menu' | 'category-select' | 'playing';
type GameType = 'daily' | 'words' | 'phrases';

type StatsCardProps = {
  label: string;
  value: string;
  wide?: boolean;
  textColor: string;
  secondaryText: string;
  cardColor: string;
  borderColor: string;
};
const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  wide = false,
  textColor,
  secondaryText,
  cardColor,
  borderColor,
}) => (
  <View
    style={[
      styles.statsCard,
      wide && styles.statsCardWide,
      { backgroundColor: cardColor, borderColor },
    ]}
  >
    <Text style={[styles.statsValue, { color: textColor }]}>{value}</Text>
    <Text style={[styles.statsLabel, { color: secondaryText }]}>{label}</Text>
  </View>
);

type CategoryCardProps = {
  name: string;
  onPress: () => void;
  textColor: string;
  cardColor: string;
  borderColor: string;
};
const CategoryCard: React.FC<CategoryCardProps> = ({
  name,
  onPress,
  textColor,
  cardColor,
  borderColor,
}) => (
  <TouchableOpacity
    style={[styles.categoryCard, { backgroundColor: cardColor, borderColor }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.categoryCardText, { color: textColor }]}>{name}</Text>
  </TouchableOpacity>
);

export default function HangmanScreen() {
  const { background } = useTheme();

  const [segment, setSegment] = useState<SegmentKey>('play');
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [gameType, setGameType] = useState<GameType>('words');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [playerStats, setPlayerStats] = useState<HangmanStats | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<(Achievement & { unlockedAt: string })[]>([]);
  const [lockedAchievements, setLockedAchievements] = useState<Achievement[]>([]);
  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([]);
  const [currentPopupAchievement, setCurrentPopupAchievement] = useState<Achievement | null>(null);

  // Daily Challenge state
  const [dailyStats, setDailyStats] = useState<DailyChallengeStats | null>(null);
  const [showDailyPopup, setShowDailyPopup] = useState(false);
  const [playingDaily, setPlayingDaily] = useState(false);
  const [dailyGameInitialized, setDailyGameInitialized] = useState(false);
  const [dailyWord, setDailyWord] = useState<string>('');

  const {
    word,
    category,
    incorrectGuesses,
    correctGuesses,
    remainingAttempts,
    maxAttempts,
    status,
    isPlaying,
    isWon,
    isLost,
    isIdle,
    startGame,
    startGameWithCategory,
    guessLetter,
    getDisplayWord,
    isLetterGuessed,
    isLetterCorrect,
    isLetterIncorrect,
    getGameStats,
  } = useHangman();

  const stats = getGameStats();
  const displayWord = getDisplayWord();

  useEffect(() => {
    const loadData = async () => {
      const [stats, unlocked, locked] = await Promise.all([
        loadHangmanStats(),
        getUnlockedAchievementsWithDetails(),
        getLockedAchievements(),
      ]);
      setPlayerStats(stats);
      setUnlockedAchievements(unlocked);
      setLockedAchievements(locked);
    };
    loadData();
    loadDailyStats().then(setDailyStats);
  }, []);

  useEffect(() => {
    if (pendingAchievements.length > 0 && !currentPopupAchievement) {
      setCurrentPopupAchievement(pendingAchievements[0]);
      setPendingAchievements((prev) => prev.slice(1));
    }
  }, [pendingAchievements, currentPopupAchievement]);

  const handleAchievementDismiss = () => setCurrentPopupAchievement(null);

  useEffect(() => {
    if ((isWon || isLost) && !playingDaily) {
      const saveGameStats = async () => {
        const updatedStats = await updateStatsAfterGame(
          isWon,
          word,
          category,
          correctGuesses.length,
          incorrectGuesses.length,
          remainingAttempts
        );
        setPlayerStats(updatedStats);

        const gameResult = {
          won: isWon,
          incorrectGuesses: incorrectGuesses.length,
          remainingLives: remainingAttempts,
        };
        const newAchievements = await checkAchievements(updatedStats, gameResult);
        if (newAchievements.length > 0) {
          setPendingAchievements((prev) => [...prev, ...newAchievements]);
        }
        const [unlocked, locked] = await Promise.all([
          getUnlockedAchievementsWithDetails(),
          getLockedAchievements(),
        ]);
        setUnlockedAchievements(unlocked);
        setLockedAchievements(locked);
      };
      saveGameStats();
    }
  }, [isWon, isLost, playingDaily]);

  useEffect(() => {
    if (!isPlaying) setSelectedLetter(null);
  }, [isPlaying]);

  useEffect(() => {
    if ((isPlaying || isWon || isLost) && !playingDaily) setGameMode('playing');
  }, [isPlaying, isWon, isLost, playingDaily]);

  // Daily Challenge Game Logic
  useEffect(() => {
    if (playingDaily && !dailyGameInitialized) {
      const idx = getDailyWordIndex(DAILY_WORDS, new Date());
      const todayWord = DAILY_WORDS[idx];
      setDailyWord(todayWord);
      startGameWithCategory('Daily Challenge', false);
      setGameMode('playing');
      setDailyGameInitialized(true);
    }
  }, [playingDaily, dailyGameInitialized, startGameWithCategory]);

  useEffect(() => {
    if (
      playingDaily &&
      dailyGameInitialized &&
      (status === 'won' || status === 'lost')
    ) {
      saveDailyResult(status === 'won' ? 'won' : 'lost', dailyWord).then(() => {
        setShowDailyPopup(true);
        setPlayingDaily(false);
        setDailyGameInitialized(false);
        setGameMode('menu');
        loadDailyStats().then(setDailyStats);
      });
    }
  }, [status, playingDaily, dailyGameInitialized, dailyWord]);

  const handleBackToMenu = () => router.back();
  const handleBackToModeSelect = () => { setGameMode('menu'); setSelectedCategory(null); };
  const handleBackToCategorySelect = () => setGameMode('category-select');
  const handlePlayAgain = () => {
    setSelectedLetter(null);
    if (selectedCategory && selectedCategory !== 'Daily Challenge') {
      startGameWithCategory(selectedCategory, gameType === 'phrases');
    } else {
      startGame();
    }
  };
  const handleSelectGameType = (type: GameType) => {
    setGameType(type);
    if (type === 'daily') {
      if (dailyStats?.lastPlayedDate === getTodayDateString()) {
        setShowDailyPopup(true);
      } else {
        setPlayingDaily(true);
        setDailyGameInitialized(false);
        setDailyWord('');
        setSelectedCategory('Daily Challenge');
      }
    } else {
      setGameMode('category-select');
    }
  };
  const handleSelectCategory = (categoryName: string) => {
    setSelectedCategory(categoryName);
    startGameWithCategory(categoryName, gameType === 'phrases');
    setGameMode('playing');
  };
  const handleKeyPress = (letter: string) => setSelectedLetter(letter);
  const handleEnter = () => { if (selectedLetter) { guessLetter(selectedLetter); setSelectedLetter(null); } };
  const handleBack = () => setSelectedLetter(null);
  const getCategories = () => (
    gameType === 'phrases' ? Object.keys(PHRASE_CATEGORIES) : Object.keys(WORD_CATEGORIES)
  );

  // --- GAME MODES ---
  if (gameMode === 'playing' && (isPlaying || isWon || isLost)) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: background.backgroundColor }]}>
        <StatusBar barStyle={background.statusBar === 'light' ? 'light-content' : 'dark-content'} />
        <AchievementPopup
          achievement={currentPopupAchievement}
          onDismiss={handleAchievementDismiss}
          backgroundColor={background.cardColor}
          textColor={background.textColor}
        />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToModeSelect}>
            <Text style={[styles.backButtonText, { color: background.secondaryText }]}>
              ← Back
            </Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: background.textColor }]}>Hangman</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={[
          styles.gameInfoBar,
          { backgroundColor: background.cardColor, borderColor: background.borderColor },
        ]}>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: background.secondaryText }]}>Category</Text>
            <Text style={[styles.infoValue, { color: COLORS.accent }]}>
              {playingDaily ? "Random Category" : category}
            </Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: background.borderColor }]} />
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: background.secondaryText }]}>
              Lives Left
            </Text>
            <Text style={[
              styles.infoValue,
              { color: remainingAttempts <= 2 ? COLORS.danger : background.textColor }
            ]}>
              {remainingAttempts}/{maxAttempts}
            </Text>
          </View>
        </View>
        <View style={styles.figureContainer}>
          <HangmanFigure
            incorrectGuesses={incorrectGuesses.length}
            maxAttempts={maxAttempts}
            isWon={isWon}
            isLost={isLost}
          />
        </View>
        <WordDisplay
          displayWord={displayWord}
          isWon={isWon}
          isLost={isLost}
          actualWord={word}
        />
        <View style={styles.keyboardContainer}>
          <Keyboard
            selectedLetter={selectedLetter}
            onKeyPress={handleKeyPress}
            onEnter={handleEnter}
            onBack={handleBack}
            isLetterGuessed={isLetterGuessed}
            isLetterCorrect={isLetterCorrect}
            isLetterIncorrect={isLetterIncorrect}
            disabled={!isPlaying}
          />
        </View>
        <GameStatus
          isVisible={isWon || isLost}
          isWon={isWon}
          word={word}
          category={playingDaily ? 'Random Category' : category}
          incorrectGuesses={incorrectGuesses.length}
          totalGuesses={stats.totalGuesses}
          onPlayAgain={handlePlayAgain}
          onBackToMenu={() => {
            setShowDailyPopup(false);
            setPlayingDaily(false);
            setGameMode('menu');
            setSelectedCategory(null);
          }}
        />
        {playingDaily && showDailyPopup && dailyStats && (
          <DailyChallengePopup
            visible={showDailyPopup}
            won={dailyStats.lastDailyResult === 'won'}
            word={dailyStats.lastDailyWord || ''}
            streak={dailyStats.streak || 0}
            bestStreak={dailyStats.bestStreak || 0}
            onBackToMenu={() => {
              setShowDailyPopup(false);
              setGameMode('menu');
              setPlayingDaily(false);
              setSelectedCategory(null);
            }}
          />
        )}
      </SafeAreaView>
    );
  }

  if (gameMode === 'category-select') {
    const categories = getCategories();
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: background.backgroundColor }]}>
        <StatusBar barStyle={background.statusBar === 'light' ? 'light-content' : 'dark-content'} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToModeSelect}>
            <Text style={[styles.backButtonText, { color: background.secondaryText }]}>
              ← Back
            </Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: background.textColor }]}>
            {gameType === 'phrases' ? 'Phrases' : 'Words'}
          </Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <ScrollView
          style={styles.categoryContainer}
          contentContainerStyle={styles.categoryContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.categoryTitle, { color: background.textColor }]}>
            Pick a Category
          </Text>
          <Text style={[styles.categorySubtitle, { color: background.secondaryText }]}>
            {gameType === 'phrases'
              ? 'Guess famous phrases letter by letter'
              : 'Guess single words letter by letter'}
          </Text>
          <View style={styles.categoryGrid}>
            {categories.map((categoryName) => (
              <CategoryCard
                key={categoryName}
                name={categoryName}
                onPress={() => handleSelectCategory(categoryName)}
                textColor={background.textColor}
                cardColor={background.cardColor}
                borderColor={background.borderColor}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: background.backgroundColor }]}>
      <StatusBar barStyle={background.statusBar === 'light' ? 'light-content' : 'dark-content'} />
      <AchievementPopup
        achievement={currentPopupAchievement}
        onDismiss={handleAchievementDismiss}
        backgroundColor={background.cardColor}
        textColor={background.textColor}
      />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToMenu}>
          <Text style={[styles.backButtonText, { color: background.secondaryText }]}>
            ← Games
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: background.textColor }]}>Hangman</Text>
        <View style={styles.headerPlaceholder} />
      </View>
      <View style={[styles.segmentSwitcher, { backgroundColor: background.cardColor }]}>
        {(['play', 'stats'] as SegmentKey[]).map((key) => {
          const isActive = key === segment;
          const label = key === 'play' ?  'Play' : 'Stats';
          return (
            <Pressable
              key={key}
              style={[
                styles.segmentButton,
                isActive && { backgroundColor: background.backgroundColor },
              ]}
              onPress={() => setSegment(key)}
            >
              <Text style={[
                styles.segmentButtonText,
                { color: background.secondaryText },
                isActive && { color: background.textColor, fontWeight: '600' },
              ]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {segment === 'play' && (
        <ScrollView
          style={styles.playScrollView}
          contentContainerStyle={styles.playContainer}
          showsVerticalScrollIndicator={false}
        >
          <DailyChallengeCard
            played={dailyStats?.lastPlayedDate === getTodayDateString()}
            streak={dailyStats?.streak || 0}
            bestStreak={dailyStats?.bestStreak || 0}
            onPlay={() => {
              if (dailyStats?.lastPlayedDate === getTodayDateString()) {
                setShowDailyPopup(true);
              } else {
                setPlayingDaily(true);
                setDailyGameInitialized(false);
                setDailyWord('');
                setSelectedCategory('Daily Challenge');
              }
            }}
          />
          <Text style={[styles.startTitle, { color: background.textColor }]}>
            Ready to Play? 
          </Text>
          <Text style={[styles.startDescription, { color: background.secondaryText }]}>
            Choose a game mode to begin
          </Text>
          <TouchableOpacity
            style={[
              styles.gameModeCard,
              { backgroundColor: background.cardColor, borderColor: background.borderColor },
            ]}
            onPress={() => handleSelectGameType('words')}
            activeOpacity={0.8}
          >
            <Text style={[styles.gameModeTitle, { color: background.textColor }]}>Words</Text>
            <Text style={[styles.gameModeDescription, { color: background.secondaryText }]}>
              Guess single words by category
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.gameModeCard,
              { backgroundColor: background.cardColor, borderColor: background.borderColor },
            ]}
            onPress={() => handleSelectGameType('phrases')}
            activeOpacity={0.8}
          >
            <Text style={[styles.gameModeTitle, { color: background.textColor }]}>Phrases</Text>
            <Text style={[styles.gameModeDescription, { color: background.secondaryText }]}>
              Guess famous phrases by category
            </Text>
          </TouchableOpacity>
          <View
            style={[
              styles.rulesContainer,
              { backgroundColor: background.cardColor, borderColor: background.borderColor },
            ]}
          >
            <Text style={[styles.rulesTitle, { color: background.textColor }]}>
              How to Play
            </Text>
            <View style={styles.ruleItem}>
              <Text style={[styles.ruleNumber, { color: COLORS.accent }]}>1</Text>
              <Text style={[styles.ruleText, { color: background.secondaryText }]}>
                Choose a game mode and category
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={[styles.ruleNumber, { color: COLORS.accent }]}>2</Text>
              <Text style={[styles.ruleText, { color: background.secondaryText }]}>
                Tap a letter, then tap ENTER to guess
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={[styles.ruleNumber, { color: COLORS.accent }]}>3</Text>
              <Text style={[styles.ruleText, { color: background.secondaryText }]}>
                Wrong guesses add parts to the hangman
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={[styles.ruleNumber, { color: COLORS.accent }]}>4</Text>
              <Text style={[styles.ruleText, { color: background.secondaryText }]}>
                Guess the word before 6 wrong attempts! 
              </Text>
            </View>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
      {segment === 'stats' && (
        <ScrollView style={styles.statsContainer} showsVerticalScrollIndicator={false}>
          {playerStats ? (
            <>
              <Text style={[styles.statsSectionTitle, { color: background.textColor }]}>Overall Stats</Text>
              <View style={styles.statsGrid}>
                <StatsCard
                  label="Games Played"
                  value={playerStats.gamesPlayed.toString()}
                  textColor={background.textColor}
                  secondaryText={background.secondaryText}
                  cardColor={background.cardColor}
                  borderColor={background.borderColor}
                />
                <StatsCard
                  label="Win Rate"
                  value={`${getWinRate(playerStats)}%`}
                  textColor={background.textColor}
                  secondaryText={background.secondaryText}
                  cardColor={background.cardColor}
                  borderColor={background.borderColor}
                />
                <StatsCard
                  label="Games Won"
                  value={playerStats.gamesWon.toString()}
                  textColor={background.textColor}
                  secondaryText={background.secondaryText}
                  cardColor={background.cardColor}
                  borderColor={background.borderColor}
                />
                <StatsCard
                  label="Games Lost"
                  value={playerStats.gamesLost.toString()}
                  textColor={background.textColor}
                  secondaryText={background.secondaryText}
                  cardColor={background.cardColor}
                  borderColor={background.borderColor}
                />
              </View>
              <Text style={[styles.statsSectionTitle, { color: background.textColor, marginTop: 24 }]}>Streaks</Text>
              <View style={styles.statsGrid}>
                <StatsCard
                  label="Current Win Streak"
                  value={playerStats.currentStreak.toString()}
                  textColor={background.textColor}
                  secondaryText={background.secondaryText}
                  cardColor={background.cardColor}
                  borderColor={background.borderColor}
                />
                <StatsCard
                  label="Best Win Streak"
                  value={playerStats.bestStreak.toString()}
                  textColor={background.textColor}
                  secondaryText={background.secondaryText}
                  cardColor={background.cardColor}
                  borderColor={background.borderColor}
                />
                <StatsCard
                  label="Current Day Streak"
                  value={playerStats.currentDayStreak.toString()}
                  textColor={background.textColor}
                  secondaryText={background.secondaryText}
                  cardColor={background.cardColor}
                  borderColor={background.borderColor}
                />
                <StatsCard
                  label="Best Day Streak"
                  value={playerStats.bestDayStreak.toString()}
                  textColor={background.textColor}
                  secondaryText={background.secondaryText}
                  cardColor={background.cardColor}
                  borderColor={background.borderColor}
                />
              </View>
              <Text style={[styles.statsSectionTitle, { color: background.textColor, marginTop: 24 }]}>Performance</Text>
              <View style={styles.statsGrid}>
                <StatsCard
                  label="Guess Accuracy"
                  value={`${getGuessAccuracy(playerStats)}%`}
                  textColor={background.textColor}
                  secondaryText={background.secondaryText}
                  cardColor={background.cardColor}
                  borderColor={background.borderColor}
                />
                <StatsCard
                  label="Avg.  Wrong Guesses"
                  value={getAverageIncorrectGuesses(playerStats).toString()}
                  textColor={background.textColor}
                  secondaryText={background.secondaryText}
                  cardColor={background.cardColor}
                  borderColor={background.borderColor}
                />
                <StatsCard
                  label="Perfect Games"
                  value={playerStats.perfectGames.toString()}
                  textColor={background.textColor}
                  secondaryText={background.secondaryText}
                  cardColor={background.cardColor}
                  borderColor={background.borderColor}
                />
                <StatsCard
                  label="Close Calls"
                  value={playerStats.closeGames.toString()}
                  textColor={background.textColor}
                  secondaryText={background.secondaryText}
                  cardColor={background.cardColor}
                  borderColor={background.borderColor}
                />
              </View>
              <Text style={[styles.statsSectionTitle, { color: background.textColor, marginTop: 24 }]}>Categories</Text>
              <View style={styles.statsGrid}>
                <StatsCard
                  label="Favorite Category"
                  value={getFavoriteCategory(playerStats)}
                  textColor={background.textColor}
                  secondaryText={background.secondaryText}
                  cardColor={background.cardColor}
                  borderColor={background.borderColor}
                />
                <StatsCard
                  label="Best Category"
                  value={getBestCategory(playerStats)}
                  textColor={background.textColor}
                  secondaryText={background.secondaryText}
                  cardColor={background.cardColor}
                  borderColor={background.borderColor}
                />
                <StatsCard
                  label="Unique Words"
                  value={getUniqueWordsCount(playerStats).toString()}
                  wide
                  textColor={background.textColor}
                  secondaryText={background.secondaryText}
                  cardColor={background.cardColor}
                  borderColor={background.borderColor}
                />
              </View>
              <Text style={[styles.statsSectionTitle, { color: background.textColor, marginTop: 24 }]}>
                Achievements ({unlockedAchievements.length}/{getTotalAchievementCount()})
              </Text>
              {unlockedAchievements.length > 0 && (
                <View style={styles.achievementsGrid}>
                  {unlockedAchievements.map((achievement) => (
                    <View
                      key={achievement.id}
                      style={[
                        styles.achievementCard,
                        { backgroundColor: background.cardColor, borderColor: background.borderColor },
                      ]}
                    >
                      <Text style={[styles.achievementEmoji]}>{achievement.emoji}</Text>
                      <Text style={[styles.achievementName, { color: background.textColor }]} numberOfLines={1}>
                        {achievement.name}
                      </Text>
                      <Text style={[styles.achievementDesc, { color: background.secondaryText }]} numberOfLines={2}>
                        {achievement.description}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              {lockedAchievements.length > 0 && unlockedAchievements.length > 0 && (
                <View style={styles.lockedDivider}>
                  <View
                    style={[styles.dividerLine, { backgroundColor: background.borderColor }]}
                  />
                  <Text style={[styles.dividerText, { color: background.secondaryText }]}>
                    Locked
                  </Text>
                  <View
                    style={[styles.dividerLine, { backgroundColor: background.borderColor }]}
                  />
                </View>
              )}
              {lockedAchievements.length > 0 && (
                <View style={styles.achievementsGrid}>
                  {lockedAchievements.map((achievement) => (
                    <View
                      key={achievement.id}
                      style={[
                        styles.achievementCard,
                        styles.achievementCardLocked,
                        { backgroundColor: background.cardColor, borderColor: background.borderColor },
                      ]}
                    >
                      <Text style={[styles.achievementEmoji, styles.achievementEmojiLocked]}>{achievement.emoji}</Text>
                      <Text style={[
                        styles.achievementName,
                        { color: background.textColor },
                        styles.achievementTextLocked,
                      ]} numberOfLines={1}>
                        {achievement.name}
                      </Text>
                      <Text style={[
                        styles.achievementDesc,
                        { color: background.secondaryText },
                        styles.achievementTextLocked,
                      ]} numberOfLines={2}>
                        {achievement.description}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={{ height: 40 }} />
            </>
          ) : (
            <Text style={[styles.loadingText, { color: background.secondaryText }]}>
              Loading stats...
            </Text>
          )}
        </ScrollView>
      )}
      {dailyStats && (
        <DailyChallengePopup
          visible={showDailyPopup}
          won={dailyStats.lastDailyResult === 'won'}
          word={dailyStats.lastDailyWord || ''}
          streak={dailyStats.streak || 0}
          bestStreak={dailyStats.bestStreak || 0}
          onBackToMenu={() => {
            setShowDailyPopup(false);
            setGameMode('menu');
            setPlayingDaily(false);
            setSelectedCategory(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}