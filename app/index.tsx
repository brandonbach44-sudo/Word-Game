// app/index.tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FallingLetters } from '../src/shared/FallingLetters';
import { SplashScreen } from '../src/shared/SplashScreen';
import { useTheme } from '../src/shared/ThemeContext';
import { ConfirmModal } from '../src/shared/ConfirmModal';
import { COLORS } from '../src/shared/theme';
import { consumeReminderOptInPending, requestReminderPermission, gameIdForRoute } from '../src/shared/dailyReminders';
import { refreshDailyRitual, type DailyRitualSummary } from '../src/shared/dailyRitual';
import { HapticManager } from '../src/shared/HapticManager';
import { useCountdownToMidnight } from '../src/wordladder/utils/ladderStorage';

const GAMES = [
  {
    name: 'Wordsmith',
    description: 'Build words from random letters before time runs out',
    route: '/wordbuilder',
    accentColor: '#7F77DD',
    bgColor: '#EEEDFE',
    borderColor: '#AFA9EC',
    textColor: '#3C3489',
    descColor: '#534AB7',
    icon: 'hammer-outline' as const,
  },
  {
    name: 'Furdle',
    description: 'Guess the 5-letter word in 6 tries',
    route: '/wordle',
    accentColor: '#1D9E75',
    bgColor: '#E1F5EE',
    borderColor: '#5DCAA5',
    textColor: '#085041',
    descColor: '#0F6E56',
    icon: 'grid-outline' as const,
  },
  {
    name: 'Hangman',
    description: 'Guess the word before running out of attempts',
    route: '/hangman',
    accentColor: '#D85A30',
    bgColor: '#FAECE7',
    borderColor: '#F0997B',
    textColor: '#4A1B0C',
    descColor: '#993C1D',
    icon: 'skull-outline' as const,
  },
  {
    name: 'Word Grid',
    description: 'Swipe to connect letters and find hidden words',
    route: '/wordgrid',
    accentColor: '#378ADD',
    bgColor: '#E6F1FB',
    borderColor: '#85B7EB',
    textColor: '#0C447C',
    descColor: '#185FA5',
    icon: 'flash-outline' as const,
  },
  {
    name: 'Word Search',
    description: 'Find themed words hidden in a letter grid',
    route: '/wordsearch',
    accentColor: '#BA7517',
    bgColor: '#FAEEDA',
    borderColor: '#EF9F27',
    textColor: '#412402',
    descColor: '#854F0B',
    icon: 'search-outline' as const,
  },
  {
    name: 'Word Ladder',
    description: 'Change one letter at a time to reach the target word',
    route: '/wordladder',
    accentColor: '#7A8B4E',
    bgColor: '#EEF2E3',
    borderColor: '#A9BC7C',
    textColor: '#33401C',
    descColor: '#556B2F',
    icon: 'ladder' as const,
    iconSet: 'material' as const,
  },
  {
    name: 'Hex Hive',
    description: 'Find words using the hexagon letters — every word needs the center letter',
    route: '/hexhive',
    accentColor: '#D4A017',
    bgColor: '#FBF1DA',
    borderColor: '#E8C468',
    textColor: '#4A3600',
    descColor: '#8A6D0E',
    icon: 'hexagon-multiple-outline' as const,
    iconSet: 'material' as const,
  },
  {
    name: 'Anagrams',
    description: 'Unscramble 5 words, easiest to hardest',
    route: '/anagrams',
    accentColor: '#C0392B',
    bgColor: '#FBE7E4',
    borderColor: '#E8938A',
    textColor: '#5C1810',
    descColor: '#96382B',
    icon: 'shuffle-outline' as const,
  },
];

