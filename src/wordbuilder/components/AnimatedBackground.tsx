import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  View,
} from 'react-native';

export const AnimatedBackground = () => {
  const [circles, setCircles] = useState<{
    id: number;
    x: Animated.Value;
    y: Animated.Value;
    scale: Animated.Value;
    size: number;
    color: string;
    opacity: number;
  }[]>([]);
  
  const circleIdRef = useRef(0);
  const maxCirclesRef = useRef(2 + Math.floor(Math.random() * 5));
  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;

  const colors = useMemo(() => [
    '#4ecca3', // teal
    '#e74c3c', // red
    '#3498db', // blue
    '#9b59b6', // purple
    '#e94560', // pink
    '#f39c12', // gold
  ], []);
  
  const createCircle = useCallback((spawnOnScreen: boolean = false) => {
    const id = circleIdRef.current++;
    const size = 150 + Math.random() * 200;
    const opacity = 0.15 + Math.random() * 0.2;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    let startX, startY, endX, endY;
    
    if (spawnOnScreen) {
      startX = Math.random() * screenWidth - size / 2;
      startY = Math.random() * screenHeight - size / 2;
      
      const angle = Math.random() * Math.PI * 2;
      const distance = screenWidth + screenHeight;
      endX = startX + Math.cos(angle) * distance;
      endY = startY + Math.sin(angle) * distance;
    } else {
      const edge = Math.floor(Math.random() * 4);
      
      switch (edge) {
        case 0:
          startX = Math.random() * screenWidth - size / 2;
          startY = -size;
          endX = startX + (Math.random() - 0.5) * screenWidth;
          endY = screenHeight + size;
          break;
        case 1:
          startX = screenWidth;
          startY = Math.random() * screenHeight - size / 2;
          endX = -size;
          endY = startY + (Math.random() - 0.5) * screenHeight;
          break;
        case 2:
          startX = Math.random() * screenWidth - size / 2;
          startY = screenHeight;
          endX = startX + (Math.random() - 0.5) * screenWidth;
          endY = -size;
          break;
        default:
          startX = -size;
          startY = Math.random() * screenHeight - size / 2;
          endX = screenWidth + size;
          endY = startY + (Math.random() - 0.5) * screenHeight;
          break;
      }
    }
    
    const x = new Animated.Value(startX);
    const y = new Animated.Value(startY);
    const scale = new Animated.Value(0.8 + Math.random() * 0.4);
    
    const duration = 20000 + Math.random() * 25000;
    
    Animated.parallel([
      Animated.timing(x, {
        toValue: endX,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(y, {
        toValue: endY,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCircles(prev => prev.filter(c => c.id !== id));
    });
    
    const pulseLoop = () => {
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 0.85 + Math.random() * 0.3,
          duration: 3000 + Math.random() * 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1 + Math.random() * 0.2,
          duration: 3000 + Math.random() * 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) pulseLoop();
      });
    };
    pulseLoop();
    
    return { id, x, y, scale, size, color, opacity };
  }, [screenWidth, screenHeight, colors]);

  useEffect(() => {
    const initialCount = 3 + Math.floor(Math.random() * 2);
    const initialCircles = [];
    for (let i = 0; i < initialCount; i++) {
      initialCircles.push(createCircle(true));
    }
    setCircles(initialCircles);
    
    const spawnInterval = setInterval(() => {
      if (Math.random() < 0.1) {
        maxCirclesRef.current = 2 + Math.floor(Math.random() * 5);
      }
      
      setCircles(prev => {
        if (prev.length < maxCirclesRef.current) {
          return [...prev, createCircle(false)];
        }
        return prev;
      });
    }, 4000 + Math.random() * 3000);
    
    return () => clearInterval(spawnInterval);
  }, [createCircle]);

  return (
    <View style={styles.backgroundShapes}>
      {circles.map(circle => (
        <Animated.View
          key={circle.id}
          style={[
            styles.bgCircle,
            {
              width: circle.size,
              height: circle.size,
              backgroundColor: circle.color,
              opacity: circle.opacity,
              transform: [
                { translateX: circle.x },
                { translateY: circle.y },
                { scale: circle.scale },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundShapes: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    overflow: 'hidden' 
  },
  bgCircle: { 
    position: 'absolute', 
    borderRadius: 999 
  },
});
