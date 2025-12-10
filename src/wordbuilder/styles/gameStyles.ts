import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

// Phase 1: New color scheme
const COLORS = {
  // New default background - cream/off-white
  background: '#f5f0e6',
  backgroundDark: '#1a1a2e', // For menus (keeping dark theme there)
  
  // Text colors
  primaryText: '#2c2416', // Dark brown for main text
  secondaryText: '#6b5c4a', // Lighter brown
  accentText: '#4ecca3', // Teal accent (keeping)
  
  // Active word letters
  activeWordText: '#3d2e1c', // Brown for letters being built
  
  // UI Elements
  buttonPrimary: '#4ecca3',
  buttonDanger: '#e94560',
  timerWarning: '#e94560',
};

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundDark, alignItems: 'center', paddingTop: 20 },
  
  // Gameplay container - cream background
  gameplayContainer: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', paddingTop: 20 },
  
  // Background shapes
  backgroundShapes: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  bgCircle: { position: 'absolute', borderRadius: 999 },
  
  mainMenuContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, zIndex: 1 },
  
  // Liquid Glass Button Styles
  glassButtonWrapper: { marginBottom: 20, borderRadius: 28, overflow: 'hidden', minWidth: 250 },
  glassButton: { 
    borderWidth: 1.5, 
    borderColor: 'rgba(255,255,255,0.4)', 
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  glassInner: { paddingHorizontal: 50, paddingVertical: 20, alignItems: 'center' },
  glassButtonText: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  glassButtonWrapperDisabled: { marginBottom: 20, borderRadius: 28, overflow: 'hidden', minWidth: 250, opacity: 0.5 },
  glassButtonDisabled: { 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.2)', 
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  glassButtonTextDisabled: { fontSize: 22, fontWeight: 'bold', color: '#aaa' },
  comingSoonText: { fontSize: 12, color: '#888', marginTop: 5 },
  
  // Liquid Glass Level Button Styles
  glassLevelWrapper: { borderRadius: 20, overflow: 'hidden', minWidth: 85 },
  glassLevelButton: { 
    borderWidth: 1.5, 
    borderColor: 'rgba(255,255,255,0.35)', 
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  glassLevelNumber: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  glassLevelLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  
  // Menu styles
  menuContainer: { 
    flexGrow: 1, 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 40,
    paddingBottom: 100,
    width: '100%',
    zIndex: 1 
  },
  greeting: { fontSize: 24, color: '#4ecca3', marginBottom: 5 },
  menuTitle: { fontSize: 42, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  menuSubtitle: { fontSize: 18, color: '#888', marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#4ecca3', marginBottom: 15, marginTop: 20 },
  levelGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 10 },
  
  // Top Display Container (for Ink & Score) - repositioned for Phase 1.1
  topDisplayContainer: {
    position: 'absolute',
    top: 20,
    alignItems: 'center',
    zIndex: 10,
  },
  topDisplayContainerRight: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  
  // Career Progress Container
  careerProgressContainer: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 30,
  },
  
  // Bottom Buttons Container (for Stats & Customize)
  bottomButtonsContainer: {
    marginTop: 30,
    width: '100%',
    alignItems: 'center',
  },
  
  // Gameplay Ink Display - Phase 1.1: Moved to bottom left, out of way
  gameplayInkContainer: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    zIndex: 5,
  },
  
  // Game Over styles
  gameOverContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  gameOverTitle: { fontSize: 36, fontWeight: 'bold', color: '#e94560', marginBottom: 20 },
  finalScore: { fontSize: 72, fontWeight: 'bold', color: '#4ecca3' },
  finalScoreLabel: { fontSize: 24, color: '#888', marginBottom: 10 },
  wordsFound: { fontSize: 18, color: '#fff', marginBottom: 20 },
  foundWordsContainerGameOver: { height: 100, width: '100%', marginBottom: 20 },
  playAgainButton: { backgroundColor: '#4ecca3', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 25, marginBottom: 15 },
  playAgainText: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  menuButton: { backgroundColor: 'transparent', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 25, borderWidth: 1, borderColor: '#4ecca3' },
  menuButtonText: { fontSize: 16, color: '#4ecca3' },
  
  // Game Header styles - Phase 1: Adapted for cream background
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    width: '100%', 
    paddingHorizontal: 20, 
    marginBottom: 15 
  },
  backButtonContainer: { position: 'absolute', top: 60, left: 20, zIndex: 10 },
  backButton: { fontSize: 16, color: '#4ecca3' },
  // Gameplay-specific header text (for cream background)
  backButtonGameplay: { fontSize: 16, color: COLORS.secondaryText },
  timer: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  timerGameplay: { fontSize: 28, fontWeight: 'bold', color: COLORS.primaryText },
  timerWarning: { color: '#e94560' },
  score: { fontSize: 18, color: '#4ecca3', fontWeight: '600' },
  scoreGameplay: { fontSize: 18, color: COLORS.accentText, fontWeight: '600' },
  
  // Game Play styles - Phase 1.2: No background on word display
  message: { fontSize: 16, color: '#888', marginBottom: 20, height: 20 },
  messageGameplay: { fontSize: 16, color: COLORS.secondaryText, marginBottom: 20, height: 20 },
  
  // Phase 1.2: Word display WITHOUT background container
  wordDisplay: { 
    backgroundColor: '#16213e', 
    paddingHorizontal: 40, 
    paddingVertical: 18, 
    borderRadius: 18, 
    marginBottom: 25, 
    minWidth: 240, 
    alignItems: 'center' 
  },
  // New: No-background word display for gameplay
  wordDisplayTransparent: { 
    paddingHorizontal: 20, 
    paddingVertical: 18, 
    marginBottom: 25, 
    minWidth: 240, 
    alignItems: 'center',
    // No backgroundColor
  },
  currentWord: { fontSize: 32, fontWeight: 'bold', color: '#fff', letterSpacing: 4 },
  // Phase 1.2: Brown letters for active word on cream background
  currentWordGameplay: { 
    fontSize: 36, 
    fontWeight: 'bold', 
    color: COLORS.activeWordText, 
    letterSpacing: 6,
    // Add subtle text shadow for depth
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  // Placeholder text when no letters selected
  currentWordPlaceholder: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'rgba(60, 46, 28, 0.3)', // Faded brown
    letterSpacing: 6,
  },
  
  letterGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: width - 40, gap: 10, marginBottom: 30, marginTop: 20, minHeight: 200 },
  letterTile: { backgroundColor: '#0f3460', borderRadius: 12, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  selectedTile: { backgroundColor: '#4ecca3', transform: [{ scale: 0.95 }] },
  letterText: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  selectedText: { color: '#1a1a2e' },
  orderBadge: { position: 'absolute', top: 3, right: 3, backgroundColor: '#1a1a2e', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  orderText: { color: '#4ecca3', fontSize: 12, fontWeight: 'bold' },
  
  // Button styles - Phase 1: Adapted for cream background
  buttonRow: { flexDirection: 'row', gap: 20, marginBottom: 30 },
  clearButton: { backgroundColor: '#e94560', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  submitButton: { backgroundColor: '#4ecca3', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  
  // Found Words styles - Phase 1.3: Simplified, less boxy
  foundWordsContainer: { flex: 1, width: '100%', paddingHorizontal: 20, minHeight: 150 },
  foundWordsTitle: { fontSize: 16, color: '#888', marginBottom: 10 },
  // Gameplay version - simpler
  foundWordsContainerGameplay: { 
    width: '100%', 
    paddingHorizontal: 25,
    paddingTop: 10,
  },
  foundWordsTitleGameplay: { 
    fontSize: 13, 
    color: COLORS.secondaryText, 
    marginBottom: 8,
    fontWeight: '500',
  },
  foundWordsScroll: { flex: 1, minHeight: 80 },
  foundWordsScrollGameplay: { maxHeight: 60 },
  foundWordsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 10 },
  foundWordsListGameplay: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10, 
  },
  foundWordBadge: { backgroundColor: '#16213e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  // Phase 1.3: Simpler word badges - just text, minimal styling
  foundWordBadgeGameplay: { 
    paddingHorizontal: 8, 
    paddingVertical: 4,
  },
  foundWordText: { color: '#4ecca3', fontSize: 14, fontWeight: '600' },
  foundWordTextGameplay: { 
    color: COLORS.accentText, 
    fontSize: 14, 
    fontWeight: '600',
  },
  
  // Refresh Button
  refreshButton: { backgroundColor: '#16213e', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25, marginTop: 15, marginBottom: 30 },
  refreshButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  // Gameplay version
  refreshButtonGameplay: { 
    backgroundColor: 'rgba(60, 46, 28, 0.1)', 
    paddingHorizontal: 25, 
    paddingVertical: 10, 
    borderRadius: 20, 
    marginTop: 10, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(60, 46, 28, 0.2)',
  },
  refreshButtonTextGameplay: { fontSize: 14, fontWeight: '600', color: COLORS.secondaryText },
  
  // Stats Grid
  statsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    width: '100%', 
    paddingHorizontal: 10,
    marginTop: 20,
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
    marginTop: 20,
  },
  
  // Tiers Container (Customize screen)
  tiersContainer: {
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 0,
  },
  
  // Category Cards (Customize main screen)
  categoryCardsContainer: {
    width: '100%',
    marginTop: 30,
    gap: 15,
  },
  categoryCard: {
    backgroundColor: '#16213e',
    borderRadius: 15,
    padding: 20,
    borderWidth: 2,
    borderColor: '#4ecca3',
  },
  categoryCardDisabled: {
    borderColor: '#333',
    opacity: 0.6,
  },
  categoryIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
  },
  categoryEquipped: {
    fontSize: 12,
    color: '#4ecca3',
    fontWeight: '600',
  },
  comingSoonBadge: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
});
