import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

// Components
import { AnimatedBackground } from '../../src/wordbuilder/components/AnimatedBackground';
import { LiquidGlassButton } from '../../src/wordbuilder/components/LiquidGlassButton';
import { StatsCard } from '../../src/wordbuilder/components/StatsCard';
import { GameTile } from '../../src/wordbuilder/components/GameTile';
import { CustomizeScreen } from '../../src/wordbuilder/components/CustomizeScreen';

// Styles
import { styles } from '../../src/wordbuilder/styles/gameStyles';

// Utils
import { generateLetters } from '../../src/wordbuilder/utils/letterGenerator';
import { calculateWordScore } from '../../src/wordbuilder/utils/scoring';
import { 
  PlayerStats,
  PlayerTiles,
  loadStats, 
  loadTiles,
  updateStatsAfterGame,
  getAverageScore,
  getWordsPerGame,
  getFavoriteMode,
  getFavoriteLetterCount,
  DEBUG_UNLOCK_ALL,
  unlockAllTilesForTesting,
} from '../../src/wordbuilder/utils/storage';
import { TierName } from '../../src/wordbuilder/utils/tiers';

// Data
import { VALID_WORDS } from '../../src/wordbuilder/data/words';

const { width } = Dimensions.get('window');

// Default cream background for gameplay
const DEFAULT_GAMEPLAY_BACKGROUND = '#f5f0e6';

type GameMode = 'mainMenu' | 'modeSelect' | 'stats' | 'customize' | 'blitz' | 'standard';

