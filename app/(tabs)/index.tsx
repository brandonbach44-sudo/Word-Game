import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VALID_WORDS } from '../../data/words';

const { width } = Dimensions.get('window');

// Liquid Glass Button Component
const LiquidGlassButton = ({ 
  onPress, 
  disabled = false, 
  children, 
  style = {},
  size = 'large' // 'large' or 'small'
}: { 
  onPress?: () => void; 
  disabled?: boolean; 
  children: React.ReactNode;
  style?: any;
  size?: 'large' | 'small';
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const [shimmerOpacity] = useState(() => 0.15 + Math.random() * 0.15); // Random opacity between 0.15-0.3
  
  useEffect(() => {
    // Random initial delay between 0-3 seconds so buttons don't sync
    const initialDelay = Math.random() * 3000;
    
    const runShimmer = () => {
      shimmerAnim.setValue(0);
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1800 + Math.random() * 800, // Random duration 1.8-2.6s
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    };
    
    // Start after random delay
    const initialTimeout = setTimeout(() => {
      runShimmer();
      
      // Then run at random intervals (5-9 seconds)
      const scheduleNext = () => {
        const nextDelay = 5000 + Math.random() * 4000;
        return setTimeout(() => {
          runShimmer();
          scheduleNext();
        }, nextDelay);
      };
      scheduleNext();
    }, initialDelay);
    
    return () => clearTimeout(initialTimeout);
  }, [shimmerAnim]);
  
  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: size === 'large' ? [-250, 250] : [-100, 100],
  });
  
  const isLarge = size === 'large';
  const buttonRadius = isLarge ? 28 : 20;
  
  const Wrapper = disabled ? View : TouchableOpacity;
  
  return (
    <Wrapper 
      onPress={disabled ? undefined : onPress}
      activeOpacity={0.8}
      style={[
        {
          borderRadius: buttonRadius,
          overflow: 'hidden',
          minWidth: isLarge ? 250 : 85,
          opacity: disabled ? 0.5 : 1,
        },
        // Shadow for floating effect
        !disabled && {
          shadowColor: '#4ecca3',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 10,
        },
        style,
      ]}
    >
      {/* Main blur background */}
      <BlurView 
        intensity={60} 
        tint={disabled ? "dark" : "light"} 
        style={{
          borderRadius: buttonRadius,
          overflow: 'hidden',
        }}
      >
        {/* Gradient border effect - light on top, darker on bottom */}
        <LinearGradient
          colors={
            disabled 
              ? ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']
              : ['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.15)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            padding: 1.5,
            borderRadius: buttonRadius,
          }}
        >
          {/* Inner content area */}
          <View style={{
            backgroundColor: disabled 
              ? 'rgba(50,50,60,0.6)' 
              : 'rgba(255,255,255,0.08)',
            borderRadius: buttonRadius - 1.5,
            overflow: 'hidden',
          }}>
            {/* Top inner highlight - more subtle */}
            <LinearGradient
              colors={[
                disabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.18)',
                'transparent'
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: isLarge ? 35 : 22,
                borderTopLeftRadius: buttonRadius - 1.5,
                borderTopRightRadius: buttonRadius - 1.5,
              }}
            />
            
            {/* Animated shimmer/shine effect - more subtle and randomized */}
            {!disabled && (
              <Animated.View
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  width: isLarge ? 100 : 50,
                  transform: [
                    { translateX: shimmerTranslate },
                    { skewX: '-15deg' },
                  ],
                  opacity: shimmerOpacity,
                }}
              >
                <LinearGradient
                  colors={[
                    'transparent',
                    'rgba(255,255,255,0.4)',
                    'rgba(255,255,255,0.7)',
                    'rgba(255,255,255,0.4)',
                    'transparent',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ flex: 1 }}
                />
              </Animated.View>
            )}
            
            {/* Button content */}
            <View style={{
              paddingHorizontal: isLarge ? 50 : 18,
              paddingVertical: isLarge ? 20 : 14,
              alignItems: 'center',
            }}>
              {children}
            </View>
          </View>
        </LinearGradient>
      </BlurView>
    </Wrapper>
  );
};

