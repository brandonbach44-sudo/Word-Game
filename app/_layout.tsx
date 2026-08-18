import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/shared/ThemeContext';
import { syncDailyReminder } from '../src/shared/dailyReminders';

// Pre-warm the large shared word list (~35k entries, 33k-line file) at app
// startup. Without this, the first navigation to Word Ladder or Anagrams
// triggers construction of a 35k-entry Set synchronously on the JS thread
// during the navigation animation, causing a SIGSEGV crash on iOS.
// Importing here forces Metro to evaluate words.ts before any screen is shown.
import '../src/shared/words';
// Pre-warm the Word Ladder graph caches (pattern map + neighbor index) so
// they are already built the first time a player navigates to Word Ladder.
// Without this, getConnectedPool builds the graph lazily on first use, which
// can run during a navigation animation and cause a SIGSEGV on iOS.
import { getConnectedPool } from '../src/wordladder/utils/wordGraph';

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

    // Pre-warm Word Ladder graph caches 2 seconds after the home screen
    // appears, while the user is reading the menu. By the time they tap
    // Word Ladder, getConnectedPool is already computed and cached so the
    // BFS puzzle generation doesn't run cold on the JS thread.
    const warmTimer = setTimeout(() => {
      getConnectedPool(4); // easy  (4-letter words)
      getConnectedPool(5); // medium (5-letter words, daily)
      getConnectedPool(6); // hard  (6-letter words)
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
        <Stack screenOptions={{ headerShown: false, fullScreenGestureEnabled: true }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="settings" />
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
