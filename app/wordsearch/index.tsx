// app/wordsearch/index.tsx

import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
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

const { width } = Dimensions.get('window');

type Tab = 'play' | 'stats';
const TABS: Tab[] = ['play', 'stats'];

const WordSearchEntryScreen: React.FC = () => {
  const { background } = useTheme();

  const [activeTab, setActiveTab] = useState<Tab>('play');
  const tabAnim = useRef(new Animated.Value(0)).current;
  const currentTabIdxRef = useRef(0);
  const dragBase = useRef(0);

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

  useEffect(() => {
    currentTabIdxRef.current = TABS.indexOf(activeTab);
  }, [activeTab]);

  const handleTabPress = (tab: Tab) => {
    const idx = TABS.indexOf(tab);
    setActiveTab(tab);
    Animated.spring(tabAnim, {
      toValue: idx,
      useNativeDriver: true,
      tension: 70,
      friction: 12,
    }).start();
  };

  const panResponder = useRef(
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
        tabAnim.setValue(Math.max(0, Math.min(TABS.length - 1, raw)));
      },
      onPanResponderRelease: (_, gs) => {
        const base = dragBase.current;
        let newIdx = Math.round(base);
        if (gs.dx < -25 || gs.vx < -0.3) newIdx = Math.min(Math.floor(base) + 1, TABS.length - 1);
        else if (gs.dx > 25 || gs.vx > 0.3) newIdx = Math.max(Math.ceil(base) - 1, 0);
        currentTabIdxRef.current = newIdx;
        setActiveTab(TABS[newIdx]);
        Animated.spring(tabAnim, {
          toValue: newIdx,
          useNativeDriver: true,
          tension: 70,
          friction: 12,
        }).start();
      },
    })
  ).current;

  const winRate = stats ? getWinRate(stats) : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: background.backgroundColor }]}>
      <StatusBar barStyle={background.statusBar === 'light' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backText, { color: background.secondaryText }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: background.textColor }]}>Word Search</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Segment switcher */}
      <View style={[styles.segmentSwitcher, { backgroundColor: background.cardColor }]}>
        {TABS.map((tab) => {
          const isActive = tab === activeTab;
          const label = tab === 'play' ? 'Play' : 'Stats';
          return (
            <Pressable
              key={tab}
              style={[styles.segmentButton, isActive && { backgroundColor: background.backgroundColor }]}
              onPress={() => handleTabPress(tab)}
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

      {/* Swipable tab strip */}
      <View style={styles.tabStripWrapper} {...panResponder.panHandlers}>
        <Animated.View style={[styles.tabStrip, {
          transform: [{
            translateX: tabAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -width],
            }),
          }],
        }]}>

          {/* ── PLAY TAB ── */}
          <ScrollView
            style={{ width }}
            contentContainerStyle={styles.tabContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Daily Challenge Card */}
            <View style={[styles.dailyCard, {
              backgroundColor: background.cardColor,
              borderColor: dailyPlayed ? COLORS.accent : background.borderColor,
            }]}>
              <Text style={[styles.dailyCardTitle, { color: background.textColor }]}>Daily Challenge</Text>
              <Text style={[styles.dailyCardDate, { color: background.secondaryText }]}>{formatDisplayDate()}</Text>
              <Text style={[styles.dailyCardDesc, { color: background.secondaryText }]}>
                Find themed words hidden in today's grid.
              </Text>

              <TouchableOpacity
                style={[styles.playButton, { backgroundColor: COLORS.accent }]}
                onPress={() => router.push('/wordsearch/daily')}
                disabled={dailyPlayed === null}
              >
                <Text style={styles.playButtonText}>
                  {dailyPlayed ? 'View Today\'s Results' : 'Play Daily Challenge'}
                </Text>
              </TouchableOpacity>

              {dailyPlayed && (
                <View style={[styles.countdownRow, { borderTopColor: background.borderColor }]}>
                  <Text style={[styles.countdownLabel, { color: background.secondaryText }]}>Next daily in</Text>
                  <Text style={[styles.countdownValue, { color: COLORS.accent }]}>{countdown || '—'}</Text>
                </View>
              )}
            </View>

            {/* Classic Game Card */}
            <TouchableOpacity
              style={[styles.gameModeCard, { backgroundColor: background.cardColor, borderColor: background.borderColor }]}
              onPress={() => router.push('/wordsearch/play')}
              activeOpacity={0.8}
            >
              <Text style={[styles.gameModeTitle, { color: background.textColor }]}>Classic Game</Text>
              <Text style={[styles.gameModeDesc, { color: background.secondaryText }]}>
                Choose a category and difficulty, then find all hidden words
              </Text>
            </TouchableOpacity>

            {/* How to Play */}
            <View style={[styles.rulesCard, { backgroundColor: background.cardColor, borderColor: background.borderColor }]}>
              <Text style={[styles.rulesTitle, { color: background.textColor }]}>How to Play</Text>
              {[
                'Drag your finger across letters in the grid',
                'Words can go in any direction — even diagonal',
                'Found words are highlighted and crossed off the list',
                'Find all words to complete the puzzle',
              ].map((rule, i) => (
                <View key={i} style={styles.ruleRow}>
                  <Text style={[styles.ruleNum, { color: COLORS.accent }]}>{i + 1}</Text>
                  <Text style={[styles.ruleText, { color: background.secondaryText }]}>{rule}</Text>
                </View>
              ))}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>

          {/* ── STATS TAB ── */}
          <ScrollView
            style={{ width }}
            contentContainerStyle={styles.tabContent}
            showsVerticalScrollIndicator={false}
          >
            {loadingStats ? (
              <ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} />
            ) : stats && stats.gamesPlayed > 0 ? (
              <>
                <Text style={[styles.sectionTitle, { color: background.textColor }]}>Overview</Text>
                <View style={styles.statsGrid}>
                  {[
                    { label: 'Games Played', value: stats.gamesPlayed.toString() },
                    { label: 'Games Won', value: stats.gamesWon.toString() },
                    { label: 'Win Rate', value: `${winRate}%` },
                    { label: 'Best Streak', value: (stats.bestStreak ?? 0).toString() },
                  ].map(({ label, value }) => (
                    <View key={label} style={[styles.statsCard, {
                      backgroundColor: background.cardColor,
                      borderColor: background.borderColor,
                    }]}>
                      <Text style={[styles.statsValue, { color: background.textColor }]}>{value}</Text>
                      <Text style={[styles.statsLabel, { color: background.secondaryText }]}>{label}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ height: 40 }} />
              </>
            ) : (
              <Text style={[styles.emptyText, { color: background.secondaryText }]}>
                No stats yet. Play a game to get started!
              </Text>
            )}
          </ScrollView>

        </Animated.View>
      </View>
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

  segmentSwitcher: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 999,
    padding: 4,
  },
  segmentButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 999,
  },
  segmentButtonText: { fontSize: 14, fontWeight: '500' },

  tabStripWrapper: { flex: 1, overflow: 'hidden', alignItems: 'flex-start' },
  tabStrip: { width: width * 2, flexDirection: 'row' },
  tabContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },

  // Daily card
  dailyCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    marginBottom: 16,
  },
  dailyCardTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 2 },
  dailyCardDate: { fontSize: 14, marginBottom: 8 },
  dailyCardDesc: { fontSize: 14, marginBottom: 16 },
  playButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 0,
  },
  playButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  countdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  countdownLabel: { fontSize: 13 },
  countdownValue: { fontSize: 16, fontWeight: '700' },

  // Game mode card (matches Hangman)
  gameModeCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    marginBottom: 16,
  },
  gameModeTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  gameModeDesc: { fontSize: 14 },

  // Rules card (matches Hangman)
  rulesCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  rulesTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  ruleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  ruleNum: { fontSize: 18, fontWeight: 'bold', width: 28 },
  ruleText: { fontSize: 14, flex: 1 },

  // Stats
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
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
  emptyText: { fontSize: 14, marginTop: 8 },
});

export default WordSearchEntryScreen;
