import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TierName, TIERS, getTierEmoji } from '../utils/tiers';
import { TierProgress } from '../utils/storage';
import { GameTile } from './GameTile';

interface TierCardProps {
  tierName: TierName;
  progress: TierProgress;
  lifetimeScore: number;
  isEquipped: boolean;
  equippedVariant: number;
  onEquip: (tier: TierName, variant: number) => void;
  onPress: (tierName: TierName) => void;
}

export const TierCard = ({ 
  tierName, 
  progress, 
  lifetimeScore,
  isEquipped, 
  equippedVariant,
  onEquip,
  onPress,
}: TierCardProps) => {
  const tier = TIERS[tierName];
  const isUnlocked = progress.highestVariantUnlocked >= 1;
  const isDefault = tierName === 'default';
  
  // Calculate progress to base unlock
  const baseProgress = Math.min(lifetimeScore / tier.baseThreshold, 1);
  const baseProgressPercent = Math.round(baseProgress * 100);

  return (
    <TouchableOpacity 
      style={[
        styles.card,
        isEquipped && styles.cardEquipped,
      ]}
      onPress={() => onPress(tierName)}
      activeOpacity={0.7}
    >
      {/* Locked Overlay - visible but desirable */}
      {!isUnlocked && !isDefault && (
        <View style={styles.lockedOverlay}>
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedBadgeText}>🔒 LOCKED</Text>
          </View>
        </View>
      )}

      {/* Content Row */}
      <View style={styles.contentRow}>
        {/* Tile Preview - NO LETTER */}
        <View style={styles.tilePreview}>
          <GameTile
            letter=""
            index={0}
            isSelected={false}
            selectionOrder={null}
            onPress={() => {}}
            tileSize={56}
            tierName={tierName}
            variant={isEquipped ? equippedVariant : 1}
          />
          {/* Lock icon on tile for locked tiers */}
          {!isUnlocked && !isDefault && (
            <View style={styles.tileLockOverlay}>
              <Text style={styles.tileLockIcon}>🔒</Text>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.header}>
            <Text style={styles.tierName}>{tier.displayName}</Text>
            {isEquipped && (
              <View style={styles.equippedBadge}>
                <Text style={styles.equippedBadgeText}>EQUIPPED</Text>
              </View>
            )}
          </View>

          {/* Progress or variant info */}
          {!isUnlocked && !isDefault ? (
            // Locked: Show progress
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${baseProgressPercent}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {lifetimeScore.toLocaleString()} / {tier.baseThreshold.toLocaleString()}
              </Text>
            </View>
          ) : (
            // Unlocked: Show variant/style info
            <View style={styles.variantInfo}>
              {isDefault ? (
                // Default tier shows styles
                isEquipped ? (
                  <Text style={styles.variantText}>Style {equippedVariant} equipped</Text>
                ) : (
                  <Text style={styles.variantText}>6 styles available</Text>
                )
              ) : (
                // Other tiers show variants
                isEquipped ? (
                  <Text style={styles.variantText}>V{equippedVariant} equipped</Text>
                ) : (
                  <Text style={styles.variantText}>
                    {progress.highestVariantUnlocked} variant{progress.highestVariantUnlocked !== 1 ? 's' : ''} unlocked
                  </Text>
                )
              )}
            </View>
          )}
        </View>

        {/* Arrow indicator */}
        <View style={styles.arrowContainer}>
          <Text style={styles.arrow}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#16213e',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  cardEquipped: {
    borderColor: '#4ecca3',
    backgroundColor: '#1a2a4e',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    zIndex: 10,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 8,
  },
  lockedBadge: {
    backgroundColor: 'rgba(255, 77, 109, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lockedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tilePreview: {
    width: 56,
    height: 56,
    marginRight: 15,
    position: 'relative',
  },
  tileLockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileLockIcon: {
    fontSize: 20,
  },
  infoSection: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tierName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 10,
  },
  equippedBadge: {
    backgroundColor: '#4ecca3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  equippedBadgeText: {
    color: '#1a1a2e',
    fontSize: 10,
    fontWeight: 'bold',
  },
  progressSection: {
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#0f1a2e',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ecca3',
    borderRadius: 3,
  },
  progressText: {
    color: '#888',
    fontSize: 11,
  },
  variantInfo: {
    marginTop: 2,
  },
  variantText: {
    color: '#888',
    fontSize: 12,
  },
  arrowContainer: {
    paddingLeft: 10,
  },
  arrow: {
    color: '#4ecca3',
    fontSize: 28,
    fontWeight: 'bold',
  },
});
