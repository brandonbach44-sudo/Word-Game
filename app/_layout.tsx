import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/shared/ThemeContext';
import { syncDailyReminder } from '../src/shared/dailyReminders';
import { HapticManager } from '../src/shared/HapticManager';

// Pre-warm the large shared word list (~41k entries) at app startup. Without
// this, the first navigation to Word Ladder or Anagrams triggers construction
// of the Set synchronously on the JS thread during the navigation animation,
// causing a SIGSEGV crash on iOS. Importing here forces Metro to evaluate
// words.ts before any screen is shown.
import '../src/shared/words';
// Pre-warm the Word Ladder length buckets so the pattern map / neighbor index
// isn't built cold the first time a player opens Word Ladder.
import { getWordsOfLength, getNeighbors } from '../src/wordladder/utils/wordGraph';

// Sends the player straight into the game a reminder notification was
// about, instead of dropping them at the home grid to go find it — pulled
// out so both the cold-start check and the live listener below can share it.
function routeFromNotification(notification: Notifications.Notification | undefined) {
  const route = notification?.request.content.data?.route;
  if (typeof route === 'string') {
    router.push(route as any);
  }
}

// Called once at module load — this just tells iOS how to present a
// notification if it arrives while the app happens to already be open
// (banner + sound, no badge). It doesn't schedule anything by itself.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    // Recompute today's reminder on cold start, and every time the app
    // comes back to the foreground — daily state (which games are still
    // unplayed) can only have changed while we were away.
    syncDailyReminder();

    // Load the saved haptics preference once, at startup. This used to run
    // only inside Wordsmith, so a player who never opened Wordsmith never had
    // their preference applied in any other game.
    HapticManager.init();

    // Pre-warm Word Ladder word buckets 2 seconds after the home screen
    // appears, while the player is still reading the menu. Wrapped in
    // try/catch so a pre-warm failure can never take down app launch —
    // this is a pure optimization, not required for correctness.
    const warmTimer = setTimeout(() => {
      try {
        // Build BOTH the length buckets and the wildcard pattern map for each
        // Word Ladder length. Calling getNeighbors on any word of a length is
        // what forces that length's pattern map to be built and cached, which
        // is the expensive part of puzzle generation. Doing it here — while the
        // player is still reading the home menu — means tapping into a game
        // generates its puzzle instantly, with no loading spinner.
        for (const len of [4, 5, 6]) {
          const words = getWordsOfLength(len);
          if (words.length > 0) getNeighbors(words[0]);
        }
      } catch {
        // Ignore — the games build these lazily on demand anyway.
      }
    }, 2000);

    // App was launched by tapping a reminder notification (was fully
    // killed, not just backgrounded) — route in once navigation is ready.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      routeFromNotification(response?.notification);
    });

    // App was already running (foreground or background) when the
    // notification was tapped.
    const tapSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      routeFromNotification(response.notification);
    });

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        syncDailyReminder();
      }
      appState.current = nextState;
    });

    return () => {
      clearTimeout(warmTimer);
      tapSubscription.remove();
      appStateSubscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar style="auto" />
        {/* fullScreenGestureEnabled is deliberately OFF. It made swipe-back work from
            anywhere on screen, but the native recognizer wins against the JS
            PanResponders that drive every game's Play/Stats/Customize tab strip --
            so tabs could not be swiped to at all, and a right-swipe inside Stats
            exited the game instead of stepping back one tab. Swipe-back still works
            from the left edge, and each game menu now pops back on a right-swipe
            from its first tab, which keeps the whole path linear. */}
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="fury" />
          <Stack.Screen name="wordbuilder" />
          <Stack.Screen name="wordle/index" />
          <Stack.Screen name="hangman/index" />
          <Stack.Screen name="wordgrid" />
          <Stack.Screen name="hexhive" />
          <Stack.Screen name="anagrams/index" />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
