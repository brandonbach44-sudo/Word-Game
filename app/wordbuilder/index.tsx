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

// Components (local to Word Builder)
import { AnimatedBackground } from './components/AnimatedBackground';
import { LiquidGlassButton } from './components/LiquidGlassButton';
import { StatsCard } from './components/StatsCard';

// Styles (local to Word Builder)
import { styles } from './styles/gameStyles';

// Utils (local to Word Builder)
import { generateLetters } from './utils/letterGenerator';
import { calculateWordScore } from './utils/scoring';
import { 
  PlayerStats,
  loadStats, 
  updateStatsAfterGame,
  getAverageScore,
  getWordsPerGame,
  getFavoriteMode,
  getFavoriteLetterCount,
} from './utils/storage';

// Data (local to Word Builder)
import { VALID_WORDS } from './data/words';

const { width } = Dimensions.get('window');

type GameMode = 'mainMenu' | 'modeSelect' | 'stats' | 'blitz' | 'standard';

export default function WordBuilder() {
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
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [lastGameMode, setLastGameMode] = useState<'blitz' | 'standard'>('blitz');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getTileSize = () => {
    const baseSize = (width - 80) / 3;
    if (letterCount <= 6) return baseSize;
    return (width - 90) / 4;
  };

  useEffect(() => {
    if (timeLeft > 0 && !gameOver) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && gameMode !== 'mainMenu' && gameMode !== 'modeSelect' && gameMode !== 'stats' && !gameOver) {
      setGameOver(true);
      setMessage('Time\'s up!');
      // Save stats when game ends
      if (foundWords.length > 0 || score > 0) {
        updateStatsAfterGame(score, foundWords, lastGameMode, letterCount);
      }
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
    const stats = await loadStats();
    setPlayerStats(stats);
    setGameMode('stats');
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
          
          <Text style={styles.sectionTitle}>⚡ Blitz Mode (30 sec)</Text>
          <View style={styles.levelGrid}>
            {levels.map((level) => (
              <LiquidGlassButton 
                key={`blitz-${level}`} 
                onPress={() => startGame('blitz', level)}
                size="small"
              >
                <Text style={styles.glassLevelNumber}>{level}</Text>
                <Text style={styles.glassLevelLabel}>letters</Text>
              </LiquidGlassButton>
            ))}
          </View>
          
          <Text style={styles.sectionTitle}>⏱️ Standard Mode (60 sec)</Text>
          <View style={styles.levelGrid}>
            {levels.map((level) => (
              <LiquidGlassButton 
                key={`standard-${level}`} 
                onPress={() => startGame('standard', level)}
                size="small"
              >
                <Text style={styles.glassLevelNumber}>{level}</Text>
                <Text style={styles.glassLevelLabel}>letters</Text>
              </LiquidGlassButton>
            ))}
          </View>
          
          {/* Stats Button */}
          <View style={{ marginTop: 30 }}>
            <LiquidGlassButton 
              onPress={openStats}
              size="large"
            >
              <Text style={styles.glassButtonText}>📊 Your Stats</Text>
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
        
        <ScrollView contentContainerStyle={styles.menuContainer}>
          <Text style={styles.menuTitle}>Your Stats</Text>
          
          {playerStats && (
            <View style={styles.statsGrid}>
              <StatsCard 
                icon="🎮" 
                value={playerStats.gamesPlayed} 
                label="Games Played" 
              />
              <StatsCard 
                icon="⭐" 
                value={playerStats.totalScore.toLocaleString()} 
                label="Total Score" 
              />
              <StatsCard 
                icon="🏆" 
                value={playerStats.highScore.toLocaleString()} 
                label="High Score" 
              />
              <StatsCard 
                icon="📊" 
                value={getAverageScore(playerStats).toLocaleString()} 
                label="Average Score" 
              />
              <StatsCard 
                icon="📝" 
                value={playerStats.totalWordsFound} 
                label="Total Words Found" 
              />
              <StatsCard 
                icon="📈" 
                value={getWordsPerGame(playerStats)} 
                label="Words Per Game" 
              />
              <StatsCard 
                icon="🔤" 
                value={playerStats.longestWord ? `${playerStats.longestWord.toUpperCase()} (${playerStats.longestWord.length})` : '-'} 
                label="Longest Word" 
              />
              <StatsCard 
                icon="⚡" 
                value={getFavoriteMode(playerStats)} 
                label="Favorite Mode" 
              />
              <StatsCard 
                icon="🔢" 
                value={getFavoriteLetterCount(playerStats)} 
                label="Favorite Letters" 
              />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Game Over Screen
  if (gameOver) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverTitle}>Time&apos;s Up!</Text>
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

  // Main Game Screen
  const tileSize = getTileSize();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={backToMenu} accessibilityRole="button" accessibilityLabel="Back to menu">
          <Text style={styles.backButton}>← Menu</Text>
        </TouchableOpacity>
        <Text style={[styles.timer, timeLeft <= 10 && styles.timerWarning]}>{formatTime(timeLeft)}</Text>
        <Text style={styles.score}>{score} pts</Text>
      </View>

      <Text style={styles.message}>{message}</Text>

      <View style={styles.wordDisplay}>
        <Text style={styles.currentWord}>{currentWord || '_ _ _'}</Text>
      </View>

      <View style={styles.letterGrid}>
        {letters.map((letter: string, index: number) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.letterTile, 
              { width: tileSize, height: tileSize },
              selectedIndices.includes(index) && styles.selectedTile
            ]}
            onPress={() => handleLetterPress(index)}
          >
            <Text style={[styles.letterText, selectedIndices.includes(index) && styles.selectedText]}>{letter}</Text>
            {selectedIndices.includes(index) && (
              <View style={styles.orderBadge}>
                <Text style={styles.orderText}>{selectedIndices.indexOf(index) + 1}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.clearButton} onPress={handleClear} accessibilityRole="button" accessibilityLabel="Clear selection">
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} accessibilityRole="button" accessibilityLabel="Submit word">
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.foundWordsContainer}>
        <Text style={styles.foundWordsTitle}>Found Words ({foundWords.length}):</Text>
        <ScrollView style={styles.foundWordsScroll} contentContainerStyle={styles.foundWordsList}>
          {foundWords.map((word: string, index: number) => (
            <View key={index} style={styles.foundWordBadge}>
              <Text style={styles.foundWordText}>{word.toUpperCase()}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh} accessibilityRole="button" accessibilityLabel="Refresh letters">
        <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
