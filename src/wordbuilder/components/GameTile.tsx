import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TierName } from '../utils/tiers';

// ===== TIER CONFIGS (Code-generated metal tiers) =====
const TIER_CONFIGS: Record<string, {
  gradient: readonly string[];
  border: string;
  glow: string;
  letterColor: string;
  letterShadow: string;
}> = {
  copper: {
    gradient: ['#b87333', '#e9b88a', '#b87333', '#8b5a2b', '#b87333'],
    border: '#8b5a2b',
    glow: '#b87333',
    letterColor: '#4a2c17',
    letterShadow: 'rgba(184, 115, 51, 0.8)',
  },
  bronze: {
    gradient: ['#cd7f32', '#e9c9a8', '#cd7f32', '#8b6914', '#cd7f32'],
    border: '#8b6914',
    glow: '#cd7f32',
    letterColor: '#4a3410',
    letterShadow: 'rgba(205, 127, 50, 0.8)',
  },
  silver: {
    gradient: ['#c0c0c0', '#e8e8e8', '#c0c0c0', '#8c8c8c', '#c0c0c0'],
    border: '#8c8c8c',
    glow: '#c0c0c0',
    letterColor: '#3a3a3a',
    letterShadow: 'rgba(192, 192, 192, 0.8)',
  },
  gold: {
    gradient: ['#d4af37', '#f4e5a8', '#d4af37', '#aa8c2c', '#d4af37'],
    border: '#aa8c2c',
    glow: '#FFD700',
    letterColor: '#5c4813',
    letterShadow: 'rgba(255, 223, 0, 0.8)',
  },
  platinum: {
    gradient: ['#b8cfe0', '#ddeeff', '#b8cfe0', '#7a9bc2', '#b8cfe0'],
    border: '#7a9bc2',
    glow: '#b8cfe0',
    letterColor: '#3a4a5c',
    letterShadow: 'rgba(184, 207, 224, 0.8)',
  },
};

// Gem tiers use PNG images
const GEM_IMAGES: Partial<Record<TierName, any>> = {
  ruby: require('../../../assets/tiles/ruby_v1.png'),
  emerald: require('../../../assets/tiles/emerald_v1.png'),
  diamond: require('../../../assets/tiles/diamond_v1.png'),
  legendary: require('../../../assets/tiles/legendary_v1.png'),
  iridescence: require('../../../assets/tiles/iridescence_v1.png'),
};

// Glow colors for gem tiers
const GEM_GLOW_COLORS: Record<string, string> = {
  ruby: '#e0115f',
  emerald: '#50c878',
  diamond: '#00bfff',
  legendary: '#ff0000',
  iridescence: '#e6e6fa',
};

// Rainbow colors for legendary glow animation
const RAINBOW_COLORS = ['#ff0000', '#ff8000', '#ffff00', '#00ff00', '#0080ff', '#8000ff'];

// Iridescent colors (pastel rainbow)
const IRIDESCENT_COLORS = ['#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff', '#e0b3ff'];

// Default tier style colors (6 options)
const DEFAULT_STYLES: Record<number, { background: string; border: string; text: string }> = {
  1: { background: '#0f3460', border: '#1a1a2e', text: '#ffffff' },  // Navy Blue (original)
  2: { background: '#4a5568', border: '#2d3748', text: '#ffffff' },  // Slate Gray
  3: { background: '#276749', border: '#1a4731', text: '#ffffff' },  // Forest Green
  4: { background: '#553c9a', border: '#3c2a6e', text: '#ffffff' },  // Deep Purple
  5: { background: '#2d2d2d', border: '#1a1a1a', text: '#ffffff' },  // Charcoal Black
  6: { background: '#0d4f4f', border: '#0a3939', text: '#ffffff' },  // Midnight Teal
};

interface GameTileProps {
  letter: string;
  index: number;
  isSelected: boolean;
  selectionOrder: number | null;
  onPress: (index: number) => void;
  tileSize: number;
  tierName: TierName;
  variant: number; // 1 = static, 2 = glow (for non-default), 1-6 = styles (for default)
}

