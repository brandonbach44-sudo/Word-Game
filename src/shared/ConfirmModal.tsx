// src/shared/ConfirmModal.tsx
// Themed confirmation dialog, shared by every game's "Leave Daily?" prompt
// (and any other yes/no confirmation) so it matches each game's own
// card/border/text colors instead of falling back to the OS-native
// Alert.alert box, which reads as jarring/out-of-theme against the rest of
// the app's custom UI.
import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  cancelText?: string;
  confirmText?: string;
  onCancel: () => void;
  onConfirm: () => void;
  backgroundColor: string;
  textColor: string;
  secondaryText: string;
  borderColor: string;
  destructiveColor?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  cancelText = 'Keep Playing',
  confirmText = 'Leave',
  onCancel,
  onConfirm,
  backgroundColor,
  textColor,
  secondaryText,
  borderColor,
  destructiveColor = '#e94560',
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={[styles.card, { backgroundColor, borderColor }]}>
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          <Text style={[styles.message, { color: secondaryText }]}>{message}</Text>

          <View style={styles.buttonRow}>
            <Pressable style={[styles.button, styles.cancelButton, { borderColor }]} onPress={onCancel}>
              <Text style={[styles.cancelText, { color: textColor }]}>{cancelText}</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.confirmButton, { borderColor: destructiveColor }]} onPress={onConfirm}>
              <Text style={[styles.confirmText, { color: destructiveColor }]}>{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: Math.min(width - 48, 360),
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 20 },
  buttonRow: { flexDirection: 'row', gap: 10 },
  button: { flex: 1, borderRadius: 12, borderWidth: 1.5, paddingVertical: 12, alignItems: 'center' },
  cancelButton: {},
  cancelText: { fontSize: 15, fontWeight: '700' },
  confirmButton: { backgroundColor: 'rgba(233, 69, 96, 0.08)' },
  confirmText: { fontSize: 15, fontWeight: '700' },
});

export default ConfirmModal;
