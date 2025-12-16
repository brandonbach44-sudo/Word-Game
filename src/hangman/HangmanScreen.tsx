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

// Components
import { AchievementPopup } from './Components/AchievementPopup';
import { GameStatus } from './Components/GameStatus';
import { HangmanFigure } from './Components/HangmanFigure';
import { Keyboard } from './Components/Keyboard';
import { WordDisplay } from './Components/WordDisplay';

// Hooks
import { useHangman } from './Hooks/useHangman';

// Storage & Achievements
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

// Word data
import { PHRASE_CATEGORIES, WORD_CATEGORIES } from './data/words';

type SegmentKey = 'play' | 'stats';
type GameMode = 'menu' | 'category-select' | 'playing';
type GameType = 'daily' | 'words' | 'phrases';

// Stats Card Component
const StatsCard = ({
  label,
  value,
  wide = false,
  textColor,
  secondaryText,
  cardColor,
  borderColor,
}:  {
  label: string;
  value: string;
  wide?: boolean;
  textColor:  string;
  secondaryText:  string;
  cardColor: string;
  borderColor: string;
}) => (
  <View
    style={[
      styles.statsCard,
      wide && styles.statsCardWide,
      { backgroundColor: cardColor, borderColor },
    ]}
  >
    <Text style={[styles. statsValue, { color: textColor }]}>{value}</Text>
    <Text style={[styles.statsLabel, { color: secondaryText }]}>{label}</Text>
  </View>
);

// Achievement Card Component
const AchievementCard = ({
  achievement,
  isUnlocked,
  textColor,
  secondaryText,
  cardColor,
  borderColor,
}: {
  achievement: Achievement;
  isUnlocked: boolean;
  textColor: string;
  secondaryText: string;
  cardColor:  string;
  borderColor: string;
}) => (
  <View
    style={[
      styles.achievementCard,
      { backgroundColor: cardColor, borderColor },
      ! isUnlocked && styles.achievementCardLocked,
    ]}
  >
    <Text style={[styles.achievementEmoji, ! isUnlocked && styles.achievementEmojiLocked]}>
      {achievement. emoji}
    </Text>
    <Text
      style={[
        styles. achievementName,
        { color: textColor },
        !isUnlocked && styles.achievementTextLocked,
      ]}
      numberOfLines={1}
    >
      {achievement.name}
    </Text>
    <Text
      style={[
        styles. achievementDesc,
        { color: secondaryText },
        !isUnlocked && styles.achievementTextLocked,
      ]}
      numberOfLines={2}
    >
      {achievement.description}
    </Text>
  </View>
);