// ===== MAIN COMPONENT =====
export const GameTile = ({
  letter,
  index,
  isSelected,
  selectionOrder,
  onPress,
  tileSize,
  tierName,
  variant,
}: GameTileProps) => {
  // Check what type of tile this is
  const isMetalTier = TIER_CONFIGS[tierName] !== undefined;
  const isGemTier = GEM_IMAGES[tierName] !== undefined || tierName === 'iridescence';
  const tierConfig = TIER_CONFIGS[tierName];
  const isLegendary = tierName === 'legendary';
  const isIridescence = tierName === 'iridescence';
  const hasGlowAnimation = variant === 2 && tierName !== 'default';
  
  // Rainbow/Iridescent color state
  const [colorIndex, setColorIndex] = useState(0);
  const rainbowColor = RAINBOW_COLORS[colorIndex];
  const iridescentColor = IRIDESCENT_COLORS[colorIndex % IRIDESCENT_COLORS.length];
  
  // ===== V2 GLOW ANIMATIONS =====
  const outerGlowRadius = useRef(new Animated.Value(16)).current;
  const outerGlowOpacity = useRef(new Animated.Value(0.48)).current;
  const innerGlowOpacity = useRef(new Animated.Value(0.5)).current;
  const innerGlowScale = useRef(new Animated.Value(1)).current;
  
  // Color cycling for Legendary and Iridescence V2
  useEffect(() => {
    if ((isLegendary || isIridescence) && variant === 2) {
      const interval = setInterval(() => {
        setColorIndex(prev => (prev + 1) % (isLegendary ? RAINBOW_COLORS.length : IRIDESCENT_COLORS.length));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isLegendary, isIridescence, variant]);
  
  // Glow animation for V2
  useEffect(() => {
    if (hasGlowAnimation) {
      // Outer glow pulse
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(outerGlowRadius, { toValue: 24, duration: 1500, useNativeDriver: false }),
            Animated.timing(outerGlowOpacity, { toValue: 0.7, duration: 1500, useNativeDriver: false }),
          ]),
          Animated.parallel([
            Animated.timing(outerGlowRadius, { toValue: 16, duration: 1500, useNativeDriver: false }),
            Animated.timing(outerGlowOpacity, { toValue: 0.48, duration: 1500, useNativeDriver: false }),
          ]),
        ])
      ).start();
      
      // Inner glow pulse
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(innerGlowOpacity, { toValue: 0.7, duration: 1200, useNativeDriver: false }),
            Animated.timing(innerGlowScale, { toValue: 1.05, duration: 1200, useNativeDriver: false }),
          ]),
          Animated.parallel([
            Animated.timing(innerGlowOpacity, { toValue: 0.5, duration: 1200, useNativeDriver: false }),
            Animated.timing(innerGlowScale, { toValue: 1, duration: 1200, useNativeDriver: false }),
          ]),
        ])
      ).start();
    }
  }, [hasGlowAnimation]);

  // ===== METAL TIER V1 (Static gradient) =====
  if (isMetalTier && variant === 1) {
    return (
      <TouchableOpacity onPress={() => onPress(index)} activeOpacity={0.8}>
        <View style={[styles.tileContainer, { width: tileSize, height: tileSize }]}>
          <LinearGradient
            colors={tierConfig.gradient as unknown as string[]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.tile, styles.metalTile, { width: tileSize, height: tileSize, borderColor: tierConfig.border }]}
          >
            <Text style={[styles.letterText, { color: tierConfig.letterColor, textShadowColor: tierConfig.letterShadow, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 }]}>
              {letter}
            </Text>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    );
  }

  // ===== METAL TIER V2 (Animated gradient with glow) =====
  if (isMetalTier && variant === 2) {
    return (
      <TouchableOpacity onPress={() => onPress(index)} activeOpacity={0.8}>
        <Animated.View
          style={[
            styles.tileContainer,
            {
              width: tileSize,
              height: tileSize,
              shadowColor: tierConfig.glow,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: outerGlowOpacity,
              shadowRadius: outerGlowRadius,
              elevation: 15,
            },
          ]}
        >
          <LinearGradient
            colors={tierConfig.gradient as unknown as string[]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.tile, styles.metalTile, { width: tileSize, height: tileSize, borderColor: '#ffffff' }]}
          >
            <Animated.View style={[styles.innerGlow, { opacity: innerGlowOpacity, transform: [{ scale: innerGlowScale }] }]}>
              <LinearGradient
                colors={[`${tierConfig.glow}66`, `${tierConfig.glow}1A`, 'transparent']}
                start={{ x: 0.5, y: 0.5 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            <Text style={[styles.letterText, { color: tierConfig.letterColor, textShadowColor: tierConfig.letterShadow, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 }]}>
              {letter}
            </Text>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  // ===== GEM TIER V1 (Static PNG) =====
  if (isGemTier && variant === 1) {
    const imageSource = GEM_IMAGES[tierName] || GEM_IMAGES['legendary'];
    
    return (
      <TouchableOpacity onPress={() => onPress(index)} activeOpacity={0.8}>
        <View style={[styles.tileContainer, { width: tileSize, height: tileSize }]}>
          <ImageBackground
            source={imageSource}
            style={[styles.tile, { width: tileSize, height: tileSize }]}
            imageStyle={styles.tileImage}
            resizeMode="cover"
          >
            <Text style={[styles.letterText, styles.gemLetter]}>{letter}</Text>
          </ImageBackground>
        </View>
      </TouchableOpacity>
    );
  }

  // ===== GEM TIER V2 (Animated PNG with glow) =====
  if (isGemTier && variant === 2) {
    let glowColor: string;
    if (isLegendary) {
      glowColor = rainbowColor;
    } else if (isIridescence) {
      glowColor = iridescentColor;
    } else {
      glowColor = GEM_GLOW_COLORS[tierName] || '#ffffff';
    }
    
    const imageSource = GEM_IMAGES[tierName] || GEM_IMAGES['legendary'];
    
    return (
      <TouchableOpacity onPress={() => onPress(index)} activeOpacity={0.8}>
        <Animated.View
          style={[
            styles.tileContainer,
            {
              width: tileSize,
              height: tileSize,
              shadowColor: glowColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: outerGlowOpacity,
              shadowRadius: outerGlowRadius,
              elevation: 15,
            },
          ]}
        >
          <ImageBackground
            source={imageSource}
            style={[styles.tile, { width: tileSize, height: tileSize }]}
            imageStyle={styles.tileImage}
            resizeMode="cover"
          >
            <Animated.View 
              style={[
                styles.innerGlow, 
                { 
                  opacity: innerGlowOpacity, 
                  transform: [{ scale: innerGlowScale }], 
                  backgroundColor: `${glowColor}33` 
                }
              ]} 
            />
            <Text style={[styles.letterText, styles.gemLetter]}>{letter}</Text>
          </ImageBackground>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  // ===== DEFAULT TIER (6 style colors) =====
  const defaultStyle = DEFAULT_STYLES[variant] || DEFAULT_STYLES[1];
  
  return (
    <TouchableOpacity onPress={() => onPress(index)} activeOpacity={0.8}>
      <View style={[styles.tileContainer, { width: tileSize, height: tileSize }]}>
        <View
          style={[
            styles.tile,
            styles.defaultTile,
            {
              width: tileSize,
              height: tileSize,
              backgroundColor: defaultStyle.background,
              borderColor: defaultStyle.border,
            },
          ]}
        >
          <Text style={[styles.letterText, { color: defaultStyle.text }]}>{letter}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tileContainer: {
    // No margin - letterGrid uses gap for spacing
  },
  tile: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  tileImage: {
    borderRadius: 12,
  },
  metalTile: {
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  defaultTile: {
    borderWidth: 3,
  },
  letterText: {
    fontSize: 32,
    fontWeight: 'bold',
    zIndex: 10,
    color: '#fff',
  },
  gemLetter: {
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  innerGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    zIndex: 1,
  },
});