// Animated Background Circles Component
const AnimatedBackground = () => {
  const [circles, setCircles] = useState<{
    id: number;
    x: Animated.Value;
    y: Animated.Value;
    scale: Animated.Value;
    size: number;
    color: string;
    opacity: number;
  }[]>([]);
  
  const circleIdRef = useRef(0);
  const maxCirclesRef = useRef(2 + Math.floor(Math.random() * 5)); // Random 2-6
  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;

  // Colors: teal, red, blue, purple, pink, gold (memoized for stable reference)
  const colors = useMemo(() => [
    '#4ecca3', // teal
    '#e74c3c', // red
    '#3498db', // blue
    '#9b59b6', // purple
    '#e94560', // pink
    '#f39c12', // gold
  ], []);
  
  const createCircle = useCallback((spawnOnScreen: boolean = false) => {
    const id = circleIdRef.current++;
    const size = 150 + Math.random() * 200; // 150-350px
    const opacity = 0.15 + Math.random() * 0.2; // 0.15-0.35
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    let startX, startY, endX, endY;
    
    if (spawnOnScreen) {
      // Initial circles: spawn randomly on screen
      startX = Math.random() * screenWidth - size / 2;
      startY = Math.random() * screenHeight - size / 2;
      
      // Pick a random direction to exit
      const angle = Math.random() * Math.PI * 2;
      const distance = screenWidth + screenHeight;
      endX = startX + Math.cos(angle) * distance;
      endY = startY + Math.sin(angle) * distance;
    } else {
      // Subsequent circles: spawn from edges
      const edge = Math.floor(Math.random() * 4);
      
      switch (edge) {
        case 0: // top
          startX = Math.random() * screenWidth - size / 2;
          startY = -size;
          endX = startX + (Math.random() - 0.5) * screenWidth;
          endY = screenHeight + size;
          break;
        case 1: // right
          startX = screenWidth;
          startY = Math.random() * screenHeight - size / 2;
          endX = -size;
          endY = startY + (Math.random() - 0.5) * screenHeight;
          break;
        case 2: // bottom
          startX = Math.random() * screenWidth - size / 2;
          startY = screenHeight;
          endX = startX + (Math.random() - 0.5) * screenWidth;
          endY = -size;
          break;
        default: // left
          startX = -size;
          startY = Math.random() * screenHeight - size / 2;
          endX = screenWidth + size;
          endY = startY + (Math.random() - 0.5) * screenHeight;
          break;
      }
    }
    
    const x = new Animated.Value(startX);
    const y = new Animated.Value(startY);
    const scale = new Animated.Value(0.8 + Math.random() * 0.4);
    
    const duration = 20000 + Math.random() * 25000; // 20-45 seconds to cross
    
    // Start movement animation
    Animated.parallel([
      Animated.timing(x, {
        toValue: endX,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(y, {
        toValue: endY,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Remove circle when animation completes
      setCircles(prev => prev.filter(c => c.id !== id));
    });
    
    // Pulse animation (loops)
    const pulseLoop = () => {
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 0.85 + Math.random() * 0.3,
          duration: 3000 + Math.random() * 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1 + Math.random() * 0.2,
          duration: 3000 + Math.random() * 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) pulseLoop();
      });
    };
    pulseLoop();
    
    return { id, x, y, scale, size, color, opacity };
  }, [screenWidth, screenHeight, colors]);

  useEffect(() => {
    // Create initial circles ON SCREEN instantly (no delay)
    const initialCount = 3 + Math.floor(Math.random() * 2); // Start with 3-4
    const initialCircles = [];
    for (let i = 0; i < initialCount; i++) {
      initialCircles.push(createCircle(true)); // true = spawn on screen
    }
    setCircles(initialCircles);
    
    // Spawn new circles periodically FROM EDGES
    const spawnInterval = setInterval(() => {
      // Randomly change max circles occasionally
      if (Math.random() < 0.1) {
        maxCirclesRef.current = 2 + Math.floor(Math.random() * 5); // 2-6
      }
      
      setCircles(prev => {
        if (prev.length < maxCirclesRef.current) {
          return [...prev, createCircle(false)]; // false = spawn from edge
        }
        return prev;
      });
    }, 4000 + Math.random() * 3000); // Every 4-7 seconds
    
    return () => clearInterval(spawnInterval);
  }, [createCircle]);

  return (
    <View style={styles.backgroundShapes}>
      {circles.map(circle => (
        <Animated.View
          key={circle.id}
          style={[
            styles.bgCircle,
            {
              width: circle.size,
              height: circle.size,
              backgroundColor: circle.color,
              opacity: circle.opacity,
              transform: [
                { translateX: circle.x },
                { translateY: circle.y },
                { scale: circle.scale },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

// Weighted letter selection
const pickVowel = (): string => {
  const rand = Math.random() * 100;
  if (rand < 30) return 'E';      // 30%
  if (rand < 55) return 'A';      // 25%
  if (rand < 75) return 'I';      // 20%
  if (rand < 90) return 'O';      // 15%
  return 'U';                      // 10%
};

// Letter point values (Scrabble-style)
const letterValues: { [key: string]: number } = {
  'E': 1, 'A': 1, 'I': 1, 'O': 1, 'U': 1, 'T': 1, 'N': 1, 'S': 1, 'R': 1, 'L': 1,
  'D': 2, 'G': 2,
  'B': 3, 'C': 3, 'M': 3, 'P': 3,
  'F': 4, 'H': 4, 'V': 4, 'W': 4, 'Y': 4,
  'K': 5,
  'J': 8, 'X': 8,
  'Q': 10, 'Z': 10,
};

const calculateWordScore = (word: string): number => {
  const baseScore = word.toUpperCase().split('').reduce((total, letter) => {
    return total + (letterValues[letter] || 0);
  }, 0);
  return baseScore * 50;
};

const pickConsonant = (): string => {
  const rand = Math.random() * 100;
  // Common: T, N, S, R, L (~12% each = 60% total)
  if (rand < 12) return 'T';
  if (rand < 24) return 'N';
  if (rand < 36) return 'S';
  if (rand < 48) return 'R';
  if (rand < 60) return 'L';
  // Medium: D, C, H, M, P, F, G, W, B, Y (~4% each = 40% total)
  if (rand < 64) return 'D';
  if (rand < 68) return 'C';
  if (rand < 72) return 'H';
  if (rand < 76) return 'M';
  if (rand < 80) return 'P';
  if (rand < 84) return 'F';
  if (rand < 88) return 'G';
  if (rand < 92) return 'W';
  if (rand < 95) return 'B';
  if (rand < 98) return 'Y';
  // Rare: K, V (~1% each)
  if (rand < 99) return 'K';
  if (rand < 99.5) return 'V';
  // Very Rare: J, X, Q, Z (~0.5% total)
  if (rand < 99.6) return 'J';
  if (rand < 99.7) return 'X';
  if (rand < 99.85) return 'Q';
  return 'Z';
};

const generateLetters = (count: number): string[] => {
  const letters: string[] = [];
  
  // Determine vowel count based on tile count
  let vowelCount: number;
  if (count === 6) {
    vowelCount = 2;
  } else if (count === 7) {
    vowelCount = Math.random() < 0.5 ? 2 : 3;
  } else {
    vowelCount = Math.random() < 0.5 ? 2 : 3;
  }
  
  // Add vowels
  for (let i = 0; i < vowelCount; i++) {
    letters.push(pickVowel());
  }
  
  // Add consonants
  for (let i = 0; i < count - vowelCount; i++) {
    letters.push(pickConsonant());
  }
  
  // Shuffle
  return letters.sort(() => Math.random() - 0.5);
};

type GameMode = 'mainMenu' | 'modeSelect' | 'blitz' | 'standard';

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
  const timerRef = useRef<number | null>(null);

  const getTileSize = () => {
    // Keep tiles similar size across all modes for consistent layout
    const baseSize = (width - 80) / 3;  // Base size for 3 per row
    if (letterCount <= 6) return baseSize;  // 3 per row
    // For 7-8 tiles, use same base calculation but for 4 per row
    return (width - 90) / 4;
  };

  useEffect(() => {
    if (timeLeft > 0 && !gameOver) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && gameMode !== 'mainMenu' && gameMode !== 'modeSelect' && !gameOver) {
      setGameOver(true);
      setMessage('Time\'s up!');
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, gameMode, gameOver]);

  const startGame = (mode: GameMode, numLetters: number) => {
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
    setGameMode('mainMenu');
    setGameOver(false);
    if (timerRef.current) clearTimeout(timerRef.current);
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
        {/* Animated background shapes */}
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
          >
            <Text style={styles.glassButtonTextDisabled}>Online</Text>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
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
        {/* Animated background shapes */}
        <AnimatedBackground />
        
        {/* Back button in top left */}
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
        </ScrollView>
      </SafeAreaView>
    );
  }

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

  // Compute tile size without hooks to avoid conditional hook usage issues
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', paddingTop: 20 },
  
  // Background shapes
  backgroundShapes: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  bgCircle: { position: 'absolute', borderRadius: 999 },
  
  mainMenuContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, zIndex: 1 },
  
  // Liquid Glass Button Styles
  glassButtonWrapper: { marginBottom: 20, borderRadius: 28, overflow: 'hidden', minWidth: 250 },
  glassButton: { 
    borderWidth: 1.5, 
    borderColor: 'rgba(255,255,255,0.4)', 
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  glassInner: { paddingHorizontal: 50, paddingVertical: 20, alignItems: 'center' },
  glassButtonText: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  glassButtonWrapperDisabled: { marginBottom: 20, borderRadius: 28, overflow: 'hidden', minWidth: 250, opacity: 0.5 },
  glassButtonDisabled: { 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.2)', 
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  glassButtonTextDisabled: { fontSize: 22, fontWeight: 'bold', color: '#aaa' },
  comingSoonText: { fontSize: 12, color: '#888', marginTop: 5 },
  
  // Liquid Glass Level Button Styles
  glassLevelWrapper: { borderRadius: 20, overflow: 'hidden', minWidth: 85 },
  glassLevelButton: { 
    borderWidth: 1.5, 
    borderColor: 'rgba(255,255,255,0.35)', 
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  glassLevelNumber: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  glassLevelLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  
  // Old styles kept for reference/other uses
  mainMenuButton: { backgroundColor: '#4ecca3', paddingHorizontal: 50, paddingVertical: 20, borderRadius: 25, marginBottom: 20, minWidth: 250, alignItems: 'center' },
  mainMenuButtonText: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e' },
  mainMenuButtonDisabled: { backgroundColor: '#3a3a4e', paddingHorizontal: 50, paddingVertical: 20, borderRadius: 25, marginBottom: 20, minWidth: 250, alignItems: 'center', opacity: 0.6 },
  mainMenuButtonTextDisabled: { fontSize: 22, fontWeight: 'bold', color: '#888' },
  
  menuContainer: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 20, paddingVertical: 40, zIndex: 1 },
  menuTitle: { fontSize: 42, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  menuSubtitle: { fontSize: 18, color: '#888', marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#4ecca3', marginBottom: 15, marginTop: 20 },
  levelGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 10 },
  levelButton: { backgroundColor: '#16213e', borderRadius: 15, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 2, borderColor: '#0f3460', alignItems: 'center', minWidth: 70 },
  levelNumber: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  levelLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  gameOverContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  gameOverTitle: { fontSize: 36, fontWeight: 'bold', color: '#e94560', marginBottom: 20 },
  finalScore: { fontSize: 72, fontWeight: 'bold', color: '#4ecca3' },
  finalScoreLabel: { fontSize: 24, color: '#888', marginBottom: 10 },
  wordsFound: { fontSize: 18, color: '#fff', marginBottom: 20 },
  foundWordsContainerGameOver: { height: 150, width: '100%', marginBottom: 20 },
  playAgainButton: { backgroundColor: '#4ecca3', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 25, marginBottom: 15 },
  playAgainText: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  menuButton: { backgroundColor: 'transparent', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 25, borderWidth: 1, borderColor: '#4ecca3' },
  menuButtonText: { fontSize: 16, color: '#4ecca3' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 20, marginBottom: 15 },
  backButtonContainer: { position: 'absolute', top: 60, left: 20, zIndex: 10 },
  backButton: { fontSize: 16, color: '#4ecca3' },
  timer: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  timerWarning: { color: '#e94560' },
  score: { fontSize: 18, color: '#4ecca3', fontWeight: '600' },
  message: { fontSize: 16, color: '#888', marginBottom: 20, height: 20 },
  wordDisplay: { backgroundColor: '#16213e', paddingHorizontal: 40, paddingVertical: 18, borderRadius: 18, marginBottom: 25, minWidth: 240, alignItems: 'center' },
  currentWord: { fontSize: 32, fontWeight: 'bold', color: '#fff', letterSpacing: 4 },
  letterGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: width - 40, gap: 10, marginBottom: 30, marginTop: 20, minHeight: 200 },
  letterTile: { backgroundColor: '#0f3460', borderRadius: 12, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  selectedTile: { backgroundColor: '#4ecca3', transform: [{ scale: 0.95 }] },
  letterText: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  selectedText: { color: '#1a1a2e' },
  orderBadge: { position: 'absolute', top: 3, right: 3, backgroundColor: '#1a1a2e', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  orderText: { color: '#4ecca3', fontSize: 12, fontWeight: 'bold' },
  buttonRow: { flexDirection: 'row', gap: 20, marginBottom: 30 },
  clearButton: { backgroundColor: '#e94560', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  submitButton: { backgroundColor: '#4ecca3', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  foundWordsContainer: { flex: 1, width: '100%', paddingHorizontal: 20, minHeight: 150 },
  foundWordsTitle: { fontSize: 16, color: '#888', marginBottom: 10 },
  foundWordsScroll: { flex: 1, minHeight: 80 },
  foundWordsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 10 },
  foundWordBadge: { backgroundColor: '#16213e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  foundWordText: { color: '#4ecca3', fontSize: 14, fontWeight: '600' },
  refreshButton: { backgroundColor: '#16213e', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25, marginTop: 15, marginBottom: 30 },
  refreshButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
});
