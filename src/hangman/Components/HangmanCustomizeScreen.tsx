import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, G, Line } from 'react-native-svg';
import { useTheme } from '../../shared/ThemeContext';
import { COLORS } from '../../shared/theme';
import { GALLOWS_SKINS } from '../cosmetics/skins';
import { EquippedCosmetics, GallowsSkinId } from '../cosmetics/types';

// ─── Gallows preview (SVG or PNG) ────────────────────────────────────────────

type GallowsPreviewProps = {
  skinId: GallowsSkinId;
  themeColor: string;
  size: number;
};

const GallowsPreview: React.FC<GallowsPreviewProps> = ({ skinId, themeColor, size }) => {
  const skin = GALLOWS_SKINS.find(s => s.id === skinId) ?? GALLOWS_SKINS[0];

  if (skin.image) {
    return (
      <Image
        source={skin.image}
        style={{ width: size, height: size * 1.2 }}
        resizeMode="contain"
      />
    );
  }

  // SVG fallback (Default skin)
  const color = skin.color || themeColor;
  const sw = skin.strokeWidth;
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 200 240">
      <G>
        <Line x1={20} y1={220} x2={100} y2={220} stroke={color} strokeWidth={sw} strokeLinecap="round" />
        <Line x1={40} y1={220} x2={40} y2={20}   stroke={color} strokeWidth={sw} strokeLinecap="round" />
        <Line x1={40} y1={20}  x2={130} y2={20}  stroke={color} strokeWidth={sw} strokeLinecap="round" />
        <Line x1={40} y1={60}  x2={75}  y2={20}  stroke={color} strokeWidth={sw > 2 ? sw - 2 : 1} strokeLinecap="round" />
        <Line x1={130} y1={20} x2={130} y2={50}  stroke={color} strokeWidth={3}  strokeLinecap="round" />
      </G>
    </Svg>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  equipped: EquippedCosmetics;
  gamesPlayed: number;
  onEquip: (cosmetics: EquippedCosmetics) => void;
};

export const HangmanCustomizeScreen: React.FC<Props> = ({
  equipped,
  gamesPlayed,
  onEquip,
}) => {
  const { background } = useTheme();

  const equip = (gallowsSkin: GallowsSkinId) => {
    onEquip({ ...equipped, gallowsSkin });
  };

  const currentSkin = GALLOWS_SKINS.find(s => s.id === equipped.gallowsSkin) ?? GALLOWS_SKINS[0];

  const formatNumber = (num: number): string => {
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toString();
  };

  return (
    <View style={styles.container}>

      {/* ── Big live preview ── */}
      <View style={[styles.bigPreviewContainer, { borderBottomColor: 'rgba(0,0,0,0.1)' }]}>
        <GallowsPreview
          skinId={equipped.gallowsSkin}
          themeColor={background.secondaryText}
          size={100}
        />
        <Text style={[styles.bigPreviewLabel, { color: background.secondaryText }]}>
          {currentSkin.name}
        </Text>
      </View>

      {/* ── Games played stat ── */}
      <View style={[styles.scoreContainer, { borderBottomColor: 'rgba(0,0,0,0.1)' }]}>
        <Text style={[styles.scoreLabel, { color: background.secondaryText }]}>Games Played</Text>
        <Text style={[styles.scoreValue, { color: COLORS.accent }]}>{gamesPlayed}</Text>
      </View>

      {/* ── Skin list ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: background.secondaryText }]}>
          Unlock gallows skins by playing games
        </Text>

        {GALLOWS_SKINS.map((skin) => {
          const unlocked = gamesPlayed >= skin.unlockGamesPlayed;
          const isEquipped = equipped.gallowsSkin === skin.id;
          const progress = skin.unlockGamesPlayed > 0
            ? Math.min(gamesPlayed / skin.unlockGamesPlayed, 1)
            : 1;

          return (
            <Pressable
              key={skin.id}
              onPress={() => { if (unlocked) equip(skin.id); }}
              style={[
                styles.skinRow,
                { backgroundColor: background.cardColor, borderColor: background.borderColor },
                isEquipped && { borderColor: COLORS.accent, borderWidth: 2 },
              ]}
            >
              {/* Left — preview */}
              <View style={[styles.skinPreview, !unlocked && { opacity: 0.4 }]}>
                <GallowsPreview
                  skinId={skin.id}
                  themeColor={background.secondaryText}
                  size={52}
                />
              </View>

              {/* Center — name + status + equipped badge */}
              <View style={styles.skinInfo}>
                <Text style={[
                  styles.skinName,
                  { color: unlocked ? background.textColor : background.secondaryText },
                ]}>
                  {skin.name}
                </Text>
                <Text style={[
                  styles.skinStatus,
                  { color: unlocked ? COLORS.accent : background.secondaryText },
                ]}>
                  {unlocked ? 'Unlocked' : 'Locked'}
                </Text>
                {isEquipped && (
                  <View style={[styles.equippedBadge, { backgroundColor: COLORS.accent }]}>
                    <Text style={styles.equippedText}>Equipped</Text>
                  </View>
                )}
              </View>

              {/* Right — progress bar for locked */}
              {!unlocked && (
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { backgroundColor: background.borderColor }]}>
                    <View style={[
                      styles.progressFill,
                      { width: `${Math.round(progress * 100)}%`, backgroundColor: COLORS.accent },
                    ]} />
                  </View>
                  <Text style={[styles.progressText, { color: background.secondaryText }]}>
                    {formatNumber(gamesPlayed)} / {formatNumber(skin.unlockGamesPlayed)}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Big preview — matches WordBuilder pattern
  bigPreviewContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  bigPreviewLabel: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
  },

  // Score row — matches WordBuilder pattern
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  scoreLabel: { fontSize: 14 },
  scoreValue: { fontSize: 28, fontWeight: 'bold' },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },

  sectionTitle: {
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
  },

  // Skin row — matches WordBuilder tier card pattern exactly
  skinRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  skinPreview: { marginRight: 15 },
  skinInfo: { flex: 1 },
  skinName: { fontSize: 18, fontWeight: 'bold' },
  skinStatus: { fontSize: 13, marginTop: 4 },
  equippedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  equippedText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

  // Progress — right side of locked rows (matches WordBuilder)
  progressContainer: { width: 100, alignItems: 'flex-end' },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 10, marginTop: 4 },

  bottomPadding: { height: 50 },
});

export default HangmanCustomizeScreen;
