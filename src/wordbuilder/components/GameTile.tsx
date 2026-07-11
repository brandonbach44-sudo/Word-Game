// src/wordbuilder/components/GameTile.tsx
// The actual tile-rendering component now lives in src/shared/GameTile.tsx
// so Word Builder and Anagrams share one implementation instead of
// duplicating ~440 lines of tier rendering + glow animation logic. This
// file just re-exports the shared component so every existing import in
// this folder keeps working unchanged.
export { GameTile } from '../../shared/GameTile';
