import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  PanResponder,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  FlatList,
  Animated,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Flame, Share2, Trophy } from 'lucide-react-native';

// Components
import { GameTile } from '../../src/wordbuilder/components/GameTile';
import { CustomizeScreen } from '../../src/wordbuilder/components/CustomizeScreen';
import { AchievementPopup } from '../../src/wordbuilder/components/AchievementPopup';

// Shared Managers
import { SoundManager } from '../../src/shared/SoundManager';
import { HapticManager } from '../../src/shared/HapticManager';

// Theme
import { useTheme } from '../../src/shared/ThemeContext';
import { COLORS } from '../../src/shared/theme';

// Utils
import { generateLetters } from '../../src/wordbuilder/utils/letterGenerator';
import { generateDailyLetters } from '../../src/wordbuilder/utils/dailyLetters';
import { calculateWordScoreWithBonus } from '../../src/wordbuilder/utils/scoring';
import { findAllPossibleWords, getPossibleWordsStats, PossibleWord } from '../../src/wordbuilder/utils/wordFinder';
import { 
  PlayerStats,
  PlayerTiles,
  DailyChallenge,
  loadStats, 
  loadTiles,
  loadDailyChallenge,
  updateStatsAfterGame,
  saveDailyResult,
  getAverageScore,
  getWordsPerGame,
  getFavoriteMode,
  getFavoriteLetterCount,
  getDailyAverageScore,
  getDailyAverageWords,
  hasPlayedTodayDaily,
  getTodayDailyResult,
  DEBUG_UNLOCK_ALL,
  unlockAllTilesForTesting,
} from '../../src/wordbuilder/utils/storage';
import { TierName } from '../../src/wordbuilder/utils/tiers';
import {
  Achievement,
  ACHIEVEMENTS,
  checkAchievements,
  getUnlockedAchievements,
  GameResult,
  PlayerProgress,
} from '../../src/wordbuilder/utils/achievements';

// Data
import { VALID_WORDS } from '../../src/wordbuilder/data/words';

const { width } = Dimensions.get('window');

type SegmentKey = 'play' | 'customize' | 'stats';
type GameMode = 'menu' | 'daily' | 'blitz' | 'standard';
type GameOverPage = 'results' | 'words';

// Simple stats card component
const StatsCard = ({ 
  label, 
  value, 
  wide = false,
  textColor,
  secondaryText,
  cardColor,
  borderColor,
}: { 
  label: string; 
  value: string; 
  wide?: boolean;
  textColor: string;
  secondaryText: string;
  cardColor: string;
  borderColor: string;
}) => (
  <View style={[
    styles.statsCard, 
    wide && styles.statsCardWide,
    { backgroundColor: cardColor, borderColor }
  ]}>
    <Text style={[styles.statsValue, { color: textColor }]}>{value}</Text>
    <Text style={[styles.statsLabel, { color: secondaryText }]}>{label}</Text>
  </View>
);

// Stat Pill for daily challenge (like Wordle style)
const DailyStatPill = ({ 
  label, 
  value, 
  icon: Icon,
  iconColor,
  highlight = false,
  secondaryText,
}: { 
  label: string; 
  value: number;
  icon: React.ComponentType<{ size: number; color: string }>;
  iconColor: string;
  highlight?: boolean;
  secondaryText: string;
}) => (
  <View style={[
    styles.dailyStatPill,
    highlight && styles.dailyStatPillHighlight,
  ]}>
    <Text style={[styles.dailyStatPillLabel, { color: secondaryText }]}>{label}</Text>
    <View style={styles.dailyStatPillValueRow}>
      <Icon size={18} color={iconColor} />
      <Text style={styles.dailyStatPillValue}>{value}</Text>
    </View>
  </View>
);

// Hook for countdown timer to next daily challenge
const useCountdownToMidnight = () => {
  const [timeLeft, setTimeLeft] = useState('');
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return `${hours}h ${minutes}m ${seconds}s`;
    };
    
    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return timeLeft;
};

