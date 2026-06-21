// app/wordsearch/index.tsx

import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import {
  formatDisplayDate,
  getWinRate,
  hasPlayedTodayDaily,
  loadGameStats,
  useCountdownToMidnight,
  type GameStats,
} from '../../src/wordsearch/utils/storage';

type Tab = 'play' | 'stats';

const WordSearchEntryScreen: React.FC = () => {
  const { background } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('play');

  const [stats, setStats] = useState<GameStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [dailyPlayed, setDailyPlayed] = useState<boolean | null>(null);
  const countdown = useCountdownToMidnight();

  useEffect(() => {
    const init = async () => {
      try {
        const s = await loadGameStats();
        setStats(s);
      } finally {
        setLoadingStats(false);
      }

      try {
        const played = await hasPlayedTodayDaily();
        setDailyPlayed(played);
      } catch {
        setDailyPlayed(false);
      }
    };

    init();
  }, []);

  const winRate = stats ? getWinRate(stats) : 0;

  const handlePlayDaily = () => {
    router.push('/wordsearch/daily');
  };

  const handleClassicGame = () => {
    router.push('/wordsearch/play');
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: background.backgroundColor }]}
    >
      <StatusBar
        barStyle={background.statusBar === 'light' ? 'light-content' : 'dark-content'}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: background.secondaryText }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: background.textColor }]}>Word Search</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Play / Stats toggle */}
      <View style={[styles.toggleContainer, { backgroundColor: background.cardColor }]}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            activeTab === 'play' && { backgroundColor: background.backgroundColor },
          ]}
          onPress={() => setActiveTab('play')}
        >
          <Text
            style={[
              styles.toggleText,
              { color: background.secondaryText },
              activeTab === 'play' && { color: background.textColor, fontWeight: '600' },
            ]}
          >
            Play
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            activeTab === 'stats' && { backgroundColor: background.backgroundColor },
          ]}
          onPress={() => setActiveTab('stats')}
        >
          <Text
            style={[
              styles.toggleText,
              { color: background.secondaryText },
              activeTab === 'stats' && { color: background.textColor, fontWeight: '600' },
            ]}
          >
            Stats
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'play' ? (
          <>
            {/* Daily Challenge Card */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: background.cardColor,
                  borderColor: dailyPlayed ? COLORS.accent : background.borderColor,
                },
              ]}
            >
              <Text
                style={[
                  styles.cardLabel,
                  { color: background.secondaryText },
                ]}
              >
                Daily Challenge
              </Text>
              <Text
                style={[
                  styles.cardTitle,
                  { color: background.textColor },
                ]}
              >
                {formatDisplayDate()}
              </Text>
              <Text
                style={[
                  styles.cardSubtitle,
                  { color: background.secondaryText },
                ]}
              >
                Find as many words as you can on today&apos;s board.
              </Text>

              <View style={styles.dailyRow}>
                <View>
                  <Text
                    style={[
                      styles.countdownLabel,
                      { color: background.secondaryText },
                    ]}
                  >
                    New daily in
                  </Text>
                  <Text style={[styles.countdownValue, { color: COLORS.accent }]}>
                    {countdown || '—'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { backgroundColor: COLORS.accent },
                  ]}
                  onPress={handlePlayDaily}
                  disabled={dailyPlayed === null}
                >
                  <Text style={styles.primaryButtonText}>
                    {dailyPlayed ? 'Play Daily Challenge' : 'Play Daily Challenge'}
                  </Text>
                </TouchableOpacity>
              </View>

              {dailyPlayed && (
                <Text
                  style={[
                    styles.dailyNote,
                    { color: background.secondaryText },
                  ]}
                >
                  You&apos;ve already recorded a score for today&apos;s daily in this
                  game. Replays won&apos;t change your streak.
                </Text>
              )}
            </View>

            {/* Classic Game button */}
            <View style={styles.classicSection}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: background.textColor },
                ]}
              >
                Classic Game
              </Text>

              <Text
                style={[
                  styles.classicDescription,
                  { color: background.secondaryText },
                ]}
              >
                Play regular Word Search with your choice of difficulty and category.
              </Text>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: COLORS.accent, marginTop: 12, alignSelf: 'flex-start' },
                ]}
                onPress={handleClassicGame}
              >
                <Text style={styles.primaryButtonText}>Classic Game</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Stats Tab */}
            {loadingStats ? (
              <ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} />
            ) : stats ? (
              <>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: background.textColor },
                  ]}
                >
                  Overview
                </Text>

                <View style={styles.statsGrid}>
                  {[
                    { label: 'Games Played', value: stats.gamesPlayed.toString() },
                    { label: 'Games Won', value: stats.gamesWon.toString() },
                    { label: 'Win Rate', value: `${winRate}%` },
                    { label: 'Best Streak', value: (stats.bestStreak ?? 0).toString() },
                  ].map(({ label, value }) => (
                    <View
                      key={label}
                      style={[
                        styles.statsCard,
                        { backgroundColor: background.cardColor, borderColor: background.borderColor },
                      ]}
                    >
                      <Text style={[styles.statsValue, { color: COLORS.accent }]}>{value}</Text>
                      <Text style={[styles.statsLabel, { color: background.secondaryText }]}>{label}</Text>
                    </View>
                  ))}
                </View>

                <Text
                  style={[
                    styles.sectionTitle,
                    { color: background.textColor, marginTop: 24 },
                  ]}
                >
                  Achievements
                </Text>

                <Text
                  style={[
                    styles.achievementsPlaceholder,
                    { color: background.secondaryText },
                  ]}
                >
                  Achievements for Word Search will appear here once implemented.
                </Text>
              </>
            ) : (
              <Text
                style={[
                  styles.achievementsPlaceholder,
                  { color: background.secondaryText },
                ]}
              >
                No stats yet. Play a game to get started!
              </Text>
            )}
          </>
        )}
      </ScrollView>
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
    paddingBottom: 10,
  },
  backButton: { padding: 8 },
  backText: { fontSize: 16, fontWeight: '500' },
  headerPlaceholder: { width: 60 },
  title: { fontSize: 22, fontWeight: 'bold' },
  toggleContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 999,
    padding: 4,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: { fontSize: 14, fontWeight: '500' },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, marginBottom: 12 },
  dailyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countdownLabel: { fontSize: 12, marginBottom: 2 },
  countdownValue: { fontSize: 18, fontWeight: '700' },
  primaryButton: {
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
  dailyNote: { fontSize: 12, marginTop: 10 },
  classicSection: { marginTop: 8 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  classicDescription: { fontSize: 14 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
  },
  statsCard: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 15,
    alignItems: 'center',
  },
  statsValue: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  statsLabel: { fontSize: 12, textAlign: 'center' },
  achievementsPlaceholder: { fontSize: 14, marginTop: 8 },
});

export default WordSearchEntryScreen;
