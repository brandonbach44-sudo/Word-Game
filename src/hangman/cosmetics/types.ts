export type FigureSkinId = 'classic';

export type GallowsSkinId =
  | 'default'
  | 'wood'
  | 'neon'
  | 'golden'
  | 'ice'
  | 'lava'
  | 'shadow'
  | 'crystal'
  | 'galaxy'
  | 'sakura'
  | 'diamond';

export interface FigureSkin {
  id: FigureSkinId;
  name: string;
  unlockDayStreak: number;
}

export interface GallowsSkin {
  id: GallowsSkinId;
  name: string;
  unlockGamesPlayed: number;
  // SVG fallback color (used when image is null)
  color: string;
  strokeWidth: number;
  // PNG asset — null means use SVG
  image: any | null;
  // For PNG skins: where the rope ends and the head should be centered (SVG coordinate space 0-200 x, 0-240 y)
  // The SVG overlay will draw a rope line from ropeTopY down to the head, then the figure below
  headX?: number;
  headY?: number;
  ropeTopY?: number;
}

export interface EquippedCosmetics {
  figureSkin: FigureSkinId;
  gallowsSkin: GallowsSkinId;
}