export default function WordBuilder() {
  // Theme
  const { background } = useTheme();
  
  // Countdown timer for next daily challenge
  const countdownToNextDaily = useCountdownToMidnight();
  
  // Segment State
  const [segment, setSegment] = useState<SegmentKey>('play');
  const SEGMENT_KEYS: SegmentKey[] = ['play', 'customize', 'stats'];

  // Tab slide animation
  const tabAnim = useRef(new Animated.Value(0)).current;
  const currentTabIdxRef = useRef(0);
  const dragBase = useRef(0);

  // Keep currentTabIdxRef in sync with segment state
  useEffect(() => {
    currentTabIdxRef.current = SEGMENT_KEYS.indexOf(segment);
  }, [segment]);

  const handleSegmentPress = (key: SegmentKey) => {
    const newIdx = SEGMENT_KEYS.indexOf(key);
    setSegment(key);
    Animated.spring(tabAnim, {
      toValue: newIdx,
      useNativeDriver: true,
      tension: 70,
      friction: 12,
    }).start();
  };

  const menuPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 8 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.2,
      onPanResponderGrant: () => {
        tabAnim.stopAnimation();
        dragBase.current = currentTabIdxRef.current;
      },
      onPanResponderMove: (_, gs) => {
        const raw = dragBase.current - gs.dx / width;
        tabAnim.setValue(Math.max(0, Math.min(SEGMENT_KEYS.length - 1, raw)));
      },
      onPanResponderRelease: (_, gs) => {
        const base = dragBase.current;
        let newIdx = Math.round(base);
        if (gs.dx < -25 || gs.vx < -0.3) newIdx = Math.min(Math.floor(base) + 1, SEGMENT_KEYS.length - 1);
        else if (gs.dx > 25 || gs.vx > 0.3) newIdx = Math.max(Math.ceil(base) - 1, 0);
        currentTabIdxRef.current = newIdx;
        setSegment(SEGMENT_KEYS[newIdx]);
        Animated.spring(tabAnim, {
          toValue: newIdx,
          useNativeDriver: true,
          tension: 70,
          friction: 12,
        }).start();
      },
    })
  ).current;

  // Mode Selection State (for two-step selection)
  const [modeSelection, setModeSelection] = useState<'none' | 'blitz' | 'standard'>('none');
  
  // Game State
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [letterCount, setLetterCount] = useState(6);
  const [letters, setLetters] = useState<string[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [score, setScore] = useState(0);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [message, setMessage] = useState('Tap letters to build words!');
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverPage, setGameOverPage] = useState<GameOverPage>('results');
  const [possibleWords, setPossibleWords] = useState<PossibleWord[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameOverScrollRef = useRef<ScrollView>(null);

  // Player Data State
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [playerTiles, setPlayerTiles] = useState<PlayerTiles | null>(null);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [dailyPlayed, setDailyPlayed] = useState(false);
  const [dailyResult, setDailyResult] = useState<{ score: number; words: string[] } | null>(null);
  const [showDailyResultModal, setShowDailyResultModal] = useState(false);
  const [equippedTier, setEquippedTier] = useState<TierName>('default');
  const [equippedVariant, setEquippedVariant] = useState<number>(1);

  // Achievement State
  const [unlockedAchievements, setUnlockedAchievements] = useState<(Achievement & { unlockedAt: string })[]>([]);
  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([]);
  const [currentPopupAchievement, setCurrentPopupAchievement] = useState<Achievement | null>(null);

  // Swipe Tooltip State
  const [showSwipeTooltip, setShowSwipeTooltip] = useState(false);
  const SWIPE_TOOLTIP_KEY = 'wordbuilder_swipe_tooltip_shown';

  // Initialize managers and load all player data on mount
  useEffect(() => {
    const initializeApp = async () => {
      // Initialize sound and haptic managers
      await Promise.all([
        SoundManager.init(),
        HapticManager.init(),
      ]);
      
      if (DEBUG_UNLOCK_ALL) {
        await unlockAllTilesForTesting();
      }
      
      const [stats, tiles, daily, achievements] = await Promise.all([
        loadStats(),
        loadTiles(),
        loadDailyChallenge(),
        getUnlockedAchievements(),
      ]);
      
      setPlayerStats(stats);
      setPlayerTiles(tiles);
      setDailyChallenge(daily);
      setEquippedTier(tiles.equippedTier);
      setEquippedVariant(tiles.equippedVariant);
      setUnlockedAchievements(achievements);
      
      const todayResult = await getTodayDailyResult();
      setDailyPlayed(todayResult.played);
      if (todayResult.played) {
        setDailyResult({ score: todayResult.score, words: todayResult.words });
      }
    };
    initializeApp();
  }, []);

  // Check if we should show swipe tooltip when game ends
  useEffect(() => {
    const checkSwipeTooltip = async () => {
      if (gameOver) {
        const hasSeenTooltip = await AsyncStorage.getItem(SWIPE_TOOLTIP_KEY);
        if (!hasSeenTooltip) {
          setShowSwipeTooltip(true);
        }
      }
    };
    checkSwipeTooltip();
  }, [gameOver]);

  const dismissSwipeTooltip = async () => {
    setShowSwipeTooltip(false);
    await AsyncStorage.setItem(SWIPE_TOOLTIP_KEY, 'true');
  };

  // Show achievement popups one at a time
  useEffect(() => {
    if (pendingAchievements.length > 0 && !currentPopupAchievement) {
      setCurrentPopupAchievement(pendingAchievements[0]);
      setPendingAchievements(prev => prev.slice(1));
    }
  }, [pendingAchievements, currentPopupAchievement]);

  const handleAchievementDismiss = () => {
    setCurrentPopupAchievement(null);
  };

  const refreshPlayerData = async () => {
    const [stats, tiles, daily, achievements] = await Promise.all([
      loadStats(),
      loadTiles(),
      loadDailyChallenge(),
      getUnlockedAchievements(),
    ]);
    setPlayerStats(stats);
    setPlayerTiles(tiles);
    setDailyChallenge(daily);
    setEquippedTier(tiles.equippedTier);
    setEquippedVariant(tiles.equippedVariant);
    setUnlockedAchievements(achievements);
    
    const todayResult = await getTodayDailyResult();
    setDailyPlayed(todayResult.played);
    if (todayResult.played) {
      setDailyResult({ score: todayResult.score, words: todayResult.words });
    }
  };

  const getTileSize = () => {
    if (letterCount <= 6) return Math.floor((width - 90) / 3);  // 3 per row
    return Math.floor((width - 70) / 4);  // 4 per row
  };

  // Returns letter indices split into rows for explicit row layout
  const getLetterRows = (): number[][] => {
    if (letterCount <= 6) {
      // 3 + 3
      return [
        Array.from({ length: 3 }, (_, i) => i),
        Array.from({ length: letters.length - 3 }, (_, i) => i + 3),
      ];
    } else if (letterCount === 7) {
      // 4 + 3
      return [
        Array.from({ length: 4 }, (_, i) => i),
        Array.from({ length: 3 }, (_, i) => i + 4),
      ];
    } else {
      // 4 + 4
      return [
        Array.from({ length: 4 }, (_, i) => i),
        Array.from({ length: 4 }, (_, i) => i + 4),
      ];
    }
  };

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !gameOver) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      
      // Timer warning at 10 seconds
      if (timeLeft === 10) {
        HapticManager.timerWarning();
        SoundManager.countdown();
      }
    } else if (timeLeft === 0 && gameMode !== 'menu' && !gameOver) {
      setGameOver(true);
      setGameOverPage('results');
      setMessage('Time\'s up!');
      
      // Game over feedback
      HapticManager.gameOver();
      SoundManager.gameOver();
      
      // Calculate all possible words
      const allPossible = findAllPossibleWords(letters, foundWords);
      setPossibleWords(allPossible);
      
      const saveGameResults = async () => {
        let updatedStats = playerStats;
        let updatedDaily = dailyChallenge;
        
        if (gameMode === 'daily') {
          // Save daily challenge result
          updatedDaily = await saveDailyResult(score, foundWords);
          setDailyChallenge(updatedDaily);
          setDailyPlayed(true);
          setDailyResult({ score, words: foundWords });
        } else if (foundWords.length > 0 || score > 0) {
          // Save practice game result
          updatedStats = await updateStatsAfterGame(score, foundWords, gameMode, letterCount);
          setPlayerStats(updatedStats);
        }
        
        // Check achievements
        const gameResult: GameResult = {
          score,
          words: foundWords,
          mode: gameMode as 'blitz' | 'standard' | 'daily',
          letterCount,
        };
        
        const progress: PlayerProgress = {
          totalGamesPlayed: (updatedStats?.gamesPlayed || playerStats?.gamesPlayed || 0),
          totalScore: (updatedStats?.totalScore || playerStats?.totalScore || 0),
          totalWordsFound: (updatedStats?.totalWordsFound || playerStats?.totalWordsFound || 0) + (gameMode === 'daily' ? foundWords.length : 0),
          standardGamesPlayed: updatedStats?.standardGamesPlayed || playerStats?.standardGamesPlayed || 0,
          dailyGamesPlayed: updatedDaily?.dailyGamesPlayed || dailyChallenge?.dailyGamesPlayed || 0,
          dailyStreak: updatedDaily?.dailyStreak || dailyChallenge?.dailyStreak || 0,
          bestDailyStreak: updatedDaily?.bestDailyStreak || dailyChallenge?.bestDailyStreak || 0,
          dailyTotalScore: updatedDaily?.dailyTotalScore || dailyChallenge?.dailyTotalScore || 0,
        };
        
        const newAchievements = await checkAchievements(gameResult, progress);
        if (newAchievements.length > 0) {
          setPendingAchievements(prev => [...prev, ...newAchievements]);
          // Achievement feedback
          HapticManager.achievement();
          SoundManager.achievement();
        }
        
        await refreshPlayerData();
      };
      saveGameResults();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, gameMode, gameOver, score, foundWords, letterCount, letters]);

  const startDailyChallenge = async () => {
    const alreadyPlayed = await hasPlayedTodayDaily();
    if (alreadyPlayed) return;
    
    setGameMode('daily');
    setLetterCount(6);
    setLetters(generateDailyLetters());
    setSelectedIndices([]);
    setCurrentWord('');
    setScore(0);
    setFoundWords([]);
    setMessage('Tap letters to build words!');
    setGameOver(false);
    setGameOverPage('results');
    setPossibleWords([]);
    setTimeLeft(60);
  };

  const startPracticeGame = (mode: 'blitz' | 'standard', numLetters: number) => {
    setGameMode(mode);
    setLetterCount(numLetters);
    setLetters(generateLetters(numLetters));
    setSelectedIndices([]);
    setCurrentWord('');
    setScore(0);
    setFoundWords([]);
    setMessage('Tap letters to build words!');
    setGameOver(false);
    setGameOverPage('results');
    setPossibleWords([]);
    setTimeLeft(mode === 'blitz' ? 30 : 60);
  };

  const handleRefresh = useCallback(() => {
    if (gameMode === 'daily') return;
    setLetters(generateLetters(letterCount));
    setSelectedIndices([]);
    setCurrentWord('');
    setScore(0);
    setFoundWords([]);
    setMessage('Tap letters to build words!');
    setGameOver(false);
    setGameOverPage('results');
    setPossibleWords([]);
    setTimeLeft(gameMode === 'blitz' ? 30 : 60);
  }, [letterCount, gameMode]);

  const handleLetterPress = useCallback((index: number) => {
    if (gameOver) return;
    
    // Haptic & sound feedback on tile tap
    HapticManager.tap();
    SoundManager.tap();
    
    if (selectedIndices.includes(index)) {
      const newSelected = selectedIndices.filter((i: number) => i !== index);
      setSelectedIndices(newSelected);
      setCurrentWord(newSelected.map((i: number) => letters[i]).join(''));
    } else {
      const newSelected = [...selectedIndices, index];
      setSelectedIndices(newSelected);
      setCurrentWord(newSelected.map((i: number) => letters[i]).join(''));
    }
  }, [gameOver, selectedIndices, letters]);

  const handleSubmit = useCallback(() => {
    if (gameOver) return;
    const word = currentWord.toLowerCase();
    if (word.length < 3) {
      setMessage('Words must be at least 3 letters!');
      HapticManager.error();
      SoundManager.error();
      return; 
    }
    if (foundWords.includes(word)) { 
      setMessage('Already found that word!'); 
      HapticManager.error();
      SoundManager.error();
      return; 
    }
    if (VALID_WORDS.has(word)) {
      const { score: points, bonusApplied } = calculateWordScoreWithBonus(word, letterCount);
      setScore(score + points);
      setFoundWords([...foundWords, word]);
      
      if (bonusApplied) {
        setMessage(`+${points} points! 🎉 2x ALL LETTERS BONUS!`);
        HapticManager.bonus();
        SoundManager.bonus();
      } else {
        setMessage(`+${points} points!`);
        HapticManager.validWord();
        SoundManager.success();
      }
      setSelectedIndices([]);
      setCurrentWord('');
      // Auto-clear score message after 2 seconds
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
      messageTimerRef.current = setTimeout(() => {
        setMessage('');
      }, 2000);
    } else {
      setMessage('Not a valid word!');
      HapticManager.invalidWord();
      SoundManager.error();
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
      messageTimerRef.current = setTimeout(() => {
        setMessage('');
      }, 2000);
    }
  }, [gameOver, currentWord, foundWords, score, letterCount]);

  const handleClear = useCallback(() => {
    if (gameOver) return;
    setSelectedIndices([]);
    setCurrentWord('');
    setMessage('Tap letters to build words!');
  }, [gameOver]);

  const backToMenu = () => {
    setGameMode('menu');
    setGameOver(false);
    setGameOverPage('results');
    setPossibleWords([]);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const backToAppMenu = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    router.back();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const shareDailyFromMenu = async () => {
    if (!dailyResult) return;
    const streakText = dailyChallenge && dailyChallenge.dailyStreak > 1
      ? `Streak: ${dailyChallenge.dailyStreak} days\n`
      : '';
    const msg = `Word Builder Daily\n${formatDate()}\n\nScore: ${dailyResult.score}\nWords: ${dailyResult.words.length}\n${streakText}\nPlay Word Fury!`;
    try { await Share.share({ message: msg }); } catch (e) {}
  };

  const shareDaily = async (totalFound: number, totalPossible: number, percentFound: number) => {
    const streakText = dailyChallenge && dailyChallenge.dailyStreak > 1 
      ? `Streak: ${dailyChallenge.dailyStreak} days\n` 
      : '';
    
    const message = `Word Builder Daily\n${formatDate()}\n\nScore: ${score}\nWords: ${totalFound}/${totalPossible} (${percentFound}%)\n${streakText}\nCan you beat my score?`;
    
    try {
      await Share.share({
        message,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: { backgroundColor: background.backgroundColor },
    text: { color: background.textColor },
    textSecondary: { color: background.secondaryText },
    card: { backgroundColor: background.cardColor, borderColor: background.borderColor },
    button: { backgroundColor: background.backgroundColor, borderColor: background.borderColor },
  };

  // ==================== GAME OVER SCREEN ====================
  if (gameOver) {
    const isDaily = gameMode === 'daily';
    const stats = getPossibleWordsStats(possibleWords);
    
    const handleScroll = (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const page = Math.round(offsetX / width);
      setGameOverPage(page === 0 ? 'results' : 'words');
    };
    
    return (
      <SafeAreaView style={[styles.gameOverContainer, dynamicStyles.container]}>
        <StatusBar barStyle={background.statusBar === 'light' ? 'light-content' : 'dark-content'} />
        
        {/* Achievement Popup */}
        <AchievementPopup
          achievement={currentPopupAchievement}
          onDismiss={handleAchievementDismiss}
          backgroundColor={background.cardColor}
          textColor={background.textColor}
        />
        
        {/* Horizontal Swipe Carousel */}
        <ScrollView
          ref={gameOverScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          style={styles.carousel}
        >
          {/* ===== PAGE 1: RESULTS ===== */}
          <View style={[styles.carouselPage, { width }]}>
            <ScrollView 
              contentContainerStyle={styles.resultsPageContent}
              showsVerticalScrollIndicator={false}
            >
              {isDaily ? (
                <>
                  <Text style={[styles.gameOverTitle, dynamicStyles.text]}>Daily Complete!</Text>
                  <Text style={[styles.dateText, dynamicStyles.textSecondary]}>{formatDate()}</Text>
                  {dailyChallenge && dailyChallenge.dailyStreak > 1 && (
                    <View style={styles.streakBadge}>
                      <Text style={styles.streakText}>{dailyChallenge.dailyStreak} Day Streak!</Text>
                    </View>
                  )}
                </>
              ) : (
                <Text style={[styles.gameOverTitle, dynamicStyles.text]}>Time's Up!</Text>
              )}
              
              <Text style={styles.finalScore}>{score}</Text>
              <Text style={[styles.finalScoreLabel, dynamicStyles.textSecondary]}>points</Text>
              
              {/* Share Button - Daily Only */}
              {isDaily && (
                <TouchableOpacity 
                  style={styles.shareButton} 
                  onPress={() => shareDaily(stats.totalFound, stats.totalPossible, stats.percentFound)}
                >
                  <Text style={styles.shareButtonText}>Share Result</Text>
                </TouchableOpacity>
              )}
              
              {/* Stats Summary */}
              <View style={[styles.statsSummary, { backgroundColor: background.cardColor, borderColor: background.borderColor }]}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, dynamicStyles.text]}>{stats.totalFound}</Text>
                  <Text style={[styles.statLabel, dynamicStyles.textSecondary]}>Found</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: background.borderColor }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, dynamicStyles.text]}>{stats.totalPossible}</Text>
                  <Text style={[styles.statLabel, dynamicStyles.textSecondary]}>Possible</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: background.borderColor }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, dynamicStyles.text]}>{stats.percentFound}%</Text>
                  <Text style={[styles.statLabel, dynamicStyles.textSecondary]}>Completion</Text>
                </View>
              </View>
              
              <View style={styles.buttonContainer}>
                {!isDaily && (
                  <TouchableOpacity 
                    style={styles.playAgainButton} 
                    onPress={() => startPracticeGame(gameMode as 'blitz' | 'standard', letterCount)}
                  >
                    <Text style={styles.playAgainText}>Play Again</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={[styles.menuButton, dynamicStyles.button]} 
                  onPress={backToMenu}
                >
                  <Text style={[styles.menuButtonText, dynamicStyles.text]}>Back to Menu</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
          
          {/* ===== PAGE 2: ALL WORDS ===== */}
          <View style={[styles.carouselPage, { width }]}>
            <Text style={[styles.wordsPageTitle, dynamicStyles.text]}>
              All Possible Words
            </Text>
            <Text style={[styles.wordsPageSubtitle, dynamicStyles.textSecondary]}>
              You found {stats.totalFound} of {stats.totalPossible} words
            </Text>
            
            <FlatList
              data={possibleWords}
              keyExtractor={(item) => item.word}
              style={styles.wordsList}
              contentContainerStyle={styles.wordsListContent}
              numColumns={2}
              renderItem={({ item }) => (
                <View style={[
                  styles.wordItem, 
                  { backgroundColor: background.cardColor, borderColor: background.borderColor }
                ]}>
                  <Text style={[
                    styles.wordText,
                    { color: background.textColor },
                    item.found && styles.wordTextFound
                  ]}>
                    {item.word}
                  </Text>
                  <Text style={[styles.wordScore, { color: background.secondaryText }]}>
                    {item.score} pts
                  </Text>
                </View>
              )}
            />
            
            <TouchableOpacity 
              style={[styles.menuButton, dynamicStyles.button, styles.wordsPageButton]} 
              onPress={backToMenu}
            >
              <Text style={[styles.menuButtonText, dynamicStyles.text]}>Back to Menu</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        {/* Page Indicator Dots + Swipe Hint */}
        <View style={styles.pageIndicatorContainer}>
          <View style={styles.pageIndicatorLabels}>
            <Text style={[
              styles.pageIndicatorLabel, 
              { color: gameOverPage === 'results' ? background.textColor : background.secondaryText }
            ]}>
              Results
            </Text>
            <Text style={[
              styles.pageIndicatorLabel,
              { color: gameOverPage === 'words' ? background.textColor : background.secondaryText }
            ]}>
              All Words
            </Text>
          </View>
          <View style={styles.pageIndicator}>
            <View style={[styles.pageDot, gameOverPage === 'results' && styles.pageDotActive]} />
            <View style={[styles.pageDot, gameOverPage === 'words' && styles.pageDotActive]} />
          </View>
          {gameOverPage === 'results' && (
            <Text style={[styles.swipeHintText, { color: background.secondaryText }]}>
              Swipe for all words →
            </Text>
          )}
        </View>
        
        {/* First-Time Swipe Tooltip */}
        {showSwipeTooltip && (
          <TouchableOpacity 
            style={styles.tooltipOverlay} 
            activeOpacity={1} 
            onPress={dismissSwipeTooltip}
          >
            <View style={[styles.tooltip, { backgroundColor: background.cardColor }]}>
              <Text style={[styles.tooltipText, { color: background.textColor }]}>
                Swipe left to see all possible words!
              </Text>
              <Text style={[styles.tooltipDismiss, { color: background.secondaryText }]}>
                Tap anywhere to dismiss
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  // ==================== GAMEPLAY SCREEN ====================
  if (gameMode !== 'menu') {
    const tileSize = getTileSize();
    const isDaily = gameMode === 'daily';

    const letterRows = getLetterRows();

    return (
      <SafeAreaView style={[styles.gameplayContainer, dynamicStyles.container]}>
        <StatusBar barStyle={background.statusBar === 'light' ? 'light-content' : 'dark-content'} />

        <View style={styles.header}>
          <TouchableOpacity onPress={backToMenu}>
            <Text style={[styles.backButton, dynamicStyles.textSecondary]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.timer, dynamicStyles.text, timeLeft <= 10 && styles.timerWarning]}>
            {formatTime(timeLeft)}
          </Text>
          <Text style={styles.scoreText}>{score} pts</Text>
        </View>

        {/* Top spacer pushes interactive content toward bottom for thumb reach */}
        <View style={{ flex: 1 }} />

        <Text style={[styles.message, dynamicStyles.textSecondary]}>{message}</Text>

        <View style={styles.wordDisplay}>
          <Text style={currentWord ? [styles.currentWord, dynamicStyles.text] : [styles.currentWordPlaceholder, dynamicStyles.textSecondary]}>
            {currentWord || '_ _ _'}
          </Text>
        </View>

        {/* Letter grid rendered as explicit rows */}
        <View style={styles.letterGrid}>
          {letterRows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.letterRow}>
              {row.map((index) => (
                <GameTile
                  key={index}
                  letter={letters[index]}
                  index={index}
                  isSelected={selectedIndices.includes(index)}
                  selectionOrder={selectedIndices.includes(index) ? selectedIndices.indexOf(index) + 1 : null}
                  onPress={handleLetterPress}
                  tileSize={tileSize}
                  tierName={equippedTier}
                  variant={equippedVariant}
                />
              ))}
            </View>
          ))}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.buttonText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
        </View>

        {!isDaily && (
          <TouchableOpacity
            style={[styles.refreshButton, dynamicStyles.button]}
            onPress={handleRefresh}
          >
            <Text style={[styles.refreshButtonText, dynamicStyles.textSecondary]}>↺ Refresh Letters</Text>
          </TouchableOpacity>
        )}

        <View style={styles.foundWordsSection}>
          <Text style={[styles.foundWordsTitle, dynamicStyles.textSecondary]}>Found: {foundWords.length}</Text>
          <View style={styles.foundWordsWrap}>
            {foundWords.map((word: string, index: number) => (
              <View key={index} style={styles.foundWordBadgeSmall}>
                <Text style={styles.foundWordTextSmall}>{word.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ==================== MAIN MENU WITH SEGMENTS ====================
  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <StatusBar barStyle={background.statusBar === 'light' ? 'light-content' : 'dark-content'} />
      
      {/* Achievement Popup */}
      <AchievementPopup
        achievement={currentPopupAchievement}
        onDismiss={handleAchievementDismiss}
        backgroundColor={background.cardColor}
        textColor={background.textColor}
      />
      
      {/* Header */}
      <View style={styles.appHeader}>
        <TouchableOpacity style={styles.backToGamesButton} onPress={backToAppMenu}>
          <Text style={[styles.backToGamesText, dynamicStyles.textSecondary]}>← Games</Text>
        </TouchableOpacity>
        <Text style={[styles.appTitle, dynamicStyles.text]}>Word Builder</Text>
        <View style={{ width: 60 }} />
      </View>
      
      {/* Segment Switcher */}
      <View style={[styles.segmentSwitcher, { backgroundColor: background.cardColor }]}>
        {(['play', 'customize', 'stats'] as SegmentKey[]).map((key) => {
          const isActive = key === segment;
          const label = key === 'play' ? 'Play' : key === 'customize' ? 'Customize' : 'Stats';

          return (
            <Pressable
              key={key}
              style={[
                styles.segmentButton,
                isActive && { backgroundColor: background.backgroundColor },
              ]}
              onPress={() => handleSegmentPress(key)}
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

      {/* ===== TAB STRIP (horizontal swipe pager) ===== */}
      <View style={styles.tabStripWrapper} {...menuPanResponder.panHandlers}>
      <Animated.View
        style={[
          styles.tabStrip,
          { transform: [{ translateX: tabAnim.interpolate({
            inputRange: [0, 1, 2],
            outputRange: [0, -width, -width * 2],
          }) }] }
        ]}
      >

      {/* ===== PLAY TAB ===== */}
      <ScrollView style={[styles.playContainer, { width }]} showsVerticalScrollIndicator={false}>
          {/* Daily Challenge Card */}
          <View style={[
            styles.dailyCard,
            dynamicStyles.card,
            { borderWidth: 2 },
            dailyPlayed && { borderColor: COLORS.accent }
          ]}>
            <Text style={[styles.dailyTitle, dynamicStyles.text]}>Daily Challenge</Text>
            <Text style={[styles.dailySubtitle, dynamicStyles.textSecondary]}>
              {formatDate()}
            </Text>
            
            {/* Score display (only when completed) */}
            {dailyPlayed && dailyResult && (
              <View style={styles.dailyCompletedInfo}>
                <Text style={styles.dailyCompletedScore}>{dailyResult.score}</Text>
                <Text style={[styles.dailyCompletedLabel, dynamicStyles.textSecondary]}>
                  Today's Score • {dailyResult.words.length} words
                </Text>
              </View>
            )}

            {/* Streak Stats */}
            <View style={styles.dailyStatPillRow}>
              <DailyStatPill
                label="Current streak"
                value={dailyChallenge?.dailyStreak || 0}
                icon={Flame}
                iconColor="#e85d04"
                highlight={true}
                secondaryText={background.secondaryText}
              />
              <DailyStatPill
                label="Best streak"
                value={dailyChallenge?.bestDailyStreak || 0}
                icon={Trophy}
                iconColor="#d4a017"
                secondaryText={background.secondaryText}
              />
            </View>

            {/* Play Button (only when not completed) */}
            {!dailyPlayed && (
              <TouchableOpacity 
                style={[styles.dailyButton, dynamicStyles.button, { borderWidth: 2 }]}
                onPress={startDailyChallenge}
              >
                <Text style={[styles.dailyButtonText, dynamicStyles.text]}>Play Today's Challenge</Text>
              </TouchableOpacity>
            )}

            {/* View Results + Share (when completed) */}
            {dailyPlayed && (
              <View style={styles.dailyActionRow}>
                <TouchableOpacity
                  style={[styles.dailyActionButton, dynamicStyles.button, { borderWidth: 1.5 }]}
                  onPress={() => setShowDailyResultModal(true)}
                >
                  <Text style={[styles.dailyActionText, dynamicStyles.text]}>View Results</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dailyShareIconButton, { borderColor: background.borderColor, backgroundColor: background.backgroundColor, borderWidth: 1.5 }]}
                  onPress={shareDailyFromMenu}
                >
                  <Share2 size={18} color={background.textColor} />
                </TouchableOpacity>
              </View>
            )}

            {/* Countdown Timer (only when completed) */}
            {dailyPlayed && (
              <View style={styles.dailyCountdownContainer}>
                <Text style={[styles.dailyCountdownLabel, dynamicStyles.textSecondary]}>
                  Next challenge in
                </Text>
                <Text style={[styles.dailyCountdownTime, dynamicStyles.text]}>
                  {countdownToNextDaily}
                </Text>
              </View>
            )}
          </View>

          {/* Mode Selection */}
          {modeSelection === 'none' ? (
            // Step 1: Choose Mode
            <>
              <TouchableOpacity
                style={[styles.modeCard, dynamicStyles.card, { borderWidth: 2 }]}
                onPress={() => setModeSelection('blitz')}
                activeOpacity={0.7}
              >
                <Text style={[styles.modeCardTitle, dynamicStyles.text]}>Blitz Mode</Text>
                <Text style={[styles.modeCardSubtitle, dynamicStyles.textSecondary]}>30 seconds</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeCard, dynamicStyles.card, { borderWidth: 2 }]}
                onPress={() => setModeSelection('standard')}
                activeOpacity={0.7}
              >
                <Text style={[styles.modeCardTitle, dynamicStyles.text]}>Standard Mode</Text>
                <Text style={[styles.modeCardSubtitle, dynamicStyles.textSecondary]}>60 seconds</Text>
              </TouchableOpacity>
            </>
          ) : (
            // Step 2: Choose Letter Count
            <View style={[styles.letterSelectCard, dynamicStyles.card, { borderWidth: 2 }]}>
              <Text style={[styles.letterSelectTitle, dynamicStyles.text]}>
                {modeSelection === 'blitz' ? 'Blitz Mode' : 'Standard Mode'}
              </Text>
              <Text style={[styles.letterSelectSubtitle, dynamicStyles.textSecondary]}>
                How many letters?
              </Text>
              
              <View style={styles.letterCountRow}>
                {[6, 7, 8].map((count) => (
                  <TouchableOpacity
                    key={count}
                    style={[styles.letterCountButton, dynamicStyles.button, { borderWidth: 2 }]}
                    onPress={() => {
                      startPracticeGame(modeSelection, count);
                      setModeSelection('none');
                    }}
                  >
                    <Text style={[styles.letterCountText, dynamicStyles.text]}>{count}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity
                style={styles.backToModesButton}
                onPress={() => setModeSelection('none')}
              >
                <Text style={[styles.backToModesText, dynamicStyles.textSecondary]}>← Back</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={{ height: 40 }} />
        </ScrollView>

      {/* ===== CUSTOMIZE TAB ===== */}
      <View style={[styles.customizeContainer, { width }]}>
        <CustomizeScreen
          onBack={() => handleSegmentPress('play')}
          embedded
          onTileChange={refreshPlayerData}
        />
      </View>

      {/* ===== STATS TAB ===== */}
      <ScrollView style={[styles.statsContainer, { width }]} showsVerticalScrollIndicator={false}>
          
          {/* Daily Challenge Stats Section */}
          {dailyChallenge && dailyChallenge.dailyGamesPlayed > 0 && (
            <>
              <Text style={[styles.statsTitle, dynamicStyles.text]}>Daily Challenge Stats</Text>
              <View style={styles.statsGrid}>
                <StatsCard 
                  label="Dailies Played" 
                  value={dailyChallenge.dailyGamesPlayed.toString()} 
                  textColor={background.textColor}
                  secondaryText={background.secondaryText}
                  cardColor={background.cardColor}
                  borderColor={background.borderColor}
                />
                <StatsCard 
                  label="Current Streak" 
                  value={`${dailyChallenge.dailyStreak} ${dailyChallenge.dailyStreak === 1 ? 'day' : 'days'}`}
                  textColor={background.textColor}
                  secondaryText={background.secondaryText}
                  cardColor={background.cardColor}
                  borderColor={background.borderColor}
                />
                <StatsCard 
                  label="Best Streak" 
                  value={`${dailyChallenge.bestDailyStreak} ${dailyChallenge.bestDailyStreak === 1 ? 'day' : 'days'}`}
                  textColor={background.textColor}
                  secondaryText={background.secondaryText}
                  cardColor={background.cardColor}
                  borderColor={background.borderColor}
                />
                <StatsCard 
                  label="Best Score" 
                  value={dailyChallenge.bestDailyScore.toString()} 
                  textColor={background.textColor}
                  secondaryText={background.secondaryText}
                  cardColor={background.cardColor}
                  borderColor={background.borderColor}
                />
                <StatsCard 
                  label="Avg Score" 
                  value={getDailyAverageScore(dailyChallenge).toString()} 
                  textColor={background.textColor}
                  secondaryText={background.secondaryText}
                  cardColor={background.cardColor}
                  borderColor={background.borderColor}
                />
                <StatsCard 
                  label="Best Words" 
                  value={dailyChallenge.bestDailyWords.toString()} 
                  textColor={background.textColor}
                  secondaryText={background.secondaryText}
                  cardColor={background.cardColor}
                  borderColor={background.borderColor}
                />
                <StatsCard 
                  label="Avg Words" 
                  value={getDailyAverageWords(dailyChallenge).toString()} 
                  textColor={background.textColor}
                  secondaryText={background.secondaryText}
                  cardColor={background.cardColor}
                  borderColor={background.borderColor}
                />
                <StatsCard 
                  label="Total Score" 
                  value={dailyChallenge.dailyTotalScore.toLocaleString()} 
                  textColor={background.textColor}
                  secondaryText={background.secondaryText}
                  cardColor={background.cardColor}
                  borderColor={background.borderColor}
                />
              </View>
            </>
          )}
          
          {/* Practice Stats Section */}
          <Text style={[styles.statsTitle, dynamicStyles.text, dailyChallenge && dailyChallenge.dailyGamesPlayed > 0 && { marginTop: 25 }]}>
            Practice Stats
          </Text>
          
          {playerStats ? (
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
                label="Total Score" 
                value={playerStats.totalScore.toLocaleString()} 
                textColor={background.textColor}
                secondaryText={background.secondaryText}
                cardColor={background.cardColor}
                borderColor={background.borderColor}
              />
              <StatsCard 
                label="High Score" 
                value={playerStats.highScore.toString()} 
                textColor={background.textColor}
                secondaryText={background.secondaryText}
                cardColor={background.cardColor}
                borderColor={background.borderColor}
              />
              <StatsCard 
                label="Avg Score" 
                value={getAverageScore(playerStats).toString()} 
                textColor={background.textColor}
                secondaryText={background.secondaryText}
                cardColor={background.cardColor}
                borderColor={background.borderColor}
              />
              <StatsCard 
                label="Words Found" 
                value={playerStats.totalWordsFound.toString()} 
                textColor={background.textColor}
                secondaryText={background.secondaryText}
                cardColor={background.cardColor}
                borderColor={background.borderColor}
              />
              <StatsCard 
                label="Words/Game" 
                value={getWordsPerGame(playerStats).toString()} 
                textColor={background.textColor}
                secondaryText={background.secondaryText}
                cardColor={background.cardColor}
                borderColor={background.borderColor}
              />
              <StatsCard 
                label="Longest Word" 
                value={playerStats.longestWord.toUpperCase() || '-'} 
                wide
                textColor={background.textColor}
                secondaryText={background.secondaryText}
                cardColor={background.cardColor}
                borderColor={background.borderColor}
              />
              <StatsCard 
                label="Favorite Mode" 
                value={getFavoriteMode(playerStats)} 
                textColor={background.textColor}
                secondaryText={background.secondaryText}
                cardColor={background.cardColor}
                borderColor={background.borderColor}
              />
              <StatsCard 
                label="Favorite Letters" 
                value={getFavoriteLetterCount(playerStats)} 
                textColor={background.textColor}
                secondaryText={background.secondaryText}
                cardColor={background.cardColor}
                borderColor={background.borderColor}
              />
            </View>
          ) : (
            <Text style={[styles.loadingText, dynamicStyles.textSecondary]}>Loading stats...</Text>
          )}
          
          {/* Achievements Section — unlocked first, then locked */}
          <Text style={[styles.statsTitle, dynamicStyles.text, { marginTop: 25 }]}>
            Achievements ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
          </Text>

          {/* Unlocked */}
          {unlockedAchievements.length > 0 && (
            <View style={styles.achievementsGrid}>
              {ACHIEVEMENTS.filter(a => unlockedAchievements.some(u => u.id === a.id)).map((achievement) => (
                <View
                  key={achievement.id}
                  style={[styles.achievementCard, { backgroundColor: background.cardColor, borderColor: background.borderColor }]}
                >
                  <Text style={styles.achievementEmoji}>{achievement.emoji}</Text>
                  <Text style={[styles.achievementName, { color: background.textColor }]}>{achievement.name}</Text>
                  <Text style={[styles.achievementDesc, { color: background.secondaryText }]}>{achievement.description}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Divider */}
          {unlockedAchievements.length > 0 && unlockedAchievements.length < ACHIEVEMENTS.length && (
            <View style={styles.lockedDivider}>
              <View style={[styles.dividerLine, { backgroundColor: background.borderColor }]} />
              <Text style={[styles.dividerText, { color: background.secondaryText }]}>Locked</Text>
              <View style={[styles.dividerLine, { backgroundColor: background.borderColor }]} />
            </View>
          )}

          {/* Locked */}
          {ACHIEVEMENTS.filter(a => !unlockedAchievements.some(u => u.id === a.id)).length > 0 && (
            <View style={styles.achievementsGrid}>
              {ACHIEVEMENTS.filter(a => !unlockedAchievements.some(u => u.id === a.id)).map((achievement) => (
                <View
                  key={achievement.id}
                  style={[styles.achievementCard, styles.achievementCardLocked, { backgroundColor: background.cardColor, borderColor: background.borderColor }]}
                >
                  <Text style={[styles.achievementEmoji, styles.achievementEmojiLocked]}>{achievement.emoji}</Text>
                  <Text style={[styles.achievementName, styles.achievementTextLocked, { color: background.textColor }]}>{achievement.name}</Text>
                  <Text style={[styles.achievementDesc, styles.achievementTextLocked, { color: background.secondaryText }]}>{achievement.description}</Text>
                </View>
              ))}
            </View>
          )}
          
          <View style={{ height: 40 }} />
        </ScrollView>

      </Animated.View>
      </View>

      {/* Daily Result Modal */}
      {showDailyResultModal && dailyResult && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: background.cardColor, borderColor: background.borderColor }]}>
            <Text style={[styles.modalTitle, { color: background.textColor }]}>Daily Results</Text>
            <Text style={[styles.modalDate, { color: background.secondaryText }]}>{formatDate()}</Text>
            <Text style={[styles.modalScore, { color: COLORS.accent }]}>{dailyResult.score}</Text>
            <Text style={[styles.modalScoreLabel, { color: background.secondaryText }]}>points</Text>
            <Text style={[styles.modalWords, { color: background.textColor }]}>{dailyResult.words.length} words found</Text>
            {dailyChallenge && dailyChallenge.dailyStreak > 1 && (
              <Text style={[styles.modalStreak, { color: background.secondaryText }]}>
                🔥 {dailyChallenge.dailyStreak} day streak
              </Text>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalShareBtn, { backgroundColor: COLORS.accent }]}
                onPress={shareDailyFromMenu}
              >
                <Share2 size={16} color="#fff" />
                <Text style={styles.modalShareText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { borderColor: background.borderColor, backgroundColor: background.backgroundColor }]}
                onPress={() => setShowDailyResultModal(false)}
              >
                <Text style={[styles.modalCloseBtnText, { color: background.textColor }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },
  backToGamesButton: {
    padding: 8,
  },
  backToGamesText: {
    fontSize: 14,
    fontWeight: '500',
  },
  appTitle: {
    fontSize: 22,
    fontWeight: 'bold',
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
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  segmentButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Tab Strip
  tabStripWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  tabStrip: {
    flex: 1,
    width: width * 3,
    flexDirection: 'row',
  },

  // Play Segment
  playContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  dailyCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  dailyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  dailySubtitle: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  dailyButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dailyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dailyCompletedInfo: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dailyCompletedScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  dailyCompletedLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  // Daily Stat Pills (streak display)
  dailyStatPillRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  dailyStatPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f3e7d7',
    minWidth: 100,
    alignItems: 'center',
  },
  dailyStatPillHighlight: {
    backgroundColor: 'rgba(78, 204, 163, 0.15)',
  },
  dailyStatPillLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  dailyStatPillValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dailyStatPillValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c2416',
  },
  // Daily action row (View Results + Share)
  dailyActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  dailyActionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dailyActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dailyShareIconButton: {
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Daily result modal
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 100,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 28,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalDate: {
    fontSize: 13,
    marginBottom: 16,
  },
  modalScore: {
    fontSize: 56,
    fontWeight: 'bold',
  },
  modalScoreLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  modalWords: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalStreak: {
    fontSize: 14,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalShareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 13,
  },
  modalShareText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalCloseBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Countdown Timer
  dailyCountdownContainer: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  dailyCountdownLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  dailyCountdownTime: {
    fontSize: 20,
    fontWeight: '600',
  },
  // Mode Selection Cards
  modeCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  modeCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modeCardSubtitle: {
    fontSize: 14,
  },
  
  // Letter Count Selection
  letterSelectCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  letterSelectTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  letterSelectSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  letterCountRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  letterCountButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    minWidth: 80,
    alignItems: 'center',
  },
  letterCountText: {
    fontSize: 18,
    fontWeight: '600',
  },
  backToModesButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backToModesText: {
    fontSize: 14,
  },
  
  // Customize Segment
  customizeContainer: {
    flex: 1,
  },
  
  // Stats Segment
  statsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
  
  // Gameplay
  gameplayContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  backButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  timer: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  timerWarning: {
    color: COLORS.danger,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.accent,
  },
  message: {
    fontSize: 16,
    marginBottom: 15,
    height: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  wordDisplay: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 12,
    minWidth: 240,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentWord: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 6,
  },
  currentWordPlaceholder: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 6,
    opacity: 0.3,
  },
  letterGrid: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    marginTop: 6,
  },
  letterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  clearButton: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 44,
    paddingVertical: 16,
    borderRadius: 30,
    minWidth: 120,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 44,
    paddingVertical: 16,
    borderRadius: 30,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  refreshButton: {
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 30,
    marginBottom: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    minWidth: 180,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Found words — fixed height so nothing shifts when words are added
  foundWordsSection: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 8,
    height: 180,
    overflow: 'hidden',
  },
  foundWordsTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  foundWordsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  foundWordBadgeSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(78,204,163,0.15)',
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  foundWordTextSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent,
  },

  // Game Over Screen
  gameOverContainer: {
    flex: 1,
  },
  carousel: {
    flex: 1,
  },
  carouselPage: {
    flex: 1,
    paddingTop: 20,
  },
  resultsPageContent: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  pageIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: 20,
  },
  pageIndicatorLabels: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginBottom: 8,
  },
  pageIndicatorLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  pageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  pageDotActive: {
    backgroundColor: COLORS.accent,
  },
  swipeHintText: {
    fontSize: 13,
    marginTop: 10,
    fontStyle: 'italic',
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    marginBottom: 16,
  },
  streakBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  finalScore: {
    fontSize: 72,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  finalScoreLabel: {
    fontSize: 24,
    marginBottom: 15,
  },
  shareButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 20,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  statsSummary: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 25,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    marginHorizontal: 15,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  playAgainButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
  },
  playAgainText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  menuButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
  },
  menuButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  wordsPageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  wordsPageSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
  },
  wordsList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  wordsListContent: {
    paddingBottom: 20,
  },
  wordItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 4,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  wordText: {
    fontSize: 16,
    fontWeight: '600',
  },
  wordTextFound: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  wordScore: {
    fontSize: 12,
  },
  wordsPageButton: {
    alignSelf: 'center',
    marginVertical: 15,
  },
  tooltipOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltip: {
    marginHorizontal: 40,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  tooltipText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  tooltipDismiss: {
    fontSize: 14,
  },

  achievementCardLocked: { opacity: 0.5 },
  achievementEmojiLocked: { opacity: 0.5 },
  achievementTextLocked: { opacity: 0.7 },
  lockedDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 15, fontSize: 14, fontWeight: '500' },
});
