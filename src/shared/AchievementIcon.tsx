// src/shared/AchievementIcon.tsx
//
// Achievement iconography for all eight games.
//
// ── Why category-based and not one icon per achievement ─────────────────────
// There are ~300 achievements. Giving each its own picture is what made the
// old emoji set feel cheesy: 300 unrelated images with no visual system behind
// them. Instead every achievement draws its icon from its CATEGORY, so the
// whole set reads as one designed family, and a new achievement automatically
// inherits the right icon just by declaring its category.
//
// Progression is already conveyed elsewhere — unlocked vs locked uses opacity
// and the game's accent colour at each render site — so the icon itself does
// not need to escalate.

import React from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Crown,
  Flag,
  Flame,
  Gamepad2,
  Layers,
  LayoutGrid,
  Mountain,
  Repeat,
  Ruler,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react-native';

/**
 * Every category used across the seven achievement files. Several games named
 * the same idea differently (streak/streaks/daily_streak), so they map to the
 * same icon rather than being renamed — renaming categories would touch unlock
 * logic, and there's no need to risk that for an icon change.
 */
export type AchievementCategory =
  // progress through days
  | 'daily'
  | 'daily_specific'
  | 'daily_streak'
  | 'streak'
  | 'streaks'
  // skill and challenge
  | 'skill'
  | 'difficulty'
  | 'speed'
  | 'winning'
  // words
  | 'words'
  | 'words_found'
  | 'words_per_game'
  | 'word_length'
  | 'volume'
  // scores and totals
  | 'score'
  | 'score_milestone'
  | 'lifetime'
  | 'lifetime_score'
  // play patterns
  | 'games_played'
  | 'practice'
  | 'completion'
  | 'categories'
  | 'getting_started'
  | 'milestone'
  | 'special';

type IconComponent = React.ComponentType<{ size?: number; color?: string }>;

const CATEGORY_ICONS: Record<string, IconComponent> = {
  // Days and consistency — the flame is already the streak language on the
  // home screen's Fury Streak, so it stays consistent here.
  streak: Flame,
  streaks: Flame,
  daily_streak: Flame,
  daily: CalendarCheck,
  daily_specific: Calendar,

  // Skill and challenge
  skill: Target,
  difficulty: Mountain,
  speed: Zap,
  winning: Crown,

  // Words
  words: BookOpen,
  words_found: BookOpen,
  volume: BookOpen,
  words_per_game: Layers,
  word_length: Ruler,

  // Scores and lifetime totals
  score: TrendingUp,
  score_milestone: TrendingUp,
  lifetime: Trophy,
  lifetime_score: Trophy,

  // Play patterns
  games_played: Gamepad2,
  practice: Repeat,
  completion: CheckCircle2,
  categories: LayoutGrid,
  getting_started: Flag,
  milestone: Flag,
  special: Star,
};

/** Anything unmapped still renders something sensible rather than nothing. */
const FALLBACK: IconComponent = Award;

export function iconForCategory(category?: string): IconComponent {
  if (!category) return FALLBACK;
  return CATEGORY_ICONS[category] ?? FALLBACK;
}

interface AchievementIconProps {
  category?: string;
  size?: number;
  color: string;
}

export const AchievementIcon: React.FC<AchievementIconProps> = ({
  category,
  size = 24,
  color,
}) => {
  const Icon = iconForCategory(category);
  return <Icon size={size} color={color} />;
};

export default AchievementIcon;
