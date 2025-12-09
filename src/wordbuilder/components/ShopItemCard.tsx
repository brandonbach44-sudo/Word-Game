import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { InkCoinIcon } from './InkDisplay';

interface ShopItemCardProps {
  name: string;
  cost: number;
  owned: boolean;
  equipped: boolean;
  canAfford: boolean;
  onPress: () => void;
  children: React.ReactNode; // Preview content (tile or background preview)
  size?: 'normal' | 'large';
}

export const ShopItemCard = ({
  name,
  cost,
  owned,
  equipped,
  canAfford,
  onPress,
  children,
  size = 'normal',
}: ShopItemCardProps) => {
  const isLocked = !owned && !canAfford;
  const isPurchasable = !owned && canAfford;
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        size === 'large' && styles.containerLarge,
        equipped && styles.containerEquipped,
        isLocked && styles.containerLocked,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Preview Area */}
      <View style={[styles.previewArea, size === 'large' && styles.previewAreaLarge]}>
        {children}
        
        {/* Equipped checkmark overlay */}
        {equipped && (
          <View style={styles.equippedBadge}>
            <Text style={styles.equippedCheck}>✓</Text>
          </View>
        )}
        
        {/* Owned indicator (not equipped) */}
        {owned && !equipped && (
          <View style={styles.ownedBadge}>
            <Text style={styles.ownedText}>OWNED</Text>
          </View>
        )}
        
        {/* Locked overlay */}
        {isLocked && (
          <View style={styles.lockedOverlay}>
            <Text style={styles.lockedIcon}>🔒</Text>
          </View>
        )}
      </View>
      
      {/* Info Area */}
      <View style={styles.infoArea}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        
        {/* Price or Status */}
        {owned ? (
          <Text style={styles.ownedLabel}>
            {equipped ? 'Equipped' : 'Tap to equip'}
          </Text>
        ) : (
          <View style={styles.priceContainer}>
            <InkCoinIcon size={16} />
            <Text style={[
              styles.price,
              !canAfford && styles.priceLocked
            ]}>
              {cost}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Simple tile preview for shop tiles
export const ShopTilePreview = ({ 
  backgroundColor, 
  borderColor,
  size = 50 
}: { 
  backgroundColor: string; 
  borderColor: string;
  size?: number;
}) => {
  return (
    <View style={[
      styles.tilePreview,
      {
        width: size,
        height: size,
        backgroundColor,
        borderColor,
      }
    ]}>
      <Text style={styles.tilePreviewLetter}>A</Text>
    </View>
  );
};

// Background preview for shop backgrounds
export const BackgroundPreview = ({
  backgroundColor,
  gradient,
  size = 'normal',
}: {
  backgroundColor?: string;
  gradient?: string[];
  size?: 'normal' | 'large';
}) => {
  const previewSize = size === 'large' ? 80 : 60;
  
  // For now, just show solid color or first gradient color
  const bgColor = backgroundColor || (gradient ? gradient[0] : '#1a1a2e');
  
  return (
    <View style={[
      styles.backgroundPreview,
      {
        width: previewSize,
        height: previewSize,
        backgroundColor: bgColor,
      }
    ]}>
      {/* Mini tile representation */}
      <View style={styles.miniTileGrid}>
        <View style={styles.miniTile} />
        <View style={styles.miniTile} />
        <View style={styles.miniTile} />
        <View style={styles.miniTile} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    width: '48%',
    marginBottom: 12,
  },
  containerLarge: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerEquipped: {
    borderColor: '#4ecca3',
    backgroundColor: '#1a2a4e',
  },
  containerLocked: {
    opacity: 0.6,
  },
  previewArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  previewAreaLarge: {
    paddingVertical: 5,
    marginRight: 15,
  },
  equippedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#4ecca3',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  equippedCheck: {
    color: '#1a1a2e',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ownedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(78, 204, 163, 0.8)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ownedText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedIcon: {
    fontSize: 20,
  },
  infoArea: {
    alignItems: 'center',
    paddingTop: 5,
  },
  name: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    color: '#ffd700',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  priceLocked: {
    color: '#888',
  },
  ownedLabel: {
    color: '#4ecca3',
    fontSize: 11,
  },
  // Tile Preview Styles
  tilePreview: {
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tilePreviewLetter: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  // Background Preview Styles
  backgroundPreview: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  miniTileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 30,
    height: 30,
    gap: 3,
  },
  miniTile: {
    width: 12,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
});
