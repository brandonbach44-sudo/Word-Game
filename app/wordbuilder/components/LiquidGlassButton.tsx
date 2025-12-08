import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  TouchableOpacity,
  View,
} from 'react-native';

interface LiquidGlassButtonProps {
  onPress?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  style?: any;
  size?: 'large' | 'small';
}

export const LiquidGlassButton = ({ 
  onPress, 
  disabled = false, 
  children, 
  style = {},
  size = 'large'
}: LiquidGlassButtonProps) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const [shimmerOpacity] = useState(() => 0.15 + Math.random() * 0.15);
  
  useEffect(() => {
    const initialDelay = Math.random() * 3000;
    
    const runShimmer = () => {
      shimmerAnim.setValue(0);
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1800 + Math.random() * 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    };
    
    const initialTimeout = setTimeout(() => {
      runShimmer();
      
      const scheduleNext = () => {
        const nextDelay = 5000 + Math.random() * 4000;
        return setTimeout(() => {
          runShimmer();
          scheduleNext();
        }, nextDelay);
      };
      scheduleNext();
    }, initialDelay);
    
    return () => clearTimeout(initialTimeout);
  }, [shimmerAnim]);
  
  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: size === 'large' ? [-250, 250] : [-100, 100],
  });
  
  const isLarge = size === 'large';
  const buttonRadius = isLarge ? 28 : 20;
  
  const Wrapper = disabled ? View : TouchableOpacity;
  
  return (
    <Wrapper 
      onPress={disabled ? undefined : onPress}
      activeOpacity={0.8}
      style={[
        {
          borderRadius: buttonRadius,
          overflow: 'hidden',
          minWidth: isLarge ? 250 : 85,
          opacity: disabled ? 0.5 : 1,
        },
        !disabled && {
          shadowColor: '#4ecca3',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 10,
        },
        style,
      ]}
    >
      <BlurView 
        intensity={60} 
        tint={disabled ? "dark" : "light"} 
        style={{
          borderRadius: buttonRadius,
          overflow: 'hidden',
        }}
      >
        <LinearGradient
          colors={
            disabled 
              ? ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']
              : ['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.15)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            padding: 1.5,
            borderRadius: buttonRadius,
          }}
        >
          <View style={{
            backgroundColor: disabled 
              ? 'rgba(50,50,60,0.6)' 
              : 'rgba(255,255,255,0.08)',
            borderRadius: buttonRadius - 1.5,
            overflow: 'hidden',
          }}>
            <LinearGradient
              colors={[
                disabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.18)',
                'transparent'
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: isLarge ? 35 : 22,
                borderTopLeftRadius: buttonRadius - 1.5,
                borderTopRightRadius: buttonRadius - 1.5,
              }}
            />
            
            {!disabled && (
              <Animated.View
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  width: isLarge ? 100 : 50,
                  transform: [
                    { translateX: shimmerTranslate },
                    { skewX: '-15deg' },
                  ],
                  opacity: shimmerOpacity,
                }}
              >
                <LinearGradient
                  colors={[
                    'transparent',
                    'rgba(255,255,255,0.4)',
                    'rgba(255,255,255,0.7)',
                    'rgba(255,255,255,0.4)',
                    'transparent',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ flex: 1 }}
                />
              </Animated.View>
            )}
            
            <View style={{
              paddingHorizontal: isLarge ? 50 : 18,
              paddingVertical: isLarge ? 20 : 14,
              alignItems: 'center',
            }}>
              {children}
            </View>
          </View>
        </LinearGradient>
      </BlurView>
    </Wrapper>
  );
};
