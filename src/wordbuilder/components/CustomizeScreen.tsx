import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Components
import { InkDisplay, InkCoinIcon } from './InkDisplay';
import { ShopItemCard, ShopTilePreview, BackgroundPreview } from './ShopItemCard';
import { PurchaseModal } from './PurchaseModal';
import { GameTile } from './GameTile';

// Utils & Data
import {
  loadStats,
  loadTiles,
  loadEconomy,
  purchaseShopTile,
  purchaseBackground,
  equipShopTile,
  equipBackground,
  equipCareerTile,
  PlayerStats,
  PlayerTiles,
  PlayerEconomy,
} from '../utils/storage';
import {
  SHOP_TILES,
  SHOP_BACKGROUNDS,
  getShopTileById,
  getBackgroundById,
  ShopTile,
  ShopBackground,
} from '../utils/shopData';
import { TierName, TIERS, TIER_ORDER, getTierEmoji } from '../utils/tiers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type CategoryFilter = 'all' | 'tiles' | 'backgrounds' | 'career';

interface CustomizeScreenProps {
  onBack: () => void;
}

export const CustomizeScreen = ({ onBack }: CustomizeScreenProps) => {
  // Data State
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [tiles, setTiles] = useState<PlayerTiles | null>(null);
  const [economy, setEconomy] = useState<PlayerEconomy | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // UI State
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [purchaseModal, setPurchaseModal] = useState<{
    visible: boolean;
    item: ShopTile | ShopBackground | null;
    type: 'tile' | 'background';
  }>({ visible: false, item: null, type: 'tile' });

  // Load all data
  const loadAllData = useCallback(async () => {
    const [loadedStats, loadedTiles, loadedEconomy] = await Promise.all([
      loadStats(),
      loadTiles(),
      loadEconomy(),
    ]);
    setStats(loadedStats);
    setTiles(loadedTiles);
    setEconomy(loadedEconomy);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  }, [loadAllData]);

  // Purchase handlers
  const handleTilePurchase = async () => {
    if (!purchaseModal.item || purchaseModal.type !== 'tile') return;
    
    const tile = purchaseModal.item as ShopTile;
    const result = await purchaseShopTile(tile.id, tile.cost);
    
    if (result.success) {
      await loadAllData();
      setPurchaseModal({ visible: false, item: null, type: 'tile' });
    }
  };

  const handleBackgroundPurchase = async () => {
    if (!purchaseModal.item || purchaseModal.type !== 'background') return;
    
    const bg = purchaseModal.item as ShopBackground;
    const result = await purchaseBackground(bg.id, bg.cost);
    
    if (result.success) {
      await loadAllData();
      setPurchaseModal({ visible: false, item: null, type: 'background' });
    }
  };

  // Equip handlers
  const handleEquipShopTile = async (tileId: string) => {
    const success = await equipShopTile(tileId);
    if (success) await loadAllData();
  };

  const handleEquipBackground = async (backgroundId: string) => {
    const success = await equipBackground(backgroundId);
    if (success) await loadAllData();
  };

  const handleEquipCareerTile = async (tier: TierName, variant: number) => {
    const success = await equipCareerTile(tier, variant);
    if (success) await loadAllData();
  };

  // Item press handlers
  const handleShopTilePress = (tile: ShopTile) => {
    if (economy?.ownedShopTiles.includes(tile.id)) {
      // Already owned - equip it
      handleEquipShopTile(tile.id);
    } else {
      // Not owned - show purchase modal
      setPurchaseModal({ visible: true, item: tile, type: 'tile' });
    }
  };

  const handleBackgroundPress = (bg: ShopBackground) => {
    if (economy?.ownedBackgrounds.includes(bg.id)) {
      // Already owned - equip it
      handleEquipBackground(bg.id);
    } else if (bg.cost > 0) {
      // Not owned and not free - show purchase modal
      setPurchaseModal({ visible: true, item: bg, type: 'background' });
    }
  };

  if (!stats || !tiles || !economy) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Determine what's currently equipped
  const isUsingShopTile = economy.equippedShopTile !== null;
  const equippedShopTileData = isUsingShopTile 
    ? getShopTileById(economy.equippedShopTile!) 
    : null;
  const equippedBackgroundData = getBackgroundById(economy.equippedBackground);

  // Filter items based on category
  const showTiles = activeCategory === 'all' || activeCategory === 'tiles';
  const showBackgrounds = activeCategory === 'all' || activeCategory === 'backgrounds';
  const showCareer = activeCategory === 'all' || activeCategory === 'career';

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
        {/* Back Button & Title Row */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Customize</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        {/* Ink Display */}
        <View style={styles.inkDisplayContainer}>
          <InkDisplay ink={economy.ink} totalScore={stats.totalScore} />
        </View>
        
        {/* Preview Area */}
        <View style={styles.previewArea}>
          <View style={[
            styles.previewBackground,
            { backgroundColor: equippedBackgroundData?.backgroundColor || '#1a1a2e' }
          ]}>
            {/* Show equipped tile preview */}
            {isUsingShopTile && equippedShopTileData ? (
              <View style={[
                styles.previewTile,
                {
                  backgroundColor: equippedShopTileData.backgroundColor,
                  borderColor: equippedShopTileData.borderColor,
                }
              ]}>
                <Text style={[styles.previewTileLetter, { color: equippedShopTileData.textColor }]}>
                  A
                </Text>
              </View>
            ) : (
              <GameTile
                letter="A"
                index={0}
                isSelected={false}
                selectionOrder={null}
                onPress={() => {}}
                tileSize={60}
                tierName={tiles.equippedTier}
                variant={tiles.equippedVariant}
              />
            )}
          </View>
          <Text style={styles.previewLabel}>Current Look</Text>
        </View>
      </View>

      {/* Category Pills */}
      <View style={styles.categoryContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {[
            { key: 'all', label: 'All' },
            { key: 'tiles', label: 'Tiles' },
            { key: 'backgrounds', label: 'Backgrounds' },
            { key: 'career', label: 'Career Rewards' },
          ].map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryPill,
                activeCategory === cat.key && styles.categoryPillActive,
              ]}
              onPress={() => setActiveCategory(cat.key as CategoryFilter)}
            >
              <Text style={[
                styles.categoryPillText,
                activeCategory === cat.key && styles.categoryPillTextActive,
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tint="#4ecca3" />
        }
      >
        {/* Shop Tiles Section */}
        {showTiles && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🎨 Shop Tiles</Text>
              <View style={styles.priceBadge}>
                <InkCoinIcon size={14} />
                <Text style={styles.priceBadgeText}>250 each</Text>
              </View>
            </View>
            
            <View style={styles.gridContainer}>
              {SHOP_TILES.map((tile) => {
                const owned = economy.ownedShopTiles.includes(tile.id);
                const equipped = economy.equippedShopTile === tile.id;
                const canAfford = economy.ink >= tile.cost;
                
                return (
                  <ShopItemCard
                    key={tile.id}
                    name={tile.name}
                    cost={tile.cost}
                    owned={owned}
                    equipped={equipped}
                    canAfford={canAfford}
                    onPress={() => handleShopTilePress(tile)}
                  >
                    <ShopTilePreview
                      backgroundColor={tile.backgroundColor}
                      borderColor={tile.borderColor}
                      size={50}
                    />
                  </ShopItemCard>
                );
              })}
            </View>
          </View>
        )}

        {/* Backgrounds Section */}
        {showBackgrounds && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🖼️ Backgrounds</Text>
            
            {/* Classic Tier */}
            <View style={styles.tierSection}>
              <View style={styles.tierHeader}>
                <Text style={styles.tierTitle}>Classic</Text>
                <View style={styles.priceBadge}>
                  <InkCoinIcon size={14} />
                  <Text style={styles.priceBadgeText}>100</Text>
                </View>
              </View>
              
              <View style={styles.gridContainer}>
                {SHOP_BACKGROUNDS.filter(bg => bg.tier === 'classic').map((bg) => {
                  const owned = economy.ownedBackgrounds.includes(bg.id);
                  const equipped = economy.equippedBackground === bg.id;
                  const canAfford = economy.ink >= bg.cost;
                  
                  return (
                    <ShopItemCard
                      key={bg.id}
                      name={bg.name}
                      cost={bg.cost}
                      owned={owned}
                      equipped={equipped}
                      canAfford={canAfford || bg.cost === 0}
                      onPress={() => handleBackgroundPress(bg)}
                    >
                      <BackgroundPreview
                        backgroundColor={bg.backgroundColor}
                        gradient={bg.gradient}
                      />
                    </ShopItemCard>
                  );
                })}
              </View>
            </View>
            
            {/* Styled Tier */}
            <View style={styles.tierSection}>
              <View style={styles.tierHeader}>
                <Text style={styles.tierTitle}>Styled</Text>
                <View style={styles.priceBadge}>
                  <InkCoinIcon size={14} />
                  <Text style={styles.priceBadgeText}>300</Text>
                </View>
              </View>
              
              <View style={styles.gridContainer}>
                {SHOP_BACKGROUNDS.filter(bg => bg.tier === 'styled').map((bg) => {
                  const owned = economy.ownedBackgrounds.includes(bg.id);
                  const equipped = economy.equippedBackground === bg.id;
                  const canAfford = economy.ink >= bg.cost;
                  
                  return (
                    <ShopItemCard
                      key={bg.id}
                      name={bg.name}
                      cost={bg.cost}
                      owned={owned}
                      equipped={equipped}
                      canAfford={canAfford}
                      onPress={() => handleBackgroundPress(bg)}
                    >
                      <BackgroundPreview
                        backgroundColor={bg.backgroundColor}
                        gradient={bg.gradient}
                      />
                    </ShopItemCard>
                  );
                })}
              </View>
            </View>
            
            {/* Prestige Tier */}
            <View style={styles.tierSection}>
              <View style={styles.tierHeader}>
                <Text style={styles.tierTitle}>✨ Prestige</Text>
                <View style={styles.priceBadge}>
                  <InkCoinIcon size={14} />
                  <Text style={styles.priceBadgeText}>800</Text>
                </View>
              </View>
              
              <View style={styles.gridContainer}>
                {SHOP_BACKGROUNDS.filter(bg => bg.tier === 'prestige').map((bg) => {
                  const owned = economy.ownedBackgrounds.includes(bg.id);
                  const equipped = economy.equippedBackground === bg.id;
                  const canAfford = economy.ink >= bg.cost;
                  
                  return (
                    <ShopItemCard
                      key={bg.id}
                      name={bg.name}
                      cost={bg.cost}
                      owned={owned}
                      equipped={equipped}
                      canAfford={canAfford}
                      onPress={() => handleBackgroundPress(bg)}
                    >
                      <BackgroundPreview
                        backgroundColor={bg.backgroundColor}
                        gradient={bg.gradient}
                      />
                    </ShopItemCard>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Career Rewards Section */}
        {showCareer && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Career Rewards</Text>
            <Text style={styles.sectionSubtitle}>Unlocked by lifetime score - Cannot be purchased</Text>
            
            <View style={styles.careerList}>
              {TIER_ORDER.map((tierName) => {
                const tier = TIERS[tierName];
                const progress = tiles.tierProgress[tierName];
                const isUnlocked = progress.highestVariantUnlocked >= 1 || tierName === 'default';
                const isEquipped = !isUsingShopTile && tiles.equippedTier === tierName;
                const progressPercent = tierName === 'default' 
                  ? 100 
                  : Math.min((stats.totalScore / tier.baseThreshold) * 100, 100);
                
                return (
                  <TouchableOpacity
                    key={tierName}
                    style={[
                      styles.careerItem,
                      isEquipped && styles.careerItemEquipped,
                      !isUnlocked && styles.careerItemLocked,
                    ]}
                    onPress={() => isUnlocked && handleEquipCareerTile(tierName, tiles.equippedVariant)}
                    disabled={!isUnlocked}
                  >
                    {/* Tile Preview */}
                    <View style={styles.careerTilePreview}>
                      <GameTile
                        letter=""
                        index={0}
                        isSelected={false}
                        selectionOrder={null}
                        onPress={() => {}}
                        tileSize={50}
                        tierName={tierName}
                        variant={1}
                      />
                      {!isUnlocked && (
                        <View style={styles.careerLockOverlay}>
                          <Text style={styles.careerLockIcon}>🔒</Text>
                        </View>
                      )}
                    </View>
                    
                    {/* Info */}
                    <View style={styles.careerInfo}>
                      <View style={styles.careerHeader}>
                        <Text style={styles.careerEmoji}>{getTierEmoji(tierName)}</Text>
                        <Text style={styles.careerName}>{tier.displayName}</Text>
                        {isEquipped && (
                          <View style={styles.equippedTag}>
                            <Text style={styles.equippedTagText}>EQUIPPED</Text>
                          </View>
                        )}
                      </View>
                      
                      {tierName !== 'default' && (
                        <>
                          <View style={styles.careerProgressBar}>
                            <View style={[styles.careerProgressFill, { width: `${progressPercent}%` }]} />
                          </View>
                          <Text style={styles.careerProgressText}>
                            {isUnlocked 
                              ? `✓ Unlocked (${progress.highestVariantUnlocked} variant${progress.highestVariantUnlocked > 1 ? 's' : ''})`
                              : `${stats.totalScore.toLocaleString()} / ${tier.baseThreshold.toLocaleString()}`
                            }
                          </Text>
                        </>
                      )}
                      
                      {tierName === 'default' && (
                        <Text style={styles.careerProgressText}>
                          {progress.highestVariantUnlocked} styles available
                        </Text>
                      )}
                    </View>
                    
                    {/* Arrow */}
                    {isUnlocked && (
                      <Text style={styles.careerArrow}>›</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
        
        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Purchase Modal */}
      <PurchaseModal
        visible={purchaseModal.visible}
        itemName={purchaseModal.item?.name || ''}
        itemType={purchaseModal.type}
        cost={purchaseModal.item?.cost || 0}
        currentBalance={economy.ink}
        onConfirm={purchaseModal.type === 'tile' ? handleTilePurchase : handleBackgroundPurchase}
        onCancel={() => setPurchaseModal({ visible: false, item: null, type: 'tile' })}
      >
        {purchaseModal.type === 'tile' && purchaseModal.item && (
          <ShopTilePreview
            backgroundColor={(purchaseModal.item as ShopTile).backgroundColor}
            borderColor={(purchaseModal.item as ShopTile).borderColor}
            size={80}
          />
        )}
        {purchaseModal.type === 'background' && purchaseModal.item && (
          <BackgroundPreview
            backgroundColor={(purchaseModal.item as ShopBackground).backgroundColor}
            gradient={(purchaseModal.item as ShopBackground).gradient}
            size="large"
          />
        )}
      </PurchaseModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
  },
  
  // Sticky Header
  stickyHeader: {
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(78, 204, 163, 0.2)',
    paddingBottom: 15,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    color: '#4ecca3',
    fontSize: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 60,
  },
  inkDisplayContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  previewArea: {
    alignItems: 'center',
  },
  previewBackground: {
    width: 100,
    height: 100,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  previewTile: {
    width: 60,
    height: 60,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewTileLetter: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  previewLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
  },
  
  // Category Pills
  categoryContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  categoryScroll: {
    paddingHorizontal: 15,
    gap: 10,
  },
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#16213e',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryPillActive: {
    backgroundColor: 'rgba(78, 204, 163, 0.2)',
    borderColor: '#4ecca3',
  },
  categoryPillText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: '#4ecca3',
  },
  
  // Scroll Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  
  // Sections
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sectionSubtitle: {
    color: '#888',
    fontSize: 12,
    marginBottom: 15,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priceBadgeText: {
    color: '#ffd700',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  
  // Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  // Tier Sections (for backgrounds)
  tierSection: {
    marginBottom: 20,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tierTitle: {
    color: '#4ecca3',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Career Rewards
  careerList: {
    gap: 12,
  },
  careerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 15,
    padding: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  careerItemEquipped: {
    borderColor: '#4ecca3',
    backgroundColor: '#1a2a4e',
  },
  careerItemLocked: {
    opacity: 0.6,
  },
  careerTilePreview: {
    position: 'relative',
    marginRight: 15,
  },
  careerLockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  careerLockIcon: {
    fontSize: 18,
  },
  careerInfo: {
    flex: 1,
  },
  careerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  careerEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  careerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  equippedTag: {
    backgroundColor: '#4ecca3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 10,
  },
  equippedTagText: {
    color: '#1a1a2e',
    fontSize: 10,
    fontWeight: 'bold',
  },
  careerProgressBar: {
    height: 6,
    backgroundColor: '#0f1a2e',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  careerProgressFill: {
    height: '100%',
    backgroundColor: '#4ecca3',
    borderRadius: 3,
  },
  careerProgressText: {
    color: '#888',
    fontSize: 11,
  },
  careerArrow: {
    color: '#4ecca3',
    fontSize: 28,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  
  bottomPadding: {
    height: 50,
  },
});