// Colorblind-safe replacement for the 8 tile colors above, keyed by route so
// it stays aligned with GAMES even if the array is reordered. Built from the
// Okabe-Ito / Wong palette — the standard qualitative palette designed
// specifically for this exact problem (up to 8 categories that all need to
// stay visually distinct for every common form of color vision deficiency),
// rather than reusing the original hand-picked brand hues which weren't
// chosen with that constraint in mind.
const COLORBLIND_GAME_COLORS: Record<string, { accentColor: string; bgColor: string; borderColor: string; textColor: string; descColor: string }> = {
  '/wordbuilder': { accentColor: '#D55E00', bgColor: '#FBEAE0', borderColor: '#E8A87C', textColor: '#4A2000', descColor: '#7A3600' }, // vermillion
  '/wordle':      { accentColor: '#009E73', bgColor: '#DFF5EE', borderColor: '#66C9AA', textColor: '#00382A', descColor: '#00614A' }, // bluish green
  '/hangman':     { accentColor: '#CC79A7', bgColor: '#FAE9F1', borderColor: '#E3AECB', textColor: '#4A1F35', descColor: '#7A3A5C' }, // reddish purple
  '/wordgrid':    { accentColor: '#0072B2', bgColor: '#DFF0FA', borderColor: '#6FB3DD', textColor: '#002E4A', descColor: '#004E7A' }, // blue
  '/wordsearch':  { accentColor: '#E69F00', bgColor: '#FCF1DC', borderColor: '#F0CA70', textColor: '#4A3200', descColor: '#7A5300' }, // orange
  '/wordladder':  { accentColor: '#56B4E9', bgColor: '#E7F5FC', borderColor: '#A7D9F2', textColor: '#0B3A52', descColor: '#135E82' }, // sky blue
  '/hexhive':     { accentColor: '#E1C200', bgColor: '#FBF7DC', borderColor: '#E8D670', textColor: '#4A4000', descColor: '#7A6900' }, // yellow
  '/anagrams':    { accentColor: '#3A3A3A', bgColor: '#EDEDED', borderColor: '#A8A8A8', textColor: '#1A1A1A', descColor: '#333333' }, // near-black (grayscale is always safe)
};

const COMING_SOON: string[] = ['Crossword'];