// Category Card Component
const CategoryCard = ({
  name,
  onPress,
  textColor,
  cardColor,
  borderColor,
}: {
  name: string;
  onPress: () => void;
  textColor: string;
  cardColor: string;
  borderColor: string;
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

  // Segment State
  const [segment, setSegment] = useState<SegmentKey>('play');

  // Game Mode State
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [gameType, setGameType] = useState<GameType>('words');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Stats State
  const [playerStats, setPlayerStats] = useState<HangmanStats | null>(null);

  // Selected Letter State (for keyboard)
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  // Achievement State
  const [unlockedAchievements, setUnlockedAchievements] = useState<
    (Achievement & { unlockedAt:  string })[]
  >([]);
  const [lockedAchievements, setLockedAchievements] = useState<Achievement[]>([]);
  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([]);
  const [currentPopupAchievement, setCurrentPopupAchievement] = useState<Achievement | null>(
    null
  );

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

  // Load stats and achievements on mount
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
  }, []);

  // Show achievement popups one at a time
  useEffect(() => {
    if (pendingAchievements.length > 0 && ! currentPopupAchievement) {
      setCurrentPopupAchievement(pendingAchievements[0]);
      setPendingAchievements((prev) => prev.slice(1));
    }
  }, [pendingAchievements, currentPopupAchievement]);

  const handleAchievementDismiss = () => {
    setCurrentPopupAchievement(null);
  };

  // Save stats and check achievements when game ends
  useEffect(() => {
    if (isWon || isLost) {
      const saveGameStats = async () => {
        const updatedStats = await updateStatsAfterGame(
          isWon,
          word,
          category,
          correctGuesses. length,
          incorrectGuesses.length,
          remainingAttempts
        );
        setPlayerStats(updatedStats);

        // Check for new achievements
        const gameResult = {
          won: isWon,
          incorrectGuesses:  incorrectGuesses.length,
          remainingLives: remainingAttempts,
        };
        const newAchievements = await checkAchievements(updatedStats, gameResult);

        if (newAchievements.length > 0) {
          setPendingAchievements((prev) => [...prev, ...newAchievements]);
        }

        // Refresh achievement lists
        const [unlocked, locked] = await Promise.all([
          getUnlockedAchievementsWithDetails(),
          getLockedAchievements(),
        ]);
        setUnlockedAchievements(unlocked);
        setLockedAchievements(locked);
      };
      saveGameStats();
    }
  }, [isWon, isLost]);

  // Clear selected letter when game ends or resets
  useEffect(() => {
    if (! isPlaying) {
      setSelectedLetter(null);
    }
  }, [isPlaying]);

  // Update game mode when game starts/ends
  useEffect(() => {
    if (isPlaying || isWon || isLost) {
      setGameMode('playing');
    }
  }, [isPlaying, isWon, isLost]);

  const handleBackToMenu = () => {
    router.back();
  };

  const handleBackToModeSelect = () => {
    setGameMode('menu');
    setSelectedCategory(null);
  };

  const handleBackToCategorySelect = () => {
    setGameMode('category-select');
  };

  const handlePlayAgain = () => {
    setSelectedLetter(null);
    if (selectedCategory) {
      startGameWithCategory(selectedCategory, gameType === 'phrases');
    } else {
      startGame();
    }
  };

  const handleSelectGameType = (type: GameType) => {
    setGameType(type);
    if (type === 'daily') {
      // Daily challenge - random category
      setSelectedCategory(null);
      startGame();
    } else {
      // Words or Phrases - show category selection
      setGameMode('category-select');
    }
  };

  const handleSelectCategory = (categoryName: string) => {
    setSelectedCategory(categoryName);
    startGameWithCategory(categoryName, gameType === 'phrases');
  };

  const handleKeyPress = (letter: string) => {
    setSelectedLetter(letter);
  };

  const handleEnter = () => {
    if (selectedLetter) {
      guessLetter(selectedLetter);
      setSelectedLetter(null);
    }
  };

  const handleBack = () => {
    setSelectedLetter(null);
  };

  // Get categories based on game type
  const getCategories = () => {
    if (gameType === 'phrases') {
      return Object.keys(PHRASE_CATEGORIES);
    }
    return Object.keys(WORD_CATEGORIES);
  };

  // ==================== PLAYING STATE ====================
  if (gameMode === 'playing' && (isPlaying || isWon || isLost)) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: background.backgroundColor }]}>
        <StatusBar
          barStyle={background.statusBar === 'light' ? 'light-content' : 'dark-content'}
        />

        {/* Achievement Popup */}
        <AchievementPopup
          achievement={currentPopupAchievement}
          onDismiss={handleAchievementDismiss}
          backgroundColor={background.cardColor}
          textColor={background.textColor}
        />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToModeSelect}>
            <Text style={[styles.backButtonText, { color: background. secondaryText }]}>
              ← Back
            </Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: background.textColor }]}>Hangman</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Game Info Bar */}
        <View
          style={[
            styles. gameInfoBar,
            { backgroundColor: background.cardColor, borderColor: background.borderColor },
          ]}
        >
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: background.secondaryText }]}>
              Category
            </Text>
            <Text style={[styles.infoValue, { color:  COLORS.accent }]}>{category}</Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: background.borderColor }]} />
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: background. secondaryText }]}>
              Lives Left
            </Text>
            <Text
              style={[
                styles. infoValue,
                { color: remainingAttempts <= 2 ? COLORS.danger : background.textColor },
              ]}
            >
              {remainingAttempts}/{maxAttempts}
            </Text>
          </View>
        </View>

        {/* Hangman Figure */}
        <View style={styles.figureContainer}>
          <HangmanFigure
            incorrectGuesses={incorrectGuesses. length}
            maxAttempts={maxAttempts}
            isWon={isWon}
            isLost={isLost}
          />
        </View>

        {/* Word Display */}
        <WordDisplay
          displayWord={displayWord}
          isWon={isWon}
          isLost={isLost}
          actualWord={word}
        />

        {/* Keyboard */}
        <View style={styles.keyboardContainer}>
          <Keyboard
            selectedLetter={selectedLetter}
            onKeyPress={handleKeyPress}
            onEnter={handleEnter}
            onBack={handleBack}
            isLetterGuessed={isLetterGuessed}
            isLetterCorrect={isLetterCorrect}
            isLetterIncorrect={isLetterIncorrect}
            disabled={! isPlaying}
          />
        </View>

        {/* Game Status Modal */}
        <GameStatus
          isVisible={isWon || isLost}
          isWon={isWon}
          word={word}
          category={category}
          incorrectGuesses={incorrectGuesses.length}
          totalGuesses={stats. totalGuesses}
          onPlayAgain={handlePlayAgain}
          onBackToMenu={handleBackToModeSelect}
        />
      </SafeAreaView>
    );
  }

  // ==================== CATEGORY SELECT STATE ====================
  if (gameMode === 'category-select') {
    const categories = getCategories();

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: background.backgroundColor }]}>
        <StatusBar
          barStyle={background.statusBar === 'light' ? 'light-content' : 'dark-content'}
        />

        {/* Header */}
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

  // ==================== MENU STATE (with Segments) ====================
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: background.backgroundColor }]}>
      <StatusBar
        barStyle={background.statusBar === 'light' ? 'light-content' : 'dark-content'}
      />

      {/* Achievement Popup */}
      <AchievementPopup
        achievement={currentPopupAchievement}
        onDismiss={handleAchievementDismiss}
        backgroundColor={background.cardColor}
        textColor={background.textColor}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToMenu}>
          <Text style={[styles.backButtonText, { color: background.secondaryText }]}>
            ← Games
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: background.textColor }]}>Hangman</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Segment Switcher */}
      <View style={[styles.segmentSwitcher, { backgroundColor: background.cardColor }]}>
        {(['play', 'stats'] as SegmentKey[]).map((key) => {
          const isActive = key === segment;
          const label = key === 'play' ?  'Play' : 'Stats';

          return (
            <Pressable
              key={key}
              style={[
                styles. segmentButton,
                isActive && { backgroundColor: background.backgroundColor },
              ]}
              onPress={() => setSegment(key)}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  { color: background.secondaryText },
                  isActive && { color: background.textColor, fontWeight: '600' },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ===== PLAY SEGMENT ===== */}
      {segment === 'play' && (
        <ScrollView
          style={styles.playScrollView}
          contentContainerStyle={styles.playContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.startTitle, { color: background.textColor }]}>
            Ready to Play? 
          </Text>
          <Text style={[styles.startDescription, { color: background.secondaryText }]}>
            Choose a game mode to begin
          </Text>

          {/* Daily Challenge - TOP (Matching Word Builder style) */}
          <View
            style={[
              styles. dailyChallengeCard,
              { backgroundColor: background. cardColor, borderColor: background. borderColor },
            ]}
          >
            <Text style={[styles.dailyChallengeTitle, { color: background.textColor }]}>
              Daily Challenge
            </Text>
            <Text style={[styles.dailyChallengeSubtitle, { color: background.secondaryText }]}>
              A new word every day - random category
            </Text>

            <TouchableOpacity
              style={[
                styles.dailyChallengeButton,
                { backgroundColor:  background.backgroundColor, borderColor: background.borderColor },
              ]}
              onPress={() => handleSelectGameType('daily')}
              activeOpacity={0.8}
            >
              <Text style={[styles.dailyChallengeButtonText, { color: background. textColor }]}>
                Play Today's Challenge
              </Text>
            </TouchableOpacity>
          </View>

          {/* Words */}
          <TouchableOpacity
            style={[
              styles.gameModeCard,
              { backgroundColor:  background.cardColor, borderColor: background.borderColor },
            ]}
            onPress={() => handleSelectGameType('words')}
            activeOpacity={0.8}
          >
            <Text style={[styles.gameModeTitle, { color: background.textColor }]}>Words</Text>
            <Text style={[styles.gameModeDescription, { color: background.secondaryText }]}>
              Guess single words by category
            </Text>
          </TouchableOpacity>

          {/* Phrases */}
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

          {/* How to Play */}
          <View
            style={[
              styles. rulesContainer,
              { backgroundColor: background. cardColor, borderColor: background. borderColor },
            ]}
          >
            <Text style={[styles.rulesTitle, { color: background.textColor }]}>
              How to Play
            </Text>
            <View style={styles.ruleItem}>
              <Text style={[styles.ruleNumber, { color:  COLORS.accent }]}>1</Text>
              <Text style={[styles.ruleText, { color: background.secondaryText }]}>
                Choose a game mode and category
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={[styles. ruleNumber, { color:  COLORS.accent }]}>2</Text>
              <Text style={[styles.ruleText, { color: background.secondaryText }]}>
                Tap a letter, then tap ENTER to guess
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={[styles. ruleNumber, { color:  COLORS.accent }]}>3</Text>
              <Text style={[styles.ruleText, { color: background.secondaryText }]}>
                Wrong guesses add parts to the hangman
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={[styles. ruleNumber, { color:  COLORS.accent }]}>4</Text>
              <Text style={[styles.ruleText, { color: background.secondaryText }]}>
                Guess the word before 6 wrong attempts! 
              </Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ===== STATS SEGMENT ===== */}
      {segment === 'stats' && (
        <ScrollView style={styles.statsContainer} showsVerticalScrollIndicator={false}>
          {playerStats ?  (
            <>
              {/* Overall Stats */}
              <Text style={[styles.statsSectionTitle, { color: background. textColor }]}>
                Overall Stats
              </Text>
              <View style={styles.statsGrid}>
                <StatsCard
                  label="Games Played"
                  value={playerStats.gamesPlayed. toString()}
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
                  value={playerStats. gamesLost.toString()}
                  textColor={background.textColor}
                  secondaryText={background.secondaryText}
                  cardColor={background.cardColor}
                  borderColor={background.borderColor}
                />
              </View>

              {/* Streak Stats */}
              <Text
                style={[
                  styles.statsSectionTitle,
                  { color: background.textColor, marginTop: 24 },
                ]}
              >
                Streaks
              </Text>
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
                  value={playerStats.bestStreak. toString()}
                  textColor={background.textColor}
                  secondaryText={background.secondaryText}
                  cardColor={background.cardColor}
                  borderColor={background.borderColor}
                />
                <StatsCard
                  label="Current Day Streak"
                  value={playerStats.currentDayStreak. toString()}
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

              {/* Performance Stats */}
              <Text
                style={[
                  styles.statsSectionTitle,
                  { color: background.textColor, marginTop: 24 },
                ]}
              >
                Performance
              </Text>
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
                  secondaryText={background. secondaryText}
                  cardColor={background.cardColor}
                  borderColor={background.borderColor}
                />
              </View>

              {/* Category Stats */}
              <Text
                style={[
                  styles.statsSectionTitle,
                  { color: background.textColor, marginTop: 24 },
                ]}
              >
                Categories
              </Text>
              <View style={styles.statsGrid}>
                <StatsCard
                  label="Favorite Category"
                  value={getFavoriteCategory(playerStats)}
                  textColor={background. textColor}
                  secondaryText={background.secondaryText}
                  cardColor={background. cardColor}
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
                  textColor={background. textColor}
                  secondaryText={background.secondaryText}
                  cardColor={background. cardColor}
                  borderColor={background.borderColor}
                />
              </View>

              {/* Achievements Section */}
              <Text
                style={[
                  styles. statsSectionTitle,
                  { color: background.textColor, marginTop: 24 },
                ]}
              >
                Achievements ({unlockedAchievements.length}/{getTotalAchievementCount()})
              </Text>

              {/* Unlocked Achievements */}
              {unlockedAchievements.length > 0 && (
                <View style={styles.achievementsGrid}>
                  {unlockedAchievements.map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      isUnlocked={true}
                      textColor={background.textColor}
                      secondaryText={background.secondaryText}
                      cardColor={background.cardColor}
                      borderColor={background. borderColor}
                    />
                  ))}
                </View>
              )}

              {/* Locked Achievements Divider */}
              {lockedAchievements.length > 0 && unlockedAchievements.length > 0 && (
                <View style={styles.lockedDivider}>
                  <View
                    style={[styles.dividerLine, { backgroundColor: background. borderColor }]}
                  />
                  <Text style={[styles.dividerText, { color: background. secondaryText }]}>
                    Locked
                  </Text>
                  <View
                    style={[styles. dividerLine, { backgroundColor: background.borderColor }]}
                  />
                </View>
              )}

              {/* Locked Achievements */}
              {lockedAchievements.length > 0 && (
                <View style={styles. achievementsGrid}>
                  {lockedAchievements. map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      isUnlocked={false}
                      textColor={background.textColor}
                      secondaryText={background.secondaryText}
                      cardColor={background.cardColor}
                      borderColor={background.borderColor}
                    />
                  ))}
                </View>
              )}

              <View style={{ height: 40 }} />
            </>
          ) : (
            <Text style={[styles.loadingText, { color: background. secondaryText }]}>
              Loading stats...
            </Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize:  22,
    fontWeight: 'bold',
  },
  headerPlaceholder: {
    width: 60,
  },

  // Segment Switcher
  segmentSwitcher: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 999,
    padding: 4,
  },
  segmentButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 999,
  },
  segmentButtonText:  {
    fontSize: 14,
    fontWeight: '500',
  },

  // Play Container
  playScrollView: {
    flex: 1,
  },
  playContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  startTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  startDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },

  // Daily Challenge Card (Matching Word Builder)
  dailyChallengeCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    marginBottom: 12,
  },
  dailyChallengeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom:  4,
    textAlign: 'center',
  },
  dailyChallengeSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  dailyChallengeButton: {
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dailyChallengeButtonText: {
    fontSize:  16,
    fontWeight:  '600',
  },

  // Game Mode Cards
  gameModeCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 12,
    alignItems: 'center',
  },
  gameModeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gameModeDescription:  {
    fontSize: 14,
  },

  // Rules Container
  rulesContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
  },
  rulesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ruleNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    width: 28,
  },
  ruleText: {
    fontSize: 14,
    flex: 1,
  },

  // Game Info Bar
  gameInfoBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoDivider: {
    width:  1,
    marginHorizontal: 12,
  },

  // Figure Container
  figureContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },

  // Keyboard Container
  keyboardContainer: {
    marginTop: 'auto',
    paddingBottom: 16,
  },

  // Category Select
  categoryContainer: {
    flex: 1,
  },
  categoryContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  categorySubtitle: {
    fontSize:  14,
    textAlign: 'center',
    marginBottom: 24,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryCard: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCardText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Stats Container
  statsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  statsSectionTitle: {
    fontSize:  20,
    fontWeight:  'bold',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent:  'space-between',
    gap: 10,
  },
  statsCard: {
    width: '48%',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statsCardWide: {
    width: '100%',
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },

  // Achievements
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  achievementCard: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  achievementCardLocked: {
    opacity: 0.5,
  },
  achievementEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  achievementEmojiLocked: {
    opacity: 0.5,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  achievementDesc: {
    fontSize: 11,
    textAlign: 'center',
  },
  achievementTextLocked: {
    opacity:  0.7,
  },

  // Locked Divider
  lockedDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 14,
    fontWeight: '500',
  },
});