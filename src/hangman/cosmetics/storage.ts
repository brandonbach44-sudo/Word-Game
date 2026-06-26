import AsyncStorage from '@react-native-async-storage/async-storage';
import { EquippedCosmetics } from './types';

const COSMETICS_KEY = 'hangman_equipped_cosmetics';

const DEFAULT: EquippedCosmetics = {
  figureSkin: 'classic',
  gallowsSkin: 'default',
};

export const loadEquippedCosmetics = async (): Promise<EquippedCosmetics> => {
  try {
    const data = await AsyncStorage.getItem(COSMETICS_KEY);
    if (data) return { ...DEFAULT, ...JSON.parse(data) };
  } catch {}
  return DEFAULT;
};

export const saveEquippedCosmetics = async (
  cosmetics: EquippedCosmetics
): Promise<void> => {
  try {
    await AsyncStorage.setItem(COSMETICS_KEY, JSON.stringify(cosmetics));
  } catch {}
};