export default function WordBuilder() {
  // Game State
  const [gameMode, setGameMode] = useState<GameMode>('mainMenu');
  const [letterCount, setLetterCount] = useState(6);
  const [letters, setLetters] = useState<string[]>(generateLetters(6));
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [score, setScore] = useState(0);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [message, setMessage] = useState('Tap letters to build words!');
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [lastGameMode, setLastGameMode] = useState<'blitz' | 'standard'>('blitz');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Player Data State
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [playerTiles, setPlayerTiles] = useState<PlayerTiles | null>(null);
  const [equippedTier, setEquippedTier] = useState<TierName>('default');
  const [equippedVariant, setEquippedVariant] = useState<number>(1);

  // Load all player data on mount
  useEffect(() => {
    const loadAllPlayerData = async () => {
      // DEBUG: Unlock all tiles for testing
      if (DEBUG_UNLOCK_ALL) {
        await unlockAllTilesForTesting();
      }
      
      const [stats, tiles] = await Promise.all([
        loadStats(),
        loadTiles(),
      ]);
      
      setPlayerStats(stats);
      setPlayerTiles(tiles);
      setEquippedTier(tiles.equippedTier);
      setEquippedVariant(tiles.equippedVariant);
    };
    loadAllPlayerData();
  }, []);

  // Refresh player data helper
  const refreshPlayerData = async () => {
    const [stats, tiles] = await Promise.all([
      loadStats(),
      loadTiles(),
    ]);
    setPlayerStats(stats);
    setPlayerTiles(tiles);
    setEquippedTier(tiles.equippedTier);
    setEquippedVariant(tiles.equippedVariant);
  };

  const getTileSize = () => {
    const baseSize = (width - 80) / 3;
    if (letterCount <= 6) return baseSize;
    return (width - 90) / 4;
  };

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !gameOver) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && (gameMode === 'blitz' || gameMode === 'standard') && !gameOver) {
      // Game ended - save stats
      setGameOver(true);
      setMessage('Time\'s up!');
      
      const saveGameResults = async () => {
        if (foundWords.length > 0 || score > 0) {
          await updateStatsAfterGame(score, foundWords, lastGameMode, letterCount);
          // Refresh all player data after game
          await refreshPlayerData();
        }
      };
      saveGameResults();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, gameMode, gameOver, score, foundWords, lastGameMode, letterCount]);

  const startGame = (mode: GameMode, numLetters: number) => {
    if (mode === 'blitz' || mode === 'standard') {
      setLastGameMode(mode);
    }
    setGameMode(mode);
    setLetterCount(numLetters);
    setLetters(generateLetters(numLetters));
    setSelectedIndices([]);
    setCurrentWord('');
    setScore(0);
    setFoundWords([]);
    setMessage('Tap letters to build words!');
    setGameOver(false);
    setTimeLeft(mode === 'blitz' ? 30 : 60);
  };
  
  // Load stats when opening stats screen
  const openStats = async () => {
    await refreshPlayerData();
    setGameMode('stats');
  };

  // Handle coming back from customize screen
  const handleCustomizeBack = async () => {
    await refreshPlayerData();
    setGameMode('modeSelect');
  };

  const handleRefresh = useCallback(() => {
    setLetters(generateLetters(letterCount));
    setSelectedIndices([]);
    setCurrentWord('');
    setScore(0);
    setFoundWords([]);
    setMessage('Tap letters to build words!');
    setGameOver(false);
    setTimeLeft(gameMode === 'blitz' ? 30 : 60);
  }, [letterCount, gameMode]);

  const handleLetterPress = useCallback((index: number) => {
    if (gameOver) return;
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
    if (word.length < 2) { setMessage('Words must be at least 2 letters!'); return; }
    if (foundWords.includes(word)) { setMessage('Already found that word!'); return; }
    if (VALID_WORDS.has(word)) {
      const points = calculateWordScore(word);
      setScore(score + points);
      setFoundWords([...foundWords, word]);
      setMessage(`+${points} points!`);
      setSelectedIndices([]);
      setCurrentWord('');
    } else {
      setMessage('Not a valid word!');
    }
  }, [gameOver, currentWord, foundWords, score]);

  const handleClear = useCallback(() => {
    if (gameOver) return;
    setSelectedIndices([]);
    setCurrentWord('');
    setMessage('Tap letters to build words!');
  }, [gameOver]);

  const backToMenu = () => {
    setGameMode('modeSelect');
    setGameOver(false);
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

  const levels = [6, 7, 8];

  // ==================== SCREENS ====================

  // Main Menu - Single Player / Online
  if (gameMode === 'mainMenu') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <AnimatedBackground />
        
        <View style={styles.mainMenuContainer}>
          <Text style={styles.menuTitle}>Word Builder</Text>
          <Text style={styles.menuSubtitle}>Select Game Type</Text>
          
          <LiquidGlassButton 
            onPress={() => setGameMode('modeSelect')}
            size="large"
            style={{ marginBottom: 20 }}
          >
            <Text style={styles.glassButtonText}>Single Player</Text>
          </LiquidGlassButton>
          
          <LiquidGlassButton 
            disabled={true}
            size="large"
            style={{ marginBottom: 20 }}
          >
            <Text style={styles.glassButtonTextDisabled}>Online</Text>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </LiquidGlassButton>
          
          <LiquidGlassButton 
            onPress={backToAppMenu}
            size="large"
          >
            <Text style={styles.glassButtonText}>← Back to Games</Text>
          </LiquidGlassButton>
        </View>
      </SafeAreaView>
    );
  }

  // Mode Select - Blitz / Standard
  if (gameMode === 'modeSelect') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <AnimatedBackground />
        
        <TouchableOpacity 
          style={styles.backButtonContainer} 
          onPress={() => setGameMode('mainMenu')}
        >
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        
        <ScrollView contentContainerStyle={styles.menuContainer}>
          <Text style={styles.menuTitle}>Choose Your Mode</Text>
          
          <Text style={styles.sectionTitle}>Blitz Mode (30 sec)</Text>
          <View style={styles.levelGrid}>
            {levels.map((level) => (
              <LiquidGlassButton 
                key={`blitz-${level}`} 
                onPress={() => startGame('blitz', level)}
                size="small"
              >
                <Text style={styles.glassButtonText}>{level} Letters</Text>
              </LiquidGlassButton>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Standard Mode (60 sec)</Text>
          <View style={styles.levelGrid}>
            {levels.map((level) => (
              <LiquidGlassButton 
                key={`standard-${level}`} 
                onPress={() => startGame('standard', level)}
                size="small"
              >
                <Text style={styles.glassButtonText}>{level} Letters</Text>
              </LiquidGlassButton>
            ))}
          </View>
          
          <View style={styles.bottomButtonsContainer}>
            <LiquidGlassButton 
              onPress={openStats}
              size="medium"
              style={{ marginBottom: 15 }}
            >
              <Text style={styles.glassButtonText}>Stats</Text>
            </LiquidGlassButton>
            
            <LiquidGlassButton 
              onPress={() => setGameMode('customize')}
              size="medium"
            >
              <Text style={styles.glassButtonText}>Customize</Text>
            </LiquidGlassButton>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Stats Screen
  if (gameMode === 'stats') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <AnimatedBackground />
        
        <TouchableOpacity 
          style={styles.backButtonContainer} 
          onPress={() => setGameMode('modeSelect')}
        >
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        
        <ScrollView 
          style={{ flex: 1, width: '100%' }}
          contentContainerStyle={styles.menuContainer}
          showsVerticalScrollIndicator={true}
        >
          <Text style={styles.menuTitle}>Your Stats</Text>
          
          {playerStats ? (
            <View style={styles.statsGrid}>
              <StatsCard label="Games Played" value={playerStats.gamesPlayed.toString()} />
              <StatsCard label="Total Score" value={playerStats.totalScore.toLocaleString()} />
              <StatsCard label="High Score" value={playerStats.highScore.toString()} />
              <StatsCard label="Avg Score" value={getAverageScore(playerStats).toString()} />
              <StatsCard label="Words Found" value={playerStats.totalWordsFound.toString()} />
              <StatsCard label="Words/Game" value={getWordsPerGame(playerStats).toString()} />
              <StatsCard label="Longest Word" value={playerStats.longestWord.toUpperCase() || '-'} wide />
              <StatsCard label="Favorite Mode" value={getFavoriteMode(playerStats)} />
              <StatsCard label="Favorite Letters" value={getFavoriteLetterCount(playerStats)} />
            </View>
          ) : (
            <Text style={styles.loadingText}>Loading stats...</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Customize Screen
  if (gameMode === 'customize') {
    return <CustomizeScreen onBack={handleCustomizeBack} />;
  }

  // Game Over Screen
  if (gameOver) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <AnimatedBackground />
        
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverTitle}>Time's Up!</Text>
          <Text style={styles.finalScore}>{score}</Text>
          <Text style={styles.finalScoreLabel}>points</Text>
          <Text style={styles.wordsFound}>You found {foundWords.length} {foundWords.length === 1 ? 'word' : 'words'}</Text>
          
          <View style={styles.foundWordsContainerGameOver}>
            <ScrollView style={styles.foundWordsScroll} contentContainerStyle={styles.foundWordsList}>
              {foundWords.map((word: string, index: number) => (
                <View key={index} style={styles.foundWordBadge}>
                  <Text style={styles.foundWordText}>{word.toUpperCase()}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
          
          <TouchableOpacity style={styles.playAgainButton} onPress={() => startGame(gameMode, letterCount)}>
            <Text style={styles.playAgainText}>Play Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuButton} onPress={backToMenu}>
            <Text style={styles.menuButtonText}>Back to Menu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ==================== MAIN GAME SCREEN ====================
  const tileSize = getTileSize();

  return (
    <SafeAreaView style={[styles.gameplayContainer, { backgroundColor: DEFAULT_GAMEPLAY_BACKGROUND }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={backToMenu} accessibilityRole="button" accessibilityLabel="Back to menu">
          <Text style={styles.backButtonGameplay}>← Menu</Text>
        </TouchableOpacity>
        <Text style={[styles.timerGameplay, timeLeft <= 10 && styles.timerWarning]}>{formatTime(timeLeft)}</Text>
        <Text style={styles.scoreGameplay}>{score} pts</Text>
      </View>

      {/* Message */}
      <Text style={styles.messageGameplay}>{message}</Text>

      {/* Word Display - NO background, just text */}
      <View style={styles.wordDisplayTransparent}>
        <Text style={currentWord ? styles.currentWordGameplay : styles.currentWordPlaceholder}>
          {currentWord || '_ _ _'}
        </Text>
      </View>

      {/* Letter Grid */}
      <View style={styles.letterGrid}>
        {letters.map((letter: string, index: number) => (
          <GameTile
            key={index}
            letter={letter}
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

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.clearButton} onPress={handleClear} accessibilityRole="button" accessibilityLabel="Clear selection">
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} accessibilityRole="button" accessibilityLabel="Submit word">
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </View>

      {/* Simplified Found Words List */}
      <View style={styles.foundWordsContainerGameplay}>
        <Text style={styles.foundWordsTitleGameplay}>Found: {foundWords.length}</Text>
        <ScrollView 
          horizontal 
          style={styles.foundWordsScrollGameplay} 
          contentContainerStyle={styles.foundWordsListGameplay}
          showsHorizontalScrollIndicator={false}
        >
          {foundWords.map((word: string, index: number) => (
            <View key={index} style={styles.foundWordBadgeGameplay}>
              <Text style={styles.foundWordTextGameplay}>{word.toUpperCase()}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Refresh Button */}
      <TouchableOpacity style={styles.refreshButtonGameplay} onPress={handleRefresh} accessibilityRole="button" accessibilityLabel="Refresh letters">
        <Text style={styles.refreshButtonTextGameplay}>Refresh Letters</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
