// src/shared/GameIntro.tsx
//
// A three-card, first-open introduction for the games whose rules aren't
// obvious from looking at them.
//
// ── Why this and not a guided tutorial ──────────────────────────────────────
// An interactive tutorial that walks your finger through a fake puzzle is
// expensive to build, has to be maintained alongside the real game, and gets
// skipped by most of the people it was built for. What actually teaches a word
// game in ten seconds is a SOLVED EXAMPLE: seeing COLD → CORD → CORE → CARE
// with the changed letter lit up explains "change one letter each step" better
// than the sentence does, and asks nothing of the player.
//
// ── Why it exists now ───────────────────────────────────────────────────────
// The Perfect Day system actively walks players into all eight games, including
// the two with the least self-evident rules. The ritual was therefore sending
// people into the games most likely to confuse them, with nothing but a bullet
// list waiting for them.
//
// ── Rules it follows ────────────────────────────────────────────────────────
// Skippable from the first card, never shown twice, and always reopenable from
// the game's own How to Play card. Anything that can't be dismissed in one tap
// is an obstacle between someone and the game they opened.

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from './ThemeContext';
import type { GameId } from './dailyReminders';

const INTRO_SEEN_KEY = 'wordfury_intro_seen_v1';

type SeenMap = Partial<Record<GameId, boolean>>;

async function loadSeen(): Promise<SeenMap> {
  try {
    const raw = await AsyncStorage.getItem(INTRO_SEEN_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Whether this game's intro still needs showing. Fails CLOSED on a storage
 * error — if we can't tell, we don't show it. Repeatedly greeting a returning
 * player with a tutorial is worse than a new player missing one.
 */
export async function shouldShowIntro(gameId: GameId): Promise<boolean> {
  try {
    const seen = await loadSeen();
    return !seen[gameId];
  } catch {
    return false;
  }
}

export async function markIntroSeen(gameId: GameId): Promise<void> {
  try {
    const seen = await loadSeen();
    await AsyncStorage.setItem(INTRO_SEEN_KEY, JSON.stringify({ ...seen, [gameId]: true }));
  } catch (e) {
    console.warn('markIntroSeen error', e);
  }
}

export interface IntroCard {
  heading: string;
  body: string;
  /** Optional illustration — see introVisuals.tsx. */
  visual?: React.ReactNode;
}

interface GameIntroProps {
  visible: boolean;
  cards: IntroCard[];
  accentColor: string;
  /** Called on finish OR skip; the caller marks it seen either way. */
  onClose: () => void;
}

export default function GameIntro({ visible, cards, accentColor, onClose }: GameIntroProps) {
  const { background } = useTheme();
  const [index, setIndex] = useState(0);

  const isLast = index === cards.length - 1;
  const card = cards[index];

  const close = () => {
    setIndex(0);
    onClose();
  };

  if (!card) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            { backgroundColor: background.cardColor, borderColor: background.borderColor },
          ]}
        >
          <Text style={[styles.heading, { color: background.textColor }]}>{card.heading}</Text>

          {card.visual ? <View style={styles.visualWrap}>{card.visual}</View> : null}

          <Text style={[styles.body, { color: background.secondaryText }]}>{card.body}</Text>

          {/* Progress dots */}
          <View style={styles.dots}>
            {cards.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === index ? accentColor : background.borderColor,
                    opacity: i === index ? 1 : 0.4,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.actions}>
            {/* Skip is available from the very first card, deliberately. Anyone
                who already knows this game should be one tap from playing it. */}
            {!isLast ? (
              <Pressable onPress={close} hitSlop={8} style={styles.skipButton}>
                <Text style={[styles.skipText, { color: background.secondaryText }]}>Skip</Text>
              </Pressable>
            ) : (
              <View style={styles.skipButton} />
            )}

            <Pressable
              onPress={() => (isLast ? close() : setIndex(index + 1))}
              style={({ pressed }) => [
                styles.nextButton,
                { backgroundColor: accentColor, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={styles.nextText}>{isLast ? "Let's play" : 'Next'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 16,
  },
  heading: { fontSize: 18, fontWeight: '900', textAlign: 'center' },
  visualWrap: { marginTop: 18, marginBottom: 4, alignItems: 'center' },
  body: { fontSize: 13.5, lineHeight: 20, textAlign: 'center', marginTop: 12 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 18 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  skipButton: { minWidth: 54, paddingVertical: 8 },
  skipText: { fontSize: 13, fontWeight: '700' },
  nextButton: { paddingHorizontal: 22, paddingVertical: 11, borderRadius: 999 },
  nextText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
