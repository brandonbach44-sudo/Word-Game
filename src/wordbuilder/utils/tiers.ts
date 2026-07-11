// src/wordbuilder/utils/tiers.ts
// Tile tier definitions and configurations.
//
// The actual tier data now lives in src/shared/tileTiers.ts so Word Builder
// and Anagrams (and any future tile-based game) share one tier ladder
// instead of maintaining duplicate copies that can drift out of sync. This
// file just re-exports the shared module so every existing import in this
// folder (storage.ts, CustomizeScreen.tsx, etc.) keeps working unchanged.
export * from '../../shared/tileTiers';
