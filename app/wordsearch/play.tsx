// app/wordsearch/play.tsx

import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../src/shared/ThemeContext';
import { COLORS } from '../../src/shared/theme';
import { WORD_SEARCH_THEMES, type WordSearchThemeId } from '../../src/wordsearch/data/themes';
import { generatePuzzle } from '../../src/wordsearch/utils/generator';

type Difficulty = 'easy' | 'challenge' | 'extreme';

interface DifficultyConfig {
  label: string;
  rows: number;
  cols: number;
  multiplier: number;
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { label: 'Easy', rows: 10, cols: 10, multiplier: 1 },
  challenge: { label: 'Challenge', rows: 12, cols: 12, multiplier: 2 },
  extreme: { label: 'Extreme', rows: 14, cols: 14, multiplier: 3 },
};

type Screen = 'categories' | 'difficulty';

const WordSearchPlayScreen: React.FC = () => {
  const { background } = useTheme();

  const [currentScreen, setCurrentScreen] = useState<Screen>('categories');
  const [selectedCategory, setSelectedCategory] = useState<WordSearchThemeId | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSelectCategory = (themeId: WordSearchThemeId) => {
    setSelectedCategory(themeId);
    setCurrentScreen('difficulty');
  };

  const handleSelectDifficulty = async (difficulty: Difficulty) => {
    if (!selectedCategory) return;

    setSelectedDifficulty(difficulty);
    setIsGenerating(true);

    try {
      // Find the theme
      const theme = WORD_SEARCH_THEMES.find(t => t.id === selectedCategory);
      if (!theme) throw new Error('Theme not found');

      const config = DIFFICULTY_CONFIG[difficulty];

      // Generate puzzle
      const puzzle = generatePuzzle(theme, {
        rows: config.rows,
        cols: config.cols,
        wordsPerPuzzle: Math.min(theme.words.length, Math.floor((config.rows + config.cols) / 2)),
        allowBackwards: true,
        allowDiagonal: true,
      });

      // Navigate to play screen with puzzle data
      router.push({
        pathname: '/wordsearch/game',
        params: {
          themeId: selectedCategory,
          difficulty,
          puzzleData: JSON.stringify(puzzle),
        },
      });
    } catch (error) {
      console.error('Failed to generate puzzle:', error);
      setIsGenerating(false);
    }
  };

  const handleBackToCategories = () => {
    setCurrentScreen('categories');
    setSelectedCategory(null);
  };

  const handleBack = () => {
    if (currentScreen === 'difficulty') {
      handleBackToCategories();
    } else {
      router.back();
    }
  };

  const categoryTheme = selectedCategory
    ? WORD_SEARCH_THEMES.find(t => t.id === selectedCategory)
    : null;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: background.backgroundColor }]}
    >
      <StatusBar
        barStyle={background.statusBar === 'light' ? 'light-content' : 'dark-content'}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={[styles.backText, { color: background.secondaryText }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: background.textColor }]}>
          {currentScreen === 'categories' ? 'Choose Category' : 'Choose Difficulty'}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentScreen === 'categories' ? (
          <>
            <Text
              style={[
                styles.subtitle,
                { color: background.secondaryText },
              ]}
            >
              Select a word category to begin
            </Text>

            <View style={styles.categoriesGrid}>
              {WORD_SEARCH_THEMES.map(theme => (
                <TouchableOpacity
                  key={theme.id}
                  style={[
                    styles.categoryCard,
                    {
                      backgroundColor: background.cardColor,
                      borderColor: background.borderColor,
                    },
                  ]}
                  onPress={() => handleSelectCategory(theme.id)}
                >
                  <Text style={[styles.categoryName, { color: background.textColor }]}>
                    {theme.name}
                  </Text>
                  <Text
                    style={[
                      styles.categoryWordCount,
                      { color: background.secondaryText },
                    ]}
                  >
                    {theme.words.length} words
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            <View
              style={[
                styles.selectedCard,
                {
                  backgroundColor: background.cardColor,
                  borderColor: COLORS.accent,
                },
              ]}
            >
              <Text style={[styles.selectedName, { color: background.textColor }]}>
                {categoryTheme?.name}
              </Text>
              <Text
                style={[
                  styles.selectedDescription,
                  { color: background.secondaryText },
                ]}
              >
                Find {categoryTheme?.words.length || 0} words in the grid
              </Text>
            </View>

            <Text
              style={[
                styles.difficultyTitle,
                { color: background.textColor },
              ]}
            >
              Select Difficulty
            </Text>

            <View style={styles.difficultiesContainer}>
              {(Object.entries(DIFFICULTY_CONFIG) as [Difficulty, DifficultyConfig][]).map(
                ([diffKey, config]) => (
                  <TouchableOpacity
                    key={diffKey}
                    style={[
                      styles.difficultyButton,
                      {
                        backgroundColor: background.cardColor,
                        borderColor: background.borderColor,
                      },
                    ]}
                    onPress={() => handleSelectDifficulty(diffKey)}
                    disabled={isGenerating}
                  >
                    <Text style={[styles.difficultyLabel, { color: background.textColor }]}>
                      {config.label}
                    </Text>
                    <Text style={[styles.boardSize, { color: background.secondaryText }]}>
                      {config.rows}×{config.cols}
                    </Text>
                    <Text style={[styles.pointsMultiplier, { color: COLORS.accent }]}>
                      {config.multiplier}x Points
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Loading modal */}
      <Modal transparent visible={isGenerating} animationType="fade">
        <View style={styles.loadingOverlay}>
          <View
            style={[
              styles.loadingBox,
              { backgroundColor: background.cardColor },
            ]}
          >
            <ActivityIndicator color={COLORS.accent} size="large" />
            <Text
              style={[
                styles.loadingText,
                { color: background.textColor, marginTop: 12 },
              ]}
            >
              Generating Puzzle...
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },
  backText: { fontSize: 16 },
  title: { fontSize: 22, fontWeight: 'bold' },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
  },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  categoryName: { fontSize: 14, fontWeight: '600', marginBottom: 4, textAlign: 'center' },
  categoryWordCount: { fontSize: 12, textAlign: 'center' },
  selectedCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  selectedName: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  selectedDescription: { fontSize: 13 },
  difficultyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  difficultiesContainer: { gap: 12, width: '100%' },
  difficultyButton: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 4,
  },
  difficultyLabel: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  boardSize: { fontSize: 13, marginBottom: 2 },
  pointsMultiplier: { fontSize: 12, fontWeight: '600' },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 200,
  },
  loadingText: { fontSize: 14, fontWeight: '500' },
});

export default WordSearchPlayScreen;
