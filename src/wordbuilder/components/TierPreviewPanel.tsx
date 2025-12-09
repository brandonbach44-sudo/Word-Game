import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TierName, TIERS, getTierEmoji } from '../utils/tiers';
import { TierProgress } from '../utils/storage';
import { GameTile } from './GameTile';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Default tier has 6 style options (all unlocked)
const DEFAULT_STYLE_COUNT = 6;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TierPreviewPanelProps {
  visible: boolean;
  tierName: TierName;
  progress: TierProgress;
  lifetimeScore: number;
  onClose: () => void;
  onEquip: (tier: TierName, variant: number) => void;
  isEquipped: boolean;
  equippedVariant: number;
}

export const TierPreviewPanel = ({
  visible,
  tierName,
  progress,
  lifetimeScore,
  onClose,
  onEquip,
  isEquipped,
  equippedVariant,
}: TierPreviewPanelProps) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [selectedVariant, setSelectedVariant] = useState(1);
  
  const tier = TIERS[tierName];
  const isTierUnlocked = progress.highestVariantUnlocked >= 1 || tierName === 'default';
  
  useEffect(() => {
    if (visible) {
      // Reset to V1 when opening
      setSelectedVariant(1);
      // Slide up from bottom
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide down
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Calculate progress for each variant
  const getVariantProgress = (v: number) => {
    if (v === 1) {
      return {
        current: lifetimeScore,
        required: tier.baseThreshold,
        label: 'score',
        isUnlocked: lifetimeScore >= tier.baseThreshold || tierName === 'default',
      };
    } else if (v === 2) {
      return {
        current: progress.scoreWithTier,
        required: tier.v2ScoreThreshold,
        label: 'score with tier equipped',
        isUnlocked: progress.highestVariantUnlocked >= 2,
      };
    } else {
      return {
        current: progress.greatGamesWithTier,
        required: tier.v3GreatThreshold,
        label: 'great games with tier equipped',
        isUnlocked: progress.highestVariantUnlocked >= 3,
      };
    }
  };

  const selectedProgress = getVariantProgress(selectedVariant);
  const progressPercent = selectedProgress.required > 0 
    ? Math.min((selectedProgress.current / selectedProgress.required) * 100, 100)
    : 100;

  // Default tier styles are always available
  const canEquipSelected = tierName === 'default' ? true : selectedProgress.isUnlocked;
  const isSelectedEquipped = isEquipped && equippedVariant === selectedVariant;

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View 
        style={[styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents="auto"
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Full Screen Panel */}
      <Animated.View 
        style={[
          styles.panel,
          { transform: [{ translateY: slideAnim }] }
        ]}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header with Close Button */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{tier.displayName}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Tier Info */}
            <View style={styles.tierInfo}>
              <Text style={styles.tierEmoji}>{getTierEmoji(tierName)}</Text>
              {!isTierUnlocked && (
                <View style={styles.lockedBadge}>
                  <Text style={styles.lockedBadgeText}>🔒 LOCKED</Text>
                </View>
              )}
            </View>

            {/* Large Tile Preview */}
            <View style={styles.previewContainer}>
              <View style={styles.tilePreviewWrapper}>
                {/* Dark overlay for locked tiles */}
                {!selectedProgress.isUnlocked && (
                  <View style={styles.lockedOverlay} pointerEvents="none">
                    <Text style={styles.lockedIcon}>🔒</Text>
                  </View>
                )}
                <GameTile
                  letter=""
                  index={0}
                  isSelected={false}
                  selectionOrder={null}
                  onPress={() => {}}
                  tileSize={140}
                  tierName={tierName}
                  variant={selectedVariant}
                />
              </View>
              <Text style={styles.flavorText}>
                {tierName === 'default' ? `Style ${selectedVariant}` : `Variant ${selectedVariant}`}
              </Text>
            </View>

            {/* Variant/Style Selection */}
            <View style={styles.variantSection}>
              <Text style={styles.sectionTitle}>
                {tierName === 'default' ? 'Select Style' : 'Select Variant'}
              </Text>
              <View style={styles.variantThumbnails}>
                {tierName === 'default' ? (
                  // Default tier: Show 6 styles
                  [1, 2, 3, 4, 5, 6].map((styleNum) => {
                    const isSelected = selectedVariant === styleNum;
                    
                    return (
                      <TouchableOpacity
                        key={styleNum}
                        style={[
                          styles.variantThumbnail,
                          isSelected && styles.variantThumbnailSelected,
                        ]}
                        onPress={() => setSelectedVariant(styleNum)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.thumbnailTileWrapper} pointerEvents="none">
                          <GameTile
                            letter=""
                            index={styleNum}
                            isSelected={false}
                            selectionOrder={null}
                            onPress={() => {}}
                            tileSize={60}
                            tierName={tierName}
                            variant={styleNum}
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  // Other tiers: Show 3 variants
                  [1, 2, 3].map((v) => {
                    const variantProgress = getVariantProgress(v);
                    const isSelected = selectedVariant === v;
                    
                    return (
                      <TouchableOpacity
                        key={v}
                        style={[
                          styles.variantThumbnail,
                          isSelected && styles.variantThumbnailSelected,
                        ]}
                        onPress={() => setSelectedVariant(v)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.thumbnailTileWrapper} pointerEvents="none">
                          {!variantProgress.isUnlocked && (
                            <View style={styles.thumbnailLockedOverlay} pointerEvents="none">
                              <Text style={styles.thumbnailLockIcon}>🔒</Text>
                            </View>
                          )}
                          <GameTile
                            letter=""
                            index={v}
                            isSelected={false}
                            selectionOrder={null}
                            onPress={() => {}}
                            tileSize={70}
                            tierName={tierName}
                            variant={v}
                          />
                        </View>
                        <Text style={[
                          styles.variantLabel,
                          isSelected && styles.variantLabelSelected
                        ]}>
                          V{v}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </View>

            {/* Progress Section - Skip for default tier */}
            {tierName !== 'default' && (
              <View style={styles.progressSection}>
                <Text style={styles.sectionTitle}>
                  {selectedProgress.isUnlocked ? 'Unlocked!' : 'Progress to Unlock'}
                </Text>
                
                {!selectedProgress.isUnlocked && selectedProgress.required > 0 && (
                  <>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                    </View>
                    <Text style={styles.progressText}>
                      {selectedProgress.current.toLocaleString()} / {selectedProgress.required.toLocaleString()} {selectedProgress.label}
                    </Text>
                  </>
                )}
                
                {selectedProgress.isUnlocked && (
                  <Text style={styles.unlockedText}>✓ This variant is unlocked!</Text>
                )}

                {/* Requirement explanation */}
                {!selectedProgress.isUnlocked && (
                  <View style={styles.requirementBox}>
                    <Text style={styles.requirementTitle}>How to unlock:</Text>
                    {selectedVariant === 1 && (
                      <Text style={styles.requirementText}>
                        Reach {tier.baseThreshold.toLocaleString()} lifetime score
                      </Text>
                    )}
                    {selectedVariant === 2 && (
                      <Text style={styles.requirementText}>
                        Earn {tier.v2ScoreThreshold.toLocaleString()} score while {tier.displayName} is equipped
                      </Text>
                    )}
                    {selectedVariant === 3 && (
                      <Text style={styles.requirementText}>
                        Play {tier.v3GreatThreshold} great games while {tier.displayName} is equipped
                        {'\n'}(Blitz ≥2,000 or Standard ≥4,000)
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Equip Button */}
            <TouchableOpacity
              style={[
                styles.equipButton,
                !canEquipSelected && styles.equipButtonDisabled,
                isSelectedEquipped && styles.equipButtonEquipped,
              ]}
              onPress={() => canEquipSelected && onEquip(tierName, selectedVariant)}
              disabled={!canEquipSelected || isSelectedEquipped}
            >
              <Text style={[
                styles.equipButtonText,
                isSelectedEquipped && styles.equipButtonTextEquipped,
              ]}>
                {isSelectedEquipped 
                  ? '✓ Equipped' 
                  : canEquipSelected 
                    ? tierName === 'default' ? 'Equip This Style' : 'Equip This Variant'
                    : '🔒 Locked'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a2e',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#16213e',
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  tierInfo: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  tierEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  lockedBadge: {
    backgroundColor: '#ff4d6d',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  lockedBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  previewContainer: {
    alignItems: 'center',
    marginVertical: 25,
  },
  tilePreviewWrapper: {
    position: 'relative',
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    zIndex: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedIcon: {
    fontSize: 40,
  },
  flavorText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 15,
  },
  variantSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#4ecca3',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  variantThumbnails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
  },
  variantThumbnail: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'transparent',
    minWidth: 95,
  },
  variantThumbnailSelected: {
    borderColor: '#4ecca3',
    backgroundColor: 'rgba(78, 204, 163, 0.15)',
  },
  thumbnailTileWrapper: {
    position: 'relative',
  },
  thumbnailLockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    zIndex: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailLockIcon: {
    fontSize: 20,
  },
  variantLabel: {
    color: '#888',
    fontSize: 14,
    marginTop: 10,
    fontWeight: 'bold',
  },
  variantLabelSelected: {
    color: '#4ecca3',
  },
  progressSection: {
    marginBottom: 25,
  },
  progressBar: {
    height: 14,
    backgroundColor: '#0f1a2e',
    borderRadius: 7,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ecca3',
    borderRadius: 7,
  },
  progressText: {
    color: '#fff',
    fontSize: 15,
    textAlign: 'center',
  },
  unlockedText: {
    color: '#4ecca3',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  requirementBox: {
    backgroundColor: '#16213e',
    padding: 20,
    borderRadius: 12,
    marginTop: 15,
  },
  requirementTitle: {
    color: '#4ecca3',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  requirementText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 22,
  },
  equipButton: {
    backgroundColor: '#4ecca3',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  equipButtonDisabled: {
    backgroundColor: '#333',
  },
  equipButtonEquipped: {
    backgroundColor: '#16213e',
    borderWidth: 2,
    borderColor: '#4ecca3',
  },
  equipButtonText: {
    color: '#1a1a2e',
    fontSize: 18,
    fontWeight: 'bold',
  },
  equipButtonTextEquipped: {
    color: '#4ecca3',
  },
});
