import React, { useEffect, useRef, useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  Easing,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TierName, TIERS } from '../utils/tiers';

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
};

// Glow colors for gem tiers (legendary uses rainbow animation)
const GEM_GLOW_COLORS: Record<string, string> = {
  ruby: '#e0115f',
  emerald: '#50c878',
  diamond: '#00bfff',
  legendary: '#ff0000', // Base color, will be overridden by rainbow animation for V2+
};

// Rainbow colors for legendary glow animation
const RAINBOW_COLORS = ['#ff0000', '#ff8000', '#ffff00', '#00ff00', '#0080ff', '#8000ff'];

// Default tier style colors (6 options)
const DEFAULT_STYLES: Record<number, { background: string; border: string; text: string }> = {
  1: { background: '#0f3460', border: '#1a1a2e', text: '#ffffff' },  // Navy Blue (original)
  2: { background: '#4a5568', border: '#2d3748', text: '#ffffff' },  // Slate Gray
  3: { background: '#276749', border: '#1a4731', text: '#ffffff' },  // Forest Green
  4: { background: '#553c9a', border: '#3c2a6e', text: '#ffffff' },  // Deep Purple
  5: { background: '#2d2d2d', border: '#1a1a1a', text: '#ffffff' },  // Charcoal Black
  6: { background: '#0d4f4f', border: '#0a3939', text: '#ffffff' },  // Midnight Teal
};

// Default tier fallback colors
const DEFAULT_COLORS = {
  background: '#0f3460',
  border: '#1a1a2e',
  glow: '#4ecca3',
};

// Sparkle positions (percentage based)
const SPARKLE_POSITIONS = [
  { top: '10%', left: '15%', delay: 0 },
  { top: '15%', left: '85%', delay: 500 },
  { top: '85%', left: '20%', delay: 1000 },
  { top: '90%', left: '80%', delay: 1500 },
  { top: '50%', left: '8%', delay: 700 },
  { top: '50%', left: '92%', delay: 300 },
];

// Shooting star configs
const SHOOTING_STAR_CONFIGS = [
  { top: '15%', left: '15%', xEnd: -50, yEnd: -50, delay: 0 },
  { top: '15%', left: '85%', xEnd: 50, yEnd: -50, delay: 300 },
  { top: '85%', left: '15%', xEnd: -50, yEnd: 50, delay: 600 },
  { top: '85%', left: '85%', xEnd: 50, yEnd: 50, delay: 900 },
  { top: '10%', left: '50%', xEnd: 0, yEnd: -60, delay: 200 },
  { top: '90%', left: '50%', xEnd: 0, yEnd: 60, delay: 500 },
  { top: '50%', left: '10%', xEnd: -60, yEnd: 0, delay: 800 },
  { top: '50%', left: '90%', xEnd: 60, yEnd: 0, delay: 1100 },
];

interface GameTileProps {
  letter: string;
  index: number;
  isSelected: boolean;
  selectionOrder: number | null;
  onPress: (index: number) => void;
  tileSize: number;
  tierName: TierName;
  variant: number;
}

// ===== SPARKLE COMPONENT =====
const Sparkle = ({ top, left, delay, randomOffset }: { top: string; left: string; delay: number; randomOffset: number }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const totalDelay = delay + randomOffset;
    
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.timing(rotation, { toValue: 1, duration: 1000, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(opacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
            Animated.timing(rotation, { toValue: 2, duration: 1000, useNativeDriver: true }),
          ]),
        ])
      ).start();
    }, totalDelay);
  }, []);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 2],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.sparkle,
        {
          top,
          left,
          opacity,
          transform: [{ scale }, { rotate: rotateInterpolate }],
        },
      ]}
    >
      <View style={styles.sparkleHorizontal} />
      <View style={styles.sparkleVertical} />
    </Animated.View>
  );
};

