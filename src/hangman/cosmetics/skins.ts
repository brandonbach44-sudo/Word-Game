import { FigureSkin, GallowsSkin } from './types';

export const FIGURE_SKINS: FigureSkin[] = [
  { id: 'classic', name: 'Classic', unlockDayStreak: 0 },
  // More figure skins coming — will use PNG assets
];

export const GALLOWS_SKINS: GallowsSkin[] = [
  {
    id: 'default',
    name: 'Default',
    unlockGamesPlayed: 0,
    color: '',          // uses theme secondaryText
    strokeWidth: 6,
    image: null,        // SVG only — no PNG needed
  },
  {
    id: 'wood',
    name: 'Wood',
    unlockGamesPlayed: 10,
    color: '#8B6914',
    strokeWidth: 6,
    image: require('../../../assets/hangman/gallows/gallows_classic.png'),
    headX: 130, headY: 90, ropeTopY: 20,
  },
  {
    id: 'neon',
    name: 'Neon',
    unlockGamesPlayed: 20,
    color: '#FF00FF',
    strokeWidth: 3,
    image: require('../../../assets/hangman/gallows/gallows_Neon.png'),
    headX: 130, headY: 90, ropeTopY: 20,
  },
  {
    id: 'golden',
    name: 'Golden',
    unlockGamesPlayed: 35,
    color: '#FFD700',
    strokeWidth: 5,
    image: require('../../../assets/hangman/gallows/gallows_Golden.png'),
    headX: 130, headY: 90, ropeTopY: 20,
  },
  {
    id: 'ice',
    name: 'Ice',
    unlockGamesPlayed: 60,
    color: '#87CEEB',
    strokeWidth: 5,
    image: require('../../../assets/hangman/gallows/gallows_Ice.png'),
    headX: 130, headY: 90, ropeTopY: 20,
  },
  {
    id: 'lava',
    name: 'Lava',
    unlockGamesPlayed: 100,
    color: '#FF4500',
    strokeWidth: 6,
    image: require('../../../assets/hangman/gallows/gallows_Lava.png'),
    headX: 130, headY: 90, ropeTopY: 20,
  },
  {
    id: 'shadow',
    name: 'Shadow',
    unlockGamesPlayed: 150,
    color: '#555555',
    strokeWidth: 8,
    image: require('../../../assets/hangman/gallows/gallows_Shadow.png'),
    headX: 130, headY: 90, ropeTopY: 20,
  },
  {
    id: 'crystal',
    name: 'Crystal',
    unlockGamesPlayed: 200,
    color: '#9B59B6',
    strokeWidth: 4,
    image: require('../../../assets/hangman/gallows/gallows_Crystal.png'),
    headX: 130, headY: 90, ropeTopY: 20,
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    unlockGamesPlayed: 275,
    color: '#7B2FBE',
    strokeWidth: 4,
    image: require('../../../assets/hangman/gallows/gallows_Galaxy.png'),
    headX: 130, headY: 90, ropeTopY: 20,
  },
  {
    id: 'sakura',
    name: 'Sakura',
    unlockGamesPlayed: 350,
    color: '#FFB7C5',
    strokeWidth: 4,
    image: require('../../../assets/hangman/gallows/gallows_Sakura.png'),
    headX: 130, headY: 90, ropeTopY: 20,
  },
  {
    id: 'diamond',
    name: 'Diamond',
    unlockGamesPlayed: 500,
    color: '#B9F2FF',
    strokeWidth: 4,
    image: require('../../../assets/hangman/gallows/gallows_Diamond.png'),
    headX: 130, headY: 90, ropeTopY: 20,
  },
];
