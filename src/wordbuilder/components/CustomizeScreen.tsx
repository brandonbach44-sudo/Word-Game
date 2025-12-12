import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameTile } from './GameTile';
import { TierName, TIERS, TIER_ORDER } from '../utils/tiers';
import {
  PlayerStats,
  PlayerTiles,
  loadStats,
  loadTiles,
  equipTile,
} from '../utils/storage';

interface CustomizeScreenProps {
  onBack: () => void;
  embedded?: boolean;
}

export const CustomizeScreen: React.FC<CustomizeScreenProps> = ({ onBack, embedded = false }) => {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [tiles, setTiles] = useState<PlayerTiles | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTier, setSelectedTier] = useState<TierName | null>(null);

  const loadData = async () => {
    const [loadedStats, loadedTiles] = await Promise.all([
      loadStats(),
      loadTiles(),
    ]);
    setStats(loadedStats);
    setTiles(loadedTiles);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handleEquip = async (tier: TierName, variant: number) => {
    const success = await equipTile(tier, variant);
    if (success) {
      await loadData();
    }
  };

  const getTierStatus = (tierName: TierName) => {
    if (!tiles || !stats) return { unlocked: false, highestVariant: 0 };
    
    if (tierName === 'default') {
      return { unlocked: true, highestVariant: 6 };
    }
    
    const progress = tiles.tierProgress[tierName];
    const tier = TIERS[tierName];
    
    return {
      unlocked: stats.totalScore >= tier.baseThreshold,
      highestVariant: Math.min(progress.highestVariantUnlocked, 2),
    };
  };

  const isEquipped = (tierName: TierName, variant?: number) => {
    if (!tiles) return false;
    if (variant !== undefined) {
      return tiles.equippedTier === tierName && tiles.equippedVariant === variant;
    }
    return tiles.equippedTier === tierName;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
  };

  const renderTierCard = (tierName: TierName) => {
    const tier = TIERS[tierName];
    const status = getTierStatus(tierName);
    const equipped = isEquipped(tierName);
    const isDefault = tierName === 'default';
    
    return (
      <TouchableOpacity
        key={tierName}
        style={[
          styles.tierCard,
          !status.unlocked && styles.tierCardLocked,
          equipped && styles.tierCardEquipped,
        ]}
        onPress={() => {
          if (status.unlocked) {
            setSelectedTier(selectedTier === tierName ? null : tierName);
          }
        }}
        disabled={!status.unlocked}
        activeOpacity={0.7}
      >
        <View style={styles.tierPreview}>
          <GameTile
            letter="A"
            index={0}
            isSelected={false}
            selectionOrder={null}
            onPress={() => {}}
            tileSize={60}
            tierName={tierName}
            variant={status.highestVariant || 1}
          />
        </View>

        <View style={styles.tierInfo}>
          <Text style={[styles.tierName, !status.unlocked && styles.tierNameLocked]}>
            {tier.displayName}
          </Text>
          
          {!status.unlocked ? (
            <Text style={styles.tierRequirement}>
              {formatNumber(tier.baseThreshold)} score to unlock
            </Text>
          ) : isDefault ? (
            <Text style={styles.tierStatus}>6 styles available</Text>
          ) : (
            <Text style={styles.tierStatus}>
              {status.highestVariant === 2 ? 'V2 unlocked' : 'V1 unlocked'}
            </Text>
          )}
          
          {equipped && (
            <View style={styles.equippedBadge}>
              <Text style={styles.equippedText}>Equipped</Text>
            </View>
          )}
        </View>

        {!status.unlocked && stats && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min((stats.totalScore / tier.baseThreshold) * 100, 100)}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {formatNumber(stats.totalScore)} / {formatNumber(tier.baseThreshold)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderVariantSelector = () => {
    if (!selectedTier || !tiles) return null;
    
    const tier = TIERS[selectedTier];
    const status = getTierStatus(selectedTier);
    const isDefault = selectedTier === 'default';
    const maxVariant = isDefault ? 6 : 2;
    
    return (
      <View style={styles.variantSelector}>
        <Text style={styles.variantTitle}>
          {tier.displayName} - Select {isDefault ? 'Style' : 'Variant'}
        </Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.variantList}
        >
          {Array.from({ length: maxVariant }, (_, i) => i + 1).map((variant) => {
            const isUnlocked = variant <= status.highestVariant;
            const isCurrentlyEquipped = isEquipped(selectedTier, variant);
            
            return (
              <TouchableOpacity
                key={variant}
                style={[
                  styles.variantCard,
                  !isUnlocked && styles.variantCardLocked,
                  isCurrentlyEquipped && styles.variantCardEquipped,
                ]}
                onPress={() => {
                  if (isUnlocked) {
                    handleEquip(selectedTier, variant);
                  }
                }}
                disabled={!isUnlocked}
              >
                <GameTile
                  letter="A"
                  index={0}
                  isSelected={false}
                  selectionOrder={null}
                  onPress={() => {}}
                  tileSize={55}
                  tierName={selectedTier}
                  variant={variant}
                />
                <Text style={[styles.variantLabel, !isUnlocked && styles.variantLabelLocked]}>
                  {isDefault ? `Style ${variant}` : `V${variant}`}
                </Text>
                {!isUnlocked && (
                  <View style={styles.lockOverlay}>
                    <Text style={styles.lockIcon}>Locked</Text>
                  </View>
                )}
                {isCurrentlyEquipped && (
                  <View style={styles.equippedCheckmark}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        
        {!isDefault && status.highestVariant < 2 && tiles && (
          <View style={styles.unlockInfo}>
            <Text style={styles.unlockText}>
              V2: Earn {formatNumber(tier.v2ScoreThreshold)} score while equipped
            </Text>
            <Text style={styles.unlockProgress}>
              {formatNumber(tiles.tierProgress[selectedTier].scoreWithTier)} / {formatNumber(tier.v2ScoreThreshold)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const content = (
    <>
      {stats && (
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Lifetime Score</Text>
          <Text style={styles.scoreValue}>{stats.totalScore.toLocaleString()}</Text>
        </View>
      )}

      {renderVariantSelector()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ecca3" />
        }
      >
        <Text style={styles.sectionTitle}>
          Unlock tiles by earning lifetime score
        </Text>
        
        {TIER_ORDER.map(renderTierCard)}
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </>
  );

  if (embedded) {
    return <View style={styles.embeddedContainer}>{content}</View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Career Tiles</Text>
        <View style={styles.placeholder} />
      </View>

      {content}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f0e6',
  },
  embeddedContainer: {
    flex: 1,
    backgroundColor: '#f5f0e6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    zIndex: 10,
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    color: '#6b5c4a',
    fontSize: 16,
  },
  title: {
    color: '#2c2416',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 60,
  },
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  scoreLabel: {
    color: '#6b5c4a',
    fontSize: 14,
  },
  scoreValue: {
    color: '#4ecca3',
    fontSize: 28,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    color: '#6b5c4a',
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
  },
  tierCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e8e0d0',
  },
  tierCardLocked: {
    opacity: 0.6,
  },
  tierCardEquipped: {
    borderColor: '#4ecca3',
  },
  tierPreview: {
    marginRight: 15,
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    color: '#2c2416',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tierNameLocked: {
    color: '#999',
  },
  tierRequirement: {
    color: '#999',
    fontSize: 13,
    marginTop: 4,
  },
  tierStatus: {
    color: '#4ecca3',
    fontSize: 13,
    marginTop: 4,
  },
  equippedBadge: {
    backgroundColor: '#4ecca3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  equippedText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 10,
    left: 90,
    right: 15,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ecca3',
    borderRadius: 2,
  },
  progressText: {
    color: '#999',
    fontSize: 10,
    marginTop: 4,
  },
  variantSelector: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e8e0d0',
  },
  variantTitle: {
    color: '#2c2416',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  variantList: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  variantCard: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f5f0e6',
    position: 'relative',
  },
  variantCardLocked: {
    opacity: 0.5,
  },
  variantCardEquipped: {
    backgroundColor: 'rgba(78, 204, 163, 0.2)',
    borderWidth: 2,
    borderColor: '#4ecca3',
  },
  variantLabel: {
    color: '#2c2416',
    fontSize: 12,
    marginTop: 6,
  },
  variantLabelLocked: {
    color: '#999',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    color: '#fff',
    fontSize: 10,
  },
  equippedCheckmark: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#4ecca3',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  unlockInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
  },
  unlockText: {
    color: '#6b5c4a',
    fontSize: 12,
  },
  unlockProgress: {
    color: '#4ecca3',
    fontSize: 12,
    marginTop: 4,
  },
  bottomPadding: {
    height: 50,
  },
});
