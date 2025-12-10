import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e', // Match app theme
    alignItems: 'center',
    paddingTop: 20,
  },

  // Grid container
  gridContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },

  // Grid row (for tile alignment)
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4, // Consistent spacing between tiles
  },

  // Letter tile styles
  tile: {
    width: ((width - 80) - 16) / 5, // 5 tiles, 4 gaps of 4px each = 16px total gap
    height: ((width - 80) - 16) / 5,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3a3a5c',
  },

  // Tile states
  tileDefault: {
    backgroundColor: 'transparent',
  },

  tileCorrect: {
    backgroundColor: '#6aaa64', // Muted green
    borderColor: '#6aaa64',
  },

  tilePresent: {
    backgroundColor: '#c9b458', // Muted yellow
    borderColor: '#c9b458',
  },

  tileAbsent: {
    backgroundColor: '#787c7e', // Muted gray
    borderColor: '#787c7e',
  },

  // Typography
  tileText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
  },

  tileTextDefault: {
    color: '#ffffff',
  },

  tileTextRevealed: {
    color: '#ffffff',
  },

  // Message styles
  messageContainer: {
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },

  messageText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
  },

  messageError: {
    color: '#e94560',
  },

  messageSuccess: {
    color: '#4ecca3',
  },

  // Keyboard styles
  keyboardContainer: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },

  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },

  key: {
    height: 48,
    minWidth: 32,
    marginHorizontal: 2,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a5c',
    backgroundColor: '#16213e',
  },

  keyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
  },

  // Key states
  keyDefault: {
    backgroundColor: '#16213e',
    borderColor: '#3a3a5c',
  },

  keyCorrect: {
    backgroundColor: '#6aaa64',
    borderColor: '#6aaa64',
  },

  keyPresent: {
    backgroundColor: '#c9b458',
    borderColor: '#c9b458',
  },

  keyAbsent: {
    backgroundColor: '#787c7e',
    borderColor: '#787c7e',
  },

  // Special keys
  enterKey: {
    minWidth: 60,
  },

  backspaceKey: {
    minWidth: 50,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4ecca3',
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },

  modalText: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 20,
  },

  modalButton: {
    backgroundColor: '#4ecca3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },

  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
});
