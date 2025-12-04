import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { VALID_WORDS } from '../../data/words';

const { width } = Dimensions.get('window');

const generateLetters = (count: number): string[] => {
  const vowels = 'AEIOU';
  const consonants = 'BCDFGHLMNPRSTWY';
  const letters: string[] = [];
  
  // Add vowels (roughly 1/3 of letters)
  const vowelCount = Math.ceil(count / 3);
  for (let i = 0; i < vowelCount; i++) {
    letters.push(vowels[Math.floor(Math.random() * vowels.length)]);
  }
  
  // Add consonants
  for (let i = 0; i < count - vowelCount; i++) {
    letters.push(consonants[Math.floor(Math.random() * consonants.length)]);
  }
  
  // Shuffle
  return letters.sort(() => Math.random() - 0.5);
};

type GameMode = 'menu' | 'blitz' | 'standard';

export default function WordBuilder() {
  const [gameMode, setGameMode] = useState<GameMode>('menu');
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
    if (letterCount <= 4) return (width - 80) / 2;
    if (letterCount <= 6) return (width - 90) / 3;
    if (letterCount <= 9) return (width - 100) / 3;
    return (width - 110) / 4;
  };

  useEffect(() => {
    if (timeLeft > 0 && !gameOver) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && gameMode !== 'menu' && !gameOver) {
      setGameOver(true);
      setMessage('Time\'s up!');
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, gameMode, gameOver]);

  const startGame = (mode: GameMode, letters: number) => {
    setGameMode(mode);
    setLetterCount(letters);
    setLetters(generateLetters(letters));
    setSelectedIndices([]);
    setCurrentWord('');
    setScore(0);
    setFoundWords([]);
    setMessage('Tap letters to build words!');
    setGameOver(false);
    setTimeLeft(mode === 'blitz' ? 30 : 90);
  };

  const handleLetterPress = (index: number) => {
    if (gameOver) return;
    if (selectedIndices.includes(index)) {
      const newSelected = selectedIndices.filter(i => i !== index);
      setSelectedIndices(newSelected);
      setCurrentWord(newSelected.map(i => letters[i]).join(''));
    } else {
      const newSelected = [...selectedIndices, index];
      setSelectedIndices(newSelected);
      setCurrentWord(newSelected.map(i => letters[i]).join(''));
    }
  };

  const handleSubmit = () => {
    if (gameOver) return;
    const word = currentWord.toLowerCase();
    if (word.length < 3) { setMessage('Words must be at least 3 letters!'); return; }
    if (foundWords.includes(word)) { setMessage('Already found that word!'); return; }
    if (VALID_WORDS.has(word)) {
      const points = word.length * 10;
      setScore(score + points);
      setFoundWords([...foundWords, word]);
      setMessage(`+${points} points!`);
      setSelectedIndices([]);
      setCurrentWord('');
    } else {
      setMessage('Not a valid word!');
    }
  };

  const handleClear = () => {
    if (gameOver) return;
    setSelectedIndices([]);
    setCurrentWord('');
    setMessage('Tap letters to build words!');
  };

  const backToMenu = () => {
    setGameMode('menu');
    setGameOver(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const levels = [3, 4, 5, 6, 7, 8, 9, 10];

  if (gameMode === 'menu') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.menuContainer}>
          <Text style={styles.menuTitle}>Word Builder</Text>
          <Text style={styles.menuSubtitle}>Choose your mode</Text>
          
          <Text style={styles.sectionTitle}>⚡ Blitz Mode (30 sec)</Text>
          <View style={styles.levelGrid}>
            {levels.map((level) => (
              <TouchableOpacity 
                key={`blitz-${level}`} 
                style={styles.levelButton} 
                onPress={() => startGame('blitz', level)}
              >
                <Text style={styles.levelNumber}>{level}</Text>
                <Text style={styles.levelLabel}>letters</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.sectionTitle}>⏱️ Standard Mode (90 sec)</Text>
          <View style={styles.levelGrid}>
            {levels.map((level) => (
              <TouchableOpacity 
                key={`standard-${level}`} 
                style={styles.levelButton} 
                onPress={() => startGame('standard', level)}
              >
                <Text style={styles.levelNumber}>{level}</Text>
                <Text style={styles.levelLabel}>letters</Text>
              </TouchableOpacity>
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
          <Text style={styles.gameOverTitle}>Time's Up!</Text>
          <Text style={styles.finalScore}>{score}</Text>
          <Text style={styles.finalScoreLabel}>points</Text>
          <Text style={styles.wordsFound}>You found {foundWords.length} words</Text>
          
          <View style={styles.foundWordsContainerGameOver}>
            <ScrollView style={styles.foundWordsScroll} contentContainerStyle={styles.foundWordsList}>
              {foundWords.map((word, index) => (
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

  const tileSize = getTileSize();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={backToMenu}>
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
        {letters.map((letter, index) => (
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
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.foundWordsContainer}>
        <Text style={styles.foundWordsTitle}>Found Words ({foundWords.length}):</Text>
        <ScrollView style={styles.foundWordsScroll} contentContainerStyle={styles.foundWordsList}>
          {foundWords.map((word, index) => (
            <View key={index} style={styles.foundWordBadge}>
              <Text style={styles.foundWordText}>{word.toUpperCase()}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', paddingTop: 20 },
  menuContainer: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 20, paddingVertical: 40 },
  menuTitle: { fontSize: 42, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  menuSubtitle: { fontSize: 18, color: '#888', marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#4ecca3', marginBottom: 15, marginTop: 20 },
  levelGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 10 },
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 20, marginBottom: 10 },
  backButton: { fontSize: 16, color: '#4ecca3' },
  timer: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  timerWarning: { color: '#e94560' },
  score: { fontSize: 18, color: '#4ecca3', fontWeight: '600' },
  message: { fontSize: 16, color: '#888', marginBottom: 15, height: 20 },
  wordDisplay: { backgroundColor: '#16213e', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 15, marginBottom: 20, minWidth: 200, alignItems: 'center' },
  currentWord: { fontSize: 28, fontWeight: 'bold', color: '#fff', letterSpacing: 3 },
  letterGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: width - 30, gap: 8, marginBottom: 20 },
  letterTile: { backgroundColor: '#0f3460', borderRadius: 12, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  selectedTile: { backgroundColor: '#4ecca3', transform: [{ scale: 0.95 }] },
  letterText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  selectedText: { color: '#1a1a2e' },
  orderBadge: { position: 'absolute', top: 3, right: 3, backgroundColor: '#1a1a2e', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  orderText: { color: '#4ecca3', fontSize: 12, fontWeight: 'bold' },
  buttonRow: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  clearButton: { backgroundColor: '#e94560', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  submitButton: { backgroundColor: '#4ecca3', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  foundWordsContainer: { flex: 1, width: '100%', paddingHorizontal: 20 },
  foundWordsTitle: { fontSize: 16, color: '#888', marginBottom: 10 },
  foundWordsScroll: { flex: 1 },
  foundWordsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  foundWordBadge: { backgroundColor: '#16213e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  foundWordText: { color: '#4ecca3', fontSize: 14, fontWeight: '600' },
});
