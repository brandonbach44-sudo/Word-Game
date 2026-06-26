import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../shared/ThemeContext';
import { COLORS } from '../../shared/theme';
import { FIGURE_SKINS, GALLOWS_SKINS } from '../cosmetics/skins';
import { EquippedCosmetics, FigureSkinId, GallowsSkinId } from '../cosmetics/types';

type Props = {
  visible: boolean;
  onClose: () => void;
  equipped: EquippedCosmetics;
  unlockedAchievementIds: string[];
  onEquip: (cosmetics: EquippedCosmetics) => void;
};

export const CosmeticsModal: React.FC<Props> = ({
  visible,
  onClose,
  equipped,
  unlockedAchievementIds,
  onEquip,
}) => {
  const { background } = useTheme();

  const isUnlocked = (achievementId: string | null): boolean => {
    if (achievementId === null) return true;
    return unlockedAchievementIds.includes(achievementId);
  };

  const handleSelectFigure = (id: FigureSkinId) => {
    if (!isUnlocked(FIGURE_SKINS.find(s => s.id === id)?.unlockAchievementId ?? null)) return;
    onEquip({ ...equipped, figureSkin: id });
  };

  const handleSelectGallows = (id: GallowsSkinId) => {
    if (!isUnlocked(GALLOWS_SKINS.find(s => s.id === id)?.unlockAchievementId ?? null)) return;
    onEquip({ ...equipped, gallowsSkin: id });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={[styles.sheet, { backgroundColor: background.backgroundColor, borderColor: background.borderColor }]}
        >
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: background.borderColor }]} />

          <Text style={[styles.title, { color: background.textColor }]}>Cosmetics</Text>
          <Text style={[styles.subtitle, { color: background.secondaryText }]}>
            Unlock skins by completing achievements
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {/* ── Figure Skins ── */}
            <Text style={[styles.sectionTitle, { color: background.textColor }]}>Figure Skin</Text>
            <View style={styles.grid}>
              {FIGURE_SKINS.map((skin) => {
                const unlocked = isUnlocked(skin.unlockAchievementId);
                const isEquipped = equipped.figureSkin === skin.id;
                return (
                  <TouchableOpacity
                    key={skin.id}
                    style={[
                      styles.card,
                      { backgroundColor: background.cardColor, borderColor: background.borderColor },
                      isEquipped && { borderColor: COLORS.accent, borderWidth: 2 },
                      !unlocked && styles.cardLocked,
                    ]}
                    onPress={() => handleSelectFigure(skin.id)}
                    activeOpacity={unlocked ? 0.7 : 1}
                  >
                    <Text style={[styles.emoji, !unlocked && styles.lockedOpacity]}>
                      {unlocked ? skin.emoji : '🔒'}
                    </Text>
                    <Text
                      style={[
                        styles.cardName,
                        { color: background.textColor },
                        !unlocked && styles.lockedOpacity,
                      ]}
                    >
                      {skin.name}
                    </Text>
                    <Text
                      style={[
                        styles.cardHint,
                        { color: background.secondaryText },
                        !unlocked && styles.lockedOpacity,
                      ]}
                      numberOfLines={2}
                    >
                      {unlocked ? (isEquipped ? 'Equipped' : 'Tap to equip') : skin.unlockHint}
                    </Text>
                    {isEquipped && (
                      <View style={[styles.equippedDot, { backgroundColor: COLORS.accent }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Gallows Skins ── */}
            <Text style={[styles.sectionTitle, { color: background.textColor, marginTop: 20 }]}>
              Gallows
            </Text>
            <View style={styles.grid}>
              {GALLOWS_SKINS.map((skin) => {
                const unlocked = isUnlocked(skin.unlockAchievementId);
                const isEquipped = equipped.gallowsSkin === skin.id;
                return (
                  <TouchableOpacity
                    key={skin.id}
                    style={[
                      styles.card,
                      { backgroundColor: background.cardColor, borderColor: background.borderColor },
                      isEquipped && { borderColor: COLORS.accent, borderWidth: 2 },
                      !unlocked && styles.cardLocked,
                    ]}
                    onPress={() => handleSelectGallows(skin.id)}
                    activeOpacity={unlocked ? 0.7 : 1}
                  >
                    <Text style={[styles.emoji, !unlocked && styles.lockedOpacity]}>
                      {unlocked ? skin.emoji : '🔒'}
                    </Text>
                    <Text
                      style={[
                        styles.cardName,
                        { color: background.textColor },
                        !unlocked && styles.lockedOpacity,
                      ]}
                    >
                      {skin.name}
                    </Text>
                    <Text
                      style={[
                        styles.cardHint,
                        { color: background.secondaryText },
                        !unlocked && styles.lockedOpacity,
                      ]}
                      numberOfLines={2}
                    >
                      {unlocked ? (isEquipped ? 'Equipped' : 'Tap to equip') : skin.unlockHint}
                    </Text>
                    {isEquipped && (
                      <View style={[styles.equippedDot, { backgroundColor: COLORS.accent }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '31%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
  },
  cardLocked: {
    opacity: 0.5,
  },
  emoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  lockedOpacity: {
    opacity: 0.6,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  cardHint: {
    fontSize: 10,
    textAlign: 'center',
  },
  equippedDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default CosmeticsModal;
