import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', paddingTop: 20 },
  
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
  menuContainer: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 20, paddingVertical: 40, zIndex: 1 },
  greeting: { fontSize: 24, color: '#4ecca3', marginBottom: 5 },
  menuTitle: { fontSize: 42, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  menuSubtitle: { fontSize: 18, color: '#888', marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#4ecca3', marginBottom: 15, marginTop: 20 },
  levelGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 10 },
  
  // Game Over styles
  gameOverContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  gameOverTitle: { fontSize: 36, fontWeight: 'bold', color: '#e94560', marginBottom: 20 },
  finalScore: { fontSize: 72, fontWeight: 'bold', color: '#4ecca3' },
  finalScoreLabel: { fontSize: 24, color: '#888', marginBottom: 10 },
  wordsFound: { fontSize: 18, color: '#fff', marginBottom: 20 },
  foundWordsContainerGameOver: { height: 150, width: '100%', marginBottom: 20 },
  playAgainButton: { backgroundColor: '#4ecca3', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 25, marginBottom: 15 },
  playAgainText: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  menuButton: { backgroundColor: 'transparent', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 25, borderWidth: 1, borderColor: '#4ecca3' },
  menuButtonText: { fontSize: 16, color: '#4ecca3' },
  
  // Game Header styles
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 20, marginBottom: 15 },
  backButtonContainer: { position: 'absolute', top: 60, left: 20, zIndex: 10 },
  backButton: { fontSize: 16, color: '#4ecca3' },
  timer: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  timerWarning: { color: '#e94560' },
  score: { fontSize: 18, color: '#4ecca3', fontWeight: '600' },
  
  // Game Play styles
  message: { fontSize: 16, color: '#888', marginBottom: 20, height: 20 },
  wordDisplay: { backgroundColor: '#16213e', paddingHorizontal: 40, paddingVertical: 18, borderRadius: 18, marginBottom: 25, minWidth: 240, alignItems: 'center' },
  currentWord: { fontSize: 32, fontWeight: 'bold', color: '#fff', letterSpacing: 4 },
  letterGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: width - 40, gap: 10, marginBottom: 30, marginTop: 20, minHeight: 200 },
  letterTile: { backgroundColor: '#0f3460', borderRadius: 12, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  selectedTile: { backgroundColor: '#4ecca3', transform: [{ scale: 0.95 }] },
  letterText: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  selectedText: { color: '#1a1a2e' },
  orderBadge: { position: 'absolute', top: 3, right: 3, backgroundColor: '#1a1a2e', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  orderText: { color: '#4ecca3', fontSize: 12, fontWeight: 'bold' },
  
  // Button styles
  buttonRow: { flexDirection: 'row', gap: 20, marginBottom: 30 },
  clearButton: { backgroundColor: '#e94560', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  submitButton: { backgroundColor: '#4ecca3', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  
  // Found Words styles
  foundWordsContainer: { flex: 1, width: '100%', paddingHorizontal: 20, minHeight: 150 },
  foundWordsTitle: { fontSize: 16, color: '#888', marginBottom: 10 },
  foundWordsScroll: { flex: 1, minHeight: 80 },
  foundWordsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 10 },
  foundWordBadge: { backgroundColor: '#16213e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  foundWordText: { color: '#4ecca3', fontSize: 14, fontWeight: '600' },
  
  // Refresh Button
  refreshButton: { backgroundColor: '#16213e', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25, marginTop: 15, marginBottom: 30 },
  refreshButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  
  // Stats Grid
  statsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    width: '100%', 
    paddingHorizontal: 10,
    marginTop: 20,
  },
});