export default function Home() {
  const { background, colorBlindMode } = useTheme();
  const [showSplash, setShowSplash] = useState(true);
  const [showReminderOptIn, setShowReminderOptIn] = useState(false);
  const [ritual, setRitual] = useState<DailyRitualSummary | null>(null);
  const [showPerfectDay, setShowPerfectDay] = useState(false);
  const resetsIn = useCountdownToMidnight();

  // Checked every time the player lands back on the home screen — this is
  // the natural, unhurried moment after a win, not mid-game. The flag can
  // only ever be true once per install (see maybeFlagReminderOptIn), so
  // this prompt shows at most one time, ever.
  useFocusEffect(
    useCallback(() => {
      consumeReminderOptInPending().then((pending) => {
        if (pending) setShowReminderOptIn(true);
      });
    }, [])
  );

  // Recompute the cross-game ritual every time the player lands back home —
  // which is exactly when they've just finished a daily. refreshDailyRitual
  // only writes when something actually changed, so this is safe to call on
  // every focus.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      refreshDailyRitual()
        .then((summary) => {
          if (cancelled) return;
          setRitual(summary);
          // The Perfect Day celebration fires here rather than inside whichever
          // game happened to be the eighth — it lands at the natural end of a
          // session, and it means none of the eight game screens need to know
          // this feature exists.
          if (summary.shouldCelebratePerfectDay) {
            setShowPerfectDay(true);
            HapticManager.achievement();
          }
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, [])
  );

  return (
    <View style={[styles.root, { backgroundColor: background.backgroundColor }]}>
      <FallingLetters />
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle={background.statusBar === 'dark' ? 'dark-content' : 'light-content'}
        />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerPlaceholder} />
          <Text style={[styles.title, { color: background.textColor }]}>
            Word Fury
          </Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={22} color={background.textColor} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.gamesContainer}>
          {/* ── TODAY CARD ──────────────────────────────────────────────────────
              The fraction is the headline, not the streak: "how many are left
              today" is the question a returning player actually has, and seeing
              5/8 at 9pm reads as an invitation rather than a scolding. The eight
              segments make what's left glanceable without counting. */}
          {ritual && (
            <View
              style={[
                styles.todayCard,
                { backgroundColor: background.cardColor, borderColor: background.borderColor },
              ]}
            >
              <View style={styles.todayTopRow}>
                <View style={styles.todayFractionWrap}>
                  <Text style={[styles.todayFraction, { color: background.textColor }]}>
                    {ritual.completedCount}
                    <Text style={[styles.todayFractionTotal, { color: background.secondaryText }]}>
                      /{ritual.totalCount}
                    </Text>
                  </Text>
                  <Text style={[styles.todayLabel, { color: background.secondaryText }]}>
                    Dailies today
                  </Text>
                </View>

                <View style={styles.todayStreakWrap}>
                  <View style={styles.todayStreakRow}>
                    <Ionicons name="flame" size={18} color={ritual.streak > 0 ? '#F97316' : background.secondaryText} />
                    <Text style={[styles.todayStreakValue, { color: background.textColor }]}>
                      {ritual.streak}
                    </Text>
                  </View>
                  <Text style={[styles.todayLabel, { color: background.secondaryText }]}>
                    Fury Streak
                  </Text>
                </View>
              </View>

              {/* One segment per game, lit as each daily is cleared. */}
              <View style={styles.todaySegments}>
                {GAMES.map((game) => {
                  const id = gameIdForRoute(game.route);
                  const done = id ? ritual.completion[id] : false;
                  const colors = colorBlindMode ? COLORBLIND_GAME_COLORS[game.route] ?? game : game;
                  return (
                    <View
                      key={game.route}
                      style={[
                        styles.todaySegment,
                        {
                          backgroundColor: done ? colors.accentColor : background.borderColor,
                          opacity: done ? 1 : 0.35,
                        },
                      ]}
                    />
                  );
                })}
              </View>

              <Text style={[styles.todayReset, { color: background.secondaryText }]}>
                {ritual.isPerfectDay ? 'Perfect Day — all 8 cleared' : `Resets in ${resetsIn}`}
              </Text>
            </View>
          )}

          <View style={styles.grid}>
            {GAMES.map((game, index) => {
              const isLastOdd = GAMES.length % 2 !== 0 && index === GAMES.length - 1;
              const colors = colorBlindMode ? COLORBLIND_GAME_COLORS[game.route] ?? game : game;
              // Today's daily done? The Today card says HOW MANY are left; this
              // badge says WHICH ones, at the moment the player is choosing
              // where to tap. Deliberately a quiet badge rather than a grey-out
              // — a finished game must stay inviting, since practice modes and
              // stats are still in there.
              const gameId = gameIdForRoute(game.route);
              const dailyDone = !!(ritual && gameId && ritual.completion[gameId]);
              return (
                <TouchableOpacity
                  key={game.name}
                  style={[
                    styles.tile,
                    {
                      backgroundColor: colors.bgColor,
                      borderColor: colors.borderColor,
                      width: isLastOdd ? '100%' : '48.5%',
                    },
                  ]}
                  activeOpacity={0.75}
                  onPress={() => router.push(game.route as any)}
                >
                  {/* Color accent bar */}
                  <View style={[styles.accentBar, { backgroundColor: colors.accentColor }]} />

                  {dailyDone && (
                    <View style={[styles.tileCheck, { backgroundColor: colors.accentColor }]}>
                      <Ionicons name="checkmark" size={13} color="#fff" />
                    </View>
                  )}

                  <View style={styles.tileBody}>
                    {/* Icon */}
                    <View style={[styles.iconWrap, { backgroundColor: colors.accentColor + '22' }]}>
                      {'iconSet' in game && game.iconSet === 'material' ? (
                        <MaterialCommunityIcons name={game.icon as any} size={18} color={colors.accentColor} />
                      ) : (
                        <Ionicons name={game.icon as any} size={18} color={colors.accentColor} />
                      )}
                    </View>

                    <Text style={[styles.gameName, { color: colors.textColor }]}>
                      {game.name}
                    </Text>
                    <Text style={[styles.gameDesc, { color: colors.descColor }]}>
                      {game.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Coming Soon */}
          {COMING_SOON.length > 0 && (
            <>
              <Text style={[styles.comingSoonLabel, { color: background.secondaryText }]}>
                Coming soon
              </Text>
              <View style={styles.chipsRow}>
                {COMING_SOON.map((name) => (
                  <View
                    key={name}
                    style={[styles.chip, { borderColor: background.borderColor }]}
                  >
                    <Text style={[styles.chipText, { color: background.secondaryText }]}>
                      {name}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Perfect Day — fires once per day, guarded by lastPerfectDateISO in the
          ritual store. Shown here rather than inside whichever game happened to
          be the eighth, so none of the eight game screens need to know this
          feature exists. */}
      <ConfirmModal
        visible={showPerfectDay}
        title="Perfect Day"
        message={
          ritual
            ? `All 8 dailies cleared. That's ${ritual.perfectDays} perfect ${
                ritual.perfectDays === 1 ? 'day' : 'days'
              } — and a ${ritual.streak}-day Fury Streak.`
            : 'All 8 dailies cleared.'
        }
        confirmText="Nice"
        hideCancel
        onCancel={() => setShowPerfectDay(false)}
        onConfirm={() => setShowPerfectDay(false)}
        backgroundColor={background.cardColor}
        textColor={background.textColor}
        secondaryText={background.secondaryText}
        borderColor={background.borderColor}
        destructiveColor={COLORS.accent}
      />

      <ConfirmModal
        visible={showReminderOptIn}
        title="Keep your streak alive"
        message="Get a gentle nudge in the evening if you've got an unplayed daily challenge, so your streak never resets by accident."
        cancelText="Not Now"
        confirmText="Enable"
        onCancel={() => setShowReminderOptIn(false)}
        onConfirm={() => {
          setShowReminderOptIn(false);
          requestReminderPermission();
        }}
        backgroundColor={background.cardColor}
        textColor={background.textColor}
        secondaryText={background.secondaryText}
        borderColor={background.borderColor}
        destructiveColor={COLORS.accent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },
  headerPlaceholder: {
    width: 38,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  settingsButton: {
    padding: 8,
  },
  // ── Today card (cross-game daily ritual) ──────────────────────────────────
  todayCard: {
    // No horizontal margin: gamesContainer already pads 16px, so this keeps the
    // card's edges flush with the tile grid below it.
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  todayTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  todayFractionWrap: { alignItems: 'flex-start' },
  todayFraction: { fontSize: 30, fontWeight: '900', lineHeight: 34 },
  todayFractionTotal: { fontSize: 18, fontWeight: '800' },
  todayLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginTop: 2 },
  todayStreakWrap: { alignItems: 'flex-end' },
  todayStreakRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  todayStreakValue: { fontSize: 22, fontWeight: '900' },
  todaySegments: { flexDirection: 'row', gap: 4, marginTop: 12 },
  todaySegment: { flex: 1, height: 6, borderRadius: 3 },
  todayReset: { fontSize: 11, fontWeight: '600', marginTop: 8, textAlign: 'center' },

  // ── Tile completion badge ─────────────────────────────────────────────────
  tileCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  scrollView: {
    flex: 1,
  },
  gamesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  tile: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 0,
  },
  accentBar: {
    height: 5,
    width: '100%',
  },
  tileBody: {
    padding: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gameName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  gameDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  comingSoonLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    opacity: 0.6,
  },
  chipText: {
    fontSize: 12,
  },
});
