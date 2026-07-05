import React from 'react';
import { Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Share2 } from 'lucide-react-native';
import { useTheme } from '../../shared/ThemeContext';

type GameStatusProps = {
  isVisible: boolean;
  isWon: boolean;
  word: string;
  category: string;
  incorrectGuesses: number;
  totalGuesses: number;
  maxAttempts?: number;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  onClose: () => void;
};

const StatPill = ({
  label,
  value,
  textColor,
  borderColor,
  backgroundColor,
}: {
  label: string;
  value: string;
  textColor: string;
  borderColor: string;
  backgroundColor: string;
}) => (
  <View style={[styles.statPill, { borderColor, backgroundColor }]}>
    <Text style={[styles.statPillLabel, { color: textColor }]}>{label}</Text>
    <Text style={[styles.statPillValue, { color: textColor }]}>{value}</Text>
  </View>
);

const PrimaryButton = ({
  label,
  onPress,
  borderColor,
  textColor,
  backgroundColor,
}: {
  label: string;
  onPress: () => void;
  borderColor: string;
  textColor: string;
  backgroundColor: string;
}) => (
  <Pressable
    style={({ pressed }) => [styles.primaryButton, { borderColor, backgroundColor, opacity: pressed ? 0.75 : 1 }]}
    onPress={onPress}
  >
    <Text style={[styles.primaryButtonText, { color: textColor }]}>{label}</Text>
  </Pressable>
);

export const GameStatus: React.FC<GameStatusProps> = ({
  isVisible,
  isWon,
  word,
  category,
  incorrectGuesses,
  totalGuesses,
  maxAttempts = 6,
  onPlayAgain,
  onBackToMenu,
  onClose,
}) => {
  const { background } = useTheme();

  if (!isVisible) return null;

  const BG = background.backgroundColor ?? '#f9f5ec';
  const TEXT = background.textColor ?? '#111827';
  const SUBTEXT = background.secondaryText ?? '#6b7280';
  const CARD = background.cardColor ?? '#ffffff';
  const BORDER = background.borderColor ?? '#e5e7eb';

  const handleShare = async () => {
    try {
      const text = isWon
        ? `Hangman: guessed "${word.toUpperCase()}" with ${incorrectGuesses}/${maxAttempts} wrong guesses.`
        : `Hangman: the word was "${word.toUpperCase()}".`;
      await Share.share({ message: text });
    } catch (e) {
      console.warn('Share failed', e);
    }
  };

  const title = isWon ? 'You Got It!' : 'Game Over';
  const subtitle = isWon
    ? `You guessed it with ${incorrectGuesses}/${maxAttempts} wrong guesses.`
    : `The word was revealed below.`;

  return (
    <Modal transparent visible={isVisible} animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: CARD, borderColor: BORDER }]}>

          {/* Brand */}
          <Text style={[styles.brand, { color: SUBTEXT }]}>HANGMAN</Text>

          {/* Title + subtitle */}
          <Text style={[styles.title, { color: TEXT }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: SUBTEXT }]}>{subtitle}</Text>

          {/* Solution box */}
          <View style={[styles.solutionBox, { borderColor: BORDER }]}>
            <Text style={[styles.solutionLabel, { color: SUBTEXT }]}>The word was</Text>
            <Text style={[styles.solutionWord, { color: TEXT }]}>{word.toUpperCase()}</Text>
            <Text style={[styles.solutionCategory, { color: SUBTEXT }]}>{category}</Text>
          </View>

          {/* This game */}
          <View style={[styles.divider, { backgroundColor: BORDER, opacity: 0.35 }]} />
          <Text style={[styles.sectionTitle, { color: TEXT }]}>This game</Text>
          <View style={styles.statsRow}>
            <StatPill label="Wrong" value={`${incorrectGuesses}`} textColor={TEXT} borderColor={BORDER} backgroundColor={BG} />
            <StatPill label="Total" value={`${totalGuesses}`} textColor={TEXT} borderColor={BORDER} backgroundColor={BG} />
          </View>
          <View style={styles.statsRow}>
            <StatPill label="Lives Left" value={`${maxAttempts - incorrectGuesses}`} textColor={TEXT} borderColor={BORDER} backgroundColor={BG} />
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <PrimaryButton label="Play Again" onPress={onPlayAgain} borderColor={BORDER} textColor={TEXT} backgroundColor={BG} />
            <PrimaryButton label="Main Menu" onPress={onBackToMenu} borderColor={BORDER} textColor={TEXT} backgroundColor={BG} />
          </View>

          <Pressable
            style={({ pressed }) => [styles.shareButton, { opacity: pressed ? 0.75 : 1 }]}
            onPress={handleShare}
          >
            <View style={styles.shareButtonInner}>
              <Share2 size={18} color="#fff" />
              <Text style={styles.shareButtonText}>Share Result</Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              { borderColor: BORDER, backgroundColor: BG, opacity: pressed ? 0.75 : 1 },
            ]}
            onPress={onClose}
          >
            <Text style={[styles.secondaryButtonText, { color: TEXT }]}>Close</Text>
          </Pressable>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    borderWidth: 2,
    padding: 16,
  },
  brand: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 6,
  },
  title: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  solutionBox: {
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  solutionLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  solutionWord: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 2,
  },
  solutionCategory: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  statPill: {
    borderWidth: 2,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  statPillLabel: {
    fontSize: 11,
    fontWeight: '800',
    opacity: 0.8,
    marginBottom: 2,
  },
  statPillValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
  },
  primaryButton: {
    borderWidth: 2,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 120,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  shareButton: {
    marginTop: 10,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#22c55e',
  },
  shareButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    marginTop: 10,
    borderWidth: 2,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
});

export default GameStatus;