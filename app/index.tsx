import React from 'react';
import {
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { LiquidGlassButton } from './wordbuilder/components/LiquidGlassButton';
import { AnimatedBackground } from './wordbuilder/components/AnimatedBackground';

const { width } = Dimensions.get('window');

export default function AppMainMenu() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <AnimatedBackground />
      
      <View style={styles.menuContainer}>
        <Text style={styles.appTitle}>Word Games</Text>
        <Text style={styles.appSubtitle}>Choose a Game</Text>
        
        <LiquidGlassButton 
          onPress={() => router.push('/wordbuilder')}
          size="large"
          style={{ marginBottom: 20 }}
        >
          <Text style={styles.buttonText}>Word Builder</Text>
          <Text style={styles.buttonSubtext}>Build words from letters</Text>
        </LiquidGlassButton>
        
        <LiquidGlassButton 
          disabled={true}
          size="large"
          style={{ marginBottom: 20 }}
        >
          <Text style={styles.buttonTextDisabled}>Word Search</Text>
          <Text style={styles.comingSoon}>Coming Soon</Text>
        </LiquidGlassButton>
        
        <LiquidGlassButton 
          disabled={true}
          size="large"
          style={{ marginBottom: 20 }}
        >
          <Text style={styles.buttonTextDisabled}>Crossword</Text>
          <Text style={styles.comingSoon}>Coming Soon</Text>
        </LiquidGlassButton>
        
        <LiquidGlassButton 
          disabled={true}
          size="large"
        >
          <Text style={styles.buttonTextDisabled}>Anagram</Text>
          <Text style={styles.comingSoon}>Coming Soon</Text>
        </LiquidGlassButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  appTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  appSubtitle: {
    fontSize: 18,
    color: '#888',
    marginBottom: 40,
  },
  buttonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  buttonSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  buttonTextDisabled: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#aaa',
  },
  comingSoon: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
});
