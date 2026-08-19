// app/index.tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
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
import { FallingLetters } from '../src/shared/FallingLetters';
import { SplashScreen } from '../src/shared/SplashScreen';
import { useTheme } from '../src/shared/ThemeContext';
import { ConfirmModal } from '../src/shared/ConfirmModal';
import { COLORS } from '../src/shared/theme';
import { consumeReminderOptInPending, requestReminderPermission, gameIdForRoute } from '../src/shared/dailyReminders';
import { COLORBLIND_GAME_ACCENTS, GAME_ACCENTS } from '../src/shared/gameColors';
import { refreshDailyRitual, acceptSkipOffer, declineSkipOffer, type DailyRitualSummary } from '../src/shared/dailyRitual';
import { HapticManager } from '../src/shared/HapticManager';
import { ChevronRight, ShieldCheck, X } from 'lucide-react-native';
import FeedbackForm from '../FeedbackForm';
import {
  buildReportMessage,
  clearWordReports,
  loadPendingReports,
  markReportsOffered,
  type WordReport,
} from '../src/shared/wordReports';
import { useCountdownToMidnight } from '../src/wordladder/utils/ladderStorage';

const GAMES = [
  {
    name: 'Wordsmith',
    description: 'Build words from random letters before time runs out',
    route: '/wordbuilder',
    accentColor: GAME_ACCENTS.wordsmith,
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
    accentColor: GAME_ACCENTS.furdle,
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
    accentColor: GAME_ACCENTS.hangman,
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
    accentColor: GAME_ACCENTS.wordgrid,
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
    accentColor: GAME_ACCENTS.wordsearch,
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
    accentColor: GAME_ACCENTS.wordladder,
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
    accentColor: GAME_ACCENTS.hexhive,
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
    accentColor: GAME_ACCENTS.anagrams,
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
  '/wordbuilder': { accentColor: COLORBLIND_GAME_ACCENTS.wordsmith, bgColor: '#FBEAE0', borderColor: '#E8A87C', textColor: '#4A2000', descColor: '#7A3600' }, // vermillion
  '/wordle':      { accentColor: COLORBLIND_GAME_ACCENTS.furdle, bgColor: '#DFF5EE', borderColor: '#66C9AA', textColor: '#00382A', descColor: '#00614A' }, // bluish green
  '/hangman':     { accentColor: COLORBLIND_GAME_ACCENTS.hangman, bgColor: '#FAE9F1', borderColor: '#E3AECB', textColor: '#4A1F35', descColor: '#7A3A5C' }, // reddish purple
  '/wordgrid':    { accentColor: COLORBLIND_GAME_ACCENTS.wordgrid, bgColor: '#DFF0FA', borderColor: '#6FB3DD', textColor: '#002E4A', descColor: '#004E7A' }, // blue
  '/wordsearch':  { accentColor: COLORBLIND_GAME_ACCENTS.wordsearch, bgColor: '#FCF1DC', borderColor: '#F0CA70', textColor: '#4A3200', descColor: '#7A5300' }, // orange
  '/wordladder':  { accentColor: COLORBLIND_GAME_ACCENTS.wordladder, bgColor: '#E7F5FC', borderColor: '#A7D9F2', textColor: '#0B3A52', descColor: '#135E82' }, // sky blue
  '/hexhive':     { accentColor: COLORBLIND_GAME_ACCENTS.hexhive, bgColor: '#FBF7DC', borderColor: '#E8D670', textColor: '#4A4000', descColor: '#7A6900' }, // yellow
  '/anagrams':    { accentColor: COLORBLIND_GAME_ACCENTS.anagrams, bgColor: '#EDEDED', borderColor: '#A8A8A8', textColor: '#1A1A1A', descColor: '#333333' }, // near-black (grayscale is always safe)
};

const COMING_SOON: string[] = ['Crossword'];

export default function Home() {
  const { background, colorBlindMode } = useTheme();
  const [showSplash, setShowSplash] = useState(true);
  const [showReminderOptIn, setShowReminderOptIn] = useState(false);
  const [ritual, setRitual] = useState<DailyRitualSummary | null>(null);
  const [showPerfectDay, setShowPerfectDay] = useState(false);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showSkipOffer, setShowSkipOffer] = useState(false);
  const [skipRelief, setSkipRelief] = useState<string | null>(null);
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

  // Words the games rejected that look like real words. Collected silently
  // during play (see src/shared/wordReports.ts) and surfaced here, at the
  // bottom of the scroll, because src/shared/words.ts is the dictionary for
  // several games at once — a gap belongs to the app, not to one game.
  const [pendingReports, setPendingReports] = useState<WordReport[]>([]);
  const [showWordReport, setShowWordReport] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      loadPendingReports().then(({ reports, shouldOffer }) => {
        if (cancelled) return;
        setPendingReports(shouldOffer ? reports : []);
      });
      return () => {
        cancelled = true;
      };
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
          // A live offer takes priority over the intro — it's time-sensitive
          // and the player is mid-decision about a streak they care about.
          if (summary.pendingSkipOffer) {
            setShowSkipOffer(true);
          } else if (summary.shouldShowSkipIntro) {
            setShowSkipIntro(true);
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
            /* Tapping the card opens the cross-game history screen. The card
               deliberately gains no row and no height for this -- the games are
               the point of the home screen, so the affordance is a chevron
               inside the card's existing padding and nothing more. */
            <Pressable
              onPress={() => router.push('/fury')}
              style={({ pressed }) => [
                styles.todayCard,
                { backgroundColor: background.cardColor, borderColor: background.borderColor },
                pressed && { opacity: 0.85 },
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
                    {/* Skips are a CROSS-GAME resource, so they're shown on the
                        cross-game surface and nowhere else. A count on an
                        individual game's menu would read as "this game has a
                        skip", which is the wrong model. */}
                    {ritual.skipsAvailable > 0 && (
                      <View style={styles.todaySkipBadge}>
                        <ShieldCheck size={15} color={background.secondaryText} />
                        <Text style={[styles.todaySkipCount, { color: background.secondaryText }]}>
                          {ritual.skipsAvailable}
                        </Text>
                      </View>
                    )}
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

              <Text
                style={[
                  styles.todayReset,
                  { color: ritual.streakAtRiskToday ? '#F97316' : background.secondaryText },
                ]}
              >
                {ritual.isPerfectDay
                  ? 'Perfect Day — all 8 cleared'
                  : ritual.streakAtRiskToday
                  ? `Play one daily to keep your ${ritual.streak}-day streak`
                  : `Resets in ${resetsIn}`}
              </Text>

              {/* Absolutely positioned so it costs no layout height: it sits in
                  the padding the card already had. */}
              <View style={styles.todayChevron} pointerEvents="none">
                <ChevronRight size={18} color={background.secondaryText} />
              </View>
            </Pressable>
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

          {/* ── MISSING WORD REPORT ───────────────────────────────────────────
              Last thing in the scroll, so it costs nothing above the fold and
              the game grid never moves. Only appears when there is something
              worth sending, and at most once a day. Nothing interrupts play:
              a rejected word behaves exactly as it always has. */}
          {pendingReports.length > 0 && (
            <View style={[styles.wordReportRow, { borderColor: background.borderColor }]}>
              <Pressable
                style={styles.wordReportMain}
                onPress={() => setShowWordReport(true)}
              >
                <Text style={[styles.wordReportText, { color: background.secondaryText }]}>
                  {pendingReports.length === 1
                    ? '1 word you tried wasn\'t in our dictionary'
                    : `${pendingReports.length} words you tried weren't in our dictionary`}
                </Text>
                <Text style={[styles.wordReportAction, { color: background.textColor }]}>
                  Report
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  // Dismissing counts as having been asked, so it doesn't come
                  // straight back tomorrow morning.
                  setPendingReports([]);
                  markReportsOffered().catch(() => {});
                }}
                hitSlop={10}
                style={styles.wordReportDismiss}
              >
                <X size={16} color={background.secondaryText} />
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Prefilled with the collected words, so one tap produces a
          ready-to-send report rather than a blank box and a memory test. */}
      <FeedbackForm
        visible={showWordReport}
        initialCategory="other"
        initialMessage={buildReportMessage(pendingReports)}
        onSent={() => {
          setPendingReports([]);
          clearWordReports().catch(() => {});
        }}
        onClose={() => {
          setShowWordReport(false);
          markReportsOffered().catch(() => {});
        }}
      />

      {/* ── STREAK SKIP OFFER ────────────────────────────────────────────────
          Shown on returning home after playing on the comeback day. Never
          auto-spent, never spent without asking: a missed day isn't resolved
          at midnight, it's resolved when the player next opens the app, so the
          choice can be offered retroactively when they can see what's at
          stake. Declining is free and keeps the skip banked. */}
      <ConfirmModal
        visible={showSkipOffer && !!ritual?.pendingSkipOffer}
        title="Missed a day"
        message={
          ritual?.pendingSkipOffer
            ? `You didn't play yesterday. Use a Streak Skip to keep your ${ritual.pendingSkipOffer.streakAtRisk}-day streak going?`
            : ''
        }
        cancelText="Let it reset"
        confirmText={`Use skip — ${Math.max(0, (ritual?.skipsAvailable ?? 1) - 1)} left`}
        onCancel={() => {
          setShowSkipOffer(false);
          declineSkipOffer()
            .then(() => refreshDailyRitual())
            .then(setRitual)
            .catch(() => {});
        }}
        onConfirm={() => {
          const saved = ritual?.pendingSkipOffer?.streakAtRisk ?? 0;
          const gamesSaved = ritual
            ? Object.values(ritual.completion).filter(Boolean).length
            : 0;
          setShowSkipOffer(false);
          acceptSkipOffer()
            .then(() => refreshDailyRitual())
            .then((updated) => {
              setRitual(updated);
              // Name what was rescued — an abstract counter becomes something
              // concrete, and this is the screen that teaches the value of the
              // next skip.
              setSkipRelief(
                `Your ${saved}-day Fury Streak is safe` +
                  (gamesSaved > 0
                    ? `, along with ${gamesSaved} game streak${gamesSaved === 1 ? '' : 's'}.`
                    : '.')
              );
              HapticManager.achievement();
            })
            .catch(() => {});
        }}
        backgroundColor={background.cardColor}
        textColor={background.textColor}
        secondaryText={background.secondaryText}
        borderColor={background.borderColor}
        destructiveColor={COLORS.accent}
      />

      {/* The relief — shown immediately after a skip is spent. */}
      <ConfirmModal
        visible={!!skipRelief}
        title="Skip used"
        message={skipRelief ?? ''}
        confirmText="Good"
        hideCancel
        onCancel={() => setSkipRelief(null)}
        onConfirm={() => setSkipRelief(null)}
        backgroundColor={background.cardColor}
        textColor={background.textColor}
        secondaryText={background.secondaryText}
        borderColor={background.borderColor}
        destructiveColor={COLORS.accent}
      />

      {/* One-time explainer, shown at the moment the first skip is banked —
          players learn the feature by receiving it, not from onboarding. */}
      <ConfirmModal
        visible={showSkipIntro}
        title="Streak Skip earned"
        message="You've banked a Streak Skip. It covers one missed day and keeps every streak alive — you'll be asked before it's ever used."
        confirmText="Got it"
        hideCancel
        onCancel={() => setShowSkipIntro(false)}
        onConfirm={() => setShowSkipIntro(false)}
        backgroundColor={background.cardColor}
        textColor={background.textColor}
        secondaryText={background.secondaryText}
        borderColor={background.borderColor}
        destructiveColor={COLORS.accent}
      />

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
  todaySkipBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, marginRight: 8 },
  todaySkipCount: { fontSize: 13, fontWeight: '800' },
  todaySegments: { flexDirection: 'row', gap: 4, marginTop: 12 },
  todaySegment: { flex: 1, height: 6, borderRadius: 3 },
  todayReset: { fontSize: 11, fontWeight: '600', marginTop: 8, textAlign: 'center' },
  // Vertically centred against the reset line, inside todayCard's existing
  // 16px horizontal padding -- adds no height to the card or the screen.
  todayChevron: { position: 'absolute', right: 8, bottom: 12 },
  wordReportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.9,
  },
  wordReportMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordReportText: { fontSize: 11.5, flexShrink: 1 },
  wordReportAction: { fontSize: 11.5, fontWeight: '800', textDecorationLine: 'underline' },
  wordReportDismiss: { paddingLeft: 8 },

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
