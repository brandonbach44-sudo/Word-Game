import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  BackgroundOption, 
  ALL_BACKGROUNDS,
  DEFAULT_BACKGROUND_ID,
  DEFAULT_DARK_MODE,
  DEFAULT_SOUND_ENABLED,
  getBackgroundById,
  getDarkModeBackground,
} from './theme';

// Storage keys
const STORAGE_KEYS = {
  BACKGROUND: 'wordgame_selected_background',
  DARK_MODE: 'wordgame_dark_mode',
  SOUND_ENABLED: 'wordgame_sound_enabled',
  COLOR_BLIND: 'wordgame_color_blind',
};

interface ThemeContextType {
  background: BackgroundOption;
  selectedBackgroundId: string;
  darkModeEnabled: boolean;
  soundEnabled: boolean;
  colorBlindMode: boolean;
  backgroundOptions: BackgroundOption[];
  setBackgroundId: (id: string) => Promise<void>;
  setDarkMode: (enabled: boolean) => Promise<void>;
  setSoundEnabled: (enabled: boolean) => Promise<void>;
  setColorBlindMode: (enabled: boolean) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string>(DEFAULT_BACKGROUND_ID);
  const [darkModeEnabled, setDarkModeEnabled] = useState<boolean>(DEFAULT_DARK_MODE);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(DEFAULT_SOUND_ENABLED);
  const [colorBlindMode, setColorBlindModeState] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [savedBg, savedDarkMode, savedSound, savedColorBlind] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.BACKGROUND),
          AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE),
          AsyncStorage.getItem(STORAGE_KEYS.SOUND_ENABLED),
          AsyncStorage.getItem(STORAGE_KEYS.COLOR_BLIND),
        ]);

        if (savedBg) setSelectedBackgroundId(savedBg);
        if (savedDarkMode !== null) setDarkModeEnabled(savedDarkMode === 'true');
        if (savedSound !== null) setSoundEnabledState(savedSound === 'true');
        if (savedColorBlind !== null) setColorBlindModeState(savedColorBlind === 'true');

        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading theme settings:', error);
        setIsLoaded(true);
      }
    };
    loadSettings();
  }, []);

  // Compute effective background
  const background: BackgroundOption = darkModeEnabled 
    ? getDarkModeBackground() 
    : getBackgroundById(selectedBackgroundId);

  // Set and save background
  const setBackgroundId = async (id: string) => {
    try {
      setSelectedBackgroundId(id);
      await AsyncStorage.setItem(STORAGE_KEYS.BACKGROUND, id);
    } catch (error) {
      console.error('Error saving background:', error);
    }
  };

  // Set and save dark mode
  const setDarkMode = async (enabled: boolean) => {
    try {
      setDarkModeEnabled(enabled);
      await AsyncStorage.setItem(STORAGE_KEYS.DARK_MODE, enabled.toString());
    } catch (error) {
      console.error('Error saving dark mode:', error);
    }
  };

  // Set and save sound
  const setSoundEnabled = async (enabled: boolean) => {
    try {
      setSoundEnabledState(enabled);
      await AsyncStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, enabled.toString());
    } catch (error) {
      console.error('Error saving sound setting:', error);
    }
  };

  // Set and save color blind mode
  const setColorBlindMode = async (enabled: boolean) => {
    try {
      setColorBlindModeState(enabled);
      await AsyncStorage.setItem(STORAGE_KEYS.COLOR_BLIND, enabled.toString());
    } catch (error) {
      console.error('Error saving color blind setting:', error);
    }
  };

  // Don't render until settings are loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider 
      value={{
        background,
        selectedBackgroundId,
        darkModeEnabled,
        soundEnabled,
        colorBlindMode,
        backgroundOptions: ALL_BACKGROUNDS,
        setBackgroundId,
        setDarkMode,
        setSoundEnabled,
        setColorBlindMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme in components
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