// ===== SHOOTING STAR COMPONENT =====
const ShootingStar = ({ 
  top, left, xEnd, yEnd, delay, randomOffset 
}: { 
  top: string; left: string; xEnd: number; yEnd: number; delay: number; randomOffset: number 
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const totalDelay = delay + randomOffset;
    
    const animate = () => {
      opacity.setValue(1);
      translateX.setValue(0);
      translateY.setValue(0);
      scale.setValue(1);

      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 1500, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: xEnd, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: yEnd, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
      ]).start(() => {
        setTimeout(animate, 500);
      });
    };

    setTimeout(animate, totalDelay);
  }, []);

  return (
    <Animated.Text
      style={[
        styles.shootingStar,
        {
          top,
          left,
          opacity,
          transform: [{ translateX }, { translateY }, { scale }],
        },
      ]}
    >
      ★
    </Animated.Text>
  );
};

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
  const isGemTier = GEM_IMAGES[tierName] !== undefined;
  const tierConfig = TIER_CONFIGS[tierName];
  const isLegendary = tierName === 'legendary';
  
  // Random offset for independent animations per tile
  const randomOffset = useMemo(() => Math.random() * 2000, []);
  
  // Rainbow color state for Legendary
  const [rainbowColorIndex, setRainbowColorIndex] = useState(0);
  const rainbowColor = RAINBOW_COLORS[rainbowColorIndex];
  
  // ===== V2 ANIMATIONS =====
  const outerGlowRadius = useRef(new Animated.Value(16)).current;
  const outerGlowOpacity = useRef(new Animated.Value(0.48)).current;
  const innerGlowOpacity = useRef(new Animated.Value(0.5)).current;
  const innerGlowScale = useRef(new Animated.Value(1)).current;
  
  // Rainbow color cycling for Legendary V2+
  useEffect(() => {
    if (isLegendary && variant >= 2) {
      const interval = setInterval(() => {
        setRainbowColorIndex((prev) => (prev + 1) % RAINBOW_COLORS.length);
      }, 500); // Change color every 500ms
      return () => clearInterval(interval);
    }
  }, [isLegendary, variant]);
  
  // Start V2 animations
  useEffect(() => {
    if (variant >= 2 && (isMetalTier || isGemTier)) {
      setTimeout(() => {
        // Outer Glow Pulse
        Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(outerGlowRadius, { toValue: 28, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
              Animated.timing(outerGlowOpacity, { toValue: 0.72, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
            ]),
            Animated.parallel([
              Animated.timing(outerGlowRadius, { toValue: 16, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
              Animated.timing(outerGlowOpacity, { toValue: 0.48, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
            ]),
          ])
        ).start();
        
        // Inner Glow Pulse
        Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(innerGlowOpacity, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(innerGlowScale, { toValue: 1.05, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(innerGlowOpacity, { toValue: 0.5, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
              Animated.timing(innerGlowScale, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ]),
          ])
        ).start();
      }, randomOffset);
    }
  }, [variant, tierName]);

  // ===== SELECTED STATE =====
  if (isSelected) {
    return (
      <TouchableOpacity onPress={() => onPress(index)} activeOpacity={0.8}>
        <View style={[styles.tileContainer, { width: tileSize, height: tileSize }]}>
          <View style={[styles.tile, styles.selectedTile, { width: tileSize, height: tileSize, backgroundColor: '#4ecca3' }]}>
            <Text style={[styles.letterText, { color: '#1a1a2e' }]}>{letter}</Text>
            {selectionOrder !== null && (
              <View style={styles.orderBadge}>
                <Text style={styles.orderText}>{selectionOrder}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // ===== METAL TIER V1 (Static) =====
  if (isMetalTier && variant === 1) {
    return (
      <TouchableOpacity onPress={() => onPress(index)} activeOpacity={0.8}>
        <View style={[styles.tileContainer, { width: tileSize, height: tileSize }]}>
          <LinearGradient
            colors={[...tierConfig.gradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.tile, styles.metalTile, { width: tileSize, height: tileSize, borderColor: tierConfig.border }]}
          >
            <Text style={[styles.letterText, { color: tierConfig.letterColor }]}>{letter}</Text>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    );
  }

  // ===== METAL TIER V2/V3 (Animated - same effect, no particles for metal) =====
  if (isMetalTier && variant >= 2) {
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
            colors={[...tierConfig.gradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.tile, styles.metalTile, { width: tileSize, height: tileSize, borderColor: tierConfig.border }]}
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
    return (
      <TouchableOpacity onPress={() => onPress(index)} activeOpacity={0.8}>
        <View style={[styles.tileContainer, { width: tileSize, height: tileSize }]}>
          <ImageBackground
            source={GEM_IMAGES[tierName]}
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

  // ===== GEM TIER V2 (Animated PNG - glow only) =====
  if (isGemTier && variant === 2) {
    const glowColor = isLegendary ? rainbowColor : (GEM_GLOW_COLORS[tierName] || '#ffffff');
    
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
            source={GEM_IMAGES[tierName]}
            style={[styles.tile, { width: tileSize, height: tileSize }]}
            imageStyle={styles.tileImage}
            resizeMode="cover"
          >
            <Animated.View style={[styles.innerGlow, { opacity: innerGlowOpacity, transform: [{ scale: innerGlowScale }], backgroundColor: `${glowColor}33` }]} />
            <Text style={[styles.letterText, styles.gemLetter]}>{letter}</Text>
          </ImageBackground>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  // ===== GEM TIER V3 (Animated PNG + Sparkles + Shooting Stars) =====
  if (isGemTier && variant === 3) {
    const glowColor = isLegendary ? rainbowColor : (GEM_GLOW_COLORS[tierName] || '#ffffff');
    
    return (
      <TouchableOpacity onPress={() => onPress(index)} activeOpacity={0.8}>
        <Animated.View
          style={[
            styles.tileContainer,
            styles.v3Container,
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
          {/* Sparkles */}
          {SPARKLE_POSITIONS.map((pos, i) => (
            <Sparkle key={`sparkle-${i}`} top={pos.top} left={pos.left} delay={pos.delay} randomOffset={randomOffset} />
          ))}
          
          {/* Shooting Stars */}
          {SHOOTING_STAR_CONFIGS.map((config, i) => (
            <ShootingStar
              key={`star-${i}`}
              top={config.top}
              left={config.left}
              xEnd={config.xEnd}
              yEnd={config.yEnd}
              delay={config.delay}
              randomOffset={randomOffset}
            />
          ))}
          
          <ImageBackground
            source={GEM_IMAGES[tierName]}
            style={[styles.tile, { width: tileSize, height: tileSize }]}
            imageStyle={styles.tileImage}
            resizeMode="cover"
          >
            <Animated.View style={[styles.innerGlow, { opacity: innerGlowOpacity, transform: [{ scale: innerGlowScale }], backgroundColor: `${glowColor}33` }]} />
            <Text style={[styles.letterText, styles.gemLetter]}>{letter}</Text>
          </ImageBackground>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  // ===== DEFAULT TIER / FALLBACK =====
  // Default tier uses 6 style colors
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
  v3Container: {
    overflow: 'visible', // Allow sparkles and stars to show outside tile
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
  selectedTile: {
    transform: [{ scale: 0.95 }],
    borderRadius: 12,
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
  orderBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#1a1a2e',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  orderText: {
    color: '#4ecca3',
    fontSize: 12,
    fontWeight: 'bold',
  },
  innerGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    zIndex: 1,
  },
  // Sparkle styles
  sparkle: {
    position: 'absolute',
    width: 12,
    height: 12,
    zIndex: 100,
  },
  sparkleHorizontal: {
    position: 'absolute',
    width: 12,
    height: 2,
    backgroundColor: '#fff',
    top: 5,
    left: 0,
    borderRadius: 1,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  sparkleVertical: {
    position: 'absolute',
    width: 2,
    height: 12,
    backgroundColor: '#fff',
    top: 0,
    left: 5,
    borderRadius: 1,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  // Shooting star styles
  shootingStar: {
    position: 'absolute',
    fontSize: 10,
    color: '#fff',
    zIndex: 100,
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});
